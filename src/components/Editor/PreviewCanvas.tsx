import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  SkipBack,
  SkipForward,
  Grid,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEditor } from "../../context/EditorContext";
import { globalCanvasRenderer } from "../../engine/canvasRenderer";
import { AspectRatio } from "../../types/editor";

export const PreviewCanvas: React.FC = () => {
  const {
    project,
    setProject,
    currentTime,
    setCurrentTime,
    isPlaying,
    togglePlayPause,
    selectedClip,
    updateClip,
    showSafeZone,
    setShowSafeZone,
  } = useEditor();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(1); // 1 = fit
  const [isDraggingClip, setIsDraggingClip] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Aspect ratio ratios
  const getAspectRatioDimensions = (ratio: AspectRatio) => {
    switch (ratio) {
      case "9:16":
        return { width: 1080, height: 1920, cssRatio: "9/16" };
      case "1:1":
        return { width: 1080, height: 1080, cssRatio: "1/1" };
      case "4:5":
        return { width: 1080, height: 1350, cssRatio: "4/5" };
      case "21:9":
        return { width: 2560, height: 1080, cssRatio: "21/9" };
      case "16:9":
      default:
        return { width: 1920, height: 1080, cssRatio: "16/9" };
    }
  };

  const currentDims = getAspectRatioDimensions(project.settings.aspectRatio);

  // Sync canvas media elements with project clips
  useEffect(() => {
    project.tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        if (!clip.mediaUrl) return;

        if (clip.type === "video") {
          let videoEl = globalCanvasRenderer.getMediaElement(clip.id) as HTMLVideoElement;
          if (!videoEl) {
            videoEl = document.createElement("video");
            videoEl.muted = true;
            videoEl.preload = "auto";
            videoEl.playsInline = true;
            videoEl.src = clip.mediaUrl;
            
            // Graceful error fallback
            videoEl.onerror = () => {
              console.warn(`[PreviewCanvas Video Load Notice]: Fallback for clip ${clip.id}`);
              videoEl.removeAttribute("crossorigin");
            };
            globalCanvasRenderer.registerMediaElement(clip.id, videoEl);
          }

          const isActive =
            currentTime >= clip.startTime && currentTime <= clip.startTime + clip.duration;

          if (isActive) {
            const relTime = currentTime - clip.startTime;
            const targetTime = clip.sourceStartTime + relTime * (clip.speed || 1);

            if (Math.abs(videoEl.currentTime - targetTime) > 0.3) {
              videoEl.currentTime = targetTime;
            }

            videoEl.playbackRate = Math.max(0.1, Math.min(4, clip.speed || 1));

            if (isPlaying) {
              if (videoEl.paused) {
                videoEl.play().catch(() => {});
              }
            } else {
              if (!videoEl.paused) {
                videoEl.pause();
              }
            }
          } else {
            if (!videoEl.paused) {
              videoEl.pause();
            }
          }
        } else if (clip.type === "image") {
          let imgEl = globalCanvasRenderer.getMediaElement(clip.id) as HTMLImageElement;
          if (!imgEl) {
            imgEl = new Image();
            imgEl.crossOrigin = "anonymous";
            imgEl.src = clip.mediaUrl;
            globalCanvasRenderer.registerMediaElement(clip.id, imgEl);
          }
        }
      });
    });
  }, [project.tracks, currentTime, isPlaying]);

  // High-performance render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set internal resolution
    canvas.width = currentDims.width;
    canvas.height = currentDims.height;

    let animId: number;

    const render = () => {
      globalCanvasRenderer.renderFrame(ctx, project, currentTime, canvas.width, canvas.height);
      if (isPlaying) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [currentTime, isPlaying, project, currentDims.width, currentDims.height]);

  // Step 1 frame backward / forward (1/30th sec)
  const stepFrame = (frames: number) => {
    const delta = frames * (1 / (project.settings.fps || 30));
    setCurrentTime((prev) => Math.max(0, Math.min(project.settings.duration, prev + delta)));
  };

  // Format timecode (00:04.2 / 00:14.5)
  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  // Handle canvas direct drag-to-reposition
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!selectedClip) return;
    setIsDraggingClip(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingClip || !selectedClip || !dragStartPos || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStartPos.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStartPos.y) / rect.height) * 100;

    updateClip(selectedClip.id, {
      x: (selectedClip.x || 0) + deltaX,
      y: (selectedClip.y || 0) + deltaY,
    });

    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    setIsDraggingClip(false);
    setDragStartPos(null);
  };

  const handleAspectRatioChange = (ratio: AspectRatio) => {
    const dims = getAspectRatioDimensions(ratio);
    setProject((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        aspectRatio: ratio,
        width: dims.width,
        height: dims.height,
      },
    }));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800/80 select-none">
      {/* Top Canvas Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm text-xs">
        {/* Aspect Ratio Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          {(["16:9", "9:16", "1:1", "4:5"] as AspectRatio[]).map((ratio) => (
            <button
              key={ratio}
              onClick={() => handleAspectRatioChange(ratio)}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                project.settings.aspectRatio === ratio
                  ? "bg-sky-500 text-white shadow-sm shadow-sky-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {ratio === "16:9" ? "16:9 YouTube" : ratio === "9:16" ? "9:16 Shorts" : ratio === "1:1" ? "1:1 Square" : "4:5 Post"}
            </button>
          ))}
        </div>

        {/* Safe Zone & Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSafeZone(!showSafeZone)}
            title="Toggle TikTok / Shorts Safe Area Margins"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              showSafeZone
                ? "bg-sky-500/20 text-sky-400 border-sky-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Safe Zones</span>
          </button>

          <select
            value={zoomScale}
            onChange={(e) => setZoomScale(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value={1}>Fit Screen</option>
            <option value={0.75}>75%</option>
            <option value={0.5}>50%</option>
            <option value={1.25}>125%</option>
          </select>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 relative flex items-center justify-center p-4 overflow-hidden bg-dot-grid cursor-default"
      >
        <div
          className="relative shadow-2xl shadow-black/80 rounded-lg overflow-hidden border border-slate-700/60 max-w-full max-h-full transition-transform duration-100"
          style={{
            aspectRatio: currentDims.cssRatio,
            maxHeight: "calc(100% - 10px)",
            transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
          }}
        >
          {/* HTML5 Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain block bg-black"
          />

          {/* Social Media Safe Zone Overlay */}
          {showSafeZone && (
            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-sky-400/40">
              {project.settings.aspectRatio === "9:16" && (
                <>
                  {/* Top Header Safe Margin */}
                  <div className="absolute top-0 left-0 right-0 h-[14%] bg-sky-500/10 border-b border-sky-400/30 flex items-center justify-center text-[11px] font-bold text-sky-300">
                    TOP STATUS / SEARCH SAFE ZONE
                  </div>
                  {/* Right Icons Margin */}
                  <div className="absolute top-[14%] bottom-[20%] right-0 w-[18%] bg-amber-500/10 border-l border-amber-400/30 flex items-center justify-center text-[9px] font-bold text-amber-300 write-vertical">
                    RIGHT ICONS (LIKE/COMMENT)
                  </div>
                  {/* Bottom Caption Margin */}
                  <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-emerald-500/10 border-t border-emerald-400/30 flex items-center justify-center text-[11px] font-bold text-emerald-300">
                    BOTTOM CAPTION / AUDIO SAFE ZONE
                  </div>
                </>
              )}
            </div>
          )}

          {/* Selected Clip Visual Transform Handles Overlay */}
          {selectedClip && (
            <div
              className="absolute pointer-events-none border-2 border-sky-400 rounded transition-all"
              style={{
                top: `${50 + (selectedClip.y || 0) / 2}%`,
                left: `${50 + (selectedClip.x || 0) / 2}%`,
                transform: `translate(-50%, -50%) rotate(${selectedClip.rotation || 0}deg) scale(${selectedClip.scale || 1})`,
                width: "40%",
                height: "40%",
              }}
            >
              {/* Corner Handles */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-sky-400 rounded-full border border-white" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-sky-400 rounded-full border border-white" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-sky-400 rounded-full border border-white" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-sky-400 rounded-full border border-white" />
              {/* Rotation Handle */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-3 h-3 bg-emerald-400 rounded-full border border-white cursor-grab" />
            </div>
          )}
        </div>
      </div>

      {/* Playback Controls Footer Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-t border-slate-800">
        {/* Timecode */}
        <div className="font-mono text-sm font-semibold tracking-wider text-sky-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 shadow-inner">
          {formatTimecode(currentTime)}
          <span className="text-slate-600 font-normal ml-1">
            / {formatTimecode(project.settings.duration)}
          </span>
        </div>

        {/* Central Playback Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTime(0)}
            title="Return to Start"
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => stepFrame(-1)}
            title="Previous Frame (1/30s)"
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlayPause}
            className="p-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-full shadow-lg shadow-sky-500/25 transition-all transform active:scale-95"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
          </button>

          <button
            onClick={() => stepFrame(1)}
            title="Next Frame (1/30s)"
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right Tools (Mute & Fullscreen) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className={`p-2 rounded-lg transition-colors ${
              isAudioMuted
                ? "text-red-400 bg-red-950/40"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            }`}
            title={isAudioMuted ? "Unmute Preview" : "Mute Preview"}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            title="Toggle Fullscreen Canvas"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
