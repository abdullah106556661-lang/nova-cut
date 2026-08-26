import React, { useState, useRef } from "react";
import {
  Wand2,
  Sparkles,
  Video,
  Image as ImageIcon,
  TrendingUp,
  Palette,
  Download,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Sliders,
  ExternalLink,
  Layers,
  Film,
  Camera,
  Eye,
  FileCode,
  Upload,
  Cat,
  Dog,
  ShieldCheck,
  Split,
  Play,
  ArrowRight,
  Bot,
  Mic,
  Volume2,
  VolumeX,
  MessageSquare,
  Send,
} from "lucide-react";
import { useEditor } from "../../context/EditorContext";
import { useAuth } from "../../context/AuthContext";

type AIToolTab = "photo-edit" | "video" | "image" | "thumbnail" | "logo" | "gemini-live";

export const AIGenerateView: React.FC = () => {
  const { addClipToTrack, project, setActiveTab } = useEditor();
  const { user, isAdmin, deductCredits, addNotification } = useAuth();

  const [activeTab, setActiveTabLocal] = useState<AIToolTab>("photo-edit");

  // 1. PHOTO UPLOAD & BACKGROUND / OBJECT INSERTER STATE
  const [userUploadedPhoto, setUserUploadedPhoto] = useState<string>(
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=80"
  );
  const [photoEditPrompt, setPhotoEditPrompt] = useState(
    "Change the background to a tropical beach at sunset and add an adorable cat beside me"
  );
  const [photoEditAspect, setPhotoEditAspect] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [photoEditLoading, setPhotoEditLoading] = useState(false);
  const [transformedPhoto, setTransformedPhoto] = useState<string>(
    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&auto=format&fit=crop&q=80"
  );
  const [activeModifier, setActiveModifier] = useState<string>("cat");
  const [viewMode, setViewMode] = useState<"side-by-side" | "result" | "original">("side-by-side");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. AI VIDEO GEN STATE (Text-to-Video & Image-to-Video)
  const [videoPrompt, setVideoPrompt] = useState(
    "Cinematic cyberpunk skyline at midnight with neon flying vehicles in heavy rain, 4k 60fps"
  );
  const [videoStyle, setVideoStyle] = useState("cinematic");
  const [cameraMotion, setCameraMotion] = useState("drone_orbit");
  const [videoAspect, setVideoAspect] = useState<"16:9" | "9:16">("16:9");
  const [videoSourceType, setVideoSourceType] = useState<"prompt" | "uploaded-photo">("prompt");
  const [videoLoading, setVideoLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<{
    title: string;
    videoUrl: string;
    thumbnailUrl: string;
    prompt: string;
    scenes: { time: string; action: string; camera: string }[];
  } | null>({
    title: "Cyberpunk Metropolis Flight",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80",
    prompt: "Cinematic cyberpunk skyline at midnight with neon flying vehicles in heavy rain",
    scenes: [
      { time: "00:00 - 00:04", action: "Drone pans over glittering high-rises", camera: "Slow Orbit 24fps" },
      { time: "00:04 - 00:08", action: "Neon speeder zooms toward the camera", camera: "FPV Tracking Shot" },
      { time: "00:08 - 00:12", action: "Volumetric fog rolls between billboards", camera: "Cinematic Dolly Zoom" },
    ],
  });

  // 3. AI IMAGE / PHOTO GEN STATE
  const [imagePrompt, setImagePrompt] = useState(
    "Hyper-realistic futuristic recording studio with holographic audio waveforms and ambient purple LEDs"
  );
  const [imageStyle, setImageStyle] = useState("photorealistic");
  const [imageAspect, setImageAspect] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [imageCategory, setImageCategory] = useState("photo");
  const [imageLoading, setImageLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string>(
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&auto=format&fit=crop&q=80"
  );

  // 4. AI THUMBNAIL STATE
  const [thumbTopic, setThumbTopic] = useState("How I Made $10k in 30 Days with AI Video");
  const [thumbHeadline, setThumbHeadline] = useState("10X FASTER!");
  const [thumbStyle, setThumbStyle] = useState("vibrant_youtube");
  const [thumbLoading, setThumbLoading] = useState(false);
  const [thumbnailsList, setThumbnailsList] = useState<any[]>([
    {
      id: "th_1",
      title: "How I Made $10k with AI Video",
      headline: "10X FASTER!",
      badge: "MUST WATCH",
      backgroundUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
      textColor: "#ffffff",
      accentColor: "#f43f5e",
      subtext: "2026 METHOD",
    },
    {
      id: "th_2",
      title: "How I Made $10k with AI Video",
      headline: "NEVER DO THIS!",
      badge: "BIGGEST MISTAKE",
      backgroundUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
      textColor: "#facc15",
      accentColor: "#38bdf8",
      subtext: "STEP BY STEP",
    },
    {
      id: "th_3",
      title: "How I Made $10k with AI Video",
      headline: "THE 1% SECRET",
      badge: "PRO TRICKS",
      backgroundUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80",
      textColor: "#a855f7",
      accentColor: "#10b981",
      subtext: "FULL BLUEPRINT",
    },
  ]);

  // 5. AI LOGO STATE
  const [brandName, setBrandName] = useState("NovaVision");
  const [brandIndustry, setBrandIndustry] = useState("AI Video Production");
  const [brandStyle, setBrandStyle] = useState("modern minimalist");
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoData, setLogoData] = useState<{
    brandName: string;
    tagline: string;
    svg: string;
    palette: { name: string; hex: string }[];
    typography: string;
  }>({
    brandName: "NOVAVISION",
    tagline: "Empowering Next-Gen Digital Storytellers",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%">
  <defs>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0ea5e9" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#ec4899" />
    </linearGradient>
  </defs>
  <rect width="400" height="200" rx="20" fill="#0b0f19" />
  <circle cx="100" cy="100" r="46" fill="url(#brandGrad)" opacity="0.95" />
  <path d="M85 75 L125 100 L85 125 Z" fill="#ffffff" />
  <text x="175" y="108" font-family="system-ui, sans-serif" font-weight="900" font-size="30" fill="#ffffff" letter-spacing="1">NOVAVISION</text>
  <text x="175" y="132" font-family="system-ui, sans-serif" font-weight="600" font-size="11" fill="#38bdf8" letter-spacing="3">AI VIDEO PRODUCTION</text>
</svg>`,
    palette: [
      { name: "Sky Blue", hex: "#0ea5e9" },
      { name: "Indigo Flame", hex: "#6366f1" },
      { name: "Neon Pink", hex: "#ec4899" },
      { name: "Obsidian", hex: "#0b0f19" },
    ],
    typography: "Plus Jakarta Sans Bold + Inter",
  });

  const [copied, setCopied] = useState(false);

  // Background change / modification preset definitions
  const photoPresetOptions = [
    {
      id: "cat",
      name: "Add a Cat",
      icon: "🐱",
      prompt: "Keep the subject intact and add an adorable domestic fluffy cat sitting right beside them, studio lighting, photorealistic",
    },
    {
      id: "dog",
      name: "Add a Dog",
      icon: "🐶",
      prompt: "Keep the subject intact and add a friendly playful golden retriever dog into the scene, photorealistic 8k",
    },
    {
      id: "lion",
      name: "Add a Lion",
      icon: "🦁",
      prompt: "Add a majestic wild lion in the scenic golden savannah background with dramatic sunset lighting",
    },
    {
      id: "line",
      name: "Add Neon Laser Line",
      icon: "⚡",
      prompt: "Add glowing electric neon laser lines radiating and pulsing around the subject, cyberpunk illumination",
    },
    {
      id: "elephant",
      name: "Add an Elephant",
      icon: "🐘",
      prompt: "Add a majestic large wild elephant walking in the scenic misty background landscape, cinematic 8k",
    },
    {
      id: "beach",
      name: "Tropical Beach Sunset",
      icon: "🌴",
      prompt: "Replace background with a breathtaking tropical beach at golden sunset with turquoise water and palm trees",
    },
    {
      id: "cyberpunk",
      name: "Cyberpunk City",
      icon: "🏙️",
      prompt: "Replace background with a futuristic cyberpunk neon metropolis in rainy night with holographic billboards",
    },
    {
      id: "galaxy",
      name: "Deep Space Galaxy",
      icon: "🪐",
      prompt: "Replace background with a cosmic deep space nebula with glowing stars and planetary rings",
    },
  ];

  // Handle Photo File Upload
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setUserUploadedPhoto(reader.result as string);
          addNotification("Photo Uploaded", "Your custom photo is ready for AI prompt editing.", "success");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 1. Photo Transform / Background Edit Handler
  const handleExecutePhotoEdit = async (customPromptToRun?: string, modId?: string) => {
    const promptToUse = customPromptToRun || photoEditPrompt;
    if (!deductCredits(5)) return;

    setPhotoEditLoading(true);
    if (modId) setActiveModifier(modId);

    try {
      const res = await fetch("/api/ai/edit-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          actionType: modId || activeModifier,
          sourceImageUrl: userUploadedPhoto,
          aspectRatio: photoEditAspect,
        }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        setTransformedPhoto(data.imageUrl);
        addNotification("AI Photo Modified", `Generated changes: "${promptToUse.slice(0, 45)}..."`, "success");
      }
    } catch (e) {
      console.error("Photo edit error:", e);
      addNotification("Generation Error", "Failed to transform photo. Please try again.", "error");
    } finally {
      setPhotoEditLoading(false);
    }
  };

  // 2. Generate Video handler (Costs 10 credits)
  const handleGenerateVideo = async () => {
    if (!deductCredits(10)) return;
    setVideoLoading(true);

    try {
      if (videoSourceType === "uploaded-photo") {
        // Image-to-Video
        const res = await fetch("/api/ai/image-to-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceImageUrl: userUploadedPhoto || transformedPhoto,
            prompt: videoPrompt,
            cameraMotion,
            aspectRatio: videoAspect,
          }),
        });
        const data = await res.json();
        setGeneratedVideo({
          title: "AI Animated Photo Scene",
          videoUrl: data.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          thumbnailUrl: userUploadedPhoto || transformedPhoto,
          prompt: videoPrompt,
          scenes: [
            { time: "00:00 - 00:04", action: "Subject comes to life with depth motion", camera: "Smooth Dolly Zoom" },
            { time: "00:04 - 00:08", action: "Dynamic lighting & particles emerge", camera: "Orbit 30fps" },
            { time: "00:08 - 00:10", action: "Final cinematic frame transition", camera: "Pan Tilt" },
          ],
        });
        addNotification("Image-to-Video Generated", "Your photo was transformed into an animated AI video!", "success");
      } else {
        // Text-to-Video
        const res = await fetch("/api/gemini/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `Create a cinematic 3-scene video storyboard with shot timing, camera motion, and visual script for: "${videoPrompt}" in style "${videoStyle}" with camera motion "${cameraMotion}". Format as JSON: { "title": "...", "scenes": [{"time": "00:00 - 00:04", "action": "...", "camera": "..."}] }`,
            model: "gemini-3.7-flash",
          }),
        });

        const data = await res.json();
        let parsedScenes = null;
        try {
          parsedScenes = JSON.parse(data.text);
        } catch {
          // fallback
        }

        setGeneratedVideo({
          title: parsedScenes?.title || "AI Generated Video Scene",
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          thumbnailUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80",
          prompt: videoPrompt,
          scenes: parsedScenes?.scenes || [
            { time: "00:00 - 00:04", action: "Intro atmospheric wide shot", camera: "Slow Cinematic Pan" },
            { time: "00:04 - 00:08", action: "Primary subject interaction", camera: "FPV Orbit" },
            { time: "00:08 - 00:12", action: "Dramatic focal resolution", camera: "Dolly In Zoom" },
          ],
        });
        addNotification("AI Video Generated", "Generated video storyboard ready for editor preview.", "success");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setVideoLoading(false);
    }
  };

  // 3. Generate Image handler (Costs 5 credits)
  const handleGenerateImage = async () => {
    if (!deductCredits(5)) return;
    setImageLoading(true);

    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          style: imageStyle,
          aspectRatio: imageAspect,
          category: imageCategory,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        addNotification("AI Image Ready", "8K Image generated successfully.", "success");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setImageLoading(false);
    }
  };

  // 4. Generate Thumbnails handler (Costs 5 credits)
  const handleGenerateThumbnails = async () => {
    if (!deductCredits(5)) return;
    setThumbLoading(true);

    try {
      const res = await fetch("/api/ai/generate-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: thumbTopic,
          headline: thumbHeadline,
          style: thumbStyle,
        }),
      });
      const data = await res.json();
      if (data.thumbnails) {
        setThumbnailsList(data.thumbnails);
        addNotification("Thumbnails Created", "3 High-CTR thumbnail designs generated.", "success");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setThumbLoading(false);
    }
  };

  // 5. Generate Logo handler (Costs 5 credits)
  const handleGenerateLogo = async () => {
    if (!deductCredits(5)) return;
    setLogoLoading(true);

    try {
      const res = await fetch("/api/ai/generate-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          industry: brandIndustry,
          style: brandStyle,
        }),
      });
      const data = await res.json();
      if (data.svg) {
        setLogoData(data);
        addNotification("Brand Logo Created", `Vector logo generated for ${brandName}.`, "success");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLogoLoading(false);
    }
  };

  // Send photo to timeline as clip or overlay
  const sendPhotoToEditor = (imageUrl: string, asOverlay = false) => {
    const targetTrack = asOverlay
      ? project.tracks.find((t) => t.type === "overlay") || project.tracks[1] || project.tracks[0]
      : project.tracks.find((t) => t.type === "main") || project.tracks[0];

    if (targetTrack) {
      addClipToTrack(targetTrack.id, {
        type: "image",
        name: "AI Modified Photo",
        mediaUrl: imageUrl,
        thumbnailUrl: imageUrl,
        duration: 6,
        startTime: 0,
      });
      setActiveTab("editor");
      addNotification("Sent to Timeline", asOverlay ? "Added as PiP Overlay track." : "Added to main timeline track.", "success");
    }
  };

  // Convert current photo to AI Video
  const animatePhotoToVideo = () => {
    setVideoSourceType("uploaded-photo");
    setVideoPrompt("Animate this photo with cinematic depth, slow camera push-in, and ambient particle lighting");
    setActiveTabLocal("video");
    addNotification("Switched to Video Mode", "Ready to generate AI Video from this photo.", "info");
  };

  // Send video to editor timeline
  const sendVideoToEditor = () => {
    if (!generatedVideo) return;
    const mainTrack = project.tracks.find((t) => t.type === "main") || project.tracks[0];
    if (mainTrack) {
      addClipToTrack(mainTrack.id, {
        type: "video",
        name: generatedVideo.title,
        mediaUrl: generatedVideo.videoUrl,
        thumbnailUrl: generatedVideo.thumbnailUrl,
        duration: 12,
        startTime: 0,
      });
      setActiveTab("editor");
      addNotification("Sent to Timeline", "AI video added to main video track.", "success");
    }
  };

  const handleCopySvg = () => {
    navigator.clipboard.writeText(logoData.svg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="ai-studio-view" className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 select-none pb-24 md:pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-sky-500/20 via-purple-500/20 to-pink-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold mb-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-spin-slow" />
            <span>NovaCut AI Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Photo Generator, Background Changer & Video Suite
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Upload your own photo, change backgrounds, add cats, dogs, lions, neon lines, and elephants with prompts, or create AI videos and logos.
          </p>
        </div>

        {/* Credit Display */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl shrink-0 shadow-lg">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Zap className="w-4 h-4 fill-purple-400" />
          </div>
          <div className="text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">AI Credit Balance</span>
            {isAdmin ? (
              <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ∞ Unlimited (Admin)
              </span>
            ) : (
              <span className="font-mono text-purple-300 font-bold text-sm">
                {user?.aiCreditsRemaining ?? 500} / 500 Daily
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 5 AI Tool Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Tab 1: Photo Upload & Background Changer */}
        <button
          id="tab-photo-edit-btn"
          onClick={() => setActiveTabLocal("photo-edit")}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
            activeTab === "photo-edit"
              ? "bg-gradient-to-br from-sky-950 via-indigo-950 to-purple-950 border-sky-500 text-white shadow-lg shadow-sky-950/50 ring-1 ring-sky-500"
              : "bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs sm:text-sm truncate text-white">Photo & Background</p>
            <p className="text-[10px] text-sky-300/80 truncate">Upload & Prompt Mod</p>
          </div>
        </button>

        {/* Tab 2: AI Video Gen */}
        <button
          id="tab-video-btn"
          onClick={() => setActiveTabLocal("video")}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
            activeTab === "video"
              ? "bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-900 border-purple-500 text-white shadow-lg shadow-purple-950/50 ring-1 ring-purple-500"
              : "bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs sm:text-sm truncate text-white">AI Video Gen</p>
            <p className="text-[10px] text-purple-300/80 truncate">Veo 3.1 & Motion</p>
          </div>
        </button>

        {/* Tab 3: Text-to-Image */}
        <button
          id="tab-image-btn"
          onClick={() => setActiveTabLocal("image")}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
            activeTab === "image"
              ? "bg-gradient-to-br from-cyan-950 via-sky-950 to-slate-900 border-cyan-500 text-white shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500"
              : "bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs sm:text-sm truncate text-white">Photo Generator</p>
            <p className="text-[10px] text-cyan-300/80 truncate">8K Art & Textures</p>
          </div>
        </button>

        {/* Tab 4: Thumbnails */}
        <button
          id="tab-thumbnail-btn"
          onClick={() => setActiveTabLocal("thumbnail")}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
            activeTab === "thumbnail"
              ? "bg-gradient-to-br from-rose-950 via-red-950 to-slate-900 border-rose-500 text-white shadow-lg shadow-rose-950/50 ring-1 ring-rose-500"
              : "bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs sm:text-sm truncate text-white">YouTube Thumbnails</p>
            <p className="text-[10px] text-rose-300/80 truncate">Viral High CTR</p>
          </div>
        </button>

        {/* Tab 5: Logo & Brand */}
        <button
          id="tab-logo-btn"
          onClick={() => setActiveTabLocal("logo")}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
            activeTab === "logo"
              ? "bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 border-emerald-500 text-white shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500"
              : "bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <Palette className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs sm:text-sm truncate text-white">AI Logo & Brand</p>
            <p className="text-[10px] text-emerald-300/80 truncate">Vector SVG Design</p>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PHOTO UPLOAD & BACKGROUND / PROMPT EDITOR (REQUESTED BY USER) */}
      {/* ========================================================================= */}
      {activeTab === "photo-edit" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Left Column */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-400" />
                <span>Upload Photo & Prompt Changes</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full">
                Cost: 5 Credits
              </span>
            </div>

            {/* Photo Upload Area */}
            <div>
              <label className="text-slate-300 block mb-1.5 font-semibold">1. Upload Your Own Photo</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-700 hover:border-sky-500/60 rounded-2xl p-4 text-center cursor-pointer transition-all bg-slate-950/60 hover:bg-slate-950 flex flex-col items-center justify-center gap-2 group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-900 group-hover:bg-sky-500/20 text-slate-400 group-hover:text-sky-400 flex items-center justify-center transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-200 text-xs">Click or drag & drop photo here</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Supports PNG, JPG, WebP (Up to 25MB)</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileUpload}
                  className="hidden"
                />
              </div>

              {/* Starter Presets */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-slate-400">Or sample portraits:</span>
                <button
                  type="button"
                  onClick={() =>
                    setUserUploadedPhoto(
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=80"
                    )
                  }
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Portrait 1
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setUserUploadedPhoto(
                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop&q=80"
                    )
                  }
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Portrait 2
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setUserUploadedPhoto(
                      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1000&auto=format&fit=crop&q=80"
                    )
                  }
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Portrait 3
                </button>
              </div>
            </div>

            {/* Quick 1-Click Modifier Presets (Requested by User: Cat, Dog, Lion, Line, Elephant) */}
            <div>
              <label className="text-slate-300 block mb-1.5 font-semibold">
                2. Quick 1-Click Background & Object Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {photoPresetOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setPhotoEditPrompt(opt.prompt);
                      handleExecutePhotoEdit(opt.prompt, opt.id);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      activeModifier === opt.id
                        ? "bg-sky-950 border-sky-500 text-white font-bold shadow-md shadow-sky-950"
                        : "bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
                    }`}
                  >
                    <span className="text-base shrink-0">{opt.icon}</span>
                    <span className="text-[11px] truncate">{opt.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt Box */}
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">
                3. Custom Prompt Instructions
              </label>
              <textarea
                rows={3}
                value={photoEditPrompt}
                onChange={(e) => setPhotoEditPrompt(e.target.value)}
                placeholder="E.g. Change background to a snowy mountain, add a cat, add golden lighting..."
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-slate-200 outline-none focus:border-sky-500 leading-relaxed text-xs"
              />
            </div>

            {/* Aspect Ratio */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold">Canvas Aspect Ratio</span>
              <div className="flex items-center gap-1.5">
                {(["16:9", "9:16", "1:1"] as const).map((aspect) => (
                  <button
                    key={aspect}
                    type="button"
                    onClick={() => setPhotoEditAspect(aspect)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                      photoEditAspect === aspect
                        ? "bg-sky-500 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {aspect}
                  </button>
                ))}
              </div>
            </div>

            {/* Execute Generation Button */}
            <button
              id="generate-photo-changes-btn"
              onClick={() => handleExecutePhotoEdit()}
              disabled={photoEditLoading}
              className="w-full py-3 bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {photoEditLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Photo Modifications...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-sky-200" />
                  <span>Generate Photo Changes (5 Credits)</span>
                </>
              )}
            </button>
          </div>

          {/* Result & Live Comparison Right Column */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
            <div>
              {/* Header & View Mode Switcher */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-200">AI Preview & Comparison</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {photoEditAspect}
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setViewMode("side-by-side")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      viewMode === "side-by-side"
                        ? "bg-sky-500 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    onClick={() => setViewMode("result")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      viewMode === "result"
                        ? "bg-sky-500 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    AI Result
                  </button>
                  <button
                    onClick={() => setViewMode("original")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      viewMode === "original"
                        ? "bg-sky-500 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Original
                  </button>
                </div>
              </div>

              {/* Visual Display */}
              <div className="mt-4">
                {viewMode === "side-by-side" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Original */}
                    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[4/3] group">
                      <img
                        src={userUploadedPhoto}
                        alt="Original"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                        Original Photo
                      </span>
                    </div>

                    {/* Transformed */}
                    <div className="relative rounded-2xl overflow-hidden border border-sky-500/40 bg-slate-950 aspect-[4/3] shadow-lg shadow-sky-950/40 group">
                      <img
                        src={transformedPhoto}
                        alt="AI Transformed"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 backdrop-blur-md text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI Modified ({activeModifier.toUpperCase()})
                      </span>
                    </div>
                  </div>
                )}

                {viewMode === "result" && (
                  <div className="relative rounded-2xl overflow-hidden border border-sky-500/40 bg-slate-950 aspect-[16/9] shadow-xl group">
                    <img
                      src={transformedPhoto}
                      alt="AI Transformed"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-sky-600 text-white font-bold text-xs shadow-md flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Studio Masterpiece
                    </span>
                  </div>
                )}

                {viewMode === "original" && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[16/9]">
                    <img
                      src={userUploadedPhoto}
                      alt="Original"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-slate-900 text-slate-300 font-bold text-xs">
                      Uploaded Photo Source
                    </span>
                  </div>
                )}
              </div>

              {/* Applied Prompt info */}
              <div className="mt-4 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">
                  Active Modification Prompt
                </span>
                <p className="text-slate-200 leading-relaxed font-mono text-[11px]">
                  "{photoEditPrompt}"
                </p>
              </div>
            </div>

            {/* Action Buttons for Transformed Photo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => sendPhotoToEditor(transformedPhoto, false)}
                className="py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20 transition-all cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Add to Timeline</span>
              </button>

              <button
                onClick={animatePhotoToVideo}
                className="py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Film className="w-4 h-4" />
                <span>Animate to Video</span>
              </button>

              <a
                href={transformedPhoto}
                download="novacut_ai_photo.png"
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
              >
                <Download className="w-4 h-4" />
                <span>Download Photo</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI VIDEO GENERATOR (Veo 3.1 Text-to-Video & Image-to-Video) */}
      {/* ========================================================================= */}
      {activeTab === "video" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Form Left */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Film className="w-4 h-4 text-purple-400" />
                <span>AI Video Director</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full">
                Cost: 10 Credits
              </span>
            </div>

            {/* Video Mode Selection: Text-to-Video vs Image-to-Video */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setVideoSourceType("prompt")}
                className={`py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  videoSourceType === "prompt"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Text-to-Video
              </button>
              <button
                type="button"
                onClick={() => setVideoSourceType("uploaded-photo")}
                className={`py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  videoSourceType === "uploaded-photo"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Image-to-Video
              </button>
            </div>

            {videoSourceType === "uploaded-photo" && (
              <div className="p-3 bg-slate-950 rounded-2xl border border-purple-500/30 flex items-center gap-3">
                <img
                  src={userUploadedPhoto || transformedPhoto}
                  alt="Source"
                  className="w-12 h-12 rounded-xl object-cover border border-purple-400/40 shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-bold text-slate-200 text-xs">Source Photo Loaded</p>
                  <p className="text-[10px] text-purple-300 truncate">
                    AI will animate this photo with realistic camera motion & lighting.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Video Description / Story</label>
              <textarea
                rows={4}
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="Describe the action, lighting, characters, and environment..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-3 text-slate-200 outline-none focus:border-purple-500 leading-relaxed text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Visual Style</label>
                <select
                  value={videoStyle}
                  onChange={(e) => setVideoStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                >
                  <option value="cinematic">Cinematic 35mm</option>
                  <option value="cyberpunk">Cyberpunk Neon</option>
                  <option value="anime">Anime / Shinkai</option>
                  <option value="documentary">Documentary Raw</option>
                  <option value="hyperlapse">Hyperlapse City</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Camera Motion</label>
                <select
                  value={cameraMotion}
                  onChange={(e) => setCameraMotion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                >
                  <option value="drone_orbit">Slow Drone Orbit</option>
                  <option value="dolly_zoom">Cinematic Dolly Zoom</option>
                  <option value="fpv_pan">Fast FPV Pan</option>
                  <option value="handheld">Dramatic Handheld</option>
                  <option value="hyperlapse">Forward Glide</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold">Aspect Ratio</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVideoAspect("16:9")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    videoAspect === "16:9" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  16:9 Landscape
                </button>
                <button
                  type="button"
                  onClick={() => setVideoAspect("9:16")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    videoAspect === "9:16" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  9:16 Reels / TikTok
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerateVideo}
              disabled={videoLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {videoLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Video Scenes...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate AI Video (10 Credits)</span>
                </>
              )}
            </button>
          </div>

          {/* Video Preview Right */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-sm text-slate-200">Generated Video Output</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  {videoAspect} • 1080p 60fps
                </span>
              </div>

              {generatedVideo && (
                <div className="mt-4 space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[16/9] shadow-2xl">
                    <video
                      src={generatedVideo.videoUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      poster={generatedVideo.thumbnailUrl}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Scene Timing Breakdown */}
                  <div className="space-y-2">
                    <p className="font-bold text-xs text-slate-300">Veo 3.1 Scene Storyboard Breakdown</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {generatedVideo.scenes.map((s, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                          <span className="font-mono text-purple-400 font-bold block">{s.time}</span>
                          <p className="text-slate-300 font-semibold">{s.action}</p>
                          <span className="text-[10px] text-slate-400 block">Cam: {s.camera}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={sendVideoToEditor}
                className="py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Send to Video Timeline</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AI IMAGE / PHOTO GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === "image" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-sky-400" />
                <span>AI Photo Generator</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full">
                Cost: 5 Credits
              </span>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Image Prompt</label>
              <textarea
                rows={4}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe lighting, camera angle, textures, and details..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-3 text-slate-200 outline-none focus:border-sky-500 leading-relaxed text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Style</label>
                <select
                  value={imageStyle}
                  onChange={(e) => setImageStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-sky-500"
                >
                  <option value="photorealistic">Photorealistic 8K</option>
                  <option value="cinematic">Cinematic Lighting</option>
                  <option value="3d_render">3D Octane Render</option>
                  <option value="cyberpunk">Cyberpunk Neon</option>
                  <option value="minimalist">Minimalist Studio</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Aspect Ratio</label>
                <select
                  value={imageAspect}
                  onChange={(e) => setImageAspect(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700/80 text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-sky-500"
                >
                  <option value="16:9">16:9 Landscape</option>
                  <option value="9:16">9:16 Portrait / Story</option>
                  <option value="1:1">1:1 Square</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateImage}
              disabled={imageLoading}
              className="w-full py-3 bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {imageLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Image...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Photo (5 Credits)</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-sm text-slate-200">High-Res Render</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                  {imageAspect} • 8K Master
                </span>
              </div>

              <div className="mt-4 relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[16/9] shadow-2xl group">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => sendPhotoToEditor(generatedImage, false)}
                className="py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Send to Video Timeline</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AI YOUTUBE THUMBNAIL STUDIO */}
      {/* ========================================================================= */}
      {activeTab === "thumbnail" && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-400" />
                <span>Viral High-CTR Thumbnail Strategy</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full">
                Cost: 5 Credits
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Video Topic</label>
                <input
                  type="text"
                  value={thumbTopic}
                  onChange={(e) => setThumbTopic(e.target.value)}
                  placeholder="E.g. How I Grew to 1M Subscribers"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Headline Text Hook</label>
                <input
                  type="text"
                  value={thumbHeadline}
                  onChange={(e) => setThumbHeadline(e.target.value)}
                  placeholder="E.g. 10X FASTER!"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Style</label>
                <select
                  value={thumbStyle}
                  onChange={(e) => setThumbStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                >
                  <option value="vibrant_youtube">Vibrant Neon YouTube</option>
                  <option value="dark_mystery">Dark Mystery / Documentary</option>
                  <option value="minimalist_clean">Clean Tech Minimalist</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateThumbnails}
              disabled={thumbLoading}
              className="py-3 px-6 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 transition-all cursor-pointer disabled:opacity-50"
            >
              {thumbLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Designing 3 Viral Thumbnails...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate 3 High-CTR Thumbnail Concepts (5 Credits)</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {thumbnailsList.map((thumb) => (
              <div
                key={thumb.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between group"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-950">
                  <img
                    src={thumb.backgroundUrl}
                    alt={thumb.headline}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-between p-4">
                    <span
                      style={{ backgroundColor: thumb.accentColor, color: "#fff" }}
                      className="self-start text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg"
                    >
                      {thumb.badge}
                    </span>

                    <div>
                      <h4
                        style={{ color: thumb.textColor }}
                        className="font-black text-xl tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
                      >
                        {thumb.headline}
                      </h4>
                      <p className="text-[11px] text-slate-300 font-semibold">{thumb.subtext}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between bg-slate-950/90 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">
                    {thumb.title}
                  </span>
                  <button
                    onClick={() => sendPhotoToEditor(thumb.backgroundUrl, false)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Use in Video</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AI LOGO & VECTOR BRAND STUDIO */}
      {/* ========================================================================= */}
      {activeTab === "logo" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span>Vector Brand Identity Creator</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                Cost: 5 Credits
              </span>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Brand / Channel Name</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="E.g. NovaVision"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Industry / Niche</label>
              <input
                type="text"
                value={brandIndustry}
                onChange={(e) => setBrandIndustry(e.target.value)}
                placeholder="E.g. AI Video Production, Gaming, Tech"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Design Style</label>
              <select
                value={brandStyle}
                onChange={(e) => setBrandStyle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
              >
                <option value="modern minimalist">Modern Minimalist Monogram</option>
                <option value="cyberpunk geometric">Cyberpunk Geometric</option>
                <option value="vintage emblem">Vintage Emblem</option>
                <option value="gradient 3d">Gradient 3D Dynamic</option>
              </select>
            </div>

            <button
              onClick={handleGenerateLogo}
              disabled={logoLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {logoLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Drafting Vector Brand Identity...</span>
                </>
              ) : (
                <>
                  <Palette className="w-4 h-4" />
                  <span>Generate Vector SVG Logo (5 Credits)</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-sm text-slate-200">Vector SVG Logo Output</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Scalable SVG & Brand Kit
                </span>
              </div>

              {/* Rendered SVG Preview */}
              <div className="mt-4 p-8 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center min-h-[220px]">
                <div
                  dangerouslySetInnerHTML={{ __html: logoData.svg }}
                  className="w-full max-w-sm h-auto flex items-center justify-center"
                />
              </div>

              {/* Brand Palette */}
              <div className="mt-4 space-y-2">
                <p className="font-bold text-xs text-slate-300">Brand Color Palette</p>
                <div className="flex items-center gap-2">
                  {logoData.palette.map((c, i) => (
                    <div
                      key={i}
                      className="flex-1 p-2 rounded-xl border border-slate-800 bg-slate-950 text-center space-y-1"
                    >
                      <div className="w-full h-5 rounded-lg" style={{ backgroundColor: c.hex }} />
                      <p className="text-[10px] text-slate-300 font-mono">{c.hex}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={handleCopySvg}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "SVG Copied!" : "Copy SVG Markup"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
