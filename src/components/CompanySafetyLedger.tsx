import React, { useState } from "react";
import { AuditLogEntry, SafetyIssue, SafetyReport } from "../types";
import { 
  Database, 
  Users, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Clipboard, 
  User, 
  Search, 
  RefreshCw, 
  ArrowRight,
  BarChart2,
  PieChart,
  Building2,
  Award,
  Activity,
  ShieldCheck,
  MapPin,
  X,
  Plus,
  Shield
} from "lucide-react";
import ScanTerminal from "./ScanTerminal";
import SafetyIssueList from "./SafetyIssueList";
import PoolAnalyticsDashboard from "./PoolAnalyticsDashboard";

interface CompanySafetyLedgerProps {
  logs: AuditLogEntry[];
  activeLogId: string | null;
  activeReport: SafetyReport | null;
  onSelectLog: (id: string) => void;
  onUpdateStatus: (id: string, status: AuditLogEntry["status"]) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onDeleteLog: (id: string) => void;
  isSyncing: boolean;
  onRefresh: () => void;
  auditorName: string;
  onChangeAuditorName: (name: string) => void;
  role?: "reporter" | "hse";
  onUpdateIssueStatus: (issueIndex: number, newStatus: "Open" | "In Progress" | "Closed") => void;
  onUpdateOverallStatus: (newOverallStatus: "Open" | "In Progress" | "Resolved") => void;
}

