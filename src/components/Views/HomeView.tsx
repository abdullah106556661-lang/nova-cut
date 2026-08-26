import React from "react";
import {
  Sparkles,
  Play,
  Video,
  Wand2,
  Layers,
  Zap,
  Sliders,
  Scissors,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  LayoutTemplate,
  Monitor,
  Smartphone,
  Flame,
  Star,
} from "lucide-react";
import { useEditor } from "../../context/EditorContext";
import { useAuth } from "../../context/AuthContext";
import { VIDEO_TEMPLATES } from "../../data/templatesData";

export const HomeView: React.FC = () => {
  const { setActiveTab, createProject, loadTemplate } = useEditor();
  const { setAuthModalOpen, setAuthInitialTab } = useAuth();

  const handleStartEditing = () => {
    createProject({
      aspectRatio: "16:9",
      width: 1920,
      height: 1080,
      fps: 30,
      backgroundColor: "#080c14",
      duration: 15,
    });
  };

  const featurePillars = [
    {
      icon: Scissors,
      title: "Multi-Track Precision Timeline",
      desc: "Split, trim, multi-layer overlays, snap guides, and sub-frame accuracy running at 60 FPS in pure browser WebGL.",
      color: "from-sky-500 to-blue-600",
    },
    {
      icon: Wand2,
      title: "Generative AI Creative Suite",
      desc: "Generate viral TikTok hooks, 4K cinematic backgrounds, YouTube thumbnail designs, and vector logos on demand.",
      color: "from-purple-500 to-indigo-600",
    },
    {
      icon: Zap,
      title: "Smart Auto Captions & Subtitles",
      desc: "Instant animated captions, viral karaoke typography highlights, multilingual subtitle track generation.",
      color: "from-amber-500 to-orange-600",
    },
    {
      icon: Sliders,
      title: "Cinematic LUTs & Shaders",
      desc: "Real-time WebGL shader filters: Cyberpunk, VHS glitch, cinematic teal & orange, film grain, and 12+ blend modes.",
      color: "from-emerald-500 to-teal-600",
    },
  ];

  const statMetrics = [
    { value: "0ms", label: "No Cloud Upload Wait" },
    { value: "4K / 60FPS", label: "High Definition Export" },
    { value: "100%", label: "In-Browser Privacy" },
    { value: "50+ Free", label: "Viral Templates" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        {/* Glow ambient background lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-sky-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[250px] bg-fuchsia-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-bold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Next-Generation AI Video Studio Pro</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl leading-[1.15]">
          Create Viral Videos & AI Assets{" "}
          <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
            Directly in Your Browser
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
          High-performance multi-track video editing with real-time effects, animated auto-captions, AI video scripts, 8K image generator, and high-CTR thumbnail studio.
        </p>

        {/* Call to Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          <button
            onClick={handleStartEditing}
            className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 hover:from-sky-400 hover:to-fuchsia-400 text-white font-black text-sm rounded-2xl shadow-xl shadow-sky-500/25 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <Video className="w-4 h-4" />
            <span>Launch Video Studio Free</span>
          </button>

          <button
            onClick={() => setActiveTab("ai-generate")}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <Wand2 className="w-4 h-4 text-purple-400" />
            <span>Try AI Creative Studio</span>
          </button>
        </div>

        {/* Interactive Studio Preview Mockup */}
        <div className="mt-12 w-full max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl p-2 sm:p-3 relative overflow-hidden group">
          <div className="aspect-[16/9] w-full bg-slate-950 rounded-2xl overflow-hidden relative flex flex-col border border-slate-800/80">
            {/* Top Editor Bar Preview */}
            <div className="h-10 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-[11px] font-mono text-slate-400">NovaCut Studio — 1920x1080 30FPS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded font-bold">
                  WebGL 60FPS
                </span>
              </div>
            </div>

            {/* Video preview viewport */}
            <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1400&auto=format&fit=crop&q=80"
                alt="Studio Preview"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />

              <div className="absolute text-center p-4">
                <div className="inline-block p-4 rounded-full bg-sky-500/30 backdrop-blur-md border border-sky-400 text-white shadow-2xl group-hover:scale-110 transition-transform cursor-pointer"
                  onClick={handleStartEditing}
                >
                  <Play className="w-8 h-8 fill-white ml-1" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-4 drop-shadow-md">
                  CLICK TO OPEN FULL STUDIO
                </h3>
                <p className="text-xs text-sky-300 mt-1 font-mono">
                  Full timeline • Real-time Shaders • Keyframing • 4K Export
                </p>
              </div>

              {/* Sample Subtitle Hook overlay */}
              <div className="absolute bottom-6 px-4 py-1.5 bg-black/80 backdrop-blur-sm border border-amber-400/40 rounded-xl text-amber-300 text-xs font-black tracking-wide">
                🔥 AI AUTO-CAPTIONS: 3 SECRETS TO VIRAL VIDEOS
              </div>
            </div>

            {/* Timeline preview footer */}
            <div className="h-16 bg-slate-900 border-t border-slate-800 px-3 py-2 flex flex-col justify-center space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono">00:04.2 / 00:15.0</span>
                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-sky-500 rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1 h-6">
                <div className="bg-sky-950/80 border border-sky-500/40 rounded text-[9px] text-sky-300 flex items-center px-2 font-medium">
                  Video Track (1080p)
                </div>
                <div className="bg-purple-950/80 border border-purple-500/40 rounded text-[9px] text-purple-300 flex items-center px-2 font-medium">
                  Title & Captions
                </div>
                <div className="bg-emerald-950/80 border border-emerald-500/40 rounded text-[9px] text-emerald-300 flex items-center px-2 font-medium">
                  Cyberpunk LUT
                </div>
                <div className="bg-amber-950/80 border border-amber-500/40 rounded text-[9px] text-amber-300 flex items-center px-2 font-medium">
                  Audio & Beats
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="border-y border-slate-800 bg-slate-900/40 py-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {statMetrics.map((m, i) => (
            <div key={i} className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-sky-400 to-indigo-300 bg-clip-text text-transparent">
                {m.value}
              </div>
              <p className="text-xs text-slate-400 font-medium">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4 Feature Pillars */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[11px] font-bold tracking-widest text-sky-400 uppercase">
            Professional Grade Architecture
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Everything You Need for High-Velocity Content
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Zero bloat, zero server rendering queues. Experience instantaneous desktop-grade video composition right inside your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {featurePillars.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-sky-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feat.color} flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mb-2">{feat.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Templates Preview Showcase */}
      <section className="py-16 bg-slate-900/30 border-y border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold tracking-widest text-indigo-400 uppercase">
                Ready-to-Use Layouts
              </span>
              <h2 className="text-2xl font-black text-white mt-1">Trending Video Templates</h2>
            </div>
            <button
              onClick={() => setActiveTab("templates")}
              className="flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300"
            >
              <span>Explore All 50+ Templates</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VIDEO_TEMPLATES.slice(0, 3).map((tpl) => (
              <div
                key={tpl.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group hover:border-indigo-500/50 transition-all flex flex-col"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={tpl.thumbnailUrl}
                    alt={tpl.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-white font-mono font-bold">
                    {tpl.aspectRatio} • {tpl.duration}s
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{tpl.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{tpl.description}</p>
                  </div>
                  <button
                    onClick={() => loadTemplate(tpl)}
                    className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Use Template in Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 px-4 max-w-5xl mx-auto w-full text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-sky-950 via-indigo-950 to-purple-950 border border-sky-500/30 shadow-2xl relative overflow-hidden">
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-3">
            Ready to Build Your Next Viral Hit?
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto mb-6">
            Join thousands of creators using NovaCut Studio for high-definition video editing and AI generation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleStartEditing}
              className="px-8 py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition-all transform hover:scale-105"
            >
              Start Editing Now — Free
            </button>
            <button
              onClick={() => setActiveTab("pricing")}
              className="px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm rounded-2xl transition-all"
            >
              View Pro Plans
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
