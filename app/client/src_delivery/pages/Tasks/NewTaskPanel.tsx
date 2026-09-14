// ═══════════════════════════════════════════════════════════
// PANEL: New Task Form  (tab → 'add')
// ═══════════════════════════════════════════════════════════

import React, { useState } from "react";
import type { Task, ApiUser } from "./types";
import type { CreateTaskPayload } from "./types";
import { CATEGORIES, PRIORITY_OPTIONS } from "./constants";
import { getStaffColor, initials } from "./helpers";
import {
  Badge,
  ProgressBar,
  ToggleSwitch,
  ErrorBanner,
} from "./MicroComponents";
import { tasksAPI } from "../../services/api";

interface NewTaskPanelProps {
  tasks: Task[];
  users: ApiUser[]; // loaded from usersAPI in TasksPage
  onCancel: () => void;
  onCreated: () => void;
}

const NewTaskPanel: React.FC<NewTaskPanelProps> = ({
  tasks,
  users,
  onCancel,
  onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  // FIX: priority typed as the union the backend accepts on create (no 'Critical')
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("17:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Workload map for sidebar (task count per assignee display name)
  const workload: Record<string, number> = {};
  tasks.forEach((t) => {
    workload[t.assignee] = (workload[t.assignee] || 0) + 1;
  });

  const handleSubmit = async () => {
    if (!title.trim() || !assignedTo || !dueDate) {
      setError("Title, assignee, and due date are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // FIX: combine date + time into a single ISO string for the backend
      const dueDateISO = dueTime ? `${dueDate}T${dueTime}:00` : dueDate;

      const payload: CreateTaskPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        assignedTo,
        dueDate: dueDateISO,
        priority,
        // category is a UI concept; relatedEntity.type maps to it if needed
        // Only set relatedEntity if your backend requires it for this category
      };

      await tasksAPI.create(payload);
      onCreated(); // refresh task list in parent
      onCancel(); // go back to All Tasks
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to create task.");
    } finally {
      setSaving(false);
    }
  };

  const isSubmitDisabled = saving || !title.trim() || !assignedTo || !dueDate;

  return (
    <div className="detail-grid-2" style={{ alignItems: "start" }}>
      {/* ── Left: Create Task form ── */}
      <div className="card" style={{ marginBottom: 0 }}>
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-circle-plus ic-orange" /> Create New Task
          </div>
        </div>
        <div className="card-body">
          {error && <ErrorBanner message={error} />}

          {/* Title */}
          <div className="form-row single">
            <div className="form-group">
              <div className="form-label">Task Title *</div>
              <input
                className="form-input"
                placeholder="e.g. Restock warehouse shelves — Section B"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          {/* Category + Priority */}
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Category</div>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <div className="form-label">Priority *</div>
              <select
                className="form-select"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "High" | "Medium" | "Low")
                }
              >
                {/* FIX: PRIORITY_OPTIONS only shows High/Medium/Low — matches backend create constraint */}
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assign To */}
          <div className="form-row single">
            <div className="form-group">
              <div className="form-label">Assign To *</div>
              <select
                className="form-select"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">— Select staff member —</option>
                {users.length === 0 ? (
                  <option disabled>Loading staff...</option>
                ) : (
                  users.map((u) => (
                    <option key={u.id || u._id} value={u.id || u._id}>
                      {u.firstName
                        ? `${u.firstName} ${u.lastName || ""}`.trim()
                        : u.username}{" "}
                      ({u.role})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Due Date + Due Time */}
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Due Date *</div>
              <input
                className="form-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <div className="form-label">Due Time</div>
              <input
                className="form-input"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-row single">
            <div className="form-group">
              <div className="form-label">Description / Instructions</div>
              <textarea
                className="form-textarea"
                placeholder="Detailed instructions for this task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Notify toggle */}
          <div className="form-row single">
            <div
              className="form-group"
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div className="form-label" style={{ marginBottom: 0 }}>
                  Notify Assignee
                </div>
                <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>
                  Send notification when task is created
                </div>
              </div>
              <ToggleSwitch defaultChecked />
            </div>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--divider)",
              margin: "12px 0",
            }}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="t-btn primary"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
            >
              <i className="fa-solid fa-check" />{" "}
              {saving ? "Creating…" : "Create Task"}
            </button>
            <button className="t-btn" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: sidebar widgets ── */}
      <div>
        {/* Recent tasks */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-clock-rotate-left" /> Recent Tasks
            </div>
          </div>
          <div className="card-body" style={{ padding: "8px 14px" }}>
            {tasks.length === 0 ? (
              <div
                style={{
                  fontSize: 10.5,
                  color: "var(--text-muted)",
                  padding: "6px 0",
                }}
              >
                No tasks yet.
              </div>
            ) : (
              tasks.slice(0, 5).map((t) => (
                <div className="list-item" key={t.id}>
                  <div className="list-content">
                    <div className="list-title" style={{ fontSize: "10.5px" }}>
                      {t.title.length > 45
                        ? t.title.slice(0, 45) + "…"
                        : t.title}
                    </div>
                    <div className="list-meta">
                      {t.assignee} · {t.category}
                    </div>
                  </div>
                  <div className="list-right">
                    <Badge label={t.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Staff Workload */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-users ic-blue" /> Staff Workload
            </div>
          </div>
          <div className="card-body" style={{ padding: "8px 14px" }}>
            {Object.entries(workload).length === 0 ? (
              <div
                style={{
                  fontSize: 10.5,
                  color: "var(--text-muted)",
                  padding: "6px 0",
                }}
              >
                No data.
              </div>
            ) : (
              Object.entries(workload)
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => {
                  const color = getStaffColor(name);
                  const maxTasks = Math.max(...Object.values(workload));
                  const pct = Math.round((count / maxTasks) * 100);
                  const barColor =
                    pct > 80
                      ? "var(--red)"
                      : pct > 50
                        ? "var(--yellow)"
                        : "var(--green)";
                  return (
                    <div className="list-item" key={name}>
                      <div
                        className="row-avatar"
                        style={{
                          background: color,
                          width: 22,
                          height: 22,
                          fontSize: 9,
                        }}
                      >
                        {initials(name)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 500,
                            marginBottom: 3,
                          }}
                        >
                          {name.split(" ")[0]}{" "}
                          <span
                            style={{
                              color: "var(--text-muted)",
                              fontWeight: 400,
                            }}
                          >
                            ({count} task{count !== 1 ? "s" : ""})
                          </span>
                        </div>
                        <ProgressBar pct={pct} color={barColor} />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTaskPanel;
