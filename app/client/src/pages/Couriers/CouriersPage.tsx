// CouriersPage.tsx
import React, { useState, useCallback } from "react";
import "./CouriersPage.css";
import TopLoadingBar from "../../components/ui/TopLoadingBar";
import { useTabLoading } from "../../hooks/useTabLoading";
import {
  NavPanel,
  ApiCourier,
  fmt,
  Badge,
  StarRating,
  PerfBar,
} from "./shared";
import OverviewPanel from "./OverviewPanel";
import CompaniesPanel from "./CompaniesPanel";
import ContactsPanel from "./ContactsPanel";
import ContractsPanel from "./ContractsPanel";
import ShipmentsPanel from "./ShipmentsPanel";
import PendingPanel from "./PendingPanel";
import InTransitPanel from "./InTransitPanel";
import DeliveredPanel from "./DeliveredPanel";
import ReturnsPanel from "./ReturnsPanel";
import FailedPanel from "./FailedPanel";
import TrackingPanel from "./TrackingPanel";
import APILogPanel from "./APILogPanel";
import PerformancePanel from "./PerformancePanel";
import CODPanel from "./CODPanel";
import ReportsPanel from "./ReportsPanel";
import SettingsPanel from "./SettingsPanel";
import RulesPanel from "./RulesPanel";
import ZonesPanel from "./ZonesPanel";

// ═══════════════════════════════════════════════════════════
// OVERLAY STATE TYPE
// ═══════════════════════════════════════════════════════════

