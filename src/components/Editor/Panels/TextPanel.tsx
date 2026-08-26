import React from "react";
import { Type, Plus, Sparkles, Flame, Zap } from "lucide-react";
import { useEditor } from "../../../context/EditorContext";
import { TextPreset } from "../../../types/editor";

const TEXT_PRESETS: TextPreset[] = [
  {
    id: "preset_headline",
    name: "Viral Bold Headline",
    text: "THE SECRET YOU NEVER KNEW",
    fontSize: 52,
    fontWeight: "900",
    color: "#ffffff",
    backgroundColor: "#ef4444",
    animation: "pop",
  },
  {
    id: "preset_neon",
    name: "Cyber Neon Glow",
    text: "FUTURE OF CREATION",
    fontSize: 48,
    fontWeight: "bold",
    color: "#38bdf8",
    outlineColor: "#0284c7",
    outlineWidth: 3,
    animation: "glitch",
  },
  {
    id: "preset_minimal",
    name: "Clean Minimalist Title",
    text: "EPISODE 01: BEGINNINGS",
    fontSize: 34,
    fontWeight: "normal",
    color: "#f8fafc",
    animation: "fade",
  },
  {
    id: "preset_callout",
    name: "Yellow Hook Callout",
    text: "⚠️ WATCH TILL THE END",
    fontSize: 40,
    fontWeight: "800",
    color: "#0f172a",
    backgroundColor: "#facc15",
    animation: "bounce",
  },
  {
    id: "preset_lowerthird",
    name: "Host Lower Third",
    text: "ALEX VANCE | CREATIVE DIRECTOR",
    fontSize: 28,
    fontWeight: "600",
    color: "#ffffff",
    backgroundColor: "#0f172aee",
    animation: "slide",
  },
  {
    id: "preset_typewriter",
    name: "Retro Typewriter Note",
    text: "Location: Tokyo, Japan 02:45 AM",
    fontSize: 30,
    fontWeight: "normal",
    color: "#a7f3d0",
    animation: "typewriter",
  },
];

export const TextPanel: React.FC = () => {
  const { addClipToTrack, project, currentTime } = useEditor();

  const handleAddText = (preset: TextPreset) => {
    let textTrack = project.tracks.find((t) => t.type === "text");
    if (!textTrack) textTrack = project.tracks[0];
    if (!textTrack) return;

    addClipToTrack(textTrack.id, {
      type: "text",
      name: preset.name,
      startTime: currentTime,
      duration: 4.0,
      scale: 1,
      textProps: {
        text: preset.text,
        fontSize: preset.fontSize,
        fontWeight: preset.fontWeight,
        fontFamily: "sans-serif",
        color: preset.color,
        backgroundColor: preset.backgroundColor,
        outlineColor: preset.outlineColor,
        outlineWidth: preset.outlineWidth,
        animation: preset.animation,
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 select-none p-3 overflow-y-auto custom-scrollbar text-xs">
      <div className="mb-3">
        <h3 className="font-semibold text-slate-200 text-sm">Titles & Text Presets</h3>
        <p className="text-slate-400 text-[11px]">
          Click any stylized preset to add it at the current playhead position.
        </p>
      </div>

      <div className="space-y-2.5">
        {TEXT_PRESETS.map((preset) => (
          <div
            key={preset.id}
            onClick={() => handleAddText(preset)}
            className="p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/60 rounded-lg cursor-pointer transition-all flex flex-col justify-between group shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400">{preset.name}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                {preset.animation}
              </span>
            </div>

            {/* Preview Visual */}
            <div className="p-3 bg-slate-900/90 rounded border border-slate-800 text-center my-1 flex items-center justify-center min-h-[56px]">
              <span
                style={{
                  color: preset.color,
                  backgroundColor: preset.backgroundColor || "transparent",
                  fontWeight: preset.fontWeight,
                  fontSize: "13px",
                  padding: preset.backgroundColor ? "4px 8px" : "0",
                  borderRadius: "4px",
                }}
                className="truncate"
              >
                {preset.text}
              </span>
            </div>

            <div className="flex items-center justify-end mt-2 pt-2 border-t border-slate-900">
              <button className="flex items-center gap-1 text-[11px] font-medium text-amber-400 group-hover:text-amber-300">
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Timeline</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
