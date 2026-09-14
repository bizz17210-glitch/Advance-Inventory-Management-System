// ═══════════════════════════════════════════════════════════
// StaffMembersTab.tsx — Tab 1: Staff Members — API-connected
// GET /api/users  (page, limit, search, status, role)
// GET /api/analytics/staff-performance
// PATCH /api/users/:id/status
// DELETE /api/users/:id
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from "react";
import { StaffMember, StaffFilter, ApiRole, ApiStatus } from "./staff.types";
import {
  STAFF_PER_PAGE,
  completionPct,
  scoreFill,
  mapUserToStaff,
  buildPerfMap,
  buildOrderMap,
} from "./staffData";
import { usersAPI, analyticsAPI } from "../../services/api";
import ThreeDot from "./ThreeDot";
import ProgBar from "./ProgBar";
import StatusBadge from "./StatusBadge";
import StaffPanel from "./StaffPanel";

// ── Role filter options aligned to backend ApiRole values ──
const ROLE_FILTER_OPTIONS: { value: ApiRole | ""; label: string }[] = [
  { value: "", label: "All Roles" },
  { value: "Administrator", label: "Administrator" },
  { value: "OperationsManager", label: "Ops Manager" },
  { value: "InventoryManager", label: "Inventory Manager" },
  { value: "SalesOperator", label: "Sales Operator" },
  { value: "Accounts", label: "Accounts" },
  { value: "CourierHandler", label: "Courier Handler" },
  { value: "Rider", label: "Rider" },
];

// ── Skeleton row ───────────────────────────────────────────
const SkeletonRow: React.FC = () => (
  <tr>
    {Array.from({ length: 10 }).map((_, i) => (
      <td key={i}>
        <div
          style={{
            height: 12,
            background: "var(--divider)",
            borderRadius: 4,
            width: i === 1 ? 120 : 60,
            margin: "0 auto",
          }}
        />
      </td>
    ))}
  </tr>
);

