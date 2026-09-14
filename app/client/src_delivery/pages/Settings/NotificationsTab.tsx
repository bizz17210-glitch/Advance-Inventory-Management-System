// ═══════════════════════════════════════════════════════════
// NotificationsTab.tsx  —  Live preferences via /notifications/preferences
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from "react";
import { StgToggleRow } from "./SettingsShared";
import { notificationsAPI } from "../../services/api";

// ── Types ──────────────────────────────────────────────────

type NotifType =
  | "low_stock"
  | "order_update"
  | "task_assigned"
  | "report_ready"
  | "system_alert";

interface ChannelPref {
  inApp: boolean;
  email: boolean;
}

type PreferencesMap = Record<NotifType, ChannelPref>;

const DEFAULT_PREFS: PreferencesMap = {
  low_stock: { inApp: true, email: false },
  order_update: { inApp: true, email: true },
  task_assigned: { inApp: true, email: false },
  report_ready: { inApp: true, email: true },
  system_alert: { inApp: true, email: true },
};

const TYPE_LABELS: Record<NotifType, { label: string; desc?: string }> = {
  order_update: {
    label: "Order Updates",
    desc: "New, confirmed, dispatched, delivered, cancelled, returns",
  },
  low_stock: {
    label: "Low Stock Alerts",
    desc: "When stock falls below threshold or hits zero",
  },
  task_assigned: {
    label: "Task Assigned",
    desc: "When a new task is assigned to you",
  },
  report_ready: {
    label: "Report Ready",
    desc: "Scheduled or generated reports are available",
  },
  system_alert: {
    label: "System Alerts",
    desc: "Maintenance notices and broadcast announcements",
  },
};

// ── PrefRow ────────────────────────────────────────────────

interface PrefRowProps {
  type: NotifType;
  pref: ChannelPref;
  onToggle: (
    type: NotifType,
    channel: "inApp" | "email",
    value: boolean,
  ) => void;
}

const PrefRow: React.FC<PrefRowProps> = ({ type, pref, onToggle }) => {
  const meta = TYPE_LABELS[type];
  return (
    <div className="stg-row">
      <div>
        <div className="stg-key">{meta.label}</div>
        {meta.desc && <div className="stg-desc">{meta.desc}</div>}
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10.5,
            color: "var(--text-muted)",
          }}
        >
          In-app
          <input
            type="checkbox"
            checked={pref.inApp}
            onChange={(e) => onToggle(type, "inApp", e.target.checked)}
          />
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10.5,
            color: "var(--text-muted)",
          }}
        >
          Email
          <input
            type="checkbox"
            checked={pref.email}
            onChange={(e) => onToggle(type, "email", e.target.checked)}
          />
        </label>
      </div>
    </div>
  );
};

// ── NotificationsTab ───────────────────────────────────────

const NotificationsTab: React.FC = () => {
  const [preferences, setPreferences] = useState<PreferencesMap>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveDone, setSaveDone] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsAPI.getPreferences();
      const prefs = res.data?.data?.preferences ?? res.data?.preferences;
      if (prefs) {
        setPreferences((prev) => ({ ...prev, ...prefs }));
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.message || "Failed to load notification preferences",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleToggle = (
    type: NotifType,
    channel: "inApp" | "email",
    value: boolean,
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [type]: { ...prev[type], [channel]: value },
    }));
    setDirty(true);
    setSaveDone(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await notificationsAPI.updatePreferences({ preferences });
      setSaveDone(true);
      setDirty(false);
      setTimeout(() => setSaveDone(false), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="info-banner">
        <i className="fa-solid fa-circle-info" />
        <div className="info-banner-text">
          Notification preferences control which alerts you receive and through
          which channels (in-app or email). These apply to your account; admins
          can additionally send broadcasts and manage templates.
        </div>
      </div>

      {error && (
        <div
          className="info-banner"
          style={{ color: "var(--red)", marginBottom: 14 }}
        >
          <i className="fa-solid fa-circle-exclamation" />
          <div className="info-banner-text">
            {error}{" "}
            <button
              className="t-filter-btn"
              style={{ marginLeft: 8 }}
              onClick={fetchPreferences}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-bell" /> Notification Preferences
          </div>
          {!loading && (
            <button
              className="header-btn"
              onClick={fetchPreferences}
              title="Refresh"
            >
              <i className="fa-solid fa-rotate" />
            </button>
          )}
        </div>
        <div className="card-body" style={{ padding: "10px 14px" }}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="stg-row">
                  <div
                    style={{
                      height: 12,
                      background: "var(--divider)",
                      borderRadius: 4,
                      width: "40%",
                    }}
                  />
                  <div
                    style={{
                      height: 12,
                      background: "var(--divider)",
                      borderRadius: 4,
                      width: "20%",
                    }}
                  />
                </div>
              ))
            : (Object.keys(TYPE_LABELS) as NotifType[]).map((type) => (
                <PrefRow
                  key={type}
                  type={type}
                  pref={preferences[type] ?? DEFAULT_PREFS[type]}
                  onToggle={handleToggle}
                />
              ))}
          <hr />
          <button
            className="header-btn primary"
            onClick={handleSave}
            disabled={loading || saving || !dirty}
          >
            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" /> Saving...
              </>
            ) : saveDone ? (
              <>
                <i className="fa-solid fa-circle-check" /> Saved!
              </>
            ) : (
              <>
                <i className="fa-solid fa-check" /> Save Notification
                Preferences
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Static reference (not yet backed by an endpoint) ── */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-circle-info" /> System Notification Rules
          </div>
        </div>
        <div className="card-body" style={{ padding: "10px 14px" }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-secondary)",
              marginBottom: 8,
            }}
          >
            The following triggers are managed automatically by the system using
            the notification types above (order_update, low_stock, system_alert,
            etc.). Granular per-event toggles and threshold configuration are
            not yet exposed via an API and remain fixed for now.
          </div>
          <StgToggleRow
            label="New Order Created"
            desc="order_update"
            defaultChecked
          />
          <StgToggleRow
            label="Order Confirmed / Dispatched / Delivered / Cancelled"
            desc="order_update"
            defaultChecked
          />
          <StgToggleRow
            label="Low Stock / Out-of-Stock"
            desc="low_stock"
            defaultChecked
          />
          <StgToggleRow
            label="Task Assigned"
            desc="task_assigned"
            defaultChecked
          />
          <StgToggleRow
            label="Report Ready"
            desc="report_ready"
            defaultChecked
          />
          <StgToggleRow
            label="System Maintenance / Broadcasts"
            desc="system_alert"
            defaultChecked
          />
        </div>
      </div>
    </>
  );
};

export default NotificationsTab;
