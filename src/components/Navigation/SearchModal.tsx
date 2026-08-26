import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Video,
  Wand2,
  LayoutTemplate,
  FolderOpen,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Plus,
} from "lucide-react";
import { useEditor, NavTab } from "../../context/EditorContext";
import { VIDEO_TEMPLATES } from "../../data/templatesData";

export const SearchModal: React.FC = () => {
  const {
    searchModalOpen,
    setSearchModalOpen,
    setActiveTab,
    projects,
    openProject,
    loadTemplate,
    createProject,
    setActivePanel,
  } = useEditor();

  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen(true);
      } else if (e.key === "Escape" && searchModalOpen) {
        setSearchModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchModalOpen, setSearchModalOpen]);

  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [searchModalOpen]);

  if (!searchModalOpen) return null;

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTemplates = VIDEO_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
  );

  const actions = [
    {
      id: "act_new_video",
      title: "Create New 16:9 Video Project",
      subtitle: "Open Studio canvas in 1080p landscape",
      icon: Plus,
      category: "Quick Actions",
      onClick: () => {
        createProject({
          aspectRatio: "16:9",
          width: 1920,
          height: 1080,
          fps: 30,
          backgroundColor: "#080c14",
          duration: 15,
        });
        setSearchModalOpen(false);
      },
    },
    {
      id: "act_new_tiktok",
      title: "Create New 9:16 TikTok / Reel Project",
      subtitle: "Vertical 1080x1920 format",
      icon: Video,
      category: "Quick Actions",
      onClick: () => {
        createProject({
          aspectRatio: "9:16",
          width: 1080,
          height: 1920,
          fps: 30,
          backgroundColor: "#090d16",
          duration: 12,
        });
        setSearchModalOpen(false);
      },
    },
    {
      id: "act_ai_script",
      title: "AI Video Storyboard & Script Writer",
      subtitle: "Generate viral hooks, b-roll ideas, and timestamps",
      icon: Sparkles,
      category: "AI Creative Tools",
      onClick: () => {
        setActiveTab("ai-generate");
        setSearchModalOpen(false);
      },
    },
    {
      id: "act_ai_img",
      title: "AI Image & Photo Generator",
      subtitle: "Generate 8K photorealistic assets and backgrounds",
      icon: Wand2,
      category: "AI Creative Tools",
      onClick: () => {
        setActiveTab("ai-generate");
        setSearchModalOpen(false);
      },
    },
    {
      id: "act_ai_thumb",
      title: "AI YouTube Thumbnail Studio",
      subtitle: "Generate high-CTR creator thumbnails",
      icon: Wand2,
      category: "AI Creative Tools",
      onClick: () => {
        setActiveTab("ai-generate");
        setSearchModalOpen(false);
      },
    },
    {
      id: "act_templates",
      title: "Browse All Video Templates",
      subtitle: "TikTok, Reels, YouTube, Ads, Podcasts",
      icon: LayoutTemplate,
      category: "Navigation",
      onClick: () => {
        setActiveTab("templates");
        setSearchModalOpen(false);
      },
    },
    {
      id: "act_help",
      title: "Keyboard Shortcuts & Video Tutorials",
      subtitle: "Learn video editing tricks and timeline hotkeys",
      icon: HelpCircle,
      category: "Navigation",
      onClick: () => {
        setActiveTab("help");
        setSearchModalOpen(false);
      },
    },
  ].filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4 select-none animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header Input */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
          <Search className="w-5 h-5 text-sky-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects, templates, AI tools, or type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none font-medium"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
            ESC
          </kbd>
          <button
            onClick={() => setSearchModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-3 space-y-4 text-xs">
          {/* Quick Actions / Navigation */}
          {actions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1">
                Actions & Tools
              </span>
              {actions.map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.id}
                    onClick={act.onClick}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200 group-hover:text-sky-300">
                          {act.title}
                        </p>
                        <p className="text-[11px] text-slate-400">{act.subtitle}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transform group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}
            </div>
          )}

          {/* User Projects */}
          {filteredProjects.length > 0 && (
            <div className="space-y-1 border-t border-slate-800/80 pt-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1">
                Your Projects ({filteredProjects.length})
              </span>
              {filteredProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    openProject(p.id);
                    setSearchModalOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-8 rounded bg-slate-800 overflow-hidden border border-slate-700">
                      {p.thumbnailUrl ? (
                        <img src={p.thumbnailUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <Video className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200 group-hover:text-sky-300">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {p.settings.aspectRatio} • {p.settings.duration}s • Updated{" "}
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-sky-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Open in Studio →
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Video Templates */}
          {filteredTemplates.length > 0 && (
            <div className="space-y-1 border-t border-slate-800/80 pt-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1">
                Templates ({filteredTemplates.length})
              </span>
              {filteredTemplates.slice(0, 4).map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    loadTemplate(tpl);
                    setSearchModalOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={tpl.thumbnailUrl}
                      alt={tpl.name}
                      className="w-10 h-8 rounded object-cover border border-slate-700"
                    />
                    <div>
                      <p className="font-semibold text-slate-200 group-hover:text-sky-300">
                        {tpl.name}
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {tpl.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Use Template →
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
