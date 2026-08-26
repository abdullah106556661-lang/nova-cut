import React, { useState } from "react";
import {
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  Star,
  Smartphone,
  Crown,
  CheckCircle2,
  Copy,
  RefreshCw,
} from "lucide-react";
import { useAuth, DAILY_CREDITS_MAX, JAZZCASH_NUMBER, JAZZCASH_TITLE } from "../../context/AuthContext";
import { useEditor } from "../../context/EditorContext";

export const PricingView: React.FC = () => {
  const [annual, setAnnual] = useState(true);
  const { user, updateProfile, addNotification, setJazzCashModalOpen, resetDailyCredits } = useAuth();
  const { setActiveTab } = useEditor();
  const [copied, setCopied] = useState(false);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(JAZZCASH_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addNotification("JazzCash Number Copied", `${JAZZCASH_NUMBER} copied to clipboard.`, "info");
  };

  const handleFreeStarter = () => {
    updateProfile({
      plan: "free",
      aiCreditsRemaining: DAILY_CREDITS_MAX,
    });
    addNotification("Starter Tier Active", "You get 500 Daily AI Credits reset every 24 hours.", "success");
  };

  const plans = [
    {
      id: "free",
      name: "Starter Creator",
      badge: "Free Daily",
      priceMonthly: 0,
      priceAnnual: 0,
      description: "Essential tools for casual video editing and social media creators.",
      features: [
        "1080p Export Quality",
        "Multi-track Timeline (up to 4 tracks)",
        "500 Daily AI Credits (Reset Every 24h)",
        "1 Photo = 5 Credits",
        "1 Video = 10 Credits",
        "AI Prompts = 10 Credits",
        "Standard Transitions & Shaders",
        "Community Support",
      ],
      buttonText: "Current Plan",
      highlighted: false,
      isJazzCash: false,
    },
    {
      id: "studio_pro",
      name: "Studio Pro (JazzCash)",
      badge: "Recommended",
      priceMonthly: "PKR 1,500",
      priceAnnual: "PKR 1,200",
      description: "Direct JazzCash mobile payment with instant activation and unlimited power.",
      features: [
        "JazzCash Account: 03176901963",
        "500 Daily AI Generation Credits (Reset Daily)",
        "4K 60FPS Ultra HD Master Export",
        "Unlimited Timeline Tracks & Overlays",
        "AI Photo Modifier (Cats, Dogs, Lions, Lasers)",
        "Veo 3.1 & Image-to-Video Generator",
        "Auto-Captions & Subtitle Translator",
        "No Watermark on Exports",
        "Priority Gemini Live Voice Mode (Urdu / All)",
      ],
      buttonText: "Upgrade via JazzCash",
      highlighted: true,
      isJazzCash: true,
    },
    {
      id: "creator",
      name: "Agency Enterprise",
      badge: "Full Access",
      priceMonthly: "PKR 3,500",
      priceAnnual: "PKR 2,800",
      description: "For teams, studios, and production houses requiring dedicated rendering nodes.",
      features: [
        "8K / 60FPS Master Export",
        "Unlimited Cloud Storage (500 GB+)",
        "Dedicated VIP Rendering Queue",
        "Commercial License on All AI Assets",
        "Custom Brand Fonts & LUTs Upload",
        "Multi-user Team Collaboration",
        "24/7 Dedicated Support",
      ],
      buttonText: "Get Enterprise via JazzCash",
      highlighted: false,
      isJazzCash: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-12 select-none">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold">
          <Smartphone className="w-3.5 h-3.5 text-red-400" />
          <span>JazzCash Pro Official: {JAZZCASH_NUMBER}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">
          Transparent Pricing & 500 Daily Credits
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
          Every registered user receives <strong>500 daily AI credits</strong> that automatically reset every day. Upgrade to Pro via JazzCash for unlimited access.
        </p>

        {/* Daily Reset Info Card */}
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 max-w-md mx-auto flex items-center justify-between">
          <div className="text-left">
            <p className="text-xs font-bold text-slate-200">Your Current Balance</p>
            <p className="text-lg font-black text-sky-400">
              {user?.role === "SuperAdmin" || user?.email?.toLowerCase().trim() === "abdullah106556661@gmail.com" ? (
                <span className="text-emerald-400 font-mono">∞ Unlimited (Admin)</span>
              ) : (
                <span>
                  {user?.aiCreditsRemaining ?? DAILY_CREDITS_MAX} / {DAILY_CREDITS_MAX}{" "}
                  <span className="text-xs text-slate-400 font-normal">Daily Credits</span>
                </span>
              )}
            </p>
          </div>
          {!(user?.role === "SuperAdmin" || user?.email?.toLowerCase().trim() === "abdullah106556661@gmail.com") && (
            <button
              onClick={resetDailyCredits}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Daily 500</span>
            </button>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent = user?.plan === p.id;

          return (
            <div
              key={p.id}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
                p.highlighted
                  ? "bg-slate-900 border-2 border-red-500 shadow-2xl shadow-red-500/15"
                  : "bg-slate-900/80 border border-slate-800"
              }`}
            >
              {p.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-red-600 to-amber-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  <span>{p.badge}</span>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-white">{p.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">
                    {annual ? p.priceAnnual : p.priceMonthly}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {typeof p.priceMonthly === "number" ? "/month" : "/mo"}
                  </span>
                </div>

                <ul className="space-y-3 text-xs text-slate-300">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                {p.isJazzCash ? (
                  <button
                    onClick={() => setJazzCashModalOpen(true)}
                    className="w-full py-3.5 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-600/25 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Pay with JazzCash ({JAZZCASH_NUMBER})</span>
                  </button>
                ) : (
                  <button
                    onClick={handleFreeStarter}
                    className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <span>{isCurrent ? "Current Plan" : "Use Free 500 Daily"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* JazzCash Direct Payment Instruction Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-red-950/40 via-amber-950/20 to-slate-900 rounded-3xl border border-red-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold">
            <Crown className="w-3.5 h-3.5" />
            <span>Instant Pro Upgrade via JazzCash</span>
          </div>
          <h3 className="text-xl font-black text-white">
            Send Payment to: <span className="font-mono text-amber-300">{JAZZCASH_NUMBER}</span> ({JAZZCASH_TITLE})
          </h3>
          <p className="text-xs text-slate-400 max-w-xl">
            After sending PKR 1,500, enter your Transaction ID (TID) in the checkout modal for instant verification and activation of Unlimited Credits.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleCopyNumber}
            className="flex-1 md:flex-initial px-4 py-3 bg-slate-900 hover:bg-slate-850 text-white border border-slate-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copied {JAZZCASH_NUMBER}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-red-400" />
                <span>Copy JazzCash Number</span>
              </>
            )}
          </button>

          <button
            onClick={() => setJazzCashModalOpen(true)}
            className="flex-1 md:flex-initial px-5 py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
          >
            <span>Activate Pro Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
