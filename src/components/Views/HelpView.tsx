import React, { useState } from "react";
import {
  HelpCircle,
  Search,
  BookOpen,
  Keyboard,
  Video,
  FileQuestion,
  Sparkles,
  ArrowRight,
  ExternalLink,
  LifeBuoy,
} from "lucide-react";
import { useEditor } from "../../context/EditorContext";

export const HelpView: React.FC = () => {
  const { setActiveTab } = useEditor();
  const [searchQuery, setSearchQuery] = useState("");

  const shortcuts = [
    { key: "Space", desc: "Play / Pause timeline playback" },
    { key: "S", desc: "Split active clip at playhead" },
    { key: "Delete / Backspace", desc: "Remove selected clip" },
    { key: "Ctrl / ⌘ + Z", desc: "Undo last edit" },
    { key: "Ctrl / ⌘ + Y", desc: "Redo action" },
    { key: "Ctrl / ⌘ + K", desc: "Quick Spotlight Search" },
    { key: "M", desc: "Add timeline marker" },
    { key: "F", desc: "Toggle full-screen preview" },
    { key: "C", desc: "Crop & Transform selected clip" },
    { key: "T", desc: "Open Text & Caption tool" },
  ];

  const guideArticles = [
    {
      title: "Mastering the Multi-Track Timeline",
      category: "Editor Basics",
      readTime: "3 min read",
      desc: "Learn how to layer video b-roll, background audio, transparent PNG stickers, and karaoke subtitles seamlessly.",
    },
    {
      title: "Generating High-Converting TikTok Hooks with AI",
      category: "AI Creative Suite",
      readTime: "4 min read",
      desc: "Utilize the Gemini 3.7 Flash script generator to craft 3-second attention-grabbing visual hooks that retain 80%+ viewers.",
    },
    {
      title: "Exporting 4K 60FPS Video with Zero Artifacts",
      category: "Render & Export",
      readTime: "2 min read",
      desc: "Optimal bitrates, WebM / MP4 containers, WebGL shader post-processing, and instant browser downloads.",
    },
    {
      title: "Keyframing Positions, Opacity & Scale",
      category: "Animation & FX",
      readTime: "5 min read",
      desc: "Create dynamic zoom-ins, panning drone simulations, and smooth text fades with easing curves.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-10 select-none">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-bold">
          <LifeBuoy className="w-3.5 h-3.5 text-sky-400" />
          <span>NovaCut Knowledge Base & Support</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          How can we help you create?
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Search tutorials, master keyboard shortcuts, or get in touch with our engineering team.
        </p>

        <div className="relative max-w-lg mx-auto">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3" />
          <input
            type="text"
            placeholder="Search guides, tutorials, or shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-sky-500 shadow-xl"
          />
        </div>
      </div>

      {/* Keyboard Shortcuts Cheat Sheet */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">Essential Keyboard Shortcuts</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Speed up your workflow 3x</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2"
            >
              <span className="text-slate-300 font-medium">{sc.desc}</span>
              <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-sky-300 font-bold shrink-0 shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      {/* Guide Articles */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span>Creator Guides & Video Workflows</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {guideArticles.map((art, i) => (
            <div
              key={i}
              className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 hover:border-indigo-500/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-indigo-400 font-bold mb-1">
                  <span>{art.category}</span>
                  <span className="text-slate-500 font-normal">{art.readTime}</span>
                </div>
                <h3 className="font-bold text-slate-100 text-sm group-hover:text-sky-300 transition-colors">
                  {art.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{art.desc}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center text-xs text-sky-400 font-semibold gap-1">
                <span>Read Full Tutorial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-white text-sm">Still have questions?</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Reach out directly to our lead developer at <span className="text-sky-400 font-mono">abdullah106556661@gmail.com</span>.
          </p>
        </div>
        <button
          onClick={() => setActiveTab("contact")}
          className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl transition-all shrink-0"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
};
