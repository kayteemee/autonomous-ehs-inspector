import React, { useState } from "react";
import {
  X,
  Cpu,
  Layers,
  Zap,
  ShieldCheck,
  Building,
  Video,
  FileText,
  Send,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Database,
  Key,
  CheckCircle2,
  SlidersHorizontal,
  Code
} from "lucide-react";

interface AgentArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PIPELINE_STAGES = [
  {
    id: 1,
    title: "1. Multimodal Perception & Frame Sampling",
    category: "Ingestion & Sensory Layer",
    icon: Video,
    color: "from-blue-500 to-cyan-500",
    badge: "Gemini 3.7 Flash Vision",
    latency: "< 850ms",
    description:
      "Continuous or static ingestion of workplace imagery. Samples camera frames every 1.5s during live streaming or processes high-res 4K drone/mobile snapshots with zero image degradation.",
    specs: [
      "Dynamic Resolution Scaling",
      "Real-time Interval Sampling (1.0s - 5.0s)",
      "Zero-Loss Base64 Tensor Ingestion",
      "Local Buffer & Offline Sync Queue"
    ]
  },
  {
    id: 2,
    title: "2. Spatial Vectoring & Coordinate Mapping",
    category: "Computer Vision Geometry",
    icon: Cpu,
    color: "from-violet-500 to-purple-500",
    badge: "Bounding Box Geometry",
    latency: "< 120ms",
    description:
      "Normalizes detected hazard regions into precise [ymin, xmin, ymax, xmax] percentage coordinates (0-100%). Maps directly onto SVG vector overlays regardless of aspect ratio or display viewport.",
    specs: [
      "Sub-pixel Bounding Localization",
      "Tri-Tier Risk Color Coding (Critical/High/Med)",
      "Dual Classification: Unsafe Act (UA) vs Unsafe Condition (UC)",
      "Interactive SVG Pulse Highlighting"
    ]
  },
  {
    id: 3,
    title: "3. Legal Reasoning & Standard Citation",
    category: "Regulatory Intelligence",
    icon: Building,
    color: "from-emerald-500 to-teal-500",
    badge: "Multi-Standard Engine",
    latency: "< 200ms",
    description:
      "Cross-references visual hazard context against international EHS regulatory bodies. Cites exact enforceable standard clauses without human manual lookup.",
    specs: [
      "OSHA 29 CFR 1910 / 1926 (General & Construction)",
      "ISO 45001:2018 §6.1.2 (Occupational Health & Safety)",
      "NFPA 101 / NFPA 70E (Life Safety & Arc Flash)",
      "ANSI / ISEA Z87.1 & Z89.1 (PPE Compliance)"
    ]
  },
  {
    id: 4,
    title: "4. Autonomous Triage & Action Dispatch",
    category: "Agentic Execution Layer",
    icon: Zap,
    color: "from-amber-500 to-orange-500",
    badge: "Autonomous Dispatch",
    latency: "Instant",
    description:
      "Does not wait for human prompt. Automatically generates formal CAPA Work Orders, calculates SLA countdowns, routes to assigned departments, and fires multi-channel SMS/Email/Webhook dispatches.",
    specs: [
      "Automated CAPA Work Order Generation",
      "Dynamic Priority SLA Calculation (24h/48h/5d)",
      "Automated Department Routing & Escalation",
      "Multi-Channel Dispatch (SMS, Email, ERP Webhook)"
    ]
  },
  {
    id: 5,
    title: "5. Closed-Loop 'Before vs. After' Verification",
    category: "Remediation Governance",
    icon: ShieldCheck,
    color: "from-green-500 to-emerald-600",
    badge: "Visual Proof of Fix",
    latency: "< 950ms",
    description:
      "Enforces verified resolution. When contractors submit a repair photo, the agent performs comparative visual auditing to confirm the hazard is eliminated before closing tickets in the central ledger.",
    specs: [
      "Side-by-Side Multimodal Comparative Analysis",
      "AI Confidence Scoring (0-100%)",
      "Residual Risk Detection",
      "Immutable Audit Ledger & PDF Dossier Generation"
    ]
  }
];

export default function AgentArchitectureModal({
  isOpen,
  onClose
}: AgentArchitectureModalProps) {
  const [activeStage, setActiveStage] = useState<number>(1);

  if (!isOpen) return null;

  const currentStage = PIPELINE_STAGES.find((s) => s.id === activeStage) || PIPELINE_STAGES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Autonomous Agent Pipeline Architecture
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Gemini 3.7 Flash &amp; Google Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400">
                End-to-end closed-loop visual perception, regulatory reasoning, and autonomous dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Pipeline Diagram Tracker */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* 5-Step Pipeline Breadcrumb Track */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {PIPELINE_STAGES.map((stg) => {
              const isSelected = stg.id === activeStage;
              const Icon = stg.icon;
              return (
                <button
                  key={stg.id}
                  onClick={() => setActiveStage(stg.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? "bg-slate-800/90 border-blue-500 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10"
                      : "bg-slate-950/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? `bg-gradient-to-br ${stg.color} text-white`
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{stg.latency}</span>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Stage {stg.id}
                    </span>
                    <span className="text-xs font-bold text-white block truncate">
                      {stg.title.split(". ")[1]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Deep-Dive Card */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br ${currentStage.color} text-white shadow-md`}
                >
                  <currentStage.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">{currentStage.title}</h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {currentStage.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{currentStage.badge}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <span>Avg. Execution Latency:</span>
                <span className="text-emerald-400 font-bold">{currentStage.latency}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
              {currentStage.description}
            </p>

            {/* Technical Specifications */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Technical Capabilities &amp; System Execution:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {currentStage.specs.map((spec, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hackathon Criteria Checklist */}
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/30 space-y-2">
            <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Hackathon Criteria Alignment (Taskmaster &amp; Enterprise Fleet Track)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
                <span className="font-bold text-white block mb-0.5"> Beyond Chat Loops:</span>
                Asynchronous visual perception, spatial geometry, and autonomous work order dispatch.
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
                <span className="font-bold text-white block mb-0.5"> Autonomous Action:</span>
                Calculates SLAs, generates dispatch payloads, and notifies maintenance leads automatically.
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
                <span className="font-bold text-white block mb-0.5"> Closed-Loop Verification:</span>
                Verifies physical fixes via "Before vs. After" comparative multimodal vision.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Code className="w-4 h-4 text-blue-400" />
            <span>Built on Gemini 3.7 Flash &amp; Google Cloud</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveStage((prev) => (prev > 1 ? prev - 1 : 5))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              Previous Stage
            </button>
            <button
              onClick={() => setActiveStage((prev) => (prev < 5 ? prev + 1 : 1))}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
            >
              <span>Next Stage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
