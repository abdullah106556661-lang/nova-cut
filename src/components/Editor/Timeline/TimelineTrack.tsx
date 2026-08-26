import React from "react";
import {
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Video,
  Music,
  Type,
  Subtitles,
  Sparkles,
  Smile,
  Trash2,
  Layers,
} from "lucide-react";
import { TimelineTrack as TrackType } from "../../../types/editor";
import { useEditor } from "../../../context/EditorContext";
import { TimelineClip } from "./TimelineClip";

interface TimelineTrackProps {
  track: TrackType;
  trackIndex: number;
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({ track }) => {
  const {
    updateTrack,
    removeTrack,
    selectedTrackId,
    setSelectedTrackId,
    project,
    zoomLevel,
  } = useEditor();

  const isSelected = selectedTrackId === track.id;

  const getTrackIcon = () => {
    switch (track.type) {
      case "main":
      case "overlay":
        return <Video className="w-3.5 h-3.5 text-indigo-400" />;
      case "audio":
        return <Music className="w-3.5 h-3.5 text-emerald-400" />;
      case "text":
        return <Type className="w-3.5 h-3.5 text-amber-400" />;
      case "subtitle":
        return <Subtitles className="w-3.5 h-3.5 text-rose-400" />;
      case "effect":
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const totalWidthPx = Math.max(1200, (project.settings.duration + 5) * zoomLevel);

  return (
    <div
      onClick={() => setSelectedTrackId(track.id)}
      className={`flex items-stretch border-b border-slate-800/80 transition-colors h-14 ${
        isSelected ? "bg-slate-900/90" : "bg-slate-950/70 hover:bg-slate-900/40"
      }`}
    >
      {/* Left Track Header Controls */}
      <div className="w-56 shrink-0 border-r border-slate-800/90 flex items-center justify-between px-3 bg-slate-900/95 z-10 select-none">
        <div className="flex items-center gap-2 overflow-hidden">
          {getTrackIcon()}
          <span className="text-xs font-semibold text-slate-300 truncate">
            {track.name}
          </span>
        </div>

        {/* Quick Toggles: Lock, Mute, Hide */}
        <div className="flex items-center gap-1">
          {/* Mute */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateTrack(track.id, { isMuted: !track.isMuted });
            }}
            title={track.isMuted ? "Unmute Track" : "Mute Track"}
            className={`p-1 rounded transition-colors ${
              track.isMuted
                ? "text-red-400 bg-red-950/50"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {track.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Hide */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateTrack(track.id, { isHidden: !track.isHidden });
            }}
            title={track.isHidden ? "Show Track" : "Hide Track"}
            className={`p-1 rounded transition-colors ${
              track.isHidden
                ? "text-amber-400 bg-amber-950/50"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {track.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

          {/* Lock */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateTrack(track.id, { isLocked: !track.isLocked });
            }}
            title={track.isLocked ? "Unlock Track" : "Lock Track"}
            className={`p-1 rounded transition-colors ${
              track.isLocked
                ? "text-amber-400 bg-amber-950/50"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {track.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>

          {/* Delete Track (if more than 1 track) */}
          {project.tracks.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTrack(track.id);
              }}
              title="Delete Track"
              className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Clips Runway */}
      <div
        className="flex-1 relative overflow-hidden bg-slate-950/50"
        style={{ width: `${totalWidthPx}px` }}
      >
        {/* Render Clips */}
        {track.clips.map((clip) => (
          <TimelineClip
            key={clip.id}
            clip={clip}
            trackType={track.type}
            isLocked={track.isLocked}
          />
        ))}
      </div>
    </div>
  );
};
