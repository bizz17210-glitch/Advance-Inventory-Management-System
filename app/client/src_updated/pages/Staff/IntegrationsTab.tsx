// ═══════════════════════════════════════════════════════════
// IntegrationsTab.tsx — Tab 5: Integrations & notifications
// ═══════════════════════════════════════════════════════════

import React, { useState } from "react";
import { IntegrationConfig } from "./staff.types";
import { INTEGRATIONS, NOTIF_TRIGGERS, NOTIF_CHANNELS } from "./staffData";

// ── Integration Card ───────────────────────────────────────
const IntegrationCard: React.FC<{ config: IntegrationConfig }> = ({
  config,
}) => {
  const [connected, setConnected] = useState(config.connected);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleConnect = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setConnected(true);
    }, 1500);
  };

  return (
    <div className="card integration-card">
      <div className="card-body" style={{ padding: 16 }}>
        {/* Card Top Row */}
        <div className="int-card-top">
          {!imgError ? (
            <img
              src={config.imgUrl}
              className="int-logo"
              onError={() => setImgError(true)}
              alt={config.name}
            />
          ) : (
            <div
              className="int-fallback-icon"
              style={{ background: config.fallbackBg }}
            >
              {config.fallbackChar}
            </div>
          )}
          <div className="int-info">
            <div className="int-name">{config.name}</div>
            <div className="int-sub">{config.sub}</div>
          </div>
          <span
            className={`badge ${connected ? "green" : "gray"}`}
            style={{ marginLeft: "auto" }}
          >
            {connected ? "Connected" : "Not Connected"}
          </span>
        </div>

        <div className="int-desc">{config.desc}</div>

        {/* Actions */}
        {connected ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="header-btn"
              style={{ flex: 1, justifyContent: "center" }}
            >
              <i className="fa-solid fa-gear" /> Configure
            </button>
            <button
              className="header-btn"
              style={{ color: "var(--red)", borderColor: "var(--red)" }}
              onClick={() => setConnected(false)}
            >
              <i className="fa-solid fa-unlink" /> Disconnect
            </button>
          </div>
        ) : (
          <button
            className="header-btn primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" /> Connecting…
              </>
            ) : (
              <>
                <i className={config.iconClass} /> Connect {config.name}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main Tab ───────────────────────────────────────────────
const IntegrationsTab: React.FC = () => (
  <>
    <div className="section-divider">
      <span>HR &amp; Team Collaboration Tools</span>
    </div>

    {/* Integration Cards Grid */}
    <div className="grid-3" style={{ marginBottom: 14 }}>
      {INTEGRATIONS.map((c) => (
        <IntegrationCard key={c.id} config={c} />
      ))}
    </div>

    <div className="section-divider">
      <span>Notification Preferences</span>
    </div>

    {/* Notification Settings */}
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <i className="fa-solid fa-bell" /> Integration Notification Settings
        </div>
      </div>
      <div className="card-body">
        <div className="grid-2">
          {/* Trigger Events */}
          <div>
            <div className="notif-section-label">Trigger Events</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {NOTIF_TRIGGERS.map((t) => (
                <label key={t.label} className="notif-check">
                  <input type="checkbox" defaultChecked={t.checked} /> {t.label}
                </label>
              ))}
            </div>
          </div>
          {/* Delivery Channels */}
          <div>
            <div className="notif-section-label">Delivery Channels</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {NOTIF_CHANNELS.map((c) => (
                <label key={c.label} className="notif-check">
                  <input type="checkbox" defaultChecked={c.checked} /> {c.label}
                </label>
              ))}
            </div>
          </div>
        </div>
        <hr />
        <button className="header-btn primary">
          <i className="fa-solid fa-check" /> Save Notification Settings
        </button>
      </div>
    </div>
  </>
);

export default IntegrationsTab;
