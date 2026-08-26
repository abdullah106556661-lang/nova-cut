import React, { useState } from "react";
import {
  Subtitles,
  Sparkles,
  Plus,
  Trash2,
  Download,
  FileText,
  Clock,
  Check,
} from "lucide-react";
import { useEditor } from "../../../context/EditorContext";
import { AIService } from "../../../engine/aiService";

export const CaptionsPanel: React.FC = () => {
  const {
    project,
    addSubtitle,
    updateSubtitle,
    removeSubtitle,
    currentTime,
    setCurrentTime,
  } = useEditor();

  const [isGenerating, setIsGenerating] = useState(false);
  const [newSubText, setNewSubText] = useState("");
  const [videoContext, setVideoContext] = useState(
    "How to double your productivity using 3 fast creator shortcuts in NovaCut"
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Generate Auto-Captions with AI
  const handleGenerateCaptions = async () => {
    setIsGenerating(true);
    try {
      const subs = await AIService.generateAutoCaptions({
        videoDescription: videoContext,
        duration: project.settings.duration || 15,
      });

      subs.forEach((sub) => {
        addSubtitle(sub.startTime, sub.endTime, sub.text);
      });

      setSuccessMsg(`Generated ${subs.length} synchronized subtitles!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to generate captions.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Manual Add Subtitle
  const handleAddManual = () => {
    if (!newSubText.trim()) return;
    const start = Number(currentTime.toFixed(1));
    const end = Number(Math.min(project.settings.duration, start + 2.5).toFixed(1));
    addSubtitle(start, end, newSubText.trim());
    setNewSubText("");
  };

  // Export SRT
  const handleExportSRT = () => {
    const subs = project.subtitles || [];
    if (subs.length === 0) {
      alert("No subtitles to export. Add some subtitles first!");
      return;
    }

    const formatSrtTime = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
    };

    let srtContent = "";
    subs.forEach((s, idx) => {
      srtContent += `${idx + 1}\n`;
      srtContent += `${formatSrtTime(s.startTime)} --> ${formatSrtTime(s.endTime)}\n`;
      srtContent += `${s.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name || "captions"}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 select-none p-3 overflow-y-auto custom-scrollbar text-xs">
      <div className="mb-3">
        <h3 className="font-semibold text-slate-200 text-sm">Captions & Auto-Subtitles</h3>
        <p className="text-slate-400 text-[11px]">
          Generate viral dynamic TikTok/Reels captions automatically or edit line-by-line.
        </p>
      </div>

      {/* AI Auto-Captions Card */}
      <div className="p-3 bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border border-indigo-500/40 rounded-xl mb-4 shadow">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-slate-200 text-xs">AI Auto-Caption Speech Engine</span>
        </div>
        <textarea
          rows={2}
          value={videoContext}
          onChange={(e) => setVideoContext(e.target.value)}
          placeholder="Brief topic or transcript of the video..."
          className="w-full bg-slate-950/80 border border-indigo-500/30 rounded-lg p-2 text-slate-200 text-xs mb-2.5 outline-none focus:border-purple-400"
        />
        <button
          disabled={isGenerating}
          onClick={handleGenerateCaptions}
          className="w-full py-2 bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 disabled:opacity-50 text-white font-bold rounded-lg shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGenerating ? "Generating Captions with AI..." : "Generate AI Subtitles"}</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="mb-3 p-2 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 flex items-center gap-1.5 animate-fadeIn">
          <Check className="w-3.5 h-3.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Manual Subtitle Input */}
      <div className="space-y-2 mb-4">
        <label className="text-slate-300 font-medium block">
          Add Subtitle at Current Time ({currentTime.toFixed(1)}s)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type subtitle line..."
            value={newSubText}
            onChange={(e) => setNewSubText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddManual()}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:ring-1 focus:ring-rose-500"
          />
          <button
            onClick={handleAddManual}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Subtitles List Header & Export */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-slate-300">
          Subtitles ({project.subtitles?.length || 0})
        </span>
        <button
          onClick={handleExportSRT}
          className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
        >
          <Download className="w-3 h-3" />
          <span>Export .SRT</span>
        </button>
      </div>

      {/* List */}
      <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
        {(!project.subtitles || project.subtitles.length === 0) && (
          <p className="text-slate-500 italic text-center py-4">
            No subtitles yet. Use AI auto-captions or add manual lines above.
          </p>
        )}

        {(project.subtitles || []).map((sub) => (
          <div
            key={sub.id}
            className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2 hover:border-rose-500/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              {/* Timestamps */}
              <div
                onClick={() => setCurrentTime(sub.startTime)}
                className="flex items-center gap-1 text-[10px] font-mono text-rose-400 cursor-pointer hover:underline"
              >
                <Clock className="w-3 h-3" />
                <span>
                  {sub.startTime}s - {sub.endTime}s
                </span>
              </div>

              {/* Delete */}
              <button
                onClick={() => removeSubtitle(sub.id)}
                className="text-slate-500 hover:text-red-400 p-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            <textarea
              rows={2}
              value={sub.text}
              onChange={(e) => updateSubtitle(sub.id, { text: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 text-xs outline-none focus:border-rose-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
