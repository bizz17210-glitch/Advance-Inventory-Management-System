import React, { useState } from "react";
import { AccessResult } from "./types";
import { STAFF_COLORS, EXPORTS_DATA } from "./auditData";
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

// ── EXPORTS TAB ───────────────────────────────────────────
const EXPORT_TYPES = [
  "Sales Data",
  "Inventory Data",
  "Customer Data",
  "Financial Records",
  "Staff Report",
  "Audit Logs",
  "Full System Export",
];

const ExportsTab: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = EXPORTS_DATA.filter(
    (d) =>
      !search ||
      d.type.toLowerCase().includes(search.toLowerCase()) ||
      d.by.toLowerCase().includes(search.toLowerCase()),
  );

  const pageItems = filtered.slice((page - 1) * 10, page * 10);

  return (
    <>
      <ComingSoon
        feature="Exports Log"
        note="No GET /api/audit/exports endpoint exists yet. The analytics.exportReport endpoint exists but is not yet logged here. Showing sample export records."
      />

      <div className="alert-strip info">
        <i className="fa-solid fa-circle-info" />
        All data exports from the system are logged here. Each export captures
        who requested it, what data was included, and when it was downloaded.
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="toolbar-left">
            <div className="t-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder="Search export type or user..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              className="form-select"
              style={{ height: 27, fontSize: 10.5 }}
            >
              <option>All Export Types</option>
              {EXPORT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="toolbar-right">
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
              28 exports this month
            </span>
            <button className="t-btn">
              <i className="fa-solid fa-file-export" /> Export This Log
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Requested By</th>
                <th>Export Type</th>
                <th>Date Range</th>
                <th>Records</th>
                <th>Format</th>
                <th>File Size</th>
                <th>Contains Sensitive Data</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((d, i) => (
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
                      <AvatarEl name={d.by} />
                      <span style={{ fontSize: 10.5, fontWeight: 500 }}>
                        {d.by}
                      </span>
                    </div>
                  </td>
                  <td>
                    <strong style={{ fontSize: 11 }}>{d.type}</strong>
                  </td>
                  <td style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                    {d.range}
                  </td>
                  <td style={{ textAlign: "center" }}>{d.records}</td>
                  <td>
                    <span className="tag">{d.format}</span>
                  </td>
                  <td style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                    {d.size}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {d.sensitive ? (
                      <span className="badge red">
                        <i className="fa-solid fa-triangle-exclamation" /> Yes
                      </span>
                    ) : (
                      <span className="badge gray">No</span>
                    )}
                  </td>
                  <td>
                    <ResultBadge r={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          total={filtered.length}
          perPage={10}
          onChange={setPage}
        />
      </div>
    </>
  );
};

export default ExportsTab;
