import React, { useState } from "react";
import {
  User,
  Mail,
  ShieldCheck,
  HardDrive,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Camera,
  Save,
  KeyRound,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useEditor } from "../../context/EditorContext";

export const ProfileView: React.FC = () => {
  const { user, isAdmin, updateProfile, logout, sendVerificationEmail, addNotification, setAuthModalOpen, setAuthInitialTab } = useAuth();
  const { setActiveTab } = useEditor();

  const [name, setName] = useState(user?.name || "Abdullah");
  const [avatarUrl, setAvatarUrl] = useState(
    user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
  );
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, avatarUrl });
    setSaved(true);
    addNotification("Profile Updated", "Your profile details have been saved.", "success");
    setTimeout(() => setSaved(false), 2500);
  };

  const handleVerifyEmail = () => {
    sendVerificationEmail();
    setAuthInitialTab("verify");
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Creator Account & Profile</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your personal credentials, storage limits, and connected cloud services.
          </p>
        </div>
        <button
          onClick={logout}
          className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile Card Left */}
        <div className="md:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            <img
              src={avatarUrl}
              alt={name}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-sky-500/50 shadow-xl"
            />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">{name}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>
          </div>

          <div className="w-full pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Account Tier</span>
              <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-400 font-bold rounded-lg text-[10px] uppercase">
                {user?.plan || "CREATOR PRO"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Email Status</span>
              {user?.isEmailVerified ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              ) : (
                <button
                  onClick={handleVerifyEmail}
                  className="text-amber-400 hover:underline flex items-center gap-1 font-semibold text-[11px]"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Verify Now</span>
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab("pricing")}
            className="w-full py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/25"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Manage Subscription</span>
          </button>
        </div>

        {/* Edit Form Right */}
        <div className="md:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 text-xs">
          <h3 className="font-bold text-sm text-slate-200">Account Information</h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Display Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  disabled
                  value={user?.email || ""}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-400 outline-none text-xs cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Avatar Image URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-sky-500 text-xs"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-md shadow-sky-500/25"
              >
                <Save className="w-4 h-4" />
                <span>{saved ? "Changes Saved!" : "Save Profile Details"}</span>
              </button>
            </div>
          </form>

          {/* Usage Metrics */}
          <div className="pt-6 border-t border-slate-800 space-y-3">
            <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider">
              Storage & AI Quotas
            </h4>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Cloud Media Storage</span>
                  <span className="text-slate-200 font-mono">1.4 GB / 50.0 GB</span>
                </div>
                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="w-[3%] h-full bg-emerald-500 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">AI Credits Remaining</span>
                  <span className="text-purple-300 font-mono font-bold">
                    {isAdmin ? (
                      <span className="text-emerald-400">∞ Unlimited (SuperAdmin)</span>
                    ) : (
                      `${user?.aiCreditsRemaining ?? 500} / 500 Daily`
                    )}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isAdmin
                        ? "w-full bg-emerald-500"
                        : "w-[100%] bg-purple-500"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
