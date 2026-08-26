import React from "react";
import {
  FolderOpen,
  Music,
  Type,
  Smile,
  Sparkles,
  Layers,
  Subtitles,
  Bot,
  LayoutTemplate,
} from "lucide-react";
import { useEditor } from "../../../context/EditorContext";

interface NavItem {
  id:
    | "media"
    | "audio"
    | "text"
    | "stickers"
    | "effects"
    | "transitions"
    | "captions"
    | "ai"
    | "templates";
  label: string;
  icon: React.ReactNode;
  isAi?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "media", label: "Media", icon: <FolderOpen className="w-4 h-4" /> },
  { id: "audio", label: "Audio", icon: <Music className="w-4 h-4" /> },
  { id: "text", label: "Text", icon: <Type className="w-4 h-4" /> },
  { id: "stickers", label: "Stickers", icon: <Smile className="w-4 h-4" /> },
  { id: "effects", label: "Effects", icon: <Sparkles className="w-4 h-4" /> },
  { id: "transitions", label: "Transitions", icon: <Layers className="w-4 h-4" /> },
  { id: "captions", label: "Captions", icon: <Subtitles className="w-4 h-4" /> },
  { id: "ai", label: "AI Studio", icon: <Bot className="w-4 h-4" />, isAi: true },
  { id: "templates", label: "Templates", icon: <LayoutTemplate className="w-4 h-4" /> },
];

export const EditorSidebar: React.FC = () => {
  const { activePanel, setActivePanel } = useEditor();

  return (
    <div className="w-18 bg-slate-950 border-r border-slate-800/90 flex flex-col items-center py-2 select-none z-20">
      <div className="flex-1 w-full space-y-1 px-1.5 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = activePanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePanel(item.id)}
              className={`w-full flex flex-col items-center justify-center py-2.5 rounded-xl text-[10px] font-medium transition-all group relative ${
                isActive
                  ? item.isAi
                    ? "bg-purple-950/80 text-purple-300 font-bold border border-purple-500/40 shadow-sm"
                    : "bg-sky-500/10 text-sky-400 font-bold border border-sky-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <div
                className={`mb-1 transition-transform group-hover:scale-110 ${
                  isActive
                    ? item.isAi
                      ? "text-purple-400"
                      : "text-sky-400"
                    : "text-slate-400 group-hover:text-slate-200"
                }`}
              >
                {item.icon}
              </div>
              <span className="tracking-tight">{item.label}</span>

              {item.isAi && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
