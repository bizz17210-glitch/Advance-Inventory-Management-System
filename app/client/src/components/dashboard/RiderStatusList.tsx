// ─── components/dashboard/RiderStatusList.tsx ────────────────

import React from "react";
import { RiderStatus } from "../../types/dashboard";

interface RiderStatusListProps {
  riders: RiderStatus[];
  onManage: () => void;
}

const RiderStatusList: React.FC<RiderStatusListProps> = ({
  riders,
  onManage,
}) => {
  const onlineCount = riders.filter((r) => r.isOnline).length;
  const offlineCount = riders.filter((r) => !r.isOnline).length;
  const activeDeliveries = riders.filter((r) => r.orderId !== null).length;

  return (
    <div className="d-card">
      <div className="d-card-header">
        <div className="d-card-title">
          <i className="fa-solid fa-person-biking" /> Rider Status
        </div>
        <button className="d-btn sm" onClick={onManage}>
          Manage
        </button>
      </div>

      <div className="d-card-body">
        {/* Summary pills */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
          {[
            { value: onlineCount, label: "Online", color: "var(--green)" },
            {
              value: activeDeliveries,
              label: "Active Deliveries",
              color: "var(--text-primary)",
            },
            { value: offlineCount, label: "Offline", color: "var(--yellow)" },
          ].map((pill) => (
            <div
              key={pill.label}
              style={{
                flex: 1,
                background: "var(--bg)",
                borderRadius: "8px",
                padding: "8px 10px",
                textAlign: "center",
              }}
            >
              <div
                style={{ fontSize: "18px", fontWeight: 800, color: pill.color }}
              >
                {pill.value}
              </div>
              <div
                className="d-kpi-label"
                style={{ color: "var(--text-faint)", marginTop: "2px" }}
              >
                {pill.label}
              </div>
            </div>
          ))}
        </div>

        {/* Rider list */}
        {riders.map((rider) => (
          <div className="d-courier-row" key={rider.initials}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                flexShrink: 0,
                background: rider.isOnline
                  ? "var(--green)"
                  : "var(--text-faint)",
              }}
            />
            <div
              className="d-avatar"
              style={{ background: rider.avatarBg, color: rider.avatarColor }}
            >
              {rider.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: 600 }}>
                {rider.name}
              </div>
              <div className="d-td-sub">
                {rider.orderId
                  ? `${rider.orderId} · ${rider.location}`
                  : rider.location}
              </div>
            </div>
            <span className={`d-badge ${rider.statusBadge}`}>
              {rider.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiderStatusList;
