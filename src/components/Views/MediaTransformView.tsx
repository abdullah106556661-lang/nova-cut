import React, { useState, useRef } from "react";
import {
  Wand2,
  Upload,
  Sparkles,
  SlidersHorizontal,
  PlusCircle,
  Download,
  Undo2,
  Redo2,
  RotateCcw,
  RefreshCw,
  Eye,
  Layers,
  Palette,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { useEditor } from "../../context/EditorContext";
import { useAuth } from "../../context/AuthContext";
import { apiFetch, safeApiJson, formatApiError } from "../../utils/api";

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
    name: "Modern Creator Portrait",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    type: "image" as const,
  },
  {
    name: "Urban Style Portrait",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    type: "image" as const,
  },
  {
    name: "Studio Headshot",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    type: "image" as const,
  },
  {
    name: "Casual Street Photo",
    url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    type: "image" as const,
  },
];

const GENERATIVE_CATEGORIES = [
  {
    id: "background",
    label: "🏞️ Backgrounds",
    presets: [
      {
        label: "🏖️ Tropical Beach Sunset",
        prompt: "Replace the background with a breathtaking tropical beach during golden hour sunset with calm ocean waves, coconut palm trees, and warm ambient lighting on the subject.",
      },
      {
        label: "🏙️ Cyberpunk Tokyo 2099",
        prompt: "Change the background into a futuristic Neo-Tokyo cyberpunk city street with vibrant neon signs, rain-slicked asphalt reflections, and volumetric atmospheric glow.",
      },
      {
        label: "☕ Cozy Parisian Café",
        prompt: "Replace the background with an authentic Parisian outdoor café on a cobblestone street with warm fairy string lights and blooming spring flowers.",
      },
      {
        label: "🏔️ Snowy Alpine Mountain",
        prompt: "Transform the background into crisp snow-capped Alpine mountain peaks with clear blue skies, pine trees, and soft realistic winter sunlight.",
      },
      {
        label: "🚀 Sci-Fi Orbital Station",
        prompt: "Set the background inside a sleek spaceship observation deck overlooking planet Earth, glowing stars, and deep cosmic nebulae.",
      },
    ],
  },
  {
    id: "objects",
    label: "🐾 Add Elements",
    presets: [
      {
        label: "🐱 Fluffy Cat Companion",
        prompt: "Seamlessly add a cute, photorealistic fluffy kitten sitting right next to the subject, naturally illuminated by the scene light.",
      },
      {
        label: "🦜 Exotic Tropical Parrot",
        prompt: "Add a vibrant colorful scarlet macaw parrot perched gently near the subject with realistic feathers and natural lighting.",
      },
      {
        label: "🕶️ Futuristic Tinted Sunglasses",
        prompt: "Add sleek, modern tinted sunglasses onto the subject's face perfectly fitted to their facial structure and eye position.",
      },
      {
        label: "🐶 Playful Golden Retriever Puppy",
        prompt: "Add a happy golden retriever puppy sitting attentively beside the subject looking towards the camera.",
      },
    ],
  },
  {
    id: "lighting",
    label: "💡 Lighting & FX",
    presets: [
      {
        label: "🌅 Golden Hour Glow",
        prompt: "Infuse the entire photo with warm golden hour cinematic rim lighting, gentle sun flare, and soft photorealistic skin tones.",
      },
      {
        label: "⚡ Cyberpunk Neon Rim Lights",
        prompt: "Add dramatic cyan and magenta dual rim lighting along the edges of the subject with a subtle volumetric atmospheric haze.",
      },
      {
        label: "🎬 High-End Studio Chiaroscuro",
        prompt: "Apply dramatic high-contrast studio editorial lighting with deep rich shadows and sculpted key light accents.",
      },
      {
        label: "🌫️ Moody Cinematic Fog",
        prompt: "Introduce a soft, mysterious volumetric fog and gentle moody lighting while keeping the subject crisp and in sharp focus.",
      },
    ],
  },
  {
    id: "style",
    label: "👔 Styling & Outfits",
    presets: [
      {
        label: "🧥 Tailored Cyber Leather Jacket",
        prompt: "Change the subject's outfit into a premium sleek dark leather jacket with subtle futuristic detailing and clean stitching.",
      },
      {
        label: "🎩 Formal Black-Tie Tuxedo",
        prompt: "Change the subject's clothing to an elegant, tailored black tuxedo suit with a crisp white shirt and silk lapels.",
      },
      {
        label: "🎨 Stylized Fine-Art Oil Painting",
        prompt: "Transform this photo into an exquisite textured classical oil painting while preserving exact facial features and pose.",
      },
    ],
  },
];

