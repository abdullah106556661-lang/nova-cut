import React, { useState, useRef } from "react";
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  ArrowRight,
  Smartphone,
  Crown,
  Lock,
  Upload,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useAuth, JAZZCASH_NUMBER, JAZZCASH_TITLE } from "../../context/AuthContext";

export const JazzCashModal: React.FC = () => {
  const { jazzCashModalOpen, setJazzCashModalOpen, activateProWithJazzCash, addNotification } = useAuth();

  const [copied, setCopied] = useState(false);
  const [tid, setTid] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderName, setSenderName] = useState("");
  const [paymentReceiptDoc, setPaymentReceiptDoc] = useState<string | null>(null);
  const [paymentDocFileName, setPaymentDocFileName] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!jazzCashModalOpen) return null;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(JAZZCASH_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addNotification("JazzCash Number Copied", `${JAZZCASH_NUMBER} copied to clipboard.`, "info");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Receipt document must be under 10 MB.");
      return;
    }

    setPaymentDocFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentReceiptDoc(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTid = tid.trim();
    if (!cleanTid) {
      setError("Please enter the JazzCash Transaction ID (TID) from your SMS or app receipt.");
      return;
    }

    if (!senderPhone.trim()) {
      setError("Please enter your JazzCash sender mobile number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await activateProWithJazzCash(cleanTid, senderPhone);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setJazzCashModalOpen(false);
      }, 2400);
    } catch (err: any) {
      setError(err?.message || "Failed to submit JazzCash transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative text-slate-100 flex flex-col my-auto max-h-[95vh]">
        {/* Top Header Banner */}
        <div className="p-5 bg-gradient-to-r from-red-950/70 via-amber-950/50 to-slate-900 border-b border-slate-800 relative">
          <button
            onClick={() => setJazzCashModalOpen(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Upgrade to Studio Pro</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  JazzCash Official
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Direct mobile payment to <strong className="text-amber-400">{JAZZCASH_NUMBER}</strong> • Instant activation
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle2 className="w-9 h-9 animate-bounce" />
              </div>
              <h4 className="text-xl font-black text-white">Pro Plan Activated!</h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Thank you! Your JazzCash Transaction ID <strong className="text-amber-400 font-mono">({tid})</strong> and receipt have been verified. Enjoy Unlimited AI credits and 4K exports.
              </p>
            </div>
          ) : (
            <>
              {/* JazzCash Official Account Box */}
              <div className="p-4 bg-slate-950/90 rounded-2xl border-2 border-red-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold text-slate-200">JazzCash Account Details</span>
                  </div>
                  <span className="text-xs font-black text-amber-400">PKR 1,500 / Month</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">JazzCash Mobile Number (Owner)</p>
                    <p className="text-lg font-mono font-black text-white tracking-wider">
                      {JAZZCASH_NUMBER}
                    </p>
                    <p className="text-[11px] text-slate-400">Account Title: <span className="text-slate-200 font-semibold">{JAZZCASH_TITLE}</span></p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      copied
                        ? "bg-emerald-600 text-white"
                        : "bg-red-600/90 hover:bg-red-500 text-white shadow-md shadow-red-600/20"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Number</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Instructions Steps */}
              <div className="space-y-1.5 text-xs text-slate-300">
                <p className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  How to complete payment:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1 text-[11px]">
                  <li>Send <strong>PKR 1,500</strong> to JazzCash number <strong>{JAZZCASH_NUMBER}</strong></li>
                  <li>Copy your <strong>Transaction ID (TID)</strong> from the SMS or app</li>
                  <li>Attach your <strong>Payment Receipt / Screenshot</strong> below for instant records</li>
                </ol>
              </div>

              {/* Form to submit payment details */}
              <form onSubmit={handleActivate} className="space-y-3.5">
                {error && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Transaction ID (TID) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tid}
                      onChange={(e) => setTid(e.target.value)}
                      placeholder="e.g. 0293847561"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Sender Phone Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="e.g. 03001234567"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Sender Account Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="e.g. Muhammad Ali"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Additional Notes / Reference
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. 1 Month Studio Pro"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Upload Payment Receipt / Document */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Payment Receipt / Screenshot</span>
                    <span className="text-[10px] text-slate-400 font-normal">PNG, JPG, PDF (Max 10MB)</span>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {paymentReceiptDoc ? (
                    <div className="p-3 bg-slate-950 border border-emerald-500/40 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {paymentReceiptDoc.startsWith("data:image") ? (
                          <img
                            src={paymentReceiptDoc}
                            alt="Receipt Preview"
                            className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">{paymentDocFileName || "Payment_Receipt.png"}</p>
                          <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Receipt attached successfully
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setPaymentReceiptDoc(null);
                          setPaymentDocFileName("");
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-3 bg-slate-950 hover:bg-slate-850 border border-dashed border-slate-700 hover:border-sky-500/50 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-sky-400" />
                      <span>Click to upload Payment Receipt / Screenshot</span>
                    </button>
                  )}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    id="submit-jazzcash-payment-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Verifying Transfer TID...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-300" />
                        <span>Submit Transfer TID for Pro Verification</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Pro Perks Highlights */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  Unlimited AI Generations
                </span>
                <span className="flex items-center gap-1 text-sky-400">
                  <CheckCircle2 className="w-3 h-3" />
                  4K / 60FPS Video Export
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <CheckCircle2 className="w-3 h-3" />
                  No Watermarks
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

