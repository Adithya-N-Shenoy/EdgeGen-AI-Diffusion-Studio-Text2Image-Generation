"""
Latency and Peak VRAM / Memory Benchmarking Tool
Profiles generation execution time and hardware resource utilization.
"""

import time
import os
import csv
from typing import Dict, Any, List

def benchmark_inference_run(engine, prompt: str, steps: int = 1, runs: int = 5) -> Dict[str, Any]:
    """Runs multiple warm-up and timed inference iterations to measure steady-state metrics."""
    import torch
    latencies = []

    # Warm-up run
    engine.generate(prompt=prompt)

    peak_vram_mb = 0
    if torch.cuda.is_available():
        torch.cuda.reset_peak_memory_stats(0)

    for i in range(runs):
        start = time.perf_counter()
        img, _ = engine.generate(prompt=prompt)
        elapsed = time.perf_counter() - start
        latencies.append(elapsed)

    if torch.cuda.is_available():
        peak_vram_mb = int(torch.cuda.max_memory_allocated(0) / (1024 * 1024))

    avg_latency = sum(latencies) / len(latencies)
    return {
        "steps": steps,
        "runs": runs,
        "avg_latency_sec": round(avg_latency, 3),
        "min_latency_sec": round(min(latencies), 3),
        "max_latency_sec": round(max(latencies), 3),
        "peak_vram_mb": peak_vram_mb,
    }

def save_benchmark_csv(results: List[Dict[str, Any]], filepath: str = "benchmark_results.csv"):
    if not results:
        return
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=results[0].keys())
        writer.writeheader()
        writer.writerows(results)
    print(f"✅ Benchmark results written to {filepath}")
