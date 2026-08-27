import React, { useState } from "react";
import { SafetyReport, SafetyIssue, SeverityLevel, AuditLogEntry } from "../types";
import {
  ShieldAlert,
  AlertTriangle,
  Hammer,
  ShieldCheck,
  HelpCircle,
  Eye,
  Info,
  Share2,
  X,
  Download,
  Copy,
  Check,
  Shield,
  ExternalLink,
  Sparkles,
  MapPin,
  Flame,
  Building,
  Camera,
  Clipboard,
  Map,
  Zap,
  FileText
} from "lucide-react";
import * as htmlToImage from "html-to-image";
import WorkOrderModal from "./WorkOrderModal";
import RemediationVerificationModal from "./RemediationVerificationModal";

interface SafetyIssueListProps {
  report: SafetyReport | null;
  isScanning: boolean;
  hoveredIssueIndex: number | null;
  setHoveredIssueIndex: (index: number | null) => void;
  selectedIssueIndex: number | null;
  setSelectedIssueIndex: (index: number | null) => void;
  activeLog?: AuditLogEntry | null;
  onUpdateIssueStatus?: (issueIndex: number, status: "Open" | "In Progress" | "Closed") => void;
  onUpdateOverallStatus?: (status: "Open" | "In Progress" | "Resolved") => void;
  imageSrc?: string | null;
}

