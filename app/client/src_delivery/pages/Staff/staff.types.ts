// ═══════════════════════════════════════════════════════════
// staff.ts — types aligned to /api/users + /api/analytics/staff-performance
// ═══════════════════════════════════════════════════════════

// ── API Role values (exact strings the backend accepts) ───
export type ApiRole =
  | "Administrator"
  | "OperationsManager"
  | "InventoryManager"
  | "SalesOperator"
  | "Accounts"
  | "CourierHandler"
  | "Rider";

// ── Display-friendly label map ────────────────────────────
export const ROLE_LABELS: Record<ApiRole, string> = {
  Administrator: "Administrator",
  OperationsManager: "Ops Manager",
  InventoryManager: "Inventory Manager",
  SalesOperator: "Sales Operator",
  Accounts: "Accounts",
  CourierHandler: "Courier Handler",
  Rider: "Rider",
};

export type ApiStatus = "Active" | "Inactive" | "Suspended";

// ── Raw user object returned by GET /api/users & GET /api/users/:id ──
export interface ApiUser {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: ApiRole;
  status: ApiStatus;
  lastLogin?: string;
  createdAt?: string;
  assignedLocation?: string;
}

// ── Pagination envelope from GET /api/users ──────────────
export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UsersListResponse {
  success: boolean;
  data: {
    users: ApiUser[];
    pagination: Pagination;
  };
}

// ── Staff performance from GET /api/analytics/staff-performance ──
export interface TaskPerfEntry {
  _id: string;
  username: string;
  role: ApiRole;
  totalTasks: number;
  completed: number;
  completionRate: number;
}

export interface OrderProcEntry {
  _id: string;
  username: string;
  ordersPlaced: number;
  totalRevenue: number;
  cancelledOrders: number;
  cancellationRate: number;
}

export interface StaffPerformanceResponse {
  success: boolean;
  data: {
    taskPerformance: TaskPerfEntry[];
    orderProcessing: OrderProcEntry[];
    activeStaff: number;
  };
}

// ── Payload for creating a user via POST /api/auth/register ──
export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: ApiRole;
}

// ── Payload for updating via PUT /api/users/:id ──────────
export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: ApiRole;
  status?: ApiStatus;
  assignedLocation?: string;
}

// ── UI tab / filter types (unchanged) ─────────────────────
export type StaffTab =
  | "members"
  | "roles"
  | "performance"
  | "activity"
  | "integrations";
export type StaffFilter = "all" | "active" | "offline" | "suspended";
export type StaffPanelTab = "profile" | "permissions" | "tasks" | "activity";
export type PerfPeriod = "month" | "week" | "all";
export type AccessLevel = "Full" | "High" | "Medium" | "Limited" | "Minimal";
export type Severity = "Info" | "Warning" | "Critical";

// ── Legacy StaffMember shape (used by UI, derived from ApiUser) ──
export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string; // display label
  apiRole: ApiRole;
  dept: string;
  status: ApiStatus;
  joined: string;
  lastActive: string;
  avatar: string;
  color: string;
  // performance (populated from analytics endpoint when available)
  tasks: number;
  completed: number;
  orders: number;
  errors: number;
  score: number;
}

// ── Role meta for Roles tab (static) ─────────────────────
export interface Role {
  name: string;
  members: number;
  level: AccessLevel;
  color: string;
  desc: string;
}

export interface ActivityEntry {
  time: string;
  staff: string;
  action: string;
  module: string;
  detail: string;
  severity: Severity;
}

export interface MatrixModule {
  mod: string;
  perms: boolean[];
}

export interface IntegrationConfig {
  id: string;
  name: string;
  sub: string;
  desc: string;
  imgUrl: string;
  fallbackBg: string;
  fallbackChar: string;
  iconClass: string;
  connected: boolean;
}
