import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  ArrowLeft,
  AlertTriangle,
  LogIn,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useEditor } from "../../context/EditorContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "superadmin" | "user";
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = "admin",
}) => {
  const { user, isAuthenticated, isAdmin, isSuperAdmin, setAuthModalOpen, setAuthInitialTab } = useAuth();
  const { setActiveTab } = useEditor();

  const isAccessGranted =
    isAuthenticated &&
    (isSuperAdmin || isAdmin || (requiredRole === "user" && isAuthenticated));

  // If access is granted, render protected route content
  if (isAccessGranted) {
    return <>{children}</>;
  }

  // If not authenticated or unverified role, render the High-Security Gatekeeper
  return (
    <div className="min-h-[85vh] bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-lg bg-slate-900/90 border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950/40 relative overflow-hidden backdrop-blur-xl">
        {/* Top security beacon */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-rose-600 animate-pulse" />

        {/* Security Shield Icon Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 shadow-inner shrink-0">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/60 uppercase tracking-widest">
                403 Restricted
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Administrator Clearance Required
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Admin Console Access
            </h1>
          </div>
        </div>

        {/* Informative Warning */}
        <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
          This portal is reserved exclusively for authenticated system administrators with verified server privileges.
        </p>

        {/* Status Box */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 mb-6 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Current Session:</span>
            <span className="font-mono font-semibold text-slate-200">
              {user?.email || "Guest / Unauthenticated"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Account Role:</span>
            <span className="font-mono font-semibold text-amber-400">
              {user?.role || "Standard"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Security Clearance:</span>
            <span className="font-mono font-bold text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              RESTRICTED
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab("dashboard")}
            className="w-full sm:w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>

          <button
            onClick={() => {
              setAuthInitialTab("login");
              setAuthModalOpen(true);
            }}
            className="w-full sm:w-1/2 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-sky-600/20 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Admin Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
