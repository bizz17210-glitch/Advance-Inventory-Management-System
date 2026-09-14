import React, { useState } from "react";
import { ChangeType } from "./types";
import { STAFF_COLORS, MODULE_ICONS, DATA_CHANGES } from "./auditData";
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
const ChangeBadge: React.FC<{ t: ChangeType }> = ({ t }) => {
  const cls: Record<ChangeType, string> = {
    Create: "green",
    Update: "blue",
    Delete: "red",
    "Bulk Import": "purple",
    "Stock Adjustment": "orange",
  };
  return <span className={`badge ${cls[t]}`}>{t}</span>;
};

const ModChip: React.FC<{ m: string }> = ({ m }) => (
  <span className="tag">
    <i
      className={`fa-solid ${MODULE_ICONS[m] ?? "fa-cube"}`}
      style={{ fontSize: 9, marginRight: 3 }}
    />
    {m}
  </span>
);

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

// ── DATA CHANGES TAB ──────────────────────────────────────
const DataChangesTab: React.FC = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modFilter, setModFilter] = useState("");
  const [page, setPage] = useState(1);

  const filtered = DATA_CHANGES.filter((d) => {
    if (typeFilter && d.type !== typeFilter) return false;
    if (modFilter && d.module !== modFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.record.toLowerCase().includes(q) ||
        d.staff.toLowerCase().includes(q) ||
        d.field.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pageItems = filtered.slice((page - 1) * 12, page * 12);

  return (
    <>
      <ComingSoon
        feature="Data Changes"
        note="No GET /api/audit/data-changes endpoint exists yet. Showing sample data-change records."
      />

      <div
        className="mini-stats"
        style={{ gridTemplateColumns: "repeat(3,1fr)" }}
      >
        <div className="mini-stat">
          <div className="ms-label">Data Changes (24h)</div>
          <div className="ms-value">142</div>
          <div className="ms-trend">Orders, Inventory, Products</div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Deletions</div>
          <div className="ms-value" style={{ color: "var(--red)" }}>
            4
          </div>
          <div className="ms-trend down">
            <i className="fa-solid fa-trash" /> All by Admin Khan
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Stock Adjustments</div>
          <div className="ms-value" style={{ color: "var(--accent)" }}>
            11
          </div>
          <div className="ms-trend">
            <i className="fa-solid fa-cubes" /> Manual overrides
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
                placeholder="Search record or field..."
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
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Change Types</option>
              {[
                "Create",
                "Update",
                "Delete",
                "Bulk Import",
                "Stock Adjustment",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select
              className="form-select"
              style={{ height: 27, fontSize: 10.5 }}
              value={modFilter}
              onChange={(e) => {
                setModFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Modules</option>
              {["Orders", "Products", "Inventory", "Customers", "Finance"].map(
                (m) => (
                  <option key={m}>{m}</option>
                ),
              )}
            </select>
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
                <th>Staff Member</th>
                <th>Module</th>
                <th>Change Type</th>
                <th>Record</th>
                <th>Field Changed</th>
                <th>Old Value</th>
                <th>New Value</th>
                <th>Actions</th>
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
                      <AvatarEl name={d.staff} />
                      <span style={{ fontSize: 10.5, fontWeight: 500 }}>
                        {d.staff}
                      </span>
                    </div>
                  </td>
                  <td>
                    <ModChip m={d.module} />
                  </td>
                  <td>
                    <ChangeBadge t={d.type} />
                  </td>
                  <td>
                    <code className="ref">{d.record}</code>
                  </td>
                  <td style={{ fontSize: 10.5 }}>{d.field}</td>
                  <td
                    style={{
                      fontSize: 10.5,
                      color: "var(--text-muted)",
                      maxWidth: 100,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {d.oldVal}
                  </td>
                  <td
                    style={{
                      fontSize: 10.5,
                      fontWeight: 500,
                      maxWidth: 120,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color:
                        d.type === "Delete"
                          ? "var(--red)"
                          : "var(--text-primary)",
                    }}
                  >
                    {d.newVal}
                  </td>
                  <td>
                    <button
                      className="t-btn"
                      style={{ height: 22, fontSize: 9.5 }}
                    >
                      <i className="fa-solid fa-eye" />
                    </button>
                  </td>
                </tr>
              ))}
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

export default DataChangesTab;
