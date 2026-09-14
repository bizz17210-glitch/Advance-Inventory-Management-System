// ─── components/dashboard/WeeklyOrdersChart.tsx ──────────────

import React from "react";
import { WeekBar } from "../../types/dashboard";

interface WeekSummary {
  totalOrders: number;
  delivered: number;
  pending: number;
  cancelled: number;
}

interface WeeklyOrdersChartProps {
  bars: WeekBar[];
  summary?: WeekSummary; // if not passed, shows skeleton dashes
}

const WeeklyOrdersChart: React.FC<WeeklyOrdersChartProps> = ({
  bars,
  summary,
}) => {
  const summaryItems = [
    {
      label: "Total Orders",
      value: summary ? summary.totalOrders.toLocaleString() : "—",
      color: "var(--text-primary)",
    },
    {
      label: "Delivered",
      value: summary ? summary.delivered.toLocaleString() : "—",
      color: "var(--green)",
    },
    {
      label: "Pending",
      value: summary ? summary.pending.toLocaleString() : "—",
      color: "var(--yellow)",
    },
    {
      label: "Cancelled",
      value: summary ? summary.cancelled.toLocaleString() : "—",
      color: "var(--red)",
    },
  ];

  return (
    <div className="d-card">
      <div className="d-card-header">
        <div className="d-card-title">
          <i className="fa-solid fa-chart-bar" /> Orders This Week
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <span className="d-tag">Daily</span>
          <button className="d-btn sm">
            <i className="fa-solid fa-arrow-up-right-from-square" />
          </button>
        </div>
      </div>

      <div className="d-card-body">
        {/* Summary row — now driven by props */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "14px" }}>
          {summaryItems.map((item, i) => (
            <React.Fragment key={item.label}>
              {i > 0 && (
                <div style={{ width: "1px", background: "var(--divider)" }} />
              )}
              <div>
                <div
                  className="d-kpi-label"
                  style={{ color: "var(--text-faint)", marginBottom: "4px" }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: item.color,
                    letterSpacing: "-0.3px",
                  }}
                >
                  {item.value}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Bars — already dynamic from props */}
        <div className="d-chart-bars">
          {bars.map((bar) => (
            <div className="d-bar-wrap" key={bar.day}>
              <div
                className={`d-bar ${bar.variant === "default" ? "" : bar.variant}`}
                style={{ height: `${bar.heightPct}%` }}
              />
              <div className="d-bar-label">{bar.day}</div>
            </div>
          ))}
        </div>

        <hr className="d-hr" />

        <div style={{ display: "flex", gap: "12px" }}>
          {[
            { color: "var(--accent)", label: "Current Week" },
            { color: "var(--divider)", label: "Last Week" },
          ].map((leg) => (
            <div
              key={leg.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "10.5px",
                color: "var(--text-muted)",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "2px",
                  background: leg.color,
                }}
              />
              {leg.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyOrdersChart;
