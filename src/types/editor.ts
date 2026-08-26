export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5" | "21:9" | "custom";

export interface ProjectSettings {
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  fps: number;
  backgroundColor: string;
  duration: number; // in seconds
}

export type ClipType = "video" | "image" | "audio" | "text" | "sticker" | "effect" | "subtitle";

export interface Keyframe {
  id: string;
  time: number; // relative to clip start in seconds
  properties: {
    x?: number;
    y?: number;
    scale?: number;
    rotation?: number;
    opacity?: number;
    volume?: number;
  };
}

export interface ColorFilter {
  brightness: number; // 0 to 2 (1 = normal)
  contrast: number; // 0 to 2 (1 = normal)
  saturation: number; // 0 to 2 (1 = normal)
  exposure: number; // -1 to 1 (0 = normal)
  temperature: number; // -100 to 100
  tint: number; // -100 to 100
  vignette: number; // 0 to 1
  sharpness: number; // 0 to 1
  sepia: number; // 0 to 1
  grayscale: number; // 0 to 1
  hueRotate: number; // 0 to 360 deg
  blur: number; // 0 to 20px
}

export type VisualEffectType =
  | "none"
  | "vhs"
  | "glitch"
  | "rgbSplit"
  | "filmGrain"
  | "glow"
  | "pixelate"
  | "cyberpunk"
  | "cinematicWarm"
  | "cinematicCool"
  | "neonAura"
  | "shake"
  | "radialBlur"
  | "mirror"
  | "invert"
  | "matrix";

export type TransitionType =
  | "none"
  | "fade"
  | "crossDissolve"
  | "wipeLeft"
  | "wipeRight"
  | "slideUp"
  | "slideDown"
  | "zoomIn"
  | "zoomOut"
  | "glitch"
  | "spin"
  | "flash";

export interface Transition {
  type: TransitionType;
  duration: number; // in seconds (e.g. 0.5)
}

export interface TextProperties {
  text: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  outlineColor?: string;
  outlineWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  animation?: "none" | "typewriter" | "pop" | "fade" | "slide" | "bounce" | "glitch";
  letterSpacing?: number;
  lineHeight?: number;
}

export interface TextPreset {
  id: string;
  name: string;
  text: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  backgroundColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  animation?: "none" | "typewriter" | "pop" | "fade" | "slide" | "bounce" | "glitch";
}

export interface ExportConfig {
  resolution: "720p" | "1080p" | "4k" | "original";
  fps: number;
  format: "webm" | "mp4";
  bitrate: number;
  includeWatermark?: boolean;
}

export interface AudioProperties {
  volume: number; // 0 to 2 (1 = 100%)
  muted: boolean;
  fadeIn: number; // in seconds
  fadeOut: number; // in seconds
  speed: number; // 0.25 to 4
  pitchShift?: number;
  voiceEnhance?: boolean;
}

export interface ChromaKeySettings {
  enabled: boolean;
  color: string; // hex (default #00ff00)
  tolerance: number; // 0 to 1
  smoothness: number; // 0 to 1
}

export interface TimelineClip {
  id: string;
  trackId: string;
  type: ClipType;
  name: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  startTime: number; // start time in overall project timeline (seconds)
  duration: number; // duration on timeline (seconds)
  sourceStartTime: number; // start trim inside original media source (seconds)
  sourceDuration: number; // total length of raw media source (seconds)
  
  // Transform properties
  x: number; // center offset X (-100 to 100% or px)
  y: number; // center offset Y
  scale: number; // 1 = 100%
  rotation: number; // in degrees
  opacity: number; // 0 to 1
  zIndex: number;
  
  // Flip
  flipHorizontal?: boolean;
  flipVertical?: boolean;

  // Effects & Color Grading
  colorFilter: ColorFilter;
  visualEffect: VisualEffectType;
  effectIntensity: number; // 0 to 1
  chromaKey?: ChromaKeySettings;

  // Transition into this clip
  transitionIn?: Transition;
  transitionOut?: Transition;

  // Specific content properties
  textProps?: TextProperties;
  audioProps?: AudioProperties;
  speed: number; // 0.25 to 4
  
  // Keyframes
  keyframes: Keyframe[];

  // Subtitle/Caption text (if subtitle type)
  captionText?: string;
  stickerEmoji?: string;
  stickerCategory?: string;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: "main" | "overlay" | "audio" | "text" | "subtitle" | "effect";
  isMuted: boolean;
  isLocked: boolean;
  isHidden: boolean;
  volume: number; // 0 to 1
  clips: TimelineClip[];
}

export interface SubtitleItem {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface VideoProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  settings: ProjectSettings;
  tracks: TimelineTrack[];
  subtitles: SubtitleItem[];
  markers: number[]; // timeline marker timestamps
}

export interface MediaAsset {
  id: string;
  name: string;
  type: "video" | "image" | "audio";
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  size?: string;
  aspectRatio?: string;
  category?: string;
  createdAt: string;
  isStock?: boolean;
}

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: "tiktok" | "reels" | "youtube" | "business" | "vlog" | "product" | "gaming" | "music" | "podcast";
  aspectRatio: AspectRatio;
  duration: number;
  thumbnailUrl: string;
  previewVideoUrl?: string;
  tags: string[];
  projectData: Partial<VideoProject>;
}

export interface ExportSettings {
  format: "webm" | "mp4";
  resolution: "720p" | "1080p" | "4k" | "original";
  fps: number;
  quality: "low" | "medium" | "high" | "ultra";
  fileName: string;
}

export interface StockSound {
  id: string;
  name: string;
  category: "music" | "sfx" | "ambient" | "transition";
  url: string;
  duration: number;
  tags: string[];
}
