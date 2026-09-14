// ═══════════════════════════════════════════════════════════
// shared.tsx  —  API Types · Static Data · Helpers · Micro-components
// ═══════════════════════════════════════════════════════════

import React, { useState } from "react";

// ───────────────────────────────────────────────────────────
// NAV TYPE
// ───────────────────────────────────────────────────────────

export type NavPanel =
  | "overview"
  | "all"
  | "add"
  | "availability"
  | "active"
  | "assign"
  | "completed"
  | "failed-del"
  | "livemap"
  | "routes"
  | "performance"
  | "earnings"
  | "reports"
  | "integrations"
  | "settings"
  | "zones";

// ───────────────────────────────────────────────────────────
// BACKEND API TYPES
// ───────────────────────────────────────────────────────────
// In shared.tsx — replace your existing ApiRider interface with this:

export interface ApiRider {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  cnic?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  licenseStatus?: "Valid" | "Expired" | "Expiring Soon";
  status: "Active" | "Inactive" | "OnDelivery" | "OnLeave" | "Suspended";
  isAvailable?: boolean;
  assignedZone?: string;
  serviceCities?: string[];
  vehicle?: {
    type: string;
    make?: string;
    model?: string;
    year?: number;
    registrationNumber?: string;
    color?: string;
  };
  activeDeliveries?: number;
  completionRate?: string;
  performanceMetrics?: {
    totalDeliveries: number;
    completedDeliveries: number;
  };
  recentPerformance?: {
    last30Days?: {
      totalDeliveries: number;
      completed: number;
      completionRate: string;
      avgDeliveryHours: string;
    };
  };
  paymentMethod?: string;
  bankDetails?: {
    accountTitle?: string;
    accountNumber?: string;
    bankName?: string;
  };
  // 🔐 Login credentials — only present if set by admin at creation
  loginCredentials?: {
    email?: string;
    password?: string;
    username?: string;
    generatedAt?: string;
    sharedWithRider?: boolean;
    clearedAt?: string | null;
  };
  userId?: string;
  createdAt?: string;
}

