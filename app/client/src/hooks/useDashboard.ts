// ─── hooks/useDashboard.ts ────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import {
  analyticsAPI,
  ridersAPI,
  ordersAPI,
  integrationsAPI,
  notificationsAPI,
} from "../services/api";

// ── Types ─────────────────────────────────────────────────────

export interface DashboardKpis {
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    delivered: number;
    cancelled: number;
    returned: number;
    fulfillmentRate: string;
    codOrders: number;
    prepaidOrders: number;
  };
  revenue: {
    total: string;
    avgOrderValue: string;
    totalDiscount: string;
    paid: string;
    pending: string;
    netRevenue: string;
  };
  inventory: {
    totalVariants: number;
    totalStockUnits: number;
    totalInventoryValue: string;
    lowStockAlerts: number;
    outOfStock: number;
  };
  customers: {
    total: number;
    vip: number;
    new: number;
    inactive: number;
  };
  expenses: {
    total: string;
    count: number;
    avg: string;
  };
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  topSellingProducts: Array<{
    _id: string;
    name: string;
    sku: string;
    totalQty: number;
    totalRevenue: number;
  }>;
  generatedAt: string;
  period: { from: string | null; to: string | null };
}

export interface DashboardTrends {
  growth: {
    orders: {
      current: number;
      previous: number;
      growthRate: string;
      trend: string;
    };
    revenue: {
      current: string;
      previous: string;
      growthRate: string;
      trend: string;
    };
    avgOrderValue: {
      current: string;
      previous: string;
      growthRate: string;
      trend: string;
    };
  };
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>;
  forecast: { next7DaysEstimate: string; dailyAverage: string };
}

export interface LiveRider {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
  isAvailable: boolean;
  assignedLocation?: string;
  currentOrder?: { orderId: string };
}

