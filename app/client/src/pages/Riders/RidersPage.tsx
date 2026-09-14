// RidersPage.tsx
import React, { useState, useCallback } from "react";
import "./RidersPage.css";
import TopLoadingBar from "../../components/ui/TopLoadingBar";
import { useTabLoading } from "../../hooks/useTabLoading";

import {
  NavPanel,
  Rider,
  ApiRider,
  RIDERS,
  fmt,
  rColor,
  avatarColor,
  initials,
  Badge,
  RiderAvatar,
  ApiRiderAvatar,
  riderStatusLabel,
} from "./shared";

import OverviewPanel from "./OverviewPanel";
import AllRidersPanel from "./AllRidersPanel";
import AddRiderPanel from "./AddRiderPanel";
import EditRiderPanel from "./EditRiderPanel";
import AvailabilityPanel from "./AvailabilityPanel";
import ActiveDeliveriesPanel from "./ActiveDeliveriesPanel";
import AssignTasksPanel from "./AssignTasksPanel";
import CompletedPanel from "./CompletedPanel";
import FailedDeliveriesPanel from "./FailedDeliveriesPanel";
import LiveMapPanel from "./LiveMapPanel";
import RouteHistoryPanel from "./RouteHistoryPanel";
import PerformancePanel from "./PerformancePanel";
import EarningsPanel from "./EarningsPanel";
import ReportsPanel from "./ReportsPanel";
import IntegrationsPanel from "./IntegrationsPanel";
import SettingsPanel from "./SettingsPanel";
import ZonesPanel from "./ZonesPanel";

// ═══════════════════════════════════════════════════════════
// CREDENTIAL COPY HELPER
// ═══════════════════════════════════════════════════════════

const CredentialRow: React.FC<{
  label: string;
  value: string;
  secret?: boolean;
}> = ({ label, value, secret = false }) => {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(!secret);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 0",
        borderBottom: "1px solid var(--divider)",
      }}
    >
      <div
        style={{
          width: 72,
          fontSize: 10,
          color: "var(--text-muted)",
          flexShrink: 0,
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          fontFamily: "monospace",
          fontSize: 11,
          color: "var(--text-primary)",
          wordBreak: "break-all",
          filter: secret && !visible ? "blur(4px)" : "none",
          userSelect: secret && !visible ? "none" : "text",
          transition: "filter 0.2s",
        }}
      >
        {value || "—"}
      </div>
      {secret && (
        <button
          className="c-btn"
          style={{ height: 22, fontSize: 9.5, padding: "0 6px" }}
          title={visible ? "Hide" : "Show"}
          onClick={() => setVisible((v) => !v)}
        >
          <i className={`fa-solid fa-eye${visible ? "-slash" : ""}`} />
        </button>
      )}
      <button
        className="c-btn"
        style={{
          height: 22,
          fontSize: 9.5,
          padding: "0 6px",
          color: copied ? "var(--green)" : undefined,
          minWidth: 52,
        }}
        onClick={handleCopy}
        title="Copy"
      >
        {copied ? (
          <>
            <i className="fa-solid fa-check" /> Copied
          </>
        ) : (
          <>
            <i className="fa-solid fa-copy" /> Copy
          </>
        )}
      </button>
    </div>
  );
};

