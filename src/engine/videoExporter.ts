import { VideoProject, ExportSettings } from "../types/editor";
import { CanvasRenderer } from "./canvasRenderer";

export interface ExportProgress {
  currentFrame: number;
  totalFrames: number;
  percentage: number;
  status: string;
}

export class VideoExporter {
  private isCancelled = false;

  public cancel() {
    this.isCancelled = true;
  }

  public async exportProject(
    project: VideoProject,
    settings: any,
    onProgress?: (progress: any) => void
  ): Promise<Blob> {
    this.isCancelled = false;

    // 1. Determine target canvas dimensions based on resolution and aspect ratio
    let width = 1920;
    let height = 1080;

    const isPortrait = project.settings.aspectRatio === "9:16";
    const isSquare = project.settings.aspectRatio === "1:1";
    const isInstagram = project.settings.aspectRatio === "4:5";

    if (settings.resolution === "720p") {
      if (isPortrait) {
        width = 720;
        height = 1280;
      } else if (isSquare) {
        width = 720;
        height = 720;
      } else if (isInstagram) {
        width = 720;
        height = 900;
      } else {
        width = 1280;
        height = 720;
      }
    } else if (settings.resolution === "1080p") {
      if (isPortrait) {
        width = 1080;
        height = 1920;
      } else if (isSquare) {
        width = 1080;
        height = 1080;
      } else if (isInstagram) {
        width = 1080;
        height = 1350;
      } else {
        width = 1920;
        height = 1080;
      }
    } else if (settings.resolution === "4k") {
      if (isPortrait) {
        width = 2160;
        height = 3840;
      } else if (isSquare) {
        width = 2160;
        height = 2160;
      } else {
        width = 3840;
        height = 2160;
      }
    }

    const fps = settings.fps || 30;
    const duration = project.settings.duration || 10;
    const totalFrames = Math.floor(duration * fps);

    // 2. Create offscreen canvas & renderer
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Could not initialize 2D rendering context.");

    const renderer = new CanvasRenderer();

    // 3. Preload all visual clips into renderer
    if (onProgress) {
      onProgress(0.05);
    }

    for (const track of project.tracks) {
      for (const clip of track.clips) {
        if (clip.mediaUrl && (clip.type === "video" || clip.type === "image")) {
          if (clip.type === "video") {
            const video = document.createElement("video");
            video.crossOrigin = "anonymous";
            video.src = clip.mediaUrl;
            video.muted = true;
            video.preload = "auto";
            renderer.registerMediaElement(clip.id, video);
          } else if (clip.type === "image") {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = clip.mediaUrl;
            renderer.registerMediaElement(clip.id, img);
          }
        }
      }
    }

    // 4. Setup MediaRecorder with canvas stream
    const stream = canvas.captureStream(fps);
    
    // Choose best supported MIME type
    let mimeType = "video/webm;codecs=vp9";
    if (settings.format === "mp4" && typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("video/mp4")) {
      mimeType = "video/mp4";
    } else if (typeof MediaRecorder !== "undefined" && !MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm";
    }

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: settings.bitrate || 6000000,
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    const exportPromise = new Promise<Blob>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(recordedChunks, { type: mimeType });
        resolve(finalBlob);
      };
      mediaRecorder.onerror = (e) => reject(e);
    });

    mediaRecorder.start();

    // 5. Sequential frame rendering loop
    const frameInterval = 1000 / fps;
    const timeStep = 1 / fps;

    for (let frame = 0; frame < totalFrames; frame++) {
      if (this.isCancelled) {
        mediaRecorder.stop();
        throw new Error("Export was cancelled by user.");
      }

      const currentTime = frame * timeStep;

      // Sync active videos' currentTime
      for (const track of project.tracks) {
        for (const clip of track.clips) {
          if (clip.type === "video") {
            const el = renderer.getMediaElement(clip.id);
            if (el instanceof HTMLVideoElement) {
              if (currentTime >= clip.startTime && currentTime <= clip.startTime + clip.duration) {
                const targetTime = clip.sourceStartTime + (currentTime - clip.startTime) * clip.speed;
                el.currentTime = targetTime;
              }
            }
          }
        }
      }

      // Render frame
      renderer.renderFrame(ctx, project, currentTime, width, height);

      const ratio = (frame + 1) / totalFrames;
      if (onProgress) {
        onProgress(ratio);
      }

      // Allow event loop to tick so browser doesn't freeze
      await new Promise((r) => setTimeout(r, Math.max(10, frameInterval / 3)));
    }

    if (onProgress) {
      onProgress(0.98);
    }

    // Complete recording
    mediaRecorder.stop();
    const finalBlob = await exportPromise;

    if (onProgress) {
      onProgress(1.0);
    }

    return finalBlob;
  }
}

export const globalVideoExporter = new VideoExporter();