export interface ApiDelivery {
  _id: string;
  trackingNumber?: string;
  orderReference?: string;
  currentStatus: string;
  customer?: { name?: string; phone?: string };
  shippingAddress?: { city?: string; street?: string };
  codAmount?: number;
  estimatedDelivery?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface ApiRiderPerformance {
  kpis?: {
    totalRiders: number;
    activeRiders: number;
    totalDeliveries: number;
    overallCompletionRate: string;
    avgTransitHours: string;
  };
  byRider?: {
    id: string;
    name: string;
    zone: string;
    completionRate: string;
    totalDeliveries: number;
  }[];
  timeline?: {
    date: string;
    total: number;
    completed: number;
    completionRate: number;
  }[];
}

// ───────────────────────────────────────────────────────────
// STATIC LEGACY TYPES (for panels not yet connected to API)
// ───────────────────────────────────────────────────────────

export interface Rider {
  id: number;
  name: string;
  phone: string;
  cnic: string;
  vehicle: string;
  plate: string;
  zone: string;
  shift: string;
  deliveries: number;
  completion: number;
  avgTime: number;
  onTime: number;
  rating: number;
  status: "Active" | "Inactive";
  availability: "Online" | "Offline";
  pay: string;
  rate: number;
  earned: number;
  bonus: number;
  paid: number;
  join: string;
}
export interface ActiveDelivery {
  order: string;
  rider: string;
  customer: string;
  address: string;
  assigned: string;
  eta: string;
  cod: string;
  status: string;
}
export interface UnassignedOrder {
  order: string;
  customer: string;
  area: string;
  cod: string;
  priority: string;
}
export interface CompletedDelivery {
  order: string;
  rider: string;
  customer: string;
  time: string;
  taken: string;
  cod: number;
  codStatus: string;
  rating: string;
}
export interface FailedDelivery {
  order: string;
  rider: string;
  customer: string;
  phone: string;
  attempts: number;
  last: string;
  reason: string;
  action: string;
}
export interface DocItem {
  rider: string;
  type: string;
  file: string;
  expiry: string;
  status: string;
  uploaded: string;
}
export interface AvailabilityItem {
  rider: string;
  shift: string;
  checkin: string;
  zone: string;
  task: string;
  avail: string;
}
export interface ScheduleItem {
  rider: string;
  days: string[];
}
export interface ZoneItem {
  name: string;
  areas: string;
  primary: string;
  backup: string;
  time: string;
  active: number;
}
export interface RouteItem {
  order: string;
  rider: string;
  start: string;
  end: string;
  km: string;
  duration: string;
  date: string;
}
export interface ReportItem {
  name: string;
  type: string;
  date: string;
  format: string;
  size: string;
}

// ───────────────────────────────────────────────────────────
// STATIC DATA
// ───────────────────────────────────────────────────────────

export const AVATAR_COLORS = [
  "#FF6A00",
  "#16A34A",
  "#2563EB",
  "#7C3AED",
  "#D97706",
  "#DC2626",
  "#0284C7",
  "#059669",
];

export const RIDERS: Rider[] = [
  {
    id: 1,
    name: "Usman Ahmed",
    phone: "0321-1234567",
    cnic: "35202-1234567-1",
    vehicle: "Motorcycle",
    plate: "LHR-2201",
    zone: "Lahore Central",
    shift: "Morning (9AM–5PM)",
    deliveries: 68,
    completion: 96,
    avgTime: 38,
    onTime: 94,
    rating: 4.8,
    status: "Active",
    availability: "Online",
    pay: "Per Delivery",
    rate: 80,
    earned: 5440,
    bonus: 400,
    paid: 5000,
    join: "Jan 2025",
  },
  {
    id: 2,
    name: "Bilal Raza",
    phone: "0300-9876543",
    cnic: "35202-9876543-2",
    vehicle: "Motorcycle",
    plate: "LHR-3312",
    zone: "DHA / Cantt",
    shift: "Morning (9AM–5PM)",
    deliveries: 61,
    completion: 93,
    avgTime: 42,
    onTime: 91,
    rating: 4.9,
    status: "Active",
    availability: "Online",
    pay: "Per Delivery",
    rate: 80,
    earned: 4880,
    bonus: 200,
    paid: 4000,
    join: "Feb 2025",
  },
  {
    id: 3,
    name: "Asad Khan",
    phone: "0333-5556677",
    cnic: "35202-5556677-3",
    vehicle: "Bicycle",
    plate: "—",
    zone: "Gulberg / Garden Town",
    shift: "Full Day",
    deliveries: 55,
    completion: 89,
    avgTime: 34,
    onTime: 88,
    rating: 4.5,
    status: "Active",
    availability: "Online",
    pay: "Per Delivery",
    rate: 70,
    earned: 3850,
    bonus: 0,
    paid: 3500,
    join: "Mar 2025",
  },
  {
    id: 4,
    name: "Hamza Iqbal",
    phone: "0311-3334455",
    cnic: "35202-3334455-4",
    vehicle: "Motorcycle",
    plate: "LHR-4421",
    zone: "Model Town",
    shift: "Evening (5PM–11PM)",
    deliveries: 48,
    completion: 88,
    avgTime: 45,
    onTime: 85,
    rating: 4.3,
    status: "Active",
    availability: "Online",
    pay: "Per Delivery",
    rate: 80,
    earned: 3840,
    bonus: 0,
    paid: 3500,
    join: "Apr 2025",
  },
  {
    id: 5,
    name: "Faisal Mehmood",
    phone: "0345-2223344",
    cnic: "35202-2223344-5",
    vehicle: "Motorcycle",
    plate: "LHR-5533",
    zone: "Johar Town",
    shift: "Morning (9AM–5PM)",
    deliveries: 44,
    completion: 85,
    avgTime: 50,
    onTime: 82,
    rating: 4.1,
    status: "Active",
    availability: "Offline",
    pay: "Per Delivery",
    rate: 80,
    earned: 3520,
    bonus: 0,
    paid: 3000,
    join: "May 2025",
  },
  {
    id: 6,
    name: "Tariq Saleem",
    phone: "0300-1112233",
    cnic: "35202-1112233-6",
    vehicle: "Van",
    plate: "LHR-6644",
    zone: "All Zones",
    shift: "Full Day",
    deliveries: 39,
    completion: 82,
    avgTime: 58,
    onTime: 78,
    rating: 3.9,
    status: "Active",
    availability: "Online",
    pay: "Monthly Fixed",
    rate: 25000,
    earned: 25000,
    bonus: 0,
    paid: 20000,
    join: "Jun 2025",
  },
  {
    id: 7,
    name: "Zubair Ali",
    phone: "0321-8889900",
    cnic: "35202-8889900-7",
    vehicle: "Motorcycle",
    plate: "LHR-7755",
    zone: "Lahore Central",
    shift: "Morning (9AM–5PM)",
    deliveries: 12,
    completion: 75,
    avgTime: 65,
    onTime: 70,
    rating: 3.5,
    status: "Active",
    availability: "Offline",
    pay: "Per Delivery",
    rate: 80,
    earned: 960,
    bonus: 0,
    paid: 800,
    join: "Aug 2025",
  },
  {
    id: 8,
    name: "Imran Siddiqui",
    phone: "0333-4445566",
    cnic: "35202-4445566-8",
    vehicle: "Motorcycle",
    plate: "LHR-8866",
    zone: "DHA / Cantt",
    shift: "Morning (9AM–5PM)",
    deliveries: 0,
    completion: 0,
    avgTime: 0,
    onTime: 0,
    rating: 0,
    status: "Inactive",
    availability: "Offline",
    pay: "Per Delivery",
    rate: 80,
    earned: 0,
    bonus: 0,
    paid: 0,
    join: "Oct 2025",
  },
];

export const ACTIVE_DELIVERIES: ActiveDelivery[] = [
  {
    order: "ORD-1052",
    rider: "Usman Ahmed",
    customer: "Amna Bibi",
    address: "Gulberg III, Lahore",
    assigned: "09:45",
    eta: "10:30",
    cod: "₨4,200",
    status: "In Transit",
  },
  {
    order: "ORD-1053",
    rider: "Bilal Raza",
    customer: "Rabia Ahmed",
    address: "DHA Phase 5",
    assigned: "09:55",
    eta: "10:45",
    cod: "₨2,800",
    status: "In Transit",
  },
  {
    order: "ORD-1054",
    rider: "Asad Khan",
    customer: "Nadia Malik",
    address: "Garden Town, Lahore",
    assigned: "10:10",
    eta: "10:40",
    cod: "₨6,100",
    status: "Out for Delivery",
  },
  {
    order: "ORD-1055",
    rider: "Hamza Iqbal",
    customer: "Hira Baig",
    address: "Model Town Block D",
    assigned: "10:20",
    eta: "11:10",
    cod: "₨3,500",
    status: "In Transit",
  },
  {
    order: "ORD-1056",
    rider: "Faisal Mehmood",
    customer: "Sadia Hussain",
    address: "Johar Town Phase 1",
    assigned: "10:25",
    eta: "11:00",
    cod: "₨5,700",
    status: "Delayed",
  },
  {
    order: "ORD-1057",
    rider: "Tariq Saleem",
    customer: "Bushra Nawaz",
    address: "Cantt, Lahore",
    assigned: "10:30",
    eta: "11:30",
    cod: "₨1,800",
    status: "In Transit",
  },
  {
    order: "ORD-1058",
    rider: "Usman Ahmed",
    customer: "Maira Usman",
    address: "Gulberg II, Lahore",
    assigned: "11:00",
    eta: "11:45",
    cod: "₨3,900",
    status: "Pending Pickup",
  },
  {
    order: "ORD-1059",
    rider: "Bilal Raza",
    customer: "Fatima Zara",
    address: "DHA Phase 1",
    assigned: "11:05",
    eta: "12:00",
    cod: "₨2,200",
    status: "Delayed",
  },
];

export const UNASSIGNED_ORDERS: UnassignedOrder[] = [
  {
    order: "ORD-1060",
    customer: "Sara Khan",
    area: "Gulberg",
    cod: "₨3,600",
    priority: "Normal",
  },
  {
    order: "ORD-1061",
    customer: "Iram Sheikh",
    area: "DHA Phase 6",
    cod: "₨8,100",
    priority: "High",
  },
  {
    order: "ORD-1062",
    customer: "Zainab Qureshi",
    area: "Model Town",
    cod: "₨2,400",
    priority: "Normal",
  },
  {
    order: "ORD-1063",
    customer: "Asma Iqbal",
    area: "Johar Town",
    cod: "₨5,500",
    priority: "Urgent",
  },
  {
    order: "ORD-1064",
    customer: "Lubna Tanvir",
    area: "Garden Town",
    cod: "₨1,900",
    priority: "Normal",
  },
];

export const COMPLETED_DELIVERIES: CompletedDelivery[] = [
  {
    order: "ORD-1045",
    rider: "Usman Ahmed",
    customer: "Nadia Malik",
    time: "09:22",
    taken: "38 min",
    cod: 6100,
    codStatus: "Collected",
    rating: "★★★★★",
  },
  {
    order: "ORD-1043",
    rider: "Bilal Raza",
    customer: "Hira Baig",
    time: "09:48",
    taken: "42 min",
    cod: 3900,
    codStatus: "Collected",
    rating: "★★★★★",
  },
  {
    order: "ORD-1040",
    rider: "Asad Khan",
    customer: "Sadia Hussain",
    time: "10:05",
    taken: "34 min",
    cod: 9200,
    codStatus: "Pending",
    rating: "★★★★☆",
  },
  {
    order: "ORD-1039",
    rider: "Hamza Iqbal",
    customer: "Bushra Nawaz",
    time: "10:30",
    taken: "48 min",
    cod: 3100,
    codStatus: "Collected",
    rating: "★★★★☆",
  },
  {
    order: "ORD-1035",
    rider: "Usman Ahmed",
    customer: "Lubna Tanvir",
    time: "11:00",
    taken: "35 min",
    cod: 1600,
    codStatus: "Collected",
    rating: "★★★★★",
  },
];

export const FAILED_DELIVERIES: FailedDelivery[] = [
  {
    order: "ORD-1028",
    rider: "Zubair Ali",
    customer: "Ayesha Tariq",
    phone: "0321-1234567",
    attempts: 3,
    last: "10 May, 16:30",
    reason: "Not Home",
    action: "Pending",
  },
  {
    order: "ORD-1025",
    rider: "Faisal Mehmood",
    customer: "Tania Siddiqui",
    phone: "0333-7766554",
    attempts: 3,
    last: "09 May, 14:00",
    reason: "Wrong Address",
    action: "Pending",
  },
  {
    order: "ORD-1021",
    rider: "Zubair Ali",
    customer: "Mariam Khan",
    phone: "0311-8899001",
    attempts: 3,
    last: "08 May, 17:00",
    reason: "Customer Not Available",
    action: "Re-assigned",
  },
];

export const DOCS_DATA: DocItem[] = [
  {
    rider: "Usman Ahmed",
    type: "CNIC",
    file: "usman_cnic.pdf",
    expiry: "N/A",
    status: "Active",
    uploaded: "Jan 2025",
  },
  {
    rider: "Usman Ahmed",
    type: "Driver's License",
    file: "usman_license.pdf",
    expiry: "Mar 2027",
    status: "Active",
    uploaded: "Jan 2025",
  },
  {
    rider: "Bilal Raza",
    type: "CNIC",
    file: "bilal_cnic.pdf",
    expiry: "N/A",
    status: "Active",
    uploaded: "Feb 2025",
  },
  {
    rider: "Asad Khan",
    type: "CNIC",
    file: "asad_cnic.pdf",
    expiry: "N/A",
    status: "Active",
    uploaded: "Mar 2025",
  },
  {
    rider: "Hamza Iqbal",
    type: "Driver's License",
    file: "hamza_license.pdf",
    expiry: "Jun 2026",
    status: "Expiring Soon",
    uploaded: "Apr 2025",
  },
];

export const AVAILABILITY_DATA: AvailabilityItem[] = [
  {
    rider: "Usman Ahmed",
    shift: "Morning (9AM–5PM)",
    checkin: "09:02",
    zone: "Lahore Central",
    task: "ORD-1052",
    avail: "Busy",
  },
  {
    rider: "Bilal Raza",
    shift: "Morning (9AM–5PM)",
    checkin: "09:10",
    zone: "DHA / Cantt",
    task: "ORD-1053",
    avail: "Busy",
  },
  {
    rider: "Asad Khan",
    shift: "Full Day",
    checkin: "09:15",
    zone: "Gulberg / Garden Town",
    task: "ORD-1054",
    avail: "Busy",
  },
  {
    rider: "Hamza Iqbal",
    shift: "Evening (5PM–11PM)",
    checkin: "—",
    zone: "Model Town",
    task: "—",
    avail: "Not Started",
  },
  {
    rider: "Faisal Mehmood",
    shift: "Morning (9AM–5PM)",
    checkin: "09:30",
    zone: "Johar Town",
    task: "ORD-1056",
    avail: "Busy",
  },
  {
    rider: "Tariq Saleem",
    shift: "Full Day",
    checkin: "09:00",
    zone: "All Zones",
    task: "ORD-1057",
    avail: "Busy",
  },
  {
    rider: "Zubair Ali",
    shift: "Morning (9AM–5PM)",
    checkin: "—",
    zone: "Lahore Central",
    task: "—",
    avail: "Absent",
  },
  {
    rider: "Imran Siddiqui",
    shift: "—",
    checkin: "—",
    zone: "—",
    task: "—",
    avail: "Inactive",
  },
];

export const SCHEDULE_DATA: ScheduleItem[] = [
  { rider: "Usman Ahmed", days: ["M", "T", "W", "T", "F", "-", "M"] },
  { rider: "Bilal Raza", days: ["M", "T", "W", "T", "F", "M", "-"] },
  { rider: "Asad Khan", days: ["M", "T", "W", "T", "F", "M", "M"] },
  { rider: "Hamza Iqbal", days: ["-", "E", "E", "E", "E", "E", "E"] },
];

export const ZONES_DATA: ZoneItem[] = [
  {
    name: "Lahore Central",
    areas: "Anarkali, Gulberg I & II, Liberty Market",
    primary: "Usman Ahmed",
    backup: "Zubair Ali",
    time: "30–50 min",
    active: 3,
  },
  {
    name: "DHA / Cantt",
    areas: "DHA Phase 1–6, Cantonment",
    primary: "Bilal Raza",
    backup: "Tariq Saleem",
    time: "35–60 min",
    active: 2,
  },
  {
    name: "Gulberg / Garden Town",
    areas: "Gulberg III–V, Garden Town, Jail Road",
    primary: "Asad Khan",
    backup: "Usman Ahmed",
    time: "25–45 min",
    active: 2,
  },
  {
    name: "Model Town",
    areas: "Model Town A-L Blocks, Faisal Town",
    primary: "Hamza Iqbal",
    backup: "—",
    time: "30–50 min",
    active: 1,
  },
  {
    name: "Johar Town",
    areas: "Johar Town Phase 1 & 2, Muslim Town",
    primary: "Faisal Mehmood",
    backup: "—",
    time: "35–55 min",
    active: 1,
  },
];

export const ROUTES_DATA: RouteItem[] = [
  {
    order: "ORD-1045",
    rider: "Usman Ahmed",
    start: "Gulberg Warehouse",
    end: "Faisal Town",
    km: "8.4",
    duration: "38 min",
    date: "11 May 2026",
  },
  {
    order: "ORD-1039",
    rider: "Bilal Raza",
    start: "Gulberg Warehouse",
    end: "DHA Phase 5",
    km: "12.1",
    duration: "42 min",
    date: "11 May 2026",
  },
  {
    order: "ORD-1035",
    rider: "Asad Khan",
    start: "Gulberg Warehouse",
    end: "Garden Town",
    km: "4.2",
    duration: "34 min",
    date: "11 May 2026",
  },
];

export const RECENT_REPORTS: ReportItem[] = [
  {
    name: "Performance Report — Apr 2026",
    type: "Performance",
    date: "01 May 2026",
    format: "Excel",
    size: "38 KB",
  },
  {
    name: "Earnings & Payroll — Apr 2026",
    type: "Payroll",
    date: "01 May 2026",
    format: "PDF",
    size: "22 KB",
  },
  {
    name: "Daily Log — Week 18",
    type: "Log",
    date: "05 May 2026",
    format: "CSV",
    size: "18 KB",
  },
];

// ───────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────

export const fmt = (n: number) => "₨" + Number(n).toLocaleString();
export const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
export const avatarColor = (id: number) =>
  AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length];