export default function CompanySafetyLedger({
  logs,
  activeLogId,
  activeReport,
  onSelectLog,
  onUpdateStatus,
  onUpdateNotes,
  onDeleteLog,
  isSyncing,
  onRefresh,
  auditorName,
  onChangeAuditorName,
  role = "reporter",
  onUpdateIssueStatus,
  onUpdateOverallStatus
}: CompanySafetyLedgerProps) {
  const [activeTab, setActiveTab] = useState<"records" | "analytics">("records");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  const [hoveredIssueIndex, setHoveredIssueIndex] = useState<number | null>(null);
  const [selectedIssueIndex, setSelectedIssueIndex] = useState<number | null>(null);

  // Calculate standard metrics from whichever logs are active
  const totalAudits = logs.length;
  const averageScore = totalAudits > 0 
    ? Math.round(logs.reduce((sum, log) => sum + log.report.safetyScore, 0) / totalAudits) 
    : 100;

  // Compile detailed issues statistics
  let totalIssuesCount = 0;
  let criticalIssuesCount = 0;
  let closedIssuesCount = 0;
  let openIssuesCount = 0;

  logs.forEach(log => {
    const issues = log.report.issues || [];
    totalIssuesCount += issues.length;
    issues.forEach((issue: any) => {
      if (issue.severity === "critical" || issue.severity === "high") {
        criticalIssuesCount++;
      }
      if (issue.status === "Closed" || issue.status === "Resolved") {
        closedIssuesCount++;
      } else {
        openIssuesCount++;
      }
    });
  });

  // Filters mapping
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.scenarioTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.report.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.submittedBy || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
    if (score >= 55) return "text-amber-400 border-amber-500/20 bg-amber-500/10";
    return "text-red-400 border-red-500/20 bg-red-500/10";
  };

  const getStatusBadge = (status: AuditLogEntry["status"]) => {
    switch (status) {
      case "Resolved":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/35";
      case "In Progress":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/35";
      default:
        return "bg-red-500/10 text-red-400 border border-red-500/35";
    }
  };

  const handleStartEditingNotes = (id: string, notes: string) => {
    setEditingNotesId(id);
    setTempNotes(notes);
  };

  const handleSaveNotes = (id: string) => {
    onUpdateNotes(id, tempNotes);
    setEditingNotesId(null);
  };

  return (
    <div id="company-safety-ledger" className="glass-panel rounded-3xl shadow-xl border border-white/10 p-6 bg-slate-900/50">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5 font-display">
            <Database className="w-5.5 h-5.5 text-indigo-400" />
            {role === "reporter" ? "My Reported Audits & UA/UC Registry" : "Central EHS Safety Pool & Audit Center"}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {role === "reporter" 
              ? "Your submitted reports, active risk incidents, and resolution tracking. Update status when your workplace issues are resolved."
              : "Review, analyze, and manage site-wide unsafe acts/conditions submitted by all field safety reps and contractors."}
          </p>
        </div>

        {/* Sync Controls & Info */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {role === "reporter" ? (
            <div className="flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/10 px-3 py-1.5 rounded-xl text-xs">
              <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-slate-400 mr-1 uppercase font-mono tracking-wider text-[9px]">Reporter ID:</span>
              <span className="text-white font-bold font-mono truncate max-w-[120px] sm:max-w-[165px]" title={auditorName}>
                {auditorName}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5 rounded-xl text-xs">
              <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-400 mr-1 uppercase font-mono tracking-wider text-[9px]">Monitor Role:</span>
              <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">HSE ADMIN TEAM</span>
            </div>
          )}

          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 hover:text-white border border-indigo-500/20 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Reload database logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-indigo-400" : ""}`} />
            <span>{role === "reporter" ? "Sync Submissions" : "Sync Database Pool"}</span>
          </button>
        </div>
      </div>

      {/* HSE Monitor - Portal Tab Switcher */}
      {role === "hse" && (
        <div className="flex border-b border-white/5 mb-6 gap-6">
          <button
            onClick={() => setActiveTab("records")}
            className={`pb-3 text-xs font-bold tracking-wider uppercase transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === "records"
                ? "text-indigo-400 border-b-2 border-indigo-500 font-black"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Submitted Safety Reports ({totalAudits})</span>
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`pb-3 text-xs font-bold tracking-wider uppercase transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === "analytics"
                ? "text-indigo-400 border-b-2 border-indigo-500 font-black"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>EHS Safety Insights & Analytics</span>
            <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
              Live
            </span>
          </button>
        </div>
      )}

      {/* RENDER ANALYTICS TAB (Only available to HSE role) */}
      {role === "hse" && activeTab === "analytics" ? (
        <PoolAnalyticsDashboard
          logs={logs}
          onSelectLog={(id) => {
            setActiveTab("records");
            onSelectLog(id);
          }}
          onNavigateToRecords={() => setActiveTab("records")}
        />
      ) : (
        /* OTHERWISE RENDER STANDARD LOGS RECORDS LIST */
        <>
          {/* Metrics Banner Section (Only shown for reporter or in records mode) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
              <Clipboard className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
              <div className="text-lg font-extrabold text-white">{totalAudits}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Reports Listed</div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
              <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <div className={`text-lg font-extrabold ${averageScore >= 80 ? "text-emerald-400" : averageScore >= 55 ? "text-amber-400" : "text-red-400"}`}>
                {averageScore}%
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Avg Index</div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
              <ShieldAlert className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <div className="text-lg font-extrabold text-orange-400">{totalIssuesCount}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Hazards Logged</div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center col-span-1">
              <AlertTriangle className="w-4 h-4 text-red-400 mx-auto mb-1" />
              <div className="text-lg font-extrabold text-red-400">{criticalIssuesCount}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Critical Risks</div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center col-span-2 md:col-span-1">
              <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <div className="text-lg font-extrabold text-emerald-400">{closedIssuesCount} / {totalIssuesCount}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Resolved Hazards</div>
            </div>
          </div>

          {/* Query Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={role === "reporter" ? "Search my submitted audits, locations, rules..." : "Search workforce submissions, department codes, or wardens..."}
                className="w-full pl-9.5 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white/[0.07] transition-all"
              />
            </div>

            <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl shrink-0 w-full sm:w-auto justify-around">
              {["ALL", "Open", "In Progress", "Resolved"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === status
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Ledger Records List */}
          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-10 border border-white/5 rounded-2xl bg-white/[0.01]">
                <Clipboard className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No safety logs found matching the filters.</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isActive = activeLogId === log.id;
                const openHazardsCount = log.report.issues?.filter((i: any) => i.status !== "Closed" && i.status !== "Resolved").length || 0;
                const dateStr = new Date(log.timestamp).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                return (
                  <div 
                    key={log.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col gap-4 ${
                      isActive 
                        ? "bg-slate-900/90 border-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/20" 
                        : "bg-white/[0.02] hover:bg-white/[0.04] border-white/10"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between w-full">
                      {/* Log Identity Card */}
                      <div className="flex gap-3 items-start flex-1 min-w-0">
                        {/* Photo Thumbnail */}
                        <div className="relative w-16 h-16 bg-slate-950 rounded-lg overflow-hidden border border-white/10 shrink-0">
                          <img 
                            src={log.imageSrc} 
                            alt={log.scenarioTitle}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-0 right-0 px-1 bg-slate-900/80 border-b border-l border-white/10 text-[8px] font-mono font-bold text-slate-300">
                            {log.report.issues?.length || 0} H
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono ${getScoreColor(log.report.safetyScore)}`}>
                              Safety Score: {log.report.safetyScore}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(log.status)}`}>
                              {log.status}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {dateStr}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-white mt-1.5 truncate">
                            {log.scenarioTitle}
                          </h4>

                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[9px] uppercase tracking-wider font-mono font-bold bg-white/5 text-slate-300 px-1 rounded border border-white/5">
                              BY: {log.submittedBy || "Unknown Inspector"}
                            </span>
                            {log.department && (
                              <span className="text-[9px] uppercase tracking-wider font-mono font-bold bg-indigo-500/10 text-indigo-300 px-1 rounded border border-indigo-500/5">
                                DEPT: {log.department}
                              </span>
                            )}
                            {openHazardsCount > 0 ? (
                              <span className="text-[9px] text-orange-300 font-medium">
                                • {openHazardsCount} active hazards pending
                              </span>
                            ) : (
                              <span className="text-[9px] text-emerald-400 font-medium">
                                • Clean / Fully resolved
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Log Management Controls */}
                      <div className="flex flex-col gap-2.5 w-full md:w-[280px] shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-white/10">
                        
                        {/* Notes editing block */}
                        <div className="text-left">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span className="font-bold">EHS Corrective Notes:</span>
                            {editingNotesId === log.id ? (
                              <div className="flex gap-1.5">
                                <button 
                                  onClick={() => handleSaveNotes(log.id)}
                                  className="text-emerald-400 hover:text-emerald-300 font-bold"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={() => setEditingNotesId(null)}
                                  className="text-slate-400 hover:text-slate-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleStartEditingNotes(log.id, log.notes || "")}
                                className="text-indigo-400 hover:text-indigo-300 underline"
                              >
                                Edit Notes
                              </button>
                            )}
                          </div>

                          {editingNotesId === log.id ? (
                            <textarea
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              placeholder="Add action tracker notes, root-cause details, or contractor follow-ups..."
                              className="w-full bg-slate-950 border border-white/15 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500 h-11 resize-none"
                            />
                          ) : (
                            <div className="bg-black/20 rounded p-1.5 min-h-[44px] text-[10px] text-slate-300 border border-white/5 italic line-clamp-2">
                              {log.notes || "No remedial actions or tracking notes documented yet."}
                            </div>
                          )}
                        </div>

                        {/* Operational status action and workbench loading */}
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-1.5">
                            {/* Dropdown to change report status - unlocked for both reporter (to close/re-open their own) and hse */}
                            <select
                              value={log.status}
                              onChange={(e) => onUpdateStatus(log.id, e.target.value as any)}
                              className="bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-[10px] text-white font-bold focus:outline-none cursor-pointer"
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved (Closed)</option>
                            </select>

                            {role === "hse" && (
                              <button
                                onClick={() => onDeleteLog(log.id)}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer"
                                title="Delete report from database pool"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => onSelectLog(log.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                              isActive
                                ? "bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)] border border-indigo-400"
                                : "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10"
                            }`}
                          >
                            <span>
                              {isActive 
                                ? "Hide Details" 
                                : (role === "hse" ? "View Report" : "View Details")
                              }
                            </span>
                            <ArrowRight className={`w-3 h-3 transition-transform ${isActive ? "rotate-90" : ""}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Report Details rendered directly underneath! */}
                    {isActive && activeReport && (
                      <div className="border-t border-white/10 pt-4 mt-2 animate-fade-in space-y-4 w-full text-left">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 flex items-center gap-1.5 font-display">
                            <Shield className="w-3.5 h-3.5 text-indigo-400" />
                            Report Analysis Details
                          </h5>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectLog(log.id); // Toggle off
                            }}
                            className="px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded text-[9px] font-bold text-slate-400 hover:text-white transition-all flex items-center gap-1 border border-white/10 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                            <span>Close View</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                          {/* Visual overlay image */}
                          <div className="xl:col-span-6">
                            <ScanTerminal
                              imageSrc={log.imageSrc}
                              activeMode="upload"
                              onTriggerScan={async () => {}}
                              isScanning={false}
                              activeReport={activeReport}
                              hoveredIssueIndex={hoveredIssueIndex}
                              setHoveredIssueIndex={setHoveredIssueIndex}
                              selectedIssueIndex={selectedIssueIndex}
                              setSelectedIssueIndex={setSelectedIssueIndex}
                              hideScanButton={true}
                            />
                          </div>

                          {/* Safety compliance reports list */}
                          <div className="xl:col-span-6">
                            <SafetyIssueList
                              report={activeReport}
                              isScanning={false}
                              hoveredIssueIndex={hoveredIssueIndex}
                              setHoveredIssueIndex={setHoveredIssueIndex}
                              selectedIssueIndex={selectedIssueIndex}
                              setSelectedIssueIndex={setSelectedIssueIndex}
                              activeLog={log}
                              onUpdateIssueStatus={onUpdateIssueStatus}
                              onUpdateOverallStatus={onUpdateOverallStatus}
                              imageSrc={log.imageSrc}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

    </div>
  );
}
