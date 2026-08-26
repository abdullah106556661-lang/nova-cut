import React from "react";
import {
  Plus,
  Video,
  Wand2,
  Sparkles,
  LayoutTemplate,
  FolderOpen,
  Download,
  Copy,
  Trash2,
  Edit2,
  HardDrive,
  Cpu,
  Clock,
  ArrowRight,
  TrendingUp,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { useEditor } from "../../context/EditorContext";
import { useAuth } from "../../context/AuthContext";
import { VIDEO_TEMPLATES } from "../../data/templatesData";

export const DashboardView: React.FC = () => {
  const {
    projects,
    openProject,
    deleteProject,
    duplicateProject,
    exportProjectJson,
    createProject,
    loadTemplate,
    setActiveTab,
  } = useEditor();
  const { user } = useAuth();

  const handleCreateLandscape = () => {
    createProject({
      aspectRatio: "16:9",
      width: 1920,
      height: 1080,
      fps: 30,
      backgroundColor: "#080c14",
      duration: 15,
    }, "New 16:9 YouTube Video");
  };

  const handleCreateVertical = () => {
    createProject({
      aspectRatio: "9:16",
      width: 1080,
      height: 1920,
      fps: 30,
      backgroundColor: "#090d16",
      duration: 12,
    }, "New 9:16 TikTok Reel");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 select-none">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-sky-950/80 via-indigo-950/60 to-purple-950/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Creator Studio Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Welcome back, {user?.name || "Creator"}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            {user?.role === "SuperAdmin" || user?.email?.toLowerCase().trim() === "abdullah106556661@gmail.com" ? (
              <>
                You have <span className="text-emerald-400 font-bold font-mono">Unlimited AI Credits (Admin)</span> and full access to 4K multi-track video editing.
              </>
            ) : (
              <>
                You have <span className="text-purple-400 font-bold font-mono">{user?.aiCreditsRemaining ?? 500} / 500 Daily AI Credits</span> (refreshed every 24h) and full access to 4K multi-track video editing.
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <button
            onClick={handleCreateLandscape}
            className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Video</span>
          </button>
          <button
            onClick={() => setActiveTab("ai-generate")}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <Wand2 className="w-4 h-4 text-purple-400" />
            <span>AI Studio</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Projects</span>
            <FolderOpen className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{projects.length}</p>
          <p className="text-[10px] text-slate-400">Synced to browser storage</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>AI Credits</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-300 font-mono">
            {user?.role === "SuperAdmin" || user?.email?.toLowerCase().trim() === "abdullah106556661@gmail.com"
              ? "Unlimited"
              : `${user?.aiCreditsRemaining ?? 500} / 500`}
          </p>
          <p className="text-[10px] text-slate-400">
            {user?.role === "SuperAdmin" || user?.email?.toLowerCase().trim() === "abdullah106556661@gmail.com"
              ? "SuperAdmin unrestricted access"
              : "500 Daily credits reset every 24h"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Storage Used</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300 font-mono">
            {((user?.storageUsedMb ?? 1420) / 1024).toFixed(1)} GB
          </p>
          <p className="text-[10px] text-slate-400">Of 50 GB Cloud Quota</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Render Engine</span>
            <Sliders className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 font-mono">WebGL 2.0</p>
          <p className="text-[10px] text-slate-400">Hardware accelerated 60 FPS</p>
        </div>
      </div>

      {/* Quick Launchpad */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-200">Quick Creation Launchpad</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={handleCreateLandscape}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 text-left transition-all group flex flex-col justify-between h-32"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              16:9
            </div>
            <div>
              <p className="font-bold text-xs text-white group-hover:text-sky-300">YouTube 16:9</p>
              <p className="text-[10px] text-slate-400">1080p Landscape</p>
            </div>
          </button>

          <button
            onClick={handleCreateVertical}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-fuchsia-500/50 text-left transition-all group flex flex-col justify-between h-32"
          >
            <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center font-bold">
              9:16
            </div>
            <div>
              <p className="font-bold text-xs text-white group-hover:text-fuchsia-300">TikTok / Reels</p>
              <p className="text-[10px] text-slate-400">Vertical Shorts</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("ai-generate")}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 text-left transition-all group flex flex-col justify-between h-32"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-white group-hover:text-purple-300">AI Video Script</p>
              <p className="text-[10px] text-slate-400">Viral Hook Writer</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("ai-generate")}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group flex flex-col justify-between h-32"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-white group-hover:text-indigo-300">AI Image Studio</p>
              <p className="text-[10px] text-slate-400">8K Art & Photos</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("ai-generate")}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 text-left transition-all group flex flex-col justify-between h-32"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-white group-hover:text-rose-300">AI Thumbnails</p>
              <p className="text-[10px] text-slate-400">High-CTR Badges</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("templates")}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 text-left transition-all group flex flex-col justify-between h-32"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <LayoutTemplate className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-white group-hover:text-amber-300">Templates</p>
              <p className="text-[10px] text-slate-400">50+ Presets</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Projects List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-200">Recent Projects</h2>
          <button
            onClick={() => setActiveTab("projects")}
            className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>View All ({projects.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.slice(0, 6).map((proj) => (
            <div
              key={proj.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden group hover:border-sky-500/40 transition-all flex flex-col"
            >
              {/* Thumbnail header */}
              <div
                onClick={() => openProject(proj.id)}
                className="relative aspect-video bg-slate-950 cursor-pointer overflow-hidden"
              >
                {proj.thumbnailUrl ? (
                  <img
                    src={proj.thumbnailUrl}
                    alt={proj.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Video className="w-8 h-8" />
                  </div>
                )}

                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-white font-mono font-bold">
                  {proj.settings.aspectRatio} • {proj.settings.duration}s
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-4 py-2 bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg">
                    Open in Studio
                  </span>
                </div>
              </div>

              {/* Body details & actions */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3
                    onClick={() => openProject(proj.id)}
                    className="font-bold text-slate-100 text-sm hover:text-sky-400 cursor-pointer truncate"
                  >
                    {proj.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{new Date(proj.updatedAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{proj.tracks.length} tracks</span>
                  </div>
                </div>

                {/* Quick actions strip */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-slate-400 text-xs">
                  <button
                    onClick={() => openProject(proj.id)}
                    className="text-sky-400 hover:text-sky-300 font-semibold"
                  >
                    Open Studio
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => duplicateProject(proj.id)}
                      title="Duplicate"
                      className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => exportProjectJson(proj.id)}
                      title="Export JSON"
                      className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {projects.length > 1 && (
                      <button
                        onClick={() => deleteProject(proj.id)}
                        title="Delete"
                        className="p-1.5 hover:text-red-400 hover:bg-red-950/40 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
