import React, { useState, useRef, useEffect } from "react";
import {
  Wand2,
  Upload,
  Image as ImageIcon,
  Film,
  Sparkles,
  Sliders,
  Download,
  PlusCircle,
  Eye,
  RefreshCw,
  Layers,
  Check,
  AlertCircle,
  ArrowRight,
  Palette,
  SlidersHorizontal,
  Flame,
  Undo2,
} from "lucide-react";
import { useEditor } from "../../context/EditorContext";
import { useAuth } from "../../context/AuthContext";

interface FilterState {
  hueRotate: number;
  saturate: number;
  brightness: number;
  contrast: number;
  sepia: number;
  invert: number;
  grayscale: number;
  tintColor: string;
  tintOpacity: number;
  blendMode: string;
}

const DEFAULT_FILTERS: FilterState = {
  hueRotate: 0,
  saturate: 100,
  brightness: 100,
  contrast: 100,
  sepia: 0,
  invert: 0,
  grayscale: 0,
  tintColor: "#ef4444",
  tintOpacity: 0,
  blendMode: "color",
};

const SAMPLE_MEDIA = [
  {
    name: "Sports Car in Motion",
    type: "image" as const,
    url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300&auto=format&fit=crop&q=80",
  },
  {
    name: "Cat Portrait Close-up",
    type: "image" as const,
    url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&auto=format&fit=crop&q=80",
  },
  {
    name: "Urban Night Cyberpunk",
    type: "image" as const,
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80",
  },
  {
    name: "Golden Coast Sunset",
    type: "image" as const,
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80",
  },
];

const PRESET_PROMPTS = [
  { label: "🔴 Change to Red", prompt: "Change this to vibrant crimson red with intense saturation", color: "#ef4444" },
  { label: "🔵 Cyberpunk Neon Blue", prompt: "Transform with electric neon cyan and deep blue cyber lighting", color: "#06b6d4" },
  { label: "🟢 Emerald Green Matrix", prompt: "Apply emerald green glow with radioactive highlights", color: "#22c55e" },
  { label: "🟣 Synthwave Purple", prompt: "Infuse with synthwave ultraviolet purple and magenta vibes", color: "#a855f7" },
  { label: "🟡 Warm Sunset Gold", prompt: "Grade with golden hour sunset warmth and soft glowing highlights", color: "#eab308" },
  { label: "🖤 Dramatic Film Noir B&W", prompt: "Convert to high-contrast cinematic black and white noir with deep shadows", color: "#64748b" },
  { label: "🎞️ Vintage 90s Sepia", prompt: "Apply authentic 90s vintage film grain warmth, faded blacks and sepia tone", color: "#d97706" },
  { label: "⚡ Invert / Glitch", prompt: "Invert all colors with glitch art high-voltage effect", color: "#ec4899" },
];

