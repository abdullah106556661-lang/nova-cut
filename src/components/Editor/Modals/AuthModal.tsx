import React, { useState } from "react";
import { X, Sparkles, Check, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("abdullah106556661@gmail.com");
  const [password, setPassword] = useState("••••••••••••");
  const [name, setName] = useState("Abdullah");
  const [isSignUp, setIsSignUp] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, name);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-sky-500/30">
                N
              </div>
              <h3 className="text-base font-bold text-slate-100">
                {isSignUp ? "Create NovaCut Account" : "Sign In to NovaCut Studio"}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cloud project sync, 4K rendering & AI director tools.
            </p>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Google Sign In Button */}
          <button
            onClick={loginWithGoogle}
            className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2.5 text-xs"
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

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-slate-500 font-mono text-[10px] uppercase">or with email</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {isSignUp && (
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            )}

            <div>
              <label className="text-slate-300 block mb-1 font-medium">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all text-xs"
            >
              {isSignUp ? "Create Free Account" : "Sign In"}
            </button>
          </form>

          {/* Toggle */}
          <div className="text-center pt-2">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sky-400 hover:text-sky-300 text-xs font-medium"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up free"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
