import React from "react";
import { Home, Sparkles, Plus, Scissors } from "lucide-react";
import { useEditor, NavTab } from "../../context/EditorContext";

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, createProject } = useEditor();

  const handleNewProject = () => {
    createProject({
      aspectRatio: "9:16",
      width: 1080,
      height: 1920,
      fps: 30,
      backgroundColor: "#080c14",
      duration: 15,
    });
    setActiveTab("editor");
  };

  const navItems = [
    {
      id: "home" as NavTab,
      label: "Home",
      icon: Home,
      action: () => setActiveTab("home"),
      isActive: activeTab === "home",
    },
    {
      id: "ai-generate" as NavTab,
      label: "AI Studio",
      icon: Sparkles,
      action: () => setActiveTab("ai-generate"),
      isActive: activeTab === "ai-generate",
      badge: "PRO",
    },
    {
      id: "new-project" as const,
      label: "New Project",
      icon: Plus,
      action: handleNewProject,
      isPrimary: true,
    },
    {
      id: "editor" as NavTab,
      label: "Editing Tool",
      icon: Scissors,
      action: () => setActiveTab("editor"),
      isActive: activeTab === "editor",
    },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-3 py-2 flex items-center justify-around select-none shadow-[0_-8px_30px_rgba(0,0,0,0.6)]"
    >
      {navItems.map((item) => {
        const Icon = item.icon;

        if (item.isPrimary) {
          return (
            <button
              key="new-project"
              id="mobile-nav-new-project-btn"
              onClick={item.action}
              className="flex flex-col items-center justify-center -mt-5 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-fuchsia-500 p-[2px] shadow-lg shadow-sky-500/30 group-active:scale-90 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center group-hover:bg-transparent transition-colors">
                  <Plus className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-300 mt-1 tracking-tight">
                {item.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={item.id}
            id={`mobile-nav-${item.id}-btn`}
            onClick={item.action}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
              item.isActive
                ? "text-sky-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform ${
                  item.isActive ? "scale-110 text-sky-400" : "text-slate-400"
                }`}
              />
              {item.badge && (
                <span className="absolute -top-1.5 -right-3 text-[8px] font-black px-1 py-0.2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full leading-tight shadow-sm">
                  {item.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-1 tracking-tight ${
                item.isActive ? "text-sky-400 font-bold" : "text-slate-400"
              }`}
            >
              {item.label}
            </span>
            {item.isActive && (
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full mt-0.5 shadow-sm shadow-sky-400" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
