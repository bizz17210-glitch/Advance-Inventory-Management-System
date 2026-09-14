// ═══════════════════════════════════════════════════════════
// src/types/staff.ts — Shared staff types (barrel re-export)
// All canonical types live in pages/Staff/staff.types.ts.
// Import from here anywhere outside the Staff page folder.
// ═══════════════════════════════════════════════════════════

export type {
  ApiRole,
  ApiStatus,
  ApiUser,
  Pagination,
  UsersListResponse,
  TaskPerfEntry,
  OrderProcEntry,
  StaffPerformanceResponse,
  CreateUserPayload,
  UpdateUserPayload,
  StaffTab,
  StaffFilter,
  StaffPanelTab,
  PerfPeriod,
  AccessLevel,
  Severity,
  StaffMember,
  Role,
  ActivityEntry,
  MatrixModule,
  IntegrationConfig,
} from "../pages/Staff/staff.types";

export { ROLE_LABELS } from "../pages/Staff/staff.types";

// ── Legacy aliases (keeps old imports from breaking) ──────
// The old staff.ts used StaffRole / StaffStatus — map them
// to the canonical API types so consumers don't need changes.

export type { ApiRole as StaffRole } from "../pages/Staff/staff.types";
export type { ApiStatus as StaffStatus } from "../pages/Staff/staff.types";
export type { ApiUser as StaffMember_Legacy } from "../pages/Staff/staff.types";
