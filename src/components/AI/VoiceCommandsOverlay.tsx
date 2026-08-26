import React, { useState } from "react";
import {
  Mic,
  Sparkles,
  ArrowRight,
  Compass,
  Monitor,
  Camera,
  Film,
  Music,
  Scissors,
  Search,
  CheckCircle2,
  X,
  Play,
  Volume2,
} from "lucide-react";

export interface VoiceCommandItem {
  id: string;
  phrase: string;
  alternatePhrases?: string[];
  actionDescription: string;
  category: "navigation" | "canvas" | "ai_photo" | "ai_video" | "editor";
  badge: string;
  exampleResponse: string;
}

interface VoiceCommandsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (phrase: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
}

export const VOICE_COMMANDS: VoiceCommandItem[] = [
  // 1. Navigation & Website Info
  {
    id: "info_website",
    phrase: "Tell me about this website",
    alternatePhrases: ["What is NovaCut?", "What can I do here?", "Website info", "How does this app work?"],
    actionDescription: "Explains all video editing, AI background mod, and voice features in detail",
    category: "navigation",
    badge: "Website Info",
    exampleResponse: "NovaCut Studio is an advanced web-based AI video editor and multimedia creative suite.",
  },
  {
    id: "ai_gen_direct_image",
    phrase: "Generate image of cybernetic cat",
    alternatePhrases: ["Draw a sunset beach", "Create image of astronaut", "Picture of golden retriever"],
    actionDescription: "Generates high-res image with loading indicator, instant preview, and download button",
    category: "ai_photo",
    badge: "Direct Image Gen",
    exampleResponse: "Generating your high-definition image now with download options.",
  },
  {
    id: "nav_ai_studio",
    phrase: "Open AI Studio",
    alternatePhrases: ["Go to Photo Studio", "Show AI tools", "Generate photo"],
    actionDescription: "Switches directly to the AI Photo Generator & Background Changer",
    category: "navigation",
    badge: "Navigation",
    exampleResponse: "Navigating to AI Studio.",
  },
  {
    id: "nav_editor",
    phrase: "Open Editing Tool",
    alternatePhrases: ["Open Video Editor", "Go to Timeline", "Show Editor"],
    actionDescription: "Opens the full timeline multitrack video editing workspace",
    category: "navigation",
    badge: "Navigation",
    exampleResponse: "Opening Video Editing Tool.",
  },
  {
    id: "nav_home",
    phrase: "Go Home",
    alternatePhrases: ["Back to Home", "Main page", "Show templates"],
    actionDescription: "Returns to the NovaCut Home dashboard and template gallery",
    category: "navigation",
    badge: "Navigation",
    exampleResponse: "Opening Home screen.",
  },
  {
    id: "nav_dashboard",
    phrase: "Open Dashboard",
    alternatePhrases: ["My Account", "Show Projects", "Admin settings"],
    actionDescription: "Opens user account, projects list, AI credits, and system overview",
    category: "navigation",
    badge: "Navigation",
    exampleResponse: "Opening Dashboard.",
  },

  // 2. Canvas & Aspect Ratios
  {
    id: "aspect_9_16",
    phrase: "Switch to 9:16 for TikTok",
    alternatePhrases: ["Set vertical format", "Make Reels size", "9 by 16 ratio"],
    actionDescription: "Resizes timeline canvas to 1080x1920 vertical format",
    category: "canvas",
    badge: "Canvas",
    exampleResponse: "Changed aspect ratio to 9 by 16 for vertical TikTok and Reels.",
  },
  {
    id: "aspect_16_9",
    phrase: "Switch to 16:9 for YouTube",
    alternatePhrases: ["Set widescreen format", "Horizontal video", "16 by 9 ratio"],
    actionDescription: "Resizes timeline canvas to 1920x1080 horizontal widescreen",
    category: "canvas",
    badge: "Canvas",
    exampleResponse: "Changed aspect ratio to 16 by 9 for YouTube.",
  },
  {
    id: "aspect_1_1",
    phrase: "Switch to 1:1 Square",
    alternatePhrases: ["Square format", "Instagram Post ratio", "1 by 1 canvas"],
    actionDescription: "Resizes timeline canvas to 1080x1080 square format",
    category: "canvas",
    badge: "Canvas",
    exampleResponse: "Changed aspect ratio to 1 by 1 square.",
  },

  // 3. AI Photo & Backgrounds
  {
    id: "ai_add_cat",
    phrase: "Add a cat to my photo",
    alternatePhrases: ["Put a cute cat beside me", "Add domestic cat in photo"],
    actionDescription: "Instructs AI to modify background and insert an adorable fluffy cat",
    category: "ai_photo",
    badge: "AI Photo Mod",
    exampleResponse: "Navigating to AI Studio with cat insertion preset applied.",
  },
  {
    id: "ai_add_dog",
    phrase: "Add a dog to my photo",
    alternatePhrases: ["Add a golden retriever", "Put a playful dog in scene"],
    actionDescription: "Instructs AI to modify background and insert a playful dog",
    category: "ai_photo",
    badge: "AI Photo Mod",
    exampleResponse: "Navigating to AI Studio with dog insertion preset applied.",
  },
  {
    id: "ai_add_lion",
    phrase: "Add a lion in background",
    alternatePhrases: ["Put a wild lion behind me", "Safari lion background"],
    actionDescription: "Generates sunset savannah backdrop with a majestic lion",
    category: "ai_photo",
    badge: "AI Photo Mod",
    exampleResponse: "Navigating to AI Studio with lion backdrop preset.",
  },
  {
    id: "ai_add_line",
    phrase: "Add neon laser line",
    alternatePhrases: ["Add glowing electric lines", "Cyberpunk neon outline"],
    actionDescription: "Surrounds the subject with pulsing cybernetic neon lines",
    category: "ai_photo",
    badge: "AI Photo Mod",
    exampleResponse: "Navigating to AI Studio with neon laser line preset.",
  },
  {
    id: "ai_add_elephant",
    phrase: "Add a wild elephant",
    alternatePhrases: ["Add elephant in landscape", "Misty elephant background"],
    actionDescription: "Generates scenic misty landscape with a majestic elephant",
    category: "ai_photo",
    badge: "AI Photo Mod",
    exampleResponse: "Navigating to AI Studio with elephant modifier preset.",
  },
  {
    id: "ai_bg_beach",
    phrase: "Change background to tropical beach",
    alternatePhrases: ["Put me on a sunny beach", "Tropical island sunset"],
    actionDescription: "Replaces background with golden sunset beach and turquoise waves",
    category: "ai_photo",
    badge: "AI Photo Mod",
    exampleResponse: "Navigating to AI Studio with tropical beach preset.",
  },

  // 4. AI Video & Creative Tools
  {
    id: "ai_gen_video",
    phrase: "Generate AI Video",
    alternatePhrases: ["Create video from prompt", "Animate this scene", "Veo 3.1 video"],
    actionDescription: "Generates cinematic storyboard and multitrack scene videos",
    category: "ai_video",
    badge: "AI Video",
    exampleResponse: "Opening AI Studio Video Director.",
  },
  {
    id: "ai_gen_thumb",
    phrase: "Create YouTube thumbnail",
    alternatePhrases: ["Generate thumbnail", "Viral video cover", "Design thumbnail"],
    actionDescription: "Generates 3 high-CTR custom YouTube thumbnail concepts",
    category: "ai_video",
    badge: "AI Studio",
    exampleResponse: "Opening YouTube thumbnail generator in AI Studio.",
  },
  {
    id: "ai_gen_logo",
    phrase: "Generate brand logo",
    alternatePhrases: ["Create vector logo", "Design company logo", "Make SVG logo"],
    actionDescription: "Creates custom vector SVG brand marks with tailored color palettes",
    category: "ai_video",
    badge: "AI Studio",
    exampleResponse: "Opening AI Logo generator in AI Studio.",
  },

  // 5. Editor & Timeline Controls
  {
    id: "editor_audio",
    phrase: "Open Audio panel",
    alternatePhrases: ["Show music studio", "Add background music", "Soundtrack library"],
    actionDescription: "Opens timeline audio tracks, sound effects, and music library",
    category: "editor",
    badge: "Editor",
    exampleResponse: "Opening Audio panel in video editor.",
  },
  {
    id: "editor_captions",
    phrase: "Open Auto Captions",
    alternatePhrases: ["Generate subtitles", "Show captions panel", "Auto captions"],
    actionDescription: "Opens automated speech-to-text captions generator with styling",
    category: "editor",
    badge: "Editor",
    exampleResponse: "Opening Auto Captions panel.",
  },
];