export const avatarColorFromName = (name: string) => {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};
export const rColor = (r: number) =>
  r >= 90 ? "var(--green)" : r >= 80 ? "var(--yellow)" : "var(--red)";

/** Map API rider status → display badge label */
export function riderStatusLabel(status: string): string {
  const m: Record<string, string> = {
    Active: "Active",
    Inactive: "Inactive",
    OnDelivery: "On Delivery",
    OnLeave: "On Leave",
    Suspended: "Suspended",
  };
  return m[status] ?? status;
}

/** True if the API rider is currently available / online */
export function isRiderOnline(r: ApiRider): boolean {
  return (
    r.isAvailable === true || r.status === "Active" || r.status === "OnDelivery"
  );
}

export function badgeClass(s: string): string {
  const m: Record<string, string> = {
    Active: "green",
    Inactive: "gray",
    Online: "green",
    Offline: "gray",
    "On Delivery": "orange",
    OnDelivery: "orange",
    "On Leave": "yellow",
    OnLeave: "yellow",
    Suspended: "red",
    Busy: "orange",
    "Not Started": "yellow",
    Absent: "red",
    "In Transit": "orange",
    "Out for Delivery": "blue",
    Delayed: "red",
    "Pending Pickup": "yellow",
    Collected: "green",
    Pending: "yellow",
    "N/A": "gray",
    "Re-assigned": "blue",
    High: "orange",
    Urgent: "red",
    Normal: "gray",
    "Expiring Soon": "yellow",
    "Monthly Fixed": "blue",
    "Per Delivery": "purple",
    Hybrid: "blue",
    Connected: "green",
    "Not Connected": "red",
    "Option 2": "orange",
    Manual: "gray",
    Valid: "green",
    Expired: "red",
  };
  return m[s] || "gray";
}

