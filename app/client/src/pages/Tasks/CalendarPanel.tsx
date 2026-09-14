// ═══════════════════════════════════════════════════════════
// PANEL: Calendar  (tab → 'calendar')
// ═══════════════════════════════════════════════════════════

import React, { useState } from "react";
import type { Task } from "./types";
import { getTasksForDay } from "./helpers";
import { Badge, EmptyState, ProgressBar } from "./MicroComponents";

interface CalendarPanelProps {
  tasks: Task[];
  loading: boolean;
  onOpenTask: (id: string) => void;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDotColor(t: Task): string {
  if (t.status === "Done") return "var(--green)";
  if (t.status === "Overdue") return "var(--red)";
  if (t.status === "In Progress") return "var(--blue)";
  return "var(--text-muted)";
}

const CalendarPanel: React.FC<CalendarPanelProps> = ({
  tasks,
  loading,
  onOpenTask,
}) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState(now.getDate());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-PK", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
    setSelectedDay(1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
    setSelectedDay(1);
  };

  // Filter tasks for the viewed month/year
  const monthTasks = tasks.filter((t) => {
    if (!t.dueDateRaw) return false;
    const d = new Date(t.dueDateRaw);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const getTasksForCalDay = (day: number) =>
    monthTasks.filter((t) => new Date(t.dueDateRaw).getDate() === day);

  const dayTasks = getTasksForCalDay(selectedDay);

  // Weekly day-of-week completion rates
  const weeklyData = DAY_LABELS.map((label, idx) => {
    const dayTasks = tasks.filter((t) => {
      if (!t.dueDateRaw) return false;
      return new Date(t.dueDateRaw).getDay() === idx;
    });
    const done = dayTasks.filter((t) => t.status === "Done").length;
    const pct =
      dayTasks.length > 0 ? Math.round((done / dayTasks.length) * 100) : 0;
    return { label, pct };
  });

  return (
    <>
      {/* ── Month calendar card ── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-calendar-days ic-orange" /> {monthLabel}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="t-btn" onClick={prevMonth}>
              <i className="fa-solid fa-chevron-left" />
            </button>
            <button
              className="t-btn"
              onClick={() => {
                setYear(now.getFullYear());
                setMonth(now.getMonth());
                setSelectedDay(now.getDate());
              }}
            >
              Today
            </button>
            <button className="t-btn" onClick={nextMonth}>
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="cal-grid">
            {DAY_LABELS.map((d) => (
              <div className="cal-day-label" key={d}>
                {d}
              </div>
            ))}
          </div>

          <div className="cal-grid">
            {/* Leading empty cells */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div className="cal-cell other-month" key={`pre-${i}`}>
                <div className="cal-date">
                  {new Date(year, month, 0).getDate() - startDayOfWeek + 1 + i}
                </div>
              </div>
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const d = idx + 1;
              const dayTaskList = getTasksForCalDay(d);
              const isToday =
                d === now.getDate() &&
                month === now.getMonth() &&
                year === now.getFullYear();
              const isSelected = d === selectedDay;

              return (
                <div
                  key={d}
                  className={`cal-cell ${isToday || isSelected ? "today" : ""}`}
                  onClick={() => setSelectedDay(d)}
                >
                  <div className="cal-date">{d}</div>
                  {loading
                    ? null
                    : dayTaskList.slice(0, 3).map((t, i) => (
                        <div
                          key={i}
                          className="cal-dot"
                          style={{
                            background: getDotColor(t),
                            opacity: 0.75,
                          }}
                        />
                      ))}
                  {!loading && dayTaskList.length > 3 && (
                    <div style={{ fontSize: 8, color: "var(--text-muted)" }}>
                      +{dayTaskList.length - 3}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Trailing empty cells */}
            {Array.from({
              length: (7 - ((startDayOfWeek + daysInMonth) % 7)) % 7,
            }).map((_, i) => (
              <div className="cal-cell other-month" key={`post-${i}`}>
                <div className="cal-date">{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="detail-grid-2">
        {/* Selected day tasks */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-calendar-day" /> Tasks for {selectedDay}{" "}
              {monthLabel}
            </div>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
              {dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="card-body" style={{ padding: "8px 14px" }}>
            {dayTasks.length === 0 ? (
              <EmptyState icon="fa-calendar-xmark" title="No tasks this day" />
            ) : (
              dayTasks.map((t) => {
                const iconClass =
                  t.status === "Done"
                    ? "fa-check ic-green"
                    : t.status === "Overdue"
                      ? "fa-triangle-exclamation ic-red"
                      : "fa-clock ic-blue";
                const bgColor =
                  t.status === "Done"
                    ? "var(--green-bg)"
                    : t.status === "Overdue"
                      ? "var(--red-bg)"
                      : "var(--blue-bg)";
                return (
                  <div
                    className="list-item"
                    key={t.id}
                    onClick={() => onOpenTask(t.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="list-icon" style={{ background: bgColor }}>
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
                        {t.assignee} · {t.due}
                      </div>
                    </div>
                    <div className="list-right">
                      <Badge label={t.status} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Weekly completion overview */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-circle-info ic-blue" /> Completion by
              Day of Week
            </div>
          </div>
          <div className="card-body" style={{ padding: "8px 14px" }}>
            {weeklyData.map((w) => {
              const barColor =
                w.pct > 80
                  ? "var(--green)"
                  : w.pct > 50
                    ? "var(--blue)"
                    : "var(--accent)";
              return (
                <div className="list-item" key={w.label}>
                  <div
                    style={{
                      width: 32,
                      fontSize: 10,
                      color: "var(--text-muted)",
                      fontWeight: 500,
                    }}
                  >
                    {w.label}
                  </div>
                  <div style={{ flex: 1 }}>
                    <ProgressBar pct={w.pct} color={barColor} />
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      marginLeft: 8,
                      color: "var(--text-secondary)",
                      width: 30,
                      textAlign: "right",
                    }}
                  >
                    {w.pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default CalendarPanel;
