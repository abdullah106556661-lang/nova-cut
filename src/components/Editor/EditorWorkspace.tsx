import React, { useEffect } from "react";
import { EditorHeader } from "./Header/EditorHeader";
import { EditorSidebar } from "./Sidebar/EditorSidebar";
import { PreviewCanvas } from "./PreviewCanvas";
import { InspectorPanel } from "./Panels/InspectorPanel";
import { TimelineContainer } from "./Timeline/TimelineContainer";

// Panels
import { MediaPanel } from "./Panels/MediaPanel";
import { AudioPanel } from "./Panels/AudioPanel";
import { TextPanel } from "./Panels/TextPanel";
import { StickersPanel } from "./Panels/StickersPanel";
import { EffectsPanel } from "./Panels/EffectsPanel";
import { TransitionsPanel } from "./Panels/TransitionsPanel";
import { CaptionsPanel } from "./Panels/CaptionsPanel";
import { AIToolsPanel } from "./Panels/AIToolsPanel";
import { TemplatesPanel } from "./Panels/TemplatesPanel";

// Modals
import { ExportModal } from "./Modals/ExportModal";
import { ShortcutsModal } from "./Modals/ShortcutsModal";
import { MediaRecorderModal } from "./Modals/MediaRecorderModal";
import { AuthModal } from "./Modals/AuthModal";

import { useEditor } from "../../context/EditorContext";

export const EditorWorkspace: React.FC = () => {
  const {
    activePanel,
    togglePlayPause,
    splitClipAtPlayhead,
    removeClip,
    selectedClipId,
    undo,
    redo,
    setSelectedClipId,
    setExportModalOpen,
  } = useEditor();

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys when typing in input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === "KeyS" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        splitClipAtPlayhead();
      } else if (e.code === "Delete" || e.code === "Backspace") {
        if (selectedClipId) {
          e.preventDefault();
          removeClip(selectedClipId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.code === "KeyE") {
        e.preventDefault();
        setExportModalOpen(true);
      } else if (e.code === "Escape") {
        setSelectedClipId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    togglePlayPause,
    splitClipAtPlayhead,
    removeClip,
    selectedClipId,
    undo,
    redo,
    setSelectedClipId,
    setExportModalOpen,
  ]);

  // Render the selected left panel
  const renderActivePanel = () => {
    switch (activePanel) {
      case "media":
        return <MediaPanel />;
      case "audio":
        return <AudioPanel />;
      case "text":
        return <TextPanel />;
      case "stickers":
        return <StickersPanel />;
      case "effects":
        return <EffectsPanel />;
      case "transitions":
        return <TransitionsPanel />;
      case "captions":
        return <CaptionsPanel />;
      case "ai":
        return <AIToolsPanel />;
      case "templates":
        return <TemplatesPanel />;
      default:
        return <MediaPanel />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation Header */}
      <EditorHeader />

      {/* Main Studio Middle Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Leftmost Navigation Tab Strip */}
        <EditorSidebar />

        {/* Active Tool / Asset Panel */}
        <div className="w-80 bg-slate-900 border-r border-slate-800/90 flex flex-col shrink-0 overflow-hidden">
          {renderActivePanel()}
        </div>

        {/* Central Stage: Preview Canvas + Right Inspector */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {/* Upper Section: Canvas on Left + Inspector on Right */}
          <div className="flex-1 flex overflow-hidden min-h-[320px]">
            {/* Live Video Preview Canvas */}
            <div className="flex-1 relative flex flex-col overflow-hidden">
              <PreviewCanvas />
            </div>

            {/* Properties Inspector Panel */}
            <InspectorPanel />
          </div>

          {/* Bottom Section: Multi-Track Timeline */}
          <div className="h-64 border-t border-slate-800 shrink-0 flex flex-col overflow-hidden shadow-2xl">
            <TimelineContainer />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ExportModal />
      <ShortcutsModal />
      <MediaRecorderModal />
      <AuthModal />
    </div>
  );
};
