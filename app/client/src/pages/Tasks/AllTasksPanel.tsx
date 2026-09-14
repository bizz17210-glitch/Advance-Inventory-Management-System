// ═══════════════════════════════════════════════════════════
// PANEL: All Tasks  (tab → 'all')
// ═══════════════════════════════════════════════════════════

import React, { useState } from "react";
import type { Task, ApiUser } from "./types";
import { getStaffColor, initials, progressColor } from "./helpers";
import {
  Badge,
  PriorityDot,
  ProgressBar,
  SkeletonRows,
  EmptyState,
} from "./MicroComponents";
import { STATUS_CHIPS } from "./constants";

interface AllTasksPanelProps {
  tasks: Task[];
  users: ApiUser[];
  loading: boolean;
  totalItems: number;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onOpenTask: (id: string) => void;
  onMarkDone: (id: string) => void;
  onNewTask: () => void;
  onFilter: (params: {
    status?: string;
    priority?: string;
    assignee?: string;
  }) => void;
}

const AllTasksPanel: React.FC<AllTasksPanelProps> = ({
  tasks,
  users,
  loading,
  totalItems,
  page,
  totalPages,
  onPageChange,
  onOpenTask,
  onMarkDone,
  onNewTask,
  onFilter,
}) => {
  const [search, setSearch] = useState("");
  const [chipFilter, setChipFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");

  // ── Client-side search filter on current page ────────────
  const filtered = search
    ? tasks.filter((t) => {
        const q = search.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.assignee.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)
        );
      })
    : tasks;

  // ── Chip filter → API call via onFilter ─────────────────
  const handleChip = (value: string) => {
    // Toggle off if same chip clicked again
    const next = chipFilter === value ? "" : value;
    setChipFilter(next);

    if (!next) {
      // Reset: fetch all
      onFilter({});
      return;
    }

    const isPriority = ["High", "Medium", "Low"].includes(next);
    const isStatus = [
      "Pending",
      "In Progress",
      "Done",
      "Overdue",
      "Cancelled",
    ].includes(next);

    onFilter({
      priority: isPriority ? next : undefined,
      // Map UI label → API status value
      status: isStatus
        ? next === "In Progress"
          ? "InProgress"
          : next === "Done"
            ? "Completed"
            : next === "Overdue"
              ? "Pending" // backend has no 'Overdue' status; filter Pending + client detects overdue
              : next
        : undefined,
    });
  };

  // ── Assignee filter → API call via onFilter ──────────────
  const handleAssignee = (id: string) => {
    setAssigneeFilter(id);
    onFilter({ assignee: id || undefined });
  };

  // ── Pagination display range ─────────────────────────────
  const PAGE_SIZE = 20;
  const start = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalItems);

  // ── Render pagination buttons (max 7 visible) ───────────
  const renderPageButtons = () => {
    if (totalPages <= 1) return null;

    const buttons: React.ReactNode[] = [];
    let startPage = Math.max(1, page - 3);
    let endPage = Math.min(totalPages, startPage + 6);
    // Adjust window if near the end
    if (endPage - startPage < 6) startPage = Math.max(1, endPage - 6);

    for (let p = startPage; p <= endPage; p++) {
      buttons.push(
        <button
          key={p}
          className={`pag-btn ${p === page ? "active" : ""}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>,
      );
    }

    if (endPage < totalPages) {
      buttons.push(
        <button
          key="ellipsis"
          className="pag-btn"
          style={{ pointerEvents: "none" }}
        >
          …
        </button>,
      );
      buttons.push(
        <button
          key={totalPages}
          className="pag-btn"
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </button>,
      );
    }

    return buttons;
  };

  return (
    <>
      {/* ── Chip Filters ── */}
      <div className="chip-group">
        {STATUS_CHIPS.map((c) => (
          <div
            key={c.value}
            className={`chip ${chipFilter === c.value ? "active" : ""}`}
            onClick={() => handleChip(c.value)}
          >
            {c.icon && (
              <i
                className={`fa-solid ${c.icon}`}
                style={
                  c.value === "Overdue" ? { color: "var(--red)" } : undefined
                }
              />
            )}
            {c.label}
          </div>
        ))}
      </div>

      <div className="card">
        {/* ── Toolbar ── */}
        <div className="table-toolbar">
          <div className="toolbar-left">
            <div className="t-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder="Search task or staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              style={{ height: 27, fontSize: "10.5px" }}
              value={assigneeFilter}
              onChange={(e) => handleAssignee(e.target.value)}
            >
              <option value="">All Staff</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.firstName
                    ? `${u.firstName} ${u.lastName || ""}`.trim()
                    : u.username}
                </option>
              ))}
            </select>
          </div>
          <div className="toolbar-right">
            <button className="t-btn">
              <i className="fa-solid fa-file-export" /> Export
            </button>
            <button className="t-btn primary" onClick={onNewTask}>
              <i className="fa-solid fa-plus" /> New Task
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" />
                </th>
                <th>Task Title</th>
                <th>Category</th>
                <th>Assigned To</th>
                <th>Assigned By</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={10} rows={8} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState
                      icon="fa-clipboard-list"
                      title="No tasks found"
                      desc="Try adjusting your filters."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const color = getStaffColor(t.assignee);
                  const barColor = progressColor(t.status);
                  return (
                    <tr key={t.id} onClick={() => onOpenTask(t.id)}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" />
                      </td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 6,
                          }}
                        >
                          <PriorityDot priority={t.priority} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 11 }}>
                              {t.title}
                            </div>
                            <div className="td-sub">
                              <code className="ref">{t.id.slice(-8)}</code>
                              {t.linked !== "—" && (
                                <>
                                  {" "}
                                  · <span className="tag">{t.linked}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="tag">{t.category}</span>
                      </td>

                      <td>
                        <div className="td-flex">
                          <div
                            className="row-avatar"
                            style={{ background: color }}
                          >
                            {initials(t.assignee)}
                          </div>
                          <div style={{ fontSize: "10.5px", fontWeight: 500 }}>
                            {t.assignee}
                          </div>
                        </div>
                      </td>

                      <td
                        style={{
                          fontSize: "10.5px",
                          color: "var(--text-muted)",
                        }}
                      >
                        {t.assignedBy}
                      </td>

                      <td
                        style={{
                          fontSize: 10,
                          whiteSpace: "nowrap",
                          color:
                            t.status === "Overdue" ? "var(--red)" : undefined,
                          fontWeight: t.status === "Overdue" ? 600 : undefined,
                        }}
                      >
                        {t.due}
                      </td>

                      <td>
                        <Badge label={t.priority} />
                      </td>
                      <td>
                        <Badge label={t.status} />
                      </td>

                      <td style={{ minWidth: 80 }}>
                        <div
                          style={{
                            fontSize: 9.5,
                            color: "var(--text-muted)",
                            marginBottom: 2,
                          }}
                        >
                          {t.progress}%
                        </div>
                        <ProgressBar pct={t.progress} color={barColor} />
                      </td>

                      <td onClick={(e) => e.stopPropagation()}>
                        {/* Only show Mark Done for Pending / In Progress / Overdue */}
                        {(t.status === "Pending" ||
                          t.status === "In Progress" ||
                          t.status === "Overdue") && (
                          <button
                            className="t-btn primary"
                            style={{ height: 22, fontSize: 9.5 }}
                            onClick={() => onMarkDone(t.id)}
                          >
                            <i className="fa-solid fa-check" />
                          </button>
                        )}
                        <button
                          className="t-btn"
                          style={{ height: 22, fontSize: 9.5, marginLeft: 3 }}
                          onClick={() => onOpenTask(t.id)}
                        >
                          <i className="fa-solid fa-eye" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="pagination">
          <div>
            Showing{" "}
            <strong>
              {start}–{end}
            </strong>{" "}
            of <strong>{totalItems}</strong> tasks
          </div>
          <div className="pag-controls">
            <button
              className="pag-btn"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              ‹
            </button>
            {renderPageButtons()}
            <button
              className="pag-btn"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AllTasksPanel;
