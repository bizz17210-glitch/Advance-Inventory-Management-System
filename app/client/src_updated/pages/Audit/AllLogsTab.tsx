import React, { useState } from "react";
import { AuditLog, Severity, AccessResult, ChangeType } from "./types";
import { STAFF_COLORS, MODULE_ICONS, ALL_LOGS_DATA, CHIPS } from "./auditData";
import ComingSoon from "./ComingSoon";

// ── HELPERS ──────────────────────────────────────────────
const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const truncate = (s: string, n: number) =>
  s.length > n ? s.slice(0, n) + "…" : s;

const PER_PAGE = 15;

// ── SHARED UI ─────────────────────────────────────────────
const SevBadge: React.FC<{ s: Severity }> = ({ s }) => {
  const cls: Record<Severity, string> = {
    Critical: "red",
    Warning: "yellow",
    Info: "blue",
  };
  return <span className={`badge ${cls[s]}`}>{s}</span>;
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

// ── PAGINATION ────────────────────────────────────────────
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

// ── OVERLAY ───────────────────────────────────────────────
const AuditOverlay: React.FC<{ log: AuditLog; onClose: () => void }> = ({
  log,
  onClose,
}) => (
  <>
    <div className="backdrop open" onClick={onClose} />
    <div className="overlay open">
      <div className="overlay-header">
        <div className="overlay-title">{log.id} — Event Detail</div>
        <button className="close-btn" onClick={onClose}>
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
      <div className="overlay-body">
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          <SevBadge s={log.severity} />
          <ModChip m={log.module} />
        </div>
        <div className="overlay-action-title">{log.action}</div>
        <div className="detail-row">
          <div className="detail-key">Event ID</div>
          <div className="detail-val">
            <code className="ref">{log.id}</code>
          </div>
        </div>
        <div className="detail-row">
          <div className="detail-key">Staff Member</div>
          <div className="detail-val">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                justifyContent: "flex-end",
              }}
            >
              <AvatarEl name={log.staff} />
              <strong>{log.staff}</strong>
            </div>
          </div>
        </div>
        <div className="detail-row">
          <div className="detail-key">Timestamp</div>{" "}
          <div className="detail-val">{log.ts}</div>
        </div>
        <div className="detail-row">
          <div className="detail-key">Module</div>{" "}
          <div className="detail-val">
            <ModChip m={log.module} />
          </div>
        </div>
        <div className="detail-row">
          <div className="detail-key">Severity</div>{" "}
          <div className="detail-val">
            <SevBadge s={log.severity} />
          </div>
        </div>
        <div className="detail-row">
          <div className="detail-key">IP Address</div>{" "}
          <div className="detail-val">
            <code className="ref">{log.ip}</code>
          </div>
        </div>
        <div className="detail-row">
          <div className="detail-key">Device / Browser</div>
          <div className="detail-val" style={{ fontSize: 10.5 }}>
            {log.device}
          </div>
        </div>
        <hr />
        <div className="overlay-section-label">Event Details</div>
        <div className="overlay-detail-box">{log.detail}</div>
        <hr />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="t-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark" /> Close
          </button>
          {log.severity === "Critical" && (
            <button className="t-btn danger">
              <i className="fa-solid fa-ban" /> Block IP
            </button>
          )}
          <button className="t-btn primary" style={{ marginLeft: "auto" }}>
            <i className="fa-solid fa-file-export" /> Export This Event
          </button>
        </div>
      </div>
    </div>
  </>
);

// ── ALL LOGS TAB ──────────────────────────────────────────
const ALL_STAFF = [
  "Admin Khan",
  "Sara Khan",
  "Bilal Raza",
  "Amna Siddiqui",
  "Fatima Noor",
  "Tariq Mehmood",
  "Hassan Ali",
  "Omar Farooq",
  "System",
];
const ALL_MODS = [
  "Orders",
  "Inventory",
  "Products",
  "Customers",
  "Finance",
  "Couriers",
  "Riders",
  "Staff",
  "Reports",
  "Settings",
  "Security",
  "System",
];

const AllLogsTab: React.FC = () => {
  const [search, setSearch] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [modFilter, setModFilter] = useState("");
  const [chip, setChip] = useState("");
  const [page, setPage] = useState(1);
  const [overlay, setOverlay] = useState<AuditLog | null>(null);

  const filtered = ALL_LOGS_DATA.filter((d) => {
    if (chip && !d.severity.includes(chip) && !d.module.includes(chip))
      return false;
    if (staffFilter && d.staff !== staffFilter) return false;
    if (modFilter && d.module !== modFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.action.toLowerCase().includes(q) ||
        d.staff.toLowerCase().includes(q) ||
        d.module.toLowerCase().includes(q) ||
        d.detail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <ComingSoon
        feature="All Logs"
        note="No GET /api/audit/logs endpoint exists yet. Showing sample log entries."
      />

      {/* Chips */}
      <div className="chip-group">
        {CHIPS.map((c) => (
          <div
            key={c.filter}
            className={`chip ${chip === c.filter ? "active" : ""}`}
            onClick={() => {
              setChip(c.filter);
              setPage(1);
            }}
          >
            {c.icon && (
              <i
                className={`fa-solid ${c.icon}`}
                style={c.iconColor ? { color: c.iconColor } : {}}
              />
            )}
            {c.label}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="toolbar-left">
            <div className="t-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder="Search action, user, module..."
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
              value={staffFilter}
              onChange={(e) => {
                setStaffFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Staff</option>
              {ALL_STAFF.map((s) => (
                <option key={s}>{s}</option>
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
              {ALL_MODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <button className="t-btn">
              <i className="fa-solid fa-calendar" /> Date Range
            </button>
          </div>
          <div className="toolbar-right">
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
              {filtered.length} records
            </span>
            <button className="t-btn">
              <i className="fa-solid fa-file-export" /> Export Logs
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Staff Member</th>
                <th>Action</th>
                <th>Module</th>
                <th>IP Address</th>
                <th>Device</th>
                <th>Severity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => setOverlay(d)}
                  style={{ cursor: "pointer" }}
                >
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
                      <div style={{ fontWeight: 600, fontSize: 10.5 }}>
                        {d.staff}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div
                      style={{ fontSize: 11, fontWeight: 500, maxWidth: 260 }}
                    >
                      {truncate(d.action, 55)}
                    </div>
                    <div className="td-sub" style={{ maxWidth: 260 }}>
                      {truncate(d.detail, 70)}
                    </div>
                  </td>
                  <td>
                    <ModChip m={d.module} />
                  </td>
                  <td>
                    <code className="ref">{d.ip}</code>
                  </td>
                  <td
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      maxWidth: 140,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {truncate(d.device, 30)}
                  </td>
                  <td>
                    <SevBadge s={d.severity} />
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="t-btn"
                      style={{ height: 22, fontSize: 9.5 }}
                      onClick={() => setOverlay(d)}
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
          perPage={PER_PAGE}
          onChange={setPage}
        />
      </div>

      {overlay && (
        <AuditOverlay log={overlay} onClose={() => setOverlay(null)} />
      )}
    </>
  );
};

export default AllLogsTab;
