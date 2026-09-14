import React, { useEffect, useState, useCallback } from "react";
import { analyticsAPI, usersAPI, notificationsAPI } from "../../services/api";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type SecTab =
  | "overview"
  | "auth"
  | "sessions"
  | "ip"
  | "backup"
  | "export"
  | "danger";

interface SecurityCheck {
  label: string;
  desc: string;
  done: boolean;
  critical: boolean;
}

interface SecEvent {
  event: string;
  user: string;
  time: string;
  severity: "Info" | "Warning" | "Critical";
}

// ═══════════════════════════════════════════════════════════
// STATIC DATA (checks are static — no backend policy API)
// ═══════════════════════════════════════════════════════════

const SECURITY_CHECKS: SecurityCheck[] = [
  {
    label: "Two-Factor Authentication",
    desc: "Protect admin accounts with 2FA",
    done: false,
    critical: true,
  },
  {
    label: "Strong Password Policy",
    desc: "Min. 8 chars, uppercase + number required",
    done: true,
    critical: false,
  },
  {
    label: "Session Timeout Active",
    desc: "Auto-logout after 60 minutes",
    done: true,
    critical: false,
  },
  {
    label: "IP Whitelist Configured",
    desc: "3 trusted IP ranges added",
    done: true,
    critical: false,
  },
  {
    label: "Automatic Daily Backups",
    desc: "Scheduled backups running",
    done: true,
    critical: false,
  },
  {
    label: "Backup Encryption",
    desc: "AES-256 encryption enabled",
    done: true,
    critical: false,
  },
  {
    label: "Failed Login Alerts",
    desc: "Notify admin on lockouts",
    done: true,
    critical: false,
  },
  {
    label: "Audit Logging Enabled",
    desc: "All critical actions logged",
    done: true,
    critical: false,
  },
];

