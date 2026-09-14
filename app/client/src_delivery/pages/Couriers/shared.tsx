// ═══════════════════════════════════════════════════════════
// shared.tsx  —  API Types · Helpers · Micro-components · Static fallback data
// ═══════════════════════════════════════════════════════════

import React, { useState } from "react";

// ───────────────────────────────────────────────────────────
// NAV TYPE
// ───────────────────────────────────────────────────────────
export type NavPanel =
  | "overview"
  | "companies"
  | "contacts"
  | "contracts"
  | "shipments"
  | "pending"
  | "intransit"
  | "delivered"
  | "returns"
  | "failed"
  | "tracking"
  | "apilog"
  | "performance"
  | "cod"
  | "reports"
  | "settings"
  | "rules"
  | "zones";

// ───────────────────────────────────────────────────────────
// BACKEND API TYPES
// ───────────────────────────────────────────────────────────
export interface ApiCourier {
  _id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  apiIntegrationEnabled?: boolean;
  apiStatus?: "live" | "test" | "disabled";
  apiEndpoint?: string;
  serviceRegions?: string[];
  activeShipments?: number;
  inTransit?: number;
  deliveredToday?: number;
  completionRate?: string;
  performanceMetrics?: {
    totalDeliveries: number;
    onTimeDeliveries: number;
    cancellationRate: number;
  };
  // UI-extended fields
  code?: string;
  city?: string;
  coverage?: string;
  baseRate?: number;
  codPct?: number;
  codDays?: number;
  outstanding?: number;
  avgDays?: number;
  successRate?: number;
  rating?: number;
  status?: "Active" | "Paused" | "Inactive";
}

export interface ApiShipment {
  _id: string;
  orderReference?: string;
  orderId?: string;
  order?: string;
  trackingNumber?: string;
  currentStatus: string;
  courierName?: string;
  courier?: { _id: string; name: string } | string;
  customer?: { name?: string; phone?: string; fullName?: string };
  shippingAddress?: { city?: string; street?: string; country?: string };
  estimatedDelivery?: string;
  createdAt?: string;
  updatedAt?: string;
  weight?: number;
  codAmount?: number;
  codStatus?: string;
  proofOfDelivery?: boolean;
  dispatchedAt?: string;
  deliveredAt?: string;
}

export interface ApiShipmentTracking {
  _id: string;
  trackingNumber: string;
  currentStatus: string;
  trackingHistory: {
    status: string;
    description: string;
    location?: string;
    timestamp: string;
    apiSource?: string;
  }[];
  estimatedDelivery?: string;
}

export interface ApiCourierPerformance {
  id: string;
  name: string;
  totalDeliveries: number;
  successfulDeliveries: number;
  successRate: string;
  avgDeliveryTime: number;
  cancellationRate: number;
}