export const VoiceCommandsOverlay: React.FC<VoiceCommandsOverlayProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
  isListening,
  onToggleListening,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { id: "all", label: "All Commands", icon: Sparkles },
    { id: "navigation", label: "Navigation", icon: Compass },
    { id: "canvas", label: "Canvas & Ratios", icon: Monitor },
    { id: "ai_photo", label: "Photo & Backgrounds", icon: Camera },
    { id: "ai_video", label: "AI Video & Studio", icon: Film },
    { id: "editor", label: "Timeline Editor", icon: Scissors },
  ];

  const filteredCommands = VOICE_COMMANDS.filter((cmd) => {
    const matchesCategory = selectedCategory === "all" || cmd.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      cmd.phrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.actionDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.alternatePhrases?.some((alt) => alt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleRunCommand = (phrase: string, id: string) => {
    setCopiedId(id);
    onExecuteCommand(phrase);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div
      id="voice-commands-interactive-overlay"
      className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl z-30 flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Overlay Header */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
              <span>Voice Commands Guide</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {VOICE_COMMANDS.length} Commands
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">
              Speak or click any command below to execute instantly
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleListening}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isListening
                ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isListening ? "Listening..." : "Speak Now"}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Back to Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3 bg-slate-900/80 border-b border-slate-800 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search commands (e.g. 'cat', 'TikTok', 'editor', 'studio')..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 outline-none transition-colors"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar no-scrollbar py-0.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-sky-500 text-white shadow-sm"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Commands Scrollable List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 custom-scrollbar text-xs">
        {filteredCommands.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <p>No voice commands match your search.</p>
          </div>
        ) : (
          filteredCommands.map((cmd) => (
            <div
              key={cmd.id}
              className="p-3 bg-slate-900/90 border border-slate-800/90 hover:border-sky-500/40 rounded-2xl transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                    🎤
                  </span>
                  <span className="font-bold text-slate-100 text-xs">"{cmd.phrase}"</span>
                </div>

                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                    cmd.category === "ai_photo"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : cmd.category === "canvas"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : cmd.category === "navigation"
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {cmd.badge}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 pl-7 leading-relaxed">
                {cmd.actionDescription}
              </p>

              {cmd.alternatePhrases && cmd.alternatePhrases.length > 0 && (
                <div className="pl-7 mt-1.5 flex flex-wrap items-center gap-1 text-[9px] text-slate-500">
                  <span className="font-semibold text-slate-400">Also recognizes:</span>
                  {cmd.alternatePhrases.map((alt, idx) => (
                    <span key={idx} className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80">
                      "{alt}"
                    </span>
                  ))}
                </div>
              )}

              {/* Action trigger button */}
              <div className="mt-2.5 pl-7 flex items-center justify-between pt-2 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-sky-400" />
                  <span>AI reply: "{cmd.exampleResponse}"</span>
                </span>

                <button
                  onClick={() => handleRunCommand(cmd.phrase, cmd.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    copiedId === cmd.id
                      ? "bg-emerald-600 text-white"
                      : "bg-sky-600/20 hover:bg-sky-500 text-sky-300 hover:text-white border border-sky-500/30"
                  }`}
                >
                  {copiedId === cmd.id ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Triggered!</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Try Command</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer info note */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1 text-sky-300 font-medium">
          <Sparkles className="w-3 h-3" />
          <span>Web Speech API Active</span>
        </span>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white font-semibold underline cursor-pointer"
        >
          Return to Live Chat
        </button>
      </div>
    </div>
  );
};
