import React from "react";
import { Severity, AccessResult } from "./types";
import { STAFF_COLORS, SECURITY_DATA } from "./auditData";
import ComingSoon from "./ComingSoon";

// ── HELPERS ───────────────────────────────────────────────
const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

// ── SHARED UI ─────────────────────────────────────────────
const SevBadge: React.FC<{ s: Severity }> = ({ s }) => {
  const cls: Record<Severity, string> = {
    Critical: "red",
    Warning: "yellow",
    Info: "blue",
  };
  return <span className={`badge ${cls[s]}`}>{s}</span>;
};

const ResultBadge: React.FC<{ r: AccessResult }> = ({ r }) => {
  const cls: Record<AccessResult, string> = {
    Success: "green",
    Warning: "yellow",
    Blocked: "red",
    Completed: "green",
    Flagged: "orange",
    Allowed: "green",
    Noted: "gray",
  };
  return <span className={`badge ${cls[r]}`}>{r}</span>;
};

const AvatarEl: React.FC<{ name: string; size?: number }> = ({
  name,
  size = 26,
}) => {
  const color = STAFF_COLORS[name] ?? "#6B7280";
  const isUnknown = name === "Unknown";
  const isSystem = name === "System";
  return (
    <div
      className="row-avatar"
      style={{
        background: isUnknown ? "var(--red)" : color,
        width: size,
        height: size,
        fontSize: size * 0.38,
      }}
    >
      {isSystem ? "SY" : isUnknown ? "?" : initials(name)}
    </div>
  );
};

// ── SECURITY TAB ──────────────────────────────────────────
const SecurityTab: React.FC = () => (
  <>
    <ComingSoon
      feature="Security Events"
      note="No GET /api/audit/security or /api/security/events endpoint exists yet. Showing sample security events."
    />

    <div className="alert-strip danger" style={{ marginBottom: 14 }}>
      <i className="fa-solid fa-shield-exclamation" />
      <div>
        <strong>3 critical events</strong> in the last 24 hours. One IP (
        <code style={{ fontFamily: "monospace", fontSize: 9.5 }}>
          203.55.41.12
        </code>
        ) has been automatically blocked after 5 failed login attempts.
      </div>
    </div>

    <div
      className="mini-stats"
      style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 14 }}
    >
      <div className="mini-stat">
        <div className="ms-label">Failed Logins (24h)</div>
        <div className="ms-value" style={{ color: "var(--red)" }}>
          7
        </div>
        <div className="ms-trend down">
          <i className="fa-solid fa-circle-xmark" /> 3 from same IP
        </div>
      </div>
      <div className="mini-stat">
        <div className="ms-label">Blocked IPs</div>
        <div className="ms-value" style={{ color: "var(--accent)" }}>
          2
        </div>
        <div className="ms-trend">
          <i className="fa-solid fa-ban" /> 1 auto-blocked today
        </div>
      </div>
      <div className="mini-stat">
        <div className="ms-label">Permission Changes</div>
        <div className="ms-value" style={{ color: "var(--yellow)" }}>
          2
        </div>
        <div className="ms-trend">
          <i className="fa-solid fa-shield-halved" /> Role &amp; access edits
        </div>
      </div>
    </div>

    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <i className="fa-solid fa-shield-exclamation ic-red" /> Security Event
          Log
        </div>
        <button className="t-btn">
          <i className="fa-solid fa-file-export" /> Export
        </button>
      </div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event</th>
              <th>User / Actor</th>
              <th>IP Address</th>
              <th>Device</th>
              <th>Location</th>
              <th>Severity</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {SECURITY_DATA.map((d, i) => {
              const isBadIp =
                d.ip.includes("203.55") || d.ip.includes("185.220");
              const isBadLoc =
                d.location === "Unknown" || d.location.includes("VPN");
              return (
                <tr key={i}>
                  <td
                    style={{
                      fontSize: 10,
                      whiteSpace: "nowrap",
                      color: "var(--text-muted)",
                    }}
                  >
                    {d.ts}
                  </td>
                  <td>
                    <strong style={{ fontSize: 11.5 }}>{d.event}</strong>
                  </td>
                  <td>
                    <div className="td-flex">
                      <AvatarEl name={d.user} />
                      <span style={{ fontSize: 10.5 }}>{d.user}</span>
                    </div>
                  </td>
                  <td>
                    <code
                      className="ref"
                      style={
                        isBadIp
                          ? { color: "var(--red)", borderColor: "var(--red)" }
                          : {}
                      }
                    >
                      {d.ip}
                    </code>
                  </td>
                  <td style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    {d.device}
                  </td>
                  <td
                    style={{
                      fontSize: 10.5,
                      color: isBadLoc ? "var(--red)" : "var(--text-secondary)",
                    }}
                  >
                    {d.location}
                  </td>
                  <td>
                    <SevBadge s={d.severity} />
                  </td>
                  <td>
                    <ResultBadge r={d.outcome} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </>
);

export default SecurityTab;
