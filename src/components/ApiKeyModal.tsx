import React, { useState, useEffect } from "react";
import { 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Zap, 
  Trash2, 
  X, 
  Loader2, 
  Copy, 
  Check, 
  HelpCircle 
} from "lucide-react";
import { validateApiKey } from "../services/geminiSafetyService";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
  onClearKey: () => void;
}

export default function ApiKeyModal({
  isOpen,
  onClose,
  apiKey,
  onSaveKey,
  onClearKey,
}: ApiKeyModalProps) {
  const [inputKey, setInputKey] = useState(apiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [hasCopiedUrl, setHasCopiedUrl] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputKey(apiKey || "");
      setValidationResult(null);
    }
  }, [isOpen, apiKey]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = inputKey.trim();

    if (!cleanKey) {
      setValidationResult({
        valid: false,
        message: "Please enter or paste your Gemini API key.",
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await validateApiKey(cleanKey);

      if (result.valid) {
        setValidationResult({
          valid: true,
          message: result.message || "Key successfully verified against Google Gemini AI! Ready for live safety vision scans.",
        });
        onSaveKey(cleanKey);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setValidationResult({
          valid: false,
          message: result.error || "Verification failed. Please ensure the key is copied correctly from Google AI Studio.",
        });
      }
    } catch (err: any) {
      console.error("API Key verification network error:", err);
      // Fallback: save anyway
      onSaveKey(cleanKey);
      setValidationResult({
        valid: true,
        message: "Key saved to local browser storage!",
      });
      setTimeout(() => {
        onClose();
      }, 1000);
    } finally {
      setIsValidating(false);
    }
  };

  const handleQuickSaveWithoutTest = () => {
    const cleanKey = inputKey.trim();
    if (cleanKey) {
      onSaveKey(cleanKey);
      onClose();
    }
  };

  const handleClear = () => {
    setInputKey("");
    setValidationResult(null);
    onClearKey();
  };

  const handleCopyAiStudioUrl = () => {
    navigator.clipboard.writeText("https://aistudio.google.com/apikey");
    setHasCopiedUrl(true);
    setTimeout(() => setHasCopiedUrl(false), 2000);
  };

  const isKeyConfigured = Boolean(apiKey && apiKey.trim().length > 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-8 text-white">
        {/* Glow Header Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400" />

        {/* Modal Top Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight">
                  Guided Gemini API Key Setup
                </h2>
                {isKeyConfigured ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Active Key
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    <Zap className="w-3 h-3" />
                    100% Free Quota
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Enable live Computer Vision safety inspections at $0 cost using your personal Google AI key.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Highlight Benefit Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/40 border border-indigo-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Zero-Cost Bring Your Own Key (BYOK)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                $0.00 Cost
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Google provides generous <strong>free tier quotas</strong> for Gemini AI models. By saving your personal key, your safety scans run directly against your free quota with <strong>zero subscription fees</strong> and 100% privacy.
            </p>

            {/* 1-Click Primary Action Button to Google AI Studio */}
            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-98 cursor-pointer border border-indigo-400/30 group"
              >
                <span>Get Free Gemini API Key from Google</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
              <button
                type="button"
                onClick={handleCopyAiStudioUrl}
                className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Copy direct URL"
              >
                {hasCopiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400">Copied URL</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3 Simple Steps Walkthrough */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-mono">
              30-Second Setup Guide
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-[10px] flex items-center justify-center font-mono">
                    1
                  </span>
                  <span>Click Link</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Click the button above to open Google AI Studio in a new tab.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-[10px] flex items-center justify-center font-mono">
                    2
                  </span>
                  <span>Create Key</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Click <strong>&quot;Create API key&quot;</strong> and copy the generated token.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-[10px] flex items-center justify-center font-mono">
                    3
                  </span>
                  <span>Paste & Save</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Paste your key below once. It is saved in your browser securely.
                </p>
              </div>
            </div>
          </div>

          {/* Form & Input Field */}
          <form onSubmit={handleTestAndSave} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                  Enter Your Gemini API Key
                </label>
                {inputKey && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {inputKey.length} chars
                  </span>
                )}
              </div>

              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showKey ? "text" : "password"}
                  value={inputKey}
                  onChange={(e) => {
                    setInputKey(e.target.value);
                    setValidationResult(null);
                  }}
                  placeholder="Paste your Gemini API key (starts with AIzaSy...)"
                  className="w-full pl-10 pr-24 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono transition-all"
                  autoComplete="off"
                  spellCheck="false"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title={showKey ? "Hide key" : "Show key"}
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  {inputKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputKey("");
                        setValidationResult(null);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
                      title="Clear field"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Validation Feedback Banner */}
            {validationResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2.5 animate-slide-down ${
                  validationResult.valid
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
                }`}
              >
                {validationResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <div className="flex-1 leading-relaxed">
                  {validationResult.message}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isKeyConfigured && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Key</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
                >
                  Skip for Now
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={isValidating || !inputKey.trim()}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-98 cursor-pointer flex items-center justify-center gap-2 border border-indigo-400/20 uppercase tracking-wider"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save & Activate Key</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Privacy Note */}
          <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>
              Your API key is securely stored exclusively inside your browser (Local Storage) and sent directly with your computer vision audit requests.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
