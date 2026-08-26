import React, { useState } from "react";
import {
  Video,
  Music,
  Type,
  Sparkles,
  Smile,
  Subtitles,
  Trash2,
  Copy,
  Scissors,
} from "lucide-react";
import { TimelineClip as ClipType } from "../../../types/editor";
import { useEditor } from "../../../context/EditorContext";

interface TimelineClipProps {
  clip: ClipType;
  trackType: string;
  isLocked: boolean;
}

export const TimelineClip: React.FC<TimelineClipProps> = ({ clip, isLocked }) => {
  const {
    selectedClipId,
    setSelectedClipId,
    zoomLevel,
    updateClip,
    removeClip,
    duplicateClip,
    splitClipAtPlayhead,
  } = useEditor();

  const isSelected = selectedClipId === clip.id;
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [initialStartTime, setInitialStartTime] = useState<number>(0);
  const [resizingEdge, setResizingEdge] = useState<"left" | "right" | null>(null);

  // Styling based on clip type
  const getClipTypeStyle = () => {
    switch (clip.type) {
      case "video":
      case "image":
        return {
          bg: "bg-indigo-950/80 border-indigo-500/60",
          selectedBg: "bg-indigo-900 border-indigo-400 ring-2 ring-indigo-400/50",
          icon: <Video className="w-3 h-3 text-indigo-300" />,
          accent: "text-indigo-200",
        };
      case "audio":
        return {
          bg: "bg-emerald-950/80 border-emerald-500/60",
          selectedBg: "bg-emerald-900 border-emerald-400 ring-2 ring-emerald-400/50",
          icon: <Music className="w-3 h-3 text-emerald-300" />,
          accent: "text-emerald-200",
        };
      case "text":
        return {
          bg: "bg-amber-950/80 border-amber-500/60",
          selectedBg: "bg-amber-900 border-amber-400 ring-2 ring-amber-400/50",
          icon: <Type className="w-3 h-3 text-amber-300" />,
          accent: "text-amber-200",
        };
      case "subtitle":
        return {
          bg: "bg-rose-950/80 border-rose-500/60",
          selectedBg: "bg-rose-900 border-rose-400 ring-2 ring-rose-400/50",
          icon: <Subtitles className="w-3 h-3 text-rose-300" />,
          accent: "text-rose-200",
        };
      case "sticker":
        return {
          bg: "bg-purple-950/80 border-purple-500/60",
          selectedBg: "bg-purple-900 border-purple-400 ring-2 ring-purple-400/50",
          icon: <Smile className="w-3 h-3 text-purple-300" />,
          accent: "text-purple-200",
        };
      default:
        return {
          bg: "bg-cyan-950/80 border-cyan-500/60",
          selectedBg: "bg-cyan-900 border-cyan-400 ring-2 ring-cyan-400/50",
          icon: <Sparkles className="w-3 h-3 text-cyan-300" />,
          accent: "text-cyan-200",
        };
    }
  };

  const style = getClipTypeStyle();
  const leftPx = clip.startTime * zoomLevel;
  const widthPx = Math.max(24, clip.duration * zoomLevel);

  // Drag to move clip along track
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isLocked) return;
    e.stopPropagation();
    setSelectedClipId(clip.id);
    setIsDragging(true);
    setDragStartX(e.clientX);
    setInitialStartTime(clip.startTime);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      const deltaTime = deltaX / zoomLevel;
      const newStart = Math.max(0, initialStartTime + deltaTime);
      updateClip(clip.id, { startTime: Number(newStart.toFixed(2)) });
    } else if (resizingEdge) {
      const deltaX = e.clientX - dragStartX;
      const deltaTime = deltaX / zoomLevel;

      if (resizingEdge === "right") {
        const newDuration = Math.max(0.2, clip.duration + deltaTime);
        updateClip(clip.id, { duration: Number(newDuration.toFixed(2)) });
        setDragStartX(e.clientX);
      } else if (resizingEdge === "left") {
        const newStart = Math.max(0, clip.startTime + deltaTime);
        const newDuration = Math.max(0.2, clip.duration - deltaTime);
        updateClip(clip.id, {
          startTime: Number(newStart.toFixed(2)),
          duration: Number(newDuration.toFixed(2)),
          sourceStartTime: Math.max(0, clip.sourceStartTime + deltaTime),
        });
        setDragStartX(e.clientX);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setResizingEdge(null);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Start Trim Left Handle
  const handleLeftTrimDown = (e: React.PointerEvent) => {
    if (isLocked) return;
    e.stopPropagation();
    setResizingEdge("left");
    setDragStartX(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Start Trim Right Handle
  const handleRightTrimDown = (e: React.PointerEvent) => {
    if (isLocked) return;
    e.stopPropagation();
    setResizingEdge("right");
    setDragStartX(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        left: `${leftPx}px`,
        width: `${widthPx}px`,
      }}
      className={`absolute top-1 bottom-1 rounded-md border flex items-center justify-between px-2 cursor-pointer transition-shadow select-none group ${
        isSelected ? style.selectedBg : style.bg
      }`}
    >
      {/* Left Resize / Trim Handle */}
      {!isLocked && (
        <div
          onPointerDown={handleLeftTrimDown}
          title="Trim Start"
          className="absolute left-0 top-0 bottom-0 w-2.5 bg-slate-600/60 hover:bg-sky-400 cursor-ew-resize rounded-l flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="w-0.5 h-3 bg-white rounded-full" />
        </div>
      )}

      {/* Clip Content Label & Thumbnail */}
      <div className="flex items-center gap-1.5 overflow-hidden text-xs">
        {style.icon}
        <span className={`font-semibold truncate ${style.accent}`}>
          {clip.name}
        </span>
        {clip.speed !== 1 && (
          <span className="text-[10px] px-1 py-0.2 bg-black/50 text-sky-300 rounded">
            {clip.speed}x
          </span>
        )}
      </div>

      {/* Keyframe Indicator Dots */}
      {clip.keyframes && clip.keyframes.length > 0 && (
        <div className="flex items-center gap-1">
          {clip.keyframes.map((kf) => (
            <div
              key={kf.id}
              title={`Keyframe at ${kf.time}s`}
              className="w-2 h-2 bg-amber-400 rotate-45 border border-black shadow"
            />
          ))}
        </div>
      )}

      {/* Quick Action Buttons on Hover when selected */}
      {isSelected && !isLocked && (
        <div className="hidden group-hover:flex items-center gap-1 bg-slate-900/90 border border-slate-700 px-1 py-0.5 rounded shadow absolute -top-7 right-0 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              splitClipAtPlayhead(clip.id);
            }}
            title="Split Clip (S)"
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
          >
            <Scissors className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              duplicateClip(clip.id);
            }}
            title="Duplicate Clip (Ctrl+D)"
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeClip(clip.id);
            }}
            title="Delete Clip (Del)"
            className="p-1 hover:bg-red-950 text-red-400 rounded"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Right Resize / Trim Handle */}
      {!isLocked && (
        <div
          onPointerDown={handleRightTrimDown}
          title="Trim End"
          className="absolute right-0 top-0 bottom-0 w-2.5 bg-slate-600/60 hover:bg-sky-400 cursor-ew-resize rounded-r flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="w-0.5 h-3 bg-white rounded-full" />
        </div>
      )}
    </div>
  );
};