// ───────────────────────────────────────────────────────────
// SKELETON
// ───────────────────────────────────────────────────────────

export const TableSkeleton: React.FC<{ rows?: number; cols: number }> = ({
  rows = 5,
  cols,
}) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j}>
            <div
              style={{
                height: 13,
                background: "#F3F4F6",
                borderRadius: 4,
                width: `${60 + Math.random() * 30}%`,
              }}
            />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// ───────────────────────────────────────────────────────────
// MICRO-COMPONENTS
// ───────────────────────────────────────────────────────────

export const Badge: React.FC<{ label: string }> = ({ label }) => (
  <span className={`badge ${badgeClass(label)}`}>{label}</span>
);

export const PerfBar: React.FC<{ pct: number; color?: string }> = ({
  pct,
  color,
}) => (
  <div className="perf-cell">
    <div className="perf-bar">
      <div
        className="perf-fill"
        style={{
          width: `${Math.min(pct, 100)}%`,
          background: color || "var(--accent)",
        }}
      />
    </div>
    <div className="perf-pct">{pct}%</div>
  </div>
);

export const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <>
    <span className="rating-stars">
      {"★".repeat(Math.floor(rating))}
      {"☆".repeat(5 - Math.floor(rating))}
    </span>
    <span style={{ fontSize: 9, color: "var(--text-muted)", marginLeft: 3 }}>
      {rating}
    </span>
  </>
);

