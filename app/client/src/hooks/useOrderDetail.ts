// ─── hooks/useOrderDetail.ts ──────────────────────────────────
// Fetches full order detail from GET /api/orders/:id
// Drop into src/hooks/useOrderDetail.ts

import { useState, useCallback } from "react";
import { ordersAPI } from "../services/api";
import type { ApiOrder } from "./useOrders";

interface UseOrderDetailState {
  order: ApiOrder | null;
  loading: boolean;
  error: string | null;
}

export function useOrderDetail() {
  const [state, setState] = useState<UseOrderDetailState>({
    order: null,
    loading: false,
    error: null,
  });

  // GET /api/orders/:id
  // Backend returns { success, order: { ... } }
  const fetchOrder = useCallback(async (id: string) => {
    setState({ order: null, loading: true, error: null });
    try {
      const res = await ordersAPI.getById(id);
      const body = res.data as any;
      // Backend wraps single order under "order" key (not "data")
      setState({
        order: body?.order ?? body?.data ?? null,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setState({
        order: null,
        loading: false,
        error: err?.response?.data?.message ?? "Failed to load order",
      });
    }
  }, []);

  const clear = useCallback(() => {
    setState({ order: null, loading: false, error: null });
  }, []);

  // ── Update delivery info — PATCH /api/orders/:id/delivery ─
  const updateDelivery = useCallback(
    async (
      orderId: string,
      deliveryStatus: string,
      trackingNumber?: string,
    ) => {
      try {
        const res = await ordersAPI.updateDelivery(
          orderId,
          deliveryStatus,
          trackingNumber,
        );
        const body = res.data as any;
        // Update local order if loaded
        setState((prev) =>
          prev.order
            ? {
                ...prev,
                order: {
                  ...prev.order,
                  trackingNumber:
                    body?.data?.trackingNumber ?? prev.order.trackingNumber,
                },
              }
            : prev,
        );
        return true;
      } catch (err: any) {
        console.error("Delivery update failed:", err?.response?.data?.message);
        return false;
      }
    },
    [],
  );

  // ── Fulfill order — POST /api/orders/:id/fulfill ──────────
  // Assigns courier (+ optional rider) and marks as Shipped.
  const fulfill = useCallback(
    async (
      orderId: string,
      courierId: string,
      riderId?: string,
      notes?: string,
    ) => {
      try {
        await ordersAPI.fulfill(orderId, {
          courier: courierId,
          ...(riderId ? { rider: riderId } : {}),
          ...(notes ? { notes } : {}),
        });
        setState((prev) =>
          prev.order
            ? { ...prev, order: { ...prev.order, orderStatus: "Shipped" } }
            : prev,
        );
        return true;
      } catch (err: any) {
        console.error("Fulfill failed:", err?.response?.data?.message);
        return false;
      }
    },
    [],
  );

  return { ...state, fetchOrder, clear, updateDelivery, fulfill };
}
