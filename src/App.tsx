import React, { useEffect, useState } from "react";
import { Shield, Sparkles, AlertCircle, HelpCircle, HardHat, Info, Moon, Sun, Check, X, Presentation, UploadCloud, Database, User, Lock, Mail, LogIn, LogOut, Building, ArrowRight, Eye, EyeOff, Key, Zap, CheckCircle2, Layers } from "lucide-react";

import { AuditLogEntry, SafetyReport, SafetyIssue } from "./types";
import { APP_THEMES, AppTheme } from "./data/themes";
import constructionHazardImg from "./assets/images/construction_hazard_1783029238525.jpg";
import officeHazardImg from "./assets/images/office_hazard_1783029265563.jpg";
import warehouseSpillImg from "./assets/images/warehouse_spill_1783029251772.jpg";
import industrialLiftingImg from "./assets/images/industrial_lifting_1783029278299.jpg";
import safetyMonitorLogo from "./assets/images/safety_monitor_logo_1783207579984.jpg";

// Import modular components
import ScenarioSelector from "./components/ScenarioSelector";
import ScanTerminal from "./components/ScanTerminal";
import SafetyIssueList from "./components/SafetyIssueList";
import LiveVideoAnalyzer from "./components/LiveVideoAnalyzer";
import PresentationModal from "./components/PresentationModal";
import CompanySafetyLedger from "./components/CompanySafetyLedger";
import ApiKeyModal from "./components/ApiKeyModal";
import AgentArchitectureModal from "./components/AgentArchitectureModal";
import AutoPlayDemoModal from "./components/AutoPlayDemoModal";

const STORAGE_KEY = "safety_monitor_logs_v1";

