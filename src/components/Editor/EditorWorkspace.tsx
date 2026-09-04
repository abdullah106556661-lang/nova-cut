import React from "react";
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
import { AutoSaveToast } from "./AutoSaveToast";

import { useEditor } from "../../context/EditorContext";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

export const EditorWorkspace: React.FC = () => {
  const { activePanel, isAutoSaved, project } = useEditor();

  // Register standard timeline keyboard shortcuts (Ctrl+Z undo, Space play/pause, Delete remove selected clip, etc.)
  useKeyboardShortcuts();

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

      {/* Modals & Floating Overlays */}
      <ExportModal />
      <ShortcutsModal />
      <MediaRecorderModal />
      <AuthModal />

      {/* Subtle Auto-Save Toast Notification */}
      <AutoSaveToast visible={isAutoSaved} projectName={project.name} />
    </div>
  );
};
