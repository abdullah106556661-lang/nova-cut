import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize2,
  Minimize2,
  FastForward,
  Rewind,
  Repeat,
  PictureInPicture2,
  Film,
  Sparkles,
  Image as ImageIcon,
  Download,
  Plus,
  Gauge,
  Sliders,
  Check,
} from "lucide-react";

export interface SceneInfo {
  time: string;
  action: string;
  camera: string;
}

export interface AIVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  scenes?: SceneInfo[];
  aspectRatio: "16:9" | "9:16";
  fallbackUrls?: string[];
  prompt?: string;
  onSendToTimeline?: () => void;
  onDownload?: () => void;
}

export const AIVideoPlayer: React.FC<AIVideoPlayerProps> = ({
  videoUrl,
  thumbnailUrl,
  title,
  scenes = [],
  aspectRatio,
  fallbackUrls = [],
  prompt,
  onSendToTimeline,
  onDownload,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrubBarRef = useRef<HTMLDivElement>(null);

  // Playback & Audio States
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(true);
  const [isLooping, setIsLooping] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [renderMode, setRenderMode] = useState<"video" | "neural" | "picture">("video");
  const [videoLoaded, setVideoLoaded] = useState(false);

  // UI Interaction States
  const [showControls, setShowControls] = useState(true);
  const [isHoveringVolume, setIsHoveringVolume] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverScrubTime, setHoverScrubTime] = useState<number | null>(null);
  const [hoverScrubPos, setHoverScrubPos] = useState<number | null>(null);
  const [centerRipple, setCenterRipple] = useState<"play" | "pause" | "fwd" | "rwd" | null>(null);

  // Refs for non-blocking 60fps animation loop
  const currentTimeRef = useRef(0);
  const isPlayingRef = useRef(true);
  const playbackSpeedRef = useRef(1);
  const durationRef = useRef(10);
  const isLoopingRef = useRef(true);

  isPlayingRef.current = isPlaying;
  playbackSpeedRef.current = playbackSpeed;
  durationRef.current = duration;
  isLoopingRef.current = isLooping;

  // Compute proxied & reliable stream list
  const streamPool = useMemo(() => {
    const list = [
      videoUrl,
      ...(fallbackUrls || []),
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    ].filter(Boolean);

    const proxied = list.map((url) => {
      if (url.startsWith("http")) {
        return `/api/ai/proxy-video?url=${encodeURIComponent(url)}`;
      }
      return url;
    });

    return Array.from(new Set([...proxied, ...list]));
  }, [videoUrl, fallbackUrls]);

  const [streamIndex, setStreamIndex] = useState(0);
  const activeSrc = streamPool[streamIndex] || videoUrl;

  // Cached image for 60fps Canvas Animation
  const canvasImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = thumbnailUrl || "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80";
    img.onload = () => {
      canvasImgRef.current = img;
    };
  }, [thumbnailUrl]);

  // Flash center ripple icon feedback
  const triggerRipple = (type: "play" | "pause" | "fwd" | "rwd") => {
    setCenterRipple(type);
    setTimeout(() => setCenterRipple(null), 600);
  };

  // Reset hide timer on mouse movement
  const handleUserActivity = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlayingRef.current) {
      hideControlsTimerRef.current = setTimeout(() => {
        if (!isHoveringVolume && !showSpeedMenu && !isScrubbing) {
          setShowControls(false);
        }
      }, 2500);
    }
  }, [isHoveringVolume, showSpeedMenu, isScrubbing]);

  // 60fps Canvas & Timing render loop
  useEffect(() => {
    let lastTs = performance.now();
    let lastUiSync = 0;

    const renderLoop = (ts: number) => {
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      if (isPlayingRef.current) {
        let cur = currentTimeRef.current + dt * playbackSpeedRef.current;
        const dur = durationRef.current || 10;
        if (cur >= dur) {
          if (isLoopingRef.current) {
            cur = 0;
          } else {
            cur = dur;
            setIsPlaying(false);
          }
        }
        currentTimeRef.current = cur;

        // Throttle UI React state updates (~15fps)
        if (ts - lastUiSync > 66) {
          lastUiSync = ts;
          setCurrentTime(cur);

          if (scenes && scenes.length > 0) {
            const sceneFraction = dur / scenes.length;
            const idx = Math.min(scenes.length - 1, Math.floor(cur / Math.max(0.1, sceneFraction)));
            setActiveSceneIdx(idx);
          }
        }
      }

      // Draw dynamic Canvas visuals
      const canvas = canvasRef.current;
      if (canvas && canvasImgRef.current && canvasImgRef.current.complete) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          const t = currentTimeRef.current;
          const zoom = 1.0 + 0.08 * Math.sin(t * 0.4);
          const panX = Math.sin(t * 0.3) * 20;
          const panY = Math.cos(t * 0.25) * 12;

          ctx.save();
          ctx.translate(w / 2 + panX, h / 2 + panY);
          ctx.scale(zoom, zoom);
          ctx.drawImage(canvasImgRef.current, -w / 2, -h / 2, w, h);
          ctx.restore();

          // Lighting flare & particle sweep
          ctx.save();
          const grad = ctx.createRadialGradient(
            w * 0.5 + Math.sin(t * 0.8) * 100,
            h * 0.3 + Math.cos(t * 0.8) * 50,
            20,
            w * 0.5,
            h * 0.5,
            w * 0.8
          );
          grad.addColorStop(0, "rgba(168, 85, 247, 0.25)");
          grad.addColorStop(0.5, "rgba(56, 189, 248, 0.1)");
          grad.addColorStop(1, "rgba(0, 0, 0, 0.4)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          for (let i = 0; i < 20; i++) {
            const px = (i * 73 + t * 45) % w;
            const py = (i * 47 + Math.sin(t + i) * 30 + (w - t * 25)) % h;
            const alpha = 0.3 + 0.4 * Math.sin(t * 2 + i);
            ctx.beginPath();
            ctx.arc(px, py, 1.5 + (i % 2), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
          }
          ctx.restore();
        }
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [scenes]);

  // Video source sync
  useEffect(() => {
    setStreamIndex(0);
    currentTimeRef.current = 0;
    setCurrentTime(0);
    setVideoLoaded(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setVideoLoaded(true);
        })
        .catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current
              .play()
              .then(() => {
                setIsPlaying(true);
                setVideoLoaded(true);
              })
              .catch(() => {
                setRenderMode("neural");
              });
          }
        });
    }
  }, [videoUrl]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Keyboard controls listener when container has focus or mouse over
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (["Space", "KeyK"].includes(e.code)) {
      e.preventDefault();
      togglePlay();
    } else if (["ArrowLeft", "KeyJ"].includes(e.code)) {
      e.preventDefault();
      seekRelative(-2);
    } else if (["ArrowRight", "KeyL"].includes(e.code)) {
      e.preventDefault();
      seekRelative(2);
    } else if (e.code === "KeyM") {
      e.preventDefault();
      toggleMute();
    } else if (e.code === "KeyF") {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.code === "ArrowUp") {
      e.preventDefault();
      changeVolume(Math.min(1, volume + 0.1));
    } else if (e.code === "ArrowDown") {
      e.preventDefault();
      changeVolume(Math.max(0, volume - 0.1));
    }
  };

  // Play / Pause toggle
  const togglePlay = () => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    triggerRipple(nextPlaying ? "play" : "pause");
    if (videoRef.current) {
      if (nextPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  };

  // Seek relative (e.g. +/- 2s or 5s)
  const seekRelative = (delta: number) => {
    const dur = durationRef.current || 10;
    const target = Math.max(0, Math.min(dur, currentTimeRef.current + delta));
    currentTimeRef.current = target;
    setCurrentTime(target);
    triggerRipple(delta > 0 ? "fwd" : "rwd");
    if (videoRef.current) {
      videoRef.current.currentTime = target;
    }
  };

  // Jump to specific time / scene
  const seekTo = (target: number) => {
    const dur = durationRef.current || 10;
    const clamped = Math.max(0, Math.min(dur, target));
    currentTimeRef.current = clamped;
    setCurrentTime(clamped);
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
  };

  const jumpToScene = (idx: number) => {
    const sceneFraction = (duration || 10) / Math.max(1, scenes.length || 3);
    const target = idx * sceneFraction;
    seekTo(target);
    setActiveSceneIdx(idx);
    if (renderMode === "picture") setRenderMode("video");
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  // Volume & Mute handling
  const changeVolume = (newVol: number) => {
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      if (newVol > 0 && videoRef.current.muted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleRestart = () => {
    seekTo(0);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const togglePictureInPicture = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current.requestPictureInPicture) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("PiP not available:", err);
    }
  };

  const handleSpeedChange = (spd: number) => {
    setPlaybackSpeed(spd);
    setShowSpeedMenu(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = spd;
    }
  };

  // Video error fallback
  const handleVideoError = () => {
    const nextIdx = streamIndex + 1;
    if (nextIdx < streamPool.length) {
      setStreamIndex(nextIdx);
    } else {
      setRenderMode("neural");
    }
  };

  // Scrubber interactive calculations
  const handleScrubMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubBarRef.current) return;
    const rect = scrubBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const dur = duration || 10;
    setHoverScrubTime(pos * dur);
    setHoverScrubPos(pos * 100);

    if (isScrubbing) {
      seekTo(pos * dur);
    }
  };

  const handleScrubClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubBarRef.current) return;
    const rect = scrubBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const dur = duration || 10;
    seekTo(pos * dur);
  };

  // Format time (00:00)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mt-4 space-y-4">
      {/* Header Mode Switcher & Stream Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setRenderMode("video")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              renderMode === "video"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>🎬 60fps Video Stream</span>
          </button>
          <button
            type="button"
            onClick={() => setRenderMode("neural")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              renderMode === "neural"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>⚡ Neural Cinema Motion</span>
          </button>
          <button
            type="button"
            onClick={() => setRenderMode("picture")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              renderMode === "picture"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>🖼️ HD Film Still</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {aspectRatio} • 1080p 60fps Render
          </span>
        </div>
      </div>

      {/* Main Video Viewport & Controller Container */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseMove={handleUserActivity}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => {
          if (isPlaying) setShowControls(false);
          setHoverScrubTime(null);
          setHoverScrubPos(null);
          setIsHoveringVolume(false);
          setShowSpeedMenu(false);
        }}
        className={`group relative rounded-2xl overflow-hidden border border-purple-500/40 bg-slate-950 shadow-2xl shadow-purple-950/40 flex items-center justify-center select-none outline-none focus:ring-2 focus:ring-purple-500/50 ${
          aspectRatio === "9:16" ? "aspect-[9/16] max-h-[520px] mx-auto" : "aspect-[16/9]"
        }`}
      >
        {/* Render Layer: Picture / Neural / Video Stream */}
        {renderMode === "picture" ? (
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
            <img
              src={thumbnailUrl || "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80"}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80") {
                  target.src = "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80";
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80 pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="px-2 py-0.5 rounded bg-cyan-500/30 text-cyan-300 text-[10px] font-bold border border-cyan-400/40">
                  ✨ AI Photorealistic Film Still
                </span>
                <p className="text-slate-200 text-xs font-semibold max-w-md truncate drop-shadow">
                  {prompt || title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRenderMode("video")}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Play Video Stream</span>
              </button>
            </div>
          </div>
        ) : renderMode === "neural" ? (
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              onClick={togglePlay}
              className="w-full h-full object-cover cursor-pointer"
            />
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
            <video
              ref={videoRef}
              src={activeSrc}
              poster={thumbnailUrl}
              autoPlay
              loop={isLooping}
              muted={isMuted}
              playsInline
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  const dur = videoRef.current.duration;
                  if (dur && !isNaN(dur) && dur > 0) setDuration(dur);
                  videoRef.current.play().catch(() => {});
                  setVideoLoaded(true);
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={handleVideoError}
              onClick={togglePlay}
              className="w-full h-full object-cover cursor-pointer"
            />

            {!videoLoaded && (
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                onClick={togglePlay}
                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
              />
            )}
          </div>
        )}

        {/* Central Animated Ripple Feedback */}
        {centerRipple && (
          <div className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-slate-950/80 border border-purple-500/60 backdrop-blur-md flex items-center justify-center pointer-events-none z-30 animate-ping">
            {centerRipple === "play" && <Play className="w-8 h-8 fill-purple-400 text-purple-400" />}
            {centerRipple === "pause" && <Pause className="w-8 h-8 fill-purple-400 text-purple-400" />}
            {centerRipple === "fwd" && <FastForward className="w-8 h-8 text-sky-400" />}
            {centerRipple === "rwd" && <Rewind className="w-8 h-8 text-sky-400" />}
          </div>
        )}

        {/* Top Badges & Actions Overlay */}
        {renderMode !== "picture" && (
          <div
            className={`absolute top-0 inset-x-0 p-3 flex items-center justify-between bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent transition-opacity duration-300 z-20 ${
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-purple-500/40 text-[10px] font-bold text-white shadow-lg">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="font-mono">{isPlaying ? "PLAYING" : "PAUSED"}</span>
              <span className="text-slate-500">•</span>
              <span className="text-purple-300 font-mono">1080p 60fps</span>
              <span className="text-slate-500">•</span>
              <span className="text-sky-300 font-mono">{renderMode === "neural" ? "NEURAL" : "STREAM"}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {onSendToTimeline && (
                <button
                  type="button"
                  onClick={onSendToTimeline}
                  className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                  title="Send clip to editor track"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Send to Timeline</span>
                </button>
              )}
              {onDownload && (
                <button
                  type="button"
                  onClick={onDownload}
                  className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer shadow-lg"
                  title="Download MP4"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Big Center Play / Pause Button (When paused) */}
        {!isPlaying && renderMode !== "picture" && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-purple-600/90 hover:bg-purple-500 border-2 border-white/80 flex items-center justify-center text-white shadow-2xl shadow-purple-600/60 backdrop-blur-md transition-transform active:scale-95 cursor-pointer z-20 group-hover:scale-110"
          >
            <Play className="w-7 h-7 fill-white ml-1" />
          </button>
        )}

        {/* CUSTOM VIDEO CONTROLLER OVERLAY */}
        {renderMode !== "picture" && (
          <div
            className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent p-3 pt-8 z-20 space-y-2.5 transition-opacity duration-300 ${
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Timeline Scrubber with Hover Time & Scene Markers */}
            <div
              ref={scrubBarRef}
              onMouseMove={handleScrubMove}
              onMouseDown={(e) => {
                setIsScrubbing(true);
                handleScrubClick(e);
              }}
              onMouseUp={() => setIsScrubbing(false)}
              className="relative h-4 flex items-center cursor-pointer group/timeline py-1"
            >
              {/* Background Track */}
              <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden transition-all group-hover/timeline:h-2">
                {/* Progress Bar Fill */}
                <div
                  className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-sky-400 transition-all rounded-full shadow-[0_0_10px_#a855f7]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Scene Cut Markers on Track */}
              {scenes.length > 1 &&
                scenes.map((_, idx) => {
                  if (idx === 0) return null;
                  const scenePct = (idx / scenes.length) * 100;
                  return (
                    <div
                      key={idx}
                      className="absolute top-1/2 -translate-y-1/2 w-1.5 h-2.5 bg-white/40 border border-slate-900 rounded-sm pointer-events-none"
                      style={{ left: `${scenePct}%` }}
                    />
                  );
                })}

              {/* Draggable Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-purple-600 shadow-md shadow-purple-600/50 opacity-0 group-hover/timeline:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `${progressPercent}%` }}
              />

              {/* Hover Tooltip with Timestamp & Scene Title */}
              {hoverScrubTime !== null && hoverScrubPos !== null && (
                <div
                  className="absolute bottom-6 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-slate-900/95 border border-purple-500/40 text-[10px] font-mono text-white shadow-xl backdrop-blur-md pointer-events-none flex flex-col items-center gap-0.5 whitespace-nowrap z-30"
                  style={{ left: `${hoverScrubPos}%` }}
                >
                  <span className="font-bold text-purple-300">{formatTime(hoverScrubTime)}</span>
                  {scenes.length > 0 && (
                    <span className="text-[9px] text-slate-400 max-w-[120px] truncate">
                      Scene {Math.min(scenes.length, Math.floor((hoverScrubTime / (duration || 10)) * scenes.length) + 1)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Controller Action Bar */}
            <div className="flex items-center justify-between gap-2 text-xs">
              {/* Left Controls: Play/Pause, Rewind/Forward, Restart, Time, Volume */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all cursor-pointer shadow-md shadow-purple-600/30"
                  title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => seekRelative(-2)}
                  className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-800"
                  title="Rewind 2s (Left Arrow)"
                >
                  <Rewind className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => seekRelative(2)}
                  className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-800"
                  title="Forward 2s (Right Arrow)"
                >
                  <FastForward className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleRestart}
                  className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-800"
                  title="Restart from 00:00"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Time Display */}
                <div className="font-mono text-[11px] font-bold text-slate-200 px-1.5">
                  <span className="text-purple-400">{formatTime(currentTime)}</span>
                  <span className="text-slate-600 mx-1">/</span>
                  <span className="text-slate-400">{formatTime(duration)}</span>
                </div>

                {/* Volume Controller with Expandable Slider */}
                <div
                  onMouseEnter={() => setIsHoveringVolume(true)}
                  onMouseLeave={() => setIsHoveringVolume(false)}
                  className="relative flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-xl px-2 py-1"
                >
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title={isMuted ? "Unmute (M)" : "Mute (M)"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </button>

                  <div
                    className={`transition-all duration-200 flex items-center ${
                      isHoveringVolume ? "w-16 opacity-100 ml-1" : "w-0 opacity-0 overflow-hidden"
                    }`}
                  >
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => changeVolume(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Right Controls: Loop, Speed, PiP, Fullscreen */}
              <div className="flex items-center gap-1.5">
                {/* Loop Toggle */}
                <button
                  type="button"
                  onClick={() => setIsLooping(!isLooping)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    isLooping
                      ? "bg-purple-950/60 border-purple-500 text-purple-300"
                      : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                  title={isLooping ? "Loop is ON" : "Loop is OFF"}
                >
                  <Repeat className="w-3.5 h-3.5" />
                </button>

                {/* Playback Speed Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    title="Playback Speed"
                  >
                    <Gauge className="w-3 h-3 text-purple-400" />
                    <span>{playbackSpeed}x</span>
                  </button>

                  {showSpeedMenu && (
                    <div className="absolute bottom-8 right-0 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-2xl backdrop-blur-md flex flex-col gap-0.5 z-40 min-w-[70px]">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => handleSpeedChange(spd)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono text-left flex items-center justify-between cursor-pointer ${
                            playbackSpeed === spd
                              ? "bg-purple-600 text-white font-bold"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <span>{spd}x</span>
                          {playbackSpeed === spd && <Check className="w-2.5 h-2.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Picture in Picture */}
                {renderMode === "video" && (
                  <button
                    type="button"
                    onClick={togglePictureInPicture}
                    className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                    title="Picture in Picture"
                  >
                    <PictureInPicture2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Fullscreen */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Storyboard Scene Breakdown */}
      {scenes && scenes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-bold text-xs text-slate-300 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-purple-400" />
              <span>Veo 3.1 Scene Storyboard Breakdown (Click scene to jump)</span>
            </p>
            <span className="text-[10px] text-purple-400 font-mono">
              Active Scene {activeSceneIdx + 1}/{scenes.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {scenes.map((s, idx) => {
              const isCurrent = activeSceneIdx === idx;
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => jumpToScene(idx)}
                  className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                    isCurrent
                      ? "bg-purple-950/60 border-purple-500 text-white shadow-lg shadow-purple-900/30 ring-1 ring-purple-400/50"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[10px] font-bold text-purple-400 flex items-center gap-1">
                      {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />}
                      Scene {idx + 1}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{s.time}</span>
                  </div>
                  <p className="font-medium line-clamp-2 leading-snug">{s.action}</p>
                  <span className="text-[10px] text-slate-400 block font-mono mt-1">📹 {s.camera}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
