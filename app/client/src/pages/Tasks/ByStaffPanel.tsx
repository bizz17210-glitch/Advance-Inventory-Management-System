// ═══════════════════════════════════════════════════════════
// PANEL: By Staff  (tab → 'bystaff')
// ═══════════════════════════════════════════════════════════

import React from "react";
import type { Task } from "./types";
import { getStaffColor, initials } from "./helpers";
import { Badge, ProgressBar } from "./MicroComponents";

interface ByStaffPanelProps {
  tasks: Task[];
  loading: boolean;
  onOpenTask: (id: string) => void;
}

const MEDALS = ["🥇", "🥈", "🥉"];

const ByStaffPanel: React.FC<ByStaffPanelProps> = ({
  tasks,
  loading,
  onOpenTask,
}) => {
  // Group tasks by assignee
  const grouped: Record<string, Task[]> = {};
  tasks.forEach((t) => {
    if (!grouped[t.assignee]) grouped[t.assignee] = [];
    grouped[t.assignee].push(t);
  });

  const staffRates = Object.entries(grouped).map(([name, staffTasks]) => ({
    name,
    pct: Math.round(
      (staffTasks.filter((t) => t.status === "Done").length /
        staffTasks.length) *
        100,
    ),
  }));

  const topPerformers = [...staffRates]
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="tasks-layout">
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="staff-col" key={i} style={{ marginBottom: 10 }}>
              <div className="staff-col-head">
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "var(--divider)",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      height: 10,
                      borderRadius: 3,
                      background: "var(--divider)",
                      width: "50%",
                      marginBottom: 6,
                    }}
                  />
                  <div
                    style={{
                      height: 8,
                      borderRadius: 3,
                      background: "var(--divider)",
                      width: "35%",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div />
      </div>
    );
  }

  return (
    <div className="tasks-layout">
      {/* ── Left: grouped task lists ── */}
      <div>
        {Object.entries(grouped).map(([name, staffTasks]) => {
          const color = getStaffColor(name);
          const done = staffTasks.filter((t) => t.status === "Done").length;
          const total = staffTasks.length;
          const pct = Math.round((done / total) * 100);
          const pctColor =
            pct === 100
              ? "var(--green)"
              : pct > 50
                ? "var(--blue)"
                : "var(--accent)";

          return (
            <div className="staff-col" key={name}>
              <div className="staff-col-head">
                <div
                  className="row-avatar"
                  style={{
                    background: color,
                    width: 30,
                    height: 30,
                    fontSize: 11,
                  }}
                >
                  {initials(name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{ fontSize: 13, fontWeight: 800, color: pctColor }}
                  >
                    {pct}%
                  </div>
                  <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>
                    {done}/{total} done
                  </div>
                </div>
              </div>

              <div className="staff-col-body">
                <div className="prog-bar" style={{ marginBottom: 8 }}>
                  <div
                    className="prog-fill"
                    style={{ width: `${pct}%`, background: pctColor }}
                  />
                </div>

                {staffTasks.map((t) => {
                  const iconClass =
                    t.status === "Done"
                      ? "fa-circle-check ic-green"
                      : t.status === "Overdue"
                        ? "fa-triangle-exclamation ic-red"
                        : t.status === "In Progress"
                          ? "fa-spinner ic-blue"
                          : t.status === "Cancelled"
                            ? "fa-ban ic-muted"
                            : "fa-clock ic-muted";

                  const bgColor =
                    t.status === "Done"
                      ? "var(--green-bg)"
                      : t.status === "Overdue"
                        ? "var(--red-bg)"
                        : t.status === "In Progress"
                          ? "var(--blue-bg)"
                          : "var(--bg)";

                  return (
                    <div
                      className="list-item"
                      key={t.id}
                      onClick={() => onOpenTask(t.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <div
                        className="list-icon"
                        style={{ background: bgColor }}
                      >
                        <i
                          className={`fa-solid ${iconClass}`}
                          style={{ fontSize: 10 }}
                        />
                      </div>
                      <div className="list-content">
                        <div
                          className="list-title"
                          style={{ fontSize: "10.5px" }}
                        >
                          {t.title}
                        </div>
                        <div className="list-meta">
                          {t.category} · Due: {t.due}
                        </div>
                      </div>
                      <div className="list-right">
                        <Badge label={t.priority} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Right: sidebar cards ── */}
      <div>
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-chart-simple ic-orange" /> Staff
              Completion Rates
            </div>
          </div>
          <div className="card-body" style={{ padding: "8px 14px" }}>
            {staffRates.map((s) => {
              const color = getStaffColor(s.name);
              const pctColor =
                s.pct === 100
                  ? "var(--green)"
                  : s.pct > 50
                    ? "var(--blue)"
                    : "var(--accent)";
              return (
                <div className="list-item" key={s.name}>
                  <div
                    className="row-avatar"
                    style={{
                      background: color,
                      width: 22,
                      height: 22,
                      fontSize: 9,
                      flexShrink: 0,
                    }}
                  >
                    {initials(s.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 500,
                        marginBottom: 3,
                      }}
                    >
                      {s.name.split(" ")[0]}
                    </div>
                    <ProgressBar pct={s.pct} color={pctColor} />
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: pctColor,
                      marginLeft: 8,
                    }}
                  >
                    {s.pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i
                className="fa-solid fa-trophy"
                style={{ color: "var(--yellow)" }}
              />{" "}
              Top Performers
            </div>
          </div>
          <div className="card-body" style={{ padding: "8px 14px" }}>
            {topPerformers.map((s, i) => {
              const color = getStaffColor(s.name);
              return (
                <div className="list-item" key={s.name}>
                  <div style={{ fontSize: 16, lineHeight: 1, marginTop: 2 }}>
                    {MEDALS[i]}
                  </div>
                  <div
                    className="row-avatar"
                    style={{
                      background: color,
                      width: 24,
                      height: 24,
                      fontSize: 9,
                    }}
                  >
                    {initials(s.name)}
                  </div>
                  <div className="list-content">
                    <div style={{ fontSize: 11, fontWeight: 600 }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>
                      {s.pct}% completion rate
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ByStaffPanel;
