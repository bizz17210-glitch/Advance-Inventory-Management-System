import React, { useState } from "react";
import "./AuditPage.css";

import { AuditTab } from "./types";
import AllLogsTab from "./AllLogsTab";
import SecurityTab from "./SecurityTab";
import DataChangesTab from "./DataChangesTab";
import AccessTab from "./AccessTab";
import ExportsTab from "./ExportsTab";
import AnalyticsTab from "./AnalyticsTab";
import SettingsTab from "./SettingsTab";

// ── TAB CONFIG ────────────────────────────────────────────
const TABS: { id: AuditTab; label: string; badge?: React.ReactNode }[] = [
  { id: "all", label: "All Logs" },
  {
    id: "security",
    label: "Security",
    badge: <span className="tab-badge-red">3</span>,
  },
  { id: "data", label: "Data Changes" },
  { id: "access", label: "Access & Logins" },
  { id: "exports", label: "Exports" },
  { id: "analytics", label: "Analytics" },
  { id: "settings", label: "Settings" },
];

// ── PAGE ──────────────────────────────────────────────────
const AuditPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AuditTab>("all");

  return (
    <div id="page-audit">
      {/* Hero */}
      <div className="page-hero">
        <div className="page-hero-title">Audit Logs</div>
        <div className="page-hero-sub">
          Complete record of all system actions performed by staff — logins,
          data changes, exports, and critical events. Retained for 90 days.
        </div>
      </div>

      {/* Coming Soon Notice — no /api/audit/* backend yet */}
      <div className="alert-strip info" style={{ marginBottom: 14 }}>
        <i className="fa-solid fa-circle-info" />
        <div>
          <strong>Audit Logs module — Coming Soon.</strong> This module is not
          yet connected to the backend (no audit log API endpoints exist yet).
          Everything below is shown using sample data for preview purposes only.
        </div>
      </div>

      {/* Alert Strip */}
      <div className="alert-strip danger">
        <i className="fa-solid fa-shield-exclamation" />
        <div>
          <strong>3 critical security events</strong> logged in the last 24
          hours — failed logins and a suspicious IP attempt.{" "}
          <strong>1 IP has been auto-blocked.</strong>
        </div>
        <button
          className="t-btn"
          style={{ marginLeft: "auto" }}
          onClick={() => setActiveTab("security")}
        >
          <i className="fa-solid fa-eye" /> View Security Events
        </button>
      </div>

      {/* Mini Stats */}
      <div className="mini-stats">
        <div className="mini-stat">
          <div className="ms-label">Total Events (24h)</div>
          <div className="ms-value">348</div>
          <div className="ms-trend up">
            <i className="fa-solid fa-arrow-trend-up" /> +22% vs yesterday
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Critical Events</div>
          <div className="ms-value" style={{ color: "var(--red)" }}>
            3
          </div>
          <div className="ms-trend down">
            <i className="fa-solid fa-triangle-exclamation" /> Requires
            attention
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Active Users (Today)</div>
          <div className="ms-value">9</div>
          <div className="ms-trend">
            <i className="fa-solid fa-users" /> Across 7 roles
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Log Retention</div>
          <div className="ms-value" style={{ fontSize: 14 }}>
            90 days
          </div>
          <div className="ms-trend">
            <i className="fa-solid fa-database" /> 4,820 total records
          </div>
        </div>
      </div>

      {/* Inner Tabs */}
      <div className="inner-tabs">
        {TABS.map((t) => (
          <div
            key={t.id}
            className={`itab ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label} {t.badge}
          </div>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === "all" && <AllLogsTab />}
      {activeTab === "security" && <SecurityTab />}
      {activeTab === "data" && <DataChangesTab />}
      {activeTab === "access" && <AccessTab />}
      {activeTab === "exports" && <ExportsTab />}
      {activeTab === "analytics" && <AnalyticsTab />}
      {activeTab === "settings" && <SettingsTab />}
    </div>
  );
};

export default AuditPage;
