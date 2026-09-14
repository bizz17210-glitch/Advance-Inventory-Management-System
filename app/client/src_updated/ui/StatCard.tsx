import React from "react";

export interface StatCardProps {
  label: string;
  value: string | number;
  trend: string;
  trendDirection: "up" | "down" | "neutral";
  icon: string;
  color: "orange" | "green" | "yellow" | "red" | "blue" | "purple";
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  trend,
  trendDirection,
  icon,
  color,
  onClick,
  className = "",
}) => {
  const trendClass = `stat-trend ${trendDirection}`;
  const iconBg = `var(--${color}-bg)`;
  const iconClass = `ic-${color}`;

  return (
    <div
      className={`stat-card ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => onClick && e.key === "Enter" && onClick()}
    >
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        <div className="stat-icon" style={{ background: iconBg }}>
          <i className={`fa-solid ${icon} ${iconClass}`}></i>
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className={trendClass}>
        {trendDirection === "up" && (
          <i className="fa-solid fa-arrow-trend-up"></i>
        )}
        {trendDirection === "down" && (
          <i className="fa-solid fa-arrow-trend-down"></i>
        )}
        {trendDirection === "neutral" && <i className="fa-solid fa-minus"></i>}
        <span>{trend}</span>
      </div>
    </div>
  );
};
