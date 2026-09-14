// ─── pages/Dashboard/Dashboard.tsx ───────────────────────────

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatCardsRow from "../../components/dashboard/StatCardsRow";
import WeeklyOrdersChart from "../../components/dashboard/WeeklyOrdersChart";
import ActivityFeed from "../../components/dashboard/ActivityFeed";
import TopProductsList from "../../components/dashboard/TopProductsList";
import RiderStatusList from "../../components/dashboard/RiderStatusList";
import FinancialSummary from "../../components/dashboard/FinancialSummary";
import RecentOrdersTable from "../../components/dashboard/RecentOrdersTable";
import CodStatusCard from "../../components/dashboard/CodStatusCard";
import IntegrationsSection from "../../components/dashboard/IntegrationsSection";

import { useDashboard } from "../../hooks/useDashboard";
import {
  mapHeaderKpis,
  mapStatCards,
  mapWeekBars,
  mapWeekSummary, // ← new
  mapTopProducts,
  mapRiders,
  mapRecentOrders,
  mapCodRings,
  mapActivityItems,
} from "../../utils/dashboardMappers";

import {
  ECOMMERCE_INTEGRATIONS,
  COURIER_INTEGRATIONS,
  PAYMENT_INTEGRATIONS,
  COMMS_INTEGRATIONS,
} from "../../data/dashboardData";

