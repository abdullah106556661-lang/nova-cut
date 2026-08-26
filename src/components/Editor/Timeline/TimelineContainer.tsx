import React, { useRef, useState } from "react";
import {
  Scissors,
  Copy,
  Trash2,
  Bookmark,
  Plus,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Magnet,
} from "lucide-react";
import { useEditor } from "../../../context/EditorContext";
import { TimelineTrack } from "./TimelineTrack";

export const TimelineContainer: React.FC = () => {
  const {
    project,
    currentTime,
    setCurrentTime,
    selectedClipId,
    splitClipAtPlayhead,
    duplicateClip,
    removeClip,
    zoomLevel,
    setZoomLevel,
    undo,
    redo,
    canUndo,
    canRedo,
    addTrack,
  } = useEditor();

  const rulerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [addTrackDropdownOpen, setAddTrackDropdownOpen] = useState(false);
  const [snappingEnabled, setSnappingEnabled] = useState(true);

  const duration = project.settings.duration || 15;
  const totalWidthPx = Math.max(1400, (duration + 5) * zoomLevel);

  // Time Ruler Ticks Calculation
  const renderRulerTicks = () => {
    const ticks = [];
    const stepSeconds = zoomLevel > 60 ? 1 : zoomLevel > 30 ? 2 : 5;
    for (let t = 0; t <= duration + 4; t += stepSeconds) {
      const leftPx = t * zoomLevel;
      const mins = Math.floor(t / 60);
      const secs = Math.floor(t % 60);
      const label = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

      ticks.push(
        <div
          key={t}
          style={{ left: `${leftPx}px` }}
          className="absolute top-0 bottom-0 flex flex-col justify-end pointer-events-none"
        >
          <span className="text-[10px] font-mono text-slate-400 pl-1 pb-1 select-none">
            {label}
          </span>
          <div className="w-px h-2.5 bg-slate-600" />
        </div>
      );
    }
    return ticks;
  };

  // Scrubbing & Seeking by clicking or dragging the ruler
  const handleRulerSeek = (e: React.MouseEvent | React.PointerEvent) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = Math.max(0, Math.min(duration, clickX / zoomLevel));
    setCurrentTime(Number(newTime.toFixed(2)));
  };

  const handlePointerDownRuler = (e: React.PointerEvent) => {
    setIsScrubbing(true);
    handleRulerSeek(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveRuler = (e: React.PointerEvent) => {
    if (!isScrubbing) return;
    handleRulerSeek(e);
  };

  const handlePointerUpRuler = (e: React.PointerEvent) => {
    setIsScrubbing(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const playheadPositionPx = currentTime * zoomLevel;

  return (
    <div className="flex flex-col h-full bg-slate-950 select-none">
      {/* Top Timeline Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-t border-b border-slate-800 text-xs">
        {/* Left Edit Action Tools */}
        <div className="flex items-center gap-1.5">
          {/* Split (S) */}
          <button
            onClick={() => splitClipAtPlayhead()}
            title="Split Clip at Playhead (S)"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-200 rounded-md border border-slate-700 transition-colors font-medium"
          >
            <Scissors className="w-3.5 h-3.5 text-sky-400" />
            <span>Split (S)</span>
          </button>

          {/* Duplicate (Ctrl+D) */}
          <button
            disabled={!selectedClipId}
            onClick={() => selectedClipId && duplicateClip(selectedClipId)}
            title="Duplicate Selected Clip"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 rounded-md border border-slate-700 transition-colors font-medium"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-400" />
            <span>Duplicate</span>
          </button>

          {/* Delete (Del) */}
          <button
            disabled={!selectedClipId}
            onClick={() => selectedClipId && removeClip(selectedClipId)}
            title="Delete Selected Clip (Del)"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-red-950 hover:text-red-300 disabled:opacity-40 text-slate-200 rounded-md border border-slate-700 transition-colors font-medium"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Delete</span>
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-slate-700 mx-1" />

          {/* Undo / Redo */}
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded border border-slate-700"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded border border-slate-700"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          {/* Snapping */}
          <button
            onClick={() => setSnappingEnabled(!snappingEnabled)}
            title="Toggle Timeline Magnetic Snapping"
            className={`p-1.5 rounded border transition-colors ${
              snappingEnabled
                ? "bg-sky-500/20 text-sky-400 border-sky-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Tools (Add Track & Zoom Slider) */}
        <div className="flex items-center gap-3">
          {/* Add Track Dropdown */}
          <div className="relative">
            <button
              onClick={() => setAddTrackDropdownOpen(!addTrackDropdownOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md font-medium transition-colors shadow-sm shadow-sky-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Track</span>
            </button>

            {addTrackDropdownOpen && (
              <div className="absolute right-0 top-8 w-44 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-xs">
                <button
                  onClick={() => {
                    addTrack("main", "Video Track");
                    setAddTrackDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  + Video / Image Track
                </button>
                <button
                  onClick={() => {
                    addTrack("audio", "Audio Track");
                    setAddTrackDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  + Audio / Music Track
                </button>
                <button
                  onClick={() => {
                    addTrack("text", "Text Track");
                    setAddTrackDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  + Text / Title Track
                </button>
                <button
                  onClick={() => {
                    addTrack("subtitle", "Subtitle Track");
                    setAddTrackDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  + Subtitle Track
                </button>
              </div>
            )}
          </div>

          {/* Timeline Zoom Slider */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md">
            <ZoomOut
              onClick={() => setZoomLevel((z) => Math.max(15, z - 10))}
              className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200 cursor-pointer"
            />
            <input
              type="range"
              min={15}
              max={120}
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <ZoomIn
              onClick={() => setZoomLevel((z) => Math.min(120, z + 10))}
              className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Tracks & Playhead Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-auto relative bg-slate-950 custom-scrollbar"
      >
        <div style={{ minWidth: `${totalWidthPx + 224}px` }} className="relative flex flex-col">
          {/* Top Time Ruler Header */}
          <div className="flex items-stretch h-7 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-30">
            {/* Header placeholder on left aligned with track headers */}
            <div className="w-56 shrink-0 bg-slate-900 border-r border-slate-800 flex items-center px-3 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              Tracks ({project.tracks.length})
            </div>

            {/* Time ruler runway */}
            <div
              ref={rulerRef}
              onPointerDown={handlePointerDownRuler}
              onPointerMove={handlePointerMoveRuler}
              onPointerUp={handlePointerUpRuler}
              className="flex-1 relative h-full cursor-pointer bg-slate-900/80 hover:bg-slate-900"
            >
              {renderRulerTicks()}
            </div>
          </div>

          {/* Draggable Red Playhead Line */}
          <div
            style={{
              left: `${224 + playheadPositionPx}px`,
            }}
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-40 pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.8)]"
          >
            {/* Red Playhead Head Diamond */}
            <div className="w-3.5 h-3.5 bg-rose-500 -ml-[6px] top-0 rotate-45 border border-white shadow-md" />
          </div>

          {/* Render All Project Tracks */}
          <div className="flex flex-col">
            {project.tracks.map((track, idx) => (
              <TimelineTrack key={track.id} track={track} trackIndex={idx} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
