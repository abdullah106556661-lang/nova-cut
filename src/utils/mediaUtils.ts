/**
 * Media processing utilities for video thumbnail generation,
 * metadata extraction, audio waveform extraction, and CapCut-style clip formatting.
 */

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:5" | "21:9";
  thumbnailUrl: string;
  sizeFormatted: string;
}

/**
 * Extracts metadata and a high-resolution snapshot thumbnail from an uploaded video file, Blob, or URL.
 */
export async function extractVideoMetadataAndThumbnail(fileOrUrl: File | Blob | string): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    const isStringUrl = typeof fileOrUrl === "string";
    const url = isStringUrl ? fileOrUrl : URL.createObjectURL(fileOrUrl);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.src = url;

    const sizeFormatted =
      fileOrUrl instanceof File
        ? `${(fileOrUrl.size / (1024 * 1024)).toFixed(1)} MB`
        : isStringUrl
        ? "Online Video"
        : "Video File";

    let resolved = false;

    const finishWithFallback = () => {
      if (resolved) return;
      resolved = true;
      resolve({
        duration: 10,
        width: 1920,
        height: 1080,
        aspectRatio: "16:9",
        thumbnailUrl: createDefaultVideoThumbnailPlaceholder("Video Footage"),
        sizeFormatted,
      });
    };

    const timeout = setTimeout(finishWithFallback, 4500);

    const captureThumbnail = () => {
      if (resolved) return;
      try {
        const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 10;
        const width = video.videoWidth || 1920;
        const height = video.videoHeight || 1080;

        const ratioVal = width / height;
        let aspectRatio: "16:9" | "9:16" | "1:1" | "4:5" | "21:9" = "16:9";
        if (ratioVal < 0.65) {
          aspectRatio = "9:16";
        } else if (ratioVal >= 0.65 && ratioVal <= 0.85) {
          aspectRatio = "4:5";
        } else if (ratioVal > 0.85 && ratioVal <= 1.15) {
          aspectRatio = "1:1";
        } else if (ratioVal > 2.1) {
          aspectRatio = "21:9";
        } else {
          aspectRatio = "16:9";
        }

        const canvas = document.createElement("canvas");
        const w = Math.min(width, 960);
        const h = Math.round((w / width) * height);
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.85);
          resolved = true;
          clearTimeout(timeout);
          resolve({
            duration,
            width,
            height,
            aspectRatio,
            thumbnailUrl,
            sizeFormatted,
          });
          return;
        }
      } catch (err) {
        console.warn("Canvas capture error, using fallback placeholder:", err);
      }

      finishWithFallback();
    };

    video.onloadedmetadata = () => {
      const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 10;
      const seekTime = Math.min(1.0, Math.max(0.1, dur * 0.08));
      try {
        video.currentTime = seekTime;
      } catch {
        captureThumbnail();
      }
    };

    video.onseeked = () => {
      captureThumbnail();
    };

    video.oncanplay = () => {
      if (!resolved && video.currentTime > 0) {
        captureThumbnail();
      }
    };

    video.onerror = () => {
      clearTimeout(timeout);
      finishWithFallback();
    };
  });
}

/**
 * Generates an SVG/Canvas placeholder thumbnail if image capture is unavailable.
 */
export function createDefaultVideoThumbnailPlaceholder(title: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 640, 360);
  grad.addColorStop(0, "#0b0f19");
  grad.addColorStop(0.5, "#1e1b4b");
  grad.addColorStop(1, "#0284c7");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 640, 360);

  // Play icon circle
  ctx.fillStyle = "rgba(14, 165, 233, 0.3)";
  ctx.beginPath();
  ctx.arc(320, 160, 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(310, 140);
  ctx.lineTo(340, 160);
  ctx.lineTo(310, 180);
  ctx.closePath();
  ctx.fill();

  // Text title
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(title, 320, 240);

  return canvas.toDataURL("image/jpeg", 0.85);
}