export const ToggleSwitch: React.FC<{ defaultChecked?: boolean }> = ({
  defaultChecked = false,
}) => {
  const [on, setOn] = useState(defaultChecked);
  return (
    <label className="toggle-switch">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
      />
      <span className="toggle-track" />
    </label>
  );
};

export const EmptyState: React.FC<{
  icon: string;
  title: string;
  desc: string;
}> = ({ icon, title, desc }) => (
  <div className="empty-state">
    <i className={`fa-solid ${icon}`} />
    <h4>{title}</h4>
    <p>{desc}</p>
  </div>
);

export const RiderAvatar: React.FC<{
  rider: Rider;
  size?: number;
  fontSize?: number;
}> = ({ rider, size = 30, fontSize = 11 }) => (
  <div
    className="row-avatar"
    style={{
      background: avatarColor(rider.id),
      width: size,
      height: size,
      fontSize,
    }}
  >
    {initials(rider.name)}
  </div>
);

/** Avatar for API riders (uses name-based color) */
export const ApiRiderAvatar: React.FC<{
  rider: ApiRider;
  size?: number;
  fontSize?: number;
}> = ({ rider, size = 30, fontSize = 11 }) => (
  <div
    className="row-avatar"
    style={{
      background: avatarColorFromName(rider.fullName),
      width: size,
      height: size,
      fontSize,
    }}
  >
    {initials(rider.fullName)}
  </div>
);

