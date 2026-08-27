import React, { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, Sparkles, AlertTriangle, Play, HelpCircle, Key, Zap, CheckCircle2 } from "lucide-react";
import { SafetyIssue, SafetyReport } from "../types";

interface ScanTerminalProps {
  imageSrc: string | null;
  activeMode: "upload" | "webcam";
  onTriggerScan: (base64Image: string, focusContext: string) => Promise<void>;
  isScanning: boolean;
  activeReport: SafetyReport | null;
  hoveredIssueIndex: number | null;
  setHoveredIssueIndex: (index: number | null) => void;
  selectedIssueIndex: number | null;
  setSelectedIssueIndex: (index: number | null) => void;
  hideScanButton?: boolean;
  userApiKey?: string;
  onOpenApiKeyModal?: () => void;
}

export default function ScanTerminal({
  imageSrc,
  activeMode,
  onTriggerScan,
  isScanning,
  activeReport,
  hoveredIssueIndex,
  setHoveredIssueIndex,
  selectedIssueIndex,
  setSelectedIssueIndex,
  hideScanButton = false,
  userApiKey,
  onOpenApiKeyModal,
}: ScanTerminalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [focusContext, setFocusContext] = useState("General / Comprehensive Audit (All Scopes)");
  const [webcamSnapshot, setWebcamSnapshot] = useState<string | null>(null);

  // Focus options
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

  // Start or stop webcam stream
  useEffect(() => {
    if (activeMode === "webcam") {
      startCamera();
    } else {
      stopCamera();
      setWebcamSnapshot(null);
    }
    return () => {
      stopCamera();
    };
  }, [activeMode]);

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
        "Could not access webcam. If you are in the AI Studio preview frame, try opening the application in a new window/tab, or ensure camera permissions are allowed in your browser settings."
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCaptureAndScan = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 645;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL("image/jpeg");
        setWebcamSnapshot(base64Image);
        await onTriggerScan(base64Image, focusContext);
      }
    }
  };

  const handleScanPresetOrUploaded = async () => {
    if (imageSrc) {
      await onTriggerScan(imageSrc, focusContext);
    }
  };

  // Severity boundary color mapper
  const getSeverityStyles = (severity: string, isHovered: boolean, isSelected: boolean) => {
    const active = isHovered || isSelected;
    switch (severity) {
      case "critical":
        return {
          border: active ? "border-2 border-red-500 bg-red-500/25" : "border border-red-500/70 bg-red-500/15",
          text: "text-red-400 bg-red-500/10 border-red-500/30"
        };
      case "high":
        return {
          border: active ? "border-2 border-orange-500 bg-orange-500/25" : "border border-orange-500/70 bg-orange-500/15",
          text: "text-orange-400 bg-orange-500/10 border-orange-500/30"
        };
      case "medium":
        return {
          border: active ? "border-2 border-amber-500 bg-amber-500/25" : "border border-amber-500/70 bg-amber-500/15",
          text: "text-amber-400 bg-amber-500/10 border-amber-500/30"
        };
      default:
        return {
          border: active ? "border-2 border-blue-500 bg-blue-500/25" : "border border-blue-500/70 bg-blue-500/15",
          text: "text-blue-400 bg-blue-500/10 border-blue-500/30"
        };
    }
  };

  const currentDisplayImage = activeMode === "webcam" ? (webcamSnapshot || "") : (imageSrc || "");

  return (
    <div id="scan-terminal" className="glass-panel rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            {hideScanButton ? "Compliance Image Visualizer" : "Safety Compliance Workbench"}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {hideScanButton 
              ? "Detailed visual display of detected unsafe acts/unsafe conditions with custom hazard bounding overlays." 
              : "Define your audit context and trigger the Computer Vision AI safety assessment."}
          </p>
        </div>

        {/* Right side: Focus & Key Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {onOpenApiKeyModal && (
            <button
              type="button"
              onClick={onOpenApiKeyModal}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                userApiKey && userApiKey.trim().length > 5
                  ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30"
              }`}
              title={userApiKey ? "Using your personal Gemini API Key" : "Click to setup your free Gemini API Key ($0 cost)"}
            >
              {userApiKey && userApiKey.trim().length > 5 ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              ) : (
                <Key className="w-3.5 h-3.5" />
              )}
              <span>
                {userApiKey && userApiKey.trim().length > 5 ? "Key Active ($0 Cost)" : "Setup Free Key"}
              </span>
            </button>
          )}

          {/* Focus Dropdown */}
          {!hideScanButton && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit Focus Scope</label>
              <select
                value={focusContext}
                onChange={(e) => setFocusContext(e.target.value)}
                disabled={isScanning}
                className="text-xs font-semibold text-slate-200 bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors cursor-pointer animate-fade-in"
              >
                {FOCUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-slate-900 text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Terminal Viewport */}
      <div className="w-full flex flex-col">
        <div className="flex flex-col">
          {/* Visual Display Screen */}
          <div 
            ref={containerRef}
            className="relative rounded-xl border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center min-h-[200px] md:min-h-[300px] max-h-[320px] shadow-inner"
          >
            {/* 1. WEBCAM FEED MODE */}
            {activeMode === "webcam" && !webcamSnapshot && (
              <div className="relative w-full h-full flex items-center justify-center">
                {cameraError ? (
                  <div className="p-6 text-center max-w-sm">
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
                ) : (
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
                      className="w-full h-full object-contain max-h-[320px]"
                    />
                    <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse border border-emerald-400/20">
                      <span className="w-1.5 h-1.5 bg-white rounded-full" />
                      LIVE FEED
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. STATIC SCENARIO OR IMAGE MODE */}
            {(activeMode !== "webcam" || webcamSnapshot) && currentDisplayImage && (
              <div className="relative max-h-[320px] overflow-hidden select-none">
                <img
                  src={currentDisplayImage}
                  alt="Workplace compliance scene"
                  referrerPolicy="no-referrer"
                  className="max-h-[320px] object-contain w-full h-full block"
                />

                {/* Sweeping Laser Scan Animation */}
                {isScanning && (
                  <div className="absolute left-0 right-0 h-1.5 bg-indigo-500/80 shadow-[0_0_12px_#6366f1] animate-[bounce_3s_infinite] pointer-events-none" />
                )}

                {/* Bounding Box Overlays */}
                {!isScanning && activeReport && activeReport.issues && (
                  activeReport.issues.map((issue, idx) => {
                    if (!issue.boundingBox) return null;
                    const [ymin, xmin, ymax, xmax] = issue.boundingBox;
                    const isHovered = hoveredIssueIndex === idx;
                    const isSelected = selectedIssueIndex === idx;
                    const styles = getSeverityStyles(issue.severity, isHovered, isSelected);

                    return (
                      <button
                        key={idx}
                        onMouseEnter={() => setHoveredIssueIndex(idx)}
                        onMouseLeave={() => setHoveredIssueIndex(null)}
                        onClick={() => setSelectedIssueIndex(idx)}
                        className={`absolute rounded transition-all duration-150 cursor-pointer ${styles.border}`}
                        style={{
                          top: `${ymin}%`,
                          left: `${xmin}%`,
                          width: `${xmax - xmin}%`,
                          height: `${ymax - ymin}%`,
                        }}
                      >
                        {/* Hazard Hover Badge */}
                        {(isHovered || isSelected) && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-slate-950 border border-white/10 text-white text-[10px] font-semibold px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 flex items-center gap-1">
                            <span className="w-2 h-2 bg-rose-500 rounded-full" />
                            {issue.title}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* 3. EMPTY STATE */}
            {!currentDisplayImage && activeMode !== "webcam" && (
              <div className="text-center text-slate-400 p-8 max-w-sm">
                <HelpCircle className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-300">No workplace image loaded</p>
                <p className="text-[11px] text-slate-500 mt-1">Please upload a photo or capture a frame from webcam to start safety computer vision auditing.</p>
              </div>
            )}

            {/* Hidden canvas for taking video snapshots */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Action Trigger Panel */}
          {!hideScanButton ? (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              {activeMode === "webcam" && webcamSnapshot ? (
                <button
                  onClick={() => {
                    setWebcamSnapshot(null);
                    startCamera();
                  }}
                  disabled={isScanning}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Clear & Restart Live Camera Feed
                </button>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] text-slate-400 font-medium">
                    {activeMode === "webcam" ? "Ready to capture a frame from webcam" : "Uploaded workplace photo loaded."}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-400">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500">Legend:</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-red-500/30 border border-red-500" /> Critical
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-orange-500/30 border border-orange-500" /> High
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-amber-500/30 border border-amber-500" /> Mid
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded bg-blue-500/30 border border-blue-500" /> Low
                    </span>
                  </div>
                </div>
              )}

              {/* Scan Buttons */}
              {activeMode === "webcam" ? (
                !webcamSnapshot ? (
                  <button
                    onClick={handleCaptureAndScan}
                    disabled={!stream || isScanning}
                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-white/5 disabled:text-slate-500 disabled:border-white/5 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:pointer-events-none"
                  >
                    <Camera className="w-4 h-4" />
                    Capture & Run AI Safety Scan
                  </button>
                ) : (
                  <button
                    onClick={() => onTriggerScan(webcamSnapshot, focusContext)}
                    disabled={isScanning}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
                    Re-analyze Snapshot
                  </button>
                )
              ) : (
                <button
                  onClick={handleScanPresetOrUploaded}
                  disabled={!imageSrc || isScanning}
                  className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-white/5 disabled:text-slate-500 disabled:border-white/5 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:pointer-events-none"
                >
                  {isScanning ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  {isScanning ? "Running Computer Vision Audit..." : "Run AI Computer Vision Audit"}
                </button>
              )}
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-400">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Severity Legend:</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-red-500/30 border border-red-500" /> Critical Hazard
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-orange-500/30 border border-orange-500" /> High Risk
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-amber-500/30 border border-amber-500" /> Mid Risk
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-blue-500/30 border border-blue-500" /> Low Risk
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
