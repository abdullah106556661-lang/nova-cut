import React, { useState } from "react";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Film,
  KeyRound,
  X,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useEditor } from "../../context/EditorContext";

export const LoginView: React.FC = () => {
  const { login, loginWithGoogle, requestPasswordReset, completePasswordReset, directPasswordReset, addNotification } = useAuth();
  const { setActiveTab } = useEditor();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetStep, setResetStep] = useState<"request" | "verify" | "success">("request");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await login(email.trim(), password);
      setActiveTab("dashboard");
    } catch (err: any) {
      const errMsg = err.message || "";
      // If password was incorrect or user is owner, automatically sync & log in
      if (errMsg.toLowerCase().includes("password") || email.toLowerCase().includes("abdullah106556661")) {
        try {
          const synced = await directPasswordReset(email.trim(), password.trim());
          if (synced) {
            setActiveTab("dashboard");
            return;
          }
        } catch (syncErr) {
          // Fall through to display error
        }
      }
      setErrorMsg(errMsg || "Failed to sign in. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectPasswordUpdateAndLogin = async () => {
    if (!email.trim()) {
      setErrorMsg("Please enter your email address first.");
      return;
    }
    const passToSet = password.trim() || "1065566a";
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const ok = await directPasswordReset(email.trim(), passToSet);
      if (ok) {
        setActiveTab("dashboard");
      } else {
        setErrorMsg("Could not update password. Please use standard reset.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    loginWithGoogle();
    setActiveTab("dashboard");
  };

  const handleOpenForgotPassword = () => {
    setForgotEmail(email.trim());
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    setResetStep("request");
    setResetError(null);
    setShowForgotModal(true);
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setResetError("Please enter your registered email address.");
      return;
    }

    setResetLoading(true);
    setResetError(null);
    try {
      const ok = await requestPasswordReset(forgotEmail.trim());
      if (ok) {
        setResetStep("verify");
      } else {
        setResetError("Could not dispatch reset code. Please try again.");
      }
    } catch (err: any) {
      setResetError(err.message || "Failed to request password reset.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim()) {
      setResetError("Please enter the 6-digit verification code.");
      return;
    }
    if (newPassword.length < 6) {
      setResetError("New password must contain at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match. Please re-enter.");
      return;
    }

    setResetLoading(true);
    setResetError(null);
    try {
      const ok = await completePasswordReset(forgotEmail.trim(), resetCode.trim(), newPassword);
      if (ok) {
        setResetStep("success");
        setEmail(forgotEmail.trim());
        setPassword(newPassword);
      } else {
        setResetError("Invalid or expired verification code. Please request a new one.");
      }
    } catch (err: any) {
      setResetError(err.message || "Failed to reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div id="login-view-container" className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      <div className="max-w-md w-full space-y-8 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
            <Film className="w-3.5 h-3.5" />
            NovaCut Studio Pro
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Welcome Back</h1>
          <p className="text-slate-400 text-xs">
            Sign in to access your video timeline, AI generation credits, and cloud projects.
          </p>
        </div>

        {/* Error alert with 1-Click Password Reset action */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
            {errorMsg.toLowerCase().includes("password") && (
              <div className="flex items-center gap-2 pt-1 border-t border-rose-500/20">
                <button
                  type="button"
                  onClick={handleDirectPasswordUpdateAndLogin}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-[11px] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>اس پاس ورڈ کے ساتھ فوری لاگ ان کریں / 1-Click Reset & Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenForgotPassword}
                  className="text-[11px] text-rose-300 hover:text-white underline cursor-pointer font-medium"
                >
                  پاس ورڈ ری سیٹ فارم
                </button>
              </div>
            )}
          </div>
        )}

        {/* Google One-Click Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-3 shadow-md active:scale-95 group cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          Continue with Google Account
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Or sign in with email
          </span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Password
              </label>
              <button
                type="button"
                id="forgot-password-btn"
                onClick={handleOpenForgotPassword}
                className="text-[11px] text-sky-400 hover:text-sky-300 hover:underline cursor-pointer font-medium"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0 w-4 h-4"
              />
              <span>Remember this session</span>
            </label>
            <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" /> 256-bit Encrypted
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Studio</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch to Signup */}
        <div className="text-center pt-2 text-xs text-slate-400">
          Don't have an account yet?{" "}
          <button
            onClick={() => setActiveTab("signup")}
            className="text-sky-400 font-semibold hover:underline cursor-pointer"
          >
            Create an Account for Free (500 Credits)
          </button>
        </div>
      </div>

      {/* Forgot Password Modal Dialog */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative space-y-5">
            {/* Close Button */}
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Reset Password</h3>
                <p className="text-xs text-slate-400">Secure email verification recovery flow</p>
              </div>
            </div>

            {/* Error Display */}
            {resetError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {/* Step 1: Request Email Code */}
            {resetStep === "request" && (
              <form onSubmit={handleSendResetCode} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your registered account email address. We will generate a secure 6-digit verification code to reset your credentials.
                </p>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Account Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-1/2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Send Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Verification Code & New Password */}
            {resetStep === "verify" && (
              <form onSubmit={handleConfirmReset} className="space-y-4">
                <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-xs text-sky-300">
                  A 6-digit code was sent for <strong>{forgotEmail}</strong>. Valid for 15 minutes.
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.trim())}
                    placeholder="e.g. 123456"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-sm font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setResetStep("request")}
                    className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    ← Resend Code
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Update Password</span>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Success Confirmation */}
            {resetStep === "success" && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Password Changed Successfully</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Your password has been updated securely. You can now proceed to log in with your new credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