// ─────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dateRange] = useState<{ from?: string; to?: string }>({});

  const {
    kpis,
    trends,
    riders,
    recentOrders,
    loadingKpis,
    loadingRiders,
    loadingOrders,
    errorKpis,
    refresh,
    lastRefreshed,
  } = useDashboard(dateRange);

  // ── Map API → UI ──────────────────────────────────────────
  const headerKpis = mapHeaderKpis(kpis);
  const statCards = mapStatCards(kpis);
  const weekBars = mapWeekBars(trends);
  const weekSummary = mapWeekSummary(kpis);
  const topProducts = mapTopProducts(kpis);
  const riderList = mapRiders(riders ?? []); // ✅ guard
  const recentOrdersMapped = mapRecentOrders(recentOrders ?? []); // ✅ guard
  const codRings = mapCodRings(kpis);
  const activityItems = mapActivityItems(kpis);

  const pendingCount = kpis?.orders?.pending ?? 0; // ✅ double optional chain
  const lowStockCount = kpis?.inventory?.lowStockAlerts ?? 0; // ✅ double optional chain

  const sparkHeights = trends?.dailyRevenue?.length
    ? (() => {
        const revenues = trends.dailyRevenue.map((d) => d.revenue ?? 0); // ✅ guard undefined revenue
        const max = Math.max(...revenues, 1);
        return trends.dailyRevenue.slice(-10).map(
          (d) => Math.max(10, Math.round(((d.revenue ?? 0) / max) * 90)), // ✅ guard undefined revenue
        );
      })()
    : [30, 45, 60, 40, 70, 55, 80, 65, 50, 75];

  return (
    <div className="page-dashboard">
      <DashboardHeader
        kpis={headerKpis}
        onNewOrder={() => navigate("/orders?new=true")}
        onExport={() => navigate("/reports")}
      />

      {(pendingCount > 0 || lowStockCount > 0) && (
        <div className="d-mini-notice">
          <i className="fa-solid fa-triangle-exclamation" />
          <div className="d-mini-notice-text">
            {pendingCount > 0 && (
              <>
                <strong>{pendingCount} orders</strong> pending confirmation
                ·{" "}
              </>
            )}
            {lowStockCount > 0 && (
              <>
                <strong>{lowStockCount} products</strong> below low-stock
                threshold
              </>
            )}
          </div>
          <button className="d-btn sm" onClick={() => navigate("/orders")}>
            <i className="fa-solid fa-eye" /> View Orders
          </button>
        </div>
      )}

      {errorKpis && (
        <div
          className="d-mini-notice"
          style={{ borderColor: "var(--red)", background: "#FFF1F2" }}
        >
          <i
            className="fa-solid fa-circle-xmark"
            style={{ color: "var(--red)" }}
          />
          <div className="d-mini-notice-text" style={{ color: "var(--red)" }}>
            {errorKpis}
          </div>
          <button className="d-btn sm" onClick={refresh}>
            <i className="fa-solid fa-rotate-right" /> Retry
          </button>
        </div>
      )}

      {lastRefreshed && (
        <div
          style={{
            fontSize: "10px",
            color: "var(--text-faint)",
            textAlign: "right",
            marginBottom: "6px",
            paddingRight: "4px",
          }}
        >
          <i
            className="fa-solid fa-rotate-right"
            style={{ marginRight: "4px" }}
          />
          Last updated{" "}
          {lastRefreshed.toLocaleTimeString("en-PK", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          <button
            onClick={refresh}
            style={{
              marginLeft: "8px",
              background: "none",
              border: "none",
              color: "var(--accent)",
              cursor: "pointer",
              fontSize: "10px",
            }}
          >
            Refresh
          </button>
        </div>
      )}

      {loadingKpis ? (
        <div className="d-stats-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="d-stat" style={{ opacity: 0.35 }}>
              <div
                style={{
                  background: "var(--divider)",
                  borderRadius: 4,
                  height: 28,
                  width: 80,
                }}
              />
              <div
                style={{
                  background: "var(--divider)",
                  borderRadius: 4,
                  height: 12,
                  width: 60,
                  marginTop: 8,
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <StatCardsRow cards={statCards} />
      )}

      <div className="d-grid-2" style={{ marginBottom: "14px" }}>
        {/* Pass both bars (from trends) AND summary numbers (from kpis) */}
        <WeeklyOrdersChart bars={weekBars} summary={weekSummary} />
        <ActivityFeed
          items={
            activityItems.length
              ? activityItems
              : [
                  {
                    iconClass: loadingKpis
                      ? "fa-spinner fa-spin"
                      : "fa-circle-check",
                    iconBg: "var(--bg)",
                    iconColor: "var(--text-faint)",
                    title: loadingKpis
                      ? "Loading activity..."
                      : "All clear — no alerts",
                    meta: "",
                  },
                ]
          }
          onViewAll={() => navigate("/audit")}
        />
      </div>

      <div className="d-grid-3" style={{ marginBottom: "14px" }}>
        <TopProductsList
          products={topProducts}
          onViewAll={() => navigate("/products")}
        />
        <RiderStatusList
          riders={loadingRiders ? [] : riderList}
          onManage={() => navigate("/riders")}
        />
        <FinancialSummary
          codRings={codRings}
          sparkHeights={sparkHeights}
          onViewDetails={() => navigate("/finance")}
        />
      </div>

      <div className="d-grid-31" style={{ marginBottom: "14px" }}>
        <RecentOrdersTable
          orders={loadingOrders ? [] : recentOrdersMapped}
          pendingCount={pendingCount}
          onViewAll={() => navigate("/orders")}
          onRowClick={(id) => navigate(`/orders/${id}`)}
        />
        <CodStatusCard
          rings={codRings}
          onViewCouriers={() => navigate("/couriers")}
          onNewOrder={() => navigate("/orders?new=true")}
          onAddProduct={() => navigate("/products")}
          onLogCod={() => navigate("/finance")}
          onExportReport={() => navigate("/reports")}
        />
      </div>

      <IntegrationsSection
        ecommerce={ECOMMERCE_INTEGRATIONS}
        couriers={COURIER_INTEGRATIONS}
        payments={PAYMENT_INTEGRATIONS}
        comms={COMMS_INTEGRATIONS}
        onSettings={() => navigate("/settings")}
      />

      <div className="d-page-bottom" />
    </div>
  );
};

export default Dashboard;
