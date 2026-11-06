export type AspectRatio = '1:1' | '3:4' | '4:3' | '16:9';

export type ImageStyle = 
  | 'auto' 
  | 'photorealistic' 
  | 'cinematic' 
  | 'anime' 
  | 'digital_art' 
  | 'illustration';

export interface AspectRatioOption {
  id: AspectRatio;
  label: string;
  width: number;
  height: number;
  ratioText: string;
  iconRatio: string;
}

export interface StyleOption {
  id: ImageStyle;
  label: string;
  description: string;
  promptEnhancement: string;
}

export interface GenerationRequest {
  prompt: string;
  aspect_ratio: AspectRatio;
  style: ImageStyle;
  negative_prompt?: string;
  seed?: number;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QualityMetrics {
  blur_laplacian_variance: number;
  is_blurry: boolean;
  mean_brightness: number;
  contrast_std: number;
  color_clipping_pct: number;
}

export interface GenerationJob {
  job_id: string;
  status: JobStatus;
  progress: number;
  message: string;
  prompt: string;
  enhanced_prompt?: string;
  aspect_ratio: AspectRatio;
  style: ImageStyle;
  image_url?: string;
  width?: number;
  height?: number;
  created_at: string;
  completed_at?: string;
  latency_sec?: number;
  cv_applied?: boolean;
  cv_metrics?: QualityMetrics;
  error?: string;
}

export interface BackendStatus {
  online: boolean;
  engine: string;
  model: string;
  device: 'cuda' | 'mps' | 'cpu' | 'unknown';
  precision: 'fp16' | 'fp32' | 'bf16';
  vram_allocated_mb: number;
  memory_saving_enabled: boolean;
  cv_pipeline_ready: boolean;
  active_jobs: number;
  queue_length: number;
  api_version: string;
  hardware_summary?: string;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  style: ImageStyle;
  aspect_ratio: AspectRatio;
  imageUrl: string;
  timestamp: number;
  width: number;
  height: number;
  latencySec?: number;
}
