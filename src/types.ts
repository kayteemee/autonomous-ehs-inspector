export type SeverityLevel = "low" | "medium" | "high" | "critical";

export type StandardHazardCategory =
  | "PPE"
  | "Working at height"
  | "Electrical"
  | "Fire safety"
  | "Housekeeping"
  | "Lifting operations"
  | "Confined space"
  | "Machinery"
  | "Chemical exposure"
  | "Ergonomics"
  | "Vehicle safety"
  | "Environmental"
  | "Emergency preparedness"
  | "Access/egress"
  | "Slips/trips/falls";

export const STANDARD_HAZARD_CATEGORIES: StandardHazardCategory[] = [
  "PPE",
  "Working at height",
  "Electrical",
  "Fire safety",
  "Housekeeping",
  "Lifting operations",
  "Confined space",
  "Machinery",
  "Chemical exposure",
  "Ergonomics",
  "Vehicle safety",
  "Environmental",
  "Emergency preparedness",
  "Access/egress",
  "Slips/trips/falls",
];

export interface DepartmentInfo {
  name: string;
  registeredUsers: number;
  location?: string;
  lead?: string;
}

export const DEFAULT_DEPARTMENTS: DepartmentInfo[] = [
  { name: "Operations", registeredUsers: 24, location: "Main Plant & Yard", lead: "Marcus Vance" },
  { name: "Logistics", registeredUsers: 18, location: "Warehouses A & B", lead: "Alex Chen" },
  { name: "Maintenance", registeredUsers: 12, location: "Workshop & Utilities", lead: "Dave Kowalski" },
  { name: "Production", registeredUsers: 30, location: "Assembly Lines 1-4", lead: "Elena Rostova" },
  { name: "Engineering", registeredUsers: 15, location: "Technical Center", lead: "Priya Sharma" },
  { name: "EHS Safety", registeredUsers: 6, location: "Safety Office", lead: "Kay Tee" },
  { name: "Administration", registeredUsers: 10, location: "Corporate HQ", lead: "Sarah Jenkins" },
];

export interface SafetyIssue {
  category: "act" | "condition";
  hazardCategory?: StandardHazardCategory | string;
  title: string;
  severity: SeverityLevel;
  description: string;
  oshaRule: string;
  isoRule: string;
  nfpaRule: string;
  correctiveAction: string;
  boundingBox?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] as percentage 0-100
  status?: "Open" | "In Progress" | "Closed";
}

export interface SafetyReport {
  safetyScore: number;
  summary: string;
  issues: SafetyIssue[];
  isSimulated?: boolean;
  message?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  imageName: string;
  scenarioTitle: string;
  imageSrc: string; // Base64 or local image path
  report: SafetyReport;
  status: "Open" | "Resolved" | "In Progress";
  notes?: string;
  submittedBy?: string;
  reporterName?: string;
  reporterEmail?: string;
  department?: string;
}

export interface PresetScenario {
  id: string;
  title: string;
  category: string;
  description: string;
  imageSrc: string;
  mockId: string;
}

