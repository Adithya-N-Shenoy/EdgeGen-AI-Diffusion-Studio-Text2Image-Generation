"""
CLIP Text-Image Similarity Evaluation Script
Calculates cosine similarity between input prompts and generated visual embeddings
using OpenAI CLIP (ViT-B/32 or ViT-L/14).
"""

import sys
import os
from typing import List, Dict, Any

def evaluate_clip_score(prompts: List[str], image_paths: List[str]) -> Dict[str, Any]:
    """
    Computes mean CLIP score and per-sample text-image alignment.
    """
    try:
        import torch
        from PIL import Image
        from transformers import CLIPProcessor, CLIPModel

        print("🔍 Loading CLIP model (openai/clip-vit-base-patch32)...")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
        processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

        scores = []
        for prompt, img_path in zip(prompts, image_paths):
            if not os.path.exists(img_path):
                continue
            image = Image.open(img_path).convert("RGB")
            inputs = processor(text=[prompt], images=image, return_tensors="pt", padding=True).to(device)
            with torch.no_grad():
                outputs = model(**inputs)
                image_embeds = outputs.image_embeds / outputs.image_embeds.norm(dim=-1, keepdim=True)
                text_embeds = outputs.text_embeds / outputs.text_embeds.norm(dim=-1, keepdim=True)
                similarity = (text_embeds @ image_embeds.T).item()
                scores.append(similarity)

        mean_score = sum(scores) / len(scores) if scores else 0.0
        return {
            "num_evaluated": len(scores),
            "mean_clip_score": round(mean_score, 4),
            "min_score": round(min(scores), 4) if scores else 0,
            "max_score": round(max(scores), 4) if scores else 0
        }
    except ImportError:
        print("⚠️ transformers/torch not installed. Returning offline metric stub.")
        return {
            "error": "PyTorch / Transformers CLIP not installed in this environment.",
            "status": "requires_gpu_environment"
        }

if __name__ == "__main__":
    print("CLIP Text-Image Similarity Evaluation Suite initialized.")
