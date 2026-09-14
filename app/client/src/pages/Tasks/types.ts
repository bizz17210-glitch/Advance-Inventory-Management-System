// ═══════════════════════════════════════════════════════════
// TASKS — TYPES  (aligned with backend API)
// ═══════════════════════════════════════════════════════════

// ── API shapes (what comes back from the server) ────────────

export type ApiTaskStatus =
  | "Pending"
  | "InProgress"
  | "Completed"
  | "Cancelled";
export type ApiTaskPriority = "Low" | "Medium" | "High" | "Critical";

export interface ApiTaskUser {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

export interface ApiTask {
  _id: string;
  title: string;
  description?: string;
  status: ApiTaskStatus;
  priority: ApiTaskPriority;
  dueDate: string;
  assignedTo: ApiTaskUser;
  assignedBy: ApiTaskUser;
  relatedEntity?: { type: string; id: object };
  completionNote?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiTaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  highPriority: number;
}

// ── Payloads ────────────────────────────────────────────────

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assignedTo: string; // user _id
  dueDate: string; // 'YYYY-MM-DD'
  priority: "Low" | "Medium" | "High"; // backend does NOT accept 'Critical' on create
  relatedEntity?: { type: string; id: string };
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: "Low" | "Medium" | "High";
}

// ── Status transitions (backend state machine) ──────────────
// Pending → InProgress → Completed
// Pending | InProgress → Cancelled
export interface UpdateTaskStatusPayload {
  status: "InProgress" | "Completed" | "Cancelled";
  completionNote?: string;
}

// ── UI / display shapes (used by panels & components) ───────

export type TaskStatus =
  | "Pending"
  | "In Progress"
  | "Done"
  | "Overdue"
  | "Cancelled";
export type TaskPriority = "High" | "Medium" | "Low";
export type ActiveTab = "all" | "kanban" | "bystaff" | "calendar" | "add";

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  assignee: string; // display name
  assigneeId: string; // _id for API calls
  assignedBy: string;
  due: string; // formatted display string
  dueDateRaw: string; // ISO string for calendar logic
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  linked: string;
}

export interface StaffMember {
  name: string;
  role: string;
  color: string;
}

export interface ApiUser {
  _id: string;
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
}
