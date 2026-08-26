import React, { useState } from "react";
import { ShieldCheck, FileText, Lock, Globe } from "lucide-react";

export const LegalView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"privacy" | "terms">("privacy");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Legal, Privacy & Terms</h1>
          <p className="text-xs text-slate-400 mt-1">
            Last Updated: January 2026 • Official Terms for NovaCut Studio
          </p>
        </div>

        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab("privacy")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "privacy" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab("terms")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "terms" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Terms of Service
          </button>
        </div>
      </div>

      {activeTab === "privacy" ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-xs text-slate-300 leading-relaxed">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              <span>1. In-Browser Privacy Commitment</span>
            </h2>
            <p>
              NovaCut Studio is engineered with a strict client-side first architecture. Your imported raw video files, audio tracks, photos, and project timelines are processed directly in your device's browser memory using WebGL and HTML5 Canvas APIs. We do NOT harvest or sell your private media.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-sky-400" />
              <span>2. Generative AI Prompts</span>
            </h2>
            <p>
              When you submit a text prompt to generate video scripts, images, or brand logos, the textual prompt is transmitted over encrypted TLS 1.3 to our AI inference endpoints (Google Gemini API). Prompts are processed strictly to return the generated creative asset and are never used to train third-party public models.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-sky-400" />
              <span>3. Data Retention & Deletion</span>
            </h2>
            <p>
              You maintain 100% control over your data. You may delete individual projects or export full JSON backups at any time. For questions regarding data privacy, reach out to <span className="text-sky-400 font-mono">abdullah106556661@gmail.com</span>.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-xs text-slate-300 leading-relaxed">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>1. Commercial Use & Ownership</span>
            </h2>
            <p>
              You retain full copyright and commercial rights over all videos exported with NovaCut Studio and all AI-generated assets produced via your account. You are free to monetize your videos on YouTube, TikTok, Meta, or distribute them commercially to clients.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>2. Acceptable AI Usage</span>
            </h2>
            <p>
              You agree not to use NovaCut Studio to generate illegal, defamatory, harmful, or copyright-infringing media. We reserve the right to revoke AI access for users violating standard ethical safety guidelines.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>3. Service Availability</span>
            </h2>
            <p>
              NovaCut Studio is provided on an "as is" and "as available" basis. While we strive for 99.9% uptime, local browser limitations or third-party network issues may occasionally impact performance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