export interface ApiPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// ───────────────────────────────────────────────────────────
// STATIC LEGACY TYPES (for panels not yet fully dynamic)
// ───────────────────────────────────────────────────────────
export interface CourierCompany {
  id: number;
  name: string;
  code: string;
  contact: string;
  phone: string;
  city: string;
  coverage: string;
  baseRate: number;
  codPct: number;
  codDays: number;
  outstanding: number;
  avgDays: number;
  successRate: number;
  api: boolean;
  rating: number;
  status: "Active" | "Paused" | "Inactive";
}
export interface CODPending {
  order: string;
  courier: string;
  customer: string;
  delivered: string;
  amount: number;
  days: number;
  due: string;
}
export interface CODSummary {
  courier: string;
  delivered: number;
  codAmt: string;
  collected: string;
  pending: string;
  overdue: string;
  freq: string;
  last: string;
  next: string;
}
export interface PerfItem {
  name: string;
  assigned: number;
  delivered: number;
  rto: number;
  failed: number;
  rate: number;
  rtoRate: number;
  avgDays: number;
  codCollPct: number;
  slaPct: number;
  rating: number;
}
export interface TransitItem {
  track: string;
  order: string;
  customer: string;
  courier: string;
  location: string;
  status: string;
  dispatched: string;
  est: string;
  daysLeft: number;
  cod: string;
}
export interface DeliveredItem {
  track: string;
  order: string;
  customer: string;
  courier: string;
  deliveredOn: string;
  days: number;
  cod: number;
  codStatus: string;
  proof: string;
}
export interface RTOItem {
  track: string;
  order: string;
  customer: string;
  courier: string;
  reason: string;
  dispatched: string;
  rtoDate: string;
  cod: string;
  restock: string;
}
export interface FailedItem {
  track: string;
  order: string;
  customer: string;
  phone: string;
  courier: string;
  attempts: number;
  last: string;
  reason: string;
  action: string;
}
export interface APILog {
  ts: string;
  courier: string;
  type: string;
  track: string;
  code: number;
  ms: number;
  result: string;
}
export interface BulkSync {
  courier: string;
  lastSync: string;
  shipments: number;
  updated: number;
  errors: number;
  status: string;
}
export interface Contract {
  courier: string;
  ref: string;
  start: string;
  end: string;
  sla: number;
  penalty: number;
  codDays: number;
  autoRenew: string;
  status: string;
}
export interface Contact {
  courier: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  city: string;
  last: string;
}
export interface Rule {
  priority: number;
  name: string;
  condition: string;
  assign: string;
  fallback: string;
  status: string;
  applied: number;
}
export interface Zone {
  name: string;
  cities: string;
  primary: string;
  backup: string;
  days: string;
  mult: string;
}
export interface CityMap {
  city: string;
  province: string;
  zone: string;
  primary: string;
  backup: string;
  days: number;
}
export interface RecentReport {
  name: string;
  type: string;
  generated: string;
  format: string;
  size: string;
}
export interface PendingOrder {
  order: string;
  customer: string;
  city: string;
  items: number;
  weight: string;
  cod: string;
  date: string;
  waiting: string;
}

// ───────────────────────────────────────────────────────────
// STATIC DATA (used by non-dynamic panels)
// ───────────────────────────────────────────────────────────
export const COURIERS: CourierCompany[] = [
  {
    id: 1,
    name: "TCS Express",
    code: "TCS",
    contact: "Naseer Rana",
    phone: "0321-1112233",
    city: "Lahore",
    coverage: "Nationwide",
    baseRate: 200,
    codPct: 1.5,
    codDays: 7,
    outstanding: 38000,
    avgDays: 2.1,
    successRate: 91,
    api: true,
    rating: 4.5,
    status: "Active",
  },
  {
    id: 2,
    name: "Leopards Courier",
    code: "LCS",
    contact: "Bilal Shah",
    phone: "0300-4445566",
    city: "Karachi",
    coverage: "Nationwide",
    baseRate: 180,
    codPct: 1.2,
    codDays: 5,
    outstanding: 29000,
    avgDays: 1.9,
    successRate: 94,
    api: true,
    rating: 4.7,
    status: "Active",
  },
  {
    id: 3,
    name: "M&P Express",
    code: "MNP",
    contact: "Tariq Mehmood",
    phone: "0333-7778899",
    city: "Lahore",
    coverage: "Nationwide",
    baseRate: 170,
    codPct: 1.0,
    codDays: 7,
    outstanding: 10000,
    avgDays: 1.8,
    successRate: 88,
    api: true,
    rating: 4.2,
    status: "Active",
  },
  {
    id: 4,
    name: "Trax",
    code: "TRAX",
    contact: "Sadia Naz",
    phone: "0311-0001112",
    city: "Karachi",
    coverage: "Nationwide",
    baseRate: 160,
    codPct: 1.5,
    codDays: 10,
    outstanding: 7000,
    avgDays: 2.4,
    successRate: 82,
    api: false,
    rating: 3.8,
    status: "Active",
  },
  {
    id: 5,
    name: "PostEx",
    code: "POSTEX",
    contact: "Imran Saeed",
    phone: "0345-3334445",
    city: "Multan",
    coverage: "Regional",
    baseRate: 190,
    codPct: 1.3,
    codDays: 7,
    outstanding: 0,
    avgDays: 2.8,
    successRate: 79,
    api: false,
    rating: 3.6,
    status: "Paused",
  },
  {
    id: 6,
    name: "BlueEX",
    code: "BLUEEX",
    contact: "Ali Rana",
    phone: "0300-8889990",
    city: "Islamabad",
    coverage: "Nationwide",
    baseRate: 210,
    codPct: 1.1,
    codDays: 5,
    outstanding: 0,
    avgDays: 2.0,
    successRate: 90,
    api: false,
    rating: 4.0,
    status: "Active",
  },
];