const StaffMembersTab: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Summary stat: total active across ALL pages (not just current page)
  const [totalActive, setTotalActive] = useState(0);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StaffFilter>("all");
  const [roleFilter, setRoleFilter] = useState<ApiRole | "">("");
  const [page, setPage] = useState(1);

  const [panelStaff, setPanelStaff] = useState<StaffMember | null>(null);
  const [panelMode, setPanelMode] = useState<"view" | "edit" | "add">("view");

  // ── Fetch current page of staff ───────────────────────
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const statusParam =
        filter === "active"
          ? "Active"
          : filter === "offline"
            ? "Inactive"
            : filter === "suspended"
              ? "Suspended"
              : undefined;

      const params: Record<string, any> = {
        page,
        limit: STAFF_PER_PAGE,
        ...(search && { search }),
        ...(statusParam && { status: statusParam }),
        ...(roleFilter && { role: roleFilter }),
      };

      const [usersRes, perfRes] = await Promise.allSettled([
        usersAPI.getAll(params),
        analyticsAPI.getStaffPerformance(),
      ]);

      if (usersRes.status === "rejected") throw usersRes.reason;

      const { users, pagination } = usersRes.value.data.data;
      setTotalItems(pagination.totalItems);
      setTotalPages(pagination.totalPages);

      // Perf maps (non-blocking — degrade gracefully)
      let perfMap = undefined;
      let orderMap = undefined;
      if (perfRes.status === "fulfilled") {
        perfMap = buildPerfMap(perfRes.value.data.data.taskPerformance);
        orderMap = buildOrderMap(perfRes.value.data.data.orderProcessing);
      }

      setStaff(users.map((u: any) => mapUserToStaff(u, perfMap, orderMap)));
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? "Failed to load staff. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, filter, search, roleFilter]);

  // ── Fetch total active count (separate call, status=Active) ──
  // This gives the real total across all pages, not just current slice
  const fetchActiveCount = useCallback(async () => {
    try {
      const res = await usersAPI.getAll({
        page: 1,
        limit: 1,
        status: "Active",
      });
      setTotalActive(res.data.data.pagination.totalItems);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);
  useEffect(() => {
    fetchActiveCount();
  }, [fetchActiveCount]);

  // Debounce search — reset to page 1 after 400 ms
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when any filter changes
  useEffect(() => {
    setPage(1);
  }, [filter, roleFilter]);

  // ── Delete (soft deactivate via DELETE /api/users/:id) ──
  const handleDelete = async (id: string) => {
    if (!window.confirm("Deactivate this staff member?")) return;
    try {
      await usersAPI.delete(id);
      fetchStaff();
      fetchActiveCount();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to deactivate.");
    }
  };

  // ── Status change via PATCH /api/users/:id/status ────
  const handleStatusChange = async (id: string, status: ApiStatus) => {
    try {
      await usersAPI.updateStatus(id, status);
      fetchStaff();
      fetchActiveCount();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to update status.");
    }
  };

  // ── Panel handlers ────────────────────────────────────
  const openPanel = (s: StaffMember, mode: "view" | "edit" = "view") => {
    setPanelStaff(s);
    setPanelMode(mode);
  };
  const openAdd = () => {
    setPanelStaff(null);
    setPanelMode("add");
  };
  const closePanel = () => {
    setPanelStaff(null);
    fetchStaff();
    fetchActiveCount();
  };
  const showPanel = panelStaff !== null || panelMode === "add";

  const filterBtns: {
    key: StaffFilter;
    label: string;
    icon?: React.ReactNode;
  }[] = [
    { key: "all", label: "All" },
    {
      key: "active",
      label: "Active",
      icon: (
        <i
          className="fa-solid fa-circle"
          style={{ color: "#22C55E", fontSize: 7 }}
        />
      ),
    },
    {
      key: "offline",
      label: "Inactive",
      icon: (
        <i
          className="fa-solid fa-circle"
          style={{ color: "#9CA3AF", fontSize: 7 }}
        />
      ),
    },
    {
      key: "suspended",
      label: "Suspended",
      icon: <i className="fa-solid fa-ban" />,
    },
  ];

  // Perf stats derived from current page only
  const completedMTD = staff.reduce((sum, s) => sum + s.completed, 0);
  const avgScore = staff.length
    ? Math.round(staff.reduce((sum, s) => sum + s.score, 0) / staff.length)
    : 0;

  return (
    <>
      {/* ── Stat Cards ──────────────────────────────────── */}
      <div className="stats-row" style={{ marginBottom: 14 }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Total Staff</div>
            <div className="stat-icon" style={{ background: "#FFF5EE" }}>
              <i className="fa-solid fa-id-badge ic-orange" />
            </div>
          </div>
          <div className="stat-value">{loading ? "—" : totalItems}</div>
          <div className="stat-trend up">
            <i className="fa-solid fa-users" /> Registered users
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Active Users</div>
            <div className="stat-icon" style={{ background: "#F0FDF4" }}>
              <i
                className="fa-solid fa-circle-check"
                style={{ color: "#22C55E" }}
              />
            </div>
          </div>
          <div className="stat-value">{totalActive || "—"}</div>
          <div className="stat-trend up">
            <i className="fa-solid fa-arrow-trend-up" /> System-wide total
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Tasks Completed</div>
            <div className="stat-icon" style={{ background: "#EFF6FF" }}>
              <i
                className="fa-solid fa-list-check"
                style={{ color: "#3B82F6" }}
              />
            </div>
          </div>
          <div className="stat-value">{loading ? "—" : completedMTD}</div>
          <div className="stat-trend up">
            <i className="fa-solid fa-arrow-trend-up" /> Month to date
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Avg. Performance</div>
            <div className="stat-icon" style={{ background: "#FFFBEB" }}>
              <i className="fa-solid fa-star" style={{ color: "#F59E0B" }} />
            </div>
          </div>
          <div className="stat-value">{loading ? "—" : `${avgScore}%`}</div>
          <div className="stat-trend up">
            <i className="fa-solid fa-arrow-trend-up" /> Task completion
          </div>
        </div>
      </div>

      {/* ── Table Card ──────────────────────────────────── */}
      <div className="card">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="table-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder="Search name, role, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status filter buttons */}
            {filterBtns.map((f) => (
              <button
                key={f.key}
                className={`t-filter-btn ${filter === f.key ? "active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.icon} {f.label}
              </button>
            ))}

            {/* Role filter — uses GET /api/users?role= */}
            <select
              className="form-select"
              style={{ height: 28, fontSize: 11 }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as ApiRole | "")}
            >
              {ROLE_FILTER_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="table-toolbar-right">
            <button
              className="t-filter-btn"
              onClick={() => {
                fetchStaff();
                fetchActiveCount();
              }}
            >
              <i className="fa-solid fa-rotate-right" /> Refresh
            </button>
            <button className="header-btn primary" onClick={openAdd}>
              <i className="fa-solid fa-plus" /> Add Staff
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "#fef2f2",
              borderBottom: "1px solid #fecaca",
              fontSize: 12,
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <i className="fa-solid fa-circle-exclamation" /> {error}
            <button
              className="header-btn"
              style={{ marginLeft: "auto", fontSize: 11 }}
              onClick={fetchStaff}
            >
              Retry
            </button>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 32 }}>#</th>
                <th>Staff Member</th>
                <th>Role</th>
                <th>Department</th>
                <th>Performance</th>
                <th>Tasks (MTD)</th>
                <th>Last Active</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="empty-state">
                      <i className="fa-solid fa-users-slash" />
                      <h4>No staff found</h4>
                      <p>Try adjusting your search or filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                staff.map((s, idx) => {
                  const pct = completionPct(s);
                  const fill = scoreFill(s.score);
                  return (
                    <tr
                      key={s.id}
                      onClick={() => openPanel(s, "view")}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ color: "var(--text-muted)", fontSize: 11 }}>
                        {(page - 1) * STAFF_PER_PAGE + idx + 1}
                      </td>
                      <td>
                        <div className="td-flex">
                          <div
                            className="row-avatar"
                            style={{
                              background: `${s.color}20`,
                              color: s.color,
                              fontSize: 9.5,
                              fontWeight: 700,
                            }}
                          >
                            {s.avatar}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{s.name}</div>
                            <div className="td-sub">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="tag">{s.role}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {s.dept}
                        </span>
                      </td>
                      <td>
                        {s.tasks > 0 ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <ProgBar pct={pct} fill={fill} />
                            <span style={{ fontSize: 11, fontWeight: 600 }}>
                              {pct}%
                            </span>
                          </div>
                        ) : (
                          <span
                            style={{ fontSize: 11, color: "var(--text-muted)" }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        {s.tasks > 0 ? (
                          <>
                            <strong>{s.completed}</strong>
                            <span
                              style={{
                                color: "var(--text-muted)",
                                fontSize: 10,
                              }}
                            >
                              /{s.tasks}
                            </span>
                          </>
                        ) : (
                          <span
                            style={{ fontSize: 11, color: "var(--text-muted)" }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{ fontSize: 11, color: "var(--text-muted)" }}
                        >
                          {s.lastActive}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{ fontSize: 11, color: "var(--text-muted)" }}
                        >
                          {s.joined}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <ThreeDot
                          id={`staff-dot-${s.id}`}
                          items={[
                            {
                              label: "View Profile",
                              icon: "fa-eye",
                              onClick: () => openPanel(s, "view"),
                            },
                            {
                              label: "Edit",
                              icon: "fa-pen",
                              onClick: () => openPanel(s, "edit"),
                            },
                            { label: "---", icon: "", onClick: () => {} },
                            ...(s.status === "Suspended"
                              ? [
                                  {
                                    label: "Reactivate",
                                    icon: "fa-circle-check",
                                    onClick: () =>
                                      handleStatusChange(s.id, "Active"),
                                  },
                                ]
                              : s.status === "Active"
                                ? [
                                    {
                                      label: "Suspend",
                                      icon: "fa-ban",
                                      danger: true,
                                      onClick: () =>
                                        handleStatusChange(s.id, "Suspended"),
                                    },
                                  ]
                                : [
                                    {
                                      label: "Activate",
                                      icon: "fa-circle-check",
                                      onClick: () =>
                                        handleStatusChange(s.id, "Active"),
                                    },
                                  ]),
                            {
                              label: "Remove",
                              icon: "fa-trash",
                              danger: true,
                              onClick: () => handleDelete(s.id),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ─────────────────────────────────── */}
        <div className="pagination">
          <div className="pagination-info">
            Showing <strong>{staff.length}</strong> of{" "}
            <strong>{totalItems}</strong> staff
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

      {/* ── Side Panel ─────────────────────────────────────── */}
      {showPanel && (
        <StaffPanel
          staff={panelStaff}
          mode={panelMode}
          onClose={closePanel}
          onEdit={(s) => {
            setPanelStaff(s);
            setPanelMode("edit");
          }}
          onSaved={() => {
            fetchStaff();
            fetchActiveCount();
          }}
        />
      )}
    </>
  );
};

export default StaffMembersTab;
