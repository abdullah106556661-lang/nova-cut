import React from "react";
import { Sparkles, Check } from "lucide-react";
import { useEditor } from "../../../context/EditorContext";
import { VisualEffectType } from "../../../types/editor";

interface EffectPreset {
  id: VisualEffectType;
  name: string;
  category: string;
  description: string;
  badgeColor: string;
}

const EFFECTS: EffectPreset[] = [
  {
    id: "vhs",
    name: "📼 VHS Retro Tape",
    category: "Retro & Nostalgia",
    description: "Scanlines, static jitter, and analog distortion",
    badgeColor: "bg-purple-950 text-purple-300 border-purple-800",
  },
  {
    id: "glitch",
    name: "👾 Digital Glitch Slice",
    category: "Cyberpunk",
    description: "High-tech sliced scanline glitch displacement",
    badgeColor: "bg-cyan-950 text-cyan-300 border-cyan-800",
  },
  {
    id: "rgbSplit",
    name: "🌈 Chromatic RGB Split",
    category: "Optical Distortion",
    description: "Prismatic color separation with lens fringe",
    badgeColor: "bg-rose-950 text-rose-300 border-rose-800",
  },
  {
    id: "filmGrain",
    name: "🎬 35mm Film Grain",
    category: "Cinematic",
    description: "Organic analog camera sensor grain & texture",
    badgeColor: "bg-amber-950 text-amber-300 border-amber-800",
  },
  {
    id: "glow",
    name: "✨ Cyber Neon Bloom",
    category: "Lighting",
    description: "High-intensity specular highlight glow",
    badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-800",
  },
  {
    id: "cinematicWarm",
    name: "🌅 Golden Hour Warmth",
    category: "Color Mood",
    description: "Rich amber sun tones and vintage shadows",
    badgeColor: "bg-orange-950 text-orange-300 border-orange-800",
  },
  {
    id: "cinematicCool",
    name: "❄️ Sci-Fi Cool Teal",
    category: "Color Mood",
    description: "Deep cryogenic cyan and moody dark tones",
    badgeColor: "bg-sky-950 text-sky-300 border-sky-800",
  },
  {
    id: "neonAura",
    name: "🔮 Hologram Aura",
    category: "Futuristic",
    description: "Pulsing iridescent energy field",
    badgeColor: "bg-fuchsia-950 text-fuchsia-300 border-fuchsia-800",
  },
];

export const EffectsPanel: React.FC = () => {
  const { selectedClip, updateClip } = useEditor();

  const handleApplyEffect = (effectType: VisualEffectType) => {
    if (!selectedClip) return;
    updateClip(selectedClip.id, {
      visualEffect: effectType,
      effectIntensity: 1.0,
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 select-none p-3 overflow-y-auto custom-scrollbar text-xs">
      <div className="mb-3">
        <h3 className="font-semibold text-slate-200 text-sm">Visual Effects & Shaders</h3>
        <p className="text-slate-400 text-[11px]">
          {selectedClip
            ? `Select an effect to apply to "${selectedClip.name}"`
            : "Select a clip on the timeline first, then click an effect below."}
        </p>
      </div>

      <div className="space-y-2.5">
        {/* None Option */}
        {selectedClip && selectedClip.visualEffect !== "none" && (
          <button
            onClick={() => handleApplyEffect("none")}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
          >
            Clear Active Effect
          </button>
        )}

        {EFFECTS.map((eff) => {
          const isActive = selectedClip?.visualEffect === eff.id;
          return (
            <div
              key={eff.id}
              onClick={() => handleApplyEffect(eff.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between group shadow ${
                isActive
                  ? "bg-slate-950 border-sky-400 ring-2 ring-sky-400/30"
                  : "bg-slate-950 border-slate-800 hover:border-sky-500/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-200 text-xs">{eff.name}</span>
                {isActive ? (
                  <span className="flex items-center gap-1 text-[10px] text-sky-400 font-bold">
                    <Check className="w-3 h-3" />
                    Applied
                  </span>
                ) : (
                  <span
                    className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border ${eff.badgeColor}`}
                  >
                    {eff.category}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{eff.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
