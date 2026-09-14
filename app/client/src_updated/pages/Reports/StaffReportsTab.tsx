// ═══════════════════════════════════════════════════════════
// StaffReportsTab.tsx  —  Live API data
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect } from "react";
import { analyticsAPI, tasksAPI } from "../../services/api";

const DEPT_COLORS: string[] = [
  "#EC4899",
  "#8B5CF6",
  "#2563EB",
  "#16A34A",
  "#059669",
  "#FF6A00",
];

const SkeletonRow: React.FC<{ cols: number }> = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i}>
        <div
          style={{
            height: 12,
            background: "var(--divider)",
            borderRadius: 4,
            width: "80%",
          }}
        />
      </td>
    ))}
  </tr>
);

const StaffReportsTab: React.FC = () => {
  const [staffData, setStaffData] = useState<any>(null);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState<string | null>(null);

  const [taskStats, setTaskStats] = useState<any>(null);
  const [taskLoading, setTaskLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      // Staff performance analytics
      try {
        const res = await analyticsAPI.getStaffPerformance();
        setStaffData(res.data?.data ?? res.data);
      } catch (e: any) {
        setStaffError(
          e?.response?.data?.message || "Failed to load staff data",
        );
      } finally {
        setStaffLoading(false);
      }

      // Task stats
      try {
        const res = await tasksAPI.getStats();
        setTaskStats(res.data?.result ?? res.data?.data ?? res.data);
      } catch {
        setTaskStats(null);
      } finally {
        setTaskLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Derived KPIs
  const kpi = staffData?.summary ?? staffData?.kpi ?? {};
  const totalTasks = taskStats?.total ?? kpi.totalTasks ?? 0;
  const avgCompletion = kpi.avgCompletionRate ?? kpi.completionRate ?? 0;
  const ordersProcessed = kpi.ordersProcessed ?? kpi.orders ?? 0;
  const errorRate = kpi.errorRate ?? 0;

  // Staff list
  const staffList: any[] =
    staffData?.staff ?? staffData?.members ?? staffData?.users ?? [];
  const sortedStaff = [...staffList].sort(
    (a, b) =>
      (b.score ?? b.performanceScore ?? 0) -
      (a.score ?? a.performanceScore ?? 0),
  );
  const top6 = sortedStaff.slice(0, 6);

  // Department tasks
  const deptTasks: any[] =
    staffData?.departmentTasks ??
    staffData?.byDepartment ??
    staffData?.departments ??
    [];
  const maxAssigned = deptTasks.length
    ? Math.max(...deptTasks.map((d: any) => d.assigned ?? d.total ?? 0))
    : 1;

  return (
    <>
      {/* KPI Row */}
      <div className="stats-row" style={{ marginBottom: 14 }}>
        {staffLoading || taskLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="stat-card"
                style={{ animation: "pulse 1.5s ease-in-out infinite" }}
              >
                <div
                  style={{
                    height: 10,
                    width: "60%",
                    background: "var(--divider)",
                    borderRadius: 4,
                    marginBottom: 10,
                  }}
                />
                <div
                  style={{
                    height: 24,
                    width: "40%",
                    background: "var(--divider)",
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    height: 10,
                    width: "70%",
                    background: "var(--divider)",
                    borderRadius: 4,
                  }}
                />
              </div>
            ))}
          </>
        ) : staffError ? (
          <div className="info-banner" style={{ color: "var(--red)" }}>
            <i className="fa-solid fa-circle-exclamation" />
            <div className="info-banner-text">{staffError}</div>
          </div>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">Total Tasks (MTD)</div>
                <div className="stat-icon" style={{ background: "#EFF6FF" }}>
                  <i
                    className="fa-solid fa-list-check"
                    style={{ color: "var(--blue)" }}
                  />
                </div>
              </div>
              <div className="stat-value">{totalTasks.toLocaleString()}</div>
              <div className="stat-trend up">
                <i className="fa-solid fa-arrow-trend-up" /> this month
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">Avg Completion Rate</div>
                <div className="stat-icon" style={{ background: "#F0FDF4" }}>
                  <i
                    className="fa-solid fa-circle-check"
                    style={{ color: "var(--green)" }}
                  />
                </div>
              </div>
              <div className="stat-value">
                {avgCompletion ? `${avgCompletion}%` : "—"}
              </div>
              <div className="stat-trend up">
                <i className="fa-solid fa-arrow-trend-up" /> vs last month
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">Orders Processed</div>
                <div className="stat-icon" style={{ background: "#FFF5EE" }}>
                  <i className="fa-solid fa-bag-shopping ic-orange" />
                </div>
              </div>
              <div className="stat-value">
                {ordersProcessed.toLocaleString()}
              </div>
              <div className="stat-trend up">
                <i className="fa-solid fa-arrow-trend-up" /> by sales team
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">Error Rate</div>
                <div className="stat-icon" style={{ background: "#FEF2F2" }}>
                  <i
                    className="fa-solid fa-circle-exclamation"
                    style={{ color: "var(--red)" }}
                  />
                </div>
              </div>
              <div className="stat-value">
                {errorRate ? `${errorRate}%` : "—"}
              </div>
              <div className="stat-trend up">
                <i className="fa-solid fa-arrow-trend-up" /> vs last month
              </div>
            </div>
          </>
        )}
      </div>

      {/* Performance Ranking + Dept Tasks */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-ranking-star ic-orange" /> Staff
              Performance Ranking
            </div>
          </div>
          <div className="card-body" style={{ padding: "8px 16px" }}>
            {staffLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 0",
                    borderBottom: "1px solid var(--divider)",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 12,
                      background: "var(--divider)",
                      borderRadius: 4,
                    }}
                  />
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: "var(--divider)",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        height: 11,
                        width: "60%",
                        background: "var(--divider)",
                        borderRadius: 4,
                        marginBottom: 4,
                      }}
                    />
                    <div
                      style={{
                        height: 9,
                        width: "40%",
                        background: "var(--divider)",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : top6.length ? (
              top6.map((s: any, i: number) => {
                const medals = ["🥇", "🥈", "🥉"];
                const medal = medals[i] ?? null;
                const score =
                  s.score ?? s.performanceScore ?? s.completionRate ?? 0;
                const sColor =
                  score >= 90
                    ? "var(--green)"
                    : score >= 75
                      ? "var(--accent)"
                      : "var(--red)";
                const name =
                  s.name ??
                  `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() ??
                  "—";
                const role = s.role ?? s.position ?? "—";
                const avatar =
                  s.avatar ??
                  name
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                const color = s.color ?? DEPT_COLORS[i % DEPT_COLORS.length];
                return (
                  <div
                    key={s._id ?? s.name ?? i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 0",
                      borderBottom: "1px solid var(--divider)",
                    }}
                  >
                    <div className="medal-cell">
                      {medal ? (
                        <span>{medal}</span>
                      ) : (
                        <span
                          style={{
                            color: "var(--text-muted)",
                            fontWeight: 600,
                          }}
                        >
                          {i + 1}
                        </span>
                      )}
                    </div>
                    <div
                      className="staff-avatar-sm"
                      style={{ background: `${color}20`, color }}
                    >
                      {avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {name}
                      </div>
                      <div
                        style={{ fontSize: 9.5, color: "var(--text-muted)" }}
                      >
                        {role}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{ fontSize: 13, fontWeight: 800, color: sColor }}
                      >
                        {score}%
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 12,
                  padding: "20px 0",
                  textAlign: "center",
                }}
              >
                No staff data available
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-chart-bar ic-orange" /> Tasks by
              Department
            </div>
          </div>
          <div className="card-body" style={{ padding: "10px 16px" }}>
            {staffLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      height: 10,
                      background: "var(--divider)",
                      borderRadius: 4,
                      marginBottom: 4,
                    }}
                  />
                  <div
                    style={{
                      height: 7,
                      background: "var(--divider)",
                      borderRadius: 4,
                    }}
                  />
                </div>
              ))
            ) : deptTasks.length ? (
              deptTasks.map((d: any, i: number) => {
                const assigned = d.assigned ?? d.total ?? 0;
                const done = d.done ?? d.completed ?? 0;
                const donePct =
                  assigned > 0 ? Math.round((done / assigned) * 100) : 0;
                const color = d.color ?? DEPT_COLORS[i % DEPT_COLORS.length];
                return (
                  <div key={d.name ?? i} style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 3,
                      }}
                    >
                      <span style={{ fontSize: 11.5, fontWeight: 500 }}>
                        {d.name ?? d.department}
                      </span>
                      <span
                        style={{ fontSize: 11, color: "var(--text-muted)" }}
                      >
                        {done}/{assigned} ·{" "}
                        <strong
                          style={{
                            color:
                              donePct >= 90 ? "var(--green)" : "var(--accent)",
                          }}
                        >
                          {donePct}%
                        </strong>
                      </span>
                    </div>
                    <div className="prog-bar" style={{ height: 7 }}>
                      <div
                        className="prog-fill"
                        style={{
                          width: `${maxAssigned > 0 ? (assigned / maxAssigned) * 100 : 0}%`,
                          background: color,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 12,
                  padding: "20px 0",
                  textAlign: "center",
                }}
              >
                No department data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Staff Detail Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-table" /> Staff Performance Detail
          </div>
          <div className="card-actions">
            <button
              className="t-filter-btn"
              onClick={() => analyticsAPI.exportReport("staff")}
            >
              <i className="fa-solid fa-file-export" /> Export
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Role</th>
                <th>Tasks Assigned</th>
                <th>Completed</th>
                <th>Completion %</th>
                <th>Orders</th>
                <th>Errors</th>
                <th>Error Rate</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {staffLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} cols={9} />
                ))
              ) : sortedStaff.length ? (
                sortedStaff.map((s: any, i: number) => {
                  const tasks = s.tasks ?? s.tasksAssigned ?? s.totalTasks ?? 0;
                  const done = s.done ?? s.completed ?? s.tasksCompleted ?? 0;
                  const orders = s.orders ?? s.ordersProcessed ?? 0;
                  const errors = s.errors ?? s.errorCount ?? 0;
                  const score = s.score ?? s.performanceScore ?? 0;
                  const pct = tasks > 0 ? Math.round((done / tasks) * 100) : 0;
                  const errRate =
                    orders > 0
                      ? ((errors / orders) * 100).toFixed(1) + "%"
                      : "—";
                  const sB =
                    score >= 90 ? "green" : score >= 75 ? "yellow" : "red";
                  const name =
                    s.name ??
                    `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() ??
                    "—";
                  const avatar =
                    s.avatar ??
                    name
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                  const color = s.color ?? DEPT_COLORS[i % DEPT_COLORS.length];
                  return (
                    <tr key={s._id ?? s.name ?? i}>
                      <td>
                        <div className="td-flex">
                          <div
                            className="staff-avatar-sm"
                            style={{ background: `${color}20`, color }}
                          >
                            {avatar}
                          </div>
                          <div style={{ fontWeight: 600 }}>{name}</div>
                        </div>
                      </td>
                      <td>
                        <span className="tag">
                          {s.role ?? s.position ?? "—"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>{tasks}</td>
                      <td
                        style={{
                          textAlign: "center",
                          fontWeight: 600,
                          color: "var(--green)",
                        }}
                      >
                        {done}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <div className="prog-bar" style={{ width: 44 }}>
                            <div
                              className={`prog-fill ${pct >= 90 ? "green" : pct >= 70 ? "yellow" : "red"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600 }}>
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>{orders || "—"}</td>
                      <td
                        style={{
                          textAlign: "center",
                          color:
                            errors > 5 ? "var(--red)" : "var(--text-muted)",
                        }}
                      >
                        {errors}
                      </td>
                      <td style={{ textAlign: "center" }}>{errRate}</td>
                      <td>
                        <span className={`badge ${sB}`}>{score}%</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: "center",
                      padding: "20px 0",
                      color: "var(--text-muted)",
                      fontSize: 12,
                    }}
                  >
                    No staff performance data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default StaffReportsTab;
