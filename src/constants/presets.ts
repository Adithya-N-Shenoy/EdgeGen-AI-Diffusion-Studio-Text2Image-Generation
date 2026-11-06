import { AspectRatioOption, StyleOption } from '../types';

export const ASPECT_RATIOS: AspectRatioOption[] = [
  {
    id: '1:1',
    label: 'Square',
    width: 512,
    height: 512,
    ratioText: '1:1',
    iconRatio: 'aspect-square',
  },
  {
    id: '3:4',
    label: 'Portrait',
    width: 480,
    height: 640,
    ratioText: '3:4',
    iconRatio: 'aspect-[3/4]',
  },
  {
    id: '4:3',
    label: 'Landscape',
    width: 640,
    height: 480,
    ratioText: '4:3',
    iconRatio: 'aspect-[4/3]',
  },
  {
    id: '16:9',
    label: 'Widescreen',
    width: 704,
    height: 396,
    ratioText: '16:9',
    iconRatio: 'aspect-video',
  },
];

export const IMAGE_STYLES: StyleOption[] = [
  {
    id: 'auto',
    label: 'Auto',
    description: 'Natural AI output adhering faithfully to your prompt description',
    promptEnhancement: '',
  },
  {
    id: 'photorealistic',
    label: 'Photorealistic',
    description: 'Crisp 35mm photography, natural daylight, hyper-detailed textures, 8k resolution',
    promptEnhancement: ', photorealistic photograph, 35mm lens, natural lighting, sharp focus, high fidelity, 8k',
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    description: 'Dramatic lighting, anamorphic lens flare, atmospheric color grading, movie still',
    promptEnhancement: ', cinematic film still, dramatic volumetric lighting, 70mm Panavision, cinematic composition, depth of field',
  },
  {
    id: 'anime',
    label: 'Anime',
    description: 'Vibrant modern Japanese animation aesthetic, clean line art, expressive colors',
    promptEnhancement: ', anime art style, vibrant aesthetic, crisp outlines, Makoto Shinkai aesthetic, high detail illustration',
  },
  {
    id: 'digital_art',
    label: 'Digital Art',
    description: 'Rich concept art, painterly digital brushwork, dynamic rendering',
    promptEnhancement: ', detailed digital art, trending on ArtStation, concept art, rich vivid colors, smooth brushwork',
  },
  {
    id: 'illustration',
    label: 'Illustration',
    description: 'Clean vector-inspired or editorial book illustration with balanced palette',
    promptEnhancement: ', refined editorial illustration, clean shapes, harmonious color palette, artistic composition',
  },
];

export const SAMPLE_PROMPTS: string[] = [
  "A majestic snow leopard perched on a Himalayan granite cliff at dawn, soft golden light, ultra-detailed fur",
  "Futuristic eco-city with bioluminescent vertical gardens, floating solar transport pods, sunset sky",
  "Vintage mechanical pocket watch with transparent glass revealing glowing amethyst gears, macro photography",
  "Cozy Scandinavian wooden cabin beside a reflective fjord under dancing green aurora borealis",
  "Sleek obsidian sports car carving through an empty rain-slicked Tokyo highway at midnight, neon reflections",
  "Studio portrait of an elder ceramic artisan shaping clay on a potter's wheel, warm dramatic spotlight",
];

export const PRESENTATION_LOADING_MESSAGES: string[] = [
  "Bringing your imagination to life...",
  "Encoding semantic concepts...",
  "Synthesizing latent diffusion paths...",
  "Iterating few-step denoising...",
  "Applying bilateral edge-aware refinement...",
  "Adding the finishing touches...",
];
