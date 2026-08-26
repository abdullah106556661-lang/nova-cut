import React, { useState } from "react";
import {
  Sliders,
  Move,
  Gauge,
  Palette,
  Sparkles,
  Volume2,
  Type,
  Key,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { useEditor } from "../../../context/EditorContext";
import { VisualEffectType } from "../../../types/editor";

export const InspectorPanel: React.FC = () => {
  const { selectedClip, updateClip, currentTime, project } = useEditor();
  const [activeTab, setActiveTab] = useState<
    "transform" | "speed" | "color" | "effects" | "audio" | "text" | "keyframes"
  >("transform");

  if (!selectedClip) {
    return (
      <div className="w-80 bg-slate-900 border-l border-slate-800 p-6 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
        <Sliders className="w-8 h-8 mb-2 text-slate-600" />
        <p className="font-medium text-slate-400">No Clip Selected</p>
        <p className="mt-1 text-slate-500">
          Click on any clip in the timeline or preview canvas to adjust its properties.
        </p>
      </div>
    );
  }

  // Keyframe logic
  const relTime = currentTime - selectedClip.startTime;
  const isKeyframeAtCurrent = selectedClip.keyframes?.some(
    (k) => Math.abs(k.time - relTime) < 0.1
  );

  const handleAddKeyframe = () => {
    const newKeyframe = {
      id: `kf_${Date.now()}`,
      time: Math.max(0, Math.min(selectedClip.duration, relTime)),
      properties: {
        x: selectedClip.x,
        y: selectedClip.y,
        scale: selectedClip.scale,
        rotation: selectedClip.rotation,
        opacity: selectedClip.opacity,
      },
    };
    const keyframes = [...(selectedClip.keyframes || []), newKeyframe].sort(
      (a, b) => a.time - b.time
    );
    updateClip(selectedClip.id, { keyframes });
  };

  const handleRemoveKeyframe = (kfId: string) => {
    const keyframes = (selectedClip.keyframes || []).filter((k) => k.id !== kfId);
    updateClip(selectedClip.id, { keyframes });
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden select-none">
      {/* Inspector Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-200 truncate uppercase tracking-wider">
            {selectedClip.name}
          </h3>
          <span className="text-[10px] text-sky-400 font-mono">
            {selectedClip.type.toUpperCase()} • {selectedClip.duration.toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-slate-800 bg-slate-950/80 overflow-x-auto custom-scrollbar text-xs">
        <button
          onClick={() => setActiveTab("transform")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
            activeTab === "transform"
              ? "bg-sky-500 text-white font-medium shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Move className="w-3 h-3" />
          <span>Transform</span>
        </button>

        {selectedClip.type === "text" && (
          <button
            onClick={() => setActiveTab("text")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              activeTab === "text"
                ? "bg-amber-500 text-white font-medium shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Type className="w-3 h-3" />
            <span>Text</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("color")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
            activeTab === "color"
              ? "bg-sky-500 text-white font-medium shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Palette className="w-3 h-3" />
          <span>Color</span>
        </button>

        <button
          onClick={() => setActiveTab("effects")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
            activeTab === "effects"
              ? "bg-cyan-500 text-white font-medium shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>FX</span>
        </button>

        <button
          onClick={() => setActiveTab("speed")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
            activeTab === "speed"
              ? "bg-sky-500 text-white font-medium shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Gauge className="w-3 h-3" />
          <span>Speed</span>
        </button>

        {(selectedClip.type === "audio" || selectedClip.type === "video") && (
          <button
            onClick={() => setActiveTab("audio")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              activeTab === "audio"
                ? "bg-emerald-500 text-white font-medium shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Volume2 className="w-3 h-3" />
            <span>Audio</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("keyframes")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
            activeTab === "keyframes"
              ? "bg-amber-500 text-white font-medium shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Key className="w-3 h-3" />
          <span>Animate</span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs custom-scrollbar">
        {/* TAB: TRANSFORM */}
        {activeTab === "transform" && (
          <div className="space-y-4">
            {/* Position X / Y */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Position X (%)</label>
                <input
                  type="number"
                  value={Math.round(selectedClip.x || 0)}
                  onChange={(e) => updateClip(selectedClip.id, { x: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Position Y (%)</label>
                <input
                  type="number"
                  value={Math.round(selectedClip.y || 0)}
                  onChange={(e) => updateClip(selectedClip.id, { y: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200 font-mono"
                />
              </div>
            </div>

            {/* Scale Slider */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Scale</span>
                <span className="font-mono text-sky-400">
                  {((selectedClip.scale || 1) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.05"
                value={selectedClip.scale || 1}
                onChange={(e) => updateClip(selectedClip.id, { scale: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Rotation Slider */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Rotation</span>
                <span className="font-mono text-sky-400">{selectedClip.rotation || 0}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={selectedClip.rotation || 0}
                onChange={(e) => updateClip(selectedClip.id, { rotation: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Opacity Slider */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Opacity</span>
                <span className="font-mono text-sky-400">
                  {((selectedClip.opacity ?? 1) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedClip.opacity ?? 1}
                onChange={(e) => updateClip(selectedClip.id, { opacity: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Flip Controls */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-slate-400 block mb-2 font-medium">Flip Orientation</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    updateClip(selectedClip.id, { flipHorizontal: !selectedClip.flipHorizontal })
                  }
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-md border text-xs font-medium transition-colors ${
                    selectedClip.flipHorizontal
                      ? "bg-sky-500/20 text-sky-400 border-sky-500/50"
                      : "bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Flip Horizontal</span>
                </button>

                <button
                  onClick={() =>
                    updateClip(selectedClip.id, { flipVertical: !selectedClip.flipVertical })
                  }
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-md border text-xs font-medium transition-colors ${
                    selectedClip.flipVertical
                      ? "bg-sky-500/20 text-sky-400 border-sky-500/50"
                      : "bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span>Flip Vertical</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: TEXT (if Text Clip) */}
        {activeTab === "text" && selectedClip.textProps && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-400 block mb-1">Text Content</label>
              <textarea
                rows={3}
                value={selectedClip.textProps.text}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    name: e.target.value.slice(0, 20) || "Text",
                    textProps: { ...selectedClip.textProps!, text: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-slate-100 focus:ring-1 focus:ring-amber-400 outline-none"
              />
            </div>

            {/* Font Size & Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Font Size (px)</label>
                <input
                  type="number"
                  min="12"
                  max="120"
                  value={selectedClip.textProps.fontSize || 32}
                  onChange={(e) =>
                    updateClip(selectedClip.id, {
                      textProps: { ...selectedClip.textProps!, fontSize: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Font Weight</label>
                <select
                  value={selectedClip.textProps.fontWeight || "bold"}
                  onChange={(e) =>
                    updateClip(selectedClip.id, {
                      textProps: { ...selectedClip.textProps!, fontWeight: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200"
                >
                  <option value="normal">Regular</option>
                  <option value="600">Semi Bold</option>
                  <option value="bold">Bold</option>
                  <option value="900">Black / Ultra</option>
                </select>
              </div>
            </div>

            {/* Text Color & Background Box */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedClip.textProps.color || "#ffffff"}
                    onChange={(e) =>
                      updateClip(selectedClip.id, {
                        textProps: { ...selectedClip.textProps!, color: e.target.value },
                      })
                    }
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-slate-300">
                    {selectedClip.textProps.color || "#ffffff"}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Box Background</label>
                <input
                  type="text"
                  placeholder="#ef4444 or #000000aa"
                  value={selectedClip.textProps.backgroundColor || ""}
                  onChange={(e) =>
                    updateClip(selectedClip.id, {
                      textProps: { ...selectedClip.textProps!, backgroundColor: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200"
                />
              </div>
            </div>

            {/* Animation Preset */}
            <div>
              <label className="text-slate-400 block mb-1">Text Animation Preset</label>
              <select
                value={selectedClip.textProps.animation || "none"}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    textProps: { ...selectedClip.textProps!, animation: e.target.value as any },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200"
              >
                <option value="none">None (Static)</option>
                <option value="pop">🔥 Pop In</option>
                <option value="typewriter">⌨️ Typewriter</option>
                <option value="fade">✨ Smooth Fade</option>
                <option value="slide">➡️ Slide In</option>
                <option value="bounce">⚡ Bounce</option>
                <option value="glitch">👾 Cyber Glitch</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB: COLOR GRADING */}
        {activeTab === "color" && (
          <div className="space-y-4">
            {/* Brightness */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Brightness</span>
                <span className="font-mono text-sky-400">
                  {selectedClip.colorFilter.brightness.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.05"
                value={selectedClip.colorFilter.brightness}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    colorFilter: { ...selectedClip.colorFilter, brightness: Number(e.target.value) },
                  })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Contrast</span>
                <span className="font-mono text-sky-400">
                  {selectedClip.colorFilter.contrast.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.05"
                value={selectedClip.colorFilter.contrast}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    colorFilter: { ...selectedClip.colorFilter, contrast: Number(e.target.value) },
                  })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Saturation */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Saturation</span>
                <span className="font-mono text-sky-400">
                  {selectedClip.colorFilter.saturation.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2.5"
                step="0.05"
                value={selectedClip.colorFilter.saturation}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    colorFilter: { ...selectedClip.colorFilter, saturation: Number(e.target.value) },
                  })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Grayscale */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Grayscale (B&W)</span>
                <span className="font-mono text-sky-400">
                  {(selectedClip.colorFilter.grayscale * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedClip.colorFilter.grayscale}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    colorFilter: { ...selectedClip.colorFilter, grayscale: Number(e.target.value) },
                  })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Sepia / Vintage */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Vintage Sepia</span>
                <span className="font-mono text-sky-400">
                  {(selectedClip.colorFilter.sepia * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedClip.colorFilter.sepia}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    colorFilter: { ...selectedClip.colorFilter, sepia: Number(e.target.value) },
                  })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Hue Rotate */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Hue Rotate</span>
                <span className="font-mono text-sky-400">{selectedClip.colorFilter.hueRotate}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={selectedClip.colorFilter.hueRotate}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    colorFilter: { ...selectedClip.colorFilter, hueRotate: Number(e.target.value) },
                  })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
          </div>
        )}

        {/* TAB: VISUAL EFFECTS (FX) */}
        {activeTab === "effects" && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-400 block mb-2">Visual Shader / Effect</label>
              <select
                value={selectedClip.visualEffect}
                onChange={(e) =>
                  updateClip(selectedClip.id, { visualEffect: e.target.value as VisualEffectType })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-2 text-slate-200 font-medium"
              >
                <option value="none">None</option>
                <option value="vhs">📼 VHS Retro Scanlines</option>
                <option value="glitch">👾 Digital Glitch Slice</option>
                <option value="rgbSplit">🌈 Chromatic RGB Split</option>
                <option value="filmGrain">🎬 35mm Cinematic Film Grain</option>
                <option value="glow">✨ Cyber Neon Glow</option>
                <option value="cinematicWarm">🌅 Golden Hour Cinematic Warm</option>
                <option value="cinematicCool">❄️ Sci-Fi Cinematic Cool</option>
                <option value="neonAura">🔮 Holographic Neon Aura</option>
              </select>
            </div>

            {selectedClip.visualEffect !== "none" && (
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Effect Intensity</span>
                  <span className="font-mono text-sky-400">
                    {((selectedClip.effectIntensity || 1) * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.05"
                  value={selectedClip.effectIntensity || 1}
                  onChange={(e) =>
                    updateClip(selectedClip.id, { effectIntensity: Number(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB: SPEED CONTROL */}
        {activeTab === "speed" && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Playback Speed</span>
                <span className="font-mono text-sky-400 font-bold">{selectedClip.speed}x</span>
              </div>
              <input
                type="range"
                min="0.25"
                max="4.0"
                step="0.25"
                value={selectedClip.speed}
                onChange={(e) => updateClip(selectedClip.id, { speed: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Quick Speed Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[0.5, 1.0, 1.5, 2.0].map((s) => (
                <button
                  key={s}
                  onClick={() => updateClip(selectedClip.id, { speed: s })}
                  className={`py-1.5 rounded text-xs font-mono font-semibold transition-colors ${
                    selectedClip.speed === s
                      ? "bg-sky-500 text-white shadow-sm"
                      : "bg-slate-950 text-slate-300 border border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB: AUDIO */}
        {activeTab === "audio" && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Volume</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {(((selectedClip.audioProps?.volume ?? 1) as number) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={selectedClip.audioProps?.volume ?? 1}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    audioProps: {
                      volume: Number(e.target.value),
                      muted: selectedClip.audioProps?.muted || false,
                      fadeIn: selectedClip.audioProps?.fadeIn || 0,
                      fadeOut: selectedClip.audioProps?.fadeOut || 0,
                      speed: selectedClip.speed,
                    },
                  })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Fade in / Fade out */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Fade In (s)</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.5"
                  value={selectedClip.audioProps?.fadeIn || 0}
                  onChange={(e) =>
                    updateClip(selectedClip.id, {
                      audioProps: {
                        volume: selectedClip.audioProps?.volume ?? 1,
                        muted: selectedClip.audioProps?.muted || false,
                        fadeIn: Number(e.target.value),
                        fadeOut: selectedClip.audioProps?.fadeOut || 0,
                        speed: selectedClip.speed,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Fade Out (s)</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.5"
                  value={selectedClip.audioProps?.fadeOut || 0}
                  onChange={(e) =>
                    updateClip(selectedClip.id, {
                      audioProps: {
                        volume: selectedClip.audioProps?.volume ?? 1,
                        muted: selectedClip.audioProps?.muted || false,
                        fadeIn: selectedClip.audioProps?.fadeIn || 0,
                        fadeOut: Number(e.target.value),
                        speed: selectedClip.speed,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB: KEYFRAME ANIMATION */}
        {activeTab === "keyframes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Keyframe Diamonds</span>
              <button
                onClick={handleAddKeyframe}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-md shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Keyframe at {relTime.toFixed(1)}s</span>
              </button>
            </div>

            {/* List of active keyframes */}
            <div className="space-y-2">
              {(selectedClip.keyframes || []).length === 0 ? (
                <p className="text-slate-500 italic py-2 text-center">
                  No keyframes added yet. Move playhead and click "+ Keyframe" to animate scale,
                  position, or opacity over time!
                </p>
              ) : (
                selectedClip.keyframes.map((kf, i) => (
                  <div
                    key={kf.id}
                    className="flex items-center justify-between p-2 rounded-md bg-slate-950 border border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-amber-400 rotate-45 border border-black" />
                      <span className="font-mono text-slate-200 font-medium">
                        Keyframe #{i + 1} ({kf.time.toFixed(1)}s)
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveKeyframe(kf.id)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
