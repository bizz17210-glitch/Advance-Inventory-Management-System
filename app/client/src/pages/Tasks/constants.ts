// ═══════════════════════════════════════════════════════════
// TASKS — CONSTANTS
// Staff list is now dynamic (loaded from API).
// Only truly static config lives here.
// ═══════════════════════════════════════════════════════════

export const CATEGORIES: string[] = [
  "Inventory",
  "Operations",
  "Logistics",
  "Finance",
  "Customer Support",
  "Packing",
  "Rider / Delivery",
  "Other",
];

export const PRIORITY_OPTIONS = ["High", "Medium", "Low"] as const;

export const STATUS_CHIPS = [
  { label: "All", value: "", icon: "fa-list" },
  { label: "Pending", value: "Pending", icon: "" },
  { label: "In Progress", value: "In Progress", icon: "" },
  { label: "Done", value: "Done", icon: "" },
  { label: "Overdue", value: "Overdue", icon: "fa-triangle-exclamation" },
  { label: "Cancelled", value: "Cancelled", icon: "" },
  { label: "🔴 High", value: "High", icon: "" },
  { label: "🟡 Medium", value: "Medium", icon: "" },
  { label: "🟢 Low", value: "Low", icon: "" },
];

export const WEEKLY_DAYS = [
  { label: "Mon", day: "Mon" },
  { label: "Tue", day: "Tue" },
  { label: "Wed", day: "Wed" },
  { label: "Thu", day: "Thu" },
  { label: "Fri", day: "Fri" },
  { label: "Sat", day: "Sat" },
  { label: "Sun", day: "Sun" },
];
