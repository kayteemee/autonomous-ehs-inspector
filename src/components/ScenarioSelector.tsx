import React, { useRef } from "react";
import { UploadCloud, Camera, ShieldAlert, Video } from "lucide-react";

interface ScenarioSelectorProps {
  imageSrc: string | null;
  onImageUploaded: (base64Data: string, fileName: string) => void;
  activeMode: "upload" | "webcam" | "video";
  setActiveMode: (mode: "upload" | "webcam" | "video") => void;
}

export default function ScenarioSelector({
  imageSrc,
  onImageUploaded,
  activeMode,
  setActiveMode,
}: ScenarioSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert uploaded file to base64 with strict validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ["png", "jpg", "jpeg"];

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || "")) {
      alert("Invalid file format. Please upload a picture in PNG, JPG, or JPEG format.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      onImageUploaded(base64String, file.name);
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div id="scenario-selector" className="glass-panel rounded-2xl shadow-lg p-5 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
            Select Ingestion Source
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">Upload a photo, capture from live camera, or record a video for computer vision auditing.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => {
              setActiveMode("upload");
              setTimeout(() => {
                fileInputRef.current?.click();
              }, 50);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeMode === "upload"
                ? "bg-indigo-600 text-white shadow-xs border border-indigo-400/20"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>
          <button
            onClick={() => setActiveMode("webcam")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeMode === "webcam"
                ? "bg-indigo-600 text-white shadow-xs border border-indigo-400/20"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Take Picture</span>
          </button>
          <button
            onClick={() => setActiveMode("video")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeMode === "video"
                ? "bg-indigo-600 text-white shadow-xs border border-indigo-400/20"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Record Video (20s)</span>
          </button>
        </div>
      </div>

      {/* Hidden file input always available for triggering */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".png,.jpg,.jpeg"
        className="hidden"
      />
    </div>
  );
}
