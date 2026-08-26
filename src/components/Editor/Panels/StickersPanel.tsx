import React from "react";
import { Smile, Plus, Flame, Heart, Bell, ThumbsUp, Sparkles, CheckCircle2 } from "lucide-react";
import { useEditor } from "../../../context/EditorContext";

interface StickerItem {
  id: string;
  name: string;
  emoji?: string;
  text?: string;
  bg?: string;
  textColor?: string;
}

const STICKERS: StickerItem[] = [
  { id: "stk_sub", name: "Subscribe Button", text: "🔔 SUBSCRIBE", bg: "#dc2626", textColor: "#ffffff" },
  { id: "stk_like", name: "Like & Share", text: "👍 LIKE & SHARE", bg: "#2563eb", textColor: "#ffffff" },
  { id: "stk_follow", name: "Follow for More", text: "⚡ FOLLOW FOR PART 2", bg: "#9333ea", textColor: "#ffffff" },
  { id: "stk_verified", name: "Verified Creator", text: "✓ VERIFIED", bg: "#0284c7", textColor: "#ffffff" },
  { id: "stk_fire", name: "Fire Emoji", emoji: "🔥" },
  { id: "stk_mindblown", name: "Mindblown Emoji", emoji: "🤯" },
  { id: "stk_100", name: "100 Points", emoji: "💯" },
  { id: "stk_rocket", name: "Rocket Launch", emoji: "🚀" },
  { id: "stk_eyes", name: "Look Eyes", emoji: "👀" },
  { id: "stk_warn", name: "Warning Sign", emoji: "⚠️" },
  { id: "stk_crown", name: "Crown", emoji: "👑" },
  { id: "stk_money", name: "Money Bag", emoji: "💰" },
];

export const StickersPanel: React.FC = () => {
  const { addClipToTrack, project, currentTime } = useEditor();

  const handleAddSticker = (sticker: StickerItem) => {
    let overlayTrack = project.tracks.find((t) => t.type === "text" || t.type === "overlay");
    if (!overlayTrack) overlayTrack = project.tracks[0];
    if (!overlayTrack) return;

    if (sticker.emoji) {
      addClipToTrack(overlayTrack.id, {
        type: "sticker",
        name: `${sticker.emoji} Sticker`,
        stickerEmoji: sticker.emoji,
        startTime: currentTime,
        duration: 3.0,
        scale: 1.2,
        textProps: {
          text: sticker.emoji,
          fontSize: 64,
          fontWeight: "normal",
          color: "#ffffff",
          animation: "bounce",
        },
      });
    } else {
      addClipToTrack(overlayTrack.id, {
        type: "text",
        name: sticker.name,
        startTime: currentTime,
        duration: 3.5,
        scale: 1,
        textProps: {
          text: sticker.text || "",
          fontSize: 32,
          fontWeight: "800",
          color: sticker.textColor || "#ffffff",
          backgroundColor: sticker.bg || "#ef4444",
          animation: "pop",
        },
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 select-none p-3 overflow-y-auto custom-scrollbar text-xs">
      <div className="mb-3">
        <h3 className="font-semibold text-slate-200 text-sm">Stickers & Viral Badges</h3>
        <p className="text-slate-400 text-[11px]">
          Add call-to-actions, emoji overlays, and engagement badges to your video.
        </p>
      </div>

      <div className="space-y-4">
        {/* Badges Section */}
        <div>
          <h4 className="font-semibold text-slate-300 mb-2">Call To Action Badges</h4>
          <div className="space-y-2">
            {STICKERS.filter((s) => s.text).map((stk) => (
              <div
                key={stk.id}
                onClick={() => handleAddSticker(stk)}
                className="p-2.5 bg-slate-950 border border-slate-800 hover:border-purple-500/60 rounded-lg cursor-pointer transition-all flex items-center justify-between group"
              >
                <div
                  style={{ backgroundColor: stk.bg, color: stk.textColor }}
                  className="px-3 py-1 rounded font-bold text-xs tracking-wide shadow"
                >
                  {stk.text}
                </div>
                <button className="flex items-center gap-1 text-[11px] text-purple-400 group-hover:text-purple-300 font-medium">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Emojis Grid */}
        <div>
          <h4 className="font-semibold text-slate-300 mb-2">Animated Reaction Emojis</h4>
          <div className="grid grid-cols-4 gap-2">
            {STICKERS.filter((s) => s.emoji).map((stk) => (
              <button
                key={stk.id}
                onClick={() => handleAddSticker(stk)}
                className="aspect-square bg-slate-950 border border-slate-800 hover:border-purple-500 hover:scale-105 rounded-xl flex items-center justify-center text-2xl transition-all shadow"
                title={stk.name}
              >
                {stk.emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
