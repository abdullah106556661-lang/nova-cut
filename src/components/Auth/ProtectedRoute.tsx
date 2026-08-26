import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  ArrowLeft,
  AlertTriangle,
  LogIn,
  CheckCircle2,
  Cpu,
  Fingerprint,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useEditor } from "../../context/EditorContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "superadmin" | "user";
}

const VALID_ADMIN_PASSCODES = [
  "NovaCutAdmin2026!",
  "novacutadmin2026!",
  "AdminMaster2026!",
];

const AUTHORIZED_EMAILS = [
  "abdullah106556661@gmail.com",
  "admin@novacut.internal",
  "director@novacut.studio",
];

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = "admin",
}) => {
  const { user, isAuthenticated, setAuthModalOpen, setAuthInitialTab } = useAuth();
  const { setActiveTab } = useEditor();

  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);
  const [isPasscodeUnlocked, setIsPasscodeUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem("novacut_admin_token_valid") === "true";
    } catch {
      return false;
    }
  });

  // Check if current user is an authorized admin
  const isEmailAdmin =
    user?.email && AUTHORIZED_EMAILS.includes(user.email.toLowerCase().trim());
  const isRoleAdmin =
    user?.role === "SuperAdmin" ||
    user?.role === "admin";

  const isAccessGranted =
    isPasscodeUnlocked || (isAuthenticated && (isEmailAdmin || isRoleAdmin));

  const verifyPasscode = (code: string) => {
    const clean = code.trim();
    const isMatch = VALID_ADMIN_PASSCODES.some(
      (p) => p.toLowerCase() === clean.toLowerCase()
    );

    if (isMatch) {
      setIsPasscodeUnlocked(true);
      setPasscodeError(false);
      try {
        sessionStorage.setItem("novacut_admin_token_valid", "true");
      } catch {
        // ignore
      }
      return true;
    } else {
      setPasscodeError(true);
      setTimeout(() => setPasscodeError(false), 3000);
      return false;
    }
  };

  const handlePasscodeUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    verifyPasscode(passcodeInput);
  };

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
          This portal is reserved exclusively for the system administrator.
          Unauthorized users cannot access or administer platform settings.
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

        {/* Admin Credential Passcode Unlock */}
        <form onSubmit={handlePasscodeUnlock} className="space-y-3 mb-6">
          <label className="block text-xs font-semibold text-slate-300">
            Admin Master 2FA Key
          </label>

          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              placeholder="Enter Master Security Key..."
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              className={`w-full bg-slate-950 border ${
                passcodeError
                  ? "border-red-500 ring-1 ring-red-500"
                  : "border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              } rounded-xl pl-10 pr-24 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-mono transition-all`}
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <Unlock className="w-3 h-3" />
              <span>Verify</span>
            </button>
          </div>

          {passcodeError && (
            <p className="text-[11px] text-red-400 font-medium flex items-center gap-1 animate-shake">
              <AlertTriangle className="w-3.5 h-3.5" />
              Invalid security passcode. Access denied.
            </p>
          )}
        </form>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab("dashboard")}
            className="w-full sm:w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Studio</span>
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