interface OverlayState {
  open: boolean;
  title: string;
  content: React.ReactNode;
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════

const CouriersPage: React.FC = () => {
  const [activePanel, setActivePanel] = useState<NavPanel>("overview");
  const { isLoading, loadingProgress, switchTab } = useTabLoading(
    setActivePanel,
    activePanel,
  );
  const [overlay, setOverlay] = useState<OverlayState>({
    open: false,
    title: "",
    content: null,
  });
  const [editCourier, setEditCourier] = useState<ApiCourier | null>(null);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // 👈 NEW

  // Accepts ApiCourier (from backend) — all fields optional except _id & name
  const openCourierOverlay = useCallback(
    (c: ApiCourier) => {
      // Resolve display fields — handle both API shape and static shape merged via shared.tsx
      const code = c.code ?? c.name.slice(0, 3).toUpperCase();
      const coverage = c.coverage ?? c.serviceRegions?.join(", ") ?? "—";
      const city = c.city ?? c.serviceRegions?.[0] ?? "—";
      const contact = c.contactPerson ?? "—";
      const phone = c.phone ?? "—";
      const baseRate = c.baseRate != null ? `₨${c.baseRate}/kg` : "—";
      const codPct = c.codPct != null ? `${c.codPct}%` : "—";
      const codDays = c.codDays != null ? `${c.codDays} days` : "—";
      const outstanding = c.outstanding ?? 0;
      const avgDays: string | number = c.avgDays ?? "—";
      const successRate = c.successRate ?? parseFloat(c.completionRate ?? "0");
      const apiStatus = c.apiIntegrationEnabled
        ? (c.apiStatus ?? "live")
        : "Manual";
      const rating = c.rating ?? null;
      const status = c.status ?? "Active";

      setOverlay({
        open: true,
        title: c.name,
        content: (
          <div>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div
                className="row-avatar"
                style={{
                  width: 40,
                  height: 40,
                  fontSize: 12,
                  background: "var(--bg)",
                  flexShrink: 0,
                }}
              >
                {code}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{c.name}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  {coverage} Coverage · {city}
                </div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <Badge label={status} />
              </div>
            </div>

            {/* Details */}
            {(
              [
                ["Contact Person", contact],
                ["Phone", phone],
                ["Email", c.email ?? "—"],
                ["Base Rate", baseRate],
                ["COD Charge", codPct],
                ["COD Settlement", codDays],
                [
                  "COD Outstanding",
                  <span
                    style={{
                      color: outstanding > 0 ? "var(--red)" : "var(--green)",
                      fontWeight: 700,
                    }}
                  >
                    {fmt(outstanding)}
                  </span>,
                ],
                ["Avg. Delivery", `${avgDays}d`],
                ["Success Rate", <strong>{successRate}%</strong>],
                ["Active Shipments", c.activeShipments ?? "—"],
                ["In Transit", c.inTransit ?? "—"],
                ["API Status", <Badge label={apiStatus} />],
                ...(rating != null
                  ? [
                      ["Rating", <StarRating rating={rating} />] as [
                        string,
                        React.ReactNode,
                      ],
                    ]
                  : []),
              ] as [string, React.ReactNode][]
            ).map(([k, v], i) => (
              <div className="detail-row" key={i}>
                <div className="detail-key">{k}</div>
                <div className="detail-val">{v}</div>
              </div>
            ))}

            <hr />

            {/* Actions */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                className="c-btn primary"
                style={{ fontSize: 10 }}
                onClick={() => {
                  setEditCourier(c);
                  closeOverlay();
                  switchTab("companies");
                }}
              >
                <i className="fa-solid fa-pen" /> Edit
              </button>
              <button
                className="c-btn"
                style={{ fontSize: 10 }}
                onClick={() => {
                  closeOverlay();
                  switchTab("shipments");
                }}
              >
                <i className="fa-solid fa-truck" /> View Shipments
              </button>
              <button
                className="c-btn"
                style={{ fontSize: 10 }}
                onClick={() => {
                  closeOverlay();
                  switchTab("cod");
                }}
              >
                <i className="fa-solid fa-coins" /> COD
              </button>
              {c.apiIntegrationEnabled && (
                <button
                  className="c-btn"
                  style={{ fontSize: 10 }}
                  onClick={() => {
                    closeOverlay();
                    switchTab("apilog");
                  }}
                >
                  <i className="fa-solid fa-plug" /> API Log
                </button>
              )}
              <button
                className="c-btn"
                style={{
                  fontSize: 10,
                  color: status === "Paused" ? "var(--green)" : "var(--red)",
                }}
                disabled={pauseLoading}
                onClick={async () => {
                  setPauseLoading(true);
                  try {
                    const newStatus = status === "Paused" ? "Active" : "Paused";
                    const { couriersAPI } = await import("../../services/api");
                    await couriersAPI.update(c._id, { status: newStatus });
                    // Fresh fetch from backend
                    const fresh = await couriersAPI.getById(c._id);
                    const updated = fresh.data?.data ?? {
                      ...c,
                      status: newStatus,
                    };
                    openCourierOverlay(updated);
                  } catch {
                    alert("Failed to update courier status.");
                  } finally {
                    setPauseLoading(false);
                  }
                }}
              >
                <i
                  className={`fa-solid ${pauseLoading ? "fa-spinner fa-spin" : status === "Paused" ? "fa-play" : "fa-pause"}`}
                />
                {pauseLoading
                  ? "Updating…"
                  : status === "Paused"
                    ? "Activate"
                    : "Pause"}
              </button>
            </div>
          </div>
        ),
      });
    },
    [switchTab],
  );

  const closeOverlay = () => {
    setOverlay((v) => ({ ...v, open: false }));
    setRefreshTrigger((t) => t + 1); // 👈 NEW — tells CompaniesPanel to refresh
  };

  // ── NAV STRUCTURE ──────────────────────────────────────
  type NavEntry = {
    panel: NavPanel;
    icon: string;
    label: string;
    badge?: number | string;
    badgeGray?: boolean;
  };
  type NavSection = { heading: string; items: NavEntry[] };

  const navSections: NavSection[] = [
    {
      heading: "Overview",
      items: [{ panel: "overview", icon: "fa-gauge", label: "Overview" }],
    },
    {
      heading: "Couriers",
      items: [
        { panel: "companies", icon: "fa-building", label: "Courier Companies" },
        {
          panel: "contacts",
          icon: "fa-address-book",
          label: "Contacts & Rates",
        },
        {
          panel: "contracts",
          icon: "fa-file-contract",
          label: "Contracts & Terms",
        },
      ],
    },
    // {
    //   heading: "Shipments",
    //   items: [
    //     {
    //       panel: "shipments",
    //       icon: "fa-boxes-stacked",
    //       label: "All Shipments",
    //       // badge: 142,
    //     },
    //     {
    //       panel: "pending",
    //       icon: "fa-clock",
    //       label: "Pending Dispatch",
    //       // badge: 18,
    //     },
    //     {
    //       panel: "intransit",
    //       icon: "fa-truck-moving",
    //       label: "In Transit",
    //       // badge: 54,
    //     },
    //     {
    //       panel: "delivered",
    //       icon: "fa-circle-check",
    //       label: "Delivered",
    //       // badge: 68,
    //       badgeGray: true,
    //     },
    //     {
    //       panel: "returns",
    //       icon: "fa-rotate-left",
    //       label: "Returns / RTO",
    //       // badge: 6,
    //     },
    //     {
    //       panel: "failed",
    //       icon: "fa-circle-xmark",
    //       label: "Failed Delivery",
    //       // badge: 4,
    //     },
    //   ],
    // },
    // {
    //   heading: 'Tracking',
    //   items: [
    //     { panel: 'tracking', icon: 'fa-location-dot', label: 'Live Tracking' },
    //     { panel: 'apilog',   icon: 'fa-plug',         label: 'API Sync Log'  },
    //   ],
    // },
    // {
    //   heading: 'Analytics',
    //   items: [
    //     { panel: 'performance', icon: 'fa-chart-bar',         label: 'Performance'        },
    //     { panel: 'cod',         icon: 'fa-coins',             label: 'COD Reconciliation' },
    //     { panel: 'reports',     icon: 'fa-file-chart-column', label: 'Reports'            },
    //   ],
    // },
    // {
    //   heading: 'Configuration',
    //   items: [
    //     { panel: 'settings', icon: 'fa-gear',    label: 'Settings'         },
    //     { panel: 'rules',    icon: 'fa-sitemap', label: 'Assignment Rules' },
    //     { panel: 'zones',    icon: 'fa-map',     label: 'Zones & Coverage' },
    //   ],
    // },
  ];

  // ── PANEL ROUTER ──────────────────────────────────────
  const renderPanel = () => {
    switch (activePanel) {
      case "overview":
        return (
          <OverviewPanel
            onNav={(p) => switchTab(p)}
            onOpenOverlay={openCourierOverlay}
          />
        );
      case "companies":
        return (
          <CompaniesPanel
            onOpenOverlay={openCourierOverlay}
            initialEdit={editCourier}
            onEditConsumed={() => setEditCourier(null)}
            refreshTrigger={refreshTrigger}
          />
        );
      case "contacts":
        return <ContactsPanel />;
      case "contracts":
        return <ContractsPanel />;
      case "shipments":
        return <ShipmentsPanel />;
      case "pending":
        return <PendingPanel />;
      case "intransit":
        return <InTransitPanel />;
      case "delivered":
        return <DeliveredPanel />;
      case "returns":
        return <ReturnsPanel />;
      case "failed":
        return <FailedPanel />;
      case "tracking":
        return <TrackingPanel />;
      case "apilog":
        return <APILogPanel />;
      case "performance":
        return <PerformancePanel />;
      case "cod":
        return <CODPanel />;
      case "reports":
        return <ReportsPanel />;
      case "settings":
        return <SettingsPanel />;
      case "rules":
        return <RulesPanel />;
      case "zones":
        return <ZonesPanel />;
      default:
        return null;
    }
  };

  return (
    <div id="page-couriers">
      <TopLoadingBar progress={loadingProgress} isLoading={isLoading} />

      <div className="page-hero">
        <div className="page-hero-title">Courier Management</div>
        <div className="page-hero-sub">
          Manage courier partners, shipments, tracking, performance, and all
          delivery operations.
        </div>
      </div>

      <div className="courier-layout">
        {/* ── Vertical Nav ── */}
        <div className="vnav">
          {navSections.map((section) => (
            <React.Fragment key={section.heading}>
              <div className="vnav-section-label">{section.heading}</div>
              {section.items.map((item) => (
                <div
                  key={item.panel}
                  className={`vnav-item ${activePanel === item.panel ? "active" : ""}`}
                  onClick={() => switchTab(item.panel)}
                >
                  <i className={`fa-solid ${item.icon}`} />
                  {item.label}
                  {item.badge !== undefined && (
                    <span
                      className={`vnav-badge ${item.badgeGray ? "gray" : ""}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
              <div className="vnav-divider" />
            </React.Fragment>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="courier-content">{renderPanel()}</div>
      </div>

      {/* ── Overlay Backdrop ── */}
      <div
        className={`courier-backdrop ${overlay.open ? "open" : ""}`}
        onClick={closeOverlay}
      />

      {/* ── Overlay Panel ── */}
      <div className={`courier-overlay ${overlay.open ? "open" : ""}`}>
        <div className="overlay-header">
          <div className="overlay-title">{overlay.title}</div>
          <button className="close-btn" onClick={closeOverlay}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="overlay-body">{overlay.content}</div>
      </div>
    </div>
  );
};

export default CouriersPage;
