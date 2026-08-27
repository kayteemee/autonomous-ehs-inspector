import React, { useState } from "react";
import {
  X,
  FileText,
  Clock,
  Building,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Send,
  Printer,
  Copy,
  Check,
  Zap,
  Mail,
  Smartphone,
  ChevronRight,
  HardHat,
  Share2
} from "lucide-react";
import { SafetyIssue, SeverityLevel, AuditLogEntry } from "../types";

interface WorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: SafetyIssue | null;
  imageSrc?: string | null;
  overallScore?: number;
  locationInfo?: { building?: string; floor?: string };
}

export default function WorkOrderModal({
  isOpen,
  onClose,
  issue,
  imageSrc,
  overallScore,
  locationInfo
}: WorkOrderModalProps) {
  const [dispatchStatus, setDispatchStatus] = useState<"idle" | "dispatching" | "dispatched">("idle");
  const [dispatchType, setDispatchType] = useState<"email" | "sms" | "webhook" | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !issue) return null;

  // Auto-generate Work Order ID based on issue details & timestamp
  const workOrderId = `WO-EHS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Determine SLA and Department assignment based on severity & category
  const getSLA = (sev: SeverityLevel) => {
    switch (sev) {
      case "critical":
        return { time: "24 Hours (Immediate Stop-Work)", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" };
      case "high":
        return { time: "48 Hours (High Priority)", color: "text-orange-400 bg-orange-500/10 border-orange-500/30" };
      case "medium":
        return { time: "5 Business Days", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
      case "low":
        return { time: "14 Calendar Days", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    }
  };

  const getAssignedDepartment = (cat?: string, title?: string) => {
    const text = `${cat || ""} ${title || ""}`.toLowerCase();
    if (text.includes("electric") || text.includes("wire") || text.includes("cord") || text.includes("power")) return "Electrical Safety & Utilities";
    if (text.includes("spill") || text.includes("chemical") || text.includes("fume")) return "Hazardous Materials & Environmental Ops";
    if (text.includes("machine") || text.includes("guard") || text.includes("gear") || text.includes("lockout")) return "Plant Maintenance & Machinery Shop";
    if (text.includes("height") || text.includes("ladder") || text.includes("scaffold") || text.includes("fall")) return "Structural Safety & Facilities Engineering";
    if (text.includes("ppe") || text.includes("hat") || text.includes("vest") || text.includes("eyewear")) return "EHS Frontline Supervision & Training";
    if (text.includes("exit") || text.includes("egress") || text.includes("fire")) return "Life Safety & Emergency Response Team";
    return "Facilities Operations & Maintenance";
  };

  const sla = getSLA(issue.severity);
  const assignedDept = getAssignedDepartment(issue.hazardCategory, issue.title);

  const handleDispatch = (type: "email" | "sms" | "webhook") => {
    setDispatchType(type);
    setDispatchStatus("dispatching");
    setTimeout(() => {
      setDispatchStatus("dispatched");
      setTimeout(() => {
        setDispatchStatus("idle");
        setDispatchType(null);
      }, 4000);
    }, 1200);
  };

  const handleCopyPayload = () => {
    const payload = JSON.stringify(
      {
        workOrderId,
        timestamp: new Date().toISOString(),
        title: issue.title,
        severity: issue.severity.toUpperCase(),
        hazardType: issue.category === "act" ? "Unsafe Act (Behavioral)" : "Unsafe Condition (Environmental)",
        hazardCategory: issue.hazardCategory || "General Safety",
        assignedDepartment: assignedDept,
        sla: sla.time,
        location: `${locationInfo?.building || "Main Facility"} - ${locationInfo?.floor || "Ground Level"}`,
        regulations: {
          osha: issue.oshaRule,
          iso: issue.isoRule,
          nfpa: issue.nfpaRule
        },
        correctiveAction: issue.correctiveAction,
        agentStatus: "AUTONOMOUSLY DISPATCHED"
      },
      null,
      2
    );
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Autonomous CAPA Work Order</h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {workOrderId}
                </span>
              </div>
              <p className="text-xs text-slate-400">Generated automatically by Gemini 3.7 Flash Agent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto print:max-h-none">
          {/* Top Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Severity</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${
                  issue.severity === "critical" ? "bg-rose-500 animate-ping" :
                  issue.severity === "high" ? "bg-orange-500" :
                  issue.severity === "medium" ? "bg-amber-500" : "bg-emerald-500"
                }`} />
                <span className="text-xs font-bold text-white uppercase">{issue.severity}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Remediation SLA</span>
              <span className="text-xs font-semibold text-amber-300 mt-1 block truncate">
                {issue.severity === "critical" ? "24h Stop-Work" : issue.severity === "high" ? "48h Priority" : "5 Days"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 col-span-2 sm:col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Department</span>
              <span className="text-xs font-semibold text-blue-300 mt-1 flex items-center gap-1 truncate">
                <Building className="w-3 h-3 text-blue-400 shrink-0" />
                {assignedDept}
              </span>
            </div>
          </div>

          {/* Hazard Summary Card */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hazard Title &amp; Scope</span>
                <h4 className="text-sm font-bold text-white mt-0.5">{issue.title}</h4>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-800 text-slate-300 border border-slate-700">
                {issue.category === "act" ? "Unsafe Act (UA)" : "Unsafe Condition (UC)"}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
              {issue.description}
            </p>
          </div>

          {/* Regulatory Citation Directives */}
          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/30 space-y-2">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Mandatory Legal &amp; Regulatory Standard Citations
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 font-semibold block text-[10px]">OSHA Standard</span>
                <span className="text-slate-200 font-mono">{issue.oshaRule || "29 CFR 1910"}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 font-semibold block text-[10px]">ISO Standard</span>
                <span className="text-slate-200 font-mono">{issue.isoRule || "ISO 45001:2018"}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 font-semibold block text-[10px]">NFPA / Life Safety</span>
                <span className="text-slate-200 font-mono">{issue.nfpaRule || "NFPA 101"}</span>
              </div>
            </div>
          </div>

          {/* Autonomous CAPA Step-by-Step Directives */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/30 space-y-2.5">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Required Corrective &amp; Preventive Action (CAPA)
            </span>
            <div className="text-xs text-emerald-200 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-emerald-900/40">
              {issue.correctiveAction}
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Execution Milestones:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5 p-1.5 rounded bg-slate-900/50 border border-slate-800">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[9px] font-bold">1</span>
                  <span>Isolate Risk Area</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded bg-slate-900/50 border border-slate-800">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-bold">2</span>
                  <span>Apply Engineering Fix</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded bg-slate-900/50 border border-slate-800">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px] font-bold">3</span>
                  <span>AI Visual Proof Audit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Autonomous Dispatch Channels */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                Autonomous Dispatch Channels
              </span>
              {dispatchStatus === "dispatched" && (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-in fade-in">
                  <CheckCircle2 className="w-3 h-3" /> Dispatched Successfully
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleDispatch("email")}
                disabled={dispatchStatus !== "idle"}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                {dispatchStatus === "dispatching" && dispatchType === "email" ? "Sending Email..." : "Email Maintenance Lead"}
              </button>

              <button
                onClick={() => handleDispatch("sms")}
                disabled={dispatchStatus !== "idle"}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                {dispatchStatus === "dispatching" && dispatchType === "sms" ? "Sending SMS..." : "SMS Shift Supervisor"}
              </button>

              <button
                onClick={() => handleDispatch("webhook")}
                disabled={dispatchStatus !== "idle"}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-purple-400" />
                {dispatchStatus === "dispatching" && dispatchType === "webhook" ? "Firing Webhook..." : "ERP / CMMS Webhook"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/90 border-t border-slate-800 text-xs">
          <button
            onClick={handleCopyPayload}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied JSON!" : "Copy Work Order JSON"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
