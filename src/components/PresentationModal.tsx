import React, { useState, useEffect } from "react";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Presentation, 
  Copy, 
  Check, 
  Cpu, 
  Activity, 
  BookOpen, 
  Shield, 
  Video, 
  Layers, 
  CheckCircle,
  AlertTriangle,
  FileText,
  Zap,
  Sparkles
} from "lucide-react";

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PresentationModal({ isOpen, onClose }: PresentationModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);

  // Keyboard navigation support
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Space") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentSlide]);

  if (!isOpen) return null;

  const slides = [
    {
      title: "Workplace Safety Monitor",
      subtitle: "Multi-Standard AI Computer Vision Compliance Engine",
      icon: <Presentation className="w-12 h-12 text-indigo-400" />,
      tag: "OVERVIEW",
      content: (
        <div className="space-y-6 text-center max-w-2xl mx-auto">
          <p className="text-base text-slate-300 leading-relaxed font-display">
            A state-of-the-art visual inspection application designed to automate industrial safety audits and instantly detect hazards, unsafe acts, and non-compliance conditions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
              <span className="text-xl font-bold text-white block">100%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Real-time Vision</span>
            </div>
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
              <span className="text-xl font-bold text-indigo-400 block">OSHA / ISO</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Regulatory Mapped</span>
            </div>
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
              <span className="text-xl font-bold text-white block">Gemini 2.0</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">AI Audited</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "The Core Problem & Our Solution",
      subtitle: "Automating Complex Industrial Auditing Processes",
      icon: <AlertTriangle className="w-12 h-12 text-rose-400" />,
      tag: "THE MISSION",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-400">The Challenge</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Manual safety inspection is slow, highly subjective, and prone to human oversight. Traditional audits fail to log incident histories or connect on-the-ground violations to specific regulatory standard references in real-time.
            </p>
          </div>
          <div className="space-y-4 bg-indigo-950/30 border border-indigo-500/20 p-5 rounded-2xl">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">The Solution</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Our <strong>Computer Vision Compliance Engine</strong> acts as a persistent co-auditor. It consumes live videos or high-resolution photos, overlaying high-fidelity interactive bounding boxes over hazards (such as spillages, scaffolding blocks, machinery hazards, or PPE misses) while logging issues immediately to a persistent safety ledger.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Operational Workflow",
      subtitle: "How to Use the Safety Monitor",
      icon: <Activity className="w-12 h-12 text-emerald-400" />,
      tag: "HOW TO OPERATE",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold">1</div>
            <div>
              <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">Audit Source</h5>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Choose real industrial scenarios (Spills, Machinery, Scaffolding, Egress) or feed live camera snapshots.</p>
            </div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold">2</div>
            <div>
              <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">Focus Target</h5>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Select a core compliance target like PPE, Fire Safety, HAZMAT, or General Housekeeping.</p>
            </div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold">3</div>
            <div>
              <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">AI Analysis</h5>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Multimodal computer vision reads visual frames and overlays custom interactive bounding boxes.</p>
            </div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold">4</div>
            <div>
              <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">Compliance Log</h5>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Explore OSHA / ISO regulations, commit logs to the ledger, and track active resolution statuses.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Architecture & Core Tech Stack",
      subtitle: "What the Compliance System is Built On",
      icon: <Cpu className="w-12 h-12 text-cyan-400" />,
      tag: "SYSTEM DESIGN",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">Software & Core Stack</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0">✓</span>
                <span><strong>React 18 & Vite:</strong> Ultra-fast, client-side hot reactivity, and structured rendering.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0">✓</span>
                <span><strong>Tailwind CSS:</strong> Highly responsive, high-contrast grid layouts and sleek custom glassmorphism components.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0">✓</span>
                <span><strong>TypeScript:</strong> Full-spectrum type safety across safety schemas, reports, issues, and log ledgers.</span>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">Core AI Capabilities</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold shrink-0">✓</span>
                <span><strong>Gemini Multimodal Vision API:</strong> Leverages advanced spatial computer vision models via secure server-side routes to extract visual coordinate blocks.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold shrink-0">✓</span>
                <span><strong>Persistent Database Logic:</strong> State-synchronized ledger history storing timestamps, hazard statistics, and resolution timelines.</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Regulatory Code Alignment",
      subtitle: "Global Safety Standard Integration",
      icon: <BookOpen className="w-12 h-12 text-purple-400" />,
      tag: "COMPLIANCE & CODES",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            The application dynamically checks detected hazards against rigorous local and international safety standard systems to give audits legal weight:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
              <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase">OSHA Codes</span>
              <p className="text-xs font-bold text-white pt-1">US Department of Labor</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">Auto-references 29 CFR standard parts, such as 1910.132 (PPE general) or 1910.22 (Housekeeping).</p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
              <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase">ISO Standard</span>
              <p className="text-xs font-bold text-white pt-1">ISO 45001 & 14001</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">Provides alignment with international occupational health, environmental, and safety management guidelines.</p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
              <span className="text-[10px] font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20 px-1.5 py-0.5 rounded uppercase">NFPA Standards</span>
              <p className="text-xs font-bold text-white pt-1">Fire Prevention codes</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">Integrates NFPA 101 Life Safety Code structures protecting personnel from egress blockades and hazards.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Autonomous Agent Actions & Closed-Loop Verification",
      subtitle: "From Passive Detection to Automated Remediation",
      icon: <Zap className="w-12 h-12 text-blue-400" />,
      tag: "AGENTIC CAPABILITY",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Unlike legacy software that merely alerts, our Autonomous Agent takes proactive action and verifies hazard elimination:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/70 p-4 rounded-xl border border-blue-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">⚡</div>
                <h5 className="text-xs font-bold text-white">Autonomous CAPA Dispatch</h5>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Calculates strict SLA deadlines (e.g., 4h for Critical, 24h for High), assigns certified departments (EHS/Facilities/Maintenance), and generates dispatch payloads (JSON, Email, SMS, Webhook).
              </p>
            </div>
            <div className="bg-slate-900/70 p-4 rounded-xl border border-purple-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">🔍</div>
                <h5 className="text-xs font-bold text-white">Multimodal "Before vs After" AI Verification</h5>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                When a fix photo is submitted, the agent runs comparative multimodal vision analysis to ensure the hazard is 100% eliminated before autonomously closing the audit ticket with full cryptographic provenance.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Conclusion & Sharing",
      subtitle: "Empowering Your Safety Culture Today",
      icon: <CheckCircle className="w-12 h-12 text-emerald-400" />,
      tag: "NEXT STEPS",
      content: (
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <p className="text-xs text-slate-300 leading-relaxed">
            The Workplace Safety Monitor transforms how safety officers, compliance teams, and field inspectors catalog hazard scenarios. It moves the needle from "reaction" to "proactive remediation."
          </p>
          <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl text-left text-xs text-slate-300 leading-relaxed flex items-start gap-3 mt-4">
            <span className="text-indigo-400 font-bold text-lg shrink-0 mt-0.5">💡</span>
            <div>
              <strong>Presentation Tip:</strong> You can present this slide deck directly in full-screen on your phone or tablet to demonstrate it live to your team. Use the copy button below to export the script text for standard slides inside Microsoft PowerPoint or Google Slides!
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  // PowerPoint Markdown text to copy
  const pptMarkdownText = `
# Slide 1: Workplace Safety Monitor
## Multi-Standard AI Computer Vision Compliance Engine
- **Overview**: A state-of-the-art visual inspection application designed to automate industrial safety audits.
- **Key Capabilities**: Real-time multi-hazard computer vision analytics, automated regulatory mapping (OSHA, NFPA, ISO), and active remediation tracking.

---

# Slide 2: The Core Problem & Our Solution
## Automating Complex Industrial Auditing Processes
- **The Challenge**: Manual safety inspections are slow, subjective, prone to oversight, and separate physical hazards from safety regulations.
- **The Solution**: Computer Vision Compliance Engine acts as a persistent co-auditor. It analyzes live feeds and high-resolution photos, overlaying interactive bounding boxes directly over hazards (spills, egress blocking, PPE misses, machinery hazards) while archiving reports to a safety ledger.

---

# Slide 3: Operational Workflow
## How to Use the Safety Monitor
1. **Audit Source**: Ingest a preset industrial seed scenario (Spills, Machinery, Scaffolding, Egress) or stream live snapshots.
2. **Target Safety Focus**: Direct the AI's hazard audit parameters to focus on specific regulations (PPE, Fire Egress, Slips & Trips, Machinery).
3. **Analyze & Map**: The AI multimodal computer vision reads coordinates and overlays custom visual warnings.
4. **Remediation**: Explore OSHA codes, assign progress statuses, and archive to a local safety log history.

---

# Slide 4: Architecture & Core Tech Stack
## What the Compliance System is Built On
- **React 18 & Vite**: Fast responsive web application interface, high-fidelity layouts, and reactive local states.
- **TypeScript**: Complete type safety for safety issue structures, score engines, and historical logs.
- **Tailwind CSS**: Sleek, customizable ambient mesh glassmorphism themes designed for high visual contrast and readability.
- **AI Core**: Multi-modal Gemini API processing coordinates and safety parameters.

---

# Slide 5: Regulatory Code Alignment
## Global Safety Standard Integration
- **OSHA Standards**: Automatic mapping to US Department of Labor compliance rules (e.g., 29 CFR 1910.22 for Housekeeping or 1910.132 for PPE).
- **ISO Guidelines**: Cross-references ISO 45001 (Occupational Health & Safety) and ISO 14001 (Environmental) systems.
- **NFPA Rules**: Direct referencing to NFPA 101 Life Safety Code safeguarding clear fire escape paths.

---

# Slide 6: Autonomous Agent Actions & Closed-Loop Verification
## Self-Executing EHS Remediation Lifecycle
- **Autonomous Dispatch**: Automated Work Orders with real-time countdown SLA clocks, priority routing, and multi-channel notification.
- **Multimodal Comparative AI**: "Before vs After" computer vision validation ensures hazards are truly resolved before closing tickets.

---

# Slide 7: Conclusion & Operational Sharing
## Building a Proactive Safety Culture
- Move from reactive incident logging to proactive, computer-guided hazard remediation.
- Shareable local deployment format is perfect for immediate mobile audits or distributed workplace inspections with colleagues.
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pptMarkdownText.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeSlideObj = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {/* Container */}
      <div 
        className="glass-panel border border-white/10 rounded-2xl max-w-4xl w-full flex flex-col justify-between overflow-hidden shadow-2xl relative bg-slate-900/95"
        style={{ height: "600px" }}
      >
        {/* Visual mesh accent in presentation */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-500/5 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2.5">
            <Presentation className="w-5 h-5 text-indigo-400" />
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">Team Presentation Companion</span>
              <h2 className="text-sm font-bold text-white">Interactive Slide Deck</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Presentation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Slide Body */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col justify-center relative z-10">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            {/* Tag & Icon */}
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {activeSlideObj.tag}
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-bold">Slide {currentSlide + 1} of {slides.length}</span>
            </div>

            {/* Slide Title */}
            <div className="space-y-1">
              <div className="flex items-center gap-4">
                <div className="shrink-0 p-2 bg-white/5 border border-white/5 rounded-xl shadow-inner">
                  {activeSlideObj.icon}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight text-white font-display">
                    {activeSlideObj.title}
                  </h3>
                  <p className="text-xs text-indigo-300 font-semibold font-sans">
                    {activeSlideObj.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Slide Content */}
            <div className="pt-2 animate-fade-in text-slate-200">
              {activeSlideObj.content}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/5 h-1">
          <div 
            className="bg-indigo-500 h-1 transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          />
        </div>

        {/* Controls Footer */}
        <div className="p-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 bg-slate-900/60">
          {/* Slidescript copying utility */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 hover:text-white border border-indigo-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer w-full sm:w-auto justify-center"
            title="Copy PPT Slide Deck Script to Clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 animate-scale-up" />
                <span>Slide Deck Script Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy PPT Slide Script</span>
              </>
            )}
          </button>

          {/* Nav buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentSlide === 0
                  ? "opacity-40 border-white/5 text-slate-500 pointer-events-none"
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="text-xs text-slate-400 font-bold font-mono px-2">
              {currentSlide + 1} / {slides.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentSlide === slides.length - 1}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentSlide === slides.length - 1
                  ? "opacity-40 border-white/5 text-slate-500 pointer-events-none"
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white"
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
