import React from "react";
import { Check, CloudCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AutoSaveToastProps {
  /**
   * Whether the toast is visible.
   */
  visible: boolean;
  /**
   * The project name or saved timestamp.
   */
  projectName?: string;
  /**
   * Optional custom message.
   */
  message?: string;
}

/**
 * Subtle, non-intrusive toast notification component confirming when
 * the editor has successfully performed an auto-save operation.
 */
export const AutoSaveToast: React.FC<AutoSaveToastProps> = ({
  visible,
  projectName,
  message = "Auto-saved to cloud",
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 pointer-events-none select-none flex items-center gap-2.5 px-3.5 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl shadow-black/40 text-xs font-medium text-slate-200"
        >
          {/* Subtle pulsating status beacon */}
          <div className="relative flex items-center justify-center w-5 h-5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Check className="w-3 h-3 stroke-[2.5]" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>

          {/* Text labels */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-100 font-semibold">{message}</span>
            {projectName && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 max-w-[140px] truncate text-[11px]">
                  {projectName}
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
