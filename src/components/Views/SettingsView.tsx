import React, { useState } from "react";
import {
  Sliders,
  Monitor,
  HardDrive,
  ShieldCheck,
  Zap,
  Save,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const SettingsView: React.FC = () => {
  const { addNotification } = useAuth();

  // Settings State
  const [defaultResolution, setDefaultResolution] = useState("1080p");
  const [defaultFps, setDefaultFps] = useState("30");
  const [autoSaveInterval, setAutoSaveInterval] = useState("30");
  const [enableHaptic, setEnableHaptic] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [webglAcceleration, setWebglAcceleration] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    addNotification("Settings Saved", "Studio configuration saved to browser cache.", "success");
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 select-none">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
          <Sliders className="w-6 h-6 text-sky-400" />
          <span>Studio Preferences & Configuration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Customize timeline snap tolerances, default canvas presets, WebGL shader pipelines, and performance limits.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
        {/* Section 1: Video Engine */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-sky-400" />
            <span>Timeline & Render Defaults</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">
                Default Export Resolution
              </label>
              <select
                value={defaultResolution}
                onChange={(e) => setDefaultResolution(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-sky-500"
              >
                <option value="720p">720p HD (Fast Draft)</option>
                <option value="1080p">1080p Full HD (Standard)</option>
                <option value="4k">4K Ultra HD (Cinema)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Timeline Framerate</label>
              <select
                value={defaultFps}
                onChange={(e) => setDefaultFps(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-sky-500"
              >
                <option value="24">24 FPS (Cinematic Film)</option>
                <option value="30">30 FPS (Social / Web standard)</option>
                <option value="60">60 FPS (Ultra Smooth Motion)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Autosave Interval</label>
            <select
              value={autoSaveInterval}
              onChange={(e) => setAutoSaveInterval(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-sky-500"
            >
              <option value="10">Every 10 seconds</option>
              <option value="30">Every 30 seconds (Recommended)</option>
              <option value="60">Every 60 seconds</option>
            </select>
          </div>
        </div>

        {/* Section 2: Timeline Interaction */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Editing & Snapping Behaviors</span>
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800/80 cursor-pointer">
              <div>
                <p className="font-bold text-slate-200 text-xs">Magnetic Timeline Snap Guides</p>
                <p className="text-[11px] text-slate-400">
                  Automatically snap playhead and clip boundaries to adjacent edits.
                </p>
              </div>
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800/80 cursor-pointer">
              <div>
                <p className="font-bold text-slate-200 text-xs">Hardware WebGL Shader Acceleration</p>
                <p className="text-[11px] text-slate-400">
                  Use GPU pipeline for real-time LUT color grading and transitions.
                </p>
              </div>
              <input
                type="checkbox"
                checked={webglAcceleration}
                onChange={(e) => setWebglAcceleration(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-sky-500/25"
          >
            <Save className="w-4 h-4" />
            <span>{saved ? "Saved Successfully!" : "Save Studio Preferences"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
