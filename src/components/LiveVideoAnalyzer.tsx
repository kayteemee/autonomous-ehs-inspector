import React, { useEffect, useRef, useState } from "react";
import { 
  Video, Play, Square, Circle, RefreshCw, AlertTriangle, 
  CheckCircle2, Trash2, Sparkles, Clock, ShieldAlert, 
  FileSpreadsheet, Save, ChevronRight, HelpCircle
} from "lucide-react";
import { SafetyIssue, SafetyReport, AuditLogEntry } from "../types";
import { performSafetyAnalysis } from "../services/geminiSafetyService";

interface LiveVideoAnalyzerProps {
  onSaveToLedger: (entry: AuditLogEntry) => void;
  userApiKey?: string;
  onOpenApiKeyModal?: () => void;
}

interface CapturedFrame {
  index: number;
  timestampStr: string;
  timestampSec: number;
  imageSrc: string; // Base64
  report: SafetyReport | null;
  status: "idle" | "scanning" | "completed" | "failed";
}

export default function LiveVideoAnalyzer({ 
  onSaveToLedger,
  userApiKey,
  onOpenApiKeyModal,
}: LiveVideoAnalyzerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Camera & recording states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>([]);
  const [focusContext, setFocusContext] = useState("General / Comprehensive Audit (All Scopes)");

  // Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number | null>(null);
  const [activeIssueIndex, setActiveIssueIndex] = useState<number | null>(null);
  const [hoveredIssueIndex, setHoveredIssueIndex] = useState<number | null>(null);

  const FOCUS_OPTIONS = [
    "General / Comprehensive Audit (All Scopes)",
    "PPE & Personal Protective Wear",
    "Slips, Trips, & Falls (Housekeeping)",
    "Hazardous Materials & Chemical Safety (HAZMAT)",
    "Ladders, Scaffolding, & Working at Heights",
    "Emergency Preparedness & First Aid",
    "Hygiene, Ventilation, & Air Quality",
    "Fire Safety & Emergency Exit Obstruction",
    "Heavy Warehousing & Vehicle separation",
    "Ergonomic Lifting & Machinery Safeguards",
    "Electrical Safety & Wiring Inspections"
  ];

  const MAX_RECORDING_SECONDS = 20;
  const CAPTURE_INTERVAL_MS = 1500;

  // Start camera on mount & cleanup stream on unmount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Handle timer & frame grabbing during recording
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const frameGrabberRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        "Could not access video. Ensure you are on a secure (HTTPS) origin and camera permissions are granted in your browser."
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleStartRecording = async () => {
    // Reset old states
    setCapturedFrames([]);
    setRecordingSeconds(0);
    setActiveFrameIndex(null);
    setActiveIssueIndex(null);
    
    if (!stream) {
      await startCamera();
    }
    
    setIsRecording(true);

    // Track recording seconds
    let seconds = 0;
    timerRef.current = setInterval(() => {
      seconds += 1;
      setRecordingSeconds(seconds);
      if (seconds >= MAX_RECORDING_SECONDS) {
        handleStopRecording();
      }
    }, 1000);

    // Periodically grab frames from the live video element
    const framesList: CapturedFrame[] = [];
    let frameCounter = 0;

    // Grab first frame instantly
    setTimeout(() => {
      grabFrame(frameCounter++, 0, framesList);
    }, 100);

    frameGrabberRef.current = setInterval(() => {
      const currentSec = (frameCounter * CAPTURE_INTERVAL_MS) / 1000;
      if (currentSec <= MAX_RECORDING_SECONDS) {
        grabFrame(frameCounter++, currentSec, framesList);
      }
    }, CAPTURE_INTERVAL_MS);
  };

  const grabFrame = (index: number, timestampSec: number, framesList: CapturedFrame[]) => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 645;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL("image/jpeg");
      const timestampStr = `${timestampSec.toFixed(1)}s`;

      const newFrame: CapturedFrame = {
        index,
        timestampStr,
        timestampSec,
        imageSrc: base64Image,
        report: null,
        status: "idle",
      };

      setCapturedFrames((prev) => [...prev, newFrame]);
      framesList.push(newFrame);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (frameGrabberRef.current) clearInterval(frameGrabberRef.current);
    stopCamera();

    // Select the first frame by default for review
    setActiveFrameIndex(0);
  };

  const handleRunVideoAnalysis = async () => {
    if (capturedFrames.length === 0) return;
    setIsAnalyzing(true);

    // Analyze frames sequentially or with minor staggered delays
    const updatedFrames = [...capturedFrames];

    for (let i = 0; i < updatedFrames.length; i++) {
      // Set frame status to scanning
      updatedFrames[i].status = "scanning";
      setCapturedFrames([...updatedFrames]);
      setActiveFrameIndex(i); // Focus on the frame being analyzed

      try {
        const report = await performSafetyAnalysis(
          updatedFrames[i].imageSrc,
          focusContext,
          userApiKey,
          updatedFrames[i].index
        );

        updatedFrames[i].report = report;
        updatedFrames[i].status = "completed";
      } catch (err) {
        console.error(`Error analyzing frame ${i}:`, err);
        updatedFrames[i].status = "failed";
      }

      setCapturedFrames([...updatedFrames]);
    }

    setIsAnalyzing(false);
    setActiveFrameIndex(0); // Return focus to first frame
  };

  const handleReset = () => {
    setCapturedFrames([]);
    setRecordingSeconds(0);
    setActiveFrameIndex(null);
    setActiveIssueIndex(null);
    setIsAnalyzing(false);
    setCameraError(null);
    startCamera();
  };

  // Compile overall safety statistics across all audited frames
  const totalFrames = capturedFrames.length;
  const analyzedFrames = capturedFrames.filter((f) => f.status === "completed");
  const framesWithIssues = analyzedFrames.filter((f) => (f.report?.issues?.length || 0) > 0);
  
  // Calculate a cumulative safety score
  const avgSafetyScore = analyzedFrames.length > 0
    ? Math.round(analyzedFrames.reduce((acc, f) => acc + (f.report?.safetyScore || 100), 0) / analyzedFrames.length)
    : 100;

  // Flatten all issues with their frame indices and timestamps for the global ledger
  const allDetectedIssues = analyzedFrames.flatMap((frame) => {
    return (frame.report?.issues || []).map((issue, issueIdx) => ({
      ...issue,
      frameIndex: frame.index,
      timestampStr: frame.timestampStr,
      uniqueId: `f${frame.index}-i${issueIdx}`,
    }));
  });

  const handleSaveToLedger = () => {
    if (capturedFrames.length === 0 || analyzedFrames.length === 0) return;

    // Generate a beautiful, detailed compiled summary of findings across the video timeline
    const issuesSummary = allDetectedIssues.length > 0
      ? `Timeline compliance check completed across ${totalFrames} frames. Detected ${allDetectedIssues.length} total OSHA safety concerns. Main focus area was ${focusContext}.`
      : `Video compliance scan completed across ${totalFrames} frames. Zero safety concerns detected. All operations are safe and fully compliant.`;

    const masterReport: SafetyReport = {
      safetyScore: avgSafetyScore,
      summary: `${issuesSummary} Audit focus: ${focusContext}. Avg compliance score: ${avgSafetyScore}%.`,
      issues: allDetectedIssues.map((issue) => ({
        category: issue.category,
        hazardCategory: issue.hazardCategory || (issue.category === "act" ? "PPE" : "Housekeeping"),
        title: `[Frame @ ${issue.timestampStr}] ${issue.title}`,
        severity: issue.severity,
        description: issue.description,
        oshaRule: issue.oshaRule,
        isoRule: issue.isoRule || "ISO 45001:2018 Clause 8.1",
        nfpaRule: issue.nfpaRule || "NFPA 101 Clause 7.1",
        correctiveAction: issue.correctiveAction,
        boundingBox: issue.boundingBox,
      })),
    };

    const firstFrameWithIssues = capturedFrames.find((f) => (f.report?.issues?.length || 0) > 0) || capturedFrames[0];

    const newLog: AuditLogEntry = {
      id: `video-audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      imageName: `video_timeline_audit.mp4`,
      scenarioTitle: `Video Compliance Audit: ${focusContext}`,
      imageSrc: firstFrameWithIssues.imageSrc,
      report: masterReport,
      status: "Open",
    };

    onSaveToLedger(newLog);
    alert("This Frame-by-Frame Video Safety Audit has been compiled and saved to your global Hazard & CAPA Log. You can inspect its full metrics on the 'Hazard & CAPA Log' tab!");
  };

  // Severity style helper for bounding boxes
  const getSeverityStyles = (severity: string, isActive: boolean) => {
    switch (severity) {
      case "critical":
        return {
          border: isActive ? "border-2 border-red-500 bg-red-500/25" : "border border-red-500/70 bg-red-500/15",
          text: "text-red-400 bg-red-500/10 border-red-500/30",
          badge: "bg-red-500/20 text-red-400 border border-red-500/30"
        };
      case "high":
        return {
          border: isActive ? "border-2 border-orange-500 bg-orange-500/25" : "border border-orange-500/70 bg-orange-500/15",
          text: "text-orange-400 bg-orange-500/10 border-orange-500/30",
          badge: "bg-orange-500/20 text-orange-400 border border-orange-500/30"
        };
      case "medium":
        return {
          border: isActive ? "border-2 border-amber-500 bg-amber-500/25" : "border border-amber-500/70 bg-amber-500/15",
          text: "text-amber-400 bg-amber-500/10 border-amber-500/30",
          badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30"
        };
      default:
        return {
          border: isActive ? "border-2 border-blue-500 bg-blue-500/25" : "border border-blue-500/70 bg-blue-500/15",
          text: "text-blue-400 bg-blue-500/10 border-blue-500/30",
          badge: "bg-blue-500/20 text-blue-400 border border-blue-500/30"
        };
    }
  };

  const activeFrame = activeFrameIndex !== null ? capturedFrames[activeFrameIndex] : null;

  return (
    <div className="glass-panel rounded-2xl shadow-lg p-6 mb-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-indigo-400" />
            AI Frame-by-Frame Live Video Safety Analyzer
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Record a live video clip of workplace activities. The AI automatically audits the recording frame by frame to identify hazard trends.
          </p>
        </div>

        {/* Focus Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Video Audit Focus</label>
          <select
            value={focusContext}
            onChange={(e) => setFocusContext(e.target.value)}
            disabled={isRecording || isAnalyzing}
            className="text-xs font-semibold text-slate-200 bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            {FOCUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt} className="bg-slate-900 text-white">
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Workbench Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Video Feed / active Frame Viewport */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* Main Visual Screen */}
          <div className="relative rounded-xl border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center min-h-[200px] md:min-h-[300px] max-h-[320px] shadow-inner">
            
            {/* 1. Camera active but not recording or captured yet */}
            {capturedFrames.length === 0 && !isRecording && (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
                {cameraError ? (
                  <div className="p-4 text-center max-w-sm">
                    <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-rose-200 leading-relaxed">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="mt-3 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry Camera
                    </button>
                  </div>
                ) : stream ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <video
                      ref={(el) => {
                        videoRef.current = el;
                        if (el && stream && el.srcObject !== stream) {
                          el.srcObject = stream;
                        }
                      }}
                      autoPlay
                      playsInline
                      className="w-full max-h-[320px] object-contain"
                    />
                    <div className="absolute top-4 left-4 bg-indigo-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1.5 border border-indigo-400/20">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      CAMERA LIVE FEED
                    </div>
                  </div>
                ) : (
                  <div className="max-w-xs text-center">
                    <Video className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-white">Initialize Compliance Stream</h3>
                    <p className="text-[11px] text-slate-400 mt-1 mb-4 leading-relaxed">
                      To begin a live frame-by-frame workplace safety review, please initialize your video feed.
                    </p>
                    <button
                      onClick={startCamera}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Initialize Video Camera
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 2. Recording in action */}
            {isRecording && (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el && stream && el.srcObject !== stream) {
                      el.srcObject = stream;
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full max-h-[320px] object-contain border-2 border-red-500/50 rounded-lg"
                />
                
                {/* Recording UI overlays */}
                <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-2 border border-red-400/20 animate-pulse shadow-md">
                  <Circle className="w-2.5 h-2.5 fill-current text-white animate-ping" />
                  REC {recordingSeconds}s / {MAX_RECORDING_SECONDS}s
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4/5 bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 transition-all duration-300"
                        style={{ width: `${(recordingSeconds / MAX_RECORDING_SECONDS) * 100}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleStopRecording}
                    className="flex items-center gap-1 bg-white hover:bg-slate-200 text-slate-950 px-3 py-1 rounded-md text-[10px] font-bold uppercase cursor-pointer"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    Stop Recording
                  </button>
                </div>
              </div>
            )}

            {/* 3. Reviewing captured frames */}
            {!isRecording && capturedFrames.length > 0 && activeFrame && (
              <div className="relative w-full h-full flex items-center justify-center max-h-[320px]">
                <img
                  src={activeFrame.imageSrc}
                  alt={`Frame ${activeFrame.index}`}
                  referrerPolicy="no-referrer"
                  className="max-h-[320px] object-contain w-full block"
                />

                {/* Laser scan animation when this specific frame is compiling */}
                {activeFrame.status === "scanning" && (
                  <div className="absolute left-0 right-0 h-1.5 bg-indigo-500/80 shadow-[0_0_12px_#6366f1] animate-[bounce_2s_infinite] pointer-events-none" />
                )}

                {/* Overlay labels */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-slate-950/80 border border-white/15 text-white text-[10px] font-semibold px-2.5 py-1 rounded-md">
                    Frame {activeFrame.index + 1} of {capturedFrames.length}
                  </span>
                  <span className="bg-indigo-600 border border-indigo-400/20 text-white text-[10px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {activeFrame.timestampStr}
                  </span>
                </div>

                {/* Frame safety score indicator */}
                {activeFrame.status === "completed" && activeFrame.report && (
                  <div className="absolute top-4 right-4 bg-slate-950/85 border border-white/15 rounded-lg px-2.5 py-1 text-center">
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Compliance</div>
                    <div className={`text-sm font-bold font-mono ${
                      activeFrame.report.safetyScore >= 80 ? "text-emerald-400" :
                      activeFrame.report.safetyScore >= 60 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {activeFrame.report.safetyScore}%
                    </div>
                  </div>
                )}

                {/* Highlight safety hazard bounding boxes */}
                {activeFrame.status === "completed" && activeFrame.report?.issues && (
                  activeFrame.report.issues.map((issue, idx) => {
                    if (!issue.boundingBox) return null;
                    const [ymin, xmin, ymax, xmax] = issue.boundingBox;
                    const isActive = activeIssueIndex === idx;
                    const styles = getSeverityStyles(issue.severity, isActive);

                    return (
                      <button
                        key={idx}
                        onMouseEnter={() => setHoveredIssueIndex(idx)}
                        onMouseLeave={() => setHoveredIssueIndex(null)}
                        onClick={() => setActiveIssueIndex(idx)}
                        className={`absolute rounded transition-all duration-150 cursor-pointer ${styles.border}`}
                        style={{
                          top: `${ymin}%`,
                          left: `${xmin}%`,
                          width: `${xmax - xmin}%`,
                          height: `${ymax - ymin}%`,
                        }}
                      >
                        {(hoveredIssueIndex === idx || isActive) && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-slate-950 border border-white/15 text-white text-[10px] font-semibold px-2.5 py-1 rounded shadow-xl whitespace-nowrap z-50">
                            <span className="text-red-400 font-bold">[{issue.severity.toUpperCase()}]</span> {issue.title}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* Hidden canvas for taking video snapshots */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Frame timeline navigation rail */}
          {!isRecording && capturedFrames.length > 0 && (
            <div className="glass-panel bg-white/5 border border-white/10 rounded-xl p-3.5">
              <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                Recorded Clip Timeline ({capturedFrames.length} frames captured)
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                {capturedFrames.map((frame, idx) => {
                  const isSelected = activeFrameIndex === idx;
                  const hasIssues = frame.report && (frame.report.issues?.length || 0) > 0;
                  const complianceScore = frame.report?.safetyScore;

                  return (
                    <button
                      key={frame.index}
                      onClick={() => {
                        setActiveFrameIndex(idx);
                        setActiveIssueIndex(null);
                      }}
                      className={`relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? "border-indigo-500 scale-[1.03] shadow-md shadow-indigo-500/10" 
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <img 
                        src={frame.imageSrc} 
                        alt={`Frame ${idx}`} 
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 bg-slate-900/80 text-[8px] font-bold px-1.5 rounded text-slate-200">
                        {frame.timestampStr}
                      </span>

                      {/* Diagnostic Status overlays on thumbnails */}
                      {frame.status === "scanning" && (
                        <div className="absolute inset-0 bg-indigo-950/60 flex items-center justify-center">
                          <RefreshCw className="w-4 h-4 text-white animate-spin" />
                        </div>
                      )}

                      {frame.status === "completed" && (
                        <div className="absolute top-1 right-1 flex gap-1">
                          {hasIssues ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white shadow-xs" title="OSHA non-compliance found" />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white shadow-xs" title="No violations detected" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clip Control bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              {capturedFrames.length === 0 && !isRecording && (
                <button
                  onClick={handleStartRecording}
                  disabled={!stream}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all animate-pulse hover:scale-105 cursor-pointer"
                >
                  <Circle className="w-4 h-4 fill-current text-white" />
                  Start Live Clip Recording
                </button>
              )}

              {capturedFrames.length > 0 && !isRecording && (
                <>
                  <button
                    onClick={handleRunVideoAnalysis}
                    disabled={isAnalyzing}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all hover:scale-105 cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
                    {isAnalyzing ? "Processing Video Frames..." : "Begin AI Frame-by-Frame Audit"}
                  </button>

                  <button
                    onClick={handleReset}
                    disabled={isAnalyzing}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Reset Recording
                  </button>
                </>
              )}
            </div>

            {analyzedFrames.length > 0 && !isRecording && (
              <button
                onClick={handleSaveToLedger}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4" />
                Commit Video Audit to OSHA Ledger
              </button>
            )}
          </div>
        </div>

        {/* Right Column - Assessment details & Summarized report */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          
          {/* Analysis Progress panel */}
          {isAnalyzing && (
            <div className="glass-panel bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-5">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                AI Compliance Audit in Progress
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                Gemini Computer Vision is auditing each captured snapshot sequentially to construct a multi-frame temporal safety assessment.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-semibold text-slate-300">
                  <span>Processed:</span>
                  <span>{analyzedFrames.length} / {totalFrames} Frames</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${(analyzedFrames.length / totalFrames) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Video summary score card */}
          {analyzedFrames.length > 0 && (
            <div className="glass-panel bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                Recording Compliance Overview
              </h3>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase -mb-0.5">SCORE</span>
                  <span className={`text-lg font-bold font-mono ${
                    avgSafetyScore >= 80 ? "text-emerald-400" :
                    avgSafetyScore >= 60 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {avgSafetyScore}%
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-white mb-0.5">
                    {avgSafetyScore >= 80 ? "Fully Compliant Site" : 
                     avgSafetyScore >= 60 ? "Moderate Safety Hazards" : "Severe Non-Compliance Threats"}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Based on compliance scanning of {analyzedFrames.length} recorded frames against OSHA guidelines.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-3.5 border-t border-white/10 text-[10px] font-semibold text-slate-300">
                <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                  <span className="block text-slate-400 mb-0.5">Unsafe Frames</span>
                  <span className="text-sm font-bold text-orange-400">{framesWithIssues.length} / {totalFrames}</span>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                  <span className="block text-slate-400 mb-0.5">Total Concerns</span>
                  <span className="text-sm font-bold text-rose-500">{allDetectedIssues.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Active Frame Bounding Box Details (Inspector) */}
          {activeFrame && activeFrame.status === "completed" && activeFrame.report && (
            <div className="glass-panel bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3.5">
                Active Frame Safety Log ({activeFrame.timestampStr})
              </h3>

              {activeFrame.report.issues.length === 0 ? (
                <div className="text-center py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-emerald-300">All Safe & Compliant</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">No hazards observed in this snapshot.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {activeFrame.report.issues.map((issue, idx) => {
                    const isActive = activeIssueIndex === idx;
                    const styles = getSeverityStyles(issue.severity, isActive);

                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveIssueIndex(idx)}
                        className={`w-full text-left rounded-xl p-3 border transition-all cursor-pointer ${
                          isActive 
                            ? "border-indigo-500 bg-indigo-500/10 shadow-md" 
                            : "border-white/10 bg-white/5 hover:border-white/15"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-white group-hover:text-indigo-400">
                            {issue.title}
                          </h4>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase ${styles.badge}`}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1.5 line-clamp-3 leading-relaxed">
                          {issue.description}
                        </p>
                        
                        {isActive && (
                          <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-[10px] animate-fade-in">
                            <div>
                              <span className="font-bold text-slate-400 block uppercase tracking-wider text-[8px]">OSHA Regulation</span>
                              <span className="text-slate-200 font-mono font-semibold">{issue.oshaRule}</span>
                            </div>
                            <div>
                              <span className="font-bold text-indigo-400 block uppercase tracking-wider text-[8px]">Corrective Action Directive</span>
                              <span className="text-indigo-200 font-medium leading-relaxed block">{issue.correctiveAction}</span>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Summarized report checklist across the entire video */}
          {analyzedFrames.length > 0 && allDetectedIssues.length > 0 && (
            <div className="glass-panel bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2.5">
                Summarized Video Safety Report
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                List of all compliance concerns detected. Click on any item to automatically jump the timeline viewer to that exact timestamp.
              </p>

              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {allDetectedIssues.map((issue) => {
                  const styles = getSeverityStyles(issue.severity, false);
                  const isFrameSelected = activeFrameIndex === issue.frameIndex;

                  return (
                    <button
                      key={issue.uniqueId}
                      onClick={() => {
                        setActiveFrameIndex(issue.frameIndex);
                        // Find and set the active issue index inside that frame
                        const frameObj = capturedFrames[issue.frameIndex];
                        if (frameObj && frameObj.report) {
                          const idx = frameObj.report.issues.findIndex((i) => i.title.includes(issue.title) || i.description.includes(issue.description));
                          if (idx !== -1) setActiveIssueIndex(idx);
                        }
                      }}
                      className={`w-full flex items-center justify-between text-left p-2.5 rounded-lg border transition-all text-[11px] cursor-pointer ${
                        isFrameSelected 
                          ? "border-indigo-500 bg-indigo-500/10" 
                          : "border-white/5 bg-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white truncate">{issue.title}</p>
                          <p className="text-[9px] text-indigo-300 font-semibold font-mono mt-0.5">
                            Timestamp: {issue.timestampStr} | {issue.oshaRule}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick instructions before recording */}
          {capturedFrames.length === 0 && !isRecording && (
            <div className="glass-panel bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col justify-between h-full">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  Video Audit Instructions
                </h4>
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold">1</span>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      Select your target <strong className="text-white">Audit Focus</strong> in the drop-down.
                    </p>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold">2</span>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      Initialize your camera feed and click <strong className="text-white">Start Clip Recording</strong>.
                    </p>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold">3</span>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      Pan your device or perform work in front of the lens. The recording will auto-stop after 8 seconds.
                    </p>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold">4</span>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      Trigger the <strong className="text-white">AI Audit</strong> to run a sequential frame check. Save findings directly to the global database ledger.
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
