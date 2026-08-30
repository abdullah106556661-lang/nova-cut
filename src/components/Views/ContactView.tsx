import React, { useState } from "react";
import {
  Mail,
  Send,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const ContactView: React.FC = () => {
  const { user, addNotification } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("Feature Request / Support Question");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
        }),
      });

      const data = await res.json();
      if (data.status === "received") {
        setSent(true);
        addNotification("Message Dispatched", "Support ticket received. We will respond within 24 hours.", "success");
      } else {
        throw new Error(data.message || "Failed to send message");
      }
    } catch (err: any) {
      setError(err.message || "Unable to send message right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-bold">
          <Mail className="w-3.5 h-3.5 text-sky-400" />
          <span>Creator Support & Inquiries</span>
        </div>
        <h1 className="text-3xl font-black text-white">Get in Touch with NovaCut</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Have a feature suggestion, partnership proposal, or bug report? Send us a direct message.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Info Left */}
        <div className="md:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white">Direct Support Contact</h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-300">Official Support Email</p>
                  <a
                    href="mailto:abdullah106556661@gmail.com"
                    className="text-sky-400 font-mono text-[11px] hover:underline"
                  >
                    abdullah106556661@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-300">Average Response Time</p>
                  <p className="text-slate-400 text-[11px]">Under 12 hours (7 days a week)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-300">Encrypted Communications</p>
                  <p className="text-slate-400 text-[11px]">End-to-end HTTPS transmission</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-bold text-slate-200 block">Lead Architect</span>
            <p>Designed and engineered for creators worldwide with maximum browser rendering performance.</p>
          </div>
        </div>

        {/* Contact Form Right */}
        <div className="md:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 text-xs">
          {sent ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-lg font-bold text-white">Message Sent Successfully!</h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                Thank you for contacting NovaCut Studio. A copy has been routed to{" "}
                <span className="text-sky-400 font-mono">abdullah106556661@gmail.com</span> and we will follow up shortly.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setMessage("");
                }}
                className="px-5 py-2 bg-sky-500 text-white font-bold rounded-xl text-xs"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Your Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Vance"
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
                    placeholder="you@domain.com"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-slate-200 outline-none focus:border-sky-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="How can we assist you?"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-sky-500 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Your Message</label>
                <textarea
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your question or suggestion in detail..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-3 text-slate-200 outline-none focus:border-sky-500 text-xs leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 text-xs"
              >
                {loading ? (
                  <span>Sending Dispatch...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message to Support</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
