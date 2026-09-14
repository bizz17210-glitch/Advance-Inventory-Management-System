import React from "react";
import {
  MODULE_BREAKDOWN,
  STAFF_ACTIVITY_ANALYTICS,
  HOURLY_COUNTS,
  HOURLY_LABELS,
  TOP_ACTIONS,
  SEV_DATA,
} from "./auditData";
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
const ProgBar: React.FC<{ pct: number; color?: string }> = ({ pct, color }) => (
  <div className="audit-prog-bar">
    <div
      className="audit-prog-fill"
      style={{ width: `${pct}%`, background: color }}
    />
  </div>
);

// ── ANALYTICS TAB ─────────────────────────────────────────
const TOTAL = 348;

const AnalyticsTab: React.FC = () => {
  const maxMod = Math.max(...MODULE_BREAKDOWN.map((m) => m.count));
  const maxAct = STAFF_ACTIVITY_ANALYTICS[0].count;
  const maxHourly = Math.max(...HOURLY_COUNTS);
  const maxTop = TOP_ACTIONS[0].count;

  return (
    <>
      <ComingSoon
        feature="Audit Analytics"
        note="No GET /api/audit/analytics endpoint exists yet. analyticsAPI.getStaffPerformance could partially power 'Most Active Staff' once wired. Showing sample analytics data."
      />

      <div className="detail-grid-3" style={{ marginBottom: 14 }}>
        {/* Events by Module */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-chart-bar ic-orange" /> Events by Module
            </div>
          </div>
          <div className="card-body" style={{ padding: "10px 14px" }}>
            {MODULE_BREAKDOWN.map((m) => (
              <div
                key={m.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 70,
                    fontSize: 10.5,
                    color: "var(--text-muted)",
                    flexShrink: 0,
                  }}
                >
                  {m.name}
                </div>
                <ProgBar pct={(m.count / maxMod) * 100} color={m.color} />
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    width: 24,
                    textAlign: "right",
                  }}
                >
                  {m.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Events by Severity */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-chart-pie ic-orange" /> Events by
              Severity
            </div>
          </div>
          <div className="card-body" style={{ padding: "10px 14px" }}>
            {SEV_DATA.map((s) => (
              <div key={s.s} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: s.c,
                      }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{s.s}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>
                    {s.n}{" "}
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                      ({Math.round((s.n / TOTAL) * 100)}%)
                    </span>
                  </span>
                </div>
                <ProgBar pct={(s.n / TOTAL) * 100} color={s.c} />
              </div>
            ))}
            <div
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                marginTop: 6,
                paddingTop: 8,
                borderTop: "1px solid var(--divider)",
              }}
            >
              Total events today:{" "}
              <strong style={{ color: "var(--text-primary)" }}>{TOTAL}</strong>
            </div>
          </div>
        </div>

        {/* Most Active Staff */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-ranking-star ic-orange" /> Most Active
              Staff
            </div>
          </div>
          <div className="card-body" style={{ padding: "10px 14px" }}>
            {STAFF_ACTIVITY_ANALYTICS.map((s, i) => (
              <div
                key={s.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 16,
                    textAlign: "center",
                    fontSize: 10,
                    color: "var(--text-muted)",
                    fontWeight: 700,
                  }}
                >
                  {i + 1}
                </div>
                <div
                  className="row-avatar"
                  style={{
                    background: s.color,
                    width: 22,
                    height: 22,
                    fontSize: 9,
                    flexShrink: 0,
                  }}
                >
                  {initials(s.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontSize: 10.5, fontWeight: 500, marginBottom: 2 }}
                  >
                    {s.name.split(" ")[0]}
                  </div>
                  <ProgBar pct={(s.count / maxAct) * 100} color={s.color} />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    width: 24,
                    textAlign: "right",
                  }}
                >
                  {s.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly Chart */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-chart-line" /> Hourly Activity — 11 May
            2026
          </div>
          <div className="card-actions">
            <select
              className="form-select"
              style={{ height: 26, fontSize: 10.5 }}
            >
              <option>Today</option>
              <option>Yesterday</option>
              <option>Last 7 Days</option>
            </select>
          </div>
        </div>
        <div className="card-body">
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 4,
              height: 80,
              marginBottom: 6,
            }}
          >
            {HOURLY_COUNTS.map((c, i) => {
              const h = Math.max(4, Math.round((c / maxHourly) * 80));
              const color = c >= 40 ? "var(--accent)" : "var(--blue)";
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    height: 80,
                    cursor: "pointer",
                  }}
                  title={`${c} events at ${HOURLY_LABELS[i]}`}
                >
                  <div
                    style={{
                      fontSize: 8,
                      color: "var(--text-muted)",
                      marginBottom: 3,
                    }}
                  >
                    {c}
                  </div>
                  <div
                    className="hourly-bar"
                    style={{ width: "100%", height: h, background: color }}
                  />
                </div>
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 9,
              color: "var(--text-muted)",
            }}
          >
            {HOURLY_LABELS.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Two Cards */}
      <div className="detail-grid-2">
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-list-ol" /> Top Actions Today
            </div>
          </div>
          <div className="card-body" style={{ padding: "8px 14px" }}>
            {TOP_ACTIONS.map((a, i) => (
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
                <div
                  style={{
                    width: 16,
                    fontSize: 10,
                    color: "var(--text-muted)",
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontSize: 10.5, fontWeight: 500, marginBottom: 2 }}
                  >
                    {a.action}
                  </div>
                  <ProgBar pct={(a.count / maxTop) * 100} />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    width: 24,
                    textAlign: "right",
                  }}
                >
                  {a.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-clock-rotate-left" /> Audit Trail
              Summary
            </div>
          </div>
          <div className="card-body" style={{ padding: "8px 14px" }}>
            {(
              [
                ["Total Events (All Time)", "4,820", ""],
                ["Today's Events", "348", ""],
                ["This Week", "1,842", ""],
                ["Critical Events (30d)", "12", "var(--red)"],
                ["Data Deletions (30d)", "18", "var(--red)"],
                ["Export Requests (30d)", "28", ""],
                ["Failed Logins (30d)", "34", "var(--yellow)"],
                ["Oldest Log Entry", "01 Mar 2026", ""],
                ["Log Retention Period", "90 Days", ""],
                ["Storage Used", "2.8 MB", ""],
              ] as [string, string, string][]
            ).map(([k, v, c]) => (
              <div className="detail-row" key={k}>
                <div className="detail-key">{k}</div>
                <div className="detail-val" style={c ? { color: c } : {}}>
                  <strong>{v}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsTab;
