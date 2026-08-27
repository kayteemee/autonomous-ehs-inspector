import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Sparkles,
  Zap,
  ShieldCheck,
  Building,
  CheckCircle2,
  ArrowRight,
  Eye,
  Layers,
  ChevronRight,
  Video,
  FileText
} from "lucide-react";

interface GuidedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenarioId: string) => void;
  onOpenArchitecture: () => void;
  onOpenPresentation: () => void;
}

interface DemoStep {
  id: number;
  title: string;
  badge: string;
  durationSec: number;
  description: string;
  keyFeatures: string[];
  actionPrompt: string;
  targetVisual: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: 1,
    title: "1. Multimodal Sensory Ingestion (Photo & Live Video Stream)",
    badge: "Input Layer",
    durationSec: 8,
    description:
      "The agent continuously ingests visual feeds—supporting high-res camera captures, drag-and-drop imagery, and real-time live webcam video streams at up to 60fps.",
    keyFeatures: [
      "Zero-latency frame capture buffer",
      "Live video stream analyzer with interval frame sampling",
      "Supports 6 pre-calibrated industrial hazard scenarios"
    ],
    actionPrompt: "Simulating ingestion of 'Warehouse Chemical Spill & Blocked Fire Exit'...",
    targetVisual: "ingestion"
  },
  {
    id: 2,
    title: "2. Spatial Vectoring & Tri-Tier Risk Localization",
    badge: "Computer Vision",
    durationSec: 9,
    description:
      "Gemini 3.7 Flash parses spatial pixel coordinates [ymin, xmin, ymax, xmax] into interactive SVG bounding boxes, instantly color-coded by severity (Critical / High / Medium / Low).",
    keyFeatures: [
      "Normalized coordinate mapping across any viewport",
      "Unsafe Act (Behavioral) vs Unsafe Condition (Physical) categorization",
      "Interactive SVG bounding boxes with pulse-glow animations"
    ],
    actionPrompt: "Pinpointing chemical drum leak and obstructed egress zone...",
    targetVisual: "spatial"
  },
  {
    id: 3,
    title: "3. Autonomous Legal Grounding & Multi-Standard Citations",
    badge: "Regulatory Engine",
    durationSec: 9,
    description:
      "Cross-references visual hazard context against enforceable international standards without human prompt—citing exact clauses from OSHA, ISO 45001, and NFPA.",
    keyFeatures: [
      "OSHA 29 CFR 1910.120 (Hazardous Waste Operations)",
      "ISO 45001:2018 §6.1.2 (Hazard Identification)",
      "NFPA 101 Life Safety Code compliance auditing"
    ],
    actionPrompt: "Synthesizing legal regulatory citations & CAPA directives...",
    targetVisual: "legal"
  },
  {
    id: 4,
    title: "4. Autonomous CAPA Work Order Dispatch & SLA Countdown",
    badge: "Agentic Dispatch",
    durationSec: 10,
    description:
      "The agent does not stop at detection. It autonomously formats formal EHS Work Orders, computes emergency SLA countdowns (e.g. 24h Stop-Work), and generates multi-channel dispatch payloads (SMS, Email, Webhook).",
    keyFeatures: [
      "Automated Work Order ID generation",
      "Dynamic Department Routing (EHS, Facilities, Machinery)",
      "1-Click Dispatch to SMS, Email, and ERP Webhooks"
    ],
    actionPrompt: "Dispatching emergency CAPA Work Order to Facilities Ops...",
    targetVisual: "dispatch"
  },
  {
    id: 5,
    title: "5. Closed-Loop 'Before vs. After' Remediation Verification",
    badge: "Verification Agent",
    durationSec: 10,
    description:
      "When a contractor or supervisor uploads a photo of the completed repair, Gemini compares both photos side-by-side to visually verify hazard elimination before closing the ticket in the immutable audit ledger.",
    keyFeatures: [
      "Side-by-side multimodal visual proof inspection",
      "AI Confidence Scoring (0-100%) and Residual Risk detection",
      "Cryptographic timestamping & PDF audit dossier generation"
    ],
    actionPrompt: "Verifying physical hazard remediation & closing ledger ticket...",
    targetVisual: "verification"
  }
];

export default function AutoPlayDemoModal({
  isOpen,
  onClose,
  onSelectScenario,
  onOpenArchitecture,
  onOpenPresentation
}: GuidedDemoModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const currentStep = DEMO_STEPS[currentStepIndex];

  // Auto-play timer loop
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const intervalMs = 100;
    const totalTicks = (currentStep.durationSec * 1000) / intervalMs;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentStepIndex < DEMO_STEPS.length - 1) {
            setCurrentStepIndex((idx) => idx + 1);
            return 0;
          } else {
            setIsPlaying(false);
            return 100;
          }
        }
        return prev + 100 / totalTicks;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, currentStepIndex, currentStep.durationSec]);

  if (!isOpen) return null;

  const handleStepClick = (index: number) => {
    setCurrentStepIndex(index);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setProgress(0);
    setIsPlaying(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Autonomous Agent Guided Demo Tour
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Live Tour Simulation
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated end-to-end walkthrough designed for hackathon judges &amp; live video recording
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? "Pause" : "Resume"}</span>
            </button>

            <button
              onClick={handleRestart}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Restart Demo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-1.5 relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-blue-500 to-emerald-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* 5-Stage Stepper Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {DEMO_STEPS.map((step, idx) => {
              const isCurrent = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(idx)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                    isCurrent
                      ? "bg-slate-800 border-amber-500 ring-1 ring-amber-500/50 shadow-lg shadow-amber-500/10"
                      : isPast
                      ? "bg-slate-950/80 border-emerald-500/40 text-slate-300"
                      : "bg-slate-950/40 border-slate-800 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isCurrent
                          ? "bg-amber-500/20 text-amber-300"
                          : isPast
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      Step {step.id}
                    </span>
                    {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <span className="text-xs font-bold text-white mt-2 block truncate">
                    {step.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Step Presentation Display */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Active Execution Phase ({currentStepIndex + 1} of {DEMO_STEPS.length})
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white mt-0.5">
                  {currentStep.title}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  {currentStep.badge}
                </span>
              </div>
            </div>

            {/* Step Explanation */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
              {currentStep.description}
            </p>

            {/* Key Capabilities */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Key Technical Highlights:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {currentStep.keyFeatures.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulation Action Trigger Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-emerald-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-amber-200">
                <Zap className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                <span>
                  <strong>Autonomous Action:</strong> {currentStep.actionPrompt}
                </span>
              </div>

              {currentStepIndex === DEMO_STEPS.length - 1 && (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-md shrink-0">
                  Cycle Complete
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-950/95 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenArchitecture();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>View Architecture Diagram</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenPresentation();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>View Slide Deck</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentStepIndex === 0}
              onClick={() => {
                setCurrentStepIndex((prev) => Math.max(0, prev - 1));
                setProgress(0);
                setIsPlaying(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold disabled:opacity-40 transition-colors"
            >
              Previous
            </button>

            <button
              onClick={() => {
                if (currentStepIndex < DEMO_STEPS.length - 1) {
                  setCurrentStepIndex((prev) => prev + 1);
                  setProgress(0);
                  setIsPlaying(true);
                } else {
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-md shadow-amber-900/30"
            >
              <span>{currentStepIndex < DEMO_STEPS.length - 1 ? "Next Step" : "Close Tour"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
