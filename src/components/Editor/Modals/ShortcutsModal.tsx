import React from "react";
import { X, Keyboard, Command } from "lucide-react";
import { useEditor } from "../../../context/EditorContext";

interface ShortcutGroup {
  category: string;
  items: { key: string; description: string }[];
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    category: "Playback & Navigation",
    items: [
      { key: "Space", description: "Play / Pause playback" },
      { key: "← / →", description: "Step 1 frame backward / forward" },
      { key: "Shift + ← / →", description: "Jump 1 second backward / forward" },
      { key: "Home / 0", description: "Return to beginning of timeline" },
    ],
  },
  {
    category: "Timeline Editing",
    items: [
      { key: "S", description: "Split selected clip at current playhead" },
      { key: "Del / Backspace", description: "Delete selected clip" },
      { key: "Ctrl / ⌘ + D", description: "Duplicate selected clip" },
      { key: "Ctrl / ⌘ + Z", description: "Undo last edit action" },
      { key: "Ctrl / ⌘ + Shift + Z", description: "Redo last edit action" },
      { key: "Esc", description: "Deselect active clip" },
    ],
  },
  {
    category: "Help & Discovery",
    items: [
      { key: "Ctrl / ⌘ + Shift + K", description: "Open Keyboard Shortcuts Help" },
      { key: "?", description: "Quick Help (when not typing in inputs)" },
    ],
  },
  {
    category: "Tools & Panels",
    items: [
      { key: "Ctrl / ⌘ + E", description: "Open Export Video Modal" },
      { key: "Ctrl / ⌘ + K", description: "Open AI Director Copilot" },
      { key: "G", description: "Toggle Safe Zone grid overlay" },
      { key: "M", description: "Add timeline marker point" },
    ],
  },
];

export const ShortcutsModal: React.FC = () => {
  const { shortcutsModalOpen, setShortcutsModalOpen } = useEditor();

  if (!shortcutsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Keyboard Shortcuts Cheat Sheet
            </h3>
          </div>
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs max-h-[70vh] overflow-y-auto custom-scrollbar">
          {SHORTCUTS.map((group) => (
            <div key={group.category} className="space-y-2">
              <h4 className="font-bold text-sky-400 uppercase tracking-wider text-[11px]">
                {group.category}
              </h4>
              <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                {group.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1">
                    <span className="text-slate-300">{item.description}</span>
                    <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[11px] rounded font-semibold shadow-inner">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
