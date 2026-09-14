// ═══════════════════════════════════════════════════════════
// PerformanceTab.tsx — Tab 3: Performance — API-connected
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { PerfPeriod } from "./staff.types";
import { DEPT_PERFORMANCE, scoreColor, scoreFill } from "./staffData";
import { analyticsAPI } from "../../services/api";
import ProgBar from "./ProgBar";

interface LeaderRow {
  id: string;
  name: string;
  role: string;
  color: string;
  avatar: string;
  score: number;
  completed: number;
  tasks: number;
}

interface BreakdownRow {
  id: string;
  name: string;
  color: string;
  avatar: string;
  role: string;
  tasks: number;
  completed: number;
  overdue: number;
  orders: number;
  errors: number;
  score: number;
}

const ROLE_COLORS: Record<string, string> = {
  Administrator: "#FF6A00",
  OperationsManager: "#8B5CF6",
  InventoryManager: "#2563EB",
  SalesOperator: "#EC4899",
  Accounts: "#059669",
  CourierHandler: "#7C3AED",
  Rider: "#16A34A",
};

const MEDALS = ["🥇", "🥈", "🥉"];

const PerformanceTab: React.FC = () => {
  const [period, setPeriod] = useState<PerfPeriod>("month");
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownRow[]>([]);
  const [stats, setStats] = useState({
    topPerformer: "—",
    totalTasks: 0,
    avgCompletion: 0,
    overdueTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await analyticsAPI.getStaffPerformance();
        const { taskPerformance, orderProcessing, activeStaff } = res.data.data;

        // Merge task perf + order proc
        const orderMap = new Map(orderProcessing.map((o: any) => [o._id, o]));

        const rows: BreakdownRow[] = taskPerformance.map((p: any) => {
          const ord: any = orderMap.get(p._id) ?? {};
          return {
            id: p._id,
            name: p.username,
            color: ROLE_COLORS[p.role] ?? "#6B7280",
            avatar: p.username.slice(0, 2).toUpperCase(),
            role: p.role,
            tasks: p.totalTasks,
            completed: p.completed,
            overdue: Math.max(0, p.totalTasks - p.completed),
            orders: ord.ordersPlaced ?? 0,
            errors: ord.cancelledOrders ?? 0,
            score: Math.round(p.completionRate),
          };
        });

        rows.sort((a, b) => b.score - a.score);
        setBreakdown(rows);

        const leaderRows: LeaderRow[] = rows.map((r) => ({
          id: r.id,
          name: r.name,
          role: r.role,
          color: r.color,
          avatar: r.avatar,
          score: r.score,
          completed: r.completed,
          tasks: r.tasks,
        }));
        setLeaders(leaderRows);

        const totalTasks = rows.reduce((s, r) => s + r.tasks, 0);
        const totalCompleted = rows.reduce((s, r) => s + r.completed, 0);
        const avgCompletion =
          totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
        const overdueTasks = rows.reduce((s, r) => s + r.overdue, 0);
        const topPerformer = rows[0]?.name ?? "—";
        setStats({ topPerformer, totalTasks, avgCompletion, overdueTasks });
      } catch (e: any) {
        setError(
          e?.response?.data?.message ?? "Failed to load performance data.",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

  return (
    <>
      {/* ── Stat Cards ──────────────────────────────────── */}
      <div className="stats-row" style={{ marginBottom: 14 }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Top Performer</div>
            <div className="stat-icon" style={{ background: "#FFFBEB" }}>
              <i className="fa-solid fa-trophy" style={{ color: "#F59E0B" }} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: 14 }}>
            {loading ? "—" : stats.topPerformer}
          </div>
          <div className="stat-trend up">
            <i className="fa-solid fa-star" /> Highest completion rate
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Total Tasks MTD</div>
            <div className="stat-icon" style={{ background: "#EFF6FF" }}>
              <i
                className="fa-solid fa-clipboard-list"
                style={{ color: "#3B82F6" }}
              />
            </div>
          </div>
          <div className="stat-value">{loading ? "—" : stats.totalTasks}</div>
          <div className="stat-trend up">
            <i className="fa-solid fa-arrow-trend-up" /> Across all staff
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Avg Completion Rate</div>
            <div className="stat-icon" style={{ background: "#F0FDF4" }}>
              <i
                className="fa-solid fa-circle-check"
                style={{ color: "#22C55E" }}
              />
            </div>
          </div>
          <div className="stat-value">
            {loading ? "—" : `${stats.avgCompletion}%`}
          </div>
          <div className="stat-trend up">
            <i className="fa-solid fa-arrow-trend-up" /> Live from analytics
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Overdue Tasks</div>
            <div className="stat-icon" style={{ background: "#FFF5EE" }}>
              <i className="fa-solid fa-triangle-exclamation ic-orange" />
            </div>
          </div>
          <div className="stat-value">{loading ? "—" : stats.overdueTasks}</div>
          <div className="stat-trend down">
            <i className="fa-solid fa-arrow-trend-down" /> Needs attention
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "10px 14px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            marginBottom: 14,
            fontSize: 12,
            color: "#dc2626",
          }}
        >
          <i
            className="fa-solid fa-circle-exclamation"
            style={{ marginRight: 6 }}
          />
          {error}
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 14 }}>
        {/* ── Leaderboard ───────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-ranking-star ic-orange" /> Performance
              Leaderboard
            </div>
            <div className="card-actions">
              <select
                className="form-select"
                style={{ height: 26, fontSize: 11 }}
                value={period}
                onChange={(e) => setPeriod(e.target.value as PerfPeriod)}
              >
                <option value="month">This Month</option>
                <option value="week">This Week</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
          <div className="card-body" style={{ padding: "8px 16px" }}>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="leaderboard-row">
                    <div
                      style={{
                        height: 28,
                        background: "var(--divider)",
                        borderRadius: 4,
                        flex: 1,
                      }}
                    />
                  </div>
                ))
              : leaders.slice(0, 8).map((s, i) => {
                  const sc = scoreColor(s.score);
                  return (
                    <div className="leaderboard-row" key={s.id}>
                      <div className="leaderboard-rank">
                        {i < 3 ? (
                          MEDALS[i]
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
                        className="leaderboard-avatar"
                        style={{ background: `${s.color}20`, color: s.color }}
                      >
                        {s.avatar}
                      </div>
                      <div className="leaderboard-info">
                        <div style={{ fontSize: 12, fontWeight: 600 }}>
                          {s.name}
                        </div>
                        <div
                          style={{ fontSize: 10, color: "var(--text-muted)" }}
                        >
                          {s.role}
                        </div>
                      </div>
                      <div className="leaderboard-score">
                        <div
                          style={{ fontSize: 13, fontWeight: 800, color: sc }}
                        >
                          {s.score}%
                        </div>
                        <div
                          style={{ fontSize: 9.5, color: "var(--text-muted)" }}
                        >
                          {s.completed}/{s.tasks} tasks
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>

        {/* ── Department Performance ─────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-chart-bar ic-orange" /> Department
              Performance
            </div>
          </div>
          <div className="card-body" style={{ padding: "10px 16px" }}>
            {DEPT_PERFORMANCE.map((d) => (
              <div className="dept-perf-row" key={d.dept}>
                <div className="dept-perf-label">{d.dept}</div>
                <div className="prog-bar" style={{ flex: 1, height: 10 }}>
                  <div
                    className="prog-fill"
                    style={{
                      width: `${d.score}%`,
                      background:
                        d.score >= 90
                          ? "var(--green)"
                          : d.score >= 75
                            ? "var(--accent)"
                            : "#DC2626",
                      borderRadius: 2,
                    }}
                  />
                </div>
                <div className="dept-perf-val">{d.score}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Individual Performance Table ────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-user-chart" /> Individual Performance
            Breakdown
          </div>
          <div className="card-actions">
            <button className="t-filter-btn" onClick={() => setPeriod(period)}>
              <i className="fa-solid fa-rotate-right" /> Refresh
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Role</th>
                <th>Tasks</th>
                <th>Completed</th>
                <th>Overdue</th>
                <th>Completion Rate</th>
                <th>Orders</th>
                <th>Cancelled</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j}>
                        <div
                          style={{
                            height: 10,
                            background: "var(--divider)",
                            borderRadius: 3,
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : breakdown.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <i className="fa-solid fa-chart-bar" />
                      <h4>No performance data</h4>
                      <p>
                        Performance data will appear once staff have active
                        tasks.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                breakdown.map((s) => {
                  const pct =
                    s.tasks > 0 ? Math.round((s.completed / s.tasks) * 100) : 0;
                  const fill = scoreFill(s.score);
                  const scoreBadge =
                    s.score >= 90 ? "green" : s.score >= 75 ? "yellow" : "red";
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="td-flex">
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: "50%",
                              background: `${s.color}20`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 9,
                              fontWeight: 700,
                              color: s.color,
                            }}
                          >
                            {s.avatar}
                          </div>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                        </div>
                      </td>
                      <td>
                        <span className="tag">{s.role}</span>
                      </td>
                      <td style={{ textAlign: "center" }}>{s.tasks}</td>
                      <td
                        style={{
                          textAlign: "center",
                          color: "var(--green)",
                          fontWeight: 600,
                        }}
                      >
                        {s.completed}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          color:
                            s.overdue > 5 ? "var(--red)" : "var(--text-muted)",
                        }}
                      >
                        {s.overdue}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <ProgBar pct={pct} fill={fill} width={50} />
                          <span style={{ fontSize: 11, fontWeight: 600 }}>
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>{s.orders || "—"}</td>
                      <td
                        style={{
                          textAlign: "center",
                          color:
                            s.errors > 5 ? "var(--red)" : "var(--text-muted)",
                        }}
                      >
                        {s.errors}
                      </td>
                      <td>
                        <span className={`badge ${scoreBadge}`}>
                          {s.score}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default PerformanceTab;