export const PENDING_ORDERS: PendingOrder[] = [
  {
    order: "ORD-1048",
    customer: "Amna Bibi",
    city: "Lahore",
    items: 3,
    weight: "0.9 kg",
    cod: "₨4,200",
    date: "10 May 2026",
    waiting: "1h",
  },
  {
    order: "ORD-1042",
    customer: "Zainab Qureshi",
    city: "Faisalabad",
    items: 3,
    weight: "1.4 kg",
    cod: "₨5,400",
    date: "09 May 2026",
    waiting: "26h",
  },
  {
    order: "ORD-1036",
    customer: "Iram Sheikh",
    city: "Karachi",
    items: 2,
    weight: "0.7 kg",
    cod: "₨4,100",
    date: "08 May 2026",
    waiting: "50h",
  },
  {
    order: "ORD-1034",
    customer: "Tania Siddiqui",
    city: "Rawalpindi",
    items: 4,
    weight: "2.1 kg",
    cod: "₨6,800",
    date: "07 May 2026",
    waiting: "74h",
  },
];

export const TRANSIT_ITEMS: TransitItem[] = [
  {
    track: "TCS-2026-04821",
    order: "ORD-1046",
    customer: "Sara Khan",
    courier: "TCS",
    location: "Islamabad Hub",
    status: "In Transit",
    dispatched: "07 May",
    est: "12 May",
    daysLeft: 1,
    cod: "₨3,600",
  },
  {
    track: "MNP-2026-08812",
    order: "ORD-1045",
    customer: "Nadia Malik",
    courier: "MNP",
    location: "Lahore Depot",
    status: "In Transit",
    dispatched: "06 May",
    est: "10 May",
    daysLeft: 0,
    cod: "₨7,100",
  },
  {
    track: "TRAX-2026-0312",
    order: "ORD-1040",
    customer: "Sadia Hussain",
    courier: "TRAX",
    location: "Peshawar Hub",
    status: "In Transit",
    dispatched: "04 May",
    est: "11 May",
    daysLeft: 0,
    cod: "₨9,200",
  },
  {
    track: "LCS-2026-01188",
    order: "ORD-1038",
    customer: "Asma Iqbal",
    courier: "LCS",
    location: "Karachi Hub",
    status: "Out for Delivery",
    dispatched: "09 May",
    est: "11 May",
    daysLeft: 0,
    cod: "₨2,800",
  },
  {
    track: "POSTEX-2026-0021",
    order: "ORD-1033",
    customer: "Fatima Zara",
    courier: "POSTEX",
    location: "Multan Depot",
    status: "In Transit",
    dispatched: "08 May",
    est: "13 May",
    daysLeft: 2,
    cod: "₨2,800",
  },
];

export const DELIVERED_ITEMS: DeliveredItem[] = [
  {
    track: "LCS-2026-01234",
    order: "ORD-1044",
    customer: "Rabia Ahmed",
    courier: "LCS",
    deliveredOn: "09 May 2026",
    days: 3,
    cod: 2200,
    codStatus: "Collected",
    proof: "Yes",
  },
  {
    track: "TCS-2026-04800",
    order: "ORD-1043",
    customer: "Hira Baig",
    courier: "TCS",
    deliveredOn: "08 May 2026",
    days: 3,
    cod: 3900,
    codStatus: "Collected",
    proof: "Yes",
  },
  {
    track: "LCS-2026-01200",
    order: "ORD-1039",
    customer: "Bushra Nawaz",
    courier: "LCS",
    deliveredOn: "07 May 2026",
    days: 3,
    cod: 3100,
    codStatus: "Collected",
    proof: "No",
  },
  {
    track: "LCS-2026-01190",
    order: "ORD-1035",
    customer: "Lubna Tanvir",
    courier: "LCS",
    deliveredOn: "05 May 2026",
    days: 3,
    cod: 1600,
    codStatus: "Collected",
    proof: "Yes",
  },
  {
    track: "TCS-2026-04770",
    order: "ORD-1034",
    customer: "Amna Bibi",
    courier: "TCS",
    deliveredOn: "04 May 2026",
    days: 3,
    cod: 4500,
    codStatus: "Pending",
    proof: "Yes",
  },
];

