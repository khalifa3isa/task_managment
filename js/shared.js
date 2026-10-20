// ============================================================
//  SHARED CONSTANTS + HELPERS (used by both phone and wall pages)
// ============================================================

// Priority levels: order = sort weight (lower = more urgent)
export const PRIORITIES = {
  critical: { label: "Critical", icon: "flame",      order: 0 },
  high:     { label: "High",     icon: "arrow-up",   order: 1 },
  medium:   { label: "Medium",   icon: "minus",      order: 2 },
  low:      { label: "Low",      icon: "arrow-down", order: 3 },
};

// Task categories typical for an IT department, each with an icon
export const CATEGORIES = {
  network:  { label: "Network",  icon: "wifi" },
  hardware: { label: "Hardware", icon: "monitor" },
  software: { label: "Software", icon: "app-window" },
  access:   { label: "Access",   icon: "key-round" },
  printer:  { label: "Printer",  icon: "printer" },
  server:   { label: "Server",   icon: "server" },
  security: { label: "Security", icon: "shield-check" },
  other:    { label: "Other",    icon: "wrench" },
};

// Workflow states a task moves through
export const STATUSES = {
  todo:     { label: "To Do",       icon: "list-todo" },
  progress: { label: "In Progress", icon: "loader-circle" },
  done:     { label: "Done",        icon: "circle-check" },
};

// Sort: most urgent priority first, then oldest first (waited longest)
export function byPriority(a, b) {
  const pa = PRIORITIES[a.priority]?.order ?? 9;   // unknown priority sinks to bottom
  const pb = PRIORITIES[b.priority]?.order ?? 9;
  if (pa !== pb) return pa - pb;                   // different priority → priority wins
  return (a.createdAt || 0) - (b.createdAt || 0);  // same priority → older first
}

// "just now", "5m", "2h", "3d" — short age label for cards
export function timeAgo(ms) {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// True if the timestamp falls on today's calendar date (local time)
export function isToday(ms) {
  if (!ms) return false;
  const d = new Date(ms), now = new Date();
  return d.toDateString() === now.toDateString();
}

// Escape user text before putting it into innerHTML (prevents broken HTML / XSS)
export function esc(str = "") {
  return String(str).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
