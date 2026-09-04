import { useEffect } from "react";
import { useEditor } from "../context/EditorContext";

interface UseKeyboardShortcutsOptions {
  /**
   * Optionally disable keyboard shortcuts listener (e.g. when modal or modal overlay is capturing input).
   */
  enabled?: boolean;
}

/**
 * Custom React hook that registers standard timeline & editor keyboard shortcuts:
 * - Space: Toggle Play / Pause playback
 * - Ctrl+Z / ⌘+Z: Undo last edit
 * - Ctrl+Shift+Z / ⌘+Shift+Z or Ctrl+Y / ⌘+Y: Redo last edit
 * - Delete / Backspace: Remove selected timeline clip
 * - S: Split clip at current playhead
 * - Ctrl+D / ⌘+D: Duplicate selected clip
 * - Ctrl+E / ⌘+E: Open export modal
 * - Ctrl+Shift+K / ⌘+Shift+K or ?: Open Keyboard Shortcuts Help modal
 * - Ctrl+K / ⌘+K: Open AI copilot
 * - Escape: Deselect current clip
 * - ArrowLeft / ArrowRight: Step 1 frame (or Shift for 1 sec) backward/forward
 * - Home or Digit0 (when not in input): Jump to start of timeline
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true } = options;

  const {
    togglePlayPause,
    undo,
    redo,
    selectedClipId,
    removeClip,
    splitClipAtPlayhead,
    duplicateClip,
    setSelectedClipId,
    setExportModalOpen,
    shortcutsModalOpen,
    setShortcutsModalOpen,
    setAiCopilotOpen,
    setCurrentTime,
    project,
    showSafeZone,
    setShowSafeZone,
  } = useEditor();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger editor shortcuts when the user is typing in form inputs, textareas, contenteditable elements, or selects
      const target = e.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          tagName === "SELECT" ||
          target.isContentEditable ||
          target.closest("[contenteditable='true']")
        ) {
          return;
        }
      }

      const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // 1. Space: Play / Pause
      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
        return;
      }

      // 2. Undo / Redo:
      // Ctrl+Z or ⌘+Z -> Undo
      // Ctrl+Shift+Z or ⌘+Shift+Z or Ctrl+Y / ⌘+Y -> Redo
      if (isCmdOrCtrl && (e.code === "KeyZ" || e.code === "KeyY")) {
        if (e.code === "KeyY" || e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
        return;
      }

      // 3. Delete / Backspace: Remove selected clip
      if (e.code === "Delete" || e.code === "Backspace") {
        if (selectedClipId) {
          e.preventDefault();
          removeClip(selectedClipId);
        }
        return;
      }

      // 4. S: Split selected clip at playhead
      if (e.code === "KeyS" && !isCmdOrCtrl && !e.altKey) {
        e.preventDefault();
        splitClipAtPlayhead();
        return;
      }

      // 5. Ctrl+D / ⌘+D: Duplicate selected clip
      if (isCmdOrCtrl && e.code === "KeyD") {
        if (selectedClipId) {
          e.preventDefault();
          duplicateClip(selectedClipId);
        }
        return;
      }

      // 6. Ctrl+E / ⌘+E: Export Video Modal
      if (isCmdOrCtrl && e.code === "KeyE") {
        e.preventDefault();
        setExportModalOpen(true);
        return;
      }

      // 7. Ctrl+Shift+K / ⌘+Shift+K or Shift+/ (?): Keyboard Shortcuts Help Modal
      if ((isCmdOrCtrl && e.shiftKey && e.code === "KeyK") || (!isCmdOrCtrl && !e.altKey && e.key === "?")) {
        e.preventDefault();
        setShortcutsModalOpen(!shortcutsModalOpen);
        return;
      }

      // 8. Ctrl+K / ⌘+K: AI Copilot
      if (isCmdOrCtrl && e.code === "KeyK") {
        e.preventDefault();
        setAiCopilotOpen(true);
        return;
      }

      // 9. Escape: Close open modals or deselect current clip
      if (e.code === "Escape") {
        if (shortcutsModalOpen) {
          setShortcutsModalOpen(false);
          return;
        }
        setSelectedClipId(null);
        return;
      }

      // 9. Arrow Left / Right: Frame/Second Stepping
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        const step = e.shiftKey ? 1.0 : 1 / (project.settings.fps || 30);
        setCurrentTime((prev) => Math.max(0, prev - step));
        return;
      }

      if (e.code === "ArrowRight") {
        e.preventDefault();
        const duration = project.settings.duration || 15;
        const step = e.shiftKey ? 1.0 : 1 / (project.settings.fps || 30);
        setCurrentTime((prev) => Math.min(duration, prev + step));
        return;
      }

      // 10. Home or 0: Return to start of timeline
      if ((e.code === "Home" || e.code === "Digit0") && !isCmdOrCtrl && !e.altKey) {
        e.preventDefault();
        setCurrentTime(0);
        return;
      }

      // 11. G: Toggle Safe Zone Grid
      if (e.code === "KeyG" && !isCmdOrCtrl && !e.altKey) {
        e.preventDefault();
        setShowSafeZone(!showSafeZone);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    togglePlayPause,
    undo,
    redo,
    selectedClipId,
    removeClip,
    splitClipAtPlayhead,
    duplicateClip,
    setSelectedClipId,
    setExportModalOpen,
    shortcutsModalOpen,
    setShortcutsModalOpen,
    setAiCopilotOpen,
    setCurrentTime,
    project.settings.fps,
    project.settings.duration,
    showSafeZone,
    setShowSafeZone,
  ]);
}