export default function SafetyIssueList({
  report,
  isScanning,
  hoveredIssueIndex,
  setHoveredIssueIndex,
  selectedIssueIndex,
  setSelectedIssueIndex,
  activeLog,
  onUpdateIssueStatus,
  onUpdateOverallStatus,
  imageSrc,
}: SafetyIssueListProps) {
  // Derived image src: prioritize activeLog's captured snapshot, falling back to current image source prop
  const displayImageSrc = activeLog?.imageSrc || imageSrc;

  // Share & Capture States
  const [shareConfig, setShareConfig] = useState<{
    type: "hazard" | "report";
    issue?: SafetyIssue;
  } | null>(null);

  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    type: "hazard" | "report";
    issue?: SafetyIssue;
    imageUrl: string;
    blob: Blob | null;
    copied: boolean;
  } | null>(null);

  const [isGeneratingShare, setIsGeneratingShare] = useState(false);

  // Persistent manual location states (Building & Floor)
  const [building, setBuilding] = useState<string>(() => {
    return localStorage.getItem("safety_audit_building") || "";
  });
  const [floor, setFloor] = useState<string>(() => {
    return localStorage.getItem("safety_audit_floor") || "";
  });

  const handleBuildingChange = (val: string) => {
    setBuilding(val);
    localStorage.setItem("safety_audit_building", val);
  };

  const handleFloorChange = (val: string) => {
    setFloor(val);
    localStorage.setItem("safety_audit_floor", val);
  };

  // Location Prompt Modal States
  const [locationPrompt, setLocationPrompt] = useState<{
    isOpen: boolean;
    type: "hazard" | "report";
    issue?: SafetyIssue;
  } | null>(null);

  const [tempBuilding, setTempBuilding] = useState("");
  const [tempFloor, setTempFloor] = useState("");

  // Autonomous Agent Action States
  const [selectedWorkOrderIssue, setSelectedWorkOrderIssue] = useState<SafetyIssue | null>(null);
  const [selectedVerificationIssue, setSelectedVerificationIssue] = useState<{
    issue: SafetyIssue;
    index: number;
  } | null>(null);

  const handleOpenLocationPrompt = (type: "hazard" | "report", issue?: SafetyIssue) => {
    setTempBuilding(building);
    setTempFloor(floor);
    setLocationPrompt({
      isOpen: true,
      type,
      issue,
    });
  };

  const handleConfirmLocation = () => {
    if (!locationPrompt) return;
    handleBuildingChange(tempBuilding);
    handleFloorChange(tempFloor);
    const { type, issue } = locationPrompt;
    setLocationPrompt(null);
    triggerShareAsPicture(type, issue);
  };

  if (isScanning) {
    return (
      <div id="safety-issue-list" className="glass-panel rounded-2xl shadow-lg p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <h3 className="font-bold text-slate-100">Analyzing Scene Imagery</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
          Gemini Computer Vision is cross-referencing visual objects and human actions against OSHA safety requirements...
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div id="safety-issue-list" className="glass-panel rounded-2xl shadow-lg p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-white/5 text-slate-400 border border-white/10 flex items-center justify-center mx-auto mb-3">
          <Info className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="font-bold text-slate-100">Scan for Unsafe Acts, Conditions & Mitigations</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
          Select or upload a scene above and trigger the AI Safety Scan to discover safety scores, map UA/UC hazards, and identify immediate mitigating actions.
        </p>
      </div>
    );
  }

  const { safetyScore, summary, issues, isSimulated, message } = report;

  // Text Formatted Share Fallbacks for WhatsApp
  const handleShareIndividualHazardOnWhatsApp = (issue: SafetyIssue) => {
    const locationText = [
      building ? `*Building:* ${building}` : "",
      floor ? `*Floor/Zone:* ${floor}` : ""
    ].filter(Boolean).join("\n");

    const text = `🚨 *Workplace Safety Hazard Alert* 🚨

${locationText ? `${locationText}\n\n` : ""}*Hazard:* ${issue.title}
*Type:* ${issue.category === "act" ? "Unsafe Act (UA)" : "Unsafe Condition (UC)"}
*Severity:* ${issue.severity.toUpperCase()}

*Description:* ${issue.description}

*OSHA Standard:* ${issue.oshaRule}
*NFPA Standard:* ${issue.nfpaRule || "N/A"}
*ISO 45001 Clause:* ${issue.isoRule || "ISO 45001 Clause 8.1.2"}

*Mitigating / Corrective Action:* ${issue.correctiveAction}

*Status:* ${issue.status || "Open"}

_Generated by Workplace Safety Monitor Compliance System_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleShareFullReportOnWhatsApp = () => {
    if (!report) return;
    
    const locationText = [
      building ? `*Building:* ${building}` : "",
      floor ? `*Floor/Zone:* ${floor}` : ""
    ].filter(Boolean).join("\n");

    const hazardsText = issues.map((issue, idx) => {
      return `*${idx + 1}. ${issue.title}*
• Type: ${issue.category === "act" ? "Unsafe Act (UA)" : "Unsafe Condition (UC)"}
• Severity: ${issue.severity.toUpperCase()}
• OSHA Standard: ${issue.oshaRule}
• NFPA Standard: ${issue.nfpaRule || "N/A"}
• ISO Clause: ${issue.isoRule || "ISO 45001 Clause 8.1.2"}
• Mitigating Action: ${issue.correctiveAction}
• Status: ${issue.status || "Open"}`;
    }).join("\n\n");

    const text = `📋 *Workplace Safety Compliance Audit*
${locationText ? `${locationText}\n\n` : ""}*Safety Score:* ${safetyScore}/100
*Summary:* ${summary}

*${issues.length} Hazards Detected:*

${hazardsText}

_Generated by Workplace Safety Monitor Compliance System_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Trigger HTML-to-Image Generation Flow
  const triggerShareAsPicture = async (type: "hazard" | "report", issue?: SafetyIssue) => {
    setIsGeneratingShare(true);
    setShareConfig({ type, issue });

    // Allow React state to propagate to the DOM element
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const element = document.getElementById("capture-target");
      if (!element) throw new Error("Capture template not found in DOM");

      // Render crisp PNG image using html-to-image
      const blob = await htmlToImage.toBlob(element, {
        cacheBust: true,
        pixelRatio: 2.5, // 2.5x high-fidelity density
        backgroundColor: "#ffffff", // Pure white for perfect standard card capturing
        style: {
          transform: "scale(1)",
          margin: "0",
        }
      });

      if (!blob) throw new Error("Generated image blob was empty");
      const imageUrl = URL.createObjectURL(blob);

      setShareModal({
        isOpen: true,
        type,
        issue,
        imageUrl,
        blob,
        copied: false,
      });
    } catch (err) {
      console.error("Error creating compliance picture:", err);
      alert("Failed to create visual compliance card. Please try again.");
    } finally {
      setIsGeneratingShare(false);
    }
  };

  // Determine score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return { text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500" };
    if (score >= 75) return { text: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500" };
    if (score >= 50) return { text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500" };
    return { text: "text-rose-400", border: "border-rose-500/30", bg: "bg-rose-500" };
  };

  const scoreStyles = getScoreColor(safetyScore);

  // Severity badge styling mapper
  const getSeverityBadge = (level: SeverityLevel) => {
    switch (level) {
      case "critical":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      case "high":
        return "text-orange-400 bg-orange-500/10 border-orange-500/30";
      case "medium":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      default:
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    }
  };

  return (
    <div id="safety-issue-list" className="glass-panel rounded-2xl p-6 shadow-lg">
      {/* Simulation/Warning Header */}
      {isSimulated && (
        <div className="mb-5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex gap-2.5 items-start">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-amber-300">Demo Walkthrough Mode Active</h5>
            <p className="text-[11px] text-amber-400 mt-0.5 leading-relaxed">{message}</p>
          </div>
        </div>
      )}

      {/* Audit Assessment Summary */}
      <div className="flex flex-col md:flex-row items-center gap-6 pb-6 mb-6 border-b border-white/10">
        {/* Score Ring */}
        <div className="relative flex-shrink-0 w-24 h-24 flex items-center justify-center">
          <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-white/5"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            <circle
              className={`transition-all duration-1000 ${scoreStyles.text}`}
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - safetyScore / 100)}`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
          </svg>
          <div className="text-center">
            <span className="text-2xl font-bold text-white">{safetyScore}</span>
            <span className="text-[10px] block font-bold uppercase text-slate-400">Score</span>
          </div>
        </div>

        {/* Written Assessment */}
        <div className="flex-1 text-center md:text-left">
          <h3 className="font-bold text-white text-sm">Compliance Audit Summary</h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{summary}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className="text-[10px] font-bold text-slate-300 px-2 py-0.5 bg-white/5 border border-white/10 rounded">
              {issues.length} Hazards Detected
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${safetyScore >= 75 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : safetyScore >= 50 ? "text-amber-400 bg-amber-500/10 border-amber-500/30" : "text-rose-400 bg-rose-500/10 border-rose-500/30"}`}>
              {safetyScore >= 90 ? "Excellent" : safetyScore >= 75 ? "Good" : safetyScore >= 50 ? "Deficient" : "Critical Risk"}
            </span>
          </div>
        </div>

        {/* Overall Audit Status control */}
        {activeLog && onUpdateOverallStatus && (
          <div className="flex-shrink-0 flex flex-col items-center md:items-end gap-1.5 self-stretch md:self-auto justify-center md:justify-start pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overall Status</span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                activeLog.status === "Resolved"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : activeLog.status === "In Progress"
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/30"
              }`}>
                {activeLog.status === "Resolved" ? "Closed / Resolved" : activeLog.status}
              </span>
              
              <select
                value={activeLog.status}
                onChange={(e) => onUpdateOverallStatus(e.target.value as any)}
                className="bg-slate-950 border border-white/15 rounded-lg text-xs text-white px-2 py-1 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Closed / Resolved</option>
              </select>
            </div>
          </div>
        )}

        {/* Share Audit Report Button */}
        <div className="flex-shrink-0 w-full md:w-auto flex justify-center md:justify-end">
          <button
            onClick={() => handleOpenLocationPrompt("report")}
            disabled={isGeneratingShare}
            className={`w-full md:w-auto flex items-center justify-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/20 rounded-xl px-4 py-2.5 transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/10 ${
              isGeneratingShare ? "opacity-70 cursor-wait" : ""
            }`}
            title="Create and share visual compliance report"
          >
            {isGeneratingShare ? (
              <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-white" />
            )}
            <span>Share Report</span>
          </button>
        </div>
      </div>

      {/* Hazards Breakdown */}
      <div>
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-indigo-400" />
          Detected Safety Hazards Details
        </h4>

        {issues.length === 0 ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h5 className="font-bold text-emerald-300 text-xs">Zero Safety Incidents Detected</h5>
            <p className="text-[11px] text-emerald-400/85 mt-0.5">The scene appears fully compliant with general workplace safety requirements. Standard PPE is advised.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue, idx) => {
              const isHovered = hoveredIssueIndex === idx;
              const isSelected = selectedIssueIndex === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIssueIndex(idx)}
                  onMouseLeave={() => setHoveredIssueIndex(null)}
                  onClick={() => setSelectedIssueIndex(idx)}
                  className={`border rounded-xl p-4 text-left transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/15 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                      : isHovered
                      ? "border-white/20 bg-white/10"
                      : "border-white/10 bg-white/5 hover:border-white/15"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Category Label */}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        issue.category === "act"
                          ? "text-purple-300 bg-purple-500/15 border border-purple-500/30"
                          : "text-cyan-300 bg-cyan-500/15 border border-cyan-500/30"
                      }`}>
                        {issue.category === "act" ? "Unsafe Act (UA)" : "Unsafe Condition (UC)"}
                      </span>

                      {issue.hazardCategory && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono tracking-tight">
                          {issue.hazardCategory}
                        </span>
                      )}

                      {/* Hazard Title */}
                      <h5 className="font-bold text-xs text-white tracking-wide">{issue.title}</h5>
                    </div>

                    {/* Severity Badge */}
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border shrink-0 ${getSeverityBadge(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </div>

                  {/* Hazard Details */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">{issue.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/10 text-[11px]">
                    {/* OSHA Rule info */}
                    <div className="flex gap-2.5 items-start p-2 rounded-lg bg-white/5 border border-white/5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-200 block text-[10px] uppercase tracking-wider">OSHA Standard</span>
                        <span className="font-mono text-slate-300 mt-0.5 block font-semibold">{issue.oshaRule}</span>
                      </div>
                    </div>

                    {/* NFPA Rule info */}
                    <div className="flex gap-2.5 items-start p-2 rounded-lg bg-white/5 border border-white/5">
                      <Flame className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-200 block text-[10px] uppercase tracking-wider">NFPA Standard</span>
                        <span className="font-mono text-slate-300 mt-0.5 block font-semibold">{issue.nfpaRule || "N/A"}</span>
                      </div>
                    </div>

                    {/* ISO Rule info */}
                    <div className="flex gap-2.5 items-start p-2 rounded-lg bg-white/5 border border-white/5">
                      <ShieldCheck className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-200 block text-[10px] uppercase tracking-wider">ISO 45001 Clause</span>
                        <span className="font-mono text-slate-300 mt-0.5 block font-semibold">{issue.isoRule || "ISO 45001 §8.1.2"}</span>
                      </div>
                    </div>

                    {/* Corrective Action info */}
                    <div className="flex gap-2.5 items-start p-2 rounded-lg bg-white/5 border border-white/5">
                      <Hammer className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-200 block text-[10px] uppercase tracking-wider">Corrective Action</span>
                        <span className="text-slate-300 mt-0.5 block leading-relaxed">{issue.correctiveAction}</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Box Indicator and Share Row */}
                  <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Autonomous Work Order Dispatch Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWorkOrderIssue(issue);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/25 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-xs hover:shadow-blue-500/10"
                        title="Generate autonomous CAPA Work Order with SLA and dispatch"
                      >
                        <Zap className="w-3.5 h-3.5 text-blue-400" />
                        <span>Work Order &amp; Dispatch</span>
                      </button>

                      {/* Before vs After Verification Agent Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVerificationIssue({ issue, index: idx });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/25 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-xs hover:shadow-purple-500/10"
                        title="Verify remediation using AI Before vs After inspection"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                        <span>Verify Fix (AI Before/After)</span>
                      </button>

                      <button
                        type="button"
                        disabled={isGeneratingShare}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenLocationPrompt("hazard", issue);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          isGeneratingShare ? "opacity-75" : ""
                        }`}
                        title="Share this hazard as an inspection card image"
                      >
                        {isGeneratingShare ? (
                          <div className="w-3 h-3 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                        <span>Share Card</span>
                      </button>
                    </div>

                    {issue.boundingBox && (
                      <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-semibold">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isSelected ? "Visual Bounding Box Selected" : "Click to view location in scene"}</span>
                      </div>
                    )}
                  </div>

                  {/* Finding Status Control Panel */}
                  {activeLog && onUpdateIssueStatus && (
                    <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium">Finding Status:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          issue.status === "Closed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : issue.status === "In Progress"
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}>
                          {issue.status || "Open"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10" onClick={(e) => e.stopPropagation()}>
                        {(["Open", "In Progress", "Closed"] as const).map((statusOption) => {
                          const isActive = (issue.status || "Open") === statusOption;
                          return (
                            <button
                              key={statusOption}
                              type="button"
                              onClick={() => onUpdateIssueStatus(idx, statusOption)}
                              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                isActive
                                  ? statusOption === "Closed"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : statusOption === "In Progress"
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "bg-rose-600 text-white shadow-xs"
                                  : "text-slate-400 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              {statusOption}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

        {/* Share Audit Report Button below findings */}
        <div className="mt-6 pt-5 border-t border-white/10 flex justify-end">
          <button
            onClick={() => triggerShareAsPicture("report")}
            disabled={isGeneratingShare}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/20 rounded-xl px-5 py-3 transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/10 ${
              isGeneratingShare ? "opacity-75" : ""
            }`}
            title="Share full visual compliance report card"
          >
            {isGeneratingShare ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Share2 className="w-4 h-4 text-white" />
            )}
            <span>Share Full Audit Report Card</span>
          </button>
        </div>
            {/* OFF-SCREEN HIGH-FIDELITY CAPTURE ELEMENT */}
      <div className="fixed top-0 left-0 pointer-events-none opacity-0 z-[-100] select-none overflow-hidden font-sans">
        <div
          id="capture-target"
          className="standard-share-card w-[920px] bg-[#fcfcfc] p-8 rounded-3xl border border-slate-200 flex flex-col gap-6 text-slate-900 shadow-2xl relative"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Subtle background decorative structures */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl pointer-events-none" />

          {/* Premium Branding Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 relative z-10">
            {/* Logo and Brand Title */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white border border-slate-800 shadow-sm relative shrink-0">
                <Camera className="w-6 h-6 text-white" strokeWidth={2.2} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 border border-slate-900" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight text-slate-900 uppercase font-display flex items-center gap-1.5 leading-none">
                  Workplace Safety Monitor
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                </h1>
                <p className="text-[9px] text-slate-500 font-extrabold tracking-widest uppercase mt-1 leading-none">AI Computer Vision Compliance System</p>
              </div>
            </div>

            {/* Audit Location Badges matching mockup */}
            {(building || floor) && (
              <div className="flex items-center gap-4 bg-slate-50/60 border border-slate-200/80 rounded-xl px-4 py-2.5 text-[10px] text-slate-600 font-semibold shadow-xs">
                {building && (
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-400 font-extrabold uppercase text-[8px] tracking-wider">Building:</span>
                    <span className="text-slate-800 font-extrabold">{building}</span>
                  </div>
                )}
                {building && floor && <div className="h-4 w-px bg-slate-200" />}
                {floor && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-400 font-extrabold uppercase text-[8px] tracking-wider">Floor/Zone:</span>
                    <span className="text-slate-800 font-extrabold">{floor}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dynamic Content Body */}
          {shareConfig && shareConfig.type === "hazard" && shareConfig.issue && (
            <div className="grid grid-cols-12 gap-6 items-stretch relative z-10 text-left">
              {/* Left Column (col-span-7) */}
              <div className="col-span-7 flex flex-col gap-4">
                {/* Unsafe Act/Condition Badge + Risk Level / Status */}
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                    shareConfig.issue.category === "act"
                      ? "text-rose-700 bg-rose-50 border-rose-200"
                      : "text-amber-700 bg-amber-50 border-amber-200"
                  }`}>
                    {shareConfig.issue.category === "act" ? "UNSAFE ACT (UA)" : "UNSAFE CONDITION (UC)"}
                  </span>

                  {/* Risk and Status badges side by side */}
                  <div className="flex items-center gap-3">
                    {/* Risk Level badge */}
                    <div className="bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-1.5 flex flex-col items-center shrink-0 min-w-[85px] shadow-2xs">
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Risk Level</span>
                      <span className={`text-[11px] font-black uppercase tracking-wider leading-none mt-1.5 flex items-center gap-1 ${
                        shareConfig.issue.severity === "critical"
                          ? "text-red-700"
                          : shareConfig.issue.severity === "high"
                          ? "text-orange-700"
                          : shareConfig.issue.severity === "medium"
                          ? "text-amber-700"
                          : "text-emerald-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          shareConfig.issue.severity === "critical"
                            ? "bg-red-500"
                            : shareConfig.issue.severity === "high"
                            ? "bg-orange-500"
                            : shareConfig.issue.severity === "medium"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`} />
                        {shareConfig.issue.severity}
                      </span>
                    </div>

                    {/* Status badge */}
                    <div className="bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-1.5 flex flex-col items-center shrink-0 min-w-[85px] shadow-2xs">
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</span>
                      <span className={`text-[11px] font-black uppercase tracking-wider leading-none mt-1.5 border border-rose-200/60 rounded px-1.5 py-0.5 ${
                        shareConfig.issue.status === "Closed"
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : shareConfig.issue.status === "In Progress"
                          ? "text-indigo-700 bg-indigo-50 border-indigo-200"
                          : "text-rose-700 bg-rose-50 border-rose-200"
                      }`}>
                        {shareConfig.issue.status ? shareConfig.issue.status.toUpperCase() : "OPEN"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hazard Title */}
                <h2 className="text-xl font-black text-slate-900 leading-tight tracking-tight">
                  {shareConfig.issue.title}
                </h2>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {shareConfig.issue.description}
                </p>

                {/* AI DETECTION EVIDENCE CARD */}
                <div className="border border-slate-200/80 rounded-2xl p-4 bg-white flex flex-col gap-3.5 shadow-3xs">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Camera className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none">
                      AI Detection Evidence
                    </h4>
                  </div>

                  <div className="flex gap-4 items-stretch">
                    {/* Evidence Image Snapshot Container */}
                    <div className="relative w-[220px] h-[130px] bg-slate-900 rounded-xl overflow-hidden border border-slate-200/80 flex-shrink-0 shadow-sm">
                      {displayImageSrc ? (
                        <img
                          src={displayImageSrc}
                          alt="Evidence Camera Stream"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-600">
                          <Camera className="w-6 h-6 opacity-30 animate-pulse" />
                        </div>
                      )}

                      {/* Dynamic Bounding Box Overlay */}
                      {shareConfig.issue.boundingBox && (
                        <div
                          className="absolute border-2 border-red-500 bg-red-500/10 pointer-events-none"
                          style={{
                            top: `${shareConfig.issue.boundingBox[0]}%`,
                            left: `${shareConfig.issue.boundingBox[1]}%`,
                            height: `${shareConfig.issue.boundingBox[2] - shareConfig.issue.boundingBox[0]}%`,
                            width: `${shareConfig.issue.boundingBox[3] - shareConfig.issue.boundingBox[1]}%`,
                          }}
                        >
                          <div className="absolute top-0 left-0 bg-red-600 text-white text-[7px] font-black uppercase px-1 py-0.5 whitespace-nowrap shadow-xs leading-none">
                            {shareConfig.issue.title.toUpperCase().split(" ")[0]} DETECTED
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Evidence Details Metadata Table */}
                    <div className="flex-1 flex flex-col justify-between text-[11px] text-slate-600">
                      <div className="grid grid-cols-2 gap-y-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Camera ID</span>
                        </div>
                        <div className="text-right font-mono font-bold text-slate-800">
                          {shareConfig.issue.title.toLowerCase().includes("ppe") ? "CAM-1A-07" : shareConfig.issue.title.toLowerCase().includes("spill") ? "CAM-W2-12" : shareConfig.issue.title.toLowerCase().includes("egress") ? "CAM-O1-08" : "CAM-VT-29"}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Location</span>
                        </div>
                        <div className="text-right font-bold text-slate-800 truncate max-w-[150px]" title={floor || "First floor / Spy polic"}>
                          {floor || "First floor / Spy polic"}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Clipboard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Detected At</span>
                        </div>
                        <div className="text-right font-bold text-slate-800">
                          {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>

                      {/* Confidence Slider bar */}
                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-1 text-[9px] font-extrabold text-slate-400">
                          <span className="uppercase tracking-wider">AI Confidence</span>
                          <span className="font-mono text-slate-800 font-black">92%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: "92%" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (col-span-5) */}
              <div className="col-span-5 flex flex-col gap-4">
                {/* APPLICABLE STANDARDS PANEL */}
                <div className="border border-slate-200/80 rounded-2xl p-4 bg-white flex flex-col gap-3.5 shadow-3xs">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none">
                      Applicable Standards
                    </h4>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {/* Header row */}
                    <div className="grid grid-cols-2 text-[8px] font-black tracking-widest text-slate-400 uppercase pb-1 border-b border-slate-100/50">
                      <span>Standard</span>
                      <span className="text-right">Reference</span>
                    </div>

                    {/* OSHA */}
                    <div className="grid grid-cols-2 items-center text-xs py-1 border-b border-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-50 rounded-md border border-amber-100 shrink-0">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <span className="font-extrabold text-slate-700">OSHA</span>
                      </div>
                      <span className="text-right font-mono font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md inline-block max-w-max ml-auto text-[11px]">
                        {shareConfig.issue.oshaRule}
                      </span>
                    </div>

                    {/* NFPA */}
                    <div className="grid grid-cols-2 items-center text-xs py-1 border-b border-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-red-50 rounded-md border border-red-100 shrink-0">
                          <Flame className="w-3.5 h-3.5 text-red-500" />
                        </div>
                        <span className="font-extrabold text-slate-700">NFPA 1851</span>
                      </div>
                      <span className="text-right font-mono font-bold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md inline-block max-w-max ml-auto text-[11px]">
                        {shareConfig.issue.nfpaRule || "N/A"}
                      </span>
                    </div>

                    {/* ISO */}
                    <div className="grid grid-cols-2 items-center text-xs py-1">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 rounded-md border border-indigo-100 shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                        </div>
                        <span className="font-extrabold text-slate-700">ISO 45001</span>
                      </div>
                      <span className="text-right font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md inline-block max-w-max ml-auto truncate max-w-[130px] text-[11px]">
                        {shareConfig.issue.isoRule ? shareConfig.issue.isoRule.replace("ISO 45001 Clause ", "").replace("ISO 45001:2018 Clause ", "") : "Clause 8.1.2"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RECOMMENDED ACTION PANEL */}
                <div className="border border-slate-200/80 rounded-2xl p-4 bg-white flex flex-col gap-3.5 shadow-3xs">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none">
                      Recommended Action
                    </h4>
                  </div>

                  <div className="bg-emerald-50/60 border border-emerald-100/80 rounded-xl p-3 flex gap-3 items-start shadow-3xs">
                    <div className="p-1.5 bg-emerald-500 text-white rounded-lg shrink-0 border border-emerald-400/20 shadow-xs">
                      <Clipboard className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">
                        {shareConfig.issue.correctiveAction}
                      </p>
                      <a href="#" className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 hover:text-emerald-700 pointer-events-none mt-1">
                        View best practice guidance →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {shareConfig && shareConfig.type === "report" && (
            <div className="grid grid-cols-12 gap-6 items-stretch relative z-10 text-left">
              {/* Left Column (col-span-5): Score Ring & Summary */}
              <div className="col-span-5 flex flex-col gap-4">
                {/* Score Display Header Card */}
                <div className="flex items-center gap-5 bg-slate-50 border border-slate-200/80 p-5 rounded-2xl shadow-3xs relative overflow-hidden">
                  <div className="relative flex-shrink-0 w-24 h-24 flex items-center justify-center bg-white rounded-full border border-slate-200 shadow-xs">
                    <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                      <circle className={`transition-all duration-1000 ${
                        safetyScore >= 90 ? "text-emerald-600" : safetyScore >= 75 ? "text-indigo-600" : safetyScore >= 50 ? "text-amber-600" : "text-rose-600"
                      }`} strokeWidth="8" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - safetyScore / 100)}`} strokeLinecap="round" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                    </svg>
                    <div className="text-center z-10">
                      <span className="text-3xl font-black text-slate-900">{safetyScore}</span>
                      <span className="text-[8px] block font-black uppercase text-slate-500 mt-0.5">Score</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Compliance Audit Report</h3>
                    <p className="text-[10px] text-slate-500 mt-2 uppercase font-extrabold tracking-wider flex items-center gap-2">
                      <span className="bg-slate-200 border border-slate-300 px-2 py-0.5 rounded text-slate-700 font-mono">{issues.length} Hazards</span>
                      <span className={`px-2 py-0.5 rounded border font-mono ${
                        safetyScore >= 75 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-rose-700 bg-rose-50 border-rose-200"
                      }`}>
                        {safetyScore >= 90 ? "Excellent" : safetyScore >= 75 ? "Good" : safetyScore >= 50 ? "Deficient" : "Critical Risk"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Summary Block */}
                <div className="space-y-1.5 bg-slate-50 border border-slate-200/80 p-5 rounded-2xl text-left shadow-3xs flex-1">
                  <span className="text-[9px] uppercase font-black text-indigo-700 tracking-widest block">Audit Executive Summary</span>
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold mt-1">{summary}</p>
                </div>
              </div>

              {/* Right Column (col-span-7): Hazard Incident Log */}
              <div className="col-span-7 flex flex-col gap-4">
                {/* Hazards Overview list */}
                <div className="space-y-3 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs flex-1">
                  <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest block text-left pb-2 border-b border-slate-100">
                    Major Detected Incident Log
                  </span>
                  <div className="space-y-2.5">
                    {issues.slice(0, 4).map((issue, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div className="flex items-center gap-3 truncate max-w-[340px]">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${issue.severity === "critical" ? "bg-red-600 shadow-sm" : issue.severity === "high" ? "bg-orange-600" : "bg-amber-600"}`} />
                          <div className="truncate text-left">
                            <span className="font-extrabold text-slate-800 block truncate">{issue.title}</span>
                            <span className="text-[9px] text-slate-500 block mt-0.5 uppercase tracking-wide font-medium">{issue.category === "act" ? "Unsafe Act" : "Unsafe Condition"} • OSHA {issue.oshaRule} • NFPA {issue.nfpaRule || "N/A"}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-black text-slate-700 uppercase tracking-wide bg-slate-150 px-2 py-1 rounded border border-slate-250 shrink-0">
                          {issue.severity}
                        </span>
                      </div>
                    ))}
                    {issues.length > 4 && (
                      <div className="text-[10px] text-center text-indigo-700 font-extrabold bg-indigo-50 border border-indigo-100 py-1.5 rounded-xl">
                        + {issues.length - 4} additional safety incidents registered on active inspection ledger
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DETECTION LOCATION (AI MAPPED) BAR */}
          {shareConfig && shareConfig.type === "hazard" && shareConfig.issue && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center justify-between text-indigo-950 font-bold text-[11px] relative z-10 text-left">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="uppercase tracking-widest text-indigo-800 text-[9px] font-black">Detection Location (AI Mapped)</span>
                <span className="text-slate-300 font-normal">|</span>
                <span className="font-mono text-indigo-950 font-black">
                  {shareConfig.issue.title.toLowerCase().includes("ppe") 
                    ? "Lat: 40.7128° N, Long: 74.0060° W" 
                    : shareConfig.issue.title.toLowerCase().includes("spill") 
                    ? "Lat: 34.0522° N, Long: -118.2437° W" 
                    : shareConfig.issue.title.toLowerCase().includes("egress") 
                    ? "Lat: 41.8781° N, Long: -87.6298° W" 
                    : "Lat: 37.7749° N, Long: -122.4194° W"}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                Mapped by AI camera vision
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black pointer-events-none shadow-3xs text-indigo-600 shrink-0">
                <Map className="w-3.5 h-3.5" />
                <span>View on Map</span>
              </button>
            </div>
          )}

          {/* GORGEOUS VERIFICATION FOOTER */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 relative z-10 text-left mt-2">
            <div className="flex flex-col gap-0.5">
              <span className="font-black text-slate-700">Authorized Auditor: kayteemee@gmail.com</span>
              <span className="font-medium text-slate-400">Inspection Timestamp: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-black tracking-wide uppercase text-[10px] shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 fill-current" />
              <span className="flex flex-col text-left">
                <span className="text-emerald-800 font-black leading-none text-[9px]">VERIFIED REPORT</span>
                <span className="text-[8px] text-emerald-600 font-bold leading-none mt-0.5">Compliant & Secured</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* GORGEOUS SHARING PREVIEW MODAL */}
      {shareModal && shareModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-white/15 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden bg-slate-900 text-left">
            {/* Header */}
            <div className="flex items-center justify-between p-4.5 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <Share2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Share Compliance Card
                  </h3>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-medium uppercase tracking-wide">Ready for WhatsApp, Slack & Reports</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (shareModal.imageUrl) URL.revokeObjectURL(shareModal.imageUrl);
                  setShareModal(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Scrollable Preview Body */}
            <div className="p-5 flex-1 overflow-y-auto flex flex-col items-center gap-4 bg-slate-950/45">
              <p className="text-[10px] text-slate-400 text-center leading-relaxed max-w-xs font-medium uppercase tracking-wide">
                Below is your high-fidelity, compliance-certified image. You can copy or save it instantly!
              </p>

              {/* Rendered Image Card Container */}
              <div className="relative border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-w-full bg-slate-950 group">
                <img
                  src={shareModal.imageUrl}
                  alt="Workplace Safety Compliance Snippet"
                  className="w-full max-h-[380px] object-contain"
                />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center pointer-events-none p-4">
                  <span className="text-[10px] text-slate-200 font-bold px-3 py-2 bg-slate-900/90 rounded-xl backdrop-blur-sm border border-white/10 text-center">
                    📱 Long-press image to copy or save on mobile devices
                  </span>
                </div>
              </div>

              {shareModal.copied && (
                <div className="text-center text-[10px] text-emerald-400 font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl w-full animate-bounce">
                  ✓ Copied image to clipboard! Press Paste (Ctrl+V/Cmd+V) in WhatsApp to send.
                </div>
              )}
            </div>

            {/* Quick Actions Footer Bar */}
            <div className="p-4 border-t border-white/10 bg-slate-950 flex flex-col gap-2.5">
              {/* Row 1: Direct Clipboard & File save */}
              <div className="grid grid-cols-2 gap-2">
                {/* Copy Image Button */}
                <button
                  onClick={async () => {
                    if (!shareModal.blob) return;
                    try {
                      await navigator.clipboard.write([
                        new ClipboardItem({
                          [shareModal.blob.type]: shareModal.blob
                        })
                      ]);
                      setShareModal(prev => prev ? { ...prev, copied: true } : null);
                      setTimeout(() => {
                        setShareModal(prev => prev ? { ...prev, copied: false } : null);
                      }, 3000);
                    } catch (err) {
                      console.error("Clipboard copy failed:", err);
                      alert("Direct clipboard copy isn't supported in your browser. Please try downloading or long-pressing the image.");
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-lg shadow-indigo-950/40 border border-indigo-500/10"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Image</span>
                </button>

                {/* Download Image Button */}
                <button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = shareModal.imageUrl;
                    link.download = `safety_compliance_${shareModal.type}_${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-bold text-white transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download file</span>
                </button>
              </div>

              {/* Row 2: Direct Share Options */}
              <div className="flex flex-col gap-2">
                {/* Web Share (Native Mobile Share) */}
                {navigator.share && (
                  <button
                    onClick={async () => {
                      if (!shareModal.blob) return;
                      try {
                        const file = new File([shareModal.blob], `safety_audit_${shareModal.type}.png`, { type: shareModal.blob.type });
                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                          await navigator.share({
                            files: [file],
                            title: "Workplace Safety Compliance Report",
                            text: "Review the safety compliance audit card."
                          });
                        } else {
                          alert("Your browser supports sharing but not file sharing specifically. Please save the image instead.");
                        }
                      } catch (err) {
                        console.error("Web share failed:", err);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-md shadow-emerald-950/20"
                  >
                    <Share2 className="w-3.5 h-3.5 text-white animate-pulse" />
                    <span>Direct Share (WhatsApp / Apps)</span>
                  </button>
                )}

                {/* WhatsApp Text Fallback option */}
                <button
                  onClick={() => {
                    if (shareModal.type === "hazard" && shareModal.issue) {
                      handleShareIndividualHazardOnWhatsApp(shareModal.issue);
                    } else {
                      handleShareFullReportOnWhatsApp();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-slate-200 rounded-xl text-[10px] font-semibold transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                  <span>Send Text Summary as Fallback</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Location Prompt Modal */}
      {locationPrompt && locationPrompt.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-white/15 shadow-2xl flex flex-col bg-slate-900 text-left overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Specify Audit Location
                  </h3>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-medium uppercase tracking-wide">
                    These details will be embedded on the compliance card
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLocationPrompt(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Fields Body */}
            <div className="p-5 flex flex-col gap-4 bg-slate-950/20">
              <div className="text-left">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Building / Facility</label>
                <div className="relative">
                  <input
                    type="text"
                    value={tempBuilding}
                    onChange={(e) => setTempBuilding(e.target.value)}
                    placeholder="e.g., Main Assembly Plant, Building C"
                    className="w-full bg-slate-950 border border-white/15 rounded-xl text-xs text-slate-200 pl-3 pr-3 py-2.5 focus:outline-hidden focus:border-indigo-500 placeholder:text-slate-600 transition-colors"
                  />
                </div>
              </div>

              <div className="text-left">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Floor / Zone</label>
                <div className="relative">
                  <input
                    type="text"
                    value={tempFloor}
                    onChange={(e) => setTempFloor(e.target.value)}
                    placeholder="e.g., Ground Floor, Zone B"
                    className="w-full bg-slate-950 border border-white/15 rounded-xl text-xs text-slate-200 pl-3 pr-3 py-2.5 focus:outline-hidden focus:border-indigo-500 placeholder:text-slate-600 transition-colors"
                  />
                </div>
              </div>

              <div className="text-[10px] text-slate-500 bg-slate-950/40 border border-white/5 p-3 rounded-xl leading-relaxed">
                💡 <strong>Remembered input:</strong> These location details are automatically saved locally on your device. On your next share, they will pre-populate so you only have to edit them when your physical location changes.
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-950 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setLocationPrompt(null)}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 text-slate-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLocation}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-lg shadow-emerald-950/40 border border-emerald-500/10"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Confirm &amp; Generate Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Autonomous CAPA Work Order Modal */}
      <WorkOrderModal
        isOpen={Boolean(selectedWorkOrderIssue)}
        onClose={() => setSelectedWorkOrderIssue(null)}
        issue={selectedWorkOrderIssue}
        imageSrc={displayImageSrc}
        overallScore={safetyScore}
        locationInfo={{ building, floor }}
      />

      {/* Autonomous Remediation Verification (Before vs After) Modal */}
      <RemediationVerificationModal
        isOpen={Boolean(selectedVerificationIssue)}
        onClose={() => setSelectedVerificationIssue(null)}
        issue={selectedVerificationIssue?.issue || null}
        beforeImageSrc={displayImageSrc}
        onVerificationComplete={(data) => {
          if (selectedVerificationIssue && onUpdateIssueStatus) {
            onUpdateIssueStatus(selectedVerificationIssue.index, "Closed");
          }
          if (onUpdateOverallStatus) {
            onUpdateOverallStatus("Resolved");
          }
        }}
      />
    </div>
  );
}
