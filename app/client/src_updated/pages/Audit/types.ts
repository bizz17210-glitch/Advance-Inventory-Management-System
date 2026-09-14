// ═══════════════════════════════════════════════════════
// AUDIT PAGE — SHARED TYPES
// Import from this file in every tab: import { ... } from './types';
// ═══════════════════════════════════════════════════════

export type AuditTab =
  | "all"
  | "security"
  | "data"
  | "access"
  | "exports"
  | "analytics"
  | "settings";

export type Severity = "Critical" | "Warning" | "Info";
export type ChangeType =
  | "Create"
  | "Update"
  | "Delete"
  | "Bulk Import"
  | "Stock Adjustment";
export type AccessResult =
  | "Success"
  | "Warning"
  | "Blocked"
  | "Completed"
  | "Flagged"
  | "Allowed"
  | "Noted";

export interface AuditLog {
  id: string;
  ts: string;
  staff: string;
  action: string;
  module: string;
  detail: string;
  ip: string;
  device: string;
  severity: Severity;
}

export interface SecurityEvent {
  ts: string;
  event: string;
  user: string;
  ip: string;
  device: string;
  location: string;
  severity: Severity;
  outcome: AccessResult;
}

export interface DataChange {
  ts: string;
  staff: string;
  module: string;
  type: ChangeType;
  record: string;
  field: string;
  oldVal: string;
  newVal: string;
}

export interface AccessLog {
  ts: string;
  user: string;
  role: string;
  event: string;
  ip: string;
  device: string;
  location: string;
  result: AccessResult;
}

export interface ExportLog {
  ts: string;
  by: string;
  type: string;
  range: string;
  records: string;
  format: string;
  size: string;
  sensitive: boolean;
  status: AccessResult;
}

export interface ActiveSession {
  user: string;
  role: string;
  color: string;
  ip: string;
  device: string;
  since: string;
}
