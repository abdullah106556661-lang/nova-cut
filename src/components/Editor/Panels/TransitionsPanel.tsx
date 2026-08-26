import React from "react";
import { MoveRight, Sparkles, Layers, Sliders, Check } from "lucide-react";
import { useEditor } from "../../../context/EditorContext";
import { TransitionType } from "../../../types/editor";

interface TransitionPreset {
  id: TransitionType;
  name: string;
  category: string;
  icon: string;
}

const TRANSITIONS: TransitionPreset[] = [
  { id: "fade", name: "Smooth Fade to Black", category: "Classic", icon: "✨" },
  { id: "crossDissolve", name: "Cross Dissolve", category: "Classic", icon: "🔀" },
  { id: "wipeLeft", name: "Wipe Left", category: "Slide & Wipe", icon: "⬅️" },
  { id: "wipeRight", name: "Wipe Right", category: "Slide & Wipe", icon: "➡️" },
  { id: "slideUp", name: "Slide Up", category: "Slide & Wipe", icon: "⬆️" },
  { id: "zoomIn", name: "Dynamic Zoom In", category: "Motion", icon: "🔍" },
  { id: "glitch", name: "Cyber Glitch Transition", category: "Motion", icon: "👾" },
  { id: "spin", name: "360 Spin", category: "Motion", icon: "💫" },
  { id: "flash", name: "White Flash Impact", category: "High Impact", icon: "⚡" },
];

export const TransitionsPanel: React.FC = () => {
  const { selectedClip, updateClip } = useEditor();

  const handleApplyTransition = (type: TransitionType) => {
    if (!selectedClip) return;
    updateClip(selectedClip.id, {
      transitionIn: {
        type,
        duration: 0.6,
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 select-none p-3 overflow-y-auto custom-scrollbar text-xs">
      <div className="mb-3">
        <h3 className="font-semibold text-slate-200 text-sm">Transitions</h3>
        <p className="text-slate-400 text-[11px]">
          {selectedClip
            ? `Apply an entrance transition to "${selectedClip.name}"`
            : "Select a clip on the timeline first to attach transitions."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {TRANSITIONS.map((tr) => {
          const isCurrent = selectedClip?.transitionIn?.type === tr.id;
          return (
            <div
              key={tr.id}
              onClick={() => handleApplyTransition(tr.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between group shadow ${
                isCurrent
                  ? "bg-slate-950 border-sky-400 ring-2 ring-sky-400/30"
                  : "bg-slate-950 border-slate-800 hover:border-sky-500/50"
              }`}
            >
              <div className="text-xl mb-1.5">{tr.icon}</div>
              <p className="font-semibold text-slate-200 text-xs mb-1 truncate">{tr.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">{tr.category}</span>
                {isCurrent && <Check className="w-3 h-3 text-sky-400" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