export const RTO_ITEMS: RTOItem[] = [
  {
    track: "TCS-2026-04780",
    order: "ORD-1037",
    customer: "Maira Usman",
    courier: "TCS",
    reason: "Wrong Address",
    dispatched: "03 May",
    rtoDate: "09 May",
    cod: "—",
    restock: "Pending",
  },
  {
    track: "LCS-2026-01150",
    order: "ORD-1022",
    customer: "Hina Akhtar",
    courier: "LCS",
    reason: "Customer Refused",
    dispatched: "28 Apr",
    rtoDate: "05 May",
    cod: "—",
    restock: "Done",
  },
  {
    track: "TRAX-2026-0250",
    order: "ORD-1018",
    customer: "Sana Farooq",
    courier: "TRAX",
    reason: "Not Reachable",
    dispatched: "25 Apr",
    rtoDate: "02 May",
    cod: "—",
    restock: "Done",
  },
];

export const FAILED_ITEMS: FailedItem[] = [
  {
    track: "TRAX-2026-0298",
    order: "ORD-1042",
    customer: "Zainab Qureshi",
    phone: "0300-9988776",
    courier: "TRAX",
    attempts: 3,
    last: "09 May 2026",
    reason: "Not Home",
    action: "Pending",
  },
  {
    track: "TCS-2026-04760",
    order: "ORD-1019",
    customer: "Ayesha Tariq",
    phone: "0321-1234567",
    courier: "TCS",
    attempts: 3,
    last: "07 May 2026",
    reason: "Wrong Pin",
    action: "Pending",
  },
  {
    track: "MNP-2026-08700",
    order: "ORD-1015",
    customer: "Sobia Ali",
    phone: "0333-7766554",
    courier: "MNP",
    attempts: 3,
    last: "06 May 2026",
    reason: "Address Unclear",
    action: "Pending",
  },
  {
    track: "LCS-2026-01100",
    order: "ORD-1011",
    customer: "Mariam Khan",
    phone: "0311-8899001",
    courier: "LCS",
    attempts: 3,
    last: "05 May 2026",
    reason: "Customer Not Available",
    action: "Re-dispatched",
  },
];

export const PERF_DATA: PerfItem[] = [
  {
    name: "TCS Express",
    assigned: 56,
    delivered: 51,
    rto: 3,
    failed: 2,
    rate: 91,
    rtoRate: 5.4,
    avgDays: 2.1,
    codCollPct: 96,
    slaPct: 88,
    rating: 4.5,
  },
  {
    name: "Leopards Courier",
    assigned: 42,
    delivered: 39,
    rto: 2,
    failed: 1,
    rate: 93,
    rtoRate: 4.8,
    avgDays: 1.9,
    codCollPct: 98,
    slaPct: 94,
    rating: 4.7,
  },
  {
    name: "M&P Express",
    assigned: 28,
    delivered: 25,
    rto: 2,
    failed: 1,
    rate: 89,
    rtoRate: 7.1,
    avgDays: 1.8,
    codCollPct: 97,
    slaPct: 90,
    rating: 4.2,
  },
  {
    name: "Trax",
    assigned: 16,
    delivered: 13,
    rto: 2,
    failed: 1,
    rate: 81,
    rtoRate: 12.5,
    avgDays: 2.4,
    codCollPct: 91,
    slaPct: 75,
    rating: 3.8,
  },
];

