import {
  VideoProject,
  TimelineClip,
  Keyframe,
  VisualEffectType,
  ColorFilter,
} from "../types/editor";

export class CanvasRenderer {
  private mediaElements: Map<string, HTMLVideoElement | HTMLImageElement> = new Map();
  private noiseCanvas: HTMLCanvasElement | null = null;

  constructor() {
    this.initNoisePattern();
  }

  private initNoisePattern() {
    if (typeof document === "undefined") return;
    this.noiseCanvas = document.createElement("canvas");
    this.noiseCanvas.width = 128;
    this.noiseCanvas.height = 128;
    const ctx = this.noiseCanvas.getContext("2d");
    if (!ctx) return;
    const imgData = ctx.createImageData(128, 128);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const val = Math.random() * 255;
      imgData.data[i] = val;
      imgData.data[i + 1] = val;
      imgData.data[i + 2] = val;
      imgData.data[i + 3] = 35; // subtle noise
    }
    ctx.putImageData(imgData, 0, 0);
  }

  public registerMediaElement(id: string, el: HTMLVideoElement | HTMLImageElement) {
    this.mediaElements.set(id, el);
  }

  public unregisterMediaElement(id: string) {
    this.mediaElements.delete(id);
  }

  public getMediaElement(id: string): HTMLVideoElement | HTMLImageElement | undefined {
    return this.mediaElements.get(id);
  }

  /**
   * Interpolates keyframe properties at a given relative time inside a clip.
   */
  public interpolateKeyframes(
    clip: TimelineClip,
    relativeTime: number
  ): { x: number; y: number; scale: number; rotation: number; opacity: number } {
    const base = {
      x: clip.x || 0,
      y: clip.y || 0,
      scale: clip.scale ?? 1,
      rotation: clip.rotation || 0,
      opacity: clip.opacity ?? 1,
    };

    if (!clip.keyframes || clip.keyframes.length === 0) {
      return base;
    }

    const sorted = [...clip.keyframes].sort((a, b) => a.time - b.time);

    // Before first keyframe
    if (relativeTime <= sorted[0].time) {
      return { ...base, ...sorted[0].properties };
    }

    // After last keyframe
    if (relativeTime >= sorted[sorted.length - 1].time) {
      return { ...base, ...sorted[sorted.length - 1].properties };
    }

    // Find surrounding keyframes
    for (let i = 0; i < sorted.length - 1; i++) {
      const k1 = sorted[i];
      const k2 = sorted[i + 1];
      if (relativeTime >= k1.time && relativeTime <= k2.time) {
        const span = k2.time - k1.time;
        const progress = span > 0 ? (relativeTime - k1.time) / span : 0;
        // Linear ease
        const lerp = (a = 0, b = 0) => a + (b - a) * progress;

        return {
          x: lerp(k1.properties.x ?? base.x, k2.properties.x ?? base.x),
          y: lerp(k1.properties.y ?? base.y, k2.properties.y ?? base.y),
          scale: lerp(k1.properties.scale ?? base.scale, k2.properties.scale ?? base.scale),
          rotation: lerp(k1.properties.rotation ?? base.rotation, k2.properties.rotation ?? base.rotation),
          opacity: lerp(k1.properties.opacity ?? base.opacity, k2.properties.opacity ?? base.opacity),
        };
      }
    }

    return base;
  }

  /**
   * Generates CSS filter string for standard color grading properties.
   */
  public generateFilterString(filter: ColorFilter): string {
    const parts: string[] = [];
    if (filter.brightness !== 1) parts.push(`brightness(${filter.brightness})`);
    if (filter.contrast !== 1) parts.push(`contrast(${filter.contrast})`);
    if (filter.saturation !== 1) parts.push(`saturate(${filter.saturation})`);
    if (filter.sepia > 0) parts.push(`sepia(${filter.sepia})`);
    if (filter.grayscale > 0) parts.push(`grayscale(${filter.grayscale})`);
    if (filter.hueRotate !== 0) parts.push(`hue-rotate(${filter.hueRotate}deg)`);
    if (filter.blur > 0) parts.push(`blur(${filter.blur}px)`);
    return parts.length > 0 ? parts.join(" ") : "none";
  }

  /**
   * Primary frame renderer that paints all active visual tracks to canvas at timestamp `currentTime`.
   */
  public renderFrame(
    ctx: CanvasRenderingContext2D,
    project: VideoProject,
    currentTime: number,
    targetWidth?: number,
    targetHeight?: number
  ) {
    const width = targetWidth || ctx.canvas.width;
    const height = targetHeight || ctx.canvas.height;

    // 1. Clear background
    ctx.save();
    ctx.fillStyle = project.settings.backgroundColor || "#000000";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // Collect all active clips across tracks
    const activeClips: { clip: TimelineClip; trackIndex: number }[] = [];

    project.tracks.forEach((track, trackIndex) => {
      if (track.isHidden) return;
      track.clips.forEach((clip) => {
        if (currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration) {
          activeClips.push({ clip, trackIndex });
        }
      });
    });

    // Sort clips by track order / zIndex
    activeClips.sort((a, b) => {
      if (a.clip.zIndex !== b.clip.zIndex) return a.clip.zIndex - b.clip.zIndex;
      return a.trackIndex - b.trackIndex;
    });

    // 2. Render each active visual clip
    activeClips.forEach(({ clip }) => {
      const relTime = currentTime - clip.startTime;
      const transform = this.interpolateKeyframes(clip, relTime);

      ctx.save();

      // Apply transition opacity / clipping if present
      let transitionOpacity = 1;
      let transitionOffsetX = 0;
      let transitionOffsetY = 0;

      if (clip.transitionIn && relTime < clip.transitionIn.duration) {
        const prog = relTime / clip.transitionIn.duration;
        switch (clip.transitionIn.type) {
          case "fade":
          case "crossDissolve":
            transitionOpacity = prog;
            break;
          case "wipeLeft":
            transitionOffsetX = (1 - prog) * width;
            break;
          case "wipeRight":
            transitionOffsetX = -(1 - prog) * width;
            break;
          case "slideUp":
            transitionOffsetY = (1 - prog) * height;
            break;
          case "zoomIn":
            transform.scale *= 0.5 + 0.5 * prog;
            transitionOpacity = prog;
            break;
          case "flash":
            if (prog < 0.5) {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, width, height);
            }
            break;
        }
      }

      ctx.globalAlpha = Math.max(0, Math.min(1, transform.opacity * transitionOpacity));

      // Calculate Center Position
      const centerX = width / 2 + (transform.x / 100) * (width / 2) + transitionOffsetX;
      const centerY = height / 2 + (transform.y / 100) * (height / 2) + transitionOffsetY;

      ctx.translate(centerX, centerY);
      ctx.rotate((transform.rotation * Math.PI) / 180);
      ctx.scale(
        transform.scale * (clip.flipHorizontal ? -1 : 1),
        transform.scale * (clip.flipVertical ? -1 : 1)
      );

      // Apply color filter
      const filterStr = this.generateFilterString(clip.colorFilter);
      ctx.filter = filterStr;

      // Handle clip types
      switch (clip.type) {
        case "video":
        case "image":
          this.renderMediaClip(ctx, clip, width, height);
          break;

        case "text":
          this.renderTextClip(ctx, clip, width, height, relTime);
          break;

        case "sticker":
          this.renderStickerClip(ctx, clip, width, height, relTime);
          break;

        case "subtitle":
          this.renderSubtitleClip(ctx, clip, width, height);
          break;
      }

      // Apply Post-FX Shaders / Visual Overlays
      if (clip.visualEffect && clip.visualEffect !== "none") {
        this.applyVisualEffect(ctx, clip.visualEffect, clip.effectIntensity || 1, width, height);
      }

      ctx.restore();
    });

    // 3. Render active Subtitles / Captions from project subtitles list
    this.renderActiveProjectSubtitles(ctx, project, currentTime, width, height);
  }

  private renderMediaClip(
    ctx: CanvasRenderingContext2D,
    clip: TimelineClip,
    canvasW: number,
    canvasH: number
  ) {
    const el = this.mediaElements.get(clip.id);
    if (!el) return;

    // Determine intrinsic media aspect ratio
    let elW = 1920;
    let elH = 1080;
    if (el instanceof HTMLVideoElement) {
      elW = el.videoWidth || 1920;
      elH = el.videoHeight || 1080;
    } else if (el instanceof HTMLImageElement) {
      elW = el.naturalWidth || 1920;
      elH = el.naturalHeight || 1080;
    }

    // Fit within canvas keeping aspect ratio
    const scaleFactor = Math.min(canvasW / elW, canvasH / elH);
    const drawW = elW * scaleFactor;
    const drawH = elH * scaleFactor;

    ctx.drawImage(el, -drawW / 2, -drawH / 2, drawW, drawH);
  }

  private renderTextClip(
    ctx: CanvasRenderingContext2D,
    clip: TimelineClip,
    _canvasW: number,
    _canvasH: number,
    relTime: number
  ) {
    const props = clip.textProps;
    if (!props || !props.text) return;

    let displayText = props.text;

    // Typewriter animation
    if (props.animation === "typewriter") {
      const charCount = Math.min(
        displayText.length,
        Math.floor(relTime * 15) // 15 chars per sec
      );
      displayText = displayText.slice(0, charCount);
    }

    const fontSize = props.fontSize || 32;
    ctx.font = `${props.fontWeight || "bold"} ${fontSize}px ${props.fontFamily || "sans-serif"}`;
    ctx.textAlign = props.textAlign || "center";
    ctx.textBaseline = "middle";

    const metrics = ctx.measureText(displayText);
    const paddingX = 16;
    const paddingY = 8;
    const boxW = metrics.width + paddingX * 2;
    const boxH = fontSize * 1.4 + paddingY * 2;

    // Background pill/box if specified
    if (props.backgroundColor) {
      ctx.fillStyle = props.backgroundColor;
      ctx.beginPath();
      ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 8);
      ctx.fill();
    }

    // Border / Outline
    if (props.borderColor && props.borderWidth) {
      ctx.strokeStyle = props.borderColor;
      ctx.lineWidth = props.borderWidth;
      ctx.beginPath();
      ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 8);
      ctx.stroke();
    }

    // Shadow
    if (props.shadowColor) {
      ctx.shadowColor = props.shadowColor;
      ctx.shadowBlur = props.shadowBlur || 10;
    }

    // Text Fill
    ctx.fillStyle = props.color || "#ffffff";
    ctx.fillText(displayText, 0, 0);

    ctx.shadowBlur = 0;
  }

  private renderStickerClip(
    ctx: CanvasRenderingContext2D,
    clip: TimelineClip,
    _canvasW: number,
    _canvasH: number,
    _relTime: number
  ) {
    if (clip.stickerEmoji) {
      ctx.font = "64px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(clip.stickerEmoji, 0, 0);
    } else if (clip.name) {
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(clip.name, 0, 0);
    }
  }

  private renderSubtitleClip(
    ctx: CanvasRenderingContext2D,
    clip: TimelineClip,
    _canvasW: number,
    canvasH: number
  ) {
    const text = clip.captionText || clip.name;
    if (!text) return;

    ctx.font = "bold 24px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const metrics = ctx.measureText(text);
    const boxW = metrics.width + 32;
    const boxH = 44;

    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.beginPath();
    ctx.roundRect(-boxW / 2, canvasH * 0.35, boxW, boxH, 10);
    ctx.fill();

    ctx.fillStyle = "#facc15";
    ctx.fillText(text, 0, canvasH * 0.35 + boxH / 2);
  }

  private renderActiveProjectSubtitles(
    ctx: CanvasRenderingContext2D,
    project: VideoProject,
    currentTime: number,
    width: number,
    height: number
  ) {
    if (!project.subtitles || project.subtitles.length === 0) return;

    const activeSub = project.subtitles.find(
      (s) => currentTime >= s.startTime && currentTime <= s.endTime
    );

    if (!activeSub) return;

    ctx.save();
    const fontSize = Math.max(18, Math.min(32, Math.floor(width * 0.035)));
    ctx.font = `800 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const text = activeSub.text;
    const metrics = ctx.measureText(text);
    const paddingX = 20;
    const paddingY = 10;
    const boxW = metrics.width + paddingX * 2;
    const boxH = fontSize * 1.5 + paddingY * 2;
    const posY = height * 0.82;

    // High contrast black pill with glowing yellow / cyan text
    ctx.fillStyle = "rgba(10, 15, 29, 0.88)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(width / 2 - boxW / 2, posY - boxH / 2, boxW, boxH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, width / 2, posY);

    ctx.restore();
  }

  private applyVisualEffect(
    ctx: CanvasRenderingContext2D,
    effect: VisualEffectType,
    intensity: number,
    width: number,
    height: number
  ) {
    switch (effect) {
      case "vhs":
        // VHS scanlines
        ctx.fillStyle = "rgba(0, 255, 200, 0.05)";
        for (let y = -height / 2; y < height / 2; y += 4) {
          ctx.fillRect(-width / 2, y, width, 1.5);
        }
        break;

      case "glitch":
        // Random glitch slices
        ctx.fillStyle = `rgba(255, 0, 100, ${0.15 * intensity})`;
        const sliceY = (Math.random() - 0.5) * height;
        ctx.fillRect(-width / 2, sliceY, width, 15 * intensity);
        break;

      case "filmGrain":
        if (this.noiseCanvas) {
          const pattern = ctx.createPattern(this.noiseCanvas, "repeat");
          if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fillRect(-width / 2, -height / 2, width, height);
          }
        }
        break;

      case "glow":
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 20 * intensity;
        break;

      case "cinematicWarm":
        ctx.fillStyle = `rgba(251, 146, 60, ${0.12 * intensity})`;
        ctx.fillRect(-width / 2, -height / 2, width, height);
        break;

      case "cinematicCool":
        ctx.fillStyle = `rgba(56, 189, 248, ${0.12 * intensity})`;
        ctx.fillRect(-width / 2, -height / 2, width, height);
        break;

      case "neonAura":
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 * intensity})`;
        ctx.lineWidth = 8;
        ctx.strokeRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8);
        break;
    }
  }
}

export const globalCanvasRenderer = new CanvasRenderer();