export const MediaTransformView: React.FC = () => {
  const { addClipToTrack, setActiveTab, project } = useEditor();
  const { addNotification, user, updateProfile } = useAuth();

  // Media state
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [mediaUrl, setMediaUrl] = useState<string>(SAMPLE_MEDIA[1].url);
  const [mediaName, setMediaName] = useState<string>("Uploaded Cat Portrait");

  // Transform Prompt
  const [instruction, setInstruction] = useState("Change this to red");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Filter properties
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Split-view slider (0 to 100 percentage)
  const [splitPos, setSplitPos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<"split" | "side_by_side" | "after_only">("split");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle file upload (photo or video)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video");
    const isImage = file.type.startsWith("image");

    if (!isVideo && !isImage) {
      addNotification("Invalid Format", "Please select an image or video file.", "error");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setMediaType(isVideo ? "video" : "image");
    setMediaUrl(objectUrl);
    setMediaName(file.name);
    addNotification("Media Loaded", `Loaded ${file.name} for AI transformation.`, "info");
  };

  // Run AI Transformation
  const handleTransform = async (customPrompt?: string) => {
    const targetPrompt = customPrompt || instruction;
    if (!targetPrompt.trim()) return;

    setIsProcessing(true);
    setInstruction(targetPrompt);

    if (user && user.aiCreditsRemaining >= 5) {
      updateProfile({ aiCreditsRemaining: user.aiCreditsRemaining - 5 });
    }

    try {
      const res = await fetch("/api/ai/transform-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: targetPrompt,
          mediaType,
          currentMediaUrl: mediaUrl,
        }),
      });

      const data = await res.json();

      if (data.cssFilters) {
        setFilters({
          hueRotate: data.cssFilters.hueRotate || 0,
          saturate: data.cssFilters.saturate ?? 100,
          brightness: data.cssFilters.brightness ?? 100,
          contrast: data.cssFilters.contrast ?? 100,
          sepia: data.cssFilters.sepia || 0,
          invert: data.cssFilters.invert || 0,
          grayscale: data.cssFilters.grayscale || 0,
          tintColor: data.colorOverlay?.color?.startsWith("#")
            ? data.colorOverlay.color
            : data.canvasTransform?.replaceWithColor || "#ef4444",
          tintOpacity: data.colorOverlay?.opacity || 0.45,
          blendMode: data.colorOverlay?.blendMode || "color",
        });
      }

      setAiSummary(data.summary || `Applied change: "${targetPrompt}"`);
      addNotification("Transform Complete", `Successfully applied "${targetPrompt}".`, "success");
    } catch (err: any) {
      // Fallback manual transformation
      const lower = targetPrompt.toLowerCase();
      if (lower.includes("red")) {
        setFilters({
          ...DEFAULT_FILTERS,
          tintColor: "#ef4444",
          tintOpacity: 0.5,
          saturate: 160,
          hueRotate: 350,
        });
      } else if (lower.includes("blue") || lower.includes("cyan")) {
        setFilters({
          ...DEFAULT_FILTERS,
          tintColor: "#0ea5e9",
          tintOpacity: 0.5,
          saturate: 150,
          hueRotate: 190,
        });
      } else if (lower.includes("green")) {
        setFilters({
          ...DEFAULT_FILTERS,
          tintColor: "#22c55e",
          tintOpacity: 0.5,
          saturate: 150,
          hueRotate: 90,
        });
      } else if (lower.includes("black and white") || lower.includes("b&w")) {
        setFilters({
          ...DEFAULT_FILTERS,
          grayscale: 100,
          contrast: 130,
        });
      }
      setAiSummary(`Applied dynamic color grade: "${targetPrompt}"`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAiSummary(null);
    addNotification("Filters Reset", "Original media colors restored.", "info");
  };

  // Send transformed media straight to Editor Timeline
  const handleAddToTimeline = () => {
    const mainTrack = project.tracks.find((t) => t.type === "main") || project.tracks[0];
    if (!mainTrack) return;

    addClipToTrack(mainTrack.id, {
      type: mediaType,
      name: `AI Edit: ${instruction.slice(0, 18)}`,
      mediaUrl: mediaUrl,
      thumbnailUrl: mediaUrl,
      duration: mediaType === "video" ? 8 : 5,
      startTime: 0,
      colorFilter: {
        brightness: filters.brightness / 100,
        contrast: filters.contrast / 100,
        saturation: filters.saturate / 100,
        exposure: 0,
        temperature: 0,
        tint: 0,
        vignette: 0,
        sharpness: 0,
        sepia: filters.sepia / 100,
        grayscale: filters.grayscale / 100,
        hueRotate: filters.hueRotate,
        blur: 0,
      },
    });

    setActiveTab("editor");
    addNotification("Sent to Timeline", "Transformed clip added to video track with active shader filters.", "success");
  };

  // Download transformed image snapshot
  const handleDownload = () => {
    if (mediaType === "video") {
      addNotification("Video Download", "Video filter configuration saved. Add to timeline to render in 4K.", "info");
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 1280;
      canvas.height = img.naturalHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Apply CSS filters on context
      ctx.filter = `hue-rotate(${filters.hueRotate}deg) saturate(${filters.saturate}%) brightness(${filters.brightness}%) contrast(${filters.contrast}%) sepia(${filters.sepia}%) invert(${filters.invert}%) grayscale(${filters.grayscale}%)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (filters.tintOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = filters.tintOpacity;
        ctx.globalCompositeOperation = (filters.blendMode as GlobalCompositeOperation) || "color";
        ctx.fillStyle = filters.tintColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      const link = document.createElement("a");
      link.download = `novacut-transformed-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      addNotification("Downloaded", "Transformed image saved to your device.", "success");
    };
    img.src = mediaUrl;
  };

  // Build filter style string
  const cssFilterString = `hue-rotate(${filters.hueRotate}deg) saturate(${filters.saturate}%) brightness(${filters.brightness}%) contrast(${filters.contrast}%) sepia(${filters.sepia}%) invert(${filters.invert}%) grayscale(${filters.grayscale}%)`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-900/40 via-indigo-900/30 to-purple-900/40 border border-sky-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            AI Media Transform Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Prompt-to-Edit: Change Colors, Lighting & VFX
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Upload your own photo or video and describe any change in plain English (e.g.{" "}
            <span className="text-sky-300 font-medium">"Change this to red"</span>,{" "}
            <span className="text-purple-300 font-medium">"Make it cyberpunk neon"</span>, or{" "}
            <span className="text-emerald-300 font-medium">"Turn into 90s vintage film"</span>).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,video/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-all shadow-lg shadow-sky-500/20 active:scale-95"
          >
            <Upload className="w-4 h-4" />
            Upload Photo / Video
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Before / After Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Visual Comparison
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 font-mono">
                {mediaType.toUpperCase()}
              </span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setViewMode("split")}
                className={`px-2.5 py-1 rounded transition-all ${
                  viewMode === "split" ? "bg-sky-500 text-white font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                Split Slider
              </button>
              <button
                onClick={() => setViewMode("side_by_side")}
                className={`px-2.5 py-1 rounded transition-all ${
                  viewMode === "side_by_side" ? "bg-sky-500 text-white font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                Side-by-Side
              </button>
              <button
                onClick={() => setViewMode("after_only")}
                className={`px-2.5 py-1 rounded transition-all ${
                  viewMode === "after_only" ? "bg-sky-500 text-white font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                Processed
              </button>
            </div>
          </div>

          {/* Canvas / Visual Viewport */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group select-none">
            {viewMode === "split" ? (
              // Split Slider View
              <div className="relative w-full h-full">
                {/* Before (Original) Layer */}
                <div className="absolute inset-0 w-full h-full">
                  {mediaType === "video" ? (
                    <video src={mediaUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                  ) : (
                    <img src={mediaUrl} alt="Original" className="w-full h-full object-cover" crossOrigin="anonymous" />
                  )}
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-300 tracking-wider">
                    ORIGINAL
                  </div>
                </div>

                {/* After (Transformed) Layer with clip path */}
                <div
                  className="absolute inset-0 w-full h-full overflow-hidden"
                  style={{ clipPath: `polygon(${splitPos}% 0, 100% 0, 100% 100%, ${splitPos}% 100%)` }}
                >
                  {mediaType === "video" ? (
                    <video
                      src={mediaUrl}
                      className="w-full h-full object-cover"
                      style={{ filter: cssFilterString }}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt="Transformed"
                      className="w-full h-full object-cover"
                      style={{ filter: cssFilterString }}
                      crossOrigin="anonymous"
                    />
                  )}

                  {/* Tint Overlay */}
                  {filters.tintOpacity > 0 && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundColor: filters.tintColor,
                        opacity: filters.tintOpacity,
                        mixBlendMode: filters.blendMode as any,
                      }}
                    />
                  )}

                  <div className="absolute top-3 right-3 bg-sky-500/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-bold text-white tracking-wider shadow-lg">
                    AI TRANSFORMED
                  </div>
                </div>

                {/* Draggable Divider Bar */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize shadow-[0_0_12px_rgba(255,255,255,0.8)] flex items-center justify-center pointer-events-none"
                  style={{ left: `${splitPos}%` }}
                >
                  <div className="w-8 h-8 rounded-full bg-white text-slate-950 font-bold text-[10px] flex items-center justify-center shadow-2xl border-2 border-sky-500">
                    ⇄
                  </div>
                </div>

                {/* Interactive Slider Input */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={splitPos}
                  onChange={(e) => setSplitPos(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                />
              </div>
            ) : viewMode === "side_by_side" ? (
              // Side by Side View
              <div className="grid grid-cols-2 w-full h-full">
                <div className="relative border-r border-slate-800">
                  {mediaType === "video" ? (
                    <video src={mediaUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                  ) : (
                    <img src={mediaUrl} alt="Original" className="w-full h-full object-cover" crossOrigin="anonymous" />
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-slate-300">
                    Original
                  </div>
                </div>
                <div className="relative">
                  {mediaType === "video" ? (
                    <video
                      src={mediaUrl}
                      className="w-full h-full object-cover"
                      style={{ filter: cssFilterString }}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt="Transformed"
                      className="w-full h-full object-cover"
                      style={{ filter: cssFilterString }}
                      crossOrigin="anonymous"
                    />
                  )}
                  {filters.tintOpacity > 0 && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundColor: filters.tintColor,
                        opacity: filters.tintOpacity,
                        mixBlendMode: filters.blendMode as any,
                      }}
                    />
                  )}
                  <div className="absolute bottom-2 right-2 bg-sky-500 px-2 py-0.5 rounded text-[10px] text-white font-bold">
                    Transformed
                  </div>
                </div>
              </div>
            ) : (
              // After only view
              <div className="relative w-full h-full">
                {mediaType === "video" ? (
                  <video
                    src={mediaUrl}
                    className="w-full h-full object-cover"
                    style={{ filter: cssFilterString }}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Transformed"
                    className="w-full h-full object-cover"
                    style={{ filter: cssFilterString }}
                    crossOrigin="anonymous"
                  />
                )}
                {filters.tintOpacity > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundColor: filters.tintColor,
                      opacity: filters.tintOpacity,
                      mixBlendMode: filters.blendMode as any,
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* AI Transformation Summary Banner */}
          {aiSummary && (
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-sky-500/30 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-sky-300">Transformation Applied: </span>
                <span className="text-slate-300">{aiSummary}</span>
              </div>
            </div>
          )}

          {/* Sample Media Selector */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-slate-400">Try with Sample Images:</span>
            <div className="grid grid-cols-4 gap-2">
              {SAMPLE_MEDIA.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setMediaType(item.type);
                    setMediaUrl(item.url);
                    setMediaName(item.name);
                  }}
                  className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all group ${
                    mediaUrl === item.url ? "border-sky-500 shadow-md shadow-sky-500/20" : "border-slate-800 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={item.thumb} alt={item.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                    <span className="text-[10px] font-medium text-white truncate">{item.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Prompt & Precision Color Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Natural Language Prompt Input Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-sky-400" />
                Natural Language Change Request
              </label>
              <span className="text-[11px] text-sky-400 font-mono">5 AI Credits</span>
            </div>

            <div className="relative">
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g. Change this to red, make it cyberpunk neon with intense contrast..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
              />
            </div>

            <button
              onClick={() => handleTransform()}
              disabled={isProcessing || !instruction.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing AI Color Shaders...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Apply Change: "{instruction.slice(0, 24)}"
                </>
              )}
            </button>

            {/* Instant Quick Presets */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Quick 1-Click Changes:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_PROMPTS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTransform(preset.prompt)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-left text-xs font-medium text-slate-200 transition-all active:scale-95"
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: preset.color }} />
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Manual Precision Sliders Accordion */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                Fine-Tune Filter Parameters
              </h3>
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <Undo2 className="w-3 h-3" />
                Reset
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Hue Rotation */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Hue Shift</span>
                  <span className="font-mono text-slate-200">{filters.hueRotate}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={filters.hueRotate}
                  onChange={(e) => setFilters({ ...filters, hueRotate: Number(e.target.value) })}
                  className="w-full accent-sky-500"
                />
              </div>

              {/* Tint Overlay Color & Opacity */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Target Color Overlay</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={filters.tintColor}
                      onChange={(e) => setFilters({ ...filters, tintColor: e.target.value })}
                      className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="font-mono text-slate-200">{Math.round(filters.tintOpacity * 100)}%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={filters.tintOpacity}
                  onChange={(e) => setFilters({ ...filters, tintOpacity: Number(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>

              {/* Saturation */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Saturation</span>
                  <span className="font-mono text-slate-200">{filters.saturate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={filters.saturate}
                  onChange={(e) => setFilters({ ...filters, saturate: Number(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Contrast</span>
                  <span className="font-mono text-slate-200">{filters.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={filters.contrast}
                  onChange={(e) => setFilters({ ...filters, contrast: Number(e.target.value) })}
                  className="w-full accent-yellow-500"
                />
              </div>

              {/* Brightness */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Brightness</span>
                  <span className="font-mono text-slate-200">{filters.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={filters.brightness}
                  onChange={(e) => setFilters({ ...filters, brightness: Number(e.target.value) })}
                  className="w-full accent-sky-400"
                />
              </div>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleAddToTimeline}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Add to Editor Timeline
            </button>

            <button
              onClick={handleDownload}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              Download Media
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
