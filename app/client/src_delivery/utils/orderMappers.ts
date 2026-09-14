// ─── utils/orderMappers.ts ────────────────────────────────────
// Converts raw API order → the OrderRow shape your existing UI uses.
// Drop this into src/utils/orderMappers.ts

import type { ApiOrder } from "../hooks/useOrders";

// ── The shape your existing table/panel UI expects ────────────
export interface OrderRow {
  _id: string; // real MongoDB _id for API calls
  id: string; // human-readable "ORD-2026-000001"
  customer: string;
  phone: string;
  items: number;
  value: string;
  status: string;
  payment: string;
  channel: string;
  date: string;
  // Extended fields available when detail is loaded
  address?: string;
  city?: string;
  trackingNumber?: string;
  courierName?: string;
  notes?: string;
  rawItems?: ApiOrder["items"];
}

function fmtPKR(n: number): string {
  return "₨" + n.toLocaleString("en-PK");
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Backend uses "COD" | "Prepaid" | "Card" | "BankTransfer" | "Wallet"
// UI expects "COD" | "Prepaid"
function mapPayment(method: string): string {
  if (method === "COD") return "COD";
  return "Prepaid";
}

// Backend orderStatus → UI status (they mostly match already)
// Backend: Pending | Confirmed | Processing | Packed | Shipped | Delivered | Cancelled | Returned
// UI:      Pending | Confirmed | Packed | Shipped | Delivered | Cancelled | Returned
function mapStatus(status: string): string {
  if (status === "Processing") return "Confirmed"; // collapse Processing into Confirmed for UI
  return status;
}

export function mapApiOrderToRow(o: ApiOrder): OrderRow {
  return {
    _id: o._id,
    id: o.orderId ?? o._id.slice(-6).toUpperCase(),
    customer: o.customer?.fullName ?? "Unknown",
    phone: o.customer?.phone ?? o.shippingAddress?.phone ?? "—",
    items: o.items?.reduce((s, i) => s + (i.quantity ?? 0), 0) ?? 0,
    value: fmtPKR(o.totalAmount),
    status: mapStatus(o.orderStatus),
    payment: mapPayment(o.paymentMethod),
    channel: o.source,
    date: fmtDate(o.createdAt),
    // Extended
    address: o.shippingAddress
      ? [o.shippingAddress.street, o.shippingAddress.city]
          .filter(Boolean)
          .join(", ")
      : undefined,
    city: o.shippingAddress?.city,
    trackingNumber: o.trackingNumber,
    courierName: o.courier?.name,
    notes: o.notes,
    rawItems: o.items,
  };
}

export function mapApiOrdersToRows(orders: ApiOrder[]): OrderRow[] {
  return orders.map(mapApiOrderToRow);
}

// ── Stats from orders list ────────────────────────────────────
export interface OrderStatsData {
  total: number;
  confirmedRate: string;
  codCount: number;
  codPct: string;
  avgValue: string;
}

export function computeOrderStats(orders: ApiOrder[]): OrderStatsData {
  const total = orders.length;
  const confirmed = orders.filter((o) =>
    ["Confirmed", "Processing", "Packed", "Shipped", "Delivered"].includes(
      o.orderStatus,
    ),
  ).length;
  const codCount = orders.filter((o) => o.paymentMethod === "COD").length;
  const totalVal = orders.reduce((s, o) => s + o.totalAmount, 0);

  return {
    total,
    confirmedRate: total ? `${Math.round((confirmed / total) * 100)}%` : "0%",
    codCount,
    codPct: total ? `${Math.round((codCount / total) * 100)}%` : "0%",
    avgValue: total ? fmtPKR(Math.round(totalVal / total)) : "₨0",
  };
}
