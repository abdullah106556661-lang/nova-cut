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
  Undo2,
  Redo2,
  RotateCcw,
  Trash2,
  FileImage,
  SlidersHorizontal,
  ArrowUpCircle,
  CheckCircle2,
  ClipboardPaste,
} from "lucide-react";
import { useEditor } from "../../context/EditorContext";
import { useAuth } from "../../context/AuthContext";
import { apiFetch, safeApiJson, formatApiError } from "../../utils/api";

type AIToolTab = "photo-edit" | "video" | "image" | "thumbnail" | "logo" | "prompt-studio" | "gemini-live";

interface PhotoHistoryItem {
  url: string;
  prompt: string;
  timestamp: string;
  aspect: string;
}

export const AIGenerateView: React.FC = () => {
  const { addClipToTrack, project, setActiveTab } = useEditor();
  const { user, isAdmin, deductCredits, addNotification } = useAuth();

  const [activeTab, setActiveTabLocal] = useState<AIToolTab>("photo-edit");

  // 1. PHOTO UPLOAD & BACKGROUND / OBJECT INSERTER STATE
  const [userUploadedPhoto, setUserUploadedPhoto] = useState<string | null>(null);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    name: string;
    size: string;
    type: string;
    dimensions: string;
  } | null>(null);

  const [photoEditPrompt, setPhotoEditPrompt] = useState(
    "Change the background to a tropical beach at sunset and add an adorable cat beside me"
  );
  const [photoEditAspect, setPhotoEditAspect] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [photoEditLoading, setPhotoEditLoading] = useState(false);
  const [transformedPhoto, setTransformedPhoto] = useState<string | null>(null);
  const [activeModifier, setActiveModifier] = useState<string>("custom");
  const [viewMode, setViewMode] = useState<"side-by-side" | "slider" | "result" | "original">("side-by-side");
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [chainEditsMode, setChainEditsMode] = useState<boolean>(true);

  // Photo Undo/Redo/Reset history stack
  const [photoHistory, setPhotoHistory] = useState<PhotoHistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activePhotoRequestIdRef = useRef<string>("");

  // 2. AI VIDEO GEN STATE (Text-to-Video & Image-to-Video)
  const [videoPrompt, setVideoPrompt] = useState(
    "Cinematic cyberpunk skyline at midnight with neon flying vehicles in heavy rain, 4k 60fps"
  );
  const [videoStyle, setVideoStyle] = useState("cinematic");
  const [cameraMotion, setCameraMotion] = useState("drone_orbit");
  const [videoAspect, setVideoAspect] = useState<"16:9" | "9:16">("16:9");
  const [videoSourceType, setVideoSourceType] = useState<"prompt" | "uploaded-photo">("prompt");
  const [videoUploadedPhoto, setVideoUploadedPhoto] = useState<string | null>(null);
  const [videoUploadedFileInfo, setVideoUploadedFileInfo] = useState<{
    name: string;
    size: string;
    dimensions: string;
  } | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const [generatedVideo, setGeneratedVideo] = useState<{
    title: string;
    videoUrl: string;
    thumbnailUrl: string;
    prompt: string;
    scenes: { time: string; action: string; camera: string }[];
  } | null>({
    title: "Cyberpunk Metropolis Flight",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80",
    prompt: "Cinematic cyberpunk skyline at midnight with neon flying vehicles in heavy rain",
    scenes: [
      { time: "00:00 - 00:04", action: "Drone pans over glittering high-rises", camera: "Slow Orbit 24fps" },
      { time: "00:04 - 00:08", action: "Neon speeder zooms toward the camera", camera: "FPV Tracking Shot" },
      { time: "00:08 - 00:12", action: "Volumetric fog rolls between billboards", camera: "Cinematic Dolly Zoom" },
    ],
  });

  // 3. AI IMAGE / PHOTO GEN STATE (Text-to-Image & Image-to-Image / Photo Enhancement)
  const [imagePrompt, setImagePrompt] = useState(
    "Hyper-realistic futuristic recording studio with holographic audio waveforms and ambient purple LEDs"
  );
  const [imageStyle, setImageStyle] = useState("photorealistic");
  const [imageAspect, setImageAspect] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [imageCategory, setImageCategory] = useState("photo");
  const [imageUploadedPhoto, setImageUploadedPhoto] = useState<string | null>(null);
  const [imageUploadedFileInfo, setImageUploadedFileInfo] = useState<{
    name: string;
    size: string;
    dimensions: string;
  } | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [imageVariationsCount, setImageVariationsCount] = useState<number>(1);
  const [generatedVariations, setGeneratedVariations] = useState<string[]>([
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&auto=format&fit=crop&q=80",
  ]);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState<number>(0);
  const [generatedImage, setGeneratedImage] = useState<string>(
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&auto=format&fit=crop&q=80"
  );

  // 4. AI THUMBNAIL STATE (Supports Creator Portrait / Screenshot Upload)
  const [thumbTopic, setThumbTopic] = useState("How I Made $10k in 30 Days with AI Video");
  const [thumbHeadline, setThumbHeadline] = useState("10X FASTER!");
  const [thumbStyle, setThumbStyle] = useState("vibrant_youtube");
  const [thumbUploadedPhoto, setThumbUploadedPhoto] = useState<string | null>(null);
  const [thumbUploadedFileInfo, setThumbUploadedFileInfo] = useState<{
    name: string;
    size: string;
    dimensions: string;
  } | null>(null);
  const [thumbLoading, setThumbLoading] = useState(false);
  const thumbFileInputRef = useRef<HTMLInputElement>(null);
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

  // 5. AI LOGO STATE (Supports Sketch / Reference Image Upload)
  const [brandName, setBrandName] = useState("NovaVision");
  const [brandIndustry, setBrandIndustry] = useState("AI Video Production");
  const [brandStyle, setBrandStyle] = useState("modern minimalist");
  const [logoUploadedPhoto, setLogoUploadedPhoto] = useState<string | null>(null);
  const [logoUploadedFileInfo, setLogoUploadedFileInfo] = useState<{
    name: string;
    size: string;
    dimensions: string;
  } | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [logoData, setLogoData] = useState<{
    brandName: string;
    tagline: string;
    svg: string;
    palette: { name: string; hex: string }[];
    typography: string;
  }>({
    brandName: "NOVAVISION",
    tagline: "Empowering Next-Gen Digital Storytellers",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 220" width="100%" height="100%">
  <defs>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0ea5e9" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#ec4899" />
    </linearGradient>
  </defs>
  <rect width="500" height="220" rx="20" fill="#0b0f19" stroke="#1e293b" stroke-width="2" />
  <g transform="translate(45, 45)">
    <circle cx="65" cy="65" r="52" fill="url(#brandGrad)" opacity="0.95" />
    <path d="M52 40 L92 65 L52 90 Z" fill="#ffffff" />
  </g>
  <text x="190" y="112" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#ffffff" letter-spacing="2">NOVAVISION</text>
  <text x="190" y="142" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#0ea5e9" letter-spacing="4">CREATIVE AI PLATFORM</text>
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
  const [photoLoadingProgress, setPhotoLoadingProgress] = useState(0);
  const [photoLoadingStage, setPhotoLoadingStage] = useState("");
  const [imageLoadingProgress, setImageLoadingProgress] = useState(0);
  const [imageLoadingStage, setImageLoadingStage] = useState("");
  const [videoLoadingProgress, setVideoLoadingProgress] = useState(0);
  const [videoLoadingStage, setVideoLoadingStage] = useState("");
  const [thumbLoadingProgress, setThumbLoadingProgress] = useState(0);
  const [thumbLoadingStage, setThumbLoadingStage] = useState("");
  const [logoLoadingProgress, setLogoLoadingProgress] = useState(0);
  const [logoLoadingStage, setLogoLoadingStage] = useState("");

  // 6. AI PROMPT STUDIO STATE
  const [promptTopic, setPromptTopic] = useState("Cinematic drone shot of an ancient mountain temple in morning mist");
  const [promptCategory, setPromptCategory] = useState<"video" | "image" | "photo-edit" | "thumbnail" | "logo" | "capcut">("video");
  const [promptStyle, setPromptStyle] = useState("cinematic");
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptLoadingProgress, setPromptLoadingProgress] = useState(0);
  const [promptLoadingStage, setPromptLoadingStage] = useState("");
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);
  const [generatedPrompts, setGeneratedPrompts] = useState<{
    expandedIdea: string;
    prompts: Array<{
      title: string;
      prompt: string;
      negativePrompt?: string;
      camera?: string;
      lighting?: string;
      aspectRatio?: string;
      tags?: string[];
    }>;
  }>({
    expandedIdea: "Ancient mountain temple awakening in mystical dawn atmosphere",
    prompts: [
      {
        title: "Masterpiece Cinematic Vista",
        prompt: "Ultra wide 8k cinematic establishing shot of a towering ancient Himalayan mountain temple perched on misty cliffs at dawn, volumetric golden sunlight piercing through dense clouds, 35mm anamorphic lens, IMAX quality, photorealistic architecture.",
        negativePrompt: "blurry, low contrast, distorted geometry, cartoonish, oversaturated",
        camera: "Slow rising drone shot, 24fps cinematic shutter",
        lighting: "Soft diffuse dawn light with intense volumetric sun rays",
        aspectRatio: "16:9",
        tags: ["Cinematic", "8K", "Photorealistic", "Drone"]
      },
      {
        title: "Atmospheric Mystic Mood",
        prompt: "Close-range atmospheric view of ancient carved stone steps leading into a fog-covered mountain shrine, glowing butter lamps reflecting on damp stone, incense smoke swirling in cool blue morning air, photorealistic depth of field.",
        negativePrompt: "noise, low quality, artifacts, flat lighting",
        camera: "50mm f/1.2 prime lens, shallow depth of field",
        lighting: "Warm candle glow contrasted against cool blue twilight",
        aspectRatio: "9:16",
        tags: ["Atmospheric", "Mystic", "Vertical Reel"]
      },
      {
        title: "Epic Fantasy Concept Art",
        prompt: "Epic fantasy concept painting of a colossal celestial temple in clouds, glowing runic architecture, flying paper lanterns in violet sky, Unreal Engine 5 render, ArtStation trending, intricate details.",
        negativePrompt: "deformed, watermark, text, signature",
        camera: "Low angle wide perspective",
        lighting: "Bioluminescent purple and gold ambient glow",
        aspectRatio: "16:9",
        tags: ["Fantasy", "Unreal Engine 5", "Concept Art"]
      },
      {
        title: "Viral CapCut / YouTube Hook",
        prompt: "Fast dynamic zoom-in on an adventurer standing at the cliff edge overlooking an ancient hidden city in the clouds, high saturation, dramatic cinematic score visual, action blockbuster aesthetic.",
        negativePrompt: "dull, motionless, amateur",
        camera: "Dynamic snap zoom to wide reveal",
        lighting: "Golden hour high dynamic range",
        aspectRatio: "9:16",
        tags: ["Viral Hook", "Shorts/Reels", "High Impact"]
      }
    ]
  });

  // Background change / modification preset definitions
  const photoPresetOptions = [
    {
      id: "enhance",
      name: "✨ Enhance & 8K Upscale",
      icon: "✨",
      prompt: "Enhance photo resolution to 8K, fix lighting, remove background noise, crystal clear sharp focus, photorealistic masterpiece",
    },
    {
      id: "portrait",
      name: "💄 Studio Portrait Glamour",
      icon: "💄",
      prompt: "Apply professional high-end fashion studio portrait lighting, soft skin texture, luminous eyes, cinematic rim light",
    },
    {
      id: "cat",
      name: "🐱 Add a Cute Cat",
      icon: "🐱",
      prompt: "Keep the subject intact and add an adorable domestic fluffy cat sitting right beside them, studio lighting, photorealistic",
    },
    {
      id: "dog",
      name: "🐶 Add a Playful Dog",
      icon: "🐶",
      prompt: "Keep the subject intact and add a friendly playful golden retriever dog into the scene, photorealistic 8k",
    },
    {
      id: "lion",
      name: "🦁 Add a Wild Lion",
      icon: "🦁",
      prompt: "Add a majestic wild lion in the scenic golden savannah background with dramatic sunset lighting",
    },
    {
      id: "line",
      name: "⚡ Add Neon Laser Lines",
      icon: "⚡",
      prompt: "Add glowing electric neon laser lines radiating and pulsing around the subject, cyberpunk illumination",
    },
    {
      id: "elephant",
      name: "🐘 Add an Elephant",
      icon: "🐘",
      prompt: "Add a majestic large wild elephant walking in the scenic misty background landscape, cinematic 8k",
    },
    {
      id: "beach",
      name: "🌴 Tropical Sunset Beach",
      icon: "🌴",
      prompt: "Replace background with a breathtaking tropical beach at golden sunset with turquoise water and palm trees",
    },
    {
      id: "cyberpunk",
      name: "🏙️ Cyberpunk Metropolis",
      icon: "🏙️",
      prompt: "Replace background with a futuristic cyberpunk neon metropolis in rainy night with holographic billboards",
    },
    {
      id: "galaxy",
      name: "🪐 Cosmic Deep Space",
      icon: "🪐",
      prompt: "Replace background with a cosmic deep space nebula with glowing stars and planetary rings",
    },
  ];

  // Handle Photo File Upload with dimension detection and metadata
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileSizeFormatted =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const dataUrl = reader.result as string;
          setUserUploadedPhoto(dataUrl);
          setTransformedPhoto(dataUrl);
          setActiveModifier("custom");

          const img = new Image();
          img.onload = () => {
            setUploadedFileInfo({
              name: file.name,
              size: fileSizeFormatted,
              type: file.type || "image/jpeg",
              dimensions: `${img.width} x ${img.height} px`,
            });
          };
          img.src = dataUrl;

          // Initialize history with this uploaded photo
          setPhotoHistory([
            {
              url: dataUrl,
              prompt: `Uploaded: ${file.name}`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              aspect: photoEditAspect,
            },
          ]);
          setHistoryIndex(0);

          addNotification("Photo Uploaded", `${file.name} (${fileSizeFormatted}) loaded successfully.`, "success");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Undo Photo Change
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setTransformedPhoto(photoHistory[newIdx].url);
      addNotification("Undo", "Reverted to previous edit state.", "info");
    }
  };

  // Redo Photo Change
  const handleRedo = () => {
    if (historyIndex < photoHistory.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setTransformedPhoto(photoHistory[newIdx].url);
      addNotification("Redo", "Restored forward edit state.", "info");
    }
  };

  // Reset Photo to Original
  const handleResetPhoto = () => {
    if (userUploadedPhoto) {
      setTransformedPhoto(userUploadedPhoto);
      if (photoHistory.length > 0) {
        setHistoryIndex(0);
      }
      addNotification("Reset", "Photo reset to initial uploaded state.", "info");
    }
  };

  // Helper to paste clipboard content directly into any input or textarea
  const handlePasteToField = async (setter: (text: string) => void, fieldName: string) => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setter(text.trim());
          addNotification("پرامپٹ پیسٹ ہو گیا", `${fieldName} میں کلپ بورڈ سے پرامپٹ پیسٹ ہو گیا ہے۔`, "success");
          return;
        }
      }
    } catch (err) {
      console.warn("Clipboard read error:", err);
    }
    addNotification("پرامپٹ پیسٹ کریں", "براہ کرم باکس میں کلک کر کے Ctrl + V دبائیں یا پرامپٹ لکھیں۔", "info");
  };

  // 1. Photo Transform / Background Edit & Direct Prompt Generation Handler
  const handleExecutePhotoEdit = async (customPromptToRun?: string, modId?: string) => {
    const promptToUse = (customPromptToRun || photoEditPrompt || "").trim() || "Cinematic 8K masterpiece portrait with dramatic lighting and photorealistic details";
    
    // SOURCE IMAGE SELECTION:
    // If user uploaded a photo or transformed photo, use it as source for modification
    // If no photo is uploaded, we seamlessly generate the photo purely from the prompt!
    const sourceImageToSend = (chainEditsMode && transformedPhoto) ? transformedPhoto : (userUploadedPhoto || transformedPhoto || null);

    if (!deductCredits(5)) return;

    const actionTypeToSend = modId || (customPromptToRun ? "preset" : activeModifier || "custom");
    if (modId) setActiveModifier(modId);

    const thisRequestId = `edit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    activePhotoRequestIdRef.current = thisRequestId;

    setPhotoEditLoading(true);
    setPhotoLoadingProgress(15);
    setPhotoLoadingStage(sourceImageToSend ? "🧠 تصوير اور چہرے کا تجزیہ ہو رہا ہے... / Analyzing photo & subject..." : "✨ AI پرامپٹ سے ہائی ریزولوشن تصویر بن رہی ہے... / Generating photo from prompt...");

    // Progress step simulation
    const stageTimer1 = setTimeout(() => {
      setPhotoLoadingProgress(45);
      setPhotoLoadingStage(sourceImageToSend ? "🎨 بیک گراؤنڈ اور ایلیمنٹس موڈیفائی ہو رہے ہیں... / Rendering modifications..." : "🎨 تفصیلات، لائیٹنگ اور سین کمپوزیشن... / Composing scene & lighting...");
    }, 1000);

    const stageTimer2 = setTimeout(() => {
      setPhotoLoadingProgress(75);
      setPhotoLoadingStage("⚡ لائٹنگ، شیڈوز اور نیچرل بلینڈنگ... / Harmonizing lighting & depth...");
    }, 2200);

    const stageTimer3 = setTimeout(() => {
      setPhotoLoadingProgress(92);
      setPhotoLoadingStage("✨ 8K فوٹوریلسٹک فنشنگ... / Finalizing ultra-sharp render...");
    }, 3500);

    // Watchdog safety timeout (max 25s) to guarantee loader stops even on network edge case
    const watchdogTimer = setTimeout(() => {
      if (activePhotoRequestIdRef.current === thisRequestId) {
        setPhotoEditLoading(false);
      }
    }, 25000);

    try {
      const res = await apiFetch("/api/ai/edit-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          actionType: actionTypeToSend,
          sourceImageUrl: sourceImageToSend || undefined,
          imageBase64: sourceImageToSend && sourceImageToSend.startsWith("data:") ? sourceImageToSend : undefined,
          aspectRatio: photoEditAspect,
          requestId: thisRequestId,
        }),
      });

      const { ok, data, error: apiErr } = await safeApiJson(res);
      if (activePhotoRequestIdRef.current !== thisRequestId) {
        return; // Superceded by a newer request
      }

      setPhotoLoadingProgress(100);
      setPhotoLoadingStage("✅ تصویر تیار ہے! / Render complete!");

      if (!ok || !data?.imageUrl) {
        throw new Error(apiErr || data?.error || "Failed to process photo.");
      }

      setTransformedPhoto(data.imageUrl);

      // If no photo was originally uploaded, default to result view so it displays cleanly
      if (!userUploadedPhoto) {
        setViewMode("result");
      }

      const newHistoryItem: PhotoHistoryItem = {
        url: data.imageUrl,
        prompt: promptToUse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        aspect: photoEditAspect,
      };

      setPhotoHistory((prev) => [...prev.slice(0, historyIndex + 1), newHistoryItem]);
      setHistoryIndex((prev) => prev + 1);

      if (sourceImageToSend) {
        addNotification("AI Photo Modified", `Modified photo: "${promptToUse.slice(0, 45)}..."`, "success");
      } else {
        addNotification("AI Photo Generated", `Created from prompt: "${promptToUse.slice(0, 45)}..."`, "success");
      }
    } catch (e: any) {
      console.error("Photo edit error:", e);
      const friendlyMsg = formatApiError(e);
      addNotification("Notice", friendlyMsg, "error");
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearTimeout(watchdogTimer);
      setTimeout(() => {
        setPhotoEditLoading(false);
      }, 400);
    }
  };

  // Video Tab File Upload Handler
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const dataUrl = reader.result as string;
          setVideoUploadedPhoto(dataUrl);
          setVideoSourceType("uploaded-photo");

          const img = new Image();
          img.onload = () => {
            setVideoUploadedFileInfo({
              name: file.name,
              size: sizeStr,
              dimensions: `${img.width} x ${img.height} px`,
            });
          };
          img.src = dataUrl;
          addNotification("Photo Loaded for Video", `${file.name} ready for animation.`, "success");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Image Gen Tab File Upload Handler
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const dataUrl = reader.result as string;
          setImageUploadedPhoto(dataUrl);

          const img = new Image();
          img.onload = () => {
            setImageUploadedFileInfo({
              name: file.name,
              size: sizeStr,
              dimensions: `${img.width} x ${img.height} px`,
            });
          };
          img.src = dataUrl;
          addNotification("Reference Photo Loaded", `${file.name} loaded for AI photo styling & enhancement.`, "success");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Thumbnail Tab File Upload Handler
  const handleThumbFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const dataUrl = reader.result as string;
          setThumbUploadedPhoto(dataUrl);

          const img = new Image();
          img.onload = () => {
            setThumbUploadedFileInfo({
              name: file.name,
              size: sizeStr,
              dimensions: `${img.width} x ${img.height} px`,
            });
          };
          img.src = dataUrl;
          addNotification("Portrait Photo Loaded", `${file.name} will be featured in thumbnail layouts.`, "success");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Logo Tab File Upload Handler
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const dataUrl = reader.result as string;
          setLogoUploadedPhoto(dataUrl);

          const img = new Image();
          img.onload = () => {
            setLogoUploadedFileInfo({
              name: file.name,
              size: sizeStr,
              dimensions: `${img.width} x ${img.height} px`,
            });
          };
          img.src = dataUrl;
          addNotification("Logo Sketch Loaded", `${file.name} loaded as design inspiration.`, "success");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. Generate Video handler (Costs 10 credits - 100% Prompt-Driven)
  const handleGenerateVideo = async () => {
    if (!deductCredits(10)) return;
    setVideoLoading(true);
    setVideoLoadingProgress(15);
    setVideoLoadingStage("🧠 پرومپٹ کا تجزیہ اور سنیماٹک کیمرہ موشن ترتیب دیا جا رہا ہے...");

    const vt1 = setTimeout(() => {
      setVideoLoadingProgress(45);
      setVideoLoadingStage("🎬 Veo 3.1 موشن فریمز اور لائٹنگ رینڈر ہو رہی ہے...");
    }, 1500);

    const vt2 = setTimeout(() => {
      setVideoLoadingProgress(75);
      setVideoLoadingStage("⚡ 60fps سنیماٹک بلینڈنگ اور ساؤنڈ ہم آہنگی...");
    }, 3200);

    const vt3 = setTimeout(() => {
      setVideoLoadingProgress(92);
      setVideoLoadingStage("✨ فائنل 4K ویڈیو آؤٹ پٹ تیار ہو رہا ہے...");
    }, 4800);

    try {
      const promptToRun = videoPrompt.trim() || "Cinematic 8K drone flight over futuristic neon metropolis with volumetric lighting and atmospheric rain";
      const res = await apiFetch("/api/ai/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToRun,
          style: videoStyle,
          cameraMotion,
          aspectRatio: videoAspect,
          duration: 10,
        }),
      });

      const { ok, data, error: apiErr } = await safeApiJson(res);
      setVideoLoadingProgress(100);
      setVideoLoadingStage("✅ ویڈیو مکمل طور پر تیار ہے!");

      if (data && data.videoUrl) {
        setGeneratedVideo({
          title: data.title || `AI Video: ${promptToRun.slice(0, 30)}`,
          videoUrl: data.videoUrl,
          thumbnailUrl: data.thumbnailUrl || "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80",
          prompt: promptToRun,
          scenes: data.scenes || [
            { time: "00:00 - 00:04", action: "Intro atmospheric wide shot with volumetric lighting", camera: "Slow Cinematic Pan" },
            { time: "00:04 - 00:08", action: "Primary subject interaction and rapid motion", camera: "FPV Orbit" },
            { time: "00:08 - 00:10", action: "Dramatic focal resolution with lens flare", camera: "Dolly In Zoom" },
          ],
        });
        addNotification("AI Video Generated", "Generated cinematic video ready for playback and editor timeline.", "success");
      } else {
        throw new Error(apiErr || data?.error || "Failed to generate video.");
      }
    } catch (e: any) {
      console.error(e);
      addNotification("Video Notice", formatApiError(e), "error");
    } finally {
      clearTimeout(vt1);
      clearTimeout(vt2);
      clearTimeout(vt3);
      setTimeout(() => {
        setVideoLoading(false);
      }, 500);
    }
  };

  // Download media helper
  const handleDownloadMedia = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addNotification("Downloaded", `${filename} downloaded to your device.`, "success");
  };

  // Copy SVG Handler
  const handleCopySvg = () => {
    if (logoData?.svg) {
      navigator.clipboard.writeText(logoData.svg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      addNotification("SVG Copied", "Raw SVG markup copied to clipboard.", "success");
    }
  };

  // Download SVG
  const handleDownloadSvg = () => {
    if (!logoData?.svg) return;
    const blob = new Blob([logoData.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    handleDownloadMedia(url, `${brandName.toLowerCase().replace(/\s+/g, "_")}_logo.svg`);
  };

  // 3. Generate Image handler (Costs 5 credits per variation)
  const handleGenerateImage = async () => {
    const totalCost = 5 * imageVariationsCount;
    if (!deductCredits(totalCost)) return;
    setImageLoading(true);
    setImageLoadingProgress(12);
    setImageLoadingStage("🧠 تجزیہ اور پرومپٹ آپٹیمائزیشن جاری ہے... / Understanding prompt & concept...");

    const it1 = setTimeout(() => {
      setImageLoadingProgress(38);
      setImageLoadingStage(`🎨 ${imageVariationsCount} مختلف ویری ایشنز کے لیے انفرادی سیڈز اور 8K سنتھیسس شروع... / Synthesizing ${imageVariationsCount} unique variations...`);
    }, 1000);

    const it2 = setTimeout(() => {
      setImageLoadingProgress(70);
      setImageLoadingStage("✨ ہائی ریزولیوشن ٹیکسچرز، لائٹنگ اور رینڈرنگ ہو رہی ہے... / Polishing textures, reflections & dynamic range...");
    }, 2200);

    const it3 = setTimeout(() => {
      setImageLoadingProgress(90);
      setImageLoadingStage("⚡ فائنل امیج پروسیسنگ اور آرٹفیکٹ ریموول... / Finalizing output renders...");
    }, 3500);

    try {
      const res = await apiFetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          style: imageStyle,
          aspectRatio: imageAspect,
          category: imageCategory,
          variations: imageVariationsCount,
          sourceImageUrl: imageUploadedPhoto || undefined,
          imageBase64: imageUploadedPhoto?.startsWith("data:") ? imageUploadedPhoto : undefined,
        }),
      });
      const { ok, data, error: apiErr } = await safeApiJson(res);
      setImageLoadingProgress(100);
      setImageLoadingStage("✅ تمام ویری ایشنز کامیابی سے تیار ہیں! / Complete!");

      const vars = Array.isArray(data?.variations) && data.variations.length > 0
        ? data.variations
        : (data?.imageUrl ? [data.imageUrl] : []);

      if (vars.length > 0) {
        setGeneratedVariations(vars);
        setGeneratedImage(vars[0]);
        setSelectedVariationIndex(0);
        addNotification(
          "AI Image Variations Ready",
          `${vars.length} unique variation(s) generated successfully for your prompt.`,
          "success"
        );
      } else {
        throw new Error(apiErr || data?.error || "Could not generate image variations.");
      }
    } catch (e: any) {
      console.error(e);
      addNotification("Generation Notice", formatApiError(e), "error");
    } finally {
      clearTimeout(it1);
      clearTimeout(it2);
      clearTimeout(it3);
      setTimeout(() => {
        setImageLoading(false);
      }, 400);
    }
  };

  // 4. Generate Thumbnails handler (Costs 5 credits)
  const handleGenerateThumbnails = async () => {
    if (!deductCredits(5)) return;
    setThumbLoading(true);
    setThumbLoadingProgress(15);
    setThumbLoadingStage("🎯 ویڈیو عنوان اور ہائی سی ٹی آر لے آؤٹ کا تجزیہ...");

    const tt1 = setTimeout(() => {
      setThumbLoadingProgress(50);
      setThumbLoadingStage("🎨 3 وائرل کلر پیلیٹس اور ٹائپوگرافی سنتھیسائز ہو رہی ہے...");
    }, 1200);

    const tt2 = setTimeout(() => {
      setThumbLoadingProgress(85);
      setThumbLoadingStage("✨ چہرے کی کٹنگ، ہائی لائٹس اور بیجز فائنل ہو رہے ہیں...");
    }, 2500);

    try {
      const res = await apiFetch("/api/ai/generate-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: thumbTopic,
          headline: thumbHeadline,
          style: thumbStyle,
          creatorPhotoUrl: thumbUploadedPhoto || undefined,
          imageBase64: thumbUploadedPhoto?.startsWith("data:") ? thumbUploadedPhoto : undefined,
        }),
      });
      const { ok, data, error: apiErr } = await safeApiJson(res);
      setThumbLoadingProgress(100);
      setThumbLoadingStage("✅ تھمب نیلز تیار ہیں!");
      if (data?.thumbnails) {
        setThumbnailsList(data.thumbnails);
        addNotification("Thumbnails Created", "3 High-CTR thumbnail designs generated.", "success");
      } else {
        throw new Error(apiErr || data?.error || "Thumbnail generation failed.");
      }
    } catch (e: any) {
      console.error(e);
      addNotification("Thumbnail Notice", formatApiError(e), "error");
    } finally {
      clearTimeout(tt1);
      clearTimeout(tt2);
      setTimeout(() => {
        setThumbLoading(false);
      }, 500);
    }
  };

  // 5. Generate Logo handler (Costs 5 credits)
  const handleGenerateLogo = async () => {
    if (!deductCredits(5)) return;
    setLogoLoading(true);
    setLogoLoadingProgress(15);
    setLogoLoadingStage("🎨 برانڈ انڈسٹری اور آئیڈینٹی کا تجزیہ...");

    const lt1 = setTimeout(() => {
      setLogoLoadingProgress(50);
      setLogoLoadingStage("✏️ ویکٹر پاتھز اور جیومیٹرک شیپس کیلکولیٹ ہو رہی ہیں...");
    }, 1200);

    const lt2 = setTimeout(() => {
      setLogoLoadingProgress(85);
      setLogoLoadingStage("✨ ایس وی جی برانڈ پیلیٹ اور ٹائپوگرافی کمپوز ہو رہی ہے...");
    }, 2500);

    try {
      const res = await apiFetch("/api/ai/generate-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          industry: brandIndustry,
          style: brandStyle,
          referenceImageUrl: logoUploadedPhoto || undefined,
          imageBase64: logoUploadedPhoto?.startsWith("data:") ? logoUploadedPhoto : undefined,
        }),
      });
      const { ok, data, error: apiErr } = await safeApiJson(res);
      setLogoLoadingProgress(100);
      setLogoLoadingStage("✅ برانڈ لوگو تیار ہے!");
      if (data?.svg) {
        setLogoData(data);
        addNotification("Brand Logo Created", `Vector logo generated for ${brandName}.`, "success");
      } else {
        throw new Error(apiErr || data?.error || "Logo generation failed.");
      }
    } catch (e: any) {
      console.error(e);
      addNotification("Logo Notice", formatApiError(e), "error");
    } finally {
      clearTimeout(lt1);
      clearTimeout(lt2);
      setTimeout(() => {
        setLogoLoading(false);
      }, 500);
    }
  };

  // Generate AI Prompts with Gemini 3.7 / 2.5 Flash Free Tier
  const handleGeneratePrompts = async () => {
    if (!promptTopic.trim()) {
      addNotification("Topic Required", "Please enter an idea or theme for prompt generation.", "warning");
      return;
    }

    setPromptLoading(true);
    setPromptLoadingProgress(15);
    setPromptLoadingStage("AI پرامپٹ انجینئرنگ ماڈل ایکٹیویٹ ہو رہا ہے...");

    const pt1 = setTimeout(() => {
      setPromptLoadingProgress(55);
      setPromptLoadingStage("سین، کیمرہ موشن اور لائیٹنگ پیرامیٹرز کمپوز ہو رہے ہیں...");
    }, 400);

    const pt2 = setTimeout(() => {
      setPromptLoadingProgress(85);
      setPromptLoadingStage("4 پروڈکشن گریڈ پرامپٹس کو حتمی شکل دی جا رہی ہے...");
    }, 900);

    try {
      const res = await apiFetch("/api/ai/generate-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: promptTopic,
          category: promptCategory,
          style: promptStyle,
        }),
      });
      const { ok, data, error: apiErr } = await safeApiJson(res);
      setPromptLoadingProgress(100);
      setPromptLoadingStage("✅ پرامپٹس تیار ہیں!");

      if (data?.success && Array.isArray(data.prompts) && data.prompts.length > 0) {
        setGeneratedPrompts({
          expandedIdea: data.expandedIdea || promptTopic,
          prompts: data.prompts,
        });
        addNotification("Prompts Generated", `Created 4 optimized prompts for ${promptCategory}!`, "success");
      } else {
        throw new Error(apiErr || data?.error || "Failed to generate prompts.");
      }
    } catch (e: any) {
      console.error(e);
      addNotification("Notice", formatApiError(e), "error");
    } finally {
      clearTimeout(pt1);
      clearTimeout(pt2);
      setTimeout(() => {
        setPromptLoading(false);
      }, 400);
    }
  };

  const handleCopyPromptText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptIndex(index);
    addNotification("Copied", "Prompt copied to clipboard!", "success");
    setTimeout(() => setCopiedPromptIndex(null), 2500);
  };

  const handleUsePromptInTool = (targetTool: "photo-edit" | "video" | "image" | "thumbnail", promptText: string) => {
    if (targetTool === "photo-edit") {
      setPhotoEditPrompt(promptText);
      setActiveTabLocal("photo-edit");
      addNotification("Prompt Loaded", "Applied to Photo & Background Changer!", "info");
    } else if (targetTool === "video") {
      setVideoPrompt(promptText);
      setActiveTabLocal("video");
      addNotification("Prompt Loaded", "Applied to AI Video Generator!", "info");
    } else if (targetTool === "image") {
      setImagePrompt(promptText);
      setActiveTabLocal("image");
      addNotification("Prompt Loaded", "Applied to Photo Generator!", "info");
    } else if (targetTool === "thumbnail") {
      setThumbTopic(promptText.slice(0, 60));
      setActiveTabLocal("thumbnail");
      addNotification("Topic Loaded", "Applied to YouTube Thumbnail Generator!", "info");
    }
  };

  // Send photo to timeline as clip or overlay
  const sendPhotoToEditor = (imageUrl: string | null, asOverlay = false) => {
    const img = imageUrl || transformedPhoto || userUploadedPhoto;
    if (!img) {
      addNotification("No Photo", "Please upload or generate a photo first.", "error");
      return;
    }
    const targetTrack = asOverlay
      ? project.tracks.find((t) => t.type === "overlay") || project.tracks[1] || project.tracks[0]
      : project.tracks.find((t) => t.type === "main") || project.tracks[0];

    if (targetTrack) {
      addClipToTrack(targetTrack.id, {
        type: "image",
        name: "AI Modified Photo",
        mediaUrl: img,
        thumbnailUrl: img,
        duration: 6,
        startTime: 0,
      });
      setActiveTab("editor");
      addNotification("Sent to Timeline", asOverlay ? "Added as PiP Overlay track." : "Added to main timeline track.", "success");
    }
  };

  // Convert current photo to AI Video
  const animatePhotoToVideo = () => {
    const photoToUse = transformedPhoto || userUploadedPhoto;
    if (photoToUse) {
      setVideoUploadedPhoto(photoToUse);
      setVideoUploadedFileInfo({
        name: "ai_edited_photo.png",
        size: "Enhanced",
        dimensions: "16:9",
      });
    }
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

      {/* 6 AI Tool Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
            <p className="font-bold text-xs sm:text-sm truncate text-white">Photo & BG Mod</p>
            <p className="text-[10px] text-sky-300/80 truncate">Upload & Transform</p>
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
            <p className="text-[10px] text-purple-300/80 truncate">Prompt to Video</p>
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
            <p className="font-bold text-xs sm:text-sm truncate text-white">Thumbnails</p>
            <p className="text-[10px] text-rose-300/80 truncate">YouTube Viral</p>
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
            <p className="text-[10px] text-emerald-300/80 truncate">Vector SVG</p>
          </div>
        </button>

        {/* Tab 6: AI Prompt Studio & Enhancer */}
        <button
          id="tab-prompt-studio-btn"
          onClick={() => setActiveTabLocal("prompt-studio")}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
            activeTab === "prompt-studio"
              ? "bg-gradient-to-br from-amber-950 via-yellow-950 to-slate-900 border-amber-500 text-white shadow-lg shadow-amber-950/50 ring-1 ring-amber-500"
              : "bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold shrink-0">
            <Wand2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs sm:text-sm truncate text-white">Prompt Studio</p>
            <p className="text-[10px] text-amber-300/80 truncate">Master AI Prompts</p>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                  <ArrowUpCircle className="w-4 h-4 text-sky-400" />
                  <span>1. تصویر اپلوڈ کریں (اختیاری) / Upload Photo (Optional)</span>
                </label>
                {uploadedFileInfo ? (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> تصویر تیار ہے
                  </span>
                ) : (
                  <span className="text-[10px] text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-800">
                    بغیر تصویر صرف پرامپٹ بھی چلے گا
                  </span>
                )}
              </div>
              
              {uploadedFileInfo ? (
                <div className="p-3.5 bg-slate-950 border-2 border-sky-500/50 rounded-2xl flex items-center justify-between gap-3 shadow-lg shadow-sky-950/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <img
                        src={userUploadedPhoto}
                        alt="Uploaded preview"
                        className="w-14 h-14 rounded-xl object-cover border-2 border-sky-400 shrink-0 shadow-md"
                      />
                      <span className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 rounded-full text-white">
                        <CheckCircle2 className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-100 text-xs truncate">{uploadedFileInfo.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                        <span className="px-2 py-0.5 bg-sky-950 text-sky-300 rounded-md font-mono font-bold border border-sky-800">
                          {uploadedFileInfo.size}
                        </span>
                        <span className="text-slate-300 font-mono">{uploadedFileInfo.dimensions}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      <span>بدلیں / Replace</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserUploadedPhoto(null);
                        setUploadedFileInfo(null);
                        setTransformedPhoto(null);
                        setPhotoHistory([]);
                        setHistoryIndex(-1);
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer border border-slate-700"
                      title="تصویر ختم کریں / Clear photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-sky-500/60 hover:border-sky-400 bg-gradient-to-b from-sky-950/30 via-slate-950 to-slate-950 rounded-2xl p-5 text-center cursor-pointer transition-all hover:shadow-xl hover:shadow-sky-500/10 flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
                >
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-sky-500/20 text-sky-400 text-[10px] font-bold rounded-full border border-sky-500/30">
                    PNG, JPG, WebP
                  </div>
                  
                  {/* Glowing Arrow Indicator */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
                    <ArrowUpCircle className="w-7 h-7 animate-pulse" />
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-100 text-sm tracking-wide flex items-center justify-center gap-1.5">
                      <span>تصویر اپلوڈ کرنے کیلئے یہاں کلک کریں</span>
                      <span className="text-sky-400">• Click to Upload</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      ڈریگ اینڈ ڈراپ کریں یا فائل منتخب کریں (بیک گراؤنڈ بدلنے اور AI ایڈیٹنگ کیلئے)
                    </p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoFileUpload}
                className="hidden"
              />

              {/* Starter Presets */}
              <div className="flex items-center gap-2 mt-2.5">
                <span className="text-[10px] text-slate-400">یا سیمپل منتخب کریں:</span>
                <button
                  type="button"
                  onClick={() => {
                    const sampleUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=80";
                    setUserUploadedPhoto(sampleUrl);
                    setTransformedPhoto(sampleUrl);
                    setUploadedFileInfo({
                      name: "Sample-Model-1.jpg",
                      size: "1.2 MB",
                      type: "image/jpeg",
                      dimensions: "1000 x 1333 px",
                    });
                    setPhotoHistory([
                      {
                        url: sampleUrl,
                        prompt: "Sample Model 1 loaded",
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        aspect: photoEditAspect,
                      },
                    ]);
                    setHistoryIndex(0);
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer border border-slate-700"
                >
                  Portrait 1
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sampleUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop&q=80";
                    setUserUploadedPhoto(sampleUrl);
                    setTransformedPhoto(sampleUrl);
                    setUploadedFileInfo({
                      name: "Sample-Model-2.jpg",
                      size: "1.4 MB",
                      type: "image/jpeg",
                      dimensions: "1000 x 1500 px",
                    });
                    setPhotoHistory([
                      {
                        url: sampleUrl,
                        prompt: "Sample Model 2 loaded",
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        aspect: photoEditAspect,
                      },
                    ]);
                    setHistoryIndex(0);
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer border border-slate-700"
                >
                  Portrait 2
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sampleUrl = "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1000&auto=format&fit=crop&q=80";
                    setUserUploadedPhoto(sampleUrl);
                    setTransformedPhoto(sampleUrl);
                    setUploadedFileInfo({
                      name: "Sample-Model-3.jpg",
                      size: "1.1 MB",
                      type: "image/jpeg",
                      dimensions: "1000 x 1333 px",
                    });
                    setPhotoHistory([
                      {
                        url: sampleUrl,
                        prompt: "Sample Model 3 loaded",
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        aspect: photoEditAspect,
                      },
                    ]);
                    setHistoryIndex(0);
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer border border-slate-700"
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>3. Custom Prompt Instructions (پرامپٹ لکھیں یا پیسٹ کریں)</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePasteToField(setPhotoEditPrompt, "Photo Prompt")}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-sky-950 text-sky-300 hover:text-sky-200 border border-slate-700 hover:border-sky-500/50 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                  title="Paste prompt from clipboard"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>📋 پرامپٹ پیسٹ کریں / Paste</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={photoEditPrompt}
                onChange={(e) => {
                  setPhotoEditPrompt(e.target.value);
                  setActiveModifier("custom");
                }}
                placeholder="E.g. Change background to a snowy mountain, add a cat, add golden lighting..."
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-slate-200 outline-none focus:border-sky-500 leading-relaxed text-xs"
              />
            </div>

            {/* Aspect Ratio & History Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300 font-semibold mr-1">Aspect:</span>
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

              {/* Undo / Redo / Reset buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 cursor-pointer"
                  title="Undo photo modification"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={historyIndex >= photoHistory.length - 1}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 cursor-pointer"
                  title="Redo photo modification"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetPhoto}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="Reset to original photo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
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
                  <span>تصویر پر کام جاری ہے... / Processing Photo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-sky-200" />
                  <span>
                    {userUploadedPhoto || transformedPhoto
                      ? "تصویر میں تبدیلیاں کریں / Apply Photo Edits (5 Credits)"
                      : "پرامپٹ سے تصویر بنائیں / Generate from Prompt (5 Credits)"}
                  </span>
                </>
              )}
            </button>

            {/* NEW DEDICATED LOADING BOX (Below Button) */}
            {photoEditLoading && (
              <div className="p-4 rounded-2xl border-2 border-sky-400/90 bg-gradient-to-b from-sky-950/70 via-slate-950 to-slate-950 shadow-2xl shadow-sky-500/20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 border border-sky-300/60 flex items-center justify-center shadow-lg shadow-sky-500/30">
                      <Sparkles className="w-4 h-4 text-sky-100 animate-spin" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                        <span>تصویر بن رہی ہے... لوڈنگ جاری ہے</span>
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                      </h5>
                      <p className="text-[10px] text-sky-300/80 font-medium">AI Photo Generation & Editing In Progress</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-black text-white bg-sky-900 px-2.5 py-0.5 rounded-lg border border-sky-600 shadow-sm">
                    {photoLoadingProgress}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-slate-900 rounded-full border border-slate-700/80 overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 rounded-full transition-all duration-300 shadow-[0_0_12px_#38bdf8]"
                    style={{ width: `${Math.max(8, photoLoadingProgress)}%` }}
                  />
                </div>

                {/* Current stage message */}
                <div className="p-2.5 bg-slate-950 rounded-xl border border-sky-900/60 space-y-1 text-center">
                  <p className="text-slate-200 text-[11px] font-bold">
                    {photoLoadingStage || "تصویر کو AI پرومپٹ کے مطابق تیار کیا جا رہا ہے..."}
                  </p>
                  {photoEditPrompt && (
                    <p className="text-[10px] text-sky-300/90 font-mono truncate px-2 py-0.5 bg-slate-900/80 rounded-lg">
                      پرومپٹ: "{photoEditPrompt}"
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Result & Live Comparison Right Column */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
            <div>
              {/* Header & View Mode Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-200">AI Preview & Comparison</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {photoEditAspect}
                  </span>
                  {userUploadedPhoto && (
                    <button
                      type="button"
                      onClick={() => setChainEditsMode(!chainEditsMode)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                        chainEditsMode
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                      title={chainEditsMode ? "Subsequent edits modify the latest result" : "Edits always modify the original upload"}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${chainEditsMode ? "bg-emerald-400" : "bg-slate-500"}`} />
                      <span>{chainEditsMode ? "Chained Edits (On)" : "Edit from Original"}</span>
                    </button>
                  )}
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
                    onClick={() => setViewMode("slider")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      viewMode === "slider"
                        ? "bg-sky-500 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Compare Slider
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
                {photoEditLoading ? (
                  /* Animated AI Generation Box with square shape, pulsing grid and real-time progress */
                  <div className="relative rounded-3xl overflow-hidden border-2 border-sky-500/70 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 aspect-[16/9] shadow-2xl flex flex-col items-center justify-center p-6 text-center select-none">
                    {/* Animated Grid Lines Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c718_1px,transparent_1px),linear-gradient(to_bottom,#0284c718_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none animate-pulse" />

                    {/* Vertical Scanning Laser Beam */}
                    <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_20px_#38bdf8] pointer-events-none top-1/4 animate-[bounce_2s_infinite]" />

                    {/* Glowing Square & Futuristic AI Core */}
                    <div className="relative mb-5">
                      {/* Outer Rotating Dashed Cyber Square */}
                      <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-sky-400 animate-[spin_10s_linear_infinite] flex items-center justify-center shadow-xl shadow-sky-500/20" />
                      {/* Inner Pulsing Core */}
                      <div className="absolute inset-2.5 rounded-xl bg-gradient-to-tr from-sky-600/40 via-indigo-600/50 to-purple-600/40 border border-sky-300/60 flex items-center justify-center backdrop-blur-md shadow-inner animate-pulse">
                        <Sparkles className="w-7 h-7 text-sky-200 animate-spin" style={{ animationDuration: "5s" }} />
                      </div>
                    </div>

                    {/* Real-Time Live Status & Progress Bar */}
                    <div className="relative z-10 space-y-2.5 max-w-md w-full px-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-sky-400 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
                          <span>AI رینڈرنگ اور فوٹو ایڈیٹنگ جاری ہے...</span>
                        </span>
                        <span className="font-mono text-white bg-sky-950 px-2.5 py-0.5 rounded-lg border border-sky-800 shadow-sm">
                          {photoLoadingProgress}%
                        </span>
                      </div>

                      {/* Glowing Progress Bar */}
                      <div className="w-full h-3 bg-slate-950 rounded-full border border-slate-700/80 overflow-hidden p-0.5 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-300 shadow-[0_0_12px_#38bdf8]"
                          style={{ width: `${Math.max(6, photoLoadingProgress)}%` }}
                        />
                      </div>

                      {/* Live Phase Text */}
                      <p className="text-slate-200 text-xs font-semibold pt-1">
                        {photoLoadingStage || "تصویر کو AI پرومپٹ کے مطابق تیار کیا جا رہا ہے..."}
                      </p>

                      {photoEditPrompt && (
                        <p className="text-[11px] text-sky-300/90 font-mono truncate px-3 py-1.5 bg-slate-950/90 rounded-xl border border-sky-900/50">
                          پرومپٹ: "{photoEditPrompt}"
                        </p>
                      )}
                    </div>
                  </div>
                ) : !userUploadedPhoto && !transformedPhoto ? (
                  <div className="rounded-3xl border-2 border-dashed border-slate-800 bg-slate-950/80 p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 aspect-[16/9]">
                    <div className="w-16 h-16 rounded-2xl bg-sky-950/60 border border-sky-500/30 text-sky-400 flex items-center justify-center shadow-lg shadow-sky-950/50">
                      <Sparkles className="w-8 h-8 text-sky-300 animate-pulse" />
                    </div>
                    <div className="max-w-md space-y-1.5">
                      <h4 className="font-bold text-slate-100 text-sm">تصویر اپلوڈ کریں یا بغیر اپلوڈ پرامپٹ سے بنائیں</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        آپ اپنی تصویر اپلوڈ کر کے بیک گراؤنڈ وغیرہ تبدیل کر سکتے ہیں، یا بغیر اپلوڈ صرف پرامپٹ لکھ کر AI سے براہ راست نئی تصویر بنا سکتے ہیں۔
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
                      >
                        <ArrowUpCircle className="w-4 h-4 text-sky-400" />
                        <span>تصویر اپلوڈ کریں / Upload</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExecutePhotoEdit()}
                        className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>پرامپٹ سے بنائیں / Generate Prompt</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {viewMode === "side-by-side" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Original */}
                        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[4/3] group">
                          <img
                            src={userUploadedPhoto || transformedPhoto || ""}
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
                            src={transformedPhoto || userUploadedPhoto || ""}
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

                    {viewMode === "slider" && (
                      <div className="space-y-3">
                        <div className="relative rounded-2xl overflow-hidden border border-sky-500/40 bg-slate-950 aspect-[16/9] shadow-xl select-none">
                          {/* Background (Original) */}
                          <img
                            src={userUploadedPhoto || transformedPhoto || ""}
                            alt="Original Photo"
                            className="absolute inset-0 w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-slate-200 font-bold text-[11px] border border-white/10">
                            Before (Original)
                          </span>

                          {/* Foreground Clip (Modified) */}
                          <div
                            className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white shadow-2xl"
                            style={{ width: `${sliderPosition}%` }}
                          >
                            <img
                              src={transformedPhoto || userUploadedPhoto || ""}
                              alt="AI Modified"
                              className="absolute inset-0 w-full h-full object-cover max-w-none"
                              style={{ width: "100%", height: "100%" }}
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-sky-600/90 backdrop-blur-md text-white font-bold text-[11px] shadow-md flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              After (AI Edit)
                            </span>
                          </div>

                          {/* Slider Handle Line */}
                          <div
                            className="absolute top-0 bottom-0 pointer-events-none flex items-center justify-center"
                            style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
                          >
                            <div className="w-7 h-7 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg font-black text-xs">
                              ↔
                            </div>
                          </div>
                        </div>

                        {/* Range Controller */}
                        <div className="flex items-center gap-3 px-2">
                          <span className="text-[11px] text-slate-400 font-semibold">Original</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={sliderPosition}
                            onChange={(e) => setSliderPosition(Number(e.target.value))}
                            className="flex-1 accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                          />
                          <span className="text-[11px] text-sky-400 font-semibold">AI Modified</span>
                        </div>
                      </div>
                    )}

                    {viewMode === "result" && (
                      <div className="relative rounded-2xl overflow-hidden border border-sky-500/40 bg-slate-950 aspect-[16/9] shadow-xl group">
                        <img
                          src={transformedPhoto || userUploadedPhoto || ""}
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
                          src={userUploadedPhoto || transformedPhoto || ""}
                          alt="Original"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-slate-900 text-slate-300 font-bold text-xs">
                          Uploaded Photo Source
                        </span>
                      </div>
                    )}
                  </>
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => sendPhotoToEditor(transformedPhoto, false)}
                className="py-2.5 px-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20 transition-all cursor-pointer truncate"
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Add to Timeline</span>
              </button>

              <button
                onClick={() => sendPhotoToEditor(transformedPhoto, true)}
                className="py-2.5 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer truncate"
              >
                <Split className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Add as Overlay</span>
              </button>

              <button
                onClick={animatePhotoToVideo}
                className="py-2.5 px-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer truncate"
              >
                <Film className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Animate Video</span>
              </button>

              <button
                onClick={() => handleDownloadMedia(transformedPhoto, "novacut_ai_photo.png")}
                className="py-2.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate text-center"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Download</span>
              </button>
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

            {/* Video Prompt Area with Direct Paste Button & Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>ویڈیو پرامپٹ / AI Video Story Prompt</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePasteToField(setVideoPrompt, "Video Prompt")}
                    className="px-2.5 py-1 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 hover:text-white border border-purple-700/60 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    title="Paste prompt from clipboard"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>📋 پرامپٹ پیسٹ کریں / Paste</span>
                  </button>
                  {videoPrompt && (
                    <button
                      type="button"
                      onClick={() => setVideoPrompt("")}
                      className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-semibold cursor-pointer"
                    >
                      صاف کریں
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={3}
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="e.g. Cinematic 4K drone shot of a futuristic neon city in the rain, ultra-realistic lighting, slow motion 60fps..."
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-purple-500 rounded-2xl p-3 text-slate-200 outline-none leading-relaxed text-xs placeholder-slate-500"
              />
            </div>

            {/* Viral Video Prompt Chips */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                تیز تر پرامپٹ منتخب کریں / 1-Click Video Ideas:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "🎬 Cinematic Drone Mountain", text: "Cinematic 8K drone flight over misty Himalayan mountain peak at golden sunrise, volumetric light rays, 60fps smooth glide" },
                  { label: "🏎️ Cyberpunk Night Drift", text: "High speed drift of a futuristic hypercar in rainy neon Tokyo streets, glowing reflection on asphalt, anamorphic lens" },
                  { label: "🌊 Sunset Ocean Wave", text: "Slow motion breaking crystal ocean wave backlit by warm golden sunset, hyperrealistic water droplets, cinematic 4K" },
                  { label: "🚀 Interstellar Space Nebula", text: "Spaceship travelling through vibrant purple and cyan cosmic nebula, warp speed light trails, Unreal Engine 5 render" },
                  { label: "🐉 Dragon Over Castle", text: "Majestic giant dragon soaring through clouds above a medieval stone castle, cinematic fantasy film masterpiece" },
                  { label: "⚡ Futuristic Neon Portal", text: "Sci-fi dimensional glowing energy portal opening in dark cyberpunk alleyway, particles swirling in vortex" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setVideoPrompt(item.text)}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-950 border border-slate-800 hover:border-purple-500/60 hover:text-purple-300 text-slate-300 transition-all cursor-pointer truncate max-w-[200px]"
                    title={item.text}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
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
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    videoAspect === "16:9" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  16:9 Landscape
                </button>
                <button
                  type="button"
                  onClick={() => setVideoAspect("9:16")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
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
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {videoLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ویڈیو بن رہی ہے... / Synthesizing Video...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate AI Video (10 Credits)</span>
                </>
              )}
            </button>

            {/* NEW DEDICATED LOADING BOX (Below Video Button) */}
            {videoLoading && (
              <div className="p-4 rounded-2xl border-2 border-purple-400/90 bg-gradient-to-b from-purple-950/70 via-slate-950 to-slate-950 shadow-2xl shadow-purple-500/20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-300/60 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <Film className="w-4 h-4 text-purple-100 animate-pulse" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                        <span>ویڈیو بن رہی ہے... لوڈنگ جاری ہے</span>
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                      </h5>
                      <p className="text-[10px] text-purple-300/80 font-medium">Veo 3.1 AI Video Generation In Progress</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-black text-white bg-purple-900 px-2.5 py-0.5 rounded-lg border border-purple-600 shadow-sm">
                    {videoLoadingProgress}%
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-900 rounded-full border border-slate-700/80 overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 via-indigo-500 to-sky-500 rounded-full transition-all duration-300 shadow-[0_0_12px_#c084fc]"
                    style={{ width: `${Math.max(8, videoLoadingProgress)}%` }}
                  />
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-purple-900/60 space-y-1 text-center">
                  <p className="text-slate-200 text-[11px] font-bold">
                    {videoLoadingStage || "ویڈیو فریمز اور کیمرہ موشن کو AI ترتیب دے رہا ہے..."}
                  </p>
                  {videoPrompt && (
                    <p className="text-[10px] text-purple-300/90 font-mono truncate px-2 py-0.5 bg-slate-900/80 rounded-lg">
                      پرومپٹ: "{videoPrompt}"
                    </p>
                  )}
                </div>
              </div>
            )}
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

              {videoLoading ? (
                <div className="mt-4 space-y-4">
                  {/* Cinematic Video Canvas Skeleton */}
                  <div className="relative rounded-2xl overflow-hidden border-2 border-purple-500/70 bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 aspect-[16/9] shadow-2xl flex flex-col items-center justify-center p-6 text-center select-none">
                    {/* Top & Bottom Film Sprocket Hole Simulation */}
                    <div className="absolute top-0 inset-x-0 h-4 bg-black/60 flex items-center justify-between px-3 pointer-events-none border-b border-purple-500/20">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div key={i} className="w-2.5 h-2 rounded-sm bg-purple-400/30 animate-pulse" />
                      ))}
                    </div>
                    <div className="absolute bottom-0 inset-x-0 h-4 bg-black/60 flex items-center justify-between px-3 pointer-events-none border-t border-purple-500/20">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div key={i} className="w-2.5 h-2 rounded-sm bg-purple-400/30 animate-pulse" />
                      ))}
                    </div>

                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#a855f718_1px,transparent_1px),linear-gradient(to_bottom,#a855f718_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none animate-pulse" />
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_20px_#c084fc] pointer-events-none top-1/3 animate-bounce" />

                    <div className="relative mb-3">
                      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-purple-400 animate-[spin_8s_linear_infinite] flex items-center justify-center shadow-lg shadow-purple-500/20" />
                      <div className="absolute inset-2 rounded-xl bg-gradient-to-tr from-purple-600/40 to-indigo-600/40 border border-purple-300/60 flex items-center justify-center backdrop-blur-md animate-pulse">
                        <Film className="w-6 h-6 text-purple-200 animate-pulse" />
                      </div>
                    </div>

                    <div className="relative z-10 space-y-2 max-w-sm w-full">
                      <p className="text-purple-400 font-bold text-xs flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                        <span>Veo 3.1 سنیماٹک ویڈیو فریمز رینڈر ہو رہے ہیں...</span>
                      </p>
                      <p className="text-slate-300 text-[11px] font-mono truncate px-2.5 py-1 bg-slate-950/90 rounded-lg border border-purple-800/60 shadow-inner">
                        "{videoPrompt || "Cinematic 1080p 60fps sequence"}"
                      </p>

                      {/* Equalizer Waveform Skeleton */}
                      <div className="flex items-center justify-center gap-1 pt-1">
                        <span className="text-[10px] text-purple-300 font-mono mr-1.5">AI Audio:</span>
                        {[8, 16, 24, 12, 28, 20, 14, 22, 10, 18, 26, 12].map((h, i) => (
                          <div
                            key={i}
                            className="w-1 bg-purple-400 rounded-full animate-pulse shadow-sm"
                            style={{ height: `${h}px`, animationDelay: `${i * 100}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3 Storyboard Scene Skeletons */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-44 rounded bg-slate-800 animate-pulse" />
                      <div className="h-4 w-20 rounded bg-purple-950/60 border border-purple-800/40 animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { time: "00:00 - 00:03", cam: "Wide Cinematic Establishing Shot" },
                        { time: "00:03 - 00:07", cam: "Dynamic Orbit Close-up Pan" },
                        { time: "00:07 - 00:10", cam: "Dramatic Slow-Motion Climax" },
                      ].map((s, idx) => (
                        <div key={idx} className="p-3 rounded-2xl bg-slate-950 border border-purple-900/40 text-[11px] space-y-2 animate-pulse">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-purple-400 font-bold">{s.time}</span>
                            <span className="w-2 h-2 rounded-full bg-purple-500/50" />
                          </div>
                          <div className="space-y-1">
                            <div className="h-3 w-3/4 rounded bg-slate-800" />
                            <div className="h-2.5 w-1/2 rounded bg-slate-850" />
                          </div>
                          <span className="text-[10px] text-purple-300/80 block font-mono">
                            📹 {s.cam}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : generatedVideo ? (
                <div className="mt-4 space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[16/9] shadow-2xl">
                    <video
                      src={generatedVideo.videoUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
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
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[16/9] shadow-2xl flex flex-col items-center justify-center p-6 text-center group">
                    <video
                      src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                    />
                    <div className="relative z-10 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-600/80 border border-purple-400/40 flex items-center justify-center mx-auto shadow-lg shadow-purple-600/30">
                        <Film className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">AI Video Director Ready</h4>
                        <p className="text-xs text-slate-300 max-w-sm mt-1">
                          پرامپٹ لکھیں یا اوپر دی گئی مثالوں پر کلک کر کے فوری 1080p 60fps ویڈیو بنائیں!
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateVideo}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 cursor-pointer"
                      >
                        ⚡ Generate Demo Video Now
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              {generatedVideo && (
                <button
                  onClick={() => handleDownloadMedia(generatedVideo.videoUrl, "novacut_ai_video.mp4")}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Video</span>
                </button>
              )}
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
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>AI Photo Generator</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full">
                Cost: 5 Credits
              </span>
            </div>

            {/* Image Prompt Area with Direct Paste Button & Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>فوٹو پرامپٹ / AI Photo Description</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePasteToField(setImagePrompt, "Photo Prompt")}
                    className="px-2.5 py-1 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 hover:text-white border border-cyan-700/60 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    title="Paste prompt from clipboard"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>📋 پرامپٹ پیسٹ کریں / Paste</span>
                  </button>
                  {imagePrompt && (
                    <button
                      type="button"
                      onClick={() => setImagePrompt("")}
                      className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-semibold cursor-pointer"
                    >
                      صاف کریں
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={3}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="e.g. 8K photorealistic portrait of an astronaut with visor reflection, dramatic studio lighting, octane render..."
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-2xl p-3 text-slate-200 outline-none leading-relaxed text-xs placeholder-slate-500"
              />
            </div>

            {/* Quick Photo Prompt Chips */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                تیز تر پرامپٹ منتخب کریں / 1-Click Photo Ideas:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "📸 8K Studio Portrait", text: "High-end fashion studio portrait with dramatic rim lighting, sharp 85mm focus, natural skin texture, 8K resolution" },
                  { label: "🏎️ Matte Black Supercar", text: "Sleek matte black hypercar parked on wet asphalt in neon-lit rainy Tokyo night, hyperrealistic reflections" },
                  { label: "🏔️ Himalayan Temple", text: "Ancient monastery nestled on towering snowy Himalayan cliff at sunrise, golden sunlight rays, photorealistic" },
                  { label: "🌸 Sakura Garden Bokeh", text: "Peaceful Japanese zen garden with blooming pink cherry blossoms, tranquil koi pond, soft morning bokeh" },
                  { label: "🐉 Crystal Cave Dragon", text: "Mythical glowing crystal dragon perched inside a bioluminescent cavern with sparkling amethyst geodes" },
                  { label: "🎨 Cyberpunk Warrior", text: "Cyberpunk street warrior with glowing cybernetic implants, neon armor, standing in rainy futuristic metropolis" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImagePrompt(item.text)}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-950 border border-slate-800 hover:border-cyan-500/60 hover:text-cyan-300 text-slate-300 transition-all cursor-pointer truncate max-w-[200px]"
                    title={item.text}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Style</label>
                <select
                  value={imageStyle}
                  onChange={(e) => setImageStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-cyan-500"
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
                  className="w-full bg-slate-950 border border-slate-700/80 text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-cyan-500"
                >
                  <option value="16:9">16:9 Landscape</option>
                  <option value="9:16">9:16 Portrait / Story</option>
                  <option value="1:1">1:1 Square</option>
                </select>
              </div>
            </div>

            {/* Number of Variations Selector (1-4) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Number of Variations</span>
                  <span className="text-[10px] text-cyan-400 font-normal">(Independent Seeds)</span>
                </label>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Total: {5 * imageVariationsCount} Credits
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setImageVariationsCount(num)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer border flex flex-col items-center justify-center ${
                      imageVariationsCount === num
                        ? "bg-gradient-to-tr from-cyan-900/60 to-indigo-900/60 text-cyan-200 border-cyan-400 shadow-md shadow-cyan-500/20"
                        : "bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-sm font-black">{num}</span>
                    <span className="text-[9px] opacity-80">{num === 1 ? "Output" : "Outputs"}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateImage}
              disabled={imageLoading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {imageLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>تصویر بن رہی ہے... / Synthesizing {imageVariationsCount} Variation{imageVariationsCount > 1 ? "s" : ""}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Generate Photo from Prompt ({5 * imageVariationsCount} Credits)</span>
                </>
              )}
            </button>

            {/* Granular Loading Skeleton & Progress Feedback */}
            {imageLoading && (
              <div className="p-4 rounded-2xl border-2 border-cyan-400/90 bg-gradient-to-b from-cyan-950/70 via-slate-950 to-slate-950 shadow-2xl shadow-cyan-500/20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 border border-cyan-300/60 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <Sparkles className="w-4 h-4 text-cyan-100 animate-spin" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                        <span>تصویر بن رہی ہے... لوڈنگ جاری ہے</span>
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      </h5>
                      <p className="text-[10px] text-cyan-300/80 font-medium">
                        Processing {imageVariationsCount} independent variation{imageVariationsCount > 1 ? "s" : ""} in 8K Ultra HD
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-black text-white bg-cyan-950 px-2.5 py-0.5 rounded-lg border border-cyan-600 shadow-sm">
                    {imageLoadingProgress}%
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-900 rounded-full border border-slate-700/80 overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 rounded-full transition-all duration-300 shadow-[0_0_12px_#22d3ee]"
                    style={{ width: `${Math.max(8, imageLoadingProgress)}%` }}
                  />
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-cyan-900/60 space-y-1 text-center">
                  <p className="text-slate-200 text-[11px] font-bold">
                    {imageLoadingStage || "تصویر کو AI پرومپٹ کے مطابق تیار کیا جا رہا ہے..."}
                  </p>
                  {imagePrompt && (
                    <p className="text-[10px] text-cyan-300/90 font-mono truncate px-2 py-0.5 bg-slate-900/80 rounded-lg">
                      پرومپٹ: "{imagePrompt}"
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-200">High-Res Render</span>
                  {generatedVariations.length > 1 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Variation {selectedVariationIndex + 1} of {generatedVariations.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                  {imageAspect} • 8K Master
                </span>
              </div>

              {imageLoading ? (
                <div className="mt-4 space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-500/70 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 aspect-[16/9] shadow-2xl flex flex-col items-center justify-center p-6 text-center select-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d418_1px,transparent_1px),linear-gradient(to_bottom,#06b6d418_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none animate-pulse" />
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] pointer-events-none top-1/3 animate-bounce" />
                    <div className="relative mb-4">
                      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-cyan-400 animate-[spin_8s_linear_infinite] flex items-center justify-center shadow-lg shadow-cyan-500/20" />
                      <div className="absolute inset-2 rounded-xl bg-gradient-to-tr from-cyan-600/40 to-sky-600/40 border border-cyan-300/60 flex items-center justify-center backdrop-blur-md animate-pulse">
                        <Sparkles className="w-6 h-6 text-cyan-200 animate-spin" style={{ animationDuration: "4s" }} />
                      </div>
                    </div>
                    <div className="relative z-10 space-y-2 max-w-sm w-full">
                      <p className="text-cyan-400 font-bold text-xs flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span>{imageLoadingStage || "8K الٹرا ایچ ڈی فوٹو تیار ہو رہی ہے..."}</span>
                      </p>
                      <p className="text-slate-300 text-[11px] font-mono truncate px-2 py-1 bg-slate-950/80 rounded-lg border border-slate-800">
                        "{imagePrompt || "8K realistic portrait and landscape"}"
                      </p>
                    </div>
                  </div>

                  {/* Multi-Variation Skeletons */}
                  {imageVariationsCount > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: imageVariationsCount }).map((_, i) => (
                        <div
                          key={i}
                          className="h-16 rounded-xl bg-slate-950/90 border border-cyan-500/30 animate-pulse flex items-center justify-center text-[10px] text-cyan-400 font-mono"
                        >
                          Slot #{i + 1}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[16/9] shadow-2xl group">
                    <img
                      src={generatedVariations[selectedVariationIndex] || generatedImage}
                      alt={`Generated Variation ${selectedVariationIndex + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Variations Thumbnail Selector Gallery */}
                  {generatedVariations.length > 1 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        Select Variation ({generatedVariations.length} Available):
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {generatedVariations.map((varUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedVariationIndex(idx);
                              setGeneratedImage(varUrl);
                            }}
                            className={`relative h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                              selectedVariationIndex === idx
                                ? "border-cyan-400 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/30 scale-102"
                                : "border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-600"
                            }`}
                          >
                            <img
                              src={varUrl}
                              alt={`Variation ${idx + 1}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 py-0.5 text-center text-[9px] font-bold text-white">
                              Var #{idx + 1}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => handleDownloadMedia(generatedVariations[selectedVariationIndex] || generatedImage, `novacut_ai_photo_var${selectedVariationIndex + 1}.png`)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Selected Photo</span>
              </button>
              <button
                onClick={() => sendPhotoToEditor(generatedVariations[selectedVariationIndex] || generatedImage, false)}
                className="py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
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

            {/* Prompt & Hook Input Area with Direct Paste Buttons & Viral Presets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                    <span>ویڈیو کا موضوع / Video Topic</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePasteToField(setThumbTopic, "Video Topic")}
                    className="px-2.5 py-0.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-700/60 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    title="Paste topic from clipboard"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>📋 پیسٹ کریں / Paste</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={thumbTopic}
                  onChange={(e) => setThumbTopic(e.target.value)}
                  placeholder="e.g. How I Built a $10k AI Business in 30 Days..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-slate-200 outline-none focus:border-rose-500 text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>تھمب نیل ہک ٹیکسٹ / Headline Text Hook</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePasteToField(setThumbHeadline, "Headline Hook")}
                    className="px-2.5 py-0.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-700/60 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    title="Paste headline hook"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>📋 پیسٹ کریں / Paste</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={thumbHeadline}
                  onChange={(e) => setThumbHeadline(e.target.value)}
                  placeholder="e.g. 10X FASTER! or $10,000 SECRET"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-slate-200 outline-none focus:border-rose-500 text-xs font-bold text-amber-300"
                />
              </div>
            </div>

            {/* Quick Viral Topic Chips */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                وائرل ٹاپک آئیڈیاز منتخب کریں / 1-Click Viral Topics:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { topic: "I Made an AI Movie in 24 Hours with Zero Budget", hook: "100% FREE AI!" },
                  { topic: "Top 7 Secret AI Tools Nobody Is Talking About", hook: "DON'T MISS THIS" },
                  { topic: "How to Make $5,000/Month with AI Faceless Channels", hook: "$5,000/MO PROOF" },
                  { topic: "The Dark Future of Artificial Intelligence Explained", hook: "THEY LIED?!" },
                  { topic: "Stop Editing Videos Manually - Use This AI Workflow", hook: "1-CLICK EDIT" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setThumbTopic(item.topic);
                      setThumbHeadline(item.hook);
                    }}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-950 border border-slate-800 hover:border-rose-500/60 hover:text-rose-300 text-slate-300 transition-all cursor-pointer truncate max-w-[240px]"
                    title={`${item.topic} (${item.hook})`}
                  >
                    🔥 {item.hook}: {item.topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-1/2">
                <label className="text-slate-300 block mb-1 font-semibold">Visual Style</label>
                <select
                  value={thumbStyle}
                  onChange={(e) => setThumbStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-rose-500 text-xs"
                >
                  <option value="vibrant_youtube">Vibrant Neon YouTube</option>
                  <option value="dark_mystery">Dark Mystery / Documentary</option>
                  <option value="minimalist_clean">Clean Tech Minimalist</option>
                </select>
              </div>

              <div className="w-full sm:w-1/2 flex items-end">
                <button
                  onClick={handleGenerateThumbnails}
                  disabled={thumbLoading}
                  className="w-full py-3 px-6 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 transition-all cursor-pointer disabled:opacity-50 text-xs"
                >
                  {thumbLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>تھمب نیلز ڈیزائن ہو رہے ہیں...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate 3 High-CTR Thumbnails (5 Credits)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* NEW DEDICATED LOADING BOX (Below Thumbnail Button) */}
            {thumbLoading && (
              <div className="p-4 rounded-2xl border-2 border-rose-400/90 bg-gradient-to-b from-rose-950/70 via-slate-950 to-slate-950 shadow-2xl shadow-rose-500/20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 border border-rose-300/60 flex items-center justify-center shadow-lg shadow-rose-500/30">
                      <Sparkles className="w-4 h-4 text-rose-100 animate-spin" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                        <span>تھمب نیلز بن رہے ہیں... لوڈنگ جاری ہے</span>
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                      </h5>
                      <p className="text-[10px] text-rose-300/80 font-medium">YouTube High-CTR Thumbnail Design In Progress</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-black text-white bg-rose-950 px-2.5 py-0.5 rounded-lg border border-rose-600 shadow-sm">
                    {thumbLoadingProgress}%
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-900 rounded-full border border-slate-700/80 overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-rose-400 via-pink-500 to-indigo-500 rounded-full transition-all duration-300 shadow-[0_0_12px_#fb7185]"
                    style={{ width: `${Math.max(8, thumbLoadingProgress)}%` }}
                  />
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-rose-900/60 space-y-1 text-center">
                  <p className="text-slate-200 text-[11px] font-bold">
                    {thumbLoadingStage || "3 وائرل یوٹیوب تھمب نیل کنسیپٹس ڈیزائن ہو رہے ہیں..."}
                  </p>
                  {(thumbTopic || thumbHeadline) && (
                    <p className="text-[10px] text-rose-300/90 font-mono truncate px-2 py-0.5 bg-slate-900/80 rounded-lg">
                      عنوان: "{thumbTopic || thumbHeadline}"
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {thumbLoading ? (
            <div className="space-y-4">
              {/* 3-Card YouTube Thumbnail Skeleton Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { badge: "HIGH CTR 99.4%", color: "border-rose-500/50", title: "Concept #1: High Contrast Curiosity Hook" },
                  { badge: "VIRAL RETENTION", color: "border-pink-500/50", title: "Concept #2: Bold Reaction & Dramatic Cutout" },
                  { badge: "EXPLOSIVE REACH", color: "border-amber-500/50", title: "Concept #3: Minimalist 3D Isometric Glow" },
                ].map((sk, idx) => (
                  <div
                    key={idx}
                    className={`bg-slate-900/90 border-2 ${sk.color} rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between animate-pulse`}
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-slate-950 via-rose-950/20 to-slate-950 p-4 flex flex-col justify-between">
                      {/* Top Bar: Badge & Face placeholder */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-400/40">
                          {sk.badge}
                        </span>
                        <div className="w-9 h-9 rounded-full bg-slate-800/80 border border-rose-400/30 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-rose-300 animate-spin" />
                        </div>
                      </div>

                      {/* Moving laser scanline */}
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-rose-400 to-transparent shadow-[0_0_15px_#fb7185] pointer-events-none top-1/2 animate-bounce" />

                      {/* Hook text wireframes */}
                      <div className="space-y-1.5 z-10">
                        <div className="h-5 w-4/5 rounded-lg bg-slate-800/90" />
                        <div className="h-3 w-1/2 rounded bg-slate-850" />
                      </div>
                    </div>

                    <div className="p-4 space-y-3 bg-slate-950/90 border-t border-slate-800/80">
                      <div className="h-3 w-3/4 rounded bg-slate-800" />
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="h-8 rounded-xl bg-slate-900 border border-slate-800" />
                        <div className="h-8 rounded-xl bg-rose-950/60 border border-rose-800/40" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
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
                    
                    {/* If user uploaded their face, show creator badge */}
                    {thumbUploadedPhoto && (
                      <div className="absolute top-3 right-3 w-10 h-10 rounded-full border-2 border-white shadow-xl overflow-hidden">
                        <img src={thumbUploadedPhoto} alt="Creator" className="w-full h-full object-cover" />
                      </div>
                    )}

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

                  <div className="p-4 flex items-center justify-between bg-slate-950/90 border-t border-slate-800 gap-2">
                    <span className="text-[11px] text-slate-400 font-medium truncate max-w-[120px]">
                      {thumb.title}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleDownloadMedia(thumb.backgroundUrl, `novacut_thumbnail_${thumb.id}.jpg`)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-all cursor-pointer"
                        title="Download thumbnail image"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => sendPhotoToEditor(thumb.backgroundUrl, false)}
                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Use in Video</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

            {/* Brand Details & Prompt Area with Direct Paste Buttons & Ideas */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-emerald-400" />
                  <span>برانڈ / چینل کا نام / Brand or Channel Name</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePasteToField(setBrandName, "Brand Name")}
                  className="px-2.5 py-0.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 hover:text-white border border-emerald-700/60 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                  title="Paste brand name from clipboard"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>📋 پیسٹ کریں / Paste</span>
                </button>
              </div>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Apex Dynamics, TechNova, Alpha Media"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-slate-200 outline-none focus:border-emerald-500 text-xs font-bold"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>انڈسٹری / لوگو پرامپٹ / Industry & Concept</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePasteToField(setBrandIndustry, "Industry & Concept")}
                  className="px-2.5 py-0.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 hover:text-white border border-emerald-700/60 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                  title="Paste concept from clipboard"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>📋 پیسٹ کریں / Paste</span>
                </button>
              </div>
              <input
                type="text"
                value={brandIndustry}
                onChange={(e) => setBrandIndustry(e.target.value)}
                placeholder="e.g. AI Video Creation, Gaming Studio, Cyber Security"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-slate-200 outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            {/* Quick Logo Presets */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                تیز تر برانڈ آئیڈیاز منتخب کریں / 1-Click Brand Ideas:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: "NovaVision AI", industry: "Next-gen AI Video & Motion Studio", style: "modern minimalist" },
                  { name: "CyberPulse Gaming", industry: "Esports & High-tech Gaming Community", style: "cyberpunk geometric" },
                  { name: "Apex Global Capital", industry: "Fintech, Crypto & Wealth Tech", style: "modern minimalist" },
                  { name: "Falcon Express", industry: "Global Drone Delivery & Logistics", style: "gradient 3d" },
                  { name: "Heritage Roasters", industry: "Artisan Organic Coffee & Cafe", style: "vintage emblem" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setBrandName(item.name);
                      setBrandIndustry(item.industry);
                      setBrandStyle(item.style);
                    }}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-950 border border-slate-800 hover:border-emerald-500/60 hover:text-emerald-300 text-slate-300 transition-all cursor-pointer truncate max-w-[200px]"
                    title={`${item.name} - ${item.industry}`}
                  >
                    ✨ {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Design Style</label>
              <select
                value={brandStyle}
                onChange={(e) => setBrandStyle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-xs"
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
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-98 cursor-pointer disabled:opacity-50 text-xs"
            >
              {logoLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ویکٹر برانڈ لوگو ڈیزائن ہو رہا ہے...</span>
                </>
              ) : (
                <>
                  <Palette className="w-4 h-4" />
                  <span>Generate Vector SVG Logo from Prompt (5 Credits)</span>
                </>
              )}
            </button>

            {/* NEW DEDICATED LOADING BOX (Below Logo Button) */}
            {logoLoading && (
              <div className="p-4 rounded-2xl border-2 border-emerald-400/90 bg-gradient-to-b from-emerald-950/70 via-slate-950 to-slate-950 shadow-2xl shadow-emerald-500/20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 border border-emerald-300/60 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <Palette className="w-4 h-4 text-emerald-100 animate-pulse" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                        <span>لوگو بن رہا ہے... لوڈنگ جاری ہے</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      </h5>
                      <p className="text-[10px] text-emerald-300/80 font-medium">Scalable Vector SVG Brand Identity Rendering</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-black text-white bg-emerald-950 px-2.5 py-0.5 rounded-lg border border-emerald-600 shadow-sm">
                    {logoLoadingProgress}%
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-900 rounded-full border border-slate-700/80 overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-teal-500 to-sky-500 rounded-full transition-all duration-300 shadow-[0_0_12px_#34d399]"
                    style={{ width: `${Math.max(8, logoLoadingProgress)}%` }}
                  />
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-emerald-900/60 space-y-1 text-center">
                  <p className="text-slate-200 text-[11px] font-bold">
                    {logoLoadingStage || "ویکٹر SVG برانڈ لوگو ڈیزائن ہو رہا ہے..."}
                  </p>
                  {brandName && (
                    <p className="text-[10px] text-emerald-300/90 font-mono truncate px-2 py-0.5 bg-slate-900/80 rounded-lg">
                      برانڈ: "{brandName}"
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-sm text-slate-200">Vector SVG Logo Output</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Scalable SVG & Brand Kit
                </span>
              </div>

              {/* Rendered SVG Preview / Loading Skeleton */}
              {logoLoading ? (
                <div className="mt-4 space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/70 bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950 aspect-[16/9] shadow-2xl flex flex-col items-center justify-center p-6 text-center select-none">
                    {/* Precision Vector Coordinate Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98118_1px,transparent_1px),linear-gradient(to_bottom,#10b98118_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none animate-pulse" />
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#34d399] pointer-events-none top-1/3 animate-bounce" />

                    {/* Vector Anchor Nodes at corners */}
                    <div className="absolute top-4 left-4 w-2.5 h-2.5 rounded-sm bg-emerald-400 border border-white animate-ping" />
                    <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-sm bg-emerald-400 border border-white animate-ping" />
                    <div className="absolute bottom-4 left-4 w-2.5 h-2.5 rounded-sm bg-emerald-400 border border-white animate-ping" />
                    <div className="absolute bottom-4 right-4 w-2.5 h-2.5 rounded-sm bg-emerald-400 border border-white animate-ping" />

                    <div className="relative mb-3">
                      <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-emerald-400 animate-[spin_8s_linear_infinite] flex items-center justify-center shadow-lg shadow-emerald-500/20" />
                      <div className="absolute inset-2.5 rounded-xl bg-gradient-to-tr from-emerald-600/40 to-teal-600/40 border border-emerald-300/60 flex items-center justify-center backdrop-blur-md animate-pulse">
                        <Palette className="w-7 h-7 text-emerald-200 animate-spin" style={{ animationDuration: "4s" }} />
                      </div>
                    </div>

                    <div className="relative z-10 space-y-2 max-w-sm w-full">
                      <p className="text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>{logoLoadingStage || "ویکٹر SVG برانڈ لوگو ڈیزائن ہو رہا ہے..."}</span>
                      </p>
                      <p className="text-slate-300 text-[11px] font-mono truncate px-3 py-1 bg-slate-950/90 rounded-xl border border-emerald-800/60 shadow-inner">
                        "{brandName || "Modern Brand Identity"}"
                      </p>
                    </div>
                  </div>

                  {/* Brand Color Palette Skeletons */}
                  <div className="space-y-2">
                    <p className="font-bold text-xs text-slate-400">AI Vector Brand Color Palette (5 Swatches)</p>
                    <div className="grid grid-cols-5 gap-2">
                      {["#10b981", "#06b6d4", "#6366f1", "#f59e0b", "#ec4899"].map((hex, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-2xl border border-emerald-500/30 bg-slate-950 text-center space-y-1.5 animate-pulse"
                        >
                          <div className="w-full h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/40" />
                          <div className="h-2.5 w-3/4 mx-auto rounded bg-slate-800" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-8 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center min-h-[220px]">
                  <div
                    dangerouslySetInnerHTML={{ __html: logoData.svg }}
                    className="w-full max-w-sm h-auto flex items-center justify-center"
                  />
                </div>
              )}

              {/* Brand Palette (Visible when not loading) */}
              {!logoLoading && (
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
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={handleDownloadSvg}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download SVG</span>
              </button>
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

      {/* ========================================================================= */}
      {/* TAB 6: AI PROMPT STUDIO & ENHANCER (FREE TIER GEMINI 3.7 / 2.5 FLASH) */}
      {/* ========================================================================= */}
      {activeTab === "prompt-studio" && (
        <div className="space-y-6">
          {/* Top Quick Inspiration Chips */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-amber-400" />
                  <span>AI Prompt Studio & Master Expander (AI پرامپٹ سٹوڈیو)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  اپنے عام آئیڈیا کو Hollywood / Midjourney گریڈ پرامپٹ میں تبدیل کریں اور ایک کلک سے کسی بھی ٹول میں استعمال کریں۔
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full shrink-0 self-start sm:self-auto">
                ⚡ 100% Free Tier Ready
              </span>
            </div>

            {/* Quick Inspiration Chips */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                فوری آئیڈیاز منتخب کریں / Quick Ideas:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "🎬 Cinematic Drone Flight", text: "Cinematic 8K drone flight over an ancient misty mountain monastery at sunrise with volumetric light rays", cat: "video" as const, style: "cinematic" },
                  { label: "📸 Studio Portrait Glamour", text: "High-end fashion studio portrait with dramatic rim lighting, sharp 85mm focus, and elegant shadows", cat: "image" as const, style: "photorealistic" },
                  { label: "🐱 Cute Cat on Beach", text: "Keep me in the photo, change background to tropical sunset beach, and add a fluffy cute kitten beside me", cat: "photo-edit" as const, style: "photorealistic" },
                  { label: "🏙️ Cyberpunk Rainy Night", text: "Cyberpunk metropolis street in pouring rain with glowing neon billboards and flying vehicles", cat: "video" as const, style: "cyberpunk" },
                  { label: "🔥 Viral YouTube Tech Hook", text: "I Tried Making an AI Movie in 24 Hours and THIS Happened! High CTR bold text with glowing studio background", cat: "thumbnail" as const, style: "vibrant" },
                  { label: "🏷️ Minimalist Vector Logo", text: "Ultra sleek modern monogram logo for a luxury AI filmmaking studio with geometric curves and gold gradient", cat: "logo" as const, style: "modern" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPromptTopic(item.text);
                      setPromptCategory(item.cat);
                      setPromptStyle(item.style);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 border border-slate-800 hover:border-amber-500/60 hover:text-amber-300 text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
              <div className="md:col-span-6 space-y-2">
                <label className="text-slate-200 block font-bold text-xs">
                  آپ کا بنیادی آئیڈیا یا موضوع / Your Raw Idea or Theme:
                </label>
                <textarea
                  rows={3}
                  value={promptTopic}
                  onChange={(e) => setPromptTopic(e.target.value)}
                  placeholder="e.g. A robotic samurai standing under cherry blossoms in futuristic Tokyo..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 resize-none"
                />
              </div>

              <div className="md:col-span-3 space-y-2">
                <label className="text-slate-200 block font-bold text-xs">
                  ٹارگٹ ٹول / Target Tool Category:
                </label>
                <select
                  value={promptCategory}
                  onChange={(e) => setPromptCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500"
                >
                  <option value="video">🎥 AI Video Gen (Sora / Veo)</option>
                  <option value="image">🖼️ Photo Generator (Flux / Midjourney)</option>
                  <option value="photo-edit">📸 Photo & Background Mod</option>
                  <option value="thumbnail">📺 YouTube & Social Thumbnails</option>
                  <option value="logo">🏷️ AI Vector Logo & Brand</option>
                  <option value="capcut">✂️ CapCut Viral Video Script</option>
                </select>

                <div className="pt-1">
                  <label className="text-slate-200 block font-bold text-xs mb-1">
                    ویژول سٹائل / Visual Style:
                  </label>
                  <select
                    value={promptStyle}
                    onChange={(e) => setPromptStyle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                  >
                    <option value="cinematic">Cinematic 8K Masterpiece</option>
                    <option value="photorealistic">Photorealistic Studio Lighting</option>
                    <option value="cyberpunk">Cyberpunk Neon Night</option>
                    <option value="anime">Anime & Ghibli Fantasy</option>
                    <option value="vintage">Vintage 35mm Film Grain</option>
                    <option value="minimalist">Minimalist 3D Isometric</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-3 flex flex-col justify-end">
                <button
                  id="generate-prompts-action-btn"
                  onClick={handleGeneratePrompts}
                  disabled={promptLoading || !promptTopic.trim()}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {promptLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>پرامپٹس بن رہے ہیں...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Generate AI Prompts (پرامپٹ بنائیں)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Prompt Studio Loader */}
            {promptLoading && (
              <div className="p-4 rounded-2xl border border-amber-500/60 bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950 shadow-xl space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                      <Wand2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs">AI Prompt Optimization Engine Active</p>
                      <p className="text-[10px] text-amber-300/80">{promptLoadingStage || "Gemini 3.7 Flash Crafting Prompts..."}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60">
                    {promptLoadingProgress}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(10, promptLoadingProgress)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Generated Prompts Display Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>4 Production-Grade Master Prompts (4 ماسٹر پرامپٹ ویریئنٹس)</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {promptLoading ? "AI ماسٹر پرامپٹس بن رہے ہیں..." : `موضوع: "${generatedPrompts.expandedIdea.slice(0, 40)}..."`}
              </span>
            </div>

            {promptLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "Master Cinematic Angle & 8K Volumetric Lighting", badge: "Variant #1" },
                  { title: "Hyper-Realistic Photoreal & Micro Texture Focus", badge: "Variant #2" },
                  { title: "Dynamic Action Framing & Anamorphic Lens Flare", badge: "Variant #3" },
                  { title: "Stylized Studio Render & High Contrast Depth", badge: "Variant #4" },
                ].map((sk, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-5 space-y-4 flex flex-col justify-between animate-pulse"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 w-3/4">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-300 text-[10px] font-black flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-sm text-amber-200/90 truncate block">
                              {sk.title}
                            </span>
                          </div>
                          <div className="h-3 w-28 rounded bg-slate-800" />
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800" />
                      </div>

                      {/* Prompt body skeleton wireframe */}
                      <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800/80 space-y-2">
                        <div className="h-3.5 w-full rounded bg-slate-800" />
                        <div className="h-3.5 w-5/6 rounded bg-slate-800" />
                        <div className="h-3.5 w-2/3 rounded bg-slate-850" />
                      </div>

                      {/* Meta Pills Skeletons */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-10 rounded-xl bg-slate-950/60 border border-slate-800/60" />
                        <div className="h-10 rounded-xl bg-slate-950/60 border border-slate-800/60" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <div className="h-8 flex-1 rounded-xl bg-slate-950 border border-slate-800" />
                      <div className="h-8 flex-1 rounded-xl bg-amber-950/40 border border-amber-800/40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedPrompts.prompts.map((p, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-5 space-y-4 flex flex-col justify-between transition-all group"
                  >
                    <div className="space-y-3">
                      {/* Header with Title & Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-black flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <h5 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                              {p.title}
                            </h5>
                          </div>
                          {p.aspectRatio && (
                            <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                              Aspect Ratio: {p.aspectRatio}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleCopyPromptText(p.prompt, idx)}
                          className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 text-slate-300 hover:text-amber-300 transition-all cursor-pointer shrink-0"
                          title="Copy Prompt"
                        >
                          {copiedPromptIndex === idx ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Main Prompt Text Box */}
                      <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800/80 font-mono text-[11px] text-slate-300 leading-relaxed max-h-32 overflow-y-auto select-text">
                        {p.prompt}
                      </div>

                      {/* Meta Parameters (Camera & Lighting) */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {p.camera && (
                          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-slate-400 truncate">
                            <span className="font-bold text-slate-300 block">🎥 Camera:</span>
                            <span className="truncate block">{p.camera}</span>
                          </div>
                        )}
                        {p.lighting && (
                          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-slate-400 truncate">
                            <span className="font-bold text-slate-300 block">💡 Lighting:</span>
                            <span className="truncate block">{p.lighting}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {p.tags && p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {p.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-semibold"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 1-Click Send to Tools Actions */}
                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleCopyPromptText(p.prompt, idx)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copiedPromptIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPromptIndex === idx ? "Copied!" : "Copy"}</span>
                      </button>

                      {promptCategory === "photo-edit" || promptCategory === "image" ? (
                        <button
                          onClick={() => handleUsePromptInTool("photo-edit", p.prompt)}
                          className="px-3 py-1.5 bg-sky-600/80 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Use in Photo Edit</span>
                        </button>
                      ) : null}

                      {promptCategory === "video" || promptCategory === "capcut" ? (
                        <button
                          onClick={() => handleUsePromptInTool("video", p.prompt)}
                          className="px-3 py-1.5 bg-purple-600/80 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Film className="w-3.5 h-3.5" />
                          <span>Use in Video Gen</span>
                        </button>
                      ) : null}

                      <button
                        onClick={() => handleUsePromptInTool("image", p.prompt)}
                        className="px-3 py-1.5 bg-cyan-600/80 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Use in Photo Gen</span>
                      </button>

                      {promptCategory === "thumbnail" && (
                        <button
                          onClick={() => handleUsePromptInTool("thumbnail", p.prompt)}
                          className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Use in Thumbnail</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
