// ═══════════════════════════════════════════════════════════
// COMPONENT: Task Detail Overlay (slide-in panel)
// ═══════════════════════════════════════════════════════════

import React, { useState } from "react";
import type { Task } from "./types";
import { getStaffColor, initials, progressColor } from "./helpers";
import { Badge, ProgressBar } from "./MicroComponents";
import { tasksAPI } from "../../services/api";

interface TaskOverlayProps {
  task: Task | null;
  onClose: () => void;
  onMarkDone: (id: string) => void;
  onDeleted?: () => void; // refresh list after cancel/delete
}

const TaskOverlay: React.FC<TaskOverlayProps> = ({
  task,
  onClose,
  onMarkDone,
  onDeleted,
}) => {
  const [cancelling, setCancelling] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  if (!task) return null;

  const color = getStaffColor(task.assignee);
  const barColor = progressColor(task.status);

  // ── Start Progress ─────────────────────────────────────
  // Sends: { status: 'InProgress' }
  // Valid only from: Pending
  const handleStartProgress = async () => {
    setStarting(true);
    setError("");
    try {
      await tasksAPI.updateStatus(task.id, { status: "InProgress" });
      onClose();
      onDeleted?.(); // refresh to show updated status
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to update status.");
    } finally {
      setStarting(false);
    }
  };

  // ── Cancel Task ────────────────────────────────────────
  // Sends: DELETE /api/tasks/:id  with optional { reason }
  // Valid only from: Pending | InProgress
  const handleCancel = async () => {
    if (!window.confirm("Cancel this task?")) return;
    setCancelling(true);
    setError("");
    try {
      await tasksAPI.delete(task.id, "Cancelled by manager");
      onClose();
      onDeleted?.();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to cancel task.");
    } finally {
      setCancelling(false);
    }
  };

  const rows: [string, React.ReactNode][] = [
    ["Task ID", <code className="ref">{task.id.slice(-8)}</code>],
    ["Category", <span className="tag">{task.category}</span>],
    [
      "Assigned To",
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          justifyContent: "flex-end",
        }}
      >
        <div
          className="row-avatar"
          style={{ background: color, width: 20, height: 20, fontSize: 9 }}
        >
          {initials(task.assignee)}
        </div>
        {task.assignee}
      </div>,
    ],
    ["Assigned By", task.assignedBy],
    [
      "Due Date",
      <span
        style={{ color: task.status === "Overdue" ? "var(--red)" : undefined }}
      >
        {task.due}
      </span>,
    ],
    ["Priority", <Badge label={task.priority} />],
    ["Status", <Badge label={task.status} />],
    ...(task.linked !== "—"
      ? [
          ["Linked To", <span className="tag">{task.linked}</span>] as [
            string,
            React.ReactNode,
          ],
        ]
      : []),
  ];

  return (
    <>
      <div className="task-backdrop open" onClick={onClose} />

      <div className="task-overlay open">
        {/* Header */}
        <div className="overlay-header">
          <div className="overlay-title">
            {task.id.slice(-8)} —{" "}
            {task.title.length > 32
              ? task.title.slice(0, 32) + "…"
              : task.title}
          </div>
          <button className="close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Body */}
        <div className="overlay-body">
          {/* Tags row */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <Badge label={task.status} />
            <Badge label={task.priority} />
            <span className="tag">{task.category}</span>
          </div>

          {/* Full title */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 10,
              lineHeight: 1.4,
            }}
          >
            {task.title}
          </div>

          {/* Description if present */}
          {task.description && (
            <div
              style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                marginBottom: 12,
                padding: "8px 10px",
                background: "var(--bg)",
                borderRadius: 5,
                border: "1px solid var(--border)",
              }}
            >
              {task.description}
            </div>
          )}

          {/* Detail rows */}
          {rows.map(([k, v], i) => (
            <div className="detail-row" key={i}>
              <div className="detail-key">{k}</div>
              <div className="detail-val">{v}</div>
            </div>
          ))}

          {/* Progress */}
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: 0.4,
                marginBottom: 5,
              }}
            >
              Progress — {task.progress}%
            </div>
            <ProgressBar pct={task.progress} color={barColor} />
          </div>

          {error && (
            <div className="alert-strip danger" style={{ marginTop: 12 }}>
              <i className="fa-solid fa-circle-exclamation" />
              <div>{error}</div>
            </div>
          )}

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--divider)",
              margin: "12px 0",
            }}
          />

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {/* Start: only from Pending */}
            {task.status === "Pending" && (
              <button
                className="t-btn"
                onClick={handleStartProgress}
                disabled={starting}
              >
                <i className="fa-solid fa-play" />{" "}
                {starting ? "Starting…" : "Start"}
              </button>
            )}

            {/* Mark Done: from Pending or In Progress */}
            {(task.status === "Pending" || task.status === "In Progress") && (
              <button
                className="t-btn primary"
                onClick={() => onMarkDone(task.id)}
              >
                <i className="fa-solid fa-check" /> Mark Done
              </button>
            )}

            {/* Cancel: from Pending or In Progress */}
            {(task.status === "Pending" || task.status === "In Progress") && (
              <button
                className="t-btn danger"
                onClick={handleCancel}
                disabled={cancelling}
              >
                <i className="fa-solid fa-ban" />{" "}
                {cancelling ? "Cancelling…" : "Cancel Task"}
              </button>
            )}

            <button className="t-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskOverlay;
