import React, { useState } from "react";
import {
  X,
  Download,
  Film,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useEditor } from "../../../context/EditorContext";
import { globalVideoExporter } from "../../../engine/videoExporter";
import { ExportConfig } from "../../../types/editor";

export const ExportModal: React.FC = () => {
  const { exportModalOpen, setExportModalOpen, project } = useEditor();

  const [resolution, setResolution] = useState<"720p" | "1080p" | "4k">("1080p");
  const [fps, setFps] = useState<number>(30);
  const [quality, setQuality] = useState<"standard" | "high" | "maximum">("high");
  const [includeWatermark, setIncludeWatermark] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!exportModalOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress(0);
    setErrorMsg(null);
    setExportedUrl(null);

    const config: ExportConfig = {
      resolution,
      fps,
      format: "webm",
      bitrate: quality === "maximum" ? 12000000 : quality === "high" ? 6000000 : 3000000,
      includeWatermark,
    };

    try {
      const blob = await globalVideoExporter.exportProject(project, config, (prog) => {
        setProgress(Math.round(prog * 100));
      });

      const url = URL.createObjectURL(blob);
      setExportedUrl(url);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to render video. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportedUrl) return;
    const a = document.createElement("a");
    a.href = exportedUrl;
    a.download = `${project.name.replace(/\s+/g, "_")}_${resolution}.webm`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Export Master Video
            </h3>
          </div>
          <button
            onClick={() => setExportModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Project Summary */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-200 text-sm truncate">{project.name}</p>
              <p className="text-slate-400 font-mono mt-0.5">
                Aspect: {project.settings.aspectRatio} • Duration: {project.settings.duration.toFixed(1)}s • Tracks: {project.tracks.length}
              </p>
            </div>
            <span className="px-2.5 py-1 bg-sky-500/20 text-sky-400 font-semibold rounded-full border border-sky-500/30 font-mono">
              WebM VP9
            </span>
          </div>

          {/* Resolution Options */}
          <div>
            <label className="text-slate-300 font-semibold block mb-2">Target Resolution</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "720p", label: "720p HD", desc: "Fast share" },
                { id: "1080p", label: "1080p FHD", desc: "Recommended" },
                { id: "4k", label: "4K UHD", desc: "Highest Detail" },
              ].map((res) => (
                <button
                  key={res.id}
                  disabled={isExporting}
                  onClick={() => setResolution(res.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    resolution === res.id
                      ? "bg-sky-500/20 border-sky-500 text-sky-300 ring-1 ring-sky-500"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <p className="font-bold text-slate-200 text-xs">{res.label}</p>
                  <p className="text-[10px] text-slate-400">{res.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Framerate & Quality */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Framerate (FPS)</label>
              <select
                disabled={isExporting}
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-medium"
              >
                <option value={24}>24 FPS (Cinematic)</option>
                <option value={30}>30 FPS (Standard Web)</option>
                <option value={60}>60 FPS (Ultra Smooth)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Encoding Quality</label>
              <select
                disabled={isExporting}
                value={quality}
                onChange={(e) => setQuality(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-medium"
              >
                <option value="standard">Standard (Compact)</option>
                <option value="high">High Quality (Balanced)</option>
                <option value="maximum">Maximum Bitrate (Master)</option>
              </select>
            </div>
          </div>

          {/* Rendering Progress Bar */}
          {isExporting && (
            <div className="space-y-2 p-3.5 bg-slate-950 rounded-xl border border-sky-500/40 animate-pulse">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-sky-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Rendering Timeline Frames...
                </span>
                <span className="font-mono text-slate-200">{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  style={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-150"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Download Banner */}
          {exportedUrl && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Render Complete!</span>
              </div>
              <button
                onClick={handleDownload}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Video File (.webm)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={() => setExportModalOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
          >
            Close
          </button>

          {!exportedUrl && (
            <button
              disabled={isExporting}
              onClick={handleStartExport}
              className="px-6 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isExporting ? "Rendering Video..." : "Start Export"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
