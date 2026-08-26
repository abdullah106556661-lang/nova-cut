import React, { useState } from "react";
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Zap,
  Play,
  Video,
  Wand2,
  Mic,
  Smartphone,
  Crown,
  Layers,
} from "lucide-react";
import { useAuth, DAILY_CREDITS_MAX, JAZZCASH_NUMBER, JAZZCASH_TITLE } from "../../context/AuthContext";

export const AuthLandingGate: React.FC = () => {
  const { login, signUp, loginWithGoogle, loginAsAdmin, setJazzCashModalOpen } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("abdullah106556661@gmail.com");
  const [password, setPassword] = useState("NovaCut2026!@#");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        if (!email) {
          setError("Please enter your email address.");
          setLoading(false);
          return;
        }
        await login(email, name || email.split("@")[0], password);
      } else {
        if (!email || !name) {
          setError("Please provide your name and email address.");
          setLoading(false);
          return;
        }
        await signUp(name, email, password);
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white relative overflow-hidden">
      {/* Background Glow Lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Simple Header */}
      <header className="p-4 sm:p-6 flex items-center justify-between max-w-7xl mx-auto w-full z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-sky-500/25">
            N
          </div>
          <div>
            <span className="font-black text-lg tracking-tight text-white">
              Nova<span className="text-sky-400">Cut</span>
            </span>
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30 uppercase">
              Studio AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="hidden sm:inline text-slate-400">JazzCash Pro Support:</span>
          <span className="font-mono text-red-400 font-bold bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-900/40">
            {JAZZCASH_NUMBER}
          </span>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 my-auto">
        {/* Left Side: Value Proposition & Feature Highlights */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Sign in to access your Studio & 500 Daily AI Credits</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            Next-Gen AI Video Editor & Multilingual Voice Studio
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
            Edit multitrack videos, transform photos, add animals to backgrounds, write cinematic prompts, and talk directly to Gemini Live in Urdu (اردو) or any spoken language.
          </p>

          {/* Key Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-start gap-3">
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Multitrack Video Studio</h4>
                <p className="text-[11px] text-slate-400">Trimming, splits, 9:16 / 16:9 ratios & auto captions</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                <Wand2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">AI Photo & Background Mod</h4>
                <p className="text-[11px] text-slate-400">Add cats, dogs, lions, neon lasers in 1 click (5 cr)</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Gemini Live Voice (Urdu / All)</h4>
                <p className="text-[11px] text-slate-400">اردو میں بات کریں اور تمام سوالات کے آواز میں جواب پائیں</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">500 Daily Credits + Pro Plan</h4>
                <p className="text-[11px] text-slate-400">Daily reset & JazzCash payment ({JAZZCASH_NUMBER})</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Card */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Mode Switch Tabs */}
          <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-6">
            <button
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === "signup"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account (500 Cr)
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs">
                {error}
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Creator Name"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Please wait...</span>
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In to Studio" : "Create Account & Get 500 Credits"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Logins */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
            <p className="text-[10px] text-slate-400 text-center font-semibold uppercase tracking-wider">
              Fast 1-Click Access
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={loginAsAdmin}
                className="py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 text-[11px] font-bold border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SuperAdmin</span>
              </button>

              <button
                type="button"
                onClick={loginWithGoogle}
                className="py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Google Sign-In</span>
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setJazzCashModalOpen(true)}
                className="text-[11px] text-red-400 hover:text-red-300 font-semibold flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Upgrade via JazzCash ({JAZZCASH_NUMBER})</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="p-4 text-center text-[11px] text-slate-500 border-t border-slate-900 z-10">
        NovaCut Studio AI © 2026 • 500 Daily Credits Reset Every 24 Hours • JazzCash Official: {JAZZCASH_NUMBER}
      </footer>
    </div>
  );
};
