import React from "react";

export const WeeklyOrdersChart: React.FC = () => {
  const data = [
    { day: "Mon", value: 45 },
    { day: "Tue", value: 70 },
    { day: "Wed", value: 52 },
    { day: "Thu", value: 85 },
    { day: "Fri", value: 62 },
    { day: "Sat", value: 95 },
    { day: "Sun", value: 78 },
  ];
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div
      className="d-chart-bars"
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "6px",
        height: "80px",
      }}
    >
      {data.map((item) => (
        <div
          key={item.day}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <div
            style={{
              width: "100%",
              height: `${(item.value / maxValue) * 100}%`,
              background:
                item.day === "Sat" ? "var(--accent)" : "var(--divider)",
              borderRadius: "4px 4px 0 0",
              transition: "background 0.15s",
              cursor: "pointer",
            }}
          />
          <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
            {item.day}
          </span>
        </div>
      ))}
    </div>
  );
};
