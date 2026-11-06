import io
import base64
import numpy as np
from PIL import Image

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

class ClassicalCVEnhancer:
    """
    Automatic, conservative classical computer vision enhancement pipeline:
    - Aspect-preserving Lanczos geometry adaptation
    - Grayworld automatic white-balance & normalization
    - CLAHE contrast balancing in LAB color space
    - Bilateral edge-preserving noise reduction
    - Subtle unsharp masking
    - Quality metrics assessment (Laplacian variance, brightness, contrast, clipping)
    """

    def __init__(self):
        self.clahe_clip_limit = 1.8
        self.clahe_grid_size = (8, 8)
        self.bilateral_d = 5
        self.bilateral_sigma_color = 25
        self.bilateral_sigma_space = 25

    def enhance(self, image: Image.Image, aspect_ratio: str = "1:1") -> tuple[Image.Image, dict]:
        """Runs full automated CV enhancement pipeline on PIL image."""
        # 1. Target resolution calculation based on aspect ratio
        target_dimensions = {
            "1:1": (512, 512),
            "3:4": (480, 640),
            "4:3": (640, 480),
            "16:9": (704, 396),
        }
        target_w, target_h = target_dimensions.get(aspect_ratio, (512, 512))

        # 2. Geometry-preserving crop and Lanczos resize
        adapted_pil = self._resize_aspect_preserved(image, target_w, target_h)

        if not CV2_AVAILABLE:
            # Fallback if cv2 not installed
            return adapted_pil, {"cv2_available": False}

        # Convert PIL (RGB) to OpenCV format (BGR)
        rgb_np = np.array(adapted_pil)
        bgr = cv2.cvtColor(rgb_np, cv2.COLOR_RGB2BGR)

        # 3. Quality Assessment Pre-Enhancement
        metrics_pre = self._assess_quality(bgr)

        # 4. Color Correction: Automatic White Balance (Gray World algorithm)
        balanced_bgr = self._apply_gray_world_white_balance(bgr)

        # 5. Contrast Enhancement: CLAHE on Luminance (L* channel in LAB color space)
        # Prevents hue distortion while gently improving local dynamic range
        lab = cv2.cvtColor(balanced_bgr, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=self.clahe_clip_limit, tileGridSize=self.clahe_grid_size)
        l_clahe = clahe.apply(l)
        enhanced_lab = cv2.merge((l_clahe, a, b))
        contrast_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

        # 6. Edge-Aware Smoothing: Bilateral Filter (preserves high-frequency edges while reducing diffusion noise)
        smoothed_bgr = cv2.bilateralFilter(
            contrast_bgr,
            d=self.bilateral_d,
            sigmaColor=self.bilateral_sigma_color,
            sigmaSpace=self.bilateral_sigma_space
        )

        # 7. Controlled Sharpening: Conservative Unsharp Masking
        # Only applied if the image is detected as slightly soft (Laplacian variance < 400)
        final_bgr = smoothed_bgr
        if metrics_pre["blur_laplacian_variance"] < 400:
            gaussian = cv2.GaussianBlur(smoothed_bgr, (0, 0), sigmaX=2.0)
            final_bgr = cv2.addWeighted(smoothed_bgr, 1.25, gaussian, -0.25, 0)

        # 8. Final clipping prevention
        final_bgr = np.clip(final_bgr, 0, 255).astype(np.uint8)

        # 9. Quality Assessment Post-Enhancement
        final_metrics = self._assess_quality(final_bgr)

        # Convert back to PIL RGB
        final_rgb = cv2.cvtColor(final_bgr, cv2.COLOR_BGR2RGB)
        result_pil = Image.fromarray(final_rgb)

        return result_pil, final_metrics

    def _resize_aspect_preserved(self, img: Image.Image, target_w: int, target_h: int) -> Image.Image:
        """Center crops input image to match target aspect ratio and resizes using high-quality Lanczos."""
        orig_w, orig_h = img.size
        target_ratio = target_w / target_h
        orig_ratio = orig_w / orig_h

        if orig_ratio > target_ratio:
            # Input is wider than target: crop width
            new_w = int(orig_h * target_ratio)
            left = (orig_w - new_w) // 2
            top = 0
            right = left + new_w
            bottom = orig_h
        else:
            # Input is taller than target: crop height
            new_h = int(orig_w / target_ratio)
            left = 0
            top = (orig_h - new_h) // 2
            right = orig_w
            bottom = top + new_h

        cropped = img.crop((left, top, right, bottom))
        return cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

    def _apply_gray_world_white_balance(self, bgr: np.ndarray) -> np.ndarray:
        """Applies gentle gray-world white balance to avoid artificial color casts."""
        b, g, r = cv2.split(bgr.astype(np.float32))
        avg_b = np.mean(b)
        avg_g = np.mean(g)
        avg_r = np.mean(r)
        avg_gray = (avg_b + avg_g + avg_r) / 3.0

        if avg_b > 0 and avg_g > 0 and avg_r > 0:
            kb = avg_gray / avg_b
            kg = avg_gray / avg_g
            kr = avg_gray / avg_r

            # Dampen scaling to be conservative (50% blend with original)
            kb = 0.5 + 0.5 * kb
            kg = 0.5 + 0.5 * kg
            kr = 0.5 + 0.5 * kr

            b = np.clip(b * kb, 0, 255)
            g = np.clip(g * kg, 0, 255)
            r = np.clip(r * kr, 0, 255)

        balanced = cv2.merge((b, g, r)).astype(np.uint8)
        return balanced

    def _assess_quality(self, bgr: np.ndarray) -> dict:
        """Measures blur using Laplacian variance, brightness, contrast, and histogram clipping."""
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        mean_brightness = float(np.mean(gray))
        contrast_std = float(np.std(gray))

        # Color clipping (underflow 0 or overflow 255)
        clipped_pixels = np.sum((bgr <= 2) | (bgr >= 253))
        total_pixels = bgr.size
        clipping_pct = float((clipped_pixels / total_pixels) * 100.0)

        return {
            "blur_laplacian_variance": round(laplacian_var, 2),
            "is_blurry": laplacian_var < 100.0,
            "mean_brightness": round(mean_brightness, 2),
            "contrast_std": round(contrast_std, 2),
            "color_clipping_pct": round(clipping_pct, 2),
        }

    def to_data_url(self, image: Image.Image, format: str = "PNG") -> str:
        """Converts PIL image to base64 data URL for instant frontend display."""
        buffer = io.BytesIO()
        image.save(buffer, format=format)
        base64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
        mime = "image/png" if format.upper() == "PNG" else "image/jpeg"
        return f"data:{mime};base64,{base64_str}"
