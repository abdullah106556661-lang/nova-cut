import React, { useState } from "react";
import {
  Sparkles,
  Download,
  Share2,
  Undo2,
  Redo2,
  Keyboard,
  User,
  Settings,
  LogOut,
  FolderOpen,
  Plus,
  Zap,
  ArrowLeft,
  LayoutDashboard,
  HelpCircle,
} from "lucide-react";
import { useEditor } from "../../../context/EditorContext";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";

export const EditorHeader: React.FC = () => {
  const {
    project,
    setProject,
    undo,
    redo,
    canUndo,
    canRedo,
    setExportModalOpen,
    setShortcutsModalOpen,
    setActivePanel,
    createProject,
    setActiveTab,
    isAutoSaved,
  } = useEditor();

  const { user, logout, setAuthModalOpen } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [projName, setProjName] = useState(project.name);

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (projName.trim()) {
      setProject((p) => ({ ...p, name: projName.trim() }));
    }
  };

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800/90 flex items-center justify-between px-3 sm:px-4 select-none z-30">
      {/* Left Branding & Project Info */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Back to Platform Dashboard Button */}
        <button
          onClick={() => setActiveTab("dashboard")}
          title="Return to Dashboard"
          className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        {/* Logo */}
        <div
          onClick={() => setActiveTab("home")}
          className="flex items-center gap-2 cursor-pointer group"
          title="Return to Home"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-sky-500/25 group-hover:scale-105 transition-transform">
            N
          </div>
          <div className="hidden md:block">
            <span className="font-extrabold text-sm tracking-tight text-white">
              Nova<span className="text-sky-400">Cut</span>
            </span>
            <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold uppercase tracking-wider">
              Studio Pro
            </span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden sm:block w-px h-6 bg-slate-800" />

        {/* Project Name Editable */}
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <input
              type="text"
              autoFocus
              value={projName}
              onChange={(e) => setProjName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => e.key === "Enter" && handleNameBlur()}
              className="bg-slate-900 border border-sky-500 rounded px-2 py-1 text-xs text-white outline-none font-medium"
            />
          ) : (
            <h2
              onClick={() => setIsEditingName(true)}
              title="Click to rename project"
              className="text-xs font-bold text-slate-200 hover:text-sky-400 cursor-pointer transition-colors max-w-[140px] sm:max-w-[200px] truncate"
            >
              {project.name}
            </h2>
          )}

          {/* Cloud Auto-Saved Badge */}
          <div
            className={`hidden lg:flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full transition-all duration-300 ${
              isAutoSaved
                ? "text-emerald-300 bg-emerald-950/70 border border-emerald-500/50 shadow-sm shadow-emerald-500/20"
                : "text-emerald-400/80 bg-emerald-950/30 border border-emerald-500/20"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${
                isAutoSaved ? "scale-125 animate-ping" : "animate-pulse"
              }`}
            />
            <span>{isAutoSaved ? "Auto-saving..." : "Saved"}</span>
          </div>
        </div>
      </div>

      {/* Center AI Quick Access */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={() => setActivePanel("ai")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-900 hover:to-indigo-900 text-purple-300 border border-purple-500/40 rounded-full text-xs font-semibold shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
          <span>AI Director & Script Writer</span>
        </button>

        <button
          onClick={() => setActivePanel("captions")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs font-semibold transition-all"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Auto Captions</span>
        </button>
      </div>

      {/* Right Actions & User Menu */}
      <div className="flex items-center gap-3">
        {/* Undo / Redo */}
        <div className="flex items-center gap-1 border-r border-slate-800 pr-3">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-800 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-800 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts Cheat Sheet */}
        <button
          onClick={() => setShortcutsModalOpen(true)}
          title="Keyboard Shortcuts Help (Ctrl+Shift+K or ?)"
          className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Export Video Button */}
        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all transform active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Export Video</span>
        </button>

        {/* User Account / Profile */}
        <div className="relative">
          {user ? (
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="w-8 h-8 rounded-full overflow-hidden border border-sky-400 ring-2 ring-sky-500/20 hover:scale-105 transition-transform"
            >
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              Sign In
            </button>
          )}

          {/* User Dropdown */}
          {user && userDropdownOpen && (
            <div className="absolute right-0 top-10 w-60 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 text-xs space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover border border-sky-400"
                />
                <div className="overflow-hidden">
                  <p className="font-bold text-slate-200 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate font-mono">{user.email}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span>AI Credits</span>
                  <span className="font-mono text-purple-400 font-bold">
                    {user.aiCreditsRemaining} / 1000
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Cloud Storage</span>
                  <span className="font-mono text-sky-400 font-bold">
                    {(user.storageUsedMb / 1024).toFixed(1)} GB / 50 GB
                  </span>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-800 space-y-1">
                <button
                  onClick={() => {
                    createProject({
                      aspectRatio: "16:9",
                      width: 1920,
                      height: 1080,
                      fps: 30,
                      backgroundColor: "#080c14",
                      duration: 15,
                    });
                    setUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5 text-sky-400" />
                  <span>New Blank Project</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-red-950/60 text-red-400 rounded-lg flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
