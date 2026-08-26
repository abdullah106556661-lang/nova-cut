import React from "react";
import { LayoutTemplate, Sparkles, Check, Play } from "lucide-react";
import { useEditor } from "../../../context/EditorContext";
import { VIDEO_TEMPLATES } from "../../../data/templatesData";
import { VideoTemplate } from "../../../types/editor";

export const TemplatesPanel: React.FC = () => {
  const { loadTemplate } = useEditor();

  const handleApplyTemplate = (template: VideoTemplate) => {
    if (
      window.confirm(
        `Load "${template.name}" template? This will load the pre-built timeline tracks and effects.`
      )
    ) {
      loadTemplate(template);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 select-none p-3 overflow-y-auto custom-scrollbar text-xs">
      <div className="mb-3">
        <h3 className="font-semibold text-slate-200 text-sm">Project Templates</h3>
        <p className="text-slate-400 text-[11px]">
          Start from an optimized layout complete with clips, background music, and typography.
        </p>
      </div>

      <div className="space-y-3">
        {VIDEO_TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            onClick={() => handleApplyTemplate(tpl)}
            className="group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 hover:border-sky-500/60 transition-all cursor-pointer shadow-lg"
          >
            <div className="aspect-video relative overflow-hidden bg-slate-900">
              <img
                src={tpl.thumbnailUrl}
                alt={tpl.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono text-sky-300 border border-slate-700">
                {tpl.aspectRatio}
              </div>
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono text-slate-300">
                {tpl.duration}s
              </div>
              <div className="absolute inset-0 bg-sky-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <div className="px-3 py-1.5 bg-sky-500 text-white rounded-lg font-bold text-xs shadow-lg flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Use Template</span>
                </div>
              </div>
            </div>

            <div className="p-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-slate-200 text-xs">{tpl.name}</h4>
                <span className="text-[10px] text-sky-400 font-medium capitalize">
                  {tpl.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{tpl.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
