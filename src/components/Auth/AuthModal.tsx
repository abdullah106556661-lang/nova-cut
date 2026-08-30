import React, { useState } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    authInitialTab,
    login,
    signUp,
    loginWithGoogle,
    continueAsGuest,
    requestPasswordReset,
    verifyResetCode,
    completePasswordReset,
    user,
    sendVerificationEmail,
    verifyEmailCode,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"login" | "signup" | "forgot" | "verify" | "jazzcash">("login");

  // Form Fields - Clean state without hardcoded presets
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Forgot password steps: 1 = email, 2 = code, 3 = new pass, 4 = success
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3 | 4>(1);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Verification step
  const [verifyCode, setVerifyCode] = useState("");
  const [verifySuccess, setVerifySuccess] = useState(false);

  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync initial tab when modal opens
  React.useEffect(() => {
    if (authModalOpen) {
      setActiveTab(authInitialTab);
      setError(null);
      setSuccessMsg(null);
      setForgotStep(1);
    }
  }, [authModalOpen, authInitialTab]);

  if (!authModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!email || !password) {
        setError("Please enter your email and password.");
        setLoading(false);
        return;
      }
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreeTerms) {
      setError("Please agree to the Terms of Service & Privacy Policy.");
      return;
    }
    setLoading(true);
    try {
      await signUp(name, email, password);
    } catch (err: any) {
      setError(err.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const ok = await requestPasswordReset(email);
      if (ok) {
        setForgotStep(2);
        setSuccessMsg(`If an account exists, a code was dispatched to ${email}`);
      }
    } catch (err: any) {
      setError(err.message || "Could not send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const isValid = await verifyResetCode(email, resetCode);
      if (isValid) {
        setForgotStep(3);
      } else {
        setError("Invalid or expired 6-digit code. Please try again.");
      }
    } catch {
      setError("Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setLoading(true);
    try {
      const ok = await completePasswordReset(email, resetCode, newPassword);
      if (ok) {
        setForgotStep(4);
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const ok = await verifyEmailCode(verifyCode);
      if (ok) {
        setVerifySuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-sky-500/25">
              N
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {activeTab === "login" && "Sign In to NovaCut Studio"}
                {activeTab === "signup" && "Create Your Creator Account"}
                {activeTab === "forgot" && "Reset Your Password"}
                {activeTab === "verify" && "Email Verification"}
              </h3>
              <p className="text-[11px] text-slate-400">
                Next-gen browser video editing & AI creative tools.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN TAB */}
          {activeTab === "login" && (
            <div className="space-y-4">
              {/* Google 1-Click Sign-in */}
              <button
                type="button"
                onClick={() => loginWithGoogle()}
                className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2.5 text-xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.19 0 10.04 0 12s.45 3.81 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-slate-500 font-mono text-[10px] uppercase">or with email</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-slate-200 outline-none focus:border-sky-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">Password</label>
                    <button
                      type="button"
                      onClick={() => setActiveTab("forgot")}
                      className="text-[11px] text-sky-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-slate-200 outline-none focus:border-sky-500 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all text-xs flex items-center justify-center gap-2"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Sign In</span>
                </button>
              </form>

              <div className="text-center pt-2 border-t border-slate-800/80">
                <span className="text-slate-400">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("signup")}
                  className="text-sky-400 font-bold hover:underline"
                >
                  Create one free
                </button>
              </div>
            </div>
          )}

          {/* 2. SIGN UP TAB */}
          {activeTab === "signup" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => loginWithGoogle()}
                className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2.5 text-xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.19 0 10.04 0 12s.45 3.81 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Sign Up with Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-slate-500 font-mono text-[10px] uppercase">or with email</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              <form onSubmit={handleSignUpSubmit} className="space-y-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-slate-200 outline-none focus:border-sky-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-slate-200 outline-none focus:border-sky-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-sky-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Confirm</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-sky-500 text-xs"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2 pt-1 text-slate-400 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-0"
                  />
                  <span>
                    I agree to the Terms of Service & Privacy Policy.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Free Account</span>
                </button>
              </form>

              <div className="text-center pt-2 border-t border-slate-800/80">
                <span className="text-slate-400">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="text-sky-400 font-bold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          {/* 3. FORGOT PASSWORD FLOW */}
          {activeTab === "forgot" && (
            <div className="space-y-4">
              {forgotStep === 1 && (
                <form onSubmit={handleSendResetCode} className="space-y-3">
                  <p className="text-slate-400 leading-relaxed">
                    Enter the email associated with your NovaCut account and we will send a 6-digit verification code.
                  </p>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Account Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-slate-200 outline-none focus:border-sky-500 text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-all"
                  >
                    Send Verification Code
                  </button>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleVerifyResetCode} className="space-y-3">
                  <p className="text-slate-400 leading-relaxed">
                    Enter the 6-digit code dispatched to <span className="text-sky-400 font-mono">{email}</span>.
                  </p>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">6-Digit Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-center text-lg font-mono tracking-widest text-sky-400 outline-none focus:border-sky-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-all"
                  >
                    Verify Code
                  </button>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={handleCompleteReset} className="space-y-3">
                  <p className="text-slate-400 leading-relaxed">
                    Choose a strong new password for your account.
                  </p>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-slate-200 outline-none focus:border-sky-500 text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all"
                  >
                    Update Password & Sign In
                  </button>
                </form>
              )}

              {forgotStep === 4 && (
                <div className="text-center py-4 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-slate-100 text-sm">Password Updated Successfully!</h4>
                  <p className="text-slate-400 text-xs">
                    Your password has been changed. You may now sign in.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="px-6 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}

              <div className="text-center pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="text-slate-400 hover:text-white"
                >
                  ← Return to Sign In
                </button>
              </div>
            </div>
          )}

          {/* 4. EMAIL VERIFICATION TAB */}
          {activeTab === "verify" && (
            <div className="space-y-4">
              {verifySuccess ? (
                <div className="text-center py-4 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-slate-100 text-sm">Email Verified!</h4>
                  <p className="text-slate-400 text-xs">
                    Your email address is confirmed. You have unlocked unlimited exports and cloud syncing.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(false)}
                    className="px-6 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl"
                  >
                    Continue to Studio
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyEmail} className="space-y-3">
                  <p className="text-slate-400 leading-relaxed">
                    A verification code has been dispatched to{" "}
                    <span className="text-sky-400 font-mono">{user?.email || email}</span>.
                  </p>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-center text-lg font-mono tracking-widest text-sky-400 outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => sendVerificationEmail()}
                      className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex-1 cursor-pointer"
                    >
                      Resend Code
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-xs flex-1 cursor-pointer"
                    >
                      Confirm Email
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