const CopyAllButton: React.FC<{ creds: ApiRider["loginCredentials"] }> = ({
  creds,
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopyAll = () => {
    const text = `Rider Login Credentials\nEmail: ${creds?.email || "—"}\nUsername: ${creds?.username || "—"}\nPassword: ${creds?.password || "—"}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      className="c-btn"
      style={{
        fontSize: 10,
        color: copied ? "var(--green)" : undefined,
        marginTop: 6,
      }}
      onClick={handleCopyAll}
    >
      {copied ? (
        <>
          <i className="fa-solid fa-check" /> All Copied!
        </>
      ) : (
        <>
          <i className="fa-solid fa-copy" /> Copy All Credentials
        </>
      )}
    </button>
  );
};

// ═══════════════════════════════════════════════════════════
// OVERLAY STATE
// ═══════════════════════════════════════════════════════════

interface OverlayState {
  open: boolean;
  title: string;
  content: React.ReactNode;
}

interface EditState {
  open: boolean;
  rider: ApiRider | null;
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════

const RidersPage: React.FC = () => {
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
  const [editState, setEditState] = useState<EditState>({
    open: false,
    rider: null,
  });

  // ── Rider detail overlay ──────────────────────────────
  const openRiderOverlay = useCallback((r: ApiRider) => {
    const metrics = r.performanceMetrics;
    const completionRate =
      r.completionRate ??
      r.recentPerformance?.last30Days?.completionRate ??
      "—";

    const creds = r.loginCredentials;
    const hasCredentials =
      creds && (creds.email || creds.password || creds.username);

    setOverlay({
      open: true,
      title: r.fullName,
      content: (
        <div>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <ApiRiderAvatar rider={r} size={44} fontSize={14} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{r.fullName}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                {r.assignedZone ?? "—"} · {r.vehicle?.type ?? "—"} ·{" "}
                {r.vehicle?.registrationNumber ?? "—"}
              </div>
            </div>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                alignItems: "flex-end",
              }}
            >
              <Badge label={riderStatusLabel(r.status)} />
              <Badge label={r.isAvailable ? "Online" : "Offline"} />
            </div>
          </div>

          {/* Key stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
              marginBottom: 14,
            }}
          >
            {[
              {
                val: metrics?.totalDeliveries ?? r.activeDeliveries ?? "—",
                lbl: "MTD Deliveries",
                color: "var(--text-primary)",
              },
              {
                val: completionRate,
                lbl: "Completion",
                color: "var(--accent)",
              },
              { val: "—", lbl: "Rating ★", color: "var(--yellow)" },
            ].map((s) => (
              <div
                key={s.lbl}
                style={{
                  background: "var(--bg)",
                  borderRadius: 6,
                  padding: 8,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>
                  {s.val}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  {s.lbl}
                </div>
              </div>
            ))}
          </div>

          {/* Detail rows */}
          {(
            [
              ["Phone", r.phone],
              ["CNIC", r.cnic ?? "—"],
              [
                "Vehicle",
                `${r.vehicle?.type ?? "—"} · ${r.vehicle?.registrationNumber ?? "—"}`,
              ],
              ["Zone", r.assignedZone ?? "—"],
              ["License Status", r.licenseStatus ?? "—"],
              [
                "Avg. Delivery Time",
                r.recentPerformance?.last30Days?.avgDeliveryHours ?? "—",
              ],
              ["Payment Method", r.paymentMethod ?? "—"],
              ["Bank", r.bankDetails?.bankName ?? "—"],
              [
                "Join Date",
                r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—",
              ],
            ] as [string, React.ReactNode][]
          ).map(([k, v], i) => (
            <div className="detail-row" key={i}>
              <div className="detail-key">{k}</div>
              <div className="detail-val">{v}</div>
            </div>
          ))}

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--divider)",
              margin: "12px 0",
            }}
          />

          {/* 🔐 Login Credentials Section */}
          {hasCredentials ? (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <i
                  className="fa-solid fa-key"
                  style={{ color: "var(--yellow)", fontSize: 11 }}
                />
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  Login Credentials
                </div>
                {creds?.sharedWithRider && (
                  <span
                    className="badge green"
                    style={{ fontSize: 9, marginLeft: "auto" }}
                  >
                    Shared with Rider
                  </span>
                )}
                {!creds?.sharedWithRider && (
                  <span
                    className="badge yellow"
                    style={{ fontSize: 9, marginLeft: "auto" }}
                  >
                    Not Shared Yet
                  </span>
                )}
              </div>

              <div
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "6px 10px",
                }}
              >
                {creds?.email && (
                  <CredentialRow label="Email" value={creds.email} />
                )}
                {creds?.username && (
                  <CredentialRow label="Username" value={creds.username} />
                )}
                {creds?.password && (
                  <CredentialRow
                    label="Password"
                    value={creds.password}
                    secret
                  />
                )}
                {creds?.generatedAt && (
                  <div
                    style={{
                      fontSize: 9,
                      color: "var(--text-muted)",
                      marginTop: 6,
                    }}
                  >
                    <i
                      className="fa-solid fa-clock"
                      style={{ marginRight: 4 }}
                    />
                    Generated: {new Date(creds.generatedAt).toLocaleString()}
                  </div>
                )}
              </div>

              <CopyAllButton creds={creds} />

              <div
                style={{
                  fontSize: 9,
                  color: "var(--text-muted)",
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <i
                  className="fa-solid fa-triangle-exclamation"
                  style={{ color: "var(--orange)" }}
                />
                Share credentials with rider and ask them to change password on
                first login.
              </div>
            </div>
          ) : (
            <div
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 0",
              }}
            >
              <i className="fa-solid fa-lock" />
              No credentials on record for this rider.
            </div>
          )}

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--divider)",
              margin: "12px 0",
            }}
          />

          {/* Actions */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              className="c-btn primary"
              style={{ fontSize: 10 }}
              onClick={() => {
                closeOverlay();
                setEditState({ open: true, rider: r });
              }}
            >
              <i className="fa-solid fa-pen" /> Edit
            </button>
            <button className="c-btn" style={{ fontSize: 10 }}>
              <i className="fa-solid fa-clipboard-list" /> View Tasks
            </button>
            <button className="c-btn" style={{ fontSize: 10 }}>
              <i className="fa-solid fa-coins" /> Pay Now
            </button>
            <button
              className="c-btn"
              style={{
                fontSize: 10,
                color: r.status === "Active" ? "var(--red)" : "var(--green)",
              }}
            >
              <i
                className={`fa-solid fa-${r.status === "Active" ? "pause" : "play"}`}
              />
              {r.status === "Active" ? " Deactivate" : " Activate"}
            </button>
          </div>
        </div>
      ),
    });
  }, []);

  const closeOverlay = () => setOverlay((v) => ({ ...v, open: false }));

  // ── Navigation structure ──────────────────────────────
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
      heading: "Riders",
      items: [
        { panel: "all", icon: "fa-person-biking", label: "All Riders" },
        { panel: "add", icon: "fa-user-plus", label: "Add Rider" },
        {
          panel: "availability",
          icon: "fa-calendar-check",
          label: "Availability",
        },
      ],
    },
    {
      heading: "Deliveries",
      items: [
        {
          panel: "active",
          icon: "fa-map-location-dot",
          label: "Active Deliveries",
          // badge: 8,
        },
        {
          panel: "assign",
          icon: "fa-clipboard-list",
          label: "Assign Tasks",
          // badge: 5,
        },
        {
          panel: "completed",
          icon: "fa-circle-check",
          label: "Completed",
          // badge: 34,
          badgeGray: true,
        },
        {
          panel: "failed-del",
          icon: "fa-circle-xmark",
          label: "Failed / RTO",
          // badge: 3,
        },
      ],
    },
  ];

  // ── Panel renderer ────────────────────────────────────
  const renderPanel = () => {
    if (editState.open && editState.rider) {
      return (
        <EditRiderPanel
          onNav={(p) => {
            setEditState({ open: false, rider: null });
            setActivePanel(p);
          }}
          rider={editState.rider}
          onSuccess={() => setEditState({ open: false, rider: null })}
        />
      );
    }
    switch (activePanel) {
      case "overview":
        return (
          <OverviewPanel
            onNav={setActivePanel}
            onOpenRider={openRiderOverlay}
          />
        );
      case "all":
        return (
          <AllRidersPanel
            onNav={setActivePanel}
            onOpenRider={openRiderOverlay}
          />
        );
      case "add":
        return <AddRiderPanel onNav={setActivePanel} />;
      case "availability":
        return <AvailabilityPanel />;
      case "active":
        return <ActiveDeliveriesPanel />;
      case "assign":
        return <AssignTasksPanel />;
      case "completed":
        return <CompletedPanel />;
      case "failed-del":
        return <FailedDeliveriesPanel />;
      case "livemap":
        return <LiveMapPanel />;
      case "routes":
        return <RouteHistoryPanel />;
      case "performance":
        return <PerformancePanel onOpenRider={openRiderOverlay} />;
      case "earnings":
        return <EarningsPanel />;
      case "reports":
        return <ReportsPanel />;
      case "integrations":
        return <IntegrationsPanel />;
      case "settings":
        return <SettingsPanel />;
      case "zones":
        return <ZonesPanel />;
      default:
        return null;
    }
  };

  // ── Render ────────────────────────────────────────────
  return (
    <div id="page-riders">
      <TopLoadingBar progress={loadingProgress} isLoading={isLoading} />

      <div className="page-hero">
        <div className="page-hero-title">Rider Management</div>
        <div className="page-hero-sub">
          Manage internal delivery riders, assign deliveries, track live status,
          and monitor performance metrics.
        </div>
      </div>

      <div className="rider-layout">
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

        {/* ── Content Area ── */}
        <div className="rider-content">{renderPanel()}</div>
      </div>

      {/* ── Rider Detail Overlay ── */}
      <div
        className={`rider-backdrop ${overlay.open ? "open" : ""}`}
        onClick={closeOverlay}
      />
      <div className={`rider-overlay ${overlay.open ? "open" : ""}`}>
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

export default RidersPage;