export const COD_PENDING: CODPending[] = [
  {
    order: "ORD-1046",
    courier: "TCS",
    customer: "Sara Khan",
    delivered: "09 May 2026",
    amount: 3600,
    days: 2,
    due: "16 May",
  },
  {
    order: "ORD-1045",
    courier: "MNP",
    customer: "Nadia Malik",
    delivered: "10 May 2026",
    amount: 7100,
    days: 1,
    due: "17 May",
  },
  {
    order: "ORD-1040",
    courier: "TRAX",
    customer: "Sadia Hussain",
    delivered: "08 May 2026",
    amount: 9200,
    days: 3,
    due: "18 May",
  },
  {
    order: "ORD-1032",
    courier: "TCS",
    customer: "Amna Bibi",
    delivered: "04 May 2026",
    amount: 4200,
    days: 7,
    due: "11 May",
  },
  {
    order: "ORD-1029",
    courier: "LCS",
    customer: "Fatima Zara",
    delivered: "03 May 2026",
    amount: 1800,
    days: 8,
    due: "10 May",
  },
];

export const COD_SUMMARY: CODSummary[] = [
  {
    courier: "TCS Express",
    delivered: 51,
    codAmt: "₨1,12,000",
    collected: "₨74,000",
    pending: "₨38,000",
    overdue: "₨12,000",
    freq: "Weekly",
    last: "05 May",
    next: "12 May",
  },
  {
    courier: "Leopards Courier",
    delivered: 39,
    codAmt: "₨84,000",
    collected: "₨55,000",
    pending: "₨29,000",
    overdue: "₨0",
    freq: "Weekly",
    last: "06 May",
    next: "13 May",
  },
  {
    courier: "M&P Express",
    delivered: 25,
    codAmt: "₨52,000",
    collected: "₨42,000",
    pending: "₨10,000",
    overdue: "₨0",
    freq: "Bi-weekly",
    last: "02 May",
    next: "16 May",
  },
  {
    courier: "Trax",
    delivered: 13,
    codAmt: "₨28,000",
    collected: "₨21,000",
    pending: "₨7,000",
    overdue: "₨7,000",
    freq: "Weekly",
    last: "29 Apr",
    next: "06 May",
  },
];

export const CONTRACTS: Contract[] = [
  {
    courier: "TCS Express",
    ref: "CTR-2026-001",
    start: "01 Jan 2026",
    end: "31 Dec 2026",
    sla: 3,
    penalty: 100,
    codDays: 7,
    autoRenew: "Yes",
    status: "Active",
  },
  {
    courier: "Leopards Courier",
    ref: "CTR-2026-002",
    start: "01 Feb 2026",
    end: "31 Jan 2027",
    sla: 2,
    penalty: 50,
    codDays: 5,
    autoRenew: "Yes",
    status: "Active",
  },
  {
    courier: "M&P Express",
    ref: "CTR-2026-003",
    start: "15 Feb 2026",
    end: "14 Feb 2027",
    sla: 2,
    penalty: 75,
    codDays: 7,
    autoRenew: "No",
    status: "Active",
  },
  {
    courier: "Trax",
    ref: "CTR-2026-004",
    start: "01 Mar 2026",
    end: "28 Feb 2027",
    sla: 3,
    penalty: 50,
    codDays: 10,
    autoRenew: "No",
    status: "Active",
  },
];

export const CONTACTS: Contact[] = [
  {
    courier: "TCS Express",
    name: "Naseer Rana",
    role: "Account Manager",
    phone: "0321-1112233",
    email: "naseer@tcs.com",
    city: "Lahore",
    last: "08 May 2026",
  },
  {
    courier: "Leopards Courier",
    name: "Bilal Shah",
    role: "Sales Rep",
    phone: "0300-4445566",
    email: "bilal@leopards.com",
    city: "Karachi",
    last: "07 May 2026",
  },
  {
    courier: "M&P Express",
    name: "Tariq Mehmood",
    role: "Ops Manager",
    phone: "0333-7778899",
    email: "tariq@mnp.com",
    city: "Lahore",
    last: "05 May 2026",
  },
  {
    courier: "Trax",
    name: "Sadia Naz",
    role: "Account Manager",
    phone: "0311-0001112",
    email: "sadia@trax.com",
    city: "Karachi",
    last: "04 May 2026",
  },
  {
    courier: "BlueEX",
    name: "Ali Rana",
    role: "Key Account",
    phone: "0300-8889990",
    email: "ali@blueex.com",
    city: "Islamabad",
    last: "01 May 2026",
  },
];

