import React, { useState, useMemo } from "react";
import { 
  AuditLogEntry, 
  STANDARD_HAZARD_CATEGORIES, 
  DEFAULT_DEPARTMENTS, 
  StandardHazardCategory, 
  DepartmentInfo,
  SafetyIssue 
} from "../types";
import {
  Activity,
  BarChart2,
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  Building2,
  Users,
  CheckCircle2,
  Layers,
  Sparkles,
  Info,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Eye,
  Filter,
  Check,
  Clock,
  Compass,
  FileText,
  Flame,
  Award,
  Zap,
  HardHat,
  ChevronRight
} from "lucide-react";

interface PoolAnalyticsDashboardProps {
  logs: AuditLogEntry[];
  onSelectLog?: (id: string) => void;
  onNavigateToRecords?: () => void;
}

export default function PoolAnalyticsDashboard({
  logs,
  onSelectLog,
  onNavigateToRecords
}: PoolAnalyticsDashboardProps) {
  // Sub-tab navigation inside Analytics
  const [analyticsView, setAnalyticsView] = useState<"overview" | "uavsuc" | "departments" | "categories">("overview");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [departmentSortBy, setDepartmentSortBy] = useState<"rate" | "submissions" | "hazards" | "score">("rate");
  const [trendGranularity, setTrendGranularity] = useState<"daily" | "weekly" | "monthly">("weekly");

  // 1. Overall Aggregations
  const totalAudits = logs.length;
  const averageScore = totalAudits > 0 
    ? Math.round(logs.reduce((sum, log) => sum + log.report.safetyScore, 0) / totalAudits) 
    : 100;

  // Extract all individual hazards from all logs
  const allIssues = useMemo(() => {
    const issues: Array<SafetyIssue & { logId: string; logTitle: string; department: string; timestamp: string }> = [];
    logs.forEach(log => {
      const dept = log.department || "Operations";
      (log.report.issues || []).forEach(issue => {
        issues.push({
          ...issue,
          logId: log.id,
          logTitle: log.scenarioTitle,
          department: dept,
          timestamp: log.timestamp
        });
      });
    });
    return issues;
  }, [logs]);

  const totalHazardsCount = allIssues.length;
  const criticalHazardsCount = allIssues.filter(i => i.severity === "critical" || i.severity === "high").length;
  const resolvedHazardsCount = allIssues.filter(i => i.status === "Closed").length;

  // 2. UA vs UC Analysis Calculations
  const uaVsUcStats = useMemo(() => {
    let totalUA = 0;
    let totalUC = 0;

    const deptUAMap: { [dept: string]: number } = {};
    const deptUCMap: { [dept: string]: number } = {};

    allIssues.forEach(issue => {
      const isUA = issue.category === "act";
      const dept = issue.department || "Operations";

      if (isUA) {
        totalUA++;
        deptUAMap[dept] = (deptUAMap[dept] || 0) + 1;
      } else {
        totalUC++;
        deptUCMap[dept] = (deptUCMap[dept] || 0) + 1;
      }
    });

    const total = totalUA + totalUC;
    const uaPercent = total > 0 ? Math.round((totalUA / total) * 100) : 0;
    const ucPercent = total > 0 ? Math.round((totalUC / total) * 100) : 0;
    const ratio = totalUC > 0 ? (totalUA / totalUC).toFixed(2) : totalUA > 0 ? "∞" : "1.00";

    // Sort departments by UA and UC
    const sortedByUA = Object.entries(deptUAMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const sortedByUC = Object.entries(deptUCMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalUA,
      totalUC,
      total,
      uaPercent,
      ucPercent,
      ratio,
      topUADepartments: sortedByUA,
      topUCDepartments: sortedByUC,
      highestUADept: sortedByUA[0] || { name: "None", count: 0 },
      highestUCDept: sortedByUC[0] || { name: "None", count: 0 }
    };
  }, [allIssues]);

  // 3. Trends Over Time (UA & UC grouped dynamically by Daily, Weekly, or Monthly)
  const timelineTrends = useMemo(() => {
    const periodMap: {
      [key: string]: {
        key: string;
        date: string;
        subLabel: string;
        rawDate: Date;
        ua: number;
        uc: number;
        totalReports: number;
        logs: AuditLogEntry[];
      };
    } = {};

    logs.forEach((log) => {
      const dateObj = new Date(log.timestamp);
      let key = "";
      let label = "";
      let subLabel = "";
      let sortDate = dateObj;

      if (trendGranularity === "monthly") {
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();
        sortDate = new Date(year, month, 1);
        key = `M-${year}-${String(month + 1).padStart(2, "0")}`;
        label = sortDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        subLabel = sortDate.toLocaleDateString("en-US", { month: "long" });
      } else if (trendGranularity === "weekly") {
        const day = dateObj.getDay(); // 0 is Sun
        const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1); // Monday start
        const weekStart = new Date(dateObj);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        sortDate = weekStart;
        key = `W-${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;

        const startMonth = weekStart.toLocaleDateString("en-US", { month: "short" });
        const endMonth = weekEnd.toLocaleDateString("en-US", { month: "short" });
        const startDay = weekStart.getDate();
        const endDay = weekEnd.getDate();

        label = startMonth === endMonth
          ? `${startMonth} ${startDay}–${endDay}`
          : `${startMonth} ${startDay} – ${endMonth} ${endDay}`;

        // Approximate week of year
        const firstDayOfYear = new Date(weekStart.getFullYear(), 0, 1);
        const pastDaysOfYear = (weekStart.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        subLabel = `Wk ${weekNum}, ${weekStart.getFullYear()}`;
      } else {
        // Daily
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();
        const day = dateObj.getDate();
        sortDate = new Date(year, month, day);
        key = `D-${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        label = sortDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        subLabel = sortDate.toLocaleDateString("en-US", { weekday: "short" });
      }

      if (!periodMap[key]) {
        periodMap[key] = {
          key,
          date: label,
          subLabel,
          rawDate: sortDate,
          ua: 0,
          uc: 0,
          totalReports: 0,
          logs: []
        };
      }

      periodMap[key].totalReports++;
      periodMap[key].logs.push(log);

      (log.report.issues || []).forEach((issue) => {
        if (issue.category === "act") {
          periodMap[key].ua++;
        } else {
          periodMap[key].uc++;
        }
      });
    });

    // Sort chronologically ascending
    const sortedPeriods = Object.values(periodMap).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

    // Find max value for relative bar graph height scaling
    const maxCount = Math.max(...sortedPeriods.map((d) => Math.max(d.ua, d.uc, 1)), 5);

    // Identify peak period
    let peakPeriod = sortedPeriods[0] || null;
    sortedPeriods.forEach((p) => {
      if (peakPeriod && (p.ua + p.uc) > (peakPeriod.ua + peakPeriod.uc)) {
        peakPeriod = p;
      }
    });

    return {
      points: sortedPeriods,
      maxCount,
      peakPeriod,
      totalPeriods: sortedPeriods.length
    };
  }, [logs, trendGranularity]);

  // 4. Department Comparison Normalized by Registered Personnel
  const normalizedDepartmentStats = useMemo(() => {
    // Map registered users dictionary
    const deptInfoMap: { [name: string]: DepartmentInfo } = {};
    DEFAULT_DEPARTMENTS.forEach(d => {
      deptInfoMap[d.name.toLowerCase()] = d;
    });

    const statsMap: {
      [dept: string]: {
        name: string;
        registeredUsers: number;
        location: string;
        lead: string;
        submissions: number;
        uaCount: number;
        ucCount: number;
        totalHazards: number;
        scoreSum: number;
        resolvedCount: number;
      };
    } = {};

    // Initialize with default departments so all departments are visible in the matrix
    DEFAULT_DEPARTMENTS.forEach(d => {
      statsMap[d.name] = {
        name: d.name,
        registeredUsers: d.registeredUsers,
        location: d.location || "On-site",
        lead: d.lead || "EHS Lead",
        submissions: 0,
        uaCount: 0,
        ucCount: 0,
        totalHazards: 0,
        scoreSum: 0,
        resolvedCount: 0
      };
    });

    // Populate from logs
    logs.forEach(log => {
      const deptName = log.department || "Operations";
      if (!statsMap[deptName]) {
        // Fallback for custom department
        const matched = deptInfoMap[deptName.toLowerCase()];
        statsMap[deptName] = {
          name: deptName,
          registeredUsers: matched?.registeredUsers || 10,
          location: matched?.location || "Facility",
          lead: matched?.lead || "Team Lead",
          submissions: 0,
          uaCount: 0,
          ucCount: 0,
          totalHazards: 0,
          scoreSum: 0,
          resolvedCount: 0
        };
      }

      statsMap[deptName].submissions++;
      statsMap[deptName].scoreSum += log.report.safetyScore;
      if (log.status === "Resolved") {
        statsMap[deptName].resolvedCount++;
      }

      (log.report.issues || []).forEach(issue => {
        statsMap[deptName].totalHazards++;
        if (issue.category === "act") {
          statsMap[deptName].uaCount++;
        } else {
          statsMap[deptName].ucCount++;
        }
      });
    });

    // Calculate normalized per-capita metrics and culture classifications
    const results = Object.values(statsMap).map(d => {
      const avgScore = d.submissions > 0 ? Math.round(d.scoreSum / d.submissions) : 100;
      const reportingRate = Number((d.submissions / Math.max(d.registeredUsers, 1)).toFixed(2));
      const hazardsPerUser = Number((d.totalHazards / Math.max(d.registeredUsers, 1)).toFixed(2));
      
      // Proactive Culture Classification:
      // High reporting per user indicates high vigilance and proactive reporting culture
      let cultureLabel: string;
      let cultureColor: string;
      let cultureBadge: string;

      if (reportingRate >= 0.20 || d.submissions >= 3) {
        cultureLabel = "Proactive Safety Culture";
        cultureColor = "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
        cultureBadge = "High Vigilance";
      } else if (reportingRate >= 0.08 || d.submissions >= 1) {
        cultureLabel = "Moderate Reporting Activity";
        cultureColor = "text-indigo-400 border-indigo-500/30 bg-indigo-500/10";
        cultureBadge = "Active Engagement";
      } else {
        cultureLabel = "Low Reporting Volume";
        cultureColor = "text-amber-400 border-amber-500/30 bg-amber-500/10";
        cultureBadge = "Engagement Opportunity";
      }

      return {
        ...d,
        avgScore,
        reportingRate,
        hazardsPerUser,
        cultureLabel,
        cultureColor,
        cultureBadge
      };
    });

    // Sort according to user selection
    if (departmentSortBy === "rate") {
      results.sort((a, b) => b.reportingRate - a.reportingRate || b.submissions - a.submissions);
    } else if (departmentSortBy === "submissions") {
      results.sort((a, b) => b.submissions - a.submissions);
    } else if (departmentSortBy === "hazards") {
      results.sort((a, b) => b.totalHazards - a.totalHazards);
    } else if (departmentSortBy === "score") {
      results.sort((a, b) => b.avgScore - a.avgScore);
    }

    return results;
  }, [logs, departmentSortBy]);

  // 5. Hazard Category Analysis across the 15 Standard Categories
  const hazardCategoryStats = useMemo(() => {
    const catMap: {
      [cat: string]: {
        name: StandardHazardCategory;
        total: number;
        uaCount: number;
        ucCount: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
        departments: { [dept: string]: number };
        sampleIssues: SafetyIssue[];
      };
    } = {};

    // Initialize all 15 standard categories so none are omitted
    STANDARD_HAZARD_CATEGORIES.forEach(cat => {
      catMap[cat] = {
        name: cat,
        total: 0,
        uaCount: 0,
        ucCount: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        departments: {},
        sampleIssues: []
      };
    });

    // Match issues into categories
    allIssues.forEach(issue => {
      let matchedCategory: StandardHazardCategory = "Housekeeping"; // sensible default

      if (issue.hazardCategory && STANDARD_HAZARD_CATEGORIES.includes(issue.hazardCategory as StandardHazardCategory)) {
        matchedCategory = issue.hazardCategory as StandardHazardCategory;
      } else {
        // Fallback auto-classifier based on text keywords if legacy data
        const text = `${issue.title} ${issue.description}`.toLowerCase();
        if (text.includes("vest") || text.includes("ppe") || text.includes("helmet") || text.includes("eyewear") || text.includes("gloves") || text.includes("harness")) {
          matchedCategory = "PPE";
        } else if (text.includes("height") || text.includes("ladder") || text.includes("scaffold") || text.includes("fall")) {
          matchedCategory = "Working at height";
        } else if (text.includes("electric") || text.includes("cord") || text.includes("wire") || text.includes("breaker") || text.includes("voltage")) {
          matchedCategory = "Electrical";
        } else if (text.includes("fire") || text.includes("extinguisher") || text.includes("flame") || text.includes("combustible")) {
          matchedCategory = "Fire safety";
        } else if (text.includes("exit") || text.includes("egress") || text.includes("aisle") || text.includes("blocked door")) {
          matchedCategory = "Access/egress";
        } else if (text.includes("slip") || text.includes("trip") || text.includes("spill") || text.includes("puddle") || text.includes("wet floor")) {
          matchedCategory = "Slips/trips/falls";
        } else if (text.includes("forklift") || text.includes("vehicle") || text.includes("truck") || text.includes("pedestrian")) {
          matchedCategory = "Vehicle safety";
        } else if (text.includes("lift") || text.includes("ergonomic") || text.includes("posture") || text.includes("back") || text.includes("bending")) {
          matchedCategory = "Ergonomics";
        } else if (text.includes("guard") || text.includes("machin") || text.includes("gear") || text.includes("pinch") || text.includes("interlock")) {
          matchedCategory = "Machinery";
        } else if (text.includes("chemical") || text.includes("fume") || text.includes("solvent") || text.includes("acid") || text.includes("toxic")) {
          matchedCategory = "Chemical exposure";
        } else if (text.includes("confined") || text.includes("tank") || text.includes("silo") || text.includes("manhole")) {
          matchedCategory = "Confined space";
        } else if (text.includes("crane") || text.includes("hoist") || text.includes("rigging") || text.includes("sling")) {
          matchedCategory = "Lifting operations";
        } else if (text.includes("environ") || text.includes("drain") || text.includes("leak") || text.includes("waste")) {
          matchedCategory = "Environmental";
        } else if (text.includes("alarm") || text.includes("drill") || text.includes("shower") || text.includes("eyewash") || text.includes("emergency")) {
          matchedCategory = "Emergency preparedness";
        } else {
          matchedCategory = "Housekeeping";
        }
      }

      if (!catMap[matchedCategory]) {
        catMap[matchedCategory] = {
          name: matchedCategory,
          total: 0,
          uaCount: 0,
          ucCount: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          departments: {},
          sampleIssues: []
        };
      }

      const item = catMap[matchedCategory];
      item.total++;
      if (issue.category === "act") {
        item.uaCount++;
      } else {
        item.ucCount++;
      }

      const sev = (issue.severity || "low").toLowerCase();
      if (sev === "critical") item.critical++;
      else if (sev === "high") item.high++;
      else if (sev === "medium") item.medium++;
      else item.low++;

      const dept = issue.department || "Operations";
      item.departments[dept] = (item.departments[dept] || 0) + 1;

      if (item.sampleIssues.length < 3) {
        item.sampleIssues.push(issue);
      }
    });

    const totalAllHazards = Math.max(allIssues.length, 1);

    const list = Object.values(catMap).map(c => ({
      ...c,
      percentage: Math.round((c.total / totalAllHazards) * 100),
      topDepartment: Object.entries(c.departments).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"
    }));

    // Sort descending by total hazards
    list.sort((a, b) => b.total - a.total);

    const top3Categories = list.slice(0, 3).filter(c => c.total > 0);

    return {
      categories: list,
      top3Categories,
      totalCount: allIssues.length
    };
  }, [allIssues]);

  // Filtered issues based on category selection
  const filteredCategoryIssues = useMemo(() => {
    if (!selectedCategoryFilter) return allIssues;
    return allIssues.filter(i => (i.hazardCategory || "Housekeeping") === selectedCategoryFilter);
  }, [allIssues, selectedCategoryFilter]);

  return (
    <div id="pool-analytics-dashboard" className="space-y-6 animate-fade-in text-left">
      
      {/* Sub-navigation Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/[0.02] border border-white/10 p-3 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: "overview", label: "Executive Overview", icon: BarChart2 },
            { id: "uavsuc", label: "UA vs UC Analysis", icon: Activity, count: `${uaVsUcStats.totalUA} UA / ${uaVsUcStats.totalUC} UC` },
            { id: "departments", label: "Department Comparison", icon: Building2, count: `${normalizedDepartmentStats.length} Depts` },
            { id: "categories", label: "15 Hazard Categories", icon: Layers, count: `${hazardCategoryStats.categories.filter(c => c.total > 0).length} Active` }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = analyticsView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAnalyticsView(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.35)] border border-indigo-400/50"
                    : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                    isActive ? "bg-white/20 text-white font-black" : "bg-white/5 text-slate-400"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Real-time pool synthesis: {totalAudits} audits</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. REPORTING CULTURE PHILOSOPHY NOTICE (Always prominent & accessible)     */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/40 border border-indigo-500/25 rounded-2xl p-4.5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300 font-display">
                  EHS Reporting Culture Benchmark
                </h4>
                <span className="text-[9px] uppercase tracking-widest bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded-full font-bold font-mono">
                  Proactive Safety Index
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
                <span className="font-bold text-white">Do not interpret high reporting volume automatically as poor safety performance.</span> A department submitting more hazard observations frequently demonstrates a <span className="text-emerald-300 font-bold underline decoration-emerald-500/40">stronger reporting culture</span>, high psychological safety, and heightened hazard awareness rather than greater operational danger.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0 border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0 md:pl-4">
            <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400">Total Pool Ratio</span>
            <span className="text-sm font-black text-indigo-400 font-mono mt-0.5">
              {uaVsUcStats.ratio} UA : 1 UC
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
              {totalHazardsCount} Total Observations
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: EXECUTIVE OVERVIEW                                               */}
      {/* ========================================================================= */}
      {analyticsView === "overview" && (
        <div className="space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total UA Tile */}
            <div className="bg-amber-500/[0.03] border border-amber-500/20 rounded-2xl p-4.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-mono font-bold bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full">
                  {uaVsUcStats.uaPercent}% of Pool
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-white font-display">{uaVsUcStats.totalUA}</div>
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mt-0.5">Unsafe Acts (UA)</div>
                <p className="text-[10px] text-slate-400 mt-1">Behavioral deviations, PPE omission, posture</p>
              </div>
            </div>

            {/* Total UC Tile */}
            <div className="bg-cyan-500/[0.03] border border-cyan-500/20 rounded-2xl p-4.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-mono font-bold bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-full">
                  {uaVsUcStats.ucPercent}% of Pool
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-white font-display">{uaVsUcStats.totalUC}</div>
                <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mt-0.5">Unsafe Conditions (UC)</div>
                <p className="text-[10px] text-slate-400 mt-1">Environmental spills, blocked exits, machinery</p>
              </div>
            </div>

            {/* UA/UC Ratio Tile */}
            <div className="bg-indigo-500/[0.03] border border-indigo-500/20 rounded-2xl p-4.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-mono font-bold bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full">
                  Benchmark
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-white font-display">{uaVsUcStats.ratio} : 1</div>
                <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mt-0.5">UA / UC Balance Ratio</div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {Number(uaVsUcStats.ratio) > 1.2 ? "Behavioral coaching focus" : "Facility remediation focus"}
                </p>
              </div>
            </div>

            {/* Total Registered Workforce Engagement */}
            <div className="bg-emerald-500/[0.03] border border-emerald-500/20 rounded-2xl p-4.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-mono font-bold bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full">
                  Normalized
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-white font-display">
                  {(totalAudits / DEFAULT_DEPARTMENTS.reduce((sum, d) => sum + d.registeredUsers, 0)).toFixed(2)}
                </div>
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mt-0.5">Reports / Registered User</div>
                <p className="text-[10px] text-slate-400 mt-1">Across 7 standard operating departments</p>
              </div>
            </div>

          </div>

          {/* Quick Dual Cards: Top Reporting Departments & Top Hazard Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top UA & UC Department Leaders */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  Department Reporting Culture Leaders
                </h3>
                <button
                  onClick={() => setAnalyticsView("departments")}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Matrix</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Highest UA Dept */}
                <div className="bg-amber-500/[0.05] border border-amber-500/20 rounded-xl p-3.5">
                  <span className="text-[9px] uppercase font-mono font-bold text-amber-400 block tracking-widest">
                    Highest Unsafe Acts (UA)
                  </span>
                  <div className="text-base font-black text-white mt-1">
                    {uaVsUcStats.highestUADept.name}
                  </div>
                  <div className="text-xs text-amber-300 font-mono mt-0.5 font-bold">
                    {uaVsUcStats.highestUADept.count} Acts Reported
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Reflects workforce engagement in spotting unsafe worker behaviors and PPE issues.
                  </p>
                </div>

                {/* Highest UC Dept */}
                <div className="bg-cyan-500/[0.05] border border-cyan-500/20 rounded-xl p-3.5">
                  <span className="text-[9px] uppercase font-mono font-bold text-cyan-400 block tracking-widest">
                    Highest Unsafe Conditions (UC)
                  </span>
                  <div className="text-base font-black text-white mt-1">
                    {uaVsUcStats.highestUCDept.name}
                  </div>
                  <div className="text-xs text-cyan-300 font-mono mt-0.5 font-bold">
                    {uaVsUcStats.highestUCDept.count} Conditions Reported
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Reflects facility inspection rigor on structural, mechanical, and housekeeping defects.
                  </p>
                </div>
              </div>

              {/* Progress Summary */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                  <span>Pool Ratio Breakdown</span>
                  <span className="font-mono text-indigo-400">{uaVsUcStats.totalUA} UA vs {uaVsUcStats.totalUC} UC</span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-white/10">
                  <div 
                    className="h-full bg-amber-500" 
                    style={{ width: `${uaVsUcStats.uaPercent}%` }} 
                    title={`Unsafe Acts: ${uaVsUcStats.totalUA} (${uaVsUcStats.uaPercent}%)`}
                  />
                  <div 
                    className="h-full bg-cyan-500" 
                    style={{ width: `${uaVsUcStats.ucPercent}%` }} 
                    title={`Unsafe Conditions: ${uaVsUcStats.totalUC} (${uaVsUcStats.ucPercent}%)`}
                  />
                </div>
              </div>
            </div>

            {/* Top Hazard Categories Distribution */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Primary Standard Hazard Categories
                </h3>
                <button
                  onClick={() => setAnalyticsView("categories")}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>All 15 Categories</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {hazardCategoryStats.top3Categories.map((cat, idx) => (
                  <div key={cat.name} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-mono text-[10px]">
                          #{idx + 1}
                        </span>
                        <span>{cat.name}</span>
                      </span>
                      <span className="font-mono text-indigo-300">
                        {cat.total} incidents ({cat.percentage}%)
                      </span>
                    </div>
                    
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ width: `${Math.max(cat.percentage, 5)}%` }} 
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{cat.uaCount} Acts • {cat.ucCount} Conditions</span>
                      <span>Primary Dept: <strong className="text-slate-300">{cat.topDepartment}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Temporal Timeline Bar Chart (UA & UC Trends Over Time) */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    UA & UC Activity Trends Over Time
                  </h3>
                  {timelineTrends.peakPeriod && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                      Peak: {timelineTrends.peakPeriod.date} ({timelineTrends.peakPeriod.ua + timelineTrends.peakPeriod.uc} hazards)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {trendGranularity === "monthly"
                    ? "Monthly aggregated volume of behavioral acts vs facility environmental conditions"
                    : trendGranularity === "weekly"
                    ? "Weekly aggregated volume (Monday – Sunday intervals) across company facilities"
                    : "Daily chronological timeline of logged safety observations"}
                </p>
              </div>

              {/* Granularity Selector & Legend */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Granularity Toggle Buttons (Daily, Weekly, Monthly) */}
                <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-white/10 shadow-inner">
                  <button
                    onClick={() => setTrendGranularity("daily")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      trendGranularity === "daily"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setTrendGranularity("weekly")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      trendGranularity === "weekly"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setTrendGranularity("monthly")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      trendGranularity === "monthly"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Monthly
                  </button>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-2.5 text-xs font-mono pl-2 border-l border-white/10">
                  <span className="flex items-center gap-1 text-amber-400 text-[11px]">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-xs" /> UA
                  </span>
                  <span className="flex items-center gap-1 text-cyan-400 text-[11px]">
                    <span className="w-2.5 h-2.5 bg-cyan-500 rounded-xs" /> UC
                  </span>
                </div>
              </div>
            </div>

            {timelineTrends.points.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs font-mono">
                No timeline records logged yet.
              </div>
            ) : (
              <div className="pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-7 gap-3 items-end min-h-[175px] pb-3 border-b border-white/10 overflow-x-auto">
                  {timelineTrends.points.map((point) => {
                    const uaHeight = Math.max(Math.round((point.ua / timelineTrends.maxCount) * 110), point.ua > 0 ? 16 : 4);
                    const ucHeight = Math.max(Math.round((point.uc / timelineTrends.maxCount) * 110), point.uc > 0 ? 16 : 4);
                    const totalHazards = point.ua + point.uc;

                    return (
                      <div key={point.key} className="flex flex-col items-center gap-2 group p-2 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/5">
                        {/* Dual Vertical Trend Bars */}
                        <div className="flex items-end gap-1.5 h-[120px] w-full justify-center">
                          {/* UA Bar */}
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] font-mono font-bold text-amber-400 mb-1 opacity-75 group-hover:opacity-100 transition-opacity">
                              {point.ua}
                            </span>
                            <div 
                              className="w-4 bg-amber-500 hover:bg-amber-400 rounded-t-md transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                              style={{ height: `${uaHeight}px` }}
                              title={`${point.date}: ${point.ua} Unsafe Acts (${totalHazards > 0 ? Math.round((point.ua/totalHazards)*100) : 0}%)`}
                            />
                          </div>

                          {/* UC Bar */}
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] font-mono font-bold text-cyan-400 mb-1 opacity-75 group-hover:opacity-100 transition-opacity">
                              {point.uc}
                            </span>
                            <div 
                              className="w-4 bg-cyan-500 hover:bg-cyan-400 rounded-t-md transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                              style={{ height: `${ucHeight}px` }}
                              title={`${point.date}: ${point.uc} Unsafe Conditions (${totalHazards > 0 ? Math.round((point.uc/totalHazards)*100) : 0}%)`}
                            />
                          </div>
                        </div>

                        {/* Date Labels */}
                        <div className="text-center w-full">
                          <div className="text-[10px] font-mono text-slate-200 font-bold truncate">
                            {point.date}
                          </div>
                          <div className="text-[8px] font-mono text-slate-400 truncate">
                            {point.subLabel}
                          </div>
                          <div className="text-[8px] font-mono text-indigo-400/80 mt-0.5 font-bold">
                            {point.totalReports} {point.totalReports === 1 ? "audit" : "audits"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: UA VS UC IN-DEPTH ANALYSIS                                       */}
      {/* ========================================================================= */}
      {analyticsView === "uavsuc" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Summary Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Total Unsafe Acts (UA)</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-white mt-2 font-display">{uaVsUcStats.totalUA}</div>
              <p className="text-[11px] text-amber-200/80 mt-1">
                {uaVsUcStats.uaPercent}% of all recorded workplace safety observations
              </p>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/25 rounded-2xl p-4.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Total Unsafe Conditions (UC)</span>
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-black text-white mt-2 font-display">{uaVsUcStats.totalUC}</div>
              <p className="text-[11px] text-cyan-200/80 mt-1">
                {uaVsUcStats.ucPercent}% of all recorded workplace safety observations
              </p>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-2xl p-4.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">UA / UC Balance Ratio</span>
                <Compass className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-black text-white mt-2 font-display">{uaVsUcStats.ratio} : 1.0</div>
              <p className="text-[11px] text-indigo-200/80 mt-1">
                For every 1 physical condition, workforce logged {uaVsUcStats.ratio} behavioral acts
              </p>
            </div>
          </div>

          {/* Department Rankings by UA and UC */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Departments with Highest UA */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="border-b border-white/5 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Departments with Highest Unsafe Acts (UA)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Workforce reporting behavioral, PPE, and procedural observations
                </p>
              </div>

              <div className="space-y-3">
                {uaVsUcStats.topUADepartments.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center font-mono">No UA records found</p>
                ) : (
                  uaVsUcStats.topUADepartments.map((dept, index) => {
                    const maxUA = Math.max(uaVsUcStats.topUADepartments[0]?.count || 1, 1);
                    const pct = Math.round((dept.count / maxUA) * 100);

                    return (
                      <div key={dept.name} className="p-3 rounded-xl bg-white/[0.01] border border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-amber-400">#{index + 1}</span>
                            <span>{dept.name}</span>
                          </span>
                          <span className="font-mono text-amber-300">{dept.count} Unsafe Acts</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                            style={{ width: `${pct}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Departments with Highest UC */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="border-b border-white/5 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Departments with Highest Unsafe Conditions (UC)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Workforce reporting facility, tooling, and environmental defects
                </p>
              </div>

              <div className="space-y-3">
                {uaVsUcStats.topUCDepartments.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center font-mono">No UC records found</p>
                ) : (
                  uaVsUcStats.topUCDepartments.map((dept, index) => {
                    const maxUC = Math.max(uaVsUcStats.topUCDepartments[0]?.count || 1, 1);
                    const pct = Math.round((dept.count / maxUC) * 100);

                    return (
                      <div key={dept.name} className="p-3 rounded-xl bg-white/[0.01] border border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-cyan-400">#{index + 1}</span>
                            <span>{dept.name}</span>
                          </span>
                          <span className="font-mono text-cyan-300">{dept.count} Conditions</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-cyan-500 rounded-full transition-all duration-500" 
                            style={{ width: `${pct}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Granular Timeline Chart for UA vs UC */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-white/5 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Chronological Trend Analysis (UA vs UC Breakdown)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Proportionate behavioral vs condition distribution by {trendGranularity} period
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Granularity Toggle Buttons (Daily, Weekly, Monthly) */}
                <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-white/10 shadow-inner">
                  <button
                    onClick={() => setTrendGranularity("daily")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      trendGranularity === "daily"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setTrendGranularity("weekly")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      trendGranularity === "weekly"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setTrendGranularity("monthly")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      trendGranularity === "monthly"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Monthly
                  </button>
                </div>

                <span className="text-xs text-slate-400 font-mono font-bold hidden sm:inline">
                  {timelineTrends.points.length} {trendGranularity} {timelineTrends.points.length === 1 ? "bucket" : "buckets"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {timelineTrends.points.map((pt) => {
                const total = pt.ua + pt.uc;
                const uaPct = total > 0 ? Math.round((pt.ua / total) * 100) : 0;
                const ucPct = total > 0 ? Math.round((pt.uc / total) * 100) : 0;

                return (
                  <div key={pt.key} className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 space-y-2.5 hover:border-white/10 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-white">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="font-mono text-slate-100">{pt.date}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">({pt.subLabel})</span>
                        <span className="text-[9px] bg-white/5 text-slate-400 px-2 py-0.5 rounded font-mono">
                          {pt.totalReports} {pt.totalReports === 1 ? "Report" : "Reports"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-xs">
                        <span className="text-amber-400 font-bold">{pt.ua} Unsafe Acts ({uaPct}%)</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-cyan-400 font-bold">{pt.uc} Conditions ({ucPct}%)</span>
                      </div>
                    </div>

                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-white/5 p-0.5">
                      {total > 0 ? (
                        <>
                          <div 
                            className="h-full bg-amber-500 rounded-l-full transition-all duration-500" 
                            style={{ width: `${uaPct}%` }} 
                            title={`Unsafe Acts: ${pt.ua} (${uaPct}%)`}
                          />
                          <div 
                            className="h-full bg-cyan-500 rounded-r-full transition-all duration-500" 
                            style={{ width: `${ucPct}%` }} 
                            title={`Unsafe Conditions: ${pt.uc} (${ucPct}%)`}
                          />
                        </>
                      ) : (
                        <div className="w-full h-full bg-slate-800 rounded-full text-center text-[8px] text-slate-500 font-mono flex items-center justify-center">
                          No observations recorded
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: NORMALIZED DEPARTMENT COMPARISON                                 */}
      {/* ========================================================================= */}
      {analyticsView === "departments" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Sorting & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Workforce Department Normalization Matrix
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Submissions evaluated against registered headcount to measure authentic reporting culture
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1 rounded-xl">
              <span className="text-[10px] text-slate-400 px-2 font-mono uppercase">Sort by:</span>
              {[
                { id: "rate", label: "Per-Capita Rate" },
                { id: "submissions", label: "Total Reports" },
                { id: "hazards", label: "Hazards" },
                { id: "score", label: "Score" }
              ].map(sortOpt => (
                <button
                  key={sortOpt.id}
                  onClick={() => setDepartmentSortBy(sortOpt.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    departmentSortBy === sortOpt.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {sortOpt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Department Comparison Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {normalizedDepartmentStats.map((dept, index) => (
              <div 
                key={dept.name}
                className="bg-white/[0.02] border border-white/10 hover:border-white/20 rounded-2xl p-5 space-y-4 transition-all"
              >
                {/* Header with rank and registered headcount */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-400">#{index + 1}</span>
                      <h4 className="text-sm font-black text-white">{dept.name}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      {dept.location} • Lead: {dept.lead}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className={`text-[9px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-full border ${dept.cultureColor}`}>
                      {dept.cultureBadge}
                    </span>
                  </div>
                </div>

                {/* Primary Metric: Reporting Rate per User */}
                <div className="bg-slate-950/60 rounded-xl p-3 border border-white/5 grid grid-cols-2 gap-2 text-center">
                  <div>
                    <div className="text-lg font-black text-white font-mono">
                      {dept.reportingRate}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
                      Reports / User
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-indigo-300 font-mono">
                      {dept.registeredUsers}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
                      Registered Users
                    </div>
                  </div>
                </div>

                {/* Detailed Numbers Breakdown */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Total Submissions:</span>
                    <span className="font-bold text-white font-mono">{dept.submissions} audits</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">UA / UC Breakdown:</span>
                    <span className="font-mono">
                      <span className="text-amber-400 font-bold">{dept.uaCount} UA</span>
                      <span className="text-slate-500 mx-1">/</span>
                      <span className="text-cyan-400 font-bold">{dept.ucCount} UC</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Hazard Density:</span>
                    <span className="font-bold text-slate-200 font-mono">{dept.hazardsPerUser} hazards / user</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Average Compliance Index:</span>
                    <span className={`font-bold font-mono ${dept.avgScore >= 80 ? "text-emerald-400" : dept.avgScore >= 60 ? "text-amber-400" : "text-red-400"}`}>
                      {dept.avgScore}%
                    </span>
                  </div>
                </div>

                {/* Culture Assessment Footer */}
                <div className="pt-2 border-t border-white/5 text-[10px] text-slate-400">
                  <span className="font-bold text-slate-300">Culture Assessment: </span>
                  {dept.cultureLabel}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: 15 STANDARD HAZARD CATEGORIES ANALYSIS                           */}
      {/* ========================================================================= */}
      {analyticsView === "categories" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header & Filter Indicator */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                15 Standard EHS Hazard Categories
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Full taxonomy alignment across behavioral acts and facility physical conditions
              </p>
            </div>

            {selectedCategoryFilter && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">Filtered: <strong className="text-indigo-300">{selectedCategoryFilter}</strong></span>
                <button
                  onClick={() => setSelectedCategoryFilter(null)}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 rounded-lg border border-white/10 cursor-pointer"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>

          {/* Grid of all 15 Standard Hazard Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hazardCategoryStats.categories.map((cat, idx) => {
              const isSelected = selectedCategoryFilter === cat.name;
              const hasIncidents = cat.total > 0;

              return (
                <div
                  key={cat.name}
                  onClick={() => setSelectedCategoryFilter(isSelected ? null : cat.name)}
                  className={`p-4.5 rounded-2xl border transition-all cursor-pointer space-y-3.5 ${
                    isSelected
                      ? "bg-indigo-950/40 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/50"
                      : hasIncidents
                      ? "bg-white/[0.02] hover:bg-white/[0.05] border-white/10"
                      : "bg-white/[0.005] border-white/5 opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* Category Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center font-mono text-xs font-bold">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-black text-white">{cat.name}</h4>
                    </div>
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                      {cat.total} {cat.total === 1 ? "hazard" : "hazards"}
                    </span>
                  </div>

                  {/* Relative volume progress bar */}
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${Math.max(cat.percentage, cat.total > 0 ? 8 : 0)}%` }} 
                    />
                  </div>

                  {/* Metric Sub-data */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300 pt-1 border-t border-white/5">
                    <div>
                      <span className="text-slate-400 block">Classification:</span>
                      <span className="text-amber-300 font-bold">{cat.uaCount} UA</span> / <span className="text-cyan-300 font-bold">{cat.ucCount} UC</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">Critical/High:</span>
                      <span className="text-rose-400 font-bold">{cat.critical + cat.high}</span>
                    </div>
                  </div>

                  {/* Top department */}
                  {cat.topDepartment !== "None" && (
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Primary Dept:</span>
                      <span className="font-bold text-slate-200">{cat.topDepartment}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Drilldown List of Hazards for Selected Category */}
          {selectedCategoryFilter && (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4 mt-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  Observations in Category: <span className="text-indigo-300">{selectedCategoryFilter}</span> ({filteredCategoryIssues.length})
                </h4>
                <button
                  onClick={() => setSelectedCategoryFilter(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close Inspection View
                </button>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {filteredCategoryIssues.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center font-mono">No observations recorded in this category yet.</p>
                ) : (
                  filteredCategoryIssues.map((issue, idx) => (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                            issue.category === "act" ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                          }`}>
                            {issue.category === "act" ? "UA" : "UC"}
                          </span>
                          <span className="text-xs font-bold text-white truncate">{issue.title}</span>
                          <span className="text-[9px] font-mono text-slate-400">({issue.department})</span>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-1">{issue.description}</p>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">Rule: {issue.oshaRule}</span>
                      </div>

                      {onSelectLog && (
                        <button
                          onClick={() => onSelectLog(issue.logId)}
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-lg text-xs font-bold border border-indigo-500/30 transition-all cursor-pointer shrink-0"
                        >
                          View Full Audit
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
