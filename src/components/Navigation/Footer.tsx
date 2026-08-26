import React from "react";
import { Sparkles, Mail, ShieldCheck, Heart, Github, Twitter, Youtube, ArrowUpRight } from "lucide-react";
import { useEditor, NavTab } from "../../context/EditorContext";

export const Footer: React.FC = () => {
  const { setActiveTab } = useEditor();

  const handleNav = (tab: NavTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-xs select-none">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-sky-500/25">
                N
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                Nova<span className="text-sky-400">Cut</span> Studio
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              The next-generation AI creative platform. High-performance browser-based multi-track video editing, AI video storyboard scripts, thumbnail creator, image studio, and brand asset generation.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="mailto:abdullah106556661@gmail.com"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors text-xs font-semibold"
              >
                <Mail className="w-3.5 h-3.5 text-sky-400" />
                <span>abdullah106556661@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Platform Col */}
          <div className="space-y-3">
            <h4 className="text-white font-bold tracking-wide uppercase text-[11px]">Platform</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleNav("editor")} className="hover:text-sky-400 transition-colors">
                  Video Editor Studio
                </button>
              </li>
              <li>
                <button onClick={() => handleNav("ai-generate")} className="hover:text-sky-400 transition-colors flex items-center gap-1">
                  <span>AI Creative Suite</span>
                  <span className="text-[9px] px-1 bg-purple-500/20 text-purple-400 rounded font-bold">AI</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleNav("templates")} className="hover:text-sky-400 transition-colors">
                  Template Library
                </button>
              </li>
              <li>
                <button onClick={() => handleNav("projects")} className="hover:text-sky-400 transition-colors">
                  Project Workspace
                </button>
              </li>
              <li>
                <button onClick={() => handleNav("dashboard")} className="hover:text-sky-400 transition-colors">
                  Creator Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Resources & Support Col */}
          <div className="space-y-3">
            <h4 className="text-white font-bold tracking-wide uppercase text-[11px]">Support & Learn</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleNav("help")} className="hover:text-sky-400 transition-colors">
                  Help Center & Guides
                </button>
              </li>
              <li>
                <button onClick={() => handleNav("contact")} className="hover:text-sky-400 transition-colors">
                  Contact Support
                </button>
              </li>
              <li>
                <button onClick={() => handleNav("pricing")} className="hover:text-sky-400 transition-colors">
                  Pricing Plans
                </button>
              </li>
              <li>
                <a
                  href="mailto:abdullah106556661@gmail.com?subject=NovaCut%20Bug%20Report"
                  className="hover:text-sky-400 transition-colors flex items-center gap-1"
                >
                  <span>Report an Issue</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Col */}
          <div className="space-y-3">
            <h4 className="text-white font-bold tracking-wide uppercase text-[11px]">Legal & Privacy</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleNav("privacy")} className="hover:text-sky-400 transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => handleNav("terms")} className="hover:text-sky-400 transition-colors">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => handleNav("settings")} className="hover:text-sky-400 transition-colors">
                  Studio Settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 mt-12 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} NovaCut Creative Technologies. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Powered by Gemini & High-Performance WebGL Canvas</span>
            <span>Support: abdullah106556661@gmail.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
