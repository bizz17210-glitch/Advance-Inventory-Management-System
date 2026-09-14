// ─── components/dashboard/ActivityFeed.tsx ───────────────────

import React from "react";
import { ActivityItem } from "../../types/dashboard";

interface ActivityFeedProps {
  items: ActivityItem[];
  onViewAll: () => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ items, onViewAll }) => (
  <div className="d-card">
    <div className="d-card-header">
      <div className="d-card-title">
        <i className="fa-solid fa-clock-rotate-left" /> Recent Activity
      </div>
      <button className="d-btn sm" onClick={onViewAll}>
        View All
      </button>
    </div>

    <div className="d-card-body-flush">
      {items.map((item, idx) => (
        <div className="d-list-item" key={idx}>
          <div className="d-list-icon" style={{ background: item.iconBg }}>
            <i
              className={`fa-solid ${item.iconClass}`}
              style={{ color: item.iconColor, fontSize: "11px" }}
            />
          </div>

          <div className="d-list-body">
            <div className="d-list-title">{item.title}</div>
            <div className="d-list-meta">{item.meta}</div>
          </div>

          <div className="d-list-right">
            {item.badge ? (
              <span className={`d-badge ${item.badge.color}`}>
                {item.badge.label}
              </span>
            ) : item.value ? (
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--green)",
                }}
              >
                {item.value}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ActivityFeed;
