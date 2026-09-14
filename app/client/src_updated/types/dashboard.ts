// ─── types/dashboard.ts ───────────────────────────────────────

export type TrendDirection = "up" | "down" | "neutral";

export interface KpiStat {
  label: string;
  value: string;
  trend: string;
  trendDir: TrendDirection;
}

export interface StatCard {
  icon: string;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  trend: string;
  trendDir: TrendDirection;
  accentGradient: string;
}

export interface WeekBar {
  day: string;
  heightPct: number;
  variant: "accent" | "accent2" | "default";
}

export interface ActivityItem {
  iconClass: string;
  iconBg: string;
  iconColor: string;
  title: string;
  meta: string;
  badge?: { label: string; color: string };
  value?: string;
}

export interface TopProduct {
  rank: number;
  name: string;
  sku: string;
  sold: number;
  stock: number;
  revenue: string;
  stockStatus: "critical" | "low" | "ok";
}

export interface RiderStatus {
  initials: string;
  name: string;
  avatarBg: string;
  avatarColor: string;
  orderId: string | null;
  location: string;
  status: string;
  statusBadge: string;
  isOnline: boolean;
}

export interface RecentOrder {
  id: string;
  customerInitials: string;
  customerName: string;
  avatarBg: string;
  avatarColor: string;
  items: number;
  total: string;
  status: string;
  statusBadge: string;
  paymentType: "COD" | "Prepaid";
  time: string;
}

export interface CodRing {
  label: string;
  subLabel: string;
  pct: string;
  ringClass: "g" | "y" | "r";
}

export interface IntegrationItem {
  id: string;
  name: string;
  type: string;
  desc: string;
  initialStatus: "live" | "disconnected" | "error";
  logoBg?: string;
  logoText?: string;
  logoTextColor?: string;
  meta: string;
  metaType: "ok" | "err" | "neutral";
}

export interface FinancialItem {
  label: string;
  value: string;
  color?: string;
}

export interface WeeklyOrderData {
  day: string;
  orders: number;
  delivered: number;
}

// Add to dashboard.ts or create a new layout.ts type file
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
  children?: NavItem[];
}

export interface PageConfig {
  title: string;
  crumb: string;
  headerBtn: string;
}
