// ═══════════════════════════════════════════════════════════
// PANEL: Board (Kanban) View  (tab → 'kanban')
// ═══════════════════════════════════════════════════════════

import React from "react";
import type { Task, TaskStatus } from "./types";
import { getStaffColor, initials, progressColor } from "./helpers";
import { Badge, PriorityDot, ProgressBar, EmptyState } from "./MicroComponents";

interface KanbanPanelProps {
  tasks: Task[];
  loading: boolean;
  onOpenTask: (id: string) => void;
}

const COLUMNS: {
  key: TaskStatus;
  label: string;
  icon: string;
  color: string;
}[] = [
  {
    key: "Pending",
    label: "Pending",
    icon: "fa-clock",
    color: "var(--text-muted)",
  },
  {
    key: "In Progress",
    label: "In Progress",
    icon: "fa-spinner",
    color: "var(--blue)",
  },
  {
    key: "Done",
    label: "Done",
    icon: "fa-circle-check",
    color: "var(--green)",
  },
];

const COUNT_STYLES: Record<string, React.CSSProperties> = {
  Done: { background: "var(--green-bg)", color: "var(--green)" },
  "In Progress": { background: "var(--blue-bg)", color: "var(--blue)" },
  Pending: { background: "var(--divider)", color: "var(--text-muted)" },
};

const KanbanPanel: React.FC<KanbanPanelProps> = ({
  tasks,
  loading,
  onOpenTask,
}) => {
  if (loading) {
    return (
      <div className="kanban-board">
        {COLUMNS.map((col) => (
          <div className="kanban-col" key={col.key}>
            <div className="kanban-col-header">
              <div className="kanban-col-title">
                <i
                  className={`fa-solid ${col.icon}`}
                  style={{ color: col.color, fontSize: 10 }}
                />
                {col.label}
              </div>
            </div>
            <div className="kanban-col-body">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="kanban-card"
                  style={{ opacity: 1 - i * 0.25 }}
                >
                  <div
                    style={{
                      height: 10,
                      borderRadius: 3,
                      background: "var(--divider)",
                      width: "80%",
                      marginBottom: 8,
                    }}
                  />
                  <div
                    style={{
                      height: 8,
                      borderRadius: 3,
                      background: "var(--divider)",
                      width: "50%",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="kanban-board">
      {COLUMNS.map((col) => {
        // Pending column also absorbs Overdue tasks
        const items = tasks.filter((t) =>
          col.key === "Pending"
            ? t.status === "Pending" || t.status === "Overdue"
            : t.status === col.key,
        );

        return (
          <div className="kanban-col" key={col.key}>
            <div className="kanban-col-header">
              <div className="kanban-col-title">
                <i
                  className={`fa-solid ${col.icon}`}
                  style={{ color: col.color, fontSize: 10 }}
                />
                {col.label}
              </div>
              <span
                className="kanban-col-count"
                style={COUNT_STYLES[col.key] ?? COUNT_STYLES["Pending"]}
              >
                {items.length}
              </span>
            </div>

            <div className="kanban-col-body">
              {items.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px 10px",
                    color: "var(--text-muted)",
                    fontSize: "10.5px",
                  }}
                >
                  No tasks
                </div>
              ) : (
                items.map((t) => {
                  const color = getStaffColor(t.assignee);
                  const barColor = progressColor(t.status);
                  return (
                    <div
                      className="kanban-card"
                      key={t.id}
                      onClick={() => onOpenTask(t.id)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 5,
                          marginBottom: 4,
                        }}
                      >
                        <PriorityDot priority={t.priority} />
                        <div className="kanban-card-title">{t.title}</div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 4,
                          flexWrap: "wrap",
                          marginBottom: 6,
                        }}
                      >
                        <span className="tag">{t.category}</span>
                        {t.status === "Overdue" && <Badge label="Overdue" />}
                      </div>

                      <ProgressBar pct={t.progress} color={barColor} />

                      <div className="kanban-card-meta">
                        <div className="kanban-card-assignee">
                          <div
                            className="row-avatar"
                            style={{
                              background: color,
                              width: 18,
                              height: 18,
                              fontSize: 8,
                            }}
                          >
                            {initials(t.assignee)}
                          </div>
                          {t.assignee.split(" ")[0]}
                        </div>
                        <div
                          style={{ fontSize: 9, color: "var(--text-muted)" }}
                        >
                          {t.due.split(",")[0]}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanPanel;