export const RULES: Rule[] = [
  {
    priority: 1,
    name: "Karachi — Leopards",
    condition: "City = Karachi",
    assign: "Leopards",
    fallback: "TCS",
    status: "Active",
    applied: 34,
  },
  {
    priority: 2,
    name: "Heavy Orders — TCS",
    condition: "Weight > 3 kg",
    assign: "TCS",
    fallback: "MNP",
    status: "Active",
    applied: 12,
  },
  {
    priority: 3,
    name: "High COD — TCS",
    condition: "COD > ₨8,000",
    assign: "TCS",
    fallback: "LCS",
    status: "Active",
    applied: 8,
  },
  {
    priority: 4,
    name: "Punjab — Leopards",
    condition: "Province = Punjab",
    assign: "Leopards",
    fallback: "TCS",
    status: "Active",
    applied: 41,
  },
  {
    priority: 5,
    name: "Default — TCS",
    condition: "All others",
    assign: "TCS",
    fallback: "LCS",
    status: "Active",
    applied: 47,
  },
];

export const ZONES: Zone[] = [
  {
    name: "Lahore Metro",
    cities: "Lahore, Sheikhupura, Kasur",
    primary: "Leopards",
    backup: "TCS",
    days: "1-2",
    mult: "1.0",
  },
  {
    name: "Karachi Metro",
    cities: "Karachi, Hyderabad",
    primary: "M&P",
    backup: "LCS",
    days: "1-2",
    mult: "1.0",
  },
  {
    name: "Islamabad/RWP",
    cities: "Islamabad, Rawalpindi",
    primary: "TCS",
    backup: "LCS",
    days: "1-2",
    mult: "1.0",
  },
  {
    name: "Punjab Outskirts",
    cities: "Faisalabad, Multan, Gujranwala",
    primary: "TCS",
    backup: "TRAX",
    days: "2-3",
    mult: "1.1",
  },
  {
    name: "KPK & FATA",
    cities: "Peshawar, Abbottabad, Mardan",
    primary: "TCS",
    backup: "—",
    days: "3-5",
    mult: "1.3",
  },
  {
    name: "Balochistan",
    cities: "Quetta, Gwadar",
    primary: "TCS",
    backup: "—",
    days: "4-6",
    mult: "1.5",
  },
];

export const CITY_MAP: CityMap[] = [
  {
    city: "Lahore",
    province: "Punjab",
    zone: "Lahore Metro",
    primary: "Leopards",
    backup: "TCS",
    days: 1,
  },
  {
    city: "Karachi",
    province: "Sindh",
    zone: "Karachi Metro",
    primary: "M&P",
    backup: "LCS",
    days: 1,
  },
  {
    city: "Islamabad",
    province: "Federal",
    zone: "Islamabad/RWP",
    primary: "TCS",
    backup: "LCS",
    days: 1,
  },
  {
    city: "Rawalpindi",
    province: "Punjab",
    zone: "Islamabad/RWP",
    primary: "TCS",
    backup: "LCS",
    days: 1,
  },
  {
    city: "Faisalabad",
    province: "Punjab",
    zone: "Punjab Outskirts",
    primary: "TCS",
    backup: "TRAX",
    days: 2,
  },
  {
    city: "Multan",
    province: "Punjab",
    zone: "Punjab Outskirts",
    primary: "TCS",
    backup: "TRAX",
    days: 2,
  },
  {
    city: "Peshawar",
    province: "KPK",
    zone: "KPK & FATA",
    primary: "TCS",
    backup: "—",
    days: 3,
  },
  {
    city: "Quetta",
    province: "Balochistan",
    zone: "Balochistan",
    primary: "TCS",
    backup: "—",
    days: 4,
  },
];

