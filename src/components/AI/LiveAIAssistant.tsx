import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Download,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Play,
  Zap,
  Copy,
  Languages,
  Crown,
  ChevronDown,
  Layers,
  Wand2,
  Video,
  Image as ImageIcon,
  Sliders,
  Scissors,
  FileText,
  HelpCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useEditor, NavTab } from "../../context/EditorContext";
import { useAuth, DAILY_CREDITS_MAX, JAZZCASH_NUMBER, COST_PHOTO, COST_VIDEO, COST_PROMPT } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";

interface GeneratedImageItem {
  url: string;
  prompt: string;
  timestamp: string;
  style?: string;
}

interface PromptCraftItem {
  title: string;
  category: "video" | "image" | "thumbnail" | "logo" | "script";
  prompt: string;
  negativePrompt?: string;
  recommendedAspect?: "16:9" | "9:16" | "1:1";
  tip?: string;
  language?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  image?: GeneratedImageItem;
  isLoadingImage?: boolean;
  isWebsiteInfo?: boolean;
  promptCraft?: PromptCraftItem;
  languageDetected?: string;
}

interface GuideCommand {
  category: "urdu" | "prompt" | "image" | "ratio" | "photo" | "timeline" | "studio";
  title: string;
  phrase: string;
  description: string;
  badge: string;
  actionPrompt: string;
  sampleReply: string;
}

