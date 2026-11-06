"""
Hugging Face Datasets Adapter
Official Source: https://huggingface.co/datasets

Supported dataset targets:
- 'poloclub/diffusiondb' (2M synthetic prompt-image pairs)
- 'google-research-datasets/conceptual_captions'
"""

import os
import re
from typing import List, Dict, Any

class HFDatasetAdapter:
    def __init__(self, dataset_name: str = "poloclub/diffusiondb", subset: str = "2k_random_sample"):
        self.dataset_name = dataset_name
        self.subset = subset

    def clean_text_prompt(self, text: str) -> str:
        """Removes duplicate commas, redundant tokens, and trims prompt string."""
        text = re.sub(r"\s+", " ", text)
        text = re.sub(r",\s*,+", ",", text)
        return text.strip().strip(",")

    def sample_eval_prompts(self, num_samples: int = 50) -> List[str]:
        """Returns clean benchmark prompts for offline evaluation."""
        sample_prompts = [
            "A serene Japanese rock garden covered in a light blanket of fresh snow, dawn light",
            "An intricate steampunk mechanical dragonfly with brass wings resting on a gear",
            "Portrait of an astronaut reflecting a spiral galaxy in their helmet visor, 8k",
            "A cozy library with tall oak bookshelves, spiral staircase, and sunbeams through stained glass",
            "A glass terrarium floating in the ocean with a tiny vibrant forest inside",
            "A majestic bald eagle in high-speed dive towards misty mountain lake, telephoto",
        ]
        return [self.clean_text_prompt(p) for p in sample_prompts]

if __name__ == "__main__":
    adapter = HFDatasetAdapter()
    samples = adapter.sample_eval_prompts(5)
    print(f"HF Dataset adapter ready with {len(samples)} benchmark prompts.")
