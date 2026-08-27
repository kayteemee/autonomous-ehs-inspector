export interface AppTheme {
  id: string;
  name: string;
  colorName: string;
  type: "dark" | "light";
  primaryColor: string;
  bg: string;
  text: string;
  textMuted: string;
  glassBg: string;
  glassBorder: string;
  mesh1: string;
  mesh2: string;
  mesh3: string;
}

export const APP_THEMES: AppTheme[] = [
  {
    id: "dark",
    name: "Dark",
    colorName: "Dark",
    type: "dark",
    primaryColor: "#6366f1",
    bg: "#0a0a0c",
    text: "#f8fafc",
    textMuted: "#94a3b8",
    glassBg: "rgba(15, 15, 20, 0.75)",
    glassBorder: "rgba(255, 255, 255, 0.1)",
    mesh1: "rgba(99, 102, 241, 0.15)",
    mesh2: "rgba(139, 92, 246, 0.1)",
    mesh3: "#0a0a0c"
  },
  {
    id: "light",
    name: "Light",
    colorName: "Light",
    type: "light",
    primaryColor: "#1e3a8a", // Navy Blue
    bg: "#f8fafc", // White/Slate-50 background
    text: "#0f172a", // Slate-900 for high contrast text
    textMuted: "#334155", // Slate-700
    glassBg: "rgba(255, 255, 255, 0.85)", // White glass background
    glassBorder: "rgba(30, 58, 138, 0.15)", // Navy-accented border
    mesh1: "rgba(30, 58, 138, 0.06)", // Soft navy-tinted mesh
    mesh2: "rgba(99, 102, 241, 0.04)", // Soft indigo-tinted mesh
    mesh3: "#f8fafc"
  }
];
