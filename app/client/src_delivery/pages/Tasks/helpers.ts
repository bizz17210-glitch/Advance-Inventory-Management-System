// ═══════════════════════════════════════════════════════════
// TASKS — SHARED HELPERS
// ═══════════════════════════════════════════════════════════

import type { Task, TaskStatus, TaskPriority } from "./types";
import type { Task as ApiTask } from "../../types/task";

// ── Staff color palette (seeded by name hash so consistent) ──
const PALETTE = [
  "#FF6A00",
  "#16A34A",
  "#2563EB",
  "#7C3AED",
  "#D97706",
  "#DC2626",
  "#0284C7",
  "#059669",
  "#9333EA",
  "#DB2777",
];

export function getStaffColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function getStaffRole(
  name: string,
  staffMap: Record<string, string> = {},
): string {
  return staffMap[name] || "Staff";
}

export const initials = (name: string): string =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export function badgeClass(s: string): string {
  const m: Record<string, string> = {
    Done: "green",
    Completed: "green",
    "In Progress": "blue",
    InProgress: "blue",
    Pending: "gray",
    Overdue: "red",
    Cancelled: "gray",
    High: "red",
    Critical: "red",
    Medium: "yellow",
    Low: "green",
  };
  return m[s] || "gray";
}

export const progressColor = (status: TaskStatus): string => {
  if (status === "Done") return "var(--green)";
  if (status === "Overdue") return "var(--red)";
  if (status === "Cancelled") return "var(--text-muted)";
  if (status === "In Progress") return "var(--accent)";
  return "var(--text-muted)";
};

// Tasks matching a calendar day (dueDateRaw ISO string)
export const getTasksForDay = (tasks: Task[], day: number): Task[] =>
  tasks.filter((t) => {
    if (!t.dueDateRaw) return false;
    return new Date(t.dueDateRaw).getDate() === day;
  });

// ── Display name from ApiTask.assignedTo ─────────────────────
function displayName(user?: ApiTask["assignedTo"]): string {
  if (!user) return "Unassigned";
  if (user.firstName) return `${user.firstName} ${user.lastName || ""}`.trim();
  return user.username || "Unassigned";
}

// ── Map API priority → UI priority ───────────────────────────
// Backend can return 'Critical' on read; UI collapses it to 'High'
function mapPriority(p: string): TaskPriority {
  if (p === "Critical" || p === "High") return "High";
  if (p === "Medium") return "Medium";
  return "Low";
}

// ── Map API status → UI status ────────────────────────────────
// Overdue is a UI-only concept: a Pending task whose dueDate has passed
function mapStatus(apiStatus: string, dueDate?: string): TaskStatus {
  if (apiStatus === "Completed") return "Done";
  if (apiStatus === "InProgress") return "In Progress";
  // FIX: Cancelled must stay 'Cancelled', not map to 'Done'
  if (apiStatus === "Cancelled") return "Cancelled";
  // Pending past its due date → Overdue
  if (apiStatus === "Pending" && dueDate && new Date(dueDate) < new Date()) {
    return "Overdue";
  }
  return "Pending";
}

// ── Map progress from API status ──────────────────────────────
function mapProgress(apiStatus: string): number {
  if (apiStatus === "Completed") return 100;
  if (apiStatus === "InProgress") return 50;
  return 0;
}

// ── Format due date for display ───────────────────────────────
function fmtDue(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ── Main mapper: ApiTask → UI Task ────────────────────────────
// FIX 1: assigneeId now populated from assignedTo._id
// FIX 2: dueDateRaw now populated from dueDate (needed by CalendarPanel)
// FIX 3: Cancelled no longer maps to 'Done'
export function mapApiTask(t: ApiTask): Task {
  return {
    id: t._id,
    title: t.title,
    description: t.description,
    category: t.relatedEntity?.type || "Operations",
    assignee: displayName(t.assignedTo),
    assigneeId: t.assignedTo?._id || "", // FIX 1
    assignedBy: t.assignedBy?.username || "—",
    due: fmtDue(t.dueDate),
    dueDateRaw: t.dueDate || "", // FIX 2
    priority: mapPriority(t.priority),
    status: mapStatus(t.status, t.dueDate), // FIX 3 applied inside mapStatus
    progress: mapProgress(t.status),
    linked: t.relatedEntity ? t.relatedEntity.type : "—",
  };
}