const PRESET_PROMPTS = [
  { label: "🔴 Bold Crimson Red", prompt: "Change this to red with deep contrast and rich crimson tint", color: "#ef4444" },
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

  // Active transform mode: 'generative' (True AI photo edits) vs 'color_grade' (Live shaders)
  const [transformMode, setTransformMode] = useState<"generative" | "color_grade">("generative");
  const [activeCategory, setActiveCategory] = useState<string>("background");
  const [editAspectRatio, setEditAspectRatio] = useState<string>("16:9");

  // Media state
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [originalMediaUrl, setOriginalMediaUrl] = useState<string>(SAMPLE_MEDIA[1].url);
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string>(SAMPLE_MEDIA[1].url);
  const [mediaName, setMediaName] = useState<string>("Sample Portrait");
  const [mediaDimensions, setMediaDimensions] = useState<string>("1280 x 720 px");

  // Generative AI Transform Prompt & History
  const [generativePrompt, setGenerativePrompt] = useState(
    "Change the background to a breathtaking tropical beach during golden hour sunset with palm trees and ocean waves"
  );
  const [generativeHistory, setGenerativeHistory] = useState<
    { url: string; prompt: string; timestamp: string }[]
  >([
    {
      url: SAMPLE_MEDIA[1].url,
      prompt: "Original Image",
      timestamp: "Initial",
    },
  ]);
  const [historyIdx, setHistoryIdx] = useState<number>(0);
  const [isGenerativeLoading, setIsGenerativeLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>("");

  // Color Grade Prompt & Filters
  const [colorGradePrompt, setColorGradePrompt] = useState("Change this to red");
  const [isColorProcessing, setIsColorProcessing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Split-view slider (0 to 100 percentage)
  const [splitPos, setSplitPos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<"split" | "side_by_side" | "after_only">("split");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle file upload (converts to base64 for instant server transmission)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video");
    const isImage = file.type.startsWith("image");

    if (!isVideo && !isImage) {
      addNotification("Invalid Format", "Please select an image or video file.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        const dataUrl = reader.result as string;
        setMediaType(isVideo ? "video" : "image");
        setOriginalMediaUrl(dataUrl);
        setCurrentMediaUrl(dataUrl);
        setMediaName(file.name);
        setFilters(DEFAULT_FILTERS);
        setAiSummary(null);

        const img = new Image();
        img.onload = () => {
          setMediaDimensions(`${img.width} x ${img.height} px`);
        };
        img.src = dataUrl;

        setGenerativeHistory([
          {
            url: dataUrl,
            prompt: `Uploaded: ${file.name}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setHistoryIdx(0);

        addNotification("Source Photo Loaded", `Loaded ${file.name} for image-to-image AI editing.`, "success");
      }
    };
    reader.readAsDataURL(file);
  };

  // Run True Dedicated Image-to-Image AI Editing on the Source Image
  const handleExecuteGenerativeEdit = async (customPrompt?: string) => {
    const targetPrompt = customPrompt || generativePrompt;
    if (!targetPrompt.trim()) return;

    if (!currentMediaUrl) {
      addNotification("No Source Photo", "Please upload or select an image before editing.", "error");
      return;
    }

    if (user && user.aiCreditsRemaining < 5) {
      addNotification("Insufficient Credits", "You need at least 5 AI credits.", "error");
      return;
    }

    setIsGenerativeLoading(true);
    setLoadingStage("🧠 Ingesting source photo pixels & isolating subject features...");

    const t1 = setTimeout(() => {
      setLoadingStage("🎨 Executing image-to-image synthesis with editing instructions...");
    }, 1500);
    const t2 = setTimeout(() => {
      setLoadingStage("⚡ Harmonizing scene lighting, edge perspective & photorealism...");
    }, 3000);

    try {
      // Use current media state as source for chained editing
      const sourceToSend = currentMediaUrl;

      const res = await apiFetch("/api/ai/edit-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: targetPrompt,
          actionType: activeCategory || "custom",
          sourceImageUrl: sourceToSend,
          imageBase64: sourceToSend.startsWith("data:") ? sourceToSend : undefined,
          aspectRatio: editAspectRatio,
          requestId: `trans_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        }),
      });

      const { ok, data, error: apiErr } = await safeApiJson(res);
      if (!ok || !data?.imageUrl) {
        throw new Error(apiErr || data?.error || "Failed to transform uploaded image.");
      }

      if (user && user.aiCreditsRemaining >= 5) {
        updateProfile({ aiCreditsRemaining: user.aiCreditsRemaining - 5 });
      }

      setCurrentMediaUrl(data.imageUrl);

      const newItem = {
        url: data.imageUrl,
        prompt: targetPrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setGenerativeHistory((prev) => [...prev.slice(0, historyIdx + 1), newItem]);
      setHistoryIdx((prev) => prev + 1);

      setAiSummary(`AI Edit: "${targetPrompt}"`);
      if (data.isQuotaFallback) {
        addNotification("AI Styling Applied", "Applied aesthetic grading (AI image model quota reached; attach paid key in Settings for full neural editing).", "info");
      } else {
        addNotification("Image-to-Image Edit Complete", `Generated new version: "${targetPrompt.slice(0, 30)}..."`, "success");
      }
    } catch (err: any) {
      console.error("Generative edit error:", err);
      addNotification("Edit Notice", formatApiError(err), "error");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setIsGenerativeLoading(false);
      setLoadingStage("");
    }
  };

  // Undo Generative Edit
  const handleUndoGenerative = () => {
    if (historyIdx > 0) {
      const newIdx = historyIdx - 1;
      setHistoryIdx(newIdx);
      setCurrentMediaUrl(generativeHistory[newIdx].url);
      addNotification("Undo", "Reverted to previous edit state.", "info");
    }
  };

  // Redo Generative Edit
  const handleRedoGenerative = () => {
    if (historyIdx < generativeHistory.length - 1) {
      const newIdx = historyIdx + 1;
      setHistoryIdx(newIdx);
      setCurrentMediaUrl(generativeHistory[newIdx].url);
      addNotification("Redo", "Restored forward edit state.", "info");
    }
  };

  // Reset to Original
  const handleResetToOriginal = () => {
    setCurrentMediaUrl(originalMediaUrl);
    setFilters(DEFAULT_FILTERS);
    setAiSummary(null);
    if (generativeHistory.length > 0) {
      setHistoryIdx(0);
    }
    addNotification("Reset", "Restored initial uploaded photo.", "info");
  };

  // Run Color Grade / Shader Transformation
  const handleColorGradeTransform = async (customPrompt?: string) => {
    const targetPrompt = customPrompt || colorGradePrompt;
    if (!targetPrompt.trim()) return;

    setIsColorProcessing(true);
    setColorGradePrompt(targetPrompt);

    if (user && user.aiCreditsRemaining >= 5) {
      updateProfile({ aiCreditsRemaining: user.aiCreditsRemaining - 5 });
    }

    try {
      const res = await apiFetch("/api/ai/transform-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: targetPrompt,
          mediaType,
          currentMediaUrl: currentMediaUrl,
          mode: "color_grade",
        }),
      });

      const { ok, data } = await safeApiJson(res);

      if (data?.cssFilters) {
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
            : "#ef4444",
          tintOpacity: data.colorOverlay?.opacity || 0.35,
          blendMode: data.colorOverlay?.blendMode || "color",
        });
      }

      setAiSummary(data?.summary || `Applied grade: "${targetPrompt}"`);
      addNotification("Color Grade Applied", `Successfully updated colors: "${targetPrompt}".`, "success");
    } catch (err: any) {
      const lower = targetPrompt.toLowerCase();
      if (lower.includes("red")) {
        setFilters({
          ...DEFAULT_FILTERS,
          tintColor: "#ef4444",
          tintOpacity: 0.4,
          saturate: 160,
          hueRotate: 350,
        });
      } else if (lower.includes("blue") || lower.includes("cyan")) {
        setFilters({
          ...DEFAULT_FILTERS,
          tintColor: "#0ea5e9",
          tintOpacity: 0.4,
          saturate: 150,
          hueRotate: 190,
        });
      } else if (lower.includes("green")) {
        setFilters({
          ...DEFAULT_FILTERS,
          tintColor: "#22c55e",
          tintOpacity: 0.4,
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
      setIsColorProcessing(false);
    }
  };

  // Send transformed media straight to Editor Timeline
  const handleAddToTimeline = () => {
    const mainTrack = project.tracks.find((t) => t.type === "main") || project.tracks[0];
    if (!mainTrack) return;

    addClipToTrack(mainTrack.id, {
      type: mediaType,
      name: `AI Edit: ${mediaName.slice(0, 16)}`,
      mediaUrl: currentMediaUrl,
      thumbnailUrl: currentMediaUrl,
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
    addNotification("Sent to Timeline", "Transformed clip added to video track.", "success");
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
      link.download = `novacut-edited-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      addNotification("Downloaded", "Edited image saved to your device.", "success");
    };
    img.src = currentMediaUrl;
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
            AI Photo & Video Transformer
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Upload your photo to change backgrounds, insert objects, apply generative styling, or perform live shader color grading.
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-all shadow-lg shadow-sky-500/20 active:scale-95"
          >
            <Upload className="w-4 h-4" />
            Upload Photo / Video
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <button
          onClick={() => setTransformMode("generative")}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            transformMode === "generative"
              ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25"
              : "bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          ✨ AI Generative Image Editing (Backgrounds, Objects, Clothing)
        </button>

        <button
          onClick={() => setTransformMode("color_grade")}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            transformMode === "color_grade"
              ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25"
              : "bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
          }`}
        >
          <Palette className="w-4 h-4 text-sky-400" />
          🎨 Color Grading & Shader VFX
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Before / After Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Visual Comparison
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 font-mono">
                {mediaDimensions}
              </span>
              {generativeHistory.length > 1 && (
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[11px] font-semibold">
                  Edit Version {historyIdx + 1}/{generativeHistory.length}
                </span>
              )}
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
                Output Only
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
                    <video src={originalMediaUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                  ) : (
                    <img src={originalMediaUrl} alt="Original" className="w-full h-full object-cover" crossOrigin="anonymous" />
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
                      src={currentMediaUrl}
                      className="w-full h-full object-cover"
                      style={{ filter: cssFilterString }}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={currentMediaUrl}
                      alt="Transformed"
                      className="w-full h-full object-cover"
                      style={{ filter: transformMode === "color_grade" ? cssFilterString : undefined }}
                      crossOrigin="anonymous"
                    />
                  )}

                  {/* Tint Overlay for color grade mode */}
                  {transformMode === "color_grade" && filters.tintOpacity > 0 && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundColor: filters.tintColor,
                        opacity: filters.tintOpacity,
                        mixBlendMode: filters.blendMode as any,
                      }}
                    />
                  )}

                  <div className="absolute top-3 right-3 bg-sky-500/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-bold text-white tracking-wider shadow-lg flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    AI RESULT
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
                    <video src={originalMediaUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                  ) : (
                    <img src={originalMediaUrl} alt="Original" className="w-full h-full object-cover" crossOrigin="anonymous" />
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-slate-300 font-bold">
                    Original
                  </div>
                </div>
                <div className="relative">
                  {mediaType === "video" ? (
                    <video
                      src={currentMediaUrl}
                      className="w-full h-full object-cover"
                      style={{ filter: cssFilterString }}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={currentMediaUrl}
                      alt="Transformed"
                      className="w-full h-full object-cover"
                      style={{ filter: transformMode === "color_grade" ? cssFilterString : undefined }}
                      crossOrigin="anonymous"
                    />
                  )}
                  {transformMode === "color_grade" && filters.tintOpacity > 0 && (
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
                    AI Output
                  </div>
                </div>
              </div>
            ) : (
              // Output only view
              <div className="relative w-full h-full">
                {mediaType === "video" ? (
                  <video
                    src={currentMediaUrl}
                    className="w-full h-full object-cover"
                    style={{ filter: cssFilterString }}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={currentMediaUrl}
                    alt="Transformed"
                    className="w-full h-full object-cover"
                    style={{ filter: transformMode === "color_grade" ? cssFilterString : undefined }}
                    crossOrigin="anonymous"
                  />
                )}
                {transformMode === "color_grade" && filters.tintOpacity > 0 && (
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

            {/* High-Fidelity Generative Loading Overlay & Scanning Effect */}
            {isGenerativeLoading && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center gap-5 z-30 p-6 text-center select-none">
                {/* Precision scanning grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e915_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e915_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none animate-pulse" />
                
                {/* Sweeping laser beam */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_20px_#38bdf8] pointer-events-none top-1/2 animate-bounce" />

                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-sky-400 animate-[spin_8s_linear_infinite] flex items-center justify-center shadow-lg shadow-sky-500/20" />
                  <div className="absolute inset-2 rounded-xl bg-gradient-to-tr from-sky-600/40 to-indigo-600/40 border border-sky-300/60 flex items-center justify-center backdrop-blur-md animate-pulse">
                    <Sparkles className="w-6 h-6 text-sky-200 animate-spin" style={{ animationDuration: "4s" }} />
                  </div>
                </div>

                <div className="relative z-10 space-y-2 max-w-sm">
                  <h4 className="text-sm font-black tracking-wide text-white flex items-center justify-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
                    <span>AI Generative Photo Modification</span>
                  </h4>
                  <div className="px-3.5 py-1.5 rounded-xl bg-sky-950/80 border border-sky-500/40 text-xs text-sky-300 font-mono shadow-inner">
                    {loadingStage || "Synthesizing pixels with Gemini Multimodal..."}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* History Undo / Redo / Reset Toolbar */}
          <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handleUndoGenerative}
                disabled={historyIdx <= 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-all"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Undo Edit
              </button>
              <button
                onClick={handleRedoGenerative}
                disabled={historyIdx >= generativeHistory.length - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-all"
              >
                <Redo2 className="w-3.5 h-3.5" />
                Redo
              </button>
              <button
                onClick={handleResetToOriginal}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 hover:text-rose-300 text-slate-300 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Original
              </button>
            </div>

            <span className="text-[11px] text-slate-400">
              Chained edits build seamlessly upon each new result
            </span>
          </div>

          {/* Sample Media Selector */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-slate-400">Try with Sample Creator Photos:</span>
            <div className="grid grid-cols-4 gap-2">
              {SAMPLE_MEDIA.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setMediaType(item.type);
                    setOriginalMediaUrl(item.url);
                    setCurrentMediaUrl(item.url);
                    setMediaName(item.name);
                    setGenerativeHistory([
                      { url: item.url, prompt: item.name, timestamp: "Selected Sample" },
                    ]);
                    setHistoryIdx(0);
                    setFilters(DEFAULT_FILTERS);
                  }}
                  className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all group ${
                    currentMediaUrl === item.url ? "border-sky-500 shadow-md shadow-sky-500/20" : "border-slate-800 opacity-70 hover:opacity-100"
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

        {/* Right Column: AI Prompt & Precision Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {transformMode === "generative" ? (
            /* Mode 1: Generative AI Editing */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-sky-400" />
                  AI Image Edit Instruction
                </label>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono font-bold">
                  5 AI Credits
                </span>
              </div>

              <div className="relative">
                <textarea
                  value={generativePrompt}
                  onChange={(e) => setGenerativePrompt(e.target.value)}
                  placeholder="e.g. Change the background to a tropical beach at sunset and add an adorable cat..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
                />
              </div>

              <button
                onClick={() => handleExecuteGenerativeEdit()}
                disabled={isGenerativeLoading || !generativePrompt.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
              >
                {isGenerativeLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Executing Image-to-Image AI Edit...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Transform Photo with AI
                  </>
                )}
              </button>

              {/* Aspect Ratio Selector */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span className="font-semibold">Target Output Aspect Ratio:</span>
                  <span className="font-mono text-sky-400">{editAspectRatio}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {(["16:9", "9:16", "1:1", "4:3", "3:4"] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setEditAspectRatio(ratio)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                        editAspectRatio === ratio
                          ? "bg-sky-600/30 border-sky-500 text-sky-300 shadow-sm"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generative Inspiration Preset Categories */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Image-to-Image Presets:
                  </span>
                </div>

                {/* Category Tabs */}
                <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {GENERATIVE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold truncate transition-all ${
                        activeCategory === cat.id
                          ? "bg-slate-800 text-sky-300 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Presets in active category */}
                <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {(
                    GENERATIVE_CATEGORIES.find((c) => c.id === activeCategory)?.presets ||
                    GENERATIVE_CATEGORIES[0].presets
                  ).map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setGenerativePrompt(preset.prompt);
                        handleExecuteGenerativeEdit(preset.prompt);
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/80 text-left text-xs font-medium text-slate-200 transition-all group"
                    >
                      <span className="truncate pr-2">{preset.label}</span>
                      <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: Live Color Grading & Shader VFX */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-400" />
                  Smart Color Grade Prompt
                </label>
                <span className="text-[11px] text-purple-400 font-mono">Live Shader</span>
              </div>

              <div className="relative">
                <textarea
                  value={colorGradePrompt}
                  onChange={(e) => setColorGradePrompt(e.target.value)}
                  placeholder="e.g. Change this to red, make it cyberpunk neon with intense contrast..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
                />
              </div>

              <button
                onClick={() => handleColorGradeTransform()}
                disabled={isColorProcessing || !colorGradePrompt.trim()}
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
              >
                {isColorProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Computing Color Shaders...
                  </>
                ) : (
                  <>
                    <Palette className="w-4 h-4" />
                    Apply Color Grade: "{colorGradePrompt.slice(0, 20)}"
                  </>
                )}
              </button>

              {/* 1-Click Color Presets */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Color Presets:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_PROMPTS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleColorGradeTransform(preset.prompt)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-left text-xs font-medium text-slate-200 transition-all active:scale-95"
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: preset.color }} />
                      <span className="truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Precision Sliders */}
              <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
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
                    className="w-full accent-purple-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Color Tint Overlay</span>
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
              </div>
            </div>
          )}

          {/* Action Export Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleAddToTimeline}
              className="py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Add to Editor Timeline
            </button>

            <button
              onClick={handleDownload}
              className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
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
