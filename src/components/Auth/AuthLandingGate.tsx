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
  Video,
  Wand2,
  Mic,
  Crown,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { useAuth, JAZZCASH_NUMBER } from "../../context/AuthContext";

export const AuthLandingGate: React.FC = () => {
  const { login, signUp, loginWithGoogle, setJazzCashModalOpen } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "Enter password", color: "bg-slate-700" };
    if (pass.length < 6) return { score: 1, label: "Too short (min 6 chars)", color: "bg-red-500" };
    let score = 2;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score: 2, label: "Medium Security", color: "bg-amber-500" };
    if (score === 3) return { score: 3, label: "Good Security", color: "bg-emerald-500" };
    return { score: 4, label: "Strong 256-bit Salted", color: "bg-sky-400" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    const cleanPass = password.trim();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (mode === "signup" && cleanPass.length < 6) {
      setError("Password must be at least 6 characters long for high security.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        await login(cleanEmail, cleanPass);
      } else {
        await signUp(cleanName || cleanEmail.split("@")[0], cleanEmail, cleanPass);
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please verify your credentials.");
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
              Secure Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="hidden sm:inline text-slate-400">Protected by:</span>
          <span className="flex items-center gap-1 font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-900/40">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            256-Bit SSL Shield
          </span>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 my-auto">
        {/* Left Side: Value Proposition & Feature Highlights */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            <span>High-Security Gate: Sign in or register required to access Studio</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            Protected AI Video Editor & Multilingual Voice Studio
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
            Edit multitrack videos, transform photos, add animals to backgrounds, write cinematic prompts, and talk directly to Gemini Live in Urdu (اردو) or English.
          </p>

          <div className="p-3.5 bg-slate-900/90 border border-amber-500/30 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 fill-amber-400" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-amber-300">500 Free AI Credits on Signup (3-Day Refresh)</p>
              <p className="text-slate-400 text-[11px]">نئے اکاؤنٹ پر 500 کریڈٹس ملیں گے جو ہر 3 دن بعد ری سیٹ ہوں گے</p>
            </div>
          </div>

          {/* Key Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                <h4 className="text-xs font-bold text-white">Secured Pro Studio Tools</h4>
                <p className="text-[11px] text-slate-400">4K exports & Pro tools guarded with verified JazzCash ({JAZZCASH_NUMBER})</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Card */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Security Gate Notice */}
          <div className="mb-5 p-3 rounded-2xl bg-sky-950/40 border border-sky-800/40 flex items-center gap-2.5 text-xs text-sky-200">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <span>بنا سائن ان کے ہوم پیج تک رسائی محفوظ طریقے سے بند ہے</span>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-5">
            <button
              id="auth-gate-login-tab"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In (لاگ ان)
            </button>
            <button
              id="auth-gate-signup-tab"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
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
                    id="auth-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
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
                  id="auth-email-input"
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
                Password {mode === "signup" && <span className="text-slate-500 font-normal">(min. 6 characters)</span>}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  id="auth-password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength meter on signup */}
              {mode === "signup" && password.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: `${(strength.score / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block">{strength.label}</span>
                </div>
              )}
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Verifying Secure Session...</span>
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In to Studio" : "Create Account & Get 500 Credits"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Alternative Sign-In Options */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2.5">
            <button
              id="auth-google-btn"
              type="button"
              onClick={() => loginWithGoogle()}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <span>Continue with Google</span>
            </button>

            <div className="text-center pt-2">
              <button
                id="auth-jazzcash-btn"
                type="button"
                onClick={() => setJazzCashModalOpen(true)}
                className="text-[11px] text-red-400 hover:text-red-300 font-semibold flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Upgrade via JazzCash Official ({JAZZCASH_NUMBER})</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="p-4 text-center text-[11px] text-slate-500 border-t border-slate-900 z-10">
        NovaCut Studio AI © 2026 • 500 Credits Included with 3-Day Refresh Cycle • JazzCash Official: {JAZZCASH_NUMBER}
      </footer>
    </div>
  );
};