export const LiveAIAssistant: React.FC = () => {
  const { setActiveTab, setProject, project, addClipToTrack, setActivePanel } = useEditor();
  const { user, isAdmin, deductCredits, resetDailyCredits, setJazzCashModalOpen, addNotification } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTabAssistant] = useState<"chat" | "guide" | "tools">("chat");
  const [guideCategory, setGuideCategory] = useState<string>("all");
  
  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isLiveVoiceMode, setIsLiveVoiceMode] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState<"auto" | "ur" | "en">("auto");
  const [isLoading, setIsLoading] = useState(false);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [executingGuideId, setExecutingGuideId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome_msg",
      role: "assistant",
      text: "سلام! میں نووا کٹ اسٹوڈیو میں آپ کا جیمنائی لائیو اسسٹنٹ ہوں۔ آپ مجھ سے اردو، انگلش یا کسی بھی زبان میں بات کر سکتے ہیں۔ مجھ سے پرامپٹ لکھوائیں، تصاویر بنوائیں، یا ویڈیو ایڈیٹنگ کا کام کروائیں۔\n\nHello! I am your Gemini Live AI Assistant. You can speak or type in Urdu, English, or any language. How can I help you today?",
      timestamp: "Just now",
      languageDetected: "Urdu / English",
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLiveVoiceModeRef = useRef(isLiveVoiceMode);
  isLiveVoiceModeRef.current = isLiveVoiceMode;

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen && !isMinimized && activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized, isLoading, activeTab]);

  // Helper to detect if text is predominantly Urdu
  const isUrduText = (str: string): boolean => {
    return /[\u0600-\u06FF]/.test(str) || /\b(urdu|kya|hai|banao|karo|video|tasweer|kaise|chahiye|shukriya)\b/i.test(str);
  };

  // Speech Synthesis (TTS) - Speaks back the response in the correct language
  const speakText = (text: string, onFinish?: () => void) => {
    if (!ttsEnabled || !("speechSynthesis" in window)) {
      if (onFinish) onFinish();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      // Strip markdown, asterisks, brackets, and code blocks for crisp vocal pronunciation
      const cleaned = text
        .replace(/```[\s\S]*?```/g, "Code output available on screen.")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/[*_#`~>]/g, "")
        .replace(/[\n\r]+/g, " ")
        .slice(0, 350);

      const utterance = new SpeechSynthesisUtterance(cleaned);
      const isUrdu = isUrduText(text);

      // Find best voice match
      const voices = window.speechSynthesis.getVoices();
      if (isUrdu) {
        const urduVoice = voices.find((v) => v.lang.startsWith("ur") || v.lang.includes("PK") || v.lang.startsWith("hi"));
        if (urduVoice) utterance.voice = urduVoice;
        utterance.lang = "ur-PK";
      } else {
        const enVoice = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha")));
        if (enVoice) utterance.voice = enVoice;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onFinish) onFinish();
        // In continuous Live Voice Talk Mode, restart listening automatically
        if (isLiveVoiceModeRef.current && recognitionRef.current) {
          setTimeout(() => {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // ignore
            }
          }, 350);
        }
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        if (onFinish) onFinish();
      };
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS Error:", e);
      if (onFinish) onFinish();
    }
  };

  // Setup Web Speech API Voice Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      if (speechLanguage === "ur") {
        recognition.lang = "ur-PK";
      } else if (speechLanguage === "en") {
        recognition.lang = "en-US";
      } else {
        // Auto: defaults to browser locale or multi
        recognition.lang = navigator.language || "en-US";
      }

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleVoiceCommand(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [speechLanguage]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      addNotification("Speech Recognition", "Speech recognition is not supported in this browser. Please use Chrome or Edge.", "error");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Could not start recognition:", err);
      }
    }
  };

  const toggleLiveVoiceMode = () => {
    const nextState = !isLiveVoiceMode;
    setIsLiveVoiceMode(nextState);
    if (nextState) {
      setTtsEnabled(true);
      const isUrdu = speechLanguage === "ur";
      const startGreeting = isUrdu
        ? "لائیو وائس موڈ آن ہو گیا۔ میں آپ کو سن رہا ہوں۔ کوئی بھی سوال پوچھیں یا پرامپٹ لکھوائیں۔"
        : "Live Voice Talk mode enabled. I am listening! Ask me any question, request prompts, or edit your videos.";

      speakText(startGreeting, () => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.warn(e);
          }
        }
      });
    } else {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      speakText("Live Voice mode paused.");
    }
  };

  // Download image
  const handleDownloadImage = async (url: string, promptText: string, messageId: string) => {
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = `novacut-ai-${promptText.slice(0, 15).replace(/\s+/g, "_") || "image"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadSuccessId(messageId);
      setTimeout(() => setDownloadSuccessId(null), 2500);
      addNotification("Download Started", "Image downloaded in HD quality.", "success");
      speakText("Downloading high-definition image.");
    } catch (e) {
      console.error(e);
    }
  };

  // Add generated image directly to Video Timeline
  const handleAddToTimeline = (imageUrl: string, promptText: string, messageId: string) => {
    if (project.tracks.length > 0) {
      const targetTrack = project.tracks.find((t) => t.type === "main" || t.type === "overlay") || project.tracks[0];
      addClipToTrack(targetTrack.id, {
        type: "image",
        name: promptText ? `AI: ${promptText.slice(0, 20)}` : "AI Generated Image",
        mediaUrl: imageUrl,
        thumbnailUrl: imageUrl,
        duration: 5,
        startTime: 0,
      });
      setActiveTab("editor");
      addNotification("Added to Timeline", `Inserted into track "${targetTrack.name}".`, "success");
      speakText("Inserted image directly into video editor timeline.");
    }
  };

  // Copy prompt text
  const handleCopyPrompt = (promptContent: string, messageId: string) => {
    navigator.clipboard.writeText(promptContent);
    setCopiedPromptId(messageId);
    setTimeout(() => setCopiedPromptId(null), 2000);
    addNotification("Prompt Copied", "AI Prompt copied to clipboard.", "success");
    speakText(isUrduText(promptContent) ? "پرامپٹ کاپی ہو گیا ہے۔" : "Prompt copied to clipboard.");
  };

  // Detect image generation queries
  const isImageGenerationQuery = (input: string): boolean => {
    const lower = input.toLowerCase().trim();
    return (
      lower.startsWith("generate image") ||
      lower.startsWith("create image") ||
      lower.startsWith("draw") ||
      lower.startsWith("make an image") ||
      lower.includes("generate an image") ||
      lower.includes("picture of") ||
      lower.includes("tasveer banao") ||
      lower.includes("تصویر بناؤ") ||
      lower.includes("تصویر بنائیں")
    );
  };

  // Detect prompt writing queries
  const isPromptWritingQuery = (input: string): boolean => {
    const lower = input.toLowerCase().trim();
    return (
      lower.includes("write a prompt") ||
      lower.includes("write prompt") ||
      lower.includes("create a prompt") ||
      lower.includes("suggest a prompt") ||
      lower.includes("prompt for") ||
      lower.includes("video prompt") ||
      lower.includes("thumbnail prompt") ||
      lower.includes("logo prompt") ||
      lower.includes("پرامپٹ لکھیں") ||
      lower.includes("پرامپٹ بناؤ") ||
      lower.includes("prompt likho")
    );
  };

  // Voice Command Routing
  const handleVoiceCommand = (cmdText: string) => {
    const lower = cmdText.toLowerCase().trim();

    // 1. Direct Image generation
    if (isImageGenerationQuery(cmdText)) {
      handleSendMessage(cmdText);
      return;
    }

    // 2. Prompt Writing
    if (isPromptWritingQuery(cmdText)) {
      handleSendMessage(cmdText);
      return;
    }

    // 3. Aspect Ratios
    if (lower.includes("9:16") || lower.includes("tiktok") || lower.includes("reel")) {
      setProject((prev) => ({
        ...prev,
        settings: { ...prev.settings, aspectRatio: "9:16", width: 1080, height: 1920 },
      }));
      speakText(isUrduText(cmdText) ? "کینوس کا سائز نو بائے سولہ ورٹیکل پر تبدیل کر دیا گیا ہے۔" : "Canvas switched to 9 by 16 vertical format for TikTok and Reels.");
      addNotification("Aspect Ratio", "Canvas set to 9:16 (1080x1920).", "info");
      return;
    }
    if (lower.includes("16:9") || lower.includes("youtube") || lower.includes("widescreen")) {
      setProject((prev) => ({
        ...prev,
        settings: { ...prev.settings, aspectRatio: "16:9", width: 1920, height: 1080 },
      }));
      speakText(isUrduText(cmdText) ? "کینوس سولہ بائے نو یوٹیوب سائز پر سیٹ ہو گیا ہے۔" : "Canvas switched to 16 by 9 widescreen format for YouTube 1080p.");
      addNotification("Aspect Ratio", "Canvas set to 16:9 (1920x1080).", "info");
      return;
    }

    // 4. General question or conversation
    handleSendMessage(cmdText);
  };

  // Core Gemini Message Handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    // Switch to chat tab if sent from guide or search
    setActiveTabAssistant("chat");

    const isUrdu = isUrduText(text);
    const userMsg: Message = {
      id: `msg_u_${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    // 1. Direct Image Generation (Costs 5 credits for normal users, Free for Admin)
    if (isImageGenerationQuery(text)) {
      if (!isAdmin && !deductCredits(COST_PHOTO, "AI Image Generation")) {
        setIsLoading(false);
        return;
      }

      const cleanPrompt = text
        .replace(/generate image of|create image of|draw a|draw|make an image of|generate an image of|picture of|تصویر بناؤ|تصویر بنائیں/gi, "")
        .trim() || "cinematic cyber cat with neon lights";

      const loadingMsgId = `msg_gen_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: loadingMsgId,
          role: "assistant",
          text: isUrdu
            ? `ہائی ریزولوشن تصویر بنائی جا رہی ہے: "${cleanPrompt}"...`
            : `Generating high-definition artwork for: "${cleanPrompt}"...`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isLoadingImage: true,
        },
      ]);

      try {
        const response = await apiFetch("/api/ai/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: cleanPrompt,
            aspectRatio: "16:9",
            category: "photo",
            style: "cinematic",
          }),
        });

        const data = await response.json();
        const imageUrl = data.imageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1024&height=576&nologo=true`;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingMsgId
              ? {
                  ...msg,
                  text: isUrdu
                    ? `آپ کی تصویر تیار ہے! آپ اسے ایچ ڈی ڈاؤن لوڈ کر سکتے ہیں یا ٹائم لائن میں شامل کر سکتے ہیں: "${cleanPrompt}"`
                    : `Your artwork is ready! You can download it in HD or insert it directly into your video timeline:`,
                  isLoadingImage: false,
                  image: {
                    url: imageUrl,
                    prompt: cleanPrompt,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    style: "Cinematic HD",
                  },
                }
              : msg
          )
        );

        speakText(
          isUrdu
            ? "آپ کی تصویر تیار ہے۔ آپ اسے ڈاؤن لوڈ کر سکتے ہیں۔"
            : `I have generated the artwork for ${cleanPrompt}. You can download it or insert it into your video timeline.`
        );
      } catch (err) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingMsgId
              ? {
                  ...msg,
                  text: isUrdu ? "معذرت، تصویر بنانے میں خرابی پیش آئی۔ دوبارہ کوشش کریں۔" : "Could not generate image. Please try again.",
                  isLoadingImage: false,
                }
              : msg
          )
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 2. Prompt Writing Query (Costs 10 credits for normal users, Free for Admin)
    if (isPromptWritingQuery(text)) {
      if (!isAdmin && !deductCredits(COST_PROMPT, "AI Prompt Crafting")) {
        setIsLoading(false);
        return;
      }

      const lower = text.toLowerCase();
      let category: "video" | "image" | "thumbnail" | "logo" | "script" = "video";
      let recommendedAspect: "16:9" | "9:16" | "1:1" = "16:9";

      if (lower.includes("thumbnail") || lower.includes("یوٹیوب کور")) {
        category = "thumbnail";
        recommendedAspect = "16:9";
      } else if (lower.includes("logo") || lower.includes("لوگو")) {
        category = "logo";
        recommendedAspect = "1:1";
      } else if (lower.includes("photo") || lower.includes("image") || lower.includes("تصویر")) {
        category = lower.includes("photo") ? "image" : "image";
        recommendedAspect = lower.includes("9:16") ? "9:16" : "16:9";
      }

      const promptSystemInstruction = `You are a master AI Prompt Engineer for NovaCut Studio.
MULTILINGUAL MANDATE:
- If the user asked in Urdu (اردو), provide the explanation and tips in authentic fluent Urdu, while providing the prompt string itself in high-end English optimized for Veo/Midjourney/Flux/Gemini.
- Format response strictly as JSON:
{
  "title": "Short descriptive title",
  "category": "${category}",
  "prompt": "Detailed cinematic prompt with volumetric lighting, 8k textures, photorealistic render",
  "negativePrompt": "blurry, low quality, artifacts, watermark",
  "recommendedAspect": "${recommendedAspect}",
  "tip": "One-sentence pro tip for best creator results",
  "language": "${isUrdu ? "Urdu" : "English"}"
}`;

      try {
        const response = await apiFetch("/api/gemini/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `Write a prompt for: "${text}"`,
            systemInstruction: promptSystemInstruction,
            model: "gemini-3.7-flash",
          }),
        });

        const data = await response.json();
        let parsedCraft: PromptCraftItem | null = null;
        try {
          const jsonMatch = data.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) parsedCraft = JSON.parse(jsonMatch[0]);
        } catch {
          // fallback
        }

        if (!parsedCraft || !parsedCraft.prompt) {
          parsedCraft = {
            title: isUrdu ? "سنیماٹک ویڈیو پرامپٹ" : `Cinematic ${category.toUpperCase()} Prompt`,
            category,
            prompt: `Cinematic 8k masterwork of ${text.replace(/write a prompt for|suggest a prompt for|پرامپٹ لکھیں/gi, "").trim() || "futuristic digital masterpiece"}, shot on 35mm lens, volumetric god rays, hyper-detailed textures, Octane render quality`,
            negativePrompt: "blurry, distorted, watermark, low quality, artifacts",
            recommendedAspect,
            tip: isUrdu ? "بہترین نتائج کے لیے AI Studio میں استعمال کریں۔" : "Use with AI Studio 8k generation for ultra-sharp results.",
            language: isUrdu ? "Urdu" : "English",
          };
        }

        const botMsg: Message = {
          id: `msg_prompt_${Date.now()}`,
          role: "assistant",
          text: isUrdu
            ? `میں نے آپ کے لیے ایک شاندار ${parsedCraft.category.toUpperCase()} پرامپٹ تیار کیا ہے۔ آپ اسے ایک کلک سے کاپی کر کے استعمال کر سکتے ہیں:`
            : `I've engineered a master-tier ${parsedCraft.category.toUpperCase()} prompt for you! You can copy it or use it instantly in AI Studio:`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          promptCraft: parsedCraft,
          languageDetected: isUrdu ? "Urdu" : "English",
        };

        setMessages((prev) => [...prev, botMsg]);
        speakText(
          isUrdu
            ? "میں نے آپ کے لیے بہترین پرامپٹ تیار کر دیا ہے۔ آپ اسے کاپی کر سکتے ہیں۔"
            : `I have crafted a master prompt for ${parsedCraft.title}. You can copy it to your clipboard or use it in AI Studio.`
        );
      } catch (err) {
        // Fallback
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 3. General Conversational / Assistant Q&A in User's Exact Language (Multi-turn Gemini Chat)
    const conversationalSystemInstruction = `You are Google Gemini Live, the official conversational AI assistant embedded within NovaCut Studio.
CORE CAPABILITIES & PERSONALITY:
- You are intelligent, helpful, polite, and deeply knowledgeable across all subjects (creative video editing, storytelling, coding, science, history, translation, math, poetry, scripts, marketing).
- You can answer ANY question asked by the user in real time.

MULTILINGUAL MANDATE (Urdu & English):
1. URDU: If the user communicates in Urdu (اردو) or Roman Urdu (e.g., "kya haal hai", "video kaise banayein", "mujhe ek script chahiye"), respond in fluent, authentic, polite, and natural Urdu (اردو). You may include Roman Urdu or English terms where helpful for technical clarity.
2. ENGLISH: If the user communicates in English, respond in articulate, direct, and conversational English.
3. Keep responses conversational, helpful, and concise (2 to 4 sentences by default, or structured bullet points if asking for a list/script) so that voice synthesis speaks pleasantly.

NOVACUT STUDIO CONTEXT:
- Multitrack WebGL video editor with trimming, splits, 4K exports, speed ramping, auto-captions.
- AI Studio: Background Modifier (add cats, dogs, lions, neon lasers), Text-to-Video, Thumbnails, Vector Logos.
- Daily Credits: Standard users receive 500 Daily AI Credits (resetting every 24 hours).
- SuperAdmin: User abdullah106556661@gmail.com has permanent Unlimited AI Credits (∞).
- Pro Plan: Upgrades available via JazzCash mobile transfer (Account: 03176901963, Title: Abdullah / NovaCut Pro).`;

    try {
      // Build multi-turn context
      const chatHistory = messages
        .filter((m) => m.text && !m.isLoadingImage)
        .slice(-8)
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          content: m.text,
        }));
      chatHistory.push({ role: "user", content: text });

      let replyText = "";

      // Attempt 1: Multi-turn Chat endpoint
      try {
        const chatRes = await apiFetch("/api/gemini/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: chatHistory,
            systemInstruction: conversationalSystemInstruction,
            model: "gemini-3.7-flash",
          }),
        });

        if (chatRes.ok) {
          const chatData = await chatRes.json();
          if (chatData.text) {
            replyText = chatData.text;
          }
        }
      } catch (chatErr) {
        console.warn("Chat endpoint fallback to generate:", chatErr);
      }

      // Attempt 2: Direct generate endpoint fallback
      if (!replyText) {
        const response = await apiFetch("/api/gemini/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            systemInstruction: conversationalSystemInstruction,
            model: "gemini-3.7-flash",
          }),
        });

        const data = await response.json();
        replyText =
          data.text ||
          (isUrdu
            ? "میں آپ کی بات سمجھ گیا ہوں۔ نووا کٹ اسٹوڈیو میں آپ ویڈیو ایڈیٹنگ، تھمب نیلز اور AI تصاویر آسانی سے بنا سکتے ہیں۔"
            : "I am here to assist you! You can ask questions, generate prompts, or edit your videos right here.");
      }

      const botMsg: Message = {
        id: `msg_b_${Date.now()}`,
        role: "assistant",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        languageDetected: isUrdu ? "Urdu (اردو)" : "English",
      };

      setMessages((prev) => [...prev, botMsg]);
      speakText(replyText);
    } catch (err) {
      const fallbackReply = isUrdu
        ? "آپ کا سوال موصول ہوا۔ نووا کٹ اسٹوڈیو میں روزانہ ۵۰۰ کریڈٹس، مکمل ویڈیو ایڈیٹر، اور اردو وائس سپورٹ دستیاب ہے۔"
        : "NovaCut Studio provides full multitrack video editing, AI background modification, and 500 daily credits.";

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_fallback_${Date.now()}`,
          role: "assistant",
          text: fallbackReply,
          timestamp: "Just now",
        },
      ]);
      speakText(fallbackReply);
    } finally {
      setIsLoading(false);
    }
  };

  // Comprehensive In-Gemini Interactive Voice Commands Guide
  const voiceGuideCommands: GuideCommand[] = [
    {
      category: "urdu",
      title: "اردو وائس: پرامپٹ لکھوائیں (Urdu Voice)",
      phrase: '🎙️ "ایک یوٹیوب ویڈیو کے لیے سنیماٹک پرامپٹ لکھیں"',
      description: "اردو میں جیمنائی سے بات کریں اور 8k ویڈیو، تصاویر اور تھمب نیل کے لیے پروفیشنل پرامپٹس حاصل کریں۔",
      badge: "اردو Voice",
      actionPrompt: "ایک یوٹیوب ویڈیو کے لیے سنیماٹک پرامپٹ لکھیں",
      sampleReply: "میں نے آپ کے لیے یوٹیوب ویڈیو کا سنیماٹک پرامپٹ تیار کر دیا ہے۔ آپ اسے کاپی کر سکتے ہیں۔",
    },
    {
      category: "urdu",
      title: "اردو وائس: تصویر بناؤ (Urdu Image Gen)",
      phrase: '🎙️ "ایک خوبصورت سائبر کیٹ کی تصویر بناؤ"',
      description: "اردو میں بول کر تصویر بنوائیں اور فوری ایچ ڈی ڈاؤن لوڈ یا ویڈیو ٹائم لائن میں داخل کریں۔",
      badge: "تصویر بنائیں",
      actionPrompt: "ایک خوبصورت سائبر کیٹ کی تصویر بناؤ",
      sampleReply: "سائبر کیٹ کی تصویر بنائی جا رہی ہے۔ آپ اسے فوری طور پر ڈاؤن لوڈ کر سکتے ہیں۔",
    },
    {
      category: "prompt",
      title: "Cinematic Video Prompt Engineer",
      phrase: '🎙️ "Write a prompt for a cyberpunk drone shot"',
      description: "Crafts studio-grade prompts optimized for Veo 3.1, Flux, Midjourney, and NovaCut AI Video Director.",
      badge: "Prompt Craft",
      actionPrompt: "Write a prompt for a cinematic cyberpunk drone shot over rainy Tokyo",
      sampleReply: "Here is your cinematic 8k cyberpunk prompt with volumetric fog and drone orbit camera motion.",
    },
    {
      category: "image",
      title: "Direct AI Image Generation & Download",
      phrase: '🎙️ "Generate image of a cute futuristic neon cat"',
      description: "Renders photorealistic 8k artwork with 1-click HD download and direct insert to timeline.",
      badge: "Image Gen",
      actionPrompt: "Generate image of a cute futuristic neon cat",
      sampleReply: "Rendering high-definition artwork for your neon cat. Available for instant download or timeline insertion.",
    },
    {
      category: "photo",
      title: "Add Animals & Neon to Background",
      phrase: '🎙️ "Add a cat to photo" / "Add a lion in background"',
      description: "Upload any photo to seamlessly add cats, dogs, lions, elephants, or neon lasers into the background.",
      badge: "AI Photo Mod",
      actionPrompt: "How do I add a cat or lion to my photo background?",
      sampleReply: "Opening AI Photo Studio where you can add cats, dogs, lions, and lasers with one click.",
    },
    {
      category: "ratio",
      title: "Switch to 9:16 TikTok / 16:9 YouTube",
      phrase: '🎙️ "Switch to 9:16 for TikTok" / "16:9 for YouTube"',
      description: "Automatically resizes video canvas to 9:16 vertical (Reels/TikTok) or 16:9 widescreen (YouTube 1080p).",
      badge: "Aspect Ratio",
      actionPrompt: "Switch to 9:16 for TikTok",
      sampleReply: "Canvas aspect ratio switched to 9 by 16 vertical format for TikTok and Reels.",
    },
    {
      category: "timeline",
      title: "Multitrack Video Cuts & Trimming",
      phrase: '🎙️ "Open Video Editor" / "Speed ramp clip"',
      description: "Opens the full timeline workspace for multitrack layering, split cuts, shaders, and keyframing.",
      badge: "Video Studio",
      actionPrompt: "Open Video Editor timeline",
      sampleReply: "Navigating to Multitrack Video Editor timeline.",
    },
    {
      category: "studio",
      title: "AI Video Director & Auto Captions",
      phrase: '🎙️ "Generate 1080p video scene"',
      description: "Transforms text scripts into cinematic multi-scene video sequences with camera movement.",
      badge: "AI Video",
      actionPrompt: "Write a video script for an AI tech review",
      sampleReply: "Crafting multi-scene video script for AI tech review.",
    },
  ];

  const filteredGuideCommands =
    guideCategory === "all"
      ? voiceGuideCommands
      : voiceGuideCommands.filter((c) => c.category === guideCategory);

  const executeGuideItem = (cmd: GuideCommand, id: string) => {
    setExecutingGuideId(id);
    handleSendMessage(cmd.actionPrompt);
    setTimeout(() => setExecutingGuideId(null), 1800);
  };

  const playDemoAudio = (text: string) => {
    speakText(text);
  };

  // Search filter list for integrated search
  const searchableTools = [
    { title: "Video Timeline Editor", tab: "editor", icon: Video, desc: "Multitrack cuts, speed, audio sync" },
    { title: "AI Photo & Animal Mod", tab: "ai-generate", icon: Wand2, desc: "Add cats, dogs, lions in 1 click (5 cr)" },
    { title: "AI Video Director", tab: "ai-generate", icon: Sparkles, desc: "Generate 1080p AI video scenes (10 cr)" },
    { title: "Prompt Engineer", tab: "ai-generate", icon: FileText, desc: "Cinematic prompt generator (10 cr)" },
    { title: "9:16 Vertical TikTok Ratio", tab: "editor", icon: Sliders, desc: "Switch canvas to 1080x1920" },
    { title: "16:9 YouTube Widescreen", tab: "editor", icon: Sliders, desc: "Switch canvas to 1920x1080" },
    { title: "Pro Plan & JazzCash (03176901963)", tab: "pricing", icon: Crown, desc: "Upgrade to unlimited credits" },
  ];

  const filteredSearch = searchQuery.trim()
    ? searchableTools.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <>
      {/* Floating Gemini AI Circle Launcher Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
              setActiveTabAssistant("chat");
            }}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-600 to-fuchsia-500 hover:from-sky-400 hover:to-fuchsia-400 text-white shadow-2xl shadow-sky-500/40 border-2 border-white/20 flex items-center justify-center group transition-all transform hover:scale-110 active:scale-95 cursor-pointer relative"
            title="Open Gemini AI Voice & Chat Assistant"
            aria-label="Open Gemini AI"
          >
            {/* Simple Circle Gemini Icon */}
            <Sparkles className="w-7 h-7 animate-pulse text-white drop-shadow-md" />
            
            {/* Pulsing online status indicator */}
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
          </button>
        </div>
      )}

      {/* Main Gemini Window Container */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-out shadow-2xl flex flex-col overflow-hidden ${
            isMinimized
              ? "bottom-6 right-6 w-80 bg-slate-950/95 border border-slate-800 rounded-2xl p-3 backdrop-blur-2xl"
              : "bottom-4 sm:bottom-6 right-3 sm:right-6 w-[calc(100vw-24px)] sm:w-[480px] h-[85vh] sm:h-[660px] max-h-[90vh] bg-slate-950/95 border border-slate-800/90 rounded-3xl backdrop-blur-2xl"
          }`}
        >
          {/* Top Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-fuchsia-500 flex items-center justify-center text-white shadow-md shadow-sky-500/30 border border-white/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-xs text-white">Gemini Live Voice & Chat</h3>
                  {isAdmin ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      SuperAdmin
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      {speechLanguage === "ur" ? "اردو" : speechLanguage === "en" ? "English" : "Auto Multilingual"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>Credits: <strong className="text-sky-400">{isAdmin ? "Unlimited ∞" : (user?.aiCreditsRemaining ?? DAILY_CREDITS_MAX)}</strong></span>
                  {!isAdmin && (
                    <>
                      <span>•</span>
                      <button onClick={resetDailyCredits} className="text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer">
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Reset 500</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Header Control Buttons */}
            <div className="flex items-center gap-1">
              {/* Language Selector */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px]">
                <button
                  onClick={() => setSpeechLanguage("auto")}
                  className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${speechLanguage === "auto" ? "bg-sky-500 text-white" : "text-slate-400"}`}
                  title="Auto language detection"
                >
                  Auto
                </button>
                <button
                  onClick={() => setSpeechLanguage("ur")}
                  className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${speechLanguage === "ur" ? "bg-emerald-600 text-white" : "text-slate-400"}`}
                  title="Urdu language mode (اردو)"
                >
                  اردو
                </button>
                <button
                  onClick={() => setSpeechLanguage("en")}
                  className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${speechLanguage === "en" ? "bg-sky-500 text-white" : "text-slate-400"}`}
                  title="English language mode"
                >
                  EN
                </button>
              </div>

              {/* TTS Mute Toggle */}
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${ttsEnabled ? "text-sky-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-800"}`}
                title={ttsEnabled ? "Voice Speech Enabled" : "Voice Speech Muted"}
              >
                {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Minimize */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                <span className="text-xs font-bold px-1">{isMinimized ? "▲" : "▼"}</span>
              </button>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Top Mode Tabs: Chat, Voice Guide, Tools */}
              <div className="flex p-1.5 bg-slate-950 border-b border-slate-800/80 gap-1 text-xs">
                <button
                  onClick={() => setActiveTabAssistant("chat")}
                  className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "chat"
                      ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat & Live Voice</span>
                </button>

                <button
                  onClick={() => setActiveTabAssistant("guide")}
                  className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "guide"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Voice Guide (وائس گائیڈ)</span>
                </button>

                <button
                  onClick={() => setActiveTabAssistant("tools")}
                  className={`py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    activeTab === "tools"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                  title="Quick Video & AI Tools"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Tools</span>
                </button>
              </div>

              {/* Search Bar Inside Gemini */}
              <div className="p-2 bg-slate-900/80 border-b border-slate-800/80">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search video tools, photo modifiers, templates, or ratios..."
                    className="w-full pl-8 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2 text-slate-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Instant Search Results Dropdown */}
                {filteredSearch.length > 0 && (
                  <div className="mt-2 p-1.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1 max-h-44 overflow-y-auto">
                    {filteredSearch.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveTab(item.tab as NavTab);
                            setSearchQuery("");
                            speakText(`Navigating to ${item.title}`);
                          }}
                          className="w-full p-2 rounded-lg hover:bg-slate-900 flex items-center justify-between text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-sky-400" />
                            <div>
                              <p className="text-xs font-bold text-white">{item.title}</p>
                              <p className="text-[10px] text-slate-400">{item.desc}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* TAB 1: CHAT & LIVE VOICE VIEW */}
              {/* ======================================================== */}
              {activeTab === "chat" && (
                <>
                  {/* Continuous Live Voice Talk Mode Banner */}
                  <div className="px-3.5 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={toggleLiveVoiceMode}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                        isLiveVoiceMode
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse"
                          : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${isLiveVoiceMode ? "bg-white animate-ping" : "bg-emerald-400"}`} />
                      <span>{isLiveVoiceMode ? "Live Voice Talk Active" : "Start Live Voice Talk"}</span>
                    </button>

                    {/* Quick Urdu / English Voice indicator */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      {isSpeaking ? (
                        <span className="text-sky-400 font-semibold flex items-center gap-1">
                          <Volume2 className="w-3 h-3 animate-bounce" />
                          Gemini Talking...
                        </span>
                      ) : isListening ? (
                        <span className="text-red-400 font-semibold flex items-center gap-1">
                          <Mic className="w-3 h-3 animate-pulse" />
                          Listening...
                        </span>
                      ) : (
                        <span className="text-slate-500">Tap mic or speak</span>
                      )}
                    </div>
                  </div>

                  {/* Messages Container */}
                  <div className="flex-1 p-3.5 overflow-y-auto space-y-3 custom-scrollbar">
                    {messages.map((msg) => {
                      const isUser = msg.role === "user";
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
                        >
                          <div
                            className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                              isUser
                                ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-br-none shadow-md shadow-sky-500/15 font-medium"
                                : "bg-slate-900/90 text-slate-200 border border-slate-800/80 rounded-bl-none shadow-sm"
                            }`}
                          >
                            {/* Message Text */}
                            <p className="whitespace-pre-wrap">{msg.text}</p>

                            {/* Image Loading State */}
                            {msg.isLoadingImage && (
                              <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                                <div className="flex items-center justify-between text-[11px] text-sky-300">
                                  <span className="flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                                    Synthesizing 8K Render...
                                  </span>
                                  <span className="font-mono text-[10px]">{isAdmin ? "Free (Admin)" : "5 Credits"}</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 h-full w-full animate-pulse" />
                                </div>
                              </div>
                            )}

                            {/* Generated Image Result Card */}
                            {msg.image && (
                              <div className="mt-2.5 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                                <div className="relative group">
                                  <img
                                    src={msg.image.url}
                                    alt={msg.image.prompt}
                                    className="w-full h-40 object-cover rounded-t-xl"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleDownloadImage(msg.image!.url, msg.image!.prompt, msg.id)}
                                      className="p-2 bg-slate-900/90 text-white rounded-xl hover:bg-slate-800 shadow-md cursor-pointer"
                                      title="Download Image"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                <div className="p-2.5 flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleDownloadImage(msg.image!.url, msg.image!.prompt, msg.id)}
                                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                      downloadSuccessId === msg.id
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-800 hover:bg-slate-700 text-white"
                                    }`}
                                  >
                                    {downloadSuccessId === msg.id ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Saved!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Download className="w-3 h-3 text-sky-400" />
                                        <span>Download HD</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    onClick={() => handleAddToTimeline(msg.image!.url, msg.image!.prompt, msg.id)}
                                    className="flex-1 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:from-sky-400 hover:to-indigo-500 transition-all cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Add to Timeline</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Prompt Craft Card */}
                            {msg.promptCraft && (
                              <div className="mt-2.5 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                                <div className="p-2 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-white">{msg.promptCraft.title}</span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 uppercase font-bold">
                                    {msg.promptCraft.category}
                                  </span>
                                </div>

                                <div className="p-2.5 space-y-2">
                                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-sky-200 select-all leading-relaxed">
                                    "{msg.promptCraft.prompt}"
                                  </div>

                                  {msg.promptCraft.tip && (
                                    <p className="text-[10px] text-slate-400 italic">
                                      💡 {msg.promptCraft.tip}
                                    </p>
                                  )}

                                  <div className="pt-1 flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleCopyPrompt(msg.promptCraft!.prompt, msg.id)}
                                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                        copiedPromptId === msg.id
                                          ? "bg-emerald-600 text-white"
                                          : "bg-slate-800 hover:bg-slate-700 text-white"
                                      }`}
                                    >
                                      {copiedPromptId === msg.id ? (
                                        <>
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3 text-sky-400" />
                                          <span>Copy Prompt</span>
                                        </>
                                      )}
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveTab("ai-generate");
                                        speakText("Navigating to AI Studio.");
                                      }}
                                      className="flex-1 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:from-sky-400 hover:to-indigo-500 transition-all cursor-pointer"
                                    >
                                      <Zap className="w-3 h-3" />
                                      <span>Open in AI Studio</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <span className="text-[9px] text-slate-500 px-1">
                            {msg.timestamp}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Chips at Bottom of Chat */}
                  <div className="p-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto custom-scrollbar text-[10px]">
                    {[
                      { label: "🎙️ Open Voice Guide", action: () => setActiveTabAssistant("guide") },
                      { label: "اردو: تصویر بناؤ", text: "ایک خوبصورت سائبر کیٹ کی تصویر بناؤ" },
                      { label: "اردو: ویڈیو پرامپٹ", text: "ایک یوٹیوب ویڈیو کے لیے سنیماٹک پرامپٹ لکھیں" },
                      { label: "🎨 Draw Cyber Cat", text: "Generate image of a cute futuristic cyber cat with neon lights" },
                      { label: "🎬 Video Prompt", text: "Write a prompt for a cinematic drone shot over Tokyo" },
                      { label: "🐱 Photo BG Mod", text: "How do I add a cat or lion to my photo background?" },
                      { label: "📱 Set 9:16 TikTok", text: "Switch to 9:16 for TikTok" },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (item.action) item.action();
                          else if (item.text) handleSendMessage(item.text);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 whitespace-nowrap transition-all cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Bottom Input Area */}
                  <div className="p-3 bg-slate-950 border-t border-slate-800/90">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex items-center gap-2"
                    >
                      {/* Voice Mic Button */}
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-2.5 rounded-xl transition-all cursor-pointer shadow-md ${
                          isListening
                            ? "bg-red-600 text-white animate-pulse shadow-red-600/30"
                            : "bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 hover:border-sky-500/40"
                        }`}
                        title={isListening ? "Listening... Click to stop" : "Speak in Urdu or English"}
                      >
                        {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                      </button>

                      {/* Input Box */}
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder={
                          speechLanguage === "ur"
                            ? "اردو میں کچھ بھی پوچھیں یا پرامپٹ لکھوائیں..."
                            : "Ask a question, write a prompt, or generate an image..."
                        }
                        className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      />

                      {/* Send Button */}
                      <button
                        type="submit"
                        disabled={!inputMessage.trim() || isLoading}
                        className="p-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shadow-md shadow-sky-500/20"
                        title="Send message"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>

                    {/* Footer status */}
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-sky-400" />
                        {isAdmin ? "Admin Unlimited Mode" : "500 Daily Reset"}
                      </span>
                      <span>JazzCash Support: {JAZZCASH_NUMBER}</span>
                    </div>
                  </div>
                </>
              )}

              {/* ======================================================== */}
              {/* TAB 2: INTEGRATED VOICE GUIDE VIEW */}
              {/* ======================================================== */}
              {activeTab === "guide" && (
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3 custom-scrollbar">
                  {/* Guide Header Banner */}
                  <div className="p-3 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-sky-950/60 rounded-2xl border border-emerald-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-black text-white">Voice Commands Cheatsheet</h4>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        Urdu & English
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      آپ نیچے دیے گئے کسی بھی جملے کو بول سکتے ہیں یا ایک کلک سے براہ راست چلا سکتے ہیں:
                    </p>
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-[10px]">
                    {[
                      { id: "all", label: "All Commands" },
                      { id: "urdu", label: "🇵🇰 اردو وائس" },
                      { id: "prompt", label: "✨ Prompts" },
                      { id: "image", label: "🎨 Images" },
                      { id: "photo", label: "🐱 Photo Mod" },
                      { id: "ratio", label: "📱 Ratios" },
                      { id: "timeline", label: "🎬 Timeline" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setGuideCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                          guideCategory === cat.id
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Commands List Cards */}
                  <div className="space-y-2.5">
                    {filteredGuideCommands.map((cmd, idx) => {
                      const isExecuting = executingGuideId === `cmd_${idx}`;
                      return (
                        <div
                          key={idx}
                          className="p-3 bg-slate-900/90 border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl transition-all space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-xs font-bold text-white">{cmd.title}</h5>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                                  {cmd.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">{cmd.description}</p>
                            </div>
                          </div>

                          {/* Voice Phrase Box */}
                          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[11px] text-sky-300">
                            {cmd.phrase}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 pt-1">
                            {/* Try in Gemini Button */}
                            <button
                              onClick={() => executeGuideItem(cmd, `cmd_${idx}`)}
                              className="flex-1 py-1.5 px-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                              {isExecuting ? (
                                <>
                                  <Sparkles className="w-3 h-3 animate-spin" />
                                  <span>Running...</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3" />
                                  <span>Try in Gemini</span>
                                </>
                              )}
                            </button>

                            {/* Listen Audio Sample */}
                            <button
                              onClick={() => playDemoAudio(cmd.sampleReply)}
                              className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
                              title="Listen to Voice Demo"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>Listen</span>
                            </button>

                            {/* Copy Phrase */}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(cmd.actionPrompt);
                                addNotification("Phrase Copied", `"${cmd.actionPrompt}" copied.`, "success");
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer border border-slate-700"
                              title="Copy phrase"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 3: TOOLS & DIRECT SHORTCUTS VIEW */}
              {/* ======================================================== */}
              {activeTab === "tools" && (
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3 custom-scrollbar">
                  <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1">
                    <h4 className="text-xs font-black text-white">Instant Creator Actions</h4>
                    <p className="text-[11px] text-slate-400">Launch workflows directly with 1 click:</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setProject((prev) => ({
                          ...prev,
                          settings: { ...prev.settings, aspectRatio: "9:16", width: 1080, height: 1920 },
                        }));
                        speakText("Set canvas to 9 by 16 vertical for TikTok");
                        addNotification("Aspect Ratio", "Canvas set to 9:16 (1080x1920).", "info");
                      }}
                      className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-left space-y-1 transition-all cursor-pointer"
                    >
                      <Sliders className="w-4 h-4 text-pink-400" />
                      <p className="text-xs font-bold text-white">9:16 TikTok / Reel</p>
                      <p className="text-[10px] text-slate-400">1080x1920 vertical</p>
                    </button>

                    <button
                      onClick={() => {
                        setProject((prev) => ({
                          ...prev,
                          settings: { ...prev.settings, aspectRatio: "16:9", width: 1920, height: 1080 },
                        }));
                        speakText("Set canvas to 16 by 9 widescreen for YouTube");
                        addNotification("Aspect Ratio", "Canvas set to 16:9 (1920x1080).", "info");
                      }}
                      className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-left space-y-1 transition-all cursor-pointer"
                    >
                      <Sliders className="w-4 h-4 text-sky-400" />
                      <p className="text-xs font-bold text-white">16:9 YouTube</p>
                      <p className="text-[10px] text-slate-400">1920x1080 widescreen</p>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("ai-generate");
                        speakText("Opening AI Photo & Animal Studio");
                      }}
                      className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-left space-y-1 transition-all cursor-pointer"
                    >
                      <Wand2 className="w-4 h-4 text-indigo-400" />
                      <p className="text-xs font-bold text-white">Photo Animal Mod</p>
                      <p className="text-[10px] text-slate-400">Add cats, dogs, lions</p>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("editor");
                        speakText("Opening Multitrack Video Editor");
                      }}
                      className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-left space-y-1 transition-all cursor-pointer"
                    >
                      <Video className="w-4 h-4 text-emerald-400" />
                      <p className="text-xs font-bold text-white">Video Editor</p>
                      <p className="text-[10px] text-slate-400">Multitrack timeline</p>
                    </button>
                  </div>

                  {/* SuperAdmin Unlimited Banner */}
                  {isAdmin ? (
                    <div className="p-3 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 rounded-2xl border border-amber-500/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>SuperAdmin Access: Unlimited Credits Active</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        You have unrestricted access to all generation tools, 4K/8K export, and admin panels.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/40 rounded-2xl border border-red-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">Upgrade to Pro (JazzCash)</span>
                        <span className="font-mono text-[10px] text-red-400 font-bold">{JAZZCASH_NUMBER}</span>
                      </div>
                      <p className="text-[10px] text-slate-300">
                        Get unlimited credits and 4K exports for PKR 1,500/mo via JazzCash.
                      </p>
                      <button
                        onClick={() => setJazzCashModalOpen(true)}
                        className="w-full py-2 bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                      >
                        Open JazzCash Pro Checkout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};