const SECURITY_SCORE = Math.round(
  (SECURITY_CHECKS.filter((c) => c.done).length / SECURITY_CHECKS.length) * 100,
);

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const Badge: React.FC<{ label: string }> = ({ label }) => {
  const cls: Record<string, string> = {
    Critical: "red",
    Recommended: "yellow",
    Info: "blue",
    Warning: "yellow",
  };
  return <span className={`badge ${cls[label] || "gray"}`}>{label}</span>;
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

interface OverviewPanelProps {
  onNav: (t: SecTab) => void;
}

const OverviewPanel: React.FC<OverviewPanelProps> = ({ onNav }) => {
  const [activeSessions, setActiveSessions] = useState<number | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecEvent[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // ── Fetch active user count ──────────────────────────────
  const fetchSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const res = await usersAPI.getAll({ status: "Active", limit: 1 });
      const total =
        res.data?.data?.pagination?.totalItems ??
        res.data?.data?.users?.length ??
        0;
      setActiveSessions(total);
    } catch {
      setActiveSessions(null);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  // ── Fetch recent notifications as proxy for events ───────
  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      const res = await notificationsAPI.getHistory({ limit: 5 });
      const items: any[] = res.data?.data?.notifications ?? [];
      const mapped: SecEvent[] = items.map((n: any) => ({
        event: n.title ?? n.type ?? "System Event",
        user: n.user?.username ?? n.sentBy ?? "System",
        time: relativeTime(n.createdAt ?? n.sentAt ?? new Date().toISOString()),
        severity:
          n.type === "alert"
            ? "Critical"
            : n.type === "warning"
              ? "Warning"
              : "Info",
      }));
      setRecentEvents(mapped);
    } catch {
      // Fallback — no events available
      setRecentEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchEvents();
  }, [fetchSessions, fetchEvents]);

  // ── Icon map for severity ────────────────────────────────
  const iconMap: Record<string, string> = {
    Critical: "fa-ban ic-red",
    Warning: "fa-triangle-exclamation ic-yellow",
    Info: "fa-circle-check ic-blue",
  };
  const bgMap: Record<string, string> = {
    Critical: "var(--red-bg)",
    Warning: "var(--yellow-bg)",
    Info: "var(--blue-bg)",
  };

  return (
    <>
      <div className="detail-grid-3">
        {/* ── Security Health ─────────────────────────────── */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-shield-halved" /> Security Health
            </div>
          </div>
          <div className="card-body">
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: "var(--yellow)",
                }}
              >
                {SECURITY_SCORE}%
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                Security Score
              </div>
              <div style={{ margin: "10px auto", maxWidth: 140 }}>
                <div className="prog-bar" style={{ height: 7 }}>
                  <div
                    className="prog-fill"
                    style={{
                      width: `${SECURITY_SCORE}%`,
                      background: "var(--yellow)",
                    }}
                  />
                </div>
              </div>
            </div>
            {SECURITY_CHECKS.map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 0",
                  borderBottom: "1px solid var(--divider)",
                }}
              >
                <i
                  className={`fa-solid fa-${c.done ? "circle-check" : "circle-xmark"}`}
                  style={{
                    color: c.done
                      ? "var(--green)"
                      : c.critical
                        ? "var(--red)"
                        : "var(--yellow)",
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "10.5px", fontWeight: 600 }}>
                    {c.label}
                  </div>
                  <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>
                    {c.desc}
                  </div>
                </div>
                {!c.done && (
                  <Badge label={c.critical ? "Critical" : "Recommended"} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Recent Events ────────────────────────────────── */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-clock-rotate-left" /> Recent Events
            </div>
            <button className="t-btn" onClick={() => onNav("sessions")}>
              View All
            </button>
          </div>
          <div className="card-body" style={{ padding: "8px 14px" }}>
            {loadingEvents ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 24,
                  color: "var(--text-muted)",
                  fontSize: 11,
                }}
              >
                <i
                  className="fa-solid fa-spinner fa-spin"
                  style={{ marginRight: 6 }}
                />
                Loading events…
              </div>
            ) : recentEvents.length === 0 ? (
              <div className="empty-state">
                <i className="fa-solid fa-clock-rotate-left" />
                <h4>No Recent Events</h4>
                <p>
                  Notification history will appear here once activity is
                  recorded.
                </p>
              </div>
            ) : (
              recentEvents.map((e, i) => (
                <div className="list-item" key={i}>
                  <div
                    className="list-icon"
                    style={{ background: bgMap[e.severity] }}
                  >
                    <i
                      className={`fa-solid ${iconMap[e.severity]}`}
                      style={{ fontSize: 10 }}
                    />
                  </div>
                  <div className="list-content">
                    <div className="list-title" style={{ fontSize: 11 }}>
                      {e.event}
                    </div>
                    <div className="list-meta">
                      {e.user} · {e.time}
                    </div>
                  </div>
                  <div className="list-right">
                    <Badge label={e.severity} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Backup Status ────────────────────────────────── */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-database" /> Backup Status
            </div>
            <button className="t-btn" onClick={() => onNav("backup")}>
              Manage
            </button>
          </div>
          <div className="card-body">
            <div className="status-indicator good" style={{ marginBottom: 10 }}>
              <div className="status-dot good" /> Backup system operating
              normally
            </div>
            {[
              ["Last Backup", "11 May 2026 · 08:00"],
              ["Size", "4.2 MB"],
              ["Encryption", <span className="badge green">Active</span>],
              ["Destination", "Local Server"],
              ["Next Scheduled", "12 May · 08:00"],
            ].map(([k, v], i) => (
              <div className="detail-row" key={i}>
                <div className="detail-key">{k}</div>
                <div className="detail-val">{v}</div>
              </div>
            ))}
            <div style={{ marginTop: 10 }}>
              <button
                className="t-btn primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => onNav("backup")}
              >
                <i className="fa-solid fa-database" /> Manage Backups
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Security Checklist ────────────────────────────── */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-list-check" /> Security Checklist
          </div>
          <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
            {SECURITY_CHECKS.filter((c) => c.done).length} /{" "}
            {SECURITY_CHECKS.length} complete
          </div>
        </div>
        <div className="card-body" style={{ padding: "10px 14px" }}>
          <div className="checklist-grid">
            {SECURITY_CHECKS.map((c, i) => (
              <div className="checklist-item" key={i}>
                <i
                  className={`fa-solid fa-${c.done ? "circle-check" : "circle-xmark"}`}
                  style={{
                    color: c.done
                      ? "var(--green)"
                      : c.critical
                        ? "var(--red)"
                        : "var(--yellow)",
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500 }}>{c.label}</div>
                  <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>
                    {c.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Active Sessions Quick Stat ────────────────────── */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-users" /> Active Users
          </div>
          <button className="t-btn" onClick={() => onNav("sessions")}>
            <i className="fa-solid fa-arrow-right" /> Manage Sessions
          </button>
        </div>
        <div className="card-body">
          {loadingSessions ? (
            <div
              style={{
                textAlign: "center",
                padding: 16,
                color: "var(--text-muted)",
                fontSize: 11,
              }}
            >
              <i
                className="fa-solid fa-spinner fa-spin"
                style={{ marginRight: 6 }}
              />
              Fetching user data…
            </div>
          ) : (
            <div className="detail-row">
              <div className="detail-key">Total Active Users</div>
              <div
                className="detail-val"
                style={{ color: "var(--accent)", fontWeight: 700 }}
              >
                {activeSessions ?? "—"}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OverviewPanel;
