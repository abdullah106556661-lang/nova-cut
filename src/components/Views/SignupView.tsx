import React, { useState } from "react";
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Film,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useEditor } from "../../context/EditorContext";

export const SignupView: React.FC = () => {
  const { signUp, loginWithGoogle, addNotification } = useAuth();
  const { setActiveTab } = useEditor();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute Password Strength
  const hasMinLength = password.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const strengthScore = [hasMinLength, hasLetters, hasNumbers, hasSpecial].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }

    if (!agreedToTerms) {
      setErrorMsg("You must accept the terms of service to create an account.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signUp(name, email);
      setActiveTab("dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    loginWithGoogle();
    setActiveTab("dashboard");
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            150 Free AI Credits Included
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Create Creator Account</h1>
          <p className="text-slate-400 text-xs">
            Join thousands of next-gen video editors, YouTube creators, and motion designers.
          </p>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google One-Click Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-3 shadow-md active:scale-95 group"
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
          Sign Up with Google Account
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Or create with email
          </span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Sign-Up Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Full Name / Channel
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Abdullah Visuals"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

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
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create secure password..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        step <= strengthScore
                          ? strengthScore === 4
                            ? "bg-emerald-500"
                            : strengthScore >= 2
                            ? "bg-sky-500"
                            : "bg-yellow-500"
                          : "bg-slate-800"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Strength: {strengthScore === 4 ? "Strong" : strengthScore >= 2 ? "Moderate" : "Weak"}</span>
                  <span>Min. 8 characters</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center text-xs text-slate-400">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0 w-4 h-4 mt-0.5"
              />
              <span>
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("terms")}
                  className="text-sky-400 hover:underline"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("privacy")}
                  className="text-sky-400 hover:underline"
                >
                  Privacy Policy
                </button>
                .
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Get Started Free (500 Daily Credits)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Fast Demo Credentials */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <p className="text-[10px] text-slate-400 text-center font-semibold uppercase tracking-wider">
            Quick 1-Click Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={async () => {
                await loginWithGoogle();
                setActiveTab("dashboard");
              }}
              className="py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin (Unlimited)</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                await signUp("New Creator", "creator@novacut.io", "DemoUser2026!");
                setActiveTab("dashboard");
              }}
              className="py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-sky-300 text-xs font-bold border border-sky-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>User (500 Daily)</span>
            </button>
          </div>
        </div>

        {/* Switch to Login */}
        <div className="text-center pt-2 text-xs text-slate-400">
          Already have an account?{" "}
          <button
            onClick={() => setActiveTab("login")}
            className="text-sky-400 font-semibold hover:underline cursor-pointer"
          >
            Sign In Here
          </button>
        </div>
      </div>
    </div>
  );
};
