import React, { useState } from "react";
import { AccessResult } from "./types";
import {
  STAFF_COLORS,
  ACCESS_DATA,
  ACTIVE_SESSIONS,
  SPARKLINE_DAYS,
  SPARKLINE_SUCCESS,
  SPARKLINE_FAILED,
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

const Pagination: React.FC<{
  page: number;
  total: number;
  perPage: number;
  onChange: (p: number) => void;
}> = ({ page, total, perPage, onChange }) => {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const start = total ? (page - 1) * perPage + 1 : 0;
  const end = Math.min(page * perPage, total);
  const nums: (number | "…")[] = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) nums.push(i);
  } else {
    nums.push(1);
    if (page > 3) nums.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++)
      nums.push(i);
    if (page < pages - 2) nums.push("…");
    nums.push(pages);
  }
  return (
    <div className="pagination">
      <div>
        Showing{" "}
        <strong>
          {start}–{end}
        </strong>{" "}
        of <strong>{total}</strong>
      </div>
      <div className="pag-controls">
        <button
          className="pag-btn"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          ‹
        </button>
        {nums.map((n, i) =>
          n === "…" ? (
            <button
              key={`d${i}`}
              className="pag-btn"
              style={{ pointerEvents: "none" }}
            >
              …
            </button>
          ) : (
            <button
              key={n}
              className={`pag-btn ${n === page ? "active" : ""}`}
              onClick={() => onChange(n as number)}
            >
              {n}
            </button>
          ),
        )}
        <button
          className="pag-btn"
          disabled={page === pages}
          onClick={() => onChange(page + 1)}
        >
          ›
        </button>
      </div>
    </div>
  );
};

// ── ACCESS TAB ────────────────────────────────────────────
type AccessFilter = "all" | "success" | "failed" | "suspicious";

const AccessTab: React.FC = () => {
  const [search, setSearch] = useState("");
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");
  const [page, setPage] = useState(1);

  const maxSparkline = Math.max(
    ...SPARKLINE_SUCCESS.map((s, i) => s + SPARKLINE_FAILED[i]),
  );

  const filtered = ACCESS_DATA.filter((d) => {
    if (accessFilter === "success" && d.result !== "Success") return false;
    if (accessFilter === "failed" && d.result !== "Blocked") return false;
    if (accessFilter === "suspicious" && d.result !== "Warning") return false;
    if (search) {
      const q = search.toLowerCase();
      return d.user.toLowerCase().includes(q) || d.ip.includes(q);
    }
    return true;
  });

  const pageItems = filtered.slice((page - 1) * 12, page * 12);

  return (
    <>
      <ComingSoon
        feature="Access & Logins"
        note="No GET /api/audit/access or /api/auth/sessions endpoint exists yet. Showing sample access log data."
      />

      <div className="detail-grid-2" style={{ marginBottom: 14 }}>
        {/* Login Sparkline */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-right-to-bracket ic-green" /> Login
              Activity — Last 7 Days
            </div>
          </div>
          <div className="card-body">
            <div className="spark-bar-wrap">
              {SPARKLINE_DAYS.map((_, i) => {
                const sH = Math.round(
                  (SPARKLINE_SUCCESS[i] / maxSparkline) * 100,
                );
                const fH = Math.max(
                  Math.round((SPARKLINE_FAILED[i] / maxSparkline) * 100),
                  SPARKLINE_FAILED[i] > 0 ? 4 : 0,
                );
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: 2,
                      height: "100%",
                    }}
                  >
                    <div
                      className="spark-bar"
                      style={{
                        width: "100%",
                        height: `${sH}%`,
                        background: "var(--green)",
                        minHeight: 2,
                        opacity: 0.85,
                      }}
                      title={`${SPARKLINE_SUCCESS[i]} successful`}
                    />
                    {SPARKLINE_FAILED[i] > 0 && (
                      <div
                        className="spark-bar"
                        style={{
                          width: "100%",
                          height: `${fH}%`,
                          background: "var(--red)",
                          minHeight: 2,
                          opacity: 0.85,
                        }}
                        title={`${SPARKLINE_FAILED[i]} failed`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="spark-labels">
              {SPARKLINE_DAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div
              style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 10 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: "var(--green)",
                  }}
                />{" "}
                Successful
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: "var(--red)",
                  }}
                />{" "}
                Failed
              </div>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-users ic-blue" /> Current Active
              Sessions
            </div>
          </div>
          <div className="card-body" style={{ padding: "8px 14px" }}>
            {ACTIVE_SESSIONS.map((s) => (
              <div className="list-item" key={s.user}>
                <div className="row-avatar" style={{ background: s.color }}>
                  {initials(s.user)}
                </div>
                <div className="list-content">
                  <div className="list-title">{s.user}</div>
                  <div className="list-meta">
                    {s.role} · {s.device} · Since {s.since}
                  </div>
                </div>
                <div className="list-right">
                  <code className="ref" style={{ fontSize: 9 }}>
                    {s.ip}
                  </code>
                  <div style={{ marginTop: 3 }}>
                    <span className="badge green" style={{ fontSize: 8.5 }}>
                      ● Online
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="toolbar-left">
            <div className="t-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder="Search user or IP..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {(["all", "success", "failed", "suspicious"] as AccessFilter[]).map(
              (f) => (
                <button
                  key={f}
                  className={`t-btn ${accessFilter === f ? "active" : ""}`}
                  style={
                    f === "success"
                      ? { color: "var(--green)" }
                      : f === "failed"
                        ? { color: "var(--red)" }
                        : f === "suspicious"
                          ? { color: "var(--accent)" }
                          : {}
                  }
                  onClick={() => {
                    setAccessFilter(f);
                    setPage(1);
                  }}
                >
                  {f === "all" ? (
                    "All"
                  ) : f === "success" ? (
                    <>
                      <i className="fa-solid fa-circle-check" /> Successful
                    </>
                  ) : f === "failed" ? (
                    <>
                      <i className="fa-solid fa-circle-xmark" /> Failed
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-triangle-exclamation" />{" "}
                      Suspicious
                    </>
                  )}
                </button>
              ),
            )}
          </div>
          <div className="toolbar-right">
            <button className="t-btn">
              <i className="fa-solid fa-file-export" /> Export
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Role</th>
                <th>Event</th>
                <th>IP Address</th>
                <th>Device / Browser</th>
                <th>Location</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((d, i) => {
                const isBlocked = d.result === "Blocked";
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
                      <div className="td-flex">
                        <AvatarEl name={d.user} />
                        <div style={{ fontWeight: 600, fontSize: 10.5 }}>
                          {d.user}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="tag">{d.role}</span>
                    </td>
                    <td style={{ fontSize: 11 }}>{d.event}</td>
                    <td>
                      <code
                        className="ref"
                        style={
                          isBlocked
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
                        color: isBadLoc
                          ? "var(--red)"
                          : "var(--text-secondary)",
                      }}
                    >
                      {d.location}
                    </td>
                    <td>
                      <ResultBadge r={d.result} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          total={filtered.length}
          perPage={12}
          onChange={setPage}
        />
      </div>
    </>
  );
};

export default AccessTab;