export interface LiveOrder {
  _id: string;
  orderNumber: string;
  customer: { firstName: string; lastName: string };
  items: Array<{ quantity: number }>;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export interface IntegrationStatus {
  shopify: { connected: boolean; shopName?: string; pendingOrders?: number };
  aftership: {
    connected: boolean;
    activeShipments?: number;
    courierCount?: number;
  };
  checkedAt: string;
}

// ── State shape ───────────────────────────────────────────────

export interface DashboardState {
  kpis: DashboardKpis | null;
  trends: DashboardTrends | null;
  riders: LiveRider[];
  recentOrders: LiveOrder[];
  integrations: IntegrationStatus | null;
  unreadCount: number;
  loadingKpis: boolean;
  loadingTrends: boolean;
  loadingRiders: boolean;
  loadingOrders: boolean;
  loadingIntegrations: boolean;
  errorKpis: string | null;
  errorTrends: string | null;
  errorRiders: string | null;
  errorOrders: string | null;
  lastRefreshed: Date | null;
}

const initialState: DashboardState = {
  kpis: null,
  trends: null,
  riders: [],
  recentOrders: [],
  integrations: null,
  unreadCount: 0,
  loadingKpis: true,
  loadingTrends: true,
  loadingRiders: true,
  loadingOrders: true,
  loadingIntegrations: true,
  errorKpis: null,
  errorTrends: null,
  errorRiders: null,
  errorOrders: null,
  lastRefreshed: null,
};

// ── Hook ──────────────────────────────────────────────────────

export function useDashboard(dateRange?: { from?: string; to?: string }) {
  const [state, setState] = useState<DashboardState>(initialState);

  // Each fetch updates ONLY its own slice of state — no spread of stale state
  const fetchKpis = useCallback(async () => {
    setState((prev) => ({ ...prev, loadingKpis: true, errorKpis: null }));
    try {
      const params = dateRange?.from
        ? { from: dateRange.from, to: dateRange.to }
        : undefined;
      const res = await analyticsAPI.getDashboard(params);
      setState((prev) => ({
        ...prev,
        kpis: res.data.data as DashboardKpis,
        loadingKpis: false,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        errorKpis: err?.response?.data?.message ?? "Failed to load KPIs",
        loadingKpis: false,
      }));
    }
  }, [dateRange?.from, dateRange?.to]);

  const fetchTrends = useCallback(async () => {
    setState((prev) => ({ ...prev, loadingTrends: true, errorTrends: null }));
    try {
      const res = await analyticsAPI.getTrends();
      setState((prev) => ({
        ...prev,
        trends: res.data.data as DashboardTrends,
        loadingTrends: false,
      }));
    } catch (err: any) {
      // fallback: try getSales for the chart bars at minimum
      try {
        const res2 = await analyticsAPI.getSales({ groupBy: "day" });
        const timeline = (res2.data as any).data?.timeline ?? [];
        setState((prev) => ({
          ...prev,
          trends: {
            growth: {
              orders: {
                current: 0,
                previous: 0,
                growthRate: "0",
                trend: "neutral",
              },
              revenue: {
                current: "0",
                previous: "0",
                growthRate: "0",
                trend: "neutral",
              },
              avgOrderValue: {
                current: "0",
                previous: "0",
                growthRate: "0",
                trend: "neutral",
              },
            },
            dailyRevenue: timeline.map((t: any) => ({
              date: t.date,
              revenue: t.revenue ?? 0,
              orders: t.orders ?? 0,
            })),
            forecast: { next7DaysEstimate: "0", dailyAverage: "0" },
          },
          loadingTrends: false,
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          errorTrends: err?.response?.data?.message ?? "Failed to load trends",
          loadingTrends: false,
        }));
      }
    }
  }, [dateRange?.from, dateRange?.to]);

  const fetchRiders = useCallback(async () => {
    setState((prev) => ({ ...prev, loadingRiders: true, errorRiders: null }));
    try {
      const res = await ridersAPI.getAll({ limit: 10 });
      setState((prev) => ({
        ...prev,
        riders: (res.data as any).data?.riders ?? [],
        loadingRiders: false,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        errorRiders: err?.response?.data?.message ?? "Failed to load riders",
        loadingRiders: false,
      }));
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setState((prev) => ({ ...prev, loadingOrders: true, errorOrders: null }));
    try {
      const res = await ordersAPI.getAll({ limit: 8, page: 1 });
      setState((prev) => ({
        ...prev,
        recentOrders: (res.data as any).data?.orders ?? [],
        loadingOrders: false,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        errorOrders: err?.response?.data?.message ?? "Failed to load orders",
        loadingOrders: false,
      }));
    }
  }, []);

  const fetchIntegrations = useCallback(async () => {
    setState((prev) => ({ ...prev, loadingIntegrations: true }));
    try {
      const res = await integrationsAPI.getStatus();
      setState((prev) => ({
        ...prev,
        integrations: (res.data as any).data ?? null,
        loadingIntegrations: false,
      }));
    } catch {
      // Non-critical — show disconnected, don't break the page
      setState((prev) => ({
        ...prev,
        integrations: {
          shopify: { connected: false },
          aftership: { connected: false },
          checkedAt: new Date().toISOString(),
        },
        loadingIntegrations: false,
      }));
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      setState((prev) => ({
        ...prev,
        unreadCount: (res.data as any).data?.count ?? 0,
      }));
    } catch {
      // Silent fail
    }
  }, []);

  const refresh = useCallback(async () => {
    // Fire all in parallel — each updates its own state slice independently
    await Promise.all([
      fetchKpis(),
      fetchTrends(),
      fetchRiders(),
      fetchOrders(),
      fetchIntegrations(),
      fetchUnreadCount(),
    ]);
    setState((prev) => ({ ...prev, lastRefreshed: new Date() }));
  }, [
    fetchKpis,
    fetchTrends,
    fetchRiders,
    fetchOrders,
    fetchIntegrations,
    fetchUnreadCount,
  ]);

  useEffect(() => {
    refresh();
  }, [dateRange?.from, dateRange?.to]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, refresh };
}
