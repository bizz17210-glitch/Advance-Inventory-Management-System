// CRUD_Project/app/client/src/types/task.ts

export type TaskStatus = "Pending" | "InProgress" | "Completed" | "Cancelled";
export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export interface TaskUser {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

export interface TaskRelatedEntity {
  type: "Product" | "Order" | "Supplier" | "Customer" | string;
  id: object;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignedTo: TaskUser;
  assignedBy: TaskUser;
  relatedEntity?: TaskRelatedEntity;
  completionNote?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  highPriority: number;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assignedTo: string; // user _id
  dueDate: string; // 'YYYY-MM-DD'
  priority: "Low" | "Medium" | "High"; // backend does NOT accept 'Critical' on create
  relatedEntity?: {
    type: string;
    id: string;
  };
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: "Low" | "Medium" | "High";
}

// ── Status transitions allowed by backend state machine ──
// Pending → InProgress → Completed
// Pending | InProgress → Cancelled
export interface UpdateTaskStatusPayload {
  status: "InProgress" | "Completed" | "Cancelled";
  completionNote?: string;
}