export default function App() {
  const [themeId, setThemeId] = useState<string>(() => {
    const saved = localStorage.getItem("safety_monitor_theme_id");
    if (saved === "dark" || saved === "light") return saved;
    // Fallback migration for old theme formats (grey goes to dark, white/light goes to light)
    if (saved) {
      if (saved.includes("grey")) return "dark";
      if (saved.includes("white") || saved.includes("light")) return "light";
    }
    return "dark"; // Default is Dark
  });

  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    return localStorage.getItem("safety_gemini_api_key") || "";
  });

  const handleSaveApiKey = (key: string) => {
    setUserApiKey(key);
    localStorage.setItem("safety_gemini_api_key", key);
  };

  const handleClearApiKey = () => {
    setUserApiKey("");
    localStorage.removeItem("safety_gemini_api_key");
  };

  const activeTheme = APP_THEMES.find((t) => t.id === themeId) || APP_THEMES[0];

  const toggleTheme = () => {
    const newThemeId = themeId === "dark" ? "light" : "dark";
    setThemeId(newThemeId);
    localStorage.setItem("safety_monitor_theme_id", newThemeId);
  };

  const themeStyles = {
    "--theme-bg": activeTheme.bg,
    "--theme-text": activeTheme.text,
    "--theme-text-muted": activeTheme.textMuted,
    "--theme-glass-bg": activeTheme.glassBg,
    "--theme-glass-border": activeTheme.glassBorder,
    "--theme-mesh-1": activeTheme.mesh1,
    "--theme-mesh-2": activeTheme.mesh2,
    "--theme-mesh-3": activeTheme.mesh3,
    "--theme-primary": activeTheme.primaryColor,
  } as React.CSSProperties;



  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  
  // Secure Login Gating and Session state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("safety_logged_in") === "true";
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem("safety_user_email") || "kayteemee@gmail.com";
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem("safety_user_name") || "Kay Tee";
  });
  const [userDepartment, setUserDepartment] = useState<string>(() => {
    return localStorage.getItem("safety_user_dept") || "Operations";
  });
  const [userRole, setUserRole] = useState<"reporter" | "hse">(() => {
    return (localStorage.getItem("safety_user_role") as "reporter" | "hse") || "reporter";
  });

  const [hseAccessKey, setHseAccessKey] = useState("");
  const [showHseAccessKey, setShowHseAccessKey] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Back-compatibility mapping for components relying on auditorName
  const auditorName = userEmail;

  // Centralized Company Shared Pool States
  const [logsMode, setLogsMode] = useState<"sandbox" | "pool">(() => {
    const savedRole = localStorage.getItem("safety_user_role") || "reporter";
    return savedRole === "hse" ? "pool" : "sandbox";
  });
  const [poolLogs, setPoolLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const cached = localStorage.getItem("cached_pool_logs");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (_) {}
    return [];
  });
  const [isSyncingPool, setIsSyncingPool] = useState<boolean>(false);
  
  // Memoized unified list of logs for the reporter (local sandbox + server audits matching their email)
  const myUnifiedLogs = React.useMemo(() => {
    const local = logs;
    // Strictly filter pool logs so reporters ONLY see what they reported!
    const poolForUser = poolLogs.filter((log) => {
      // Clean target emails
      const rawEmail = log.reporterEmail || (log.submittedBy?.includes("(") ? log.submittedBy.split("(")[1].replace(")", "").trim() : log.submittedBy) || "";
      return rawEmail.toLowerCase() === userEmail.toLowerCase();
    });

    // Merge by ID to prevent duplicates (prioritize server/pool state)
    const combinedMap = new Map<string, AuditLogEntry>();
    local.forEach((log) => combinedMap.set(log.id, log));
    poolForUser.forEach((log) => {
      const existing = combinedMap.get(log.id);
      if (existing) {
        combinedMap.set(log.id, {
          ...existing,
          ...log,
          status: log.status,
          notes: log.notes || existing.notes,
          report: {
            ...existing.report,
            ...log.report
          }
        });
      } else {
        combinedMap.set(log.id, log);
      }
    });

    return Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [logs, poolLogs, userEmail]);

  const handleSetUserRole = (role: "reporter" | "hse") => {
    setUserRole(role);
    localStorage.setItem("safety_user_role", role);
    if (role === "hse") {
      setLogsMode("pool");
      fetchPoolLogs();
    } else {
      setLogsMode("sandbox");
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!userName.trim()) {
      setLoginError("Full Name is required.");
      return;
    }
    if (!userEmail.trim() || !userEmail.includes("@")) {
      setLoginError("Please enter a valid work email address.");
      return;
    }

    if (userRole === "hse") {
      if (hseAccessKey !== "HSE123") {
        setLoginError("Invalid HSE Access Key. Use 'HSE123' to authorize entry.");
        return;
      }
    }

    // Save session
    localStorage.setItem("safety_logged_in", "true");
    localStorage.setItem("safety_user_name", userName);
    localStorage.setItem("safety_user_email", userEmail);
    localStorage.setItem("safety_user_dept", userDepartment);
    localStorage.setItem("safety_user_role", userRole);
    
    setIsLoggedIn(true);
    setLogsMode(userRole === "hse" ? "pool" : "sandbox");
    setHseAccessKey("");
    
    // If user hasn't setup a Gemini API key yet, guide them with the 1-click modal
    const existingKey = localStorage.getItem("safety_gemini_api_key");
    if (!existingKey || existingKey.trim().length < 5) {
      setTimeout(() => {
        setIsApiKeyModalOpen(true);
      }, 400);
    }

    // Sync pool logs immediately
    fetchPoolLogs();
  };

  const handleSignOut = () => {
    localStorage.removeItem("safety_logged_in");
    setIsLoggedIn(false);
    setActiveLogId(null);
    setActiveReport(null);
  };
  
  // Scanners state
  const [activeMode, setActiveMode] = useState<"upload" | "webcam" | "video">("upload");
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [activeReport, setActiveReport] = useState<SafetyReport | null>(null);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  
  // Interactive bounding boxes hover state
  const [hoveredIssueIndex, setHoveredIssueIndex] = useState<number | null>(null);
  const [selectedIssueIndex, setSelectedIssueIndex] = useState<number | null>(null);

  // Load central pool logs with graceful caching and automatic retry
  const fetchPoolLogs = async (retryCount = 0) => {
    setIsSyncingPool(true);
    try {
      const res = await fetch("/api/shared-pool");
      if (res.ok) {
        const data = await res.json();
        setPoolLogs(data);
        try {
          localStorage.setItem("cached_pool_logs", JSON.stringify(data));
        } catch (_) {}
      } else {
        console.warn("Could not retrieve shared pool logs:", res.statusText);
      }
    } catch (err) {
      console.warn("Central pool connection notice:", err);
      // If dev server or network was warming up, retry gracefully up to 2 times
      if (retryCount < 2) {
        setTimeout(() => {
          fetchPoolLogs(retryCount + 1);
        }, 1500 * (retryCount + 1));
      }
    } finally {
      setIsSyncingPool(false);
    }
  };

  // Publish log to central pool
  const handlePublishToPool = async (log: AuditLogEntry) => {
    setIsSyncingPool(true);
    try {
      const enrichedLog = {
        ...log,
        submittedBy: `${userName} (${userEmail})`,
        reporterName: userName,
        reporterEmail: userEmail,
        department: userDepartment,
        scenarioTitle: log.scenarioTitle.includes("(Central Pool)") 
          ? log.scenarioTitle 
          : `${log.scenarioTitle} (Published)`
      };

      const res = await fetch("/api/shared-pool", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(enrichedLog),
      });

      if (res.ok) {
        await fetchPoolLogs();
        alert(`Successfully published safety audit to Company Shared Pool!`);
        // Switch tab to let them see it
        setLogsMode("pool");
      } else {
        const errData = await res.json();
        alert(`Failed to publish to pool: ${errData.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Error publishing safety log:", err);
      alert("Network error publishing to the shared pool.");
    } finally {
      setIsSyncingPool(false);
    }
  };

  const handleUpdateAuditorName = (email: string) => {
    setUserEmail(email);
    localStorage.setItem("safety_user_email", email);
  };

  // Load logs on mount
  useEffect(() => {
    const rawLogs = localStorage.getItem(STORAGE_KEY);
    if (rawLogs) {
      try {
        setLogs(JSON.parse(rawLogs));
      } catch (e) {
        console.error("Error parsing local storage safety logs:", e);
        seedInitialLogs();
      }
    } else {
      seedInitialLogs();
    }
    fetchPoolLogs();
  }, []);

  // Save logs to local storage
  const saveLogs = (updatedLogs: AuditLogEntry[]) => {
    setLogs(updatedLogs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
  };

  // Seed initial audit log histories for rich dashboard charts on boot
  const seedInitialLogs = () => {
    const initialSeeds: AuditLogEntry[] = [
      {
        id: "seed-office",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        imageName: "office_egress_inspection.jpg",
        scenarioTitle: "Corporate Office Egress Safety",
        imageSrc: officeHazardImg,
        report: {
          safetyScore: 50,
          summary: "Egress and electrical compliance failures detected. Piles of boxes are fully obstructing a designated emergency fire exit, paired with unsafe daisy-chained electrical power strips.",
          issues: [
            {
              category: "condition",
              title: "Obstructed Designated Emergency Fire Exit",
              severity: "critical",
              description: "A large cluster of heavy boxes, old files, and electronic waste is stacked directly in front of the primary red Emergency Exit door, completely blocking emergency egress routes.",
              oshaRule: "OSHA 1910.37(a)(3)",
              isoRule: "ISO 7010:2019 / ISO 3864 (Graphical Symbols & Safety Colors - Exit Paths)",
              nfpaRule: "NFPA 101 Clause 7.1.10.1 (Means of Egress Obstructions)",
              correctiveAction: "Immediately relocate all storage boxes and refuse from the emergency exit. Establish a zero-tolerance policy for placing materials in front of exit doors.",
              boundingBox: [28, 62, 88, 92]
            },
            {
              category: "condition",
              title: "Daisy-Chained Power Strips (Electrical Fire Hazard)",
              severity: "high",
              description: "Multiple electrical extension cords and power strips are plugged sequentially into one another (daisy-chained) under an office workstation, creating a severe risk of overload, heat damage, and electrical fire.",
              oshaRule: "OSHA 1910.303(b)(2)",
              isoRule: "ISO 45001:2018 Clause 8.1.2 (Operational Controls & Risk Reduction)",
              nfpaRule: "NFPA 70 National Electrical Code (NEC) Section 110.3",
              correctiveAction: "Unplug daisy-chained power strips immediately. Install dedicated wall outlets if more power terminals are required, or use a single heavy-duty surge protector.",
              boundingBox: [58, 18, 92, 52]
            }
          ]
        },
        status: "In Progress",
        notes: "Facilities team cleared the emergency exit blockage within 15 minutes of detection. Electrician is scheduled for Friday morning to audit overloaded cubicle cubbies and install correct surge outlets."
      },
      {
        id: "seed-warehouse",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        imageName: "warehouse_spill_inspection.jpg",
        scenarioTitle: "Warehouse Hazardous Spill & Rack Audit",
        imageSrc: warehouseSpillImg,
        report: {
          safetyScore: 35,
          summary: "High-risk warehouse safety violations identified, including a severe liquid chemical spill in a primary transit lane and dangerously unstable high-rack materials.",
          issues: [
            {
              category: "condition",
              title: "Chemical/Oil Spill in Forklift Corridor",
              severity: "critical",
              description: "A large puddle of reflective liquid spill has accumulated on the floor in a primary walkway and vehicle transit lane, creating an extreme slip and loss-of-control hazard.",
              oshaRule: "OSHA 1910.22(a)(2)",
              isoRule: "ISO 14001:2015 Clause 8.1 (Environmental Spill Control & Emergency Plan) / ISO 45001:2018 Clause 8.1.2",
              nfpaRule: "NFPA 101 Clause 7.1.10 (Egress Walking Surface Slip Protection)",
              correctiveAction: "Halt pedestrian and vehicle traffic, apply chemical absorbent socks/granules, clean the area dry, and erect prominent 'Caution: Wet Floor' warning signage.",
              boundingBox: [63, 28, 87, 72]
            },
            {
              category: "condition",
              title: "Unstable Stacked Materials (Falling Object Hazard)",
              severity: "high",
              description: "Heavy cardboard storage boxes on the upper level of the warehouse racks are leaning outward, unbanded, and stacked unevenly, posing a high-severity falling object hazard to workers below.",
              oshaRule: "OSHA 1910.176(b)",
              isoRule: "ISO 45001:2018 Clause 8.1.1 (General Operational Control)",
              nfpaRule: "N/A (Storage and Stacking)",
              correctiveAction: "Cordon off the pathway below. Use a reach stacker to lower the pallet, restack items flatly, shrink-wrap the entire load securely, and return it to the rack.",
              boundingBox: [8, 68, 48, 96]
            }
          ]
        },
        status: "In Progress",
        notes: "Erected safety barriers around the spill. Absorbent compounds applied. Warehouse manager informed to retrain inventory handlers on stacking methods."
      },
      {
        id: "seed-industrial",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        imageName: "machine_shop_inspection.jpg",
        scenarioTitle: "Heavy Machinery Safeguarding & Ergonomics",
        imageSrc: industrialLiftingImg,
        report: {
          safetyScore: 48,
          summary: "Severe ergonomic risks and machinery guarding failures detected on the active machine shop floor. High risk of repetitive injury and mechanical entanglement.",
          issues: [
            {
              category: "act",
              title: "Improper Manual Lifting Technique (Ergonomic Hazard)",
              severity: "high",
              description: "A worker is lifting a heavy wooden crate with a deeply bent back and locked, straight legs, placing extreme pressure on the lumbar spine and risking acute disc herniation.",
              oshaRule: "OSH Act General Duty Clause Section 5(a)(1)",
              isoRule: "ISO 45001:2018 Clause 8.1.1 (Ergonomics / Worker Health)",
              nfpaRule: "N/A (Ergonomics Requirement)",
              correctiveAction: "Provide safe-lifting training. Re-instruct the worker to lift with legs (knees bent, back straight, core engaged), and provide mechanical lift assistance if the weight exceeds 50 lbs.",
              boundingBox: [38, 32, 86, 62]
            },
            {
              category: "condition",
              title: "Exposed Moving Gears (Missing Safety Machine Guard)",
              severity: "critical",
              description: "An active industrial machinery console is operating with its safety cover guard fully open or missing, leaving high-speed rotating steel gears exposed to operator limbs and clothing.",
              oshaRule: "OSHA 1910.212(a)(1)",
              isoRule: "ISO 12100:2010 Section 6.3 / ISO 13849-1 (Safety of Machinery - Guarding & Interlocks)",
              nfpaRule: "N/A (Machine Safeguard)",
              correctiveAction: "Enforce immediate Lockout/Tagout (LOTO). Install a durable, interlocked physical safety guard over the moving gears before powering on the machinery again.",
              boundingBox: [12, 63, 47, 87]
            }
          ]
        },
        status: "Resolved",
        notes: "Machine powered off and locked out. Maintenance technician fabricated and installed custom steel guarding panels with interlock sensors."
      },
      {
        id: "seed-construction",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        imageName: "scaffolding_inspection.jpg",
        scenarioTitle: "Heavy Construction Site Safety Test",
        imageSrc: constructionHazardImg,
        report: {
          safetyScore: 42,
          summary: "Critical PPE violations and severe housekeeping hazards detected on an active construction site. Multiple OSHA non-compliance issues require immediate workplace intervention.",
          issues: [
            {
              category: "act",
              title: "Failure to Wear Mandatory Head Protection (Hard Hat)",
              severity: "critical",
              description: "An active construction worker is standing near overhead scaffolding and crane operations without wearing a protective hard hat, exposing them to potentially fatal falling object hazards.",
              oshaRule: "OSHA 1910.135 & 1926.100",
              isoRule: "ISO 45001:2018 Clause 8.1.2 (Personal Protective Equipment)",
              nfpaRule: "N/A (PPE Requirement)",
              correctiveAction: "Immediately stop nearby overhead operations, equip the worker with an approved Class G/E industrial protective helmet, and conduct a brief toolbox safety talk.",
              boundingBox: [18, 44, 45, 62]
            },
            {
              category: "act",
              title: "Failure to Wear High-Visibility Safety Vest",
              severity: "high",
              description: "The worker is wearing dark casual attire instead of a high-visibility Class 2 or Class 3 safety vest in a zone with active material handling and heavy equipment traffic.",
              oshaRule: "OSHA 1926.201",
              isoRule: "ISO 45001:2018 Clause 8.1.2 (Reducing OH&S Risks)",
              nfpaRule: "N/A (PPE Requirement)",
              correctiveAction: "Restrict access to the active zone and provide the worker with standard high-visibility reflective safety apparel before allowing re-entry.",
              boundingBox: [35, 42, 78, 64]
            },
            {
              category: "condition",
              title: "Tripping Hazard - Scattered Tools & Heavy Cables",
              severity: "medium",
              description: "Heavy tools, construction debris, and heavy-duty electrical cables are strewn haphazardly across the primary walking path, presenting severe slip, trip, and fall hazards.",
              oshaRule: "OSHA 1910.22 & 1926.25",
              isoRule: "ISO 45001:2018 Clause 8.1.1 (General Operational Control & Housekeeping)",
              nfpaRule: "NFPA 101 Clause 7.1.10.1 (No obstructions in egress path)",
              correctiveAction: "Conduct an immediate housekeeping sweep of the walkway. Elevate electrical cables or route them under heavy-duty rubber floor cable protectors.",
              boundingBox: [72, 10, 95, 88]
            }
          ]
        },
        status: "Resolved",
        notes: "Workplace stopped. Subcontractor issued formal safety warning ticket. Worker equipped with full PPE before re-entering site. Housekeeping crew cleared the path and installed safe electrical cable bridges."
      }
    ];

    saveLogs(initialSeeds);
  };

  // Load custom uploaded image on workbench
  const handleImageUploaded = (base64Data: string, fileName: string) => {
    setCurrentImageSrc(base64Data);
    setActiveReport(null);
    setActiveLogId(null);
    setHoveredIssueIndex(null);
    setSelectedIssueIndex(null);
  };

  // Primary inspection pipeline trigger
  const handleTriggerScan = async (base64Image: string, focusContext: string) => {
    setIsScanning(true);
    setHoveredIssueIndex(null);
    setSelectedIssueIndex(null);

    try {
      let finalPayloadImage = base64Image;

      // Double-layered protection: If base64Image is a local URL path, try to fetch it and convert to base64 client-side
      if (base64Image && !base64Image.startsWith("data:image/")) {
        try {
          const res = await fetch(base64Image);
          if (res.ok) {
            const blob = await res.blob();
            finalPayloadImage = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }
        } catch (fetchErr) {
          console.warn("[App] Client-side image URL to Base64 conversion failed, falling back to server-side resolver:", fetchErr);
        }
      }

      const response = await fetch("/api/analyze-safety", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userApiKey ? { "x-gemini-api-key": userApiKey } : {}),
        },
        body: JSON.stringify({
          image: finalPayloadImage,
          presetScenarioId: null,
          focusContext: focusContext,
          apiKey: userApiKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.statusText}`);
      }

      const report: SafetyReport = await response.json();
      setActiveReport(report);
      setCurrentImageSrc(finalPayloadImage);

      // Save a new log entry to the registry
      let auditTitle = "Custom Safety Inspection";
      let imageName = "Webcam Capture";

      if (activeMode === "upload") {
        auditTitle = "Uploaded Image Analysis";
        imageName = "uploaded_photo.jpg";
      }

      const newLog: AuditLogEntry = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        imageName,
        scenarioTitle: auditTitle,
        imageSrc: finalPayloadImage,
        report,
        status: "Open",
        submittedBy: `${userName} (${userEmail})`,
        reporterName: userName,
        reporterEmail: userEmail,
        department: userDepartment,
      };

      saveLogs([newLog, ...logs]);
      setActiveLogId(newLog.id);

    } catch (err: any) {
      console.error("Safety scan failed:", err);
      alert(`Safety analysis failed: ${err.message || String(err)}. Please verify your connection or check logs.`);
    } finally {
      setIsScanning(false);
    }
  };

  // Ledger: Status update callback (for both Sandbox and Central Pool)
  const handleUpdateLogStatus = async (id: string, status: AuditLogEntry["status"]) => {
    const isPoolLog = id.startsWith("pool-") || poolLogs.some((l) => l.id === id);
    if (isPoolLog) {
      setPoolLogs((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      try {
        const res = await fetch(`/api/shared-pool/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status })
        });
        if (res.ok) {
          fetchPoolLogs();
        }
      } catch (err) {
        console.warn("Failed to update central pool status remotely:", err);
      }
    } else {
      const updated = logs.map((log) => (log.id === id ? { ...log, status } : log));
      saveLogs(updated);
    }
  };

  // Workbench: Update finding status directly (for both Sandbox and Central Pool)
  const handleUpdateIssueStatus = async (issueIndex: number, newStatus: "Open" | "In Progress" | "Closed") => {
    if (!activeLogId) return;

    const isPoolLog = activeLogId.startsWith("pool-") || poolLogs.some((l) => l.id === activeLogId);
    if (isPoolLog) {
      const targetLog = poolLogs.find(l => l.id === activeLogId);
      if (!targetLog) return;

      const updatedIssues = targetLog.report.issues.map((issue, idx) => {
        if (idx === issueIndex) {
          return { ...issue, status: newStatus };
        }
        return issue;
      });

      const allClosed = updatedIssues.every(i => i.status === "Closed");
      const allOpen = updatedIssues.every(i => i.status === "Open" || !i.status);
      
      let nextOverallStatus: AuditLogEntry["status"] = "In Progress";
      if (allClosed) {
        nextOverallStatus = "Resolved";
      } else if (allOpen) {
        nextOverallStatus = "Open";
      }

      const updatedReport = {
        ...targetLog.report,
        issues: updatedIssues
      };

      // Update active report and pool logs in memory instantly
      setActiveReport(updatedReport);
      setPoolLogs((prev) =>
        prev.map((l) =>
          l.id === activeLogId
            ? { ...l, report: updatedReport, status: nextOverallStatus }
            : l
        )
      );

      try {
        const res = await fetch(`/api/shared-pool/${activeLogId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ report: updatedReport, status: nextOverallStatus })
        });
        if (res.ok) {
          fetchPoolLogs();
        }
      } catch (err) {
        console.warn("Failed to update central pool issue status remotely:", err);
      }
    } else {
      const updatedLogs = logs.map((log) => {
        if (log.id === activeLogId) {
          const updatedIssues = log.report.issues.map((issue, idx) => {
            if (idx === issueIndex) {
              return { ...issue, status: newStatus };
            }
            return issue;
          });

          const allClosed = updatedIssues.every(i => i.status === "Closed");
          const allOpen = updatedIssues.every(i => i.status === "Open" || !i.status);
          
          let nextOverallStatus: AuditLogEntry["status"] = "In Progress";
          if (allClosed) {
            nextOverallStatus = "Resolved";
          } else if (allOpen) {
            nextOverallStatus = "Open";
          }

          const updatedReport = {
            ...log.report,
            issues: updatedIssues
          };

          setActiveReport(updatedReport);

          return {
            ...log,
            report: updatedReport,
            status: nextOverallStatus
          };
        }
        return log;
      });

      saveLogs(updatedLogs);
    }
  };

  // Workbench: Update active log's overall status directly (for both Sandbox and Central Pool)
  const handleUpdateActiveLogStatus = async (newOverallStatus: "Open" | "In Progress" | "Resolved") => {
    if (!activeLogId) return;

    const isPoolLog = activeLogId.startsWith("pool-") || poolLogs.some((l) => l.id === activeLogId);
    if (isPoolLog) {
      setPoolLogs((prev) => prev.map((l) => (l.id === activeLogId ? { ...l, status: newOverallStatus } : l)));
      try {
        const res = await fetch(`/api/shared-pool/${activeLogId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newOverallStatus })
        });
        if (res.ok) {
          fetchPoolLogs();
        }
      } catch (err) {
        console.warn("Failed to update central pool status remotely:", err);
      }
    } else {
      const updatedLogs = logs.map((log) => {
        if (log.id === activeLogId) {
          return { ...log, status: newOverallStatus };
        }
        return log;
      });

      saveLogs(updatedLogs);
    }
  };

  // Ledger: Notes update callback (for both Sandbox and Central Pool)
  const handleUpdateLogNotes = async (id: string, notes: string) => {
    const isPoolLog = id.startsWith("pool-") || poolLogs.some((l) => l.id === id);
    if (isPoolLog) {
      setPoolLogs((prev) => prev.map((l) => (l.id === id ? { ...l, notes } : l)));
      try {
        const res = await fetch(`/api/shared-pool/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes })
        });
        if (res.ok) {
          fetchPoolLogs();
        }
      } catch (err) {
        console.warn("Failed to update central pool notes remotely:", err);
      }
    } else {
      const updated = logs.map((log) => (log.id === id ? { ...log, notes } : log));
      saveLogs(updated);
    }
  };

  // Ledger: Delete log callback (for both Sandbox and Central Pool)
  const handleDeleteLog = async (id: string) => {
    const isPoolLog = id.startsWith("pool-") || poolLogs.some((l) => l.id === id);
    if (isPoolLog) {
      setPoolLogs((prev) => prev.filter((l) => l.id !== id));
      if (activeLogId === id) {
        setActiveLogId(null);
        setActiveReport(null);
      }
      try {
        const res = await fetch(`/api/shared-pool/${id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          fetchPoolLogs();
        }
      } catch (err) {
        console.warn("Failed to delete central pool log remotely:", err);
      }
    } else {
      const updated = logs.filter((log) => log.id !== id);
      saveLogs(updated);
      if (activeLogId === id) {
        setActiveLogId(null);
        setActiveReport(null);
      }
    }
  };

  // Ledger selection handler for pool or sandbox logs
  const handleSelectPoolOrSandboxLog = (id: string) => {
    if (activeLogId === id || !id) {
      setActiveLogId(null);
      setActiveReport(null);
      setCurrentImageSrc(null);
      return;
    }
    setActiveLogId(id);
    const isPoolLog = id.startsWith("pool-") || poolLogs.some((l) => l.id === id);
    const targetLog = isPoolLog 
      ? poolLogs.find((l) => l.id === id) 
      : logs.find((l) => l.id === id);
    
    if (targetLog) {
      setActiveReport(targetLog.report);
      setCurrentImageSrc(targetLog.imageSrc);
      if (activeMode === "video") {
        setActiveMode("upload");
      }
    }
  };

  // Initial effect if needed on mount
  useEffect(() => {
    // Starts blank for custom reporting
  }, []);

  return (
    <div 
      style={themeStyles}
      className={`min-h-screen flex flex-col bg-transparent relative theme-type-${activeTheme.type} transition-colors duration-300`}
    >
      {/* Mesh Background */}
      <div className="mesh-bg" />

      {!isLoggedIn ? (
        /* STUNNING LOGIN PORTAL GATING SCREEN */
        <div className="flex-1 flex items-center justify-center py-12 px-4 relative z-10">
          <div className="glass-panel border border-white/10 shadow-2xl p-8 rounded-3xl bg-slate-900/80 max-w-md w-full mx-4 animate-fade-in text-white">
            {/* Header branding */}
            <div className="text-center space-y-2.5 mb-6">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/35 flex items-center justify-center text-indigo-400 relative overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                <HardHat className="w-6 h-6 relative z-10" />
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent blur-[0.5px] animate-scan z-20" />
              </div>
              <h1 className="text-xl font-black tracking-tight font-display text-white">SafetySphere Compliance Portal</h1>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Secure workforce gate for UA/UC hazard reporting, remediation tracking, and EHS analysis.
              </p>
            </div>

            {/* Error alerts */}
            {loginError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Kay Tee"
                    className="w-full pl-9.5 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white/[0.08] transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="e.g. kayteemee@gmail.com"
                    className="w-full pl-9.5 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white/[0.08] transition-all"
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
                  Assign Department
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={userDepartment}
                    onChange={(e) => setUserDepartment(e.target.value)}
                    className="w-full pl-9.5 pr-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="Operations">Operations Department</option>
                    <option value="Logistics">Logistics Department</option>
                    <option value="Maintenance">Maintenance Department</option>
                    <option value="EHS Safety">EHS Safety Department</option>
                    <option value="Engineering">Engineering Department</option>
                    <option value="Production">Production Department</option>
                    <option value="Administration">Administration & HR</option>
                  </select>
                </div>
              </div>

              {/* Access Role Switcher Tab */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
                  Select Portal Access Level
                </label>
                <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setUserRole("reporter")}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      userRole === "reporter"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    Safety Reporter Portal
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRole("hse")}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      userRole === "hse"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    HSE Monitor Dashboard
                  </button>
                </div>
              </div>

              {/* HSE Bypass Key Keyed Reveal */}
              {userRole === "hse" && (
                <div className="space-y-1.5 pt-1 bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10 animate-slide-down">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-indigo-300 font-bold block flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    HSE Team Bypass Access Key
                  </label>
                  <div className="relative">
                    <input
                      type={showHseAccessKey ? "text" : "password"}
                      required
                      value={hseAccessKey}
                      onChange={(e) => setHseAccessKey(e.target.value)}
                      placeholder="Enter HSE Key (Hint: use HSE123)"
                      className="w-full pl-3 pr-10 py-1.5 bg-slate-950 border border-indigo-500/30 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-400 font-mono tracking-widest text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setShowHseAccessKey(!showHseAccessKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-400 transition-colors p-1 rounded-md hover:bg-white/5 cursor-pointer flex items-center justify-center"
                      title={showHseAccessKey ? "Hide key" : "Show key"}
                    >
                      {showHseAccessKey ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <span className="text-[9px] text-slate-400 text-center block mt-1">
                    Authorization key is required to review full-site databases & trends.
                  </span>
                </div>
              )}

              {/* Submit Action */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-lg active:scale-98 flex items-center justify-center gap-1.5 border border-indigo-400/20 mt-4 uppercase tracking-wider"
              >
                <span>Authorize Portal Entry</span>
                <LogIn className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* CORE WORKSPACE APPLICATIONS AFTER SUCCESSFUL AUTHENTICATION */
        <>
          {/* Top Professional Header */}
          <header className="glass-panel border-b border-white/10 text-white sticky top-0 z-50 shadow-md backdrop-blur-md rounded-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-3.5">
                {/* App Branding Section */}
                <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 shadow-[0_0_15px_rgba(99,102,241,0.35)] border border-indigo-400/30 overflow-hidden shrink-0">
                      <img 
                        src={safetyMonitorLogo} 
                        alt="Workplace Safety Monitor Logo" 
                        className="w-full h-full object-cover relative z-10"
                        referrerPolicy="no-referrer"
                      />
                      {/* Visual scan light bar animation sweep */}
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent blur-[0.5px] animate-scan z-20" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h1 className="text-sm font-extrabold tracking-tight text-white font-display">Workplace Safety Monitor</h1>
                        <span className="text-[9px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                          {userRole === "hse" ? "Admin Panel" : "Reporter"}
                        </span>
                      </div>
                      <p className="text-[10px] text-indigo-300/80 font-medium tracking-wide">Computer Vision Multi-Standard Inspection Tool</p>
                    </div>
                  </div>

                  {/* Mobile Quick Profile Summary */}
                  <div className="flex lg:hidden items-center gap-2">
                    <button
                      onClick={toggleTheme}
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white"
                      title="Toggle theme"
                    >
                      {themeId === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 hover:text-white"
                      title="Sign Out"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
    
                {/* Header Controls Toolbar */}
                <div className="flex items-center flex-wrap justify-center lg:justify-end gap-2 w-full lg:w-auto">
                  {/* Agentic Tools Group */}
                  <div className="flex items-center gap-1.5 bg-slate-950/40 p-1 rounded-xl border border-white/5 shadow-inner">
                    {/* Interactive Guided Demo Tour Trigger */}
                    <button
                      onClick={() => setIsDemoTourOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 hover:text-white border border-amber-500/35 transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                      title="Start Auto-Play Guided Demo Tour for Judges & Video Recording"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span className="text-[11px] uppercase tracking-wider">
                        Demo Tour
                      </span>
                    </button>

                    {/* Agent Pipeline Architecture Trigger */}
                    <button
                      onClick={() => setIsArchitectureOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 hover:text-white border border-blue-500/30 transition-all cursor-pointer"
                      title="Open Autonomous Agent Architecture & Pipeline Diagram"
                    >
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-[11px] uppercase tracking-wider">
                        Architecture
                      </span>
                    </button>

                    {/* Presentation Slides Deck Trigger */}
                    <button
                      onClick={() => setIsPresentationOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 hover:text-white border border-indigo-500/25 transition-all cursor-pointer"
                      title="Open Slide Deck"
                    >
                      <Presentation className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[11px] uppercase tracking-wider">
                        Deck
                      </span>
                    </button>

                    {/* Guided Gemini Key Setup Button */}
                    <button
                      onClick={() => setIsApiKeyModalOpen(true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        userApiKey && userApiKey.trim().length > 5
                          ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-white border-emerald-500/30"
                          : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white border-amber-500/35"
                      }`}
                      title={userApiKey ? "Your Free Gemini Key is Active ($0 Cost)" : "Get Free Gemini API Key ($0 Cost)"}
                    >
                      {userApiKey && userApiKey.trim().length > 5 ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                      ) : (
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span className="text-[11px] uppercase tracking-wider">
                        {userApiKey && userApiKey.trim().length > 5 ? "Key Active ($0)" : "Free Key"}
                      </span>
                    </button>
                  </div>

                  {/* Connected Profile Card (Desktop) */}
                  <div className="hidden sm:flex items-center gap-2.5 bg-white/5 border border-white/10 px-3 py-1 rounded-xl text-left">
                    <div className="relative">
                      <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center font-black text-[11px] text-white uppercase shadow-xs">
                        {userName ? userName.charAt(0) : "U"}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-slate-900" />
                    </div>
                    <div className="leading-tight">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white truncate max-w-[100px]" title={userName}>
                          {userName}
                        </span>
                        {userRole === "hse" ? (
                          <span className="text-[8px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/35 px-1 rounded-xs uppercase">
                            HSE
                          </span>
                        ) : (
                          <span className="text-[8px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/35 px-1 rounded-xs uppercase">
                            Rep
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 block tracking-wide truncate max-w-[110px]" title={`${userDepartment} Dept`}>
                        {userDepartment} Dept
                      </span>
                    </div>
                  </div>
    
                  {/* Custom Theme Toggle Button (Desktop) */}
                  <button
                    onClick={toggleTheme}
                    className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer text-slate-300 hover:text-white"
                    title={`Switch to ${themeId === "dark" ? "Light Mode" : "Dark Mode"}`}
                  >
                    {themeId === "dark" ? (
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                  </button>

                  {/* Secure Sign Out Button (Desktop) */}
                  <button
                    onClick={handleSignOut}
                    className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 hover:text-white transition-all cursor-pointer"
                    title="Sign Out of Portal"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Container */}
          <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">
        
        <div className="space-y-6 animate-fade-in">
          {/* Actionable Minimal "How to Use" Guide (Reporter only) */}
          {userRole === "reporter" && (
            <div className="glass-panel rounded-xl p-4 border border-white/10 animate-fade-in bg-slate-900/40">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
                {/* Left Column: Quick Header */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-white">How to Use</h3>
                    <p className="text-[10px] text-slate-400">Core audit checklist</p>
                  </div>
                </div>

                {/* Steps grid */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 w-full">
                  <div className="flex items-start gap-2.5">
                    <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 shrink-0">01</span>
                    <div>
                      <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Choose Scenario</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Select an industrial preset or feed your own live camera view.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 border-t sm:border-t-0 sm:border-l border-white/5 pt-2 sm:pt-0 sm:pl-4 md:pl-6">
                    <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 shrink-0">02</span>
                    <div>
                      <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Run Compliance Scan</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Select a safety rule & run computer vision analysis to overlay coordinate boxes.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 border-t sm:border-t-0 sm:border-l border-white/5 pt-2 sm:pt-0 sm:pl-4 md:pl-6">
                    <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 shrink-0">03</span>
                    <div>
                      <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Log & Remediate</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Track OSHA rules, assign remediation tasks, and check real-time safety logs.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Mode Tab Selector (Reporter only) */}
          {userRole === "reporter" && (
            <div className="flex gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl max-w-md mx-auto relative z-10 animate-fade-in shadow-inner">
              <button
                onClick={() => setLogsMode("sandbox")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  logsMode === "sandbox"
                    ? "bg-indigo-600 text-white shadow-md border border-indigo-500/20"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Compliance Scanner</span>
              </button>
              <button
                onClick={() => {
                  setLogsMode("pool");
                  fetchPoolLogs();
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
                  logsMode === "pool"
                    ? "bg-indigo-600 text-white shadow-md border border-indigo-500/20"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>My Reported Audits</span>
                {myUnifiedLogs.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-slate-900 animate-pulse">
                    {myUnifiedLogs.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Centralized View Routing */}
          {logsMode === "pool" ? (
            <div className="space-y-6">
              <CompanySafetyLedger
                role={userRole}
                logs={userRole === "reporter" ? myUnifiedLogs : poolLogs}
                activeLogId={activeLogId}
                activeReport={activeReport}
                onSelectLog={handleSelectPoolOrSandboxLog}
                onUpdateStatus={handleUpdateLogStatus}
                onUpdateNotes={handleUpdateLogNotes}
                onDeleteLog={handleDeleteLog}
                isSyncing={isSyncingPool}
                onRefresh={fetchPoolLogs}
                auditorName={auditorName}
                onChangeAuditorName={handleUpdateAuditorName}
                onUpdateIssueStatus={handleUpdateIssueStatus}
                onUpdateOverallStatus={handleUpdateActiveLogStatus}
              />
            </div>
          ) : (
            <>
              {/* Step 1: Scenario / Ingestion Source Selector */}
              <ScenarioSelector
                imageSrc={currentImageSrc}
                onImageUploaded={handleImageUploaded}
                activeMode={activeMode}
                setActiveMode={setActiveMode}
              />

              {/* Step 2 & 3: Workbench layout */}
              {activeMode === "video" ? (
                <LiveVideoAnalyzer 
                  onSaveToLedger={(newLog) => saveLogs([newLog, ...logs])} 
                  userApiKey={userApiKey}
                  onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
                />
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  {/* Image terminal feed */}
                  <div className="xl:col-span-7">
                    <ScanTerminal
                      imageSrc={currentImageSrc}
                      activeMode={activeMode}
                      onTriggerScan={handleTriggerScan}
                      isScanning={isScanning}
                      activeReport={activeReport}
                      hoveredIssueIndex={hoveredIssueIndex}
                      setHoveredIssueIndex={setHoveredIssueIndex}
                      selectedIssueIndex={selectedIssueIndex}
                      setSelectedIssueIndex={setSelectedIssueIndex}
                      userApiKey={userApiKey}
                      onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
                    />
                  </div>

                  {/* Detected safety compliance reports list */}
                  <div className="xl:col-span-5 space-y-4">
                    {/* Sandbox Publication Prompter */}
                    {activeReport && activeLogId && !activeLogId.startsWith("pool-") && (
                      <div className="glass-panel p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shadow-[0_0_15px_rgba(99,102,241,0.05)]">
                        <div className="text-left">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-indigo-400" />
                            Submit to Company Pool?
                          </h4>
                          <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
                            Publish this report to the shared corporate ledger for team-wide remediation.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const log = logs.find(l => l.id === activeLogId);
                            if (log) handlePublishToPool(log);
                          }}
                          disabled={isSyncingPool}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md shrink-0 flex items-center justify-center gap-1.5 border border-indigo-400/20 active:scale-95 disabled:opacity-50"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Submit to Pool</span>
                        </button>
                      </div>
                    )}

                    <SafetyIssueList
                      report={activeReport}
                      isScanning={isScanning}
                      hoveredIssueIndex={hoveredIssueIndex}
                      setHoveredIssueIndex={setHoveredIssueIndex}
                      selectedIssueIndex={selectedIssueIndex}
                      setSelectedIssueIndex={setSelectedIssueIndex}
                      activeLog={myUnifiedLogs.find(l => l.id === activeLogId) || poolLogs.find(l => l.id === activeLogId) || logs.find(l => l.id === activeLogId)}
                      onUpdateIssueStatus={handleUpdateIssueStatus}
                      onUpdateOverallStatus={handleUpdateActiveLogStatus}
                      imageSrc={currentImageSrc}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      </>
      )}

      {/* Bottom Professional Disclaimer Footer */}
      <footer className="glass-panel border-t border-white/10 py-5 mt-auto text-center text-[11px] text-slate-400 rounded-none">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-medium">
          <p className="text-slate-300">
            &copy; 2026 Workplace Safety Monitor. Engineered using Gemini Computer Vision AI.
          </p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1 text-slate-300">
              <HardHat className="w-3.5 h-3.5 text-slate-400" />
              Autonomous Industrial Hazard &amp; Compliance Inspection Engine
            </span>
          </div>
        </div>
      </footer>

      {/* Interactive Team Presentation Slide Deck */}
      <PresentationModal 
        isOpen={isPresentationOpen} 
        onClose={() => setIsPresentationOpen(false)} 
      />

      {/* Autonomous Agent Pipeline Architecture Modal */}
      <AgentArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      {/* Autonomous Agent Guided Demo Tour Modal */}
      <AutoPlayDemoModal
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
        onSelectScenario={(scId) => {
          setIsDemoTourOpen(false);
          setLogsMode("sandbox");
        }}
        onOpenArchitecture={() => {
          setIsDemoTourOpen(false);
          setIsArchitectureOpen(true);
        }}
        onOpenPresentation={() => {
          setIsDemoTourOpen(false);
          setIsPresentationOpen(true);
        }}
      />

      {/* Guided 1-Click Zero-Cost Gemini Key Setup Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={userApiKey}
        onSaveKey={handleSaveApiKey}
        onClearKey={handleClearApiKey}
      />
    </div>
  );
}
