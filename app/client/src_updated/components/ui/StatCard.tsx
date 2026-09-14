import React from "react";
// import './StatCard.css'; // Or use CSS modules

interface StatCardProps {
  value: string;
  label: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    text: string;
  };
}

export const StatCard: React.FC<StatCardProps> = ({ value, label, trend }) => {
  const getTrendClass = () => {
    if (!trend) return "";
    switch (trend.direction) {
      case "up":
        return "ms-trend up";
      case "down":
        return "ms-trend down";
      default:
        return "ms-trend neutral";
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case "up":
        return <i className="fa-solid fa-arrow-trend-up" />;
      case "down":
        return <i className="fa-solid fa-triangle-exclamation" />;
      default:
        return <i className="fa-solid fa-minus" />;
    }
  };

  return (
    <div className="stat-card">
      <div className="stat-num">{value}</div>
      <div className="stat-label">{label}</div>
      {trend && (
        <div className={getTrendClass()}>
          {getTrendIcon()} {trend.text}
        </div>
      )}
    </div>
  );
};
