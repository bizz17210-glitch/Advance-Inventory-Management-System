// ═══════════════════════════════════════════════════════════
// SalesReportsTab.tsx  —  Live API data
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect } from "react";
import {
  RevenuePeriod,
  ChartDataPoint,
  fmt,
  fmtL,
  CATEGORY_COLORS,
} from "./ReportsShared";
import { analyticsAPI } from "../../services/api";

// ── Revenue Bar Chart ────────────────────────────────────────
interface RevenueChartProps {
  data: ChartDataPoint[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVal = Math.max(...data.map((d) => d.val), 1);
  const H = 130;
  const barH = (val: number) =>
    Math.max(4, Math.round((val / maxVal) * (H - 24)));

  return (
    <div className="revenue-chart-container">
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 3,
          height: H,
          paddingBottom: 20,
          position: "relative",
        }}
      >
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 2,
              height: "100%",
              cursor: "pointer",
              position: "relative",
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {hovered === i && (
              <div
                style={{
                  position: "absolute",
                  background: "#1F2937",
                  color: "#fff",
                  fontSize: 9.5,
                  padding: "3px 7px",
                  borderRadius: 4,
                  whiteSpace: "nowrap",
                  bottom: barH(d.val) + 24,
                  zIndex: 10,
                }}
              >
                {fmtL(d.val)}
              </div>
            )}
            <div
              className="rep-bar"
              style={{
                width: "100%",
                height: barH(d.val),
                background: hovered === i ? "#E65C00" : "#FF6A00",
                borderRadius: "3px 3px 0 0",
              }}
            />
            <div
              style={{
                fontSize: 8.5,
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
                textAlign: "center",
              }}
            >
              {d.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Skeleton ─────────────────────────────────────────────────
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

const SkeletonCard: React.FC = () => (
  <div
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
);

// ── Main Tab ─────────────────────────────────────────────────
const SalesReportsTab: React.FC = () => {
  const [period, setPeriod] = useState<RevenuePeriod>("weekly");

  // API state
  const [salesData, setSalesData] = useState<any>(null);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState<string | null>(null);

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Fetch sales analytics on mount
  useEffect(() => {
    const fetchSales = async () => {
      setSalesLoading(true);
      setSalesError(null);
      try {
        const res = await analyticsAPI.getSales();
        setSalesData(res.data?.data ?? res.data);
      } catch (e: any) {
        setSalesError(
          e?.response?.data?.message || "Failed to load sales data",
        );
      } finally {
        setSalesLoading(false);
      }
    };
    fetchSales();
  }, []);

  // Fetch chart data when period changes
  useEffect(() => {
    const fetchChart = async () => {
      setChartLoading(true);
      try {
        const groupBy =
          period === "daily" ? "day" : period === "monthly" ? "month" : "week";
        const res = await analyticsAPI.getSales({ groupBy });
        const raw = res.data?.data ?? res.data;
        // Map API response to ChartDataPoint — adjust keys as your backend returns
        const mapped: ChartDataPoint[] = (raw?.trend ?? raw?.chart ?? []).map(
          (p: any) => ({
            label: p.label ?? p.date ?? p.period ?? "",
            val: p.revenue ?? p.total ?? p.value ?? 0,
          }),
        );
        setChartData(mapped.length ? mapped : []);
      } catch {
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    };
    fetchChart();
  }, [period]);

  // Derived KPIs from API
  const kpi = salesData?.summary ?? salesData?.kpi ?? {};
  const totalRevenue = kpi.totalRevenue ?? kpi.revenue ?? 0;
  const totalOrders = kpi.totalOrders ?? kpi.orders ?? 0;
  const avgOrderValue = kpi.avgOrderValue ?? kpi.aov ?? 0;
  const convRate = kpi.conversionRate ?? kpi.conversion ?? 0;

  // Top products from API
  const topProducts: any[] =
    salesData?.topProducts ?? salesData?.products ?? [];

  // Category sales from API
  const categorySales: any[] =
    salesData?.categorySales ?? salesData?.categories ?? [];

  // Sales by channel
  const channels: any[] =
    salesData?.channels ?? salesData?.salesByChannel ?? [];

  // Daily rows for table
  const dailyRows: any[] =
    salesData?.daily ?? salesData?.dailySales ?? salesData?.orders ?? [];

  return (
    <>
      {/* KPI Row */}
      <div className="stats-row" style={{ marginBottom: 14 }}>
        {salesLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : salesError ? (
          <div className="info-banner" style={{ color: "var(--red)" }}>
            <i className="fa-solid fa-circle-exclamation" />
            <div className="info-banner-text">{salesError}</div>
          </div>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">Total Revenue (MTD)</div>
                <div className="stat-icon" style={{ background: "#FFF5EE" }}>
                  <i className="fa-solid fa-sack-dollar ic-orange" />
                </div>
              </div>
              <div className="stat-value">{fmtL(totalRevenue)}</div>
              <div className="stat-trend up">
                <i className="fa-solid fa-arrow-trend-up" />{" "}
                {kpi.revenueGrowth
                  ? `+${kpi.revenueGrowth}% vs last month`
                  : "vs last month"}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">Total Orders (MTD)</div>
                <div className="stat-icon" style={{ background: "#EFF6FF" }}>
                  <i
                    className="fa-solid fa-bag-shopping"
                    style={{ color: "var(--blue)" }}
                  />
                </div>
              </div>
              <div className="stat-value">{totalOrders.toLocaleString()}</div>
              <div className="stat-trend up">
                <i className="fa-solid fa-arrow-trend-up" />{" "}
                {kpi.ordersGrowth
                  ? `+${kpi.ordersGrowth} vs last month`
                  : "this month"}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">Avg. Order Value</div>
                <div className="stat-icon" style={{ background: "#F0FDF4" }}>
                  <i
                    className="fa-solid fa-receipt"
                    style={{ color: "var(--green)" }}
                  />
                </div>
              </div>
              <div className="stat-value">{fmt(avgOrderValue)}</div>
              <div className="stat-trend up">
                <i className="fa-solid fa-arrow-trend-up" /> per order
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">Conversion Rate</div>
                <div className="stat-icon" style={{ background: "#FFFBEB" }}>
                  <i
                    className="fa-solid fa-bullseye"
                    style={{ color: "var(--yellow)" }}
                  />
                </div>
              </div>
              <div className="stat-value">
                {convRate ? `${convRate}%` : "—"}
              </div>
              <div className="stat-trend up">
                <i className="fa-solid fa-arrow-trend-up" /> vs last month
              </div>
            </div>
          </>
        )}
      </div>

      {/* Revenue Trend + Sales by Channel */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-chart-line ic-orange" /> Revenue Trend
            </div>
            <div className="card-actions">
              <select
                className="form-select"
                style={{ height: 26, fontSize: 11 }}
                value={period}
                onChange={(e) => setPeriod(e.target.value as RevenuePeriod)}
              >
                <option value="daily">Last 14 Days</option>
                <option value="weekly">Last 8 Weeks</option>
                <option value="monthly">Last 6 Months</option>
              </select>
            </div>
          </div>
          <div className="card-body" style={{ padding: "12px 16px" }}>
            {chartLoading ? (
              <div
                style={{
                  height: 130,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  fontSize: 12,
                }}
              >
                <i
                  className="fa-solid fa-spinner fa-spin"
                  style={{ marginRight: 6 }}
                />{" "}
                Loading chart...
              </div>
            ) : chartData.length ? (
              <RevenueChart data={chartData} />
            ) : (
              <div
                style={{
                  height: 130,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  fontSize: 12,
                }}
              >
                No data for this period
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-chart-pie ic-orange" /> Sales by Channel
            </div>
          </div>
          <div className="card-body" style={{ padding: "12px 16px" }}>
            {salesLoading ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div
                      style={{
                        height: 10,
                        background: "var(--divider)",
                        borderRadius: 4,
                        marginBottom: 6,
                        width: "60%",
                      }}
                    />
                    <div
                      style={{
                        height: 8,
                        background: "var(--divider)",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : channels.length ? (
              channels.map((c: any) => (
                <div key={c.name ?? c.source} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <div
                        className="channel-dot"
                        style={{ background: c.color ?? "#FF6A00" }}
                      />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>
                        {c.name ?? c.source}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>
                        {typeof c.val === "number" ? fmtL(c.val) : c.val}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          marginLeft: 4,
                        }}
                      >
                        {c.pct ?? c.percentage ?? 0}%
                      </span>
                    </div>
                  </div>
                  <div className="prog-bar" style={{ height: 8 }}>
                    <div
                      className="prog-fill"
                      style={{
                        width: `${c.pct ?? c.percentage ?? 0}%`,
                        background: c.color ?? "#FF6A00",
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 12,
                  padding: "20px 0",
                  textAlign: "center",
                }}
              >
                No channel data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Products + Category Sales */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-fire ic-orange" /> Top Selling Products
            </div>
          </div>
          <div className="card-body" style={{ padding: "0 16px" }}>
            {salesLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="list-item" style={{ padding: "7px 0" }}>
                  <div
                    style={{
                      width: 20,
                      height: 12,
                      background: "var(--divider)",
                      borderRadius: 4,
                    }}
                  />
                  <div className="list-content">
                    <div
                      style={{
                        height: 12,
                        width: "70%",
                        background: "var(--divider)",
                        borderRadius: 4,
                        marginBottom: 4,
                      }}
                    />
                    <div
                      style={{
                        height: 10,
                        width: "40%",
                        background: "var(--divider)",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : topProducts.length ? (
              topProducts.slice(0, 6).map((p: any, i: number) => (
                <div
                  key={p.sku ?? p._id ?? i}
                  className="list-item"
                  style={{ padding: "7px 0" }}
                >
                  <div
                    style={{
                      width: 20,
                      textAlign: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: i < 3 ? "var(--accent)" : "var(--text-muted)",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="list-content">
                    <div className="list-title">{p.name ?? p.productName}</div>
                    <div className="list-meta">{p.sku}</div>
                  </div>
                  <div className="list-right">
                    <div style={{ fontSize: 12, fontWeight: 700 }}>
                      {typeof p.revenue === "number"
                        ? fmtL(p.revenue)
                        : p.revenue}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                      {p.sold ?? p.unitsSold ?? 0} units ·{" "}
                      <i
                        className={`fa-solid fa-arrow-trend-${p.trend ?? "up"}`}
                        style={{
                          color:
                            (p.trend ?? "up") === "up"
                              ? "var(--green)"
                              : "var(--red)",
                          fontSize: 9,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 12,
                  padding: "20px 0",
                  textAlign: "center",
                }}
              >
                No product data available
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-tags ic-orange" /> Sales by Category
            </div>
          </div>
          <div className="card-body" style={{ padding: "10px 16px" }}>
            {salesLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 9,
                  }}
                >
                  <div
                    style={{
                      width: 58,
                      height: 10,
                      background: "var(--divider)",
                      borderRadius: 4,
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      height: 9,
                      background: "var(--divider)",
                      borderRadius: 4,
                    }}
                  />
                </div>
              ))
            ) : categorySales.length ? (
              (() => {
                const max = Math.max(
                  ...categorySales.map((c: any) => c.val ?? c.revenue ?? 0),
                  1,
                );
                return categorySales.map((c: any, i: number) => {
                  const val = c.val ?? c.revenue ?? 0;
                  const color =
                    c.color ??
                    CATEGORY_COLORS[c.name] ??
                    `hsl(${i * 50}, 65%, 50%)`;
                  return (
                    <div
                      key={c.name ?? i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 9,
                      }}
                    >
                      <div
                        style={{
                          width: 58,
                          fontSize: 11,
                          color: "var(--text-muted)",
                          flexShrink: 0,
                        }}
                      >
                        {c.name}
                      </div>
                      <div className="prog-bar" style={{ flex: 1, height: 9 }}>
                        <div
                          className="prog-fill"
                          style={{
                            width: `${(val / max) * 100}%`,
                            background: color,
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      <div
                        style={{
                          width: 52,
                          textAlign: "right",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {fmtL(val)}
                      </div>
                    </div>
                  );
                });
              })()
            ) : (
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 12,
                  padding: "20px 0",
                  textAlign: "center",
                }}
              >
                No category data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Sales Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-table" /> Daily Sales Summary
          </div>
          <div className="card-actions">
            <button
              className="t-filter-btn"
              onClick={() => analyticsAPI.exportReport("sales")}
            >
              <i className="fa-solid fa-file-export" /> Export CSV
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Orders</th>
                <th>Units Sold</th>
                <th>Revenue</th>
                <th>COD</th>
                <th>Prepaid</th>
                <th>Returns</th>
                <th>Net Revenue</th>
                <th>vs Prev Day</th>
              </tr>
            </thead>
            <tbody>
              {salesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} cols={9} />
                ))
              ) : dailyRows.length ? (
                dailyRows.map((d: any, i: number) => {
                  const prev = dailyRows[i + 1];
                  const rev = d.revenue ?? d.total ?? 0;
                  const prevRev = prev ? (prev.revenue ?? prev.total ?? 0) : 0;
                  const diff = prev ? rev - prevRev : 0;
                  const diffColor = diff >= 0 ? "var(--green)" : "var(--red)";
                  const diffIcon =
                    diff >= 0 ? "arrow-trend-up" : "arrow-trend-down";
                  return (
                    <tr key={d.date ?? d._id ?? i}>
                      <td style={{ fontWeight: 600 }}>
                        {d.date ?? d.createdAt}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {d.orders ?? d.orderCount ?? 0}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {d.units ?? d.unitsSold ?? 0}
                      </td>
                      <td>
                        <strong>{fmt(rev)}</strong>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {fmt(d.cod ?? d.codAmount ?? 0)}
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {fmt(d.prepaid ?? d.prepaidAmount ?? 0)}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          color:
                            (d.returns ?? 0) > 0
                              ? "var(--red)"
                              : "var(--text-muted)",
                        }}
                      >
                        {d.returns ?? 0}
                      </td>
                      <td>
                        <strong style={{ color: "var(--green)" }}>
                          {fmt(d.net ?? d.netRevenue ?? rev)}
                        </strong>
                      </td>
                      <td>
                        {prev ? (
                          <span
                            style={{
                              color: diffColor,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            <i
                              className={`fa-solid fa-${diffIcon}`}
                              style={{ fontSize: 9 }}
                            />{" "}
                            {fmtL(Math.abs(diff))}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
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
                    No daily sales data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {dailyRows.length > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing <strong>1–{dailyRows.length}</strong> records
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SalesReportsTab;