export const API_LOGS: APILog[] = [
  {
    ts: "2026-05-11 08:00:02",
    courier: "TCS",
    type: "Status Poll",
    track: "TCS-2026-04821",
    code: 200,
    ms: 312,
    result: "Updated",
  },
  {
    ts: "2026-05-11 08:00:04",
    courier: "Leopards",
    type: "Status Poll",
    track: "LCS-2026-01234",
    code: 200,
    ms: 287,
    result: "No Change",
  },
  {
    ts: "2026-05-11 08:00:07",
    courier: "Trax",
    type: "Status Poll",
    track: "TRAX-2026-0312",
    code: 502,
    ms: 5001,
    result: "Error",
  },
  {
    ts: "2026-05-11 08:00:09",
    courier: "M&P",
    type: "Status Poll",
    track: "MNP-2026-08812",
    code: 200,
    ms: 198,
    result: "Updated",
  },
  {
    ts: "2026-05-11 07:00:01",
    courier: "TCS",
    type: "Create Booking",
    track: "TCS-2026-04900",
    code: 201,
    ms: 450,
    result: "Created",
  },
  {
    ts: "2026-05-11 07:00:08",
    courier: "Trax",
    type: "Status Poll",
    track: "TRAX-2026-0298",
    code: 404,
    ms: 120,
    result: "Not Found",
  },
  {
    ts: "2026-05-11 06:00:03",
    courier: "Leopards",
    type: "Status Poll",
    track: "LCS-2026-01190",
    code: 200,
    ms: 305,
    result: "Updated",
  },
  {
    ts: "2026-05-11 06:00:05",
    courier: "M&P",
    type: "Status Poll",
    track: "MNP-2026-08780",
    code: 200,
    ms: 221,
    result: "No Change",
  },
];

export const BULK_SYNC: BulkSync[] = [
  {
    courier: "TCS Express",
    lastSync: "11 May 08:00",
    shipments: 21,
    updated: 4,
    errors: 0,
    status: "OK",
  },
  {
    courier: "Leopards Courier",
    lastSync: "11 May 08:00",
    shipments: 15,
    updated: 2,
    errors: 0,
    status: "OK",
  },
  {
    courier: "M&P Express",
    lastSync: "11 May 08:00",
    shipments: 9,
    updated: 1,
    errors: 0,
    status: "OK",
  },
  {
    courier: "Trax",
    lastSync: "11 May 08:00",
    shipments: 6,
    updated: 0,
    errors: 3,
    status: "Error",
  },
];

export const RECENT_REPORTS: RecentReport[] = [
  {
    name: "Delivery Performance — Apr 2026",
    type: "Performance",
    generated: "01 May 2026",
    format: "Excel",
    size: "48 KB",
  },
  {
    name: "COD Reconciliation — Apr 2026",
    type: "COD",
    generated: "01 May 2026",
    format: "CSV",
    size: "22 KB",
  },
  {
    name: "Shipment Status — Week 18",
    type: "Status",
    generated: "05 May 2026",
    format: "Excel",
    size: "31 KB",
  },
];

