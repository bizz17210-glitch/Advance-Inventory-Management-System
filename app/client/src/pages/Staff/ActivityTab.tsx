// ═══════════════════════════════════════════════════════════
// ActivityTab.tsx — Tab 4: Staff Activity Log
// No audit API is exposed by the backend; log is static.
// All filtering, search and pagination run client-side.
// ═══════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { Severity } from "./staff.types";
import { ACTIVITY_LOG, severityBadgeClass } from "./staffData";

const PAGE_SIZE = 10;

const STAFF_OPTIONS = Array.from(new Set(ACTIVITY_LOG.map((a) => a.staff)));
const MODULE_OPTIONS = Array.from(new Set(ACTIVITY_LOG.map((a) => a.module)));

const ActivityTab: React.FC = () => {
  const [search, setSearch] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [page, setPage] = useState(1);

  // ── Client-side filter ────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ACTIVITY_LOG.filter((a) => {
      if (staffFilter && a.staff !== staffFilter) return false;
      if (moduleFilter && a.module !== moduleFilter) return false;
      if (
        q &&
        ![a.staff, a.action, a.module, a.detail].some((f) =>
          f.toLowerCase().includes(q),
        )
      )
        return false;
      return true;
    });
  }, [search, staffFilter, moduleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = () => setPage(1);

  return (
    <>
      <div className="info-banner">
        <i className="fa-solid fa-circle-info" />
        <div className="info-banner-text">
          All critical actions performed by staff are automatically logged here.
          This includes logins, order updates, stock changes, and settings
          modifications. Logs are retained for <strong>90 days</strong> and can
          be exported at any time.
        </div>
      </div>

      <div className="card">
        {/* ── Toolbar ──────────────────────────────────── */}
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="table-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder="Search by staff, action, module..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
              />
            </div>

            {/* Staff filter */}
            <select
              className="form-select"
              style={{ height: 28, fontSize: 11 }}
              value={staffFilter}
              onChange={(e) => {
                setStaffFilter(e.target.value);
                resetPage();
              }}
            >
              <option value="">All Staff</option>
              {STAFF_OPTIONS.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>

            {/* Module filter */}
            <select
              className="form-select"
              style={{ height: 28, fontSize: 11 }}
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                resetPage();
              }}
            >
              <option value="">All Modules</option>
              {MODULE_OPTIONS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="table-toolbar-right">
            {(search || staffFilter || moduleFilter) && (
              <button
                className="t-filter-btn"
                onClick={() => {
                  setSearch("");
                  setStaffFilter("");
                  setModuleFilter("");
                  resetPage();
                }}
              >
                <i className="fa-solid fa-xmark" /> Clear
              </button>
            )}
            <button className="t-filter-btn">
              <i className="fa-solid fa-file-export" /> Export Log
            </button>
          </div>
        </div>

        {/* ── Table ────────────────────────────────────── */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Staff Member</th>
                <th>Action</th>
                <th>Module</th>
                <th>Details</th>
                <th>IP Address</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <i className="fa-solid fa-magnifying-glass" />
                      <h4>No logs match your filters</h4>
                      <p>Try adjusting your search or filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((a, i) => (
                  <tr key={i}>
                    <td
                      style={{
                        fontSize: 10.5,
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.time}
                    </td>
                    <td>
                      <strong style={{ fontSize: 11.5 }}>{a.staff}</strong>
                    </td>
                    <td style={{ fontSize: 11.5 }}>{a.action}</td>
                    <td>
                      <span className="tag">
                        <i
                          className="fa-solid fa-cube"
                          style={{ fontSize: 8 }}
                        />{" "}
                        {a.module}
                      </span>
                    </td>
                    <td style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                      {a.detail}
                    </td>
                    <td style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                      192.168.1.
                      {((((page - 1) * PAGE_SIZE + i) * 7 + 11) % 254) + 1}
                    </td>
                    <td>
                      <span
                        className={`badge ${severityBadgeClass[a.severity]}`}
                      >
                        {a.severity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ────────────────────────────────── */}
        <div className="pagination">
          <div className="pagination-info">
            Showing{" "}
            <strong>
              {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)}
            </strong>{" "}
            of <strong>{filtered.length}</strong> logs
          </div>
          <div className="pagination-controls">
            <button
              className="page-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <i className="fa-solid fa-chevron-left" style={{ fontSize: 9 }} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
              .map((p) => (
                <button
                  key={p}
                  className={`page-btn ${p === page ? "active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            <button
              className="page-btn"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <i
                className="fa-solid fa-chevron-right"
                style={{ fontSize: 9 }}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActivityTab;