export const DayBadge: React.FC<{ d: string }> = ({ d }) => {
  if (d === "M") return <span className="day-badge-morning">M</span>;
  if (d === "E") return <span className="day-badge-evening">E</span>;
  return <span className="day-badge-off">—</span>;
};

interface InnerTabsProps {
  tabs: { id: string; label: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
}
export const InnerTabs: React.FC<InnerTabsProps> = ({
  tabs,
  active,
  onChange,
}) => (
  <div className="inner-tabs">
    {tabs.map((t) => (
      <div
        key={t.id}
        className={`itab ${active === t.id ? "active" : ""}`}
        onClick={() => onChange(t.id)}
      >
        {t.label}
      </div>
    ))}
  </div>
);

interface CPagProps {
  current: number;
  total: number;
  totalItems: number;
  start: number;
  end: number;
  onChange: (p: number) => void;
}
export const CPagination: React.FC<CPagProps> = ({
  current,
  total,
  totalItems,
  start,
  end,
  onChange,
}) => {
  const pages: (number | "…")[] = [];
  if (total <= 7) {
    for (let p = 1; p <= total; p++) pages.push(p);
  } else {
    pages.push(1);
    if (current > 3) pages.push("…");
    for (
      let p = Math.max(2, current - 1);
      p <= Math.min(total - 1, current + 1);
      p++
    )
      pages.push(p);
    if (current < total - 2) pages.push("…");
    pages.push(total);
  }
  return (
    <div className="c-pagination">
      <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
        Showing{" "}
        <strong>
          {totalItems ? start : 0}–{end}
        </strong>{" "}
        of <strong>{totalItems}</strong>
      </div>
      <div className="c-pag-controls">
        <button
          className="c-pag-btn"
          disabled={current === 1}
          onClick={() => onChange(current - 1)}
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <button
              key={`d${i}`}
              className="c-pag-btn"
              style={{ pointerEvents: "none" }}
            >
              …
            </button>
          ) : (
            <button
              key={p}
              className={`c-pag-btn ${p === current ? "active" : ""}`}
              onClick={() => onChange(p as number)}
            >
              {p}
            </button>
          ),
        )}
        <button
          className="c-pag-btn"
          disabled={current === total || total === 0}
          onClick={() => onChange(current + 1)}
        >
          ›
        </button>
      </div>
    </div>
  );
};
