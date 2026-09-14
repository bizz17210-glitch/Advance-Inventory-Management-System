// ─── hooks/useOrders.ts ───────────────────────────────────────
// Fetches orders from GET /api/orders and handles status/cancel.
// Drop into src/hooks/useOrders.ts

import { useState, useEffect, useCallback } from "react";
import { ordersAPI } from "../services/api";

// ── API response shape (matches backend docs) ─────────────────
export interface ApiOrder {
  _id: string;
  orderId: string; // e.g. "ORD-2026-000001"
  source: string; // "WhatsApp" | "Shopify" | "Manual" | "Instagram" | "Website"
  orderStatus: string; // "Pending" | "Confirmed" | "Processing" | "Packed" | "Shipped" | "Delivered" | "Cancelled" | "Returned"
  paymentStatus: string; // "Pending" | "Paid" | "Refunded" | "Partially Paid" | "Failed"
  paymentMethod: string; // "COD" | "Prepaid" | "Card" | "BankTransfer" | "Wallet"
  totalAmount: number;
  subtotal?: number;
  shippingCost?: number;
  discount?: number;
  createdAt: string;
  customer: {
    _id?: string;
    fullName: string;
    email?: string;
    phone?: string;
  };
  shippingAddress?: {
    name?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  items?: Array<{
    _id: string;
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    variantAttributes?: Record<string, string>;
  }>;
  courier?: { _id?: string; name: string };
  trackingNumber?: string;
  notes?: string;
}

export interface OrdersPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface OrdersFilter {
  search?: string; // client-side only (backend doesn't support search param on list)
  status?: string; // Pending | Confirmed | Processing | Packed | Shipped | Delivered | Cancelled | Returned
  paymentStatus?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

interface UseOrdersState {
  orders: ApiOrder[];
  pagination: OrdersPagination | null;
  loading: boolean;
  error: string | null;
}

export function useOrders(filters: OrdersFilter = {}) {
  const [state, setState] = useState<UseOrdersState>({
    orders: [],
    pagination: null,
    loading: true,
    error: null,
  });

  const fetchOrders = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const params: Record<string, any> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 15,
      };
      if (filters.status) params.status = filters.status;
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
      if (filters.source) params.source = filters.source;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      // note: `search` is applied client-side since the list endpoint doesn't support it

      const res = await ordersAPI.getAll(params);
      const data = (res.data as any).data;

      setState({
        orders: data?.orders ?? [],
        pagination: data?.pagination ?? null,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err?.response?.data?.message ?? "Failed to load orders",
      }));
    }
  }, [
    filters.page,
    filters.limit,
    filters.status,
    filters.paymentStatus,
    filters.source,
    filters.dateFrom,
    filters.dateTo,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Update status — PATCH /api/orders/:id/status ──────────
  // Valid transitions:
  //   Pending → Confirmed → Processing → Packed → Shipped → Delivered
  //   Pending | Confirmed → Cancelled
  //   Shipped → Returned
  const updateStatus = useCallback(
    async (id: string, status: string, notes?: string) => {
      try {
        await ordersAPI.updateStatus(id, status, notes);
        setState((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o._id === id ? { ...o, orderStatus: status } : o,
          ),
        }));
        return true;
      } catch (err: any) {
        console.error("Status update failed:", err?.response?.data?.message);
        return false;
      }
    },
    [],
  );

  // ── Cancel order — DELETE /api/orders/:id ─────────────────
  // The backend restores stock automatically on cancellation.
  const cancelOrder = useCallback(async (id: string, reason?: string) => {
    try {
      await ordersAPI.delete(id, reason);
      setState((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o._id === id ? { ...o, orderStatus: "Cancelled" } : o,
        ),
      }));
      return true;
    } catch (err: any) {
      console.error("Cancel failed:", err?.response?.data?.message);
      return false;
    }
  }, []);

  // ── Fulfill order — POST /api/orders/:id/fulfill ──────────
  // Assigns a courier (+ optionally a rider) and marks as Shipped.
  const fulfillOrder = useCallback(
    async (id: string, courierId: string, riderId?: string, notes?: string) => {
      try {
        await ordersAPI.fulfill(id, {
          courier: courierId,
          ...(riderId ? { rider: riderId } : {}),
          ...(notes ? { notes } : {}),
        });
        setState((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o._id === id ? { ...o, orderStatus: "Shipped" } : o,
          ),
        }));
        return true;
      } catch (err: any) {
        console.error("Fulfill failed:", err?.response?.data?.message);
        return false;
      }
    },
    [],
  );

  return {
    ...state,
    refresh: fetchOrders,
    updateStatus,
    cancelOrder,
    fulfillOrder,
  };
}