export const SHIPMENTS = [
  {
    track: "TCS-2026-04821",
    order: "ORD-1046",
    customer: "Sara Khan",
    courier: "TCS",
    city: "Islamabad",
    weight: "0.8",
    cod: 3600,
    status: "In Transit",
    dispatched: "07 May",
    est: "12 May",
    codStatus: "Pending",
  },
  {
    track: "LCS-2026-01234",
    order: "ORD-1044",
    customer: "Rabia Ahmed",
    courier: "LCS",
    city: "Karachi",
    weight: "0.5",
    cod: 2200,
    status: "Delivered",
    dispatched: "06 May",
    est: "09 May",
    codStatus: "Collected",
  },
  {
    track: "MNP-2026-08812",
    order: "ORD-1045",
    customer: "Nadia Malik",
    courier: "MNP",
    city: "Rawalpindi",
    weight: "1.2",
    cod: 7100,
    status: "In Transit",
    dispatched: "06 May",
    est: "10 May",
    codStatus: "Pending",
  },
  {
    track: "TCS-2026-04800",
    order: "ORD-1043",
    customer: "Hira Baig",
    courier: "TCS",
    city: "Multan",
    weight: "0.6",
    cod: 3900,
    status: "Delivered",
    dispatched: "05 May",
    est: "08 May",
    codStatus: "Collected",
  },
  {
    track: "TRAX-2026-0312",
    order: "ORD-1040",
    customer: "Sadia Hussain",
    courier: "TRAX",
    city: "Peshawar",
    weight: "2.1",
    cod: 9200,
    status: "In Transit",
    dispatched: "04 May",
    est: "11 May",
    codStatus: "Pending",
  },
  {
    track: "LCS-2026-01200",
    order: "ORD-1039",
    customer: "Bushra Nawaz",
    courier: "LCS",
    city: "Quetta",
    weight: "0.4",
    cod: 3100,
    status: "Delivered",
    dispatched: "04 May",
    est: "07 May",
    codStatus: "Collected",
  },
  {
    track: "TCS-2026-04780",
    order: "ORD-1037",
    customer: "Maira Usman",
    courier: "TCS",
    city: "Lahore",
    weight: "0.9",
    cod: 5700,
    status: "RTO",
    dispatched: "03 May",
    est: "06 May",
    codStatus: "N/A",
  },
  {
    track: "POSTEX-2026-0021",
    order: "ORD-1033",
    customer: "Fatima Zara",
    courier: "POSTEX",
    city: "Multan",
    weight: "0.8",
    cod: 2800,
    status: "In Transit",
    dispatched: "08 May",
    est: "13 May",
    codStatus: "Pending",
  },
];

// ───────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────
export const fmt = (n: number) => "₨" + Number(n).toLocaleString();

export const rColor = (r: number) =>
  r >= 90 ? "var(--green)" : r >= 80 ? "var(--yellow)" : "var(--red)";

export function badgeClass(s: string): string {
  const m: Record<string, string> = {
    Active: "green",
    Paused: "yellow",
    Inactive: "gray",
    "In Transit": "orange",
    in_transit: "orange",
    Delivered: "green",
    delivered: "green",
    RTO: "yellow",
    returned: "yellow",
    Pending: "yellow",
    assigned: "blue",
    picked_up: "blue",
    Failed: "red",
    failed: "red",
    "Out for Delivery": "blue",
    out_for_delivery: "blue",
    Collected: "green",
    "N/A": "gray",
    Done: "green",
    OK: "green",
    Error: "red",
    Connected: "green",
    "Not Connected": "red",
    Updated: "green",
    "No Change": "gray",
    Created: "green",
    "Not Found": "red",
    "Re-dispatched": "blue",
    Critical: "red",
    Low: "yellow",
    Good: "green",
    live: "green",
    test: "yellow",
    disabled: "gray",
  };
  return m[s] || "gray";
}

export function statusLabel(s: string): string {
  const m: Record<string, string> = {
    assigned: "Assigned",
    picked_up: "Picked Up",
    in_transit: "In Transit",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    failed: "Failed",
    returned: "RTO",
  };
  return m[s] ?? s;
}

export const courierInitials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

// ───────────────────────────────────────────────────────────
// SKELETON HELPER
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
  <span className={`badge ${badgeClass(label)}`}>{statusLabel(label)}</span>
);

export const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <>
    <span className="rating-stars">
      {"★".repeat(Math.floor(rating))}
      {rating % 1 ? "½" : ""}
    </span>
    <span style={{ fontSize: 9, color: "var(--text-muted)", marginLeft: 3 }}>
      {rating}
    </span>
  </>
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

export const ToggleSwitch: React.FC<{
  defaultChecked?: boolean;
  onChange?: (v: boolean) => void;
}> = ({ defaultChecked = false, onChange }) => {
  const [on, setOn] = useState(defaultChecked);
  return (
    <label className="toggle-switch">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => {
          setOn(e.target.checked);
          onChange?.(e.target.checked);
        }}
      />
      <span className="toggle-track" />
    </label>
  );
};

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
