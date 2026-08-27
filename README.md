# 🛡️ Workplace Safety Monitor — Autonomous Vision & CAPA Remediation Agent

[![Google Cloud Run](https://img.shields.io/badge/Google%20Cloud-Cloud%20Run-4285F4?logo=google-cloud&logoColor=white)](https://cloud.google.com/run)
[![Google GenAI SDK](https://img.shields.io/badge/Google%20GenAI%20SDK-%40google%2Fgenai-34A853?logo=google&logoColor=white)](https://ai.google.dev/)
[![Gemini Multimodal](https://img.shields.io/badge/Gemini%20Vision-Spatial%20Perception-8E75C2?logo=googlegemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Category**: **Taskmaster (Autonomous Agent & Action Pipeline)**  
> **Autonomous Workplace Safety Inspection, Spatial Hazard Localization, Multi-Standard Legal Compliance (OSHA / ISO 45001 / NFPA), Multi-Channel Dispatch, and Closed-Loop "Before vs. After" Repair Verification.**

---

## 📌 Executive Summary & Problem Framing

Every year, workplace injuries and non-compliance penalties cost global industries over **$250 Billion**. Traditional occupational health & safety (EHS) workflows rely heavily on manual walkthroughs with paper clipboards, delayed reports, and manual hand-off steps that take days or weeks.

**Workplace Safety Monitor** is an autonomous AI agent built with **Gemini Flash & Google GenAI SDK** that eliminates this friction. It replaces passive chat interfaces with a proactive, end-to-end operational pipeline:
1. **Sensory Ingestion**: Ingests high-resolution images, camera streams, or video frames.
2. **Spatial Perception**: Detects multiple hazards simultaneously with normalized pixel bounding box coordinates (`[ymin, xmin, ymax, xmax]`).
3. **Legal Compliance Grounding**: Automatically maps anomalies to **OSHA standards (29 CFR 1910)**, **ISO 45001 clauses**, and **NFPA life safety codes**.
4. **Autonomous Action & Dispatch**: Generates formal Corrective & Preventive Action (CAPA) work orders with SLA countdowns and multi-channel payloads (SMS, Email, ERP Webhooks).
5. **Closed-Loop Verification**: Performs comparative visual inspections on post-repair photos to mathematically verify hazard elimination before closing audit tickets.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SENSORY PERCEPTION INGESTION                       │
│  [ Uploaded Imagery ]     [ Live Camera Snap ]     [ Video Keyframes ]  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              AUTONOMOUS REASONING & SPATIAL PERCEPTION                  │
│                        (Gemini 2.5 / 3.7 Flash)                         │
│  • Multi-Object Spatial Bounding Box Coordinate Extraction              │
│  • Unsafe Act (UA) vs. Unsafe Condition (UC) Categorization             │
│  • Regulatory Matrix Grounding: OSHA (29 CFR) | ISO 45001 | NFPA 101    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             POLICY ENGINE & CAPA WORK ORDER ORCHESTRATOR                │
│  • Hierarchy of Hazard Controls (Elimination, Engineering, Admin, PPE)  │
│  • Risk Priority Number (RPN) & Strict SLA Target Timers (24h/48h/7d)   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      MULTI-CHANNEL DISPATCH LAYER                       │
│  [ SMS Marshal Alert ]     [ Supervisor Email ]     [ ERP / EHS Webhook]│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             CLOSED-LOOP "BEFORE vs. AFTER" REPAIR VERIFICATION          │
│  • Dual-Image Comparative Spatial Inspection                            │
│  • Physical Hazard Eradication Certification & Audit Ledger Commit      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

* **Interactive Spatial Bounding Boxes**: Dynamic SVG overlays rendered directly on top of the inspection media with pulsing focal markers and risk-colored indicators.
* **Pre-Calibrated Benchmark Scenarios**: One-click test scenarios (Warehouse Chemical Spill, Electrical Clearance Violation, Construction Scaffolding & PPE) for instant evaluation.
* **Autonomous Work Order Generation**: Pre-formatted Corrective & Preventive Action (CAPA) ticket generation with severity badges and target resolution SLAs.
* **Multi-Channel Dispatch Automation**: Instant generation of actionable SMS, Email, and JSON Webhook payloads ready for enterprise dispatch.
* **Closed-Loop Repair Verification**: Supervisors upload "after" photos to let Gemini verify the hazard has been physically resolved.
* **Built-in Presentation Deck & Auto-Play Guided Tour**: Includes an interactive in-app slide deck and a 60-second automated demo tour with full playback controls.
* **Role-Based Views**: Instant toggling between **HSE Officer / Admin** and **Field Reporter** personas.
* **Audit Ledger & PDF Export**: Comprehensive chronological logging with filtering, search, and exportable audit reports.

---

## 🛠️ Technologies Used

* **Google AI & Vision Models**: Gemini 2.5 Flash / Gemini 3.7 Flash
* **Agent Framework**: `@google/genai` (Official Google GenAI TypeScript SDK)
* **Hosting & Infrastructure**: **Google Cloud Run** containerized environment
* **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Motion / Canvas
* **Backend Runtime**: Express.js with Vite middleware (`server.ts`)

---

## 💻 Spin-Up Instructions (Local & Cloud Setup)

### Prerequisites
* Node.js 18+ and npm installed
* A free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/workplace-safety-monitor.git
cd workplace-safety-monitor
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (or enter your key inside the in-app "Free Key" modal):
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Development Server
```bash
npm run dev
```
The application will be live at `http://localhost:3000`.

### 4. Production Build & Start
```bash
npm run build
npm start
```

### 5. Deploy to Google Cloud Run
```bash
# Build and submit the container to Google Artifact Registry / GCR
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/workplace-safety-monitor

# Deploy directly to Cloud Run
gcloud run deploy workplace-safety-monitor \
  --image gcr.io/YOUR_PROJECT_ID/workplace-safety-monitor \
  --platform managed \
  --allow-unauthenticated \
  --port 3000
```

---

## 📊 Findings & Learnings

1. **Spatial Grounding Accuracy**: Using normalized coordinate bounds `[ymin, xmin, ymax, xmax]` directly within Gemini multimodal prompts allows sub-second hazard localization without needing separate heavy object-detection neural networks (e.g., YOLO).
2. **Action-Oriented Pipelines**: Moving beyond chat loops to structured JSON schemas unlocks enterprise integration (generating exact ERP webhooks, SMS alerts, and work orders).
3. **Closing the Loop with Dual-Image Verification**: Combining initial hazard frames with post-repair photos in a comparative multimodal prompt enables automated verification of physical remediation.

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
