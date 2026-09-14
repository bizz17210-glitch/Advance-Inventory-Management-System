// ─── components/dashboard/RecentOrdersTable.tsx ──────────────

import React from "react";
import { RecentOrder } from "../../types/dashboard";

interface RecentOrdersTableProps {
  orders: RecentOrder[];
  pendingCount: number;
  onViewAll: () => void;
  onRowClick: (orderId: string) => void;
}

const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({
  orders,
  pendingCount,
  onViewAll,
  onRowClick,
}) => (
  <div className="d-card">
    <div className="d-card-header">
      <div className="d-card-title">
        <i className="fa-solid fa-list-check" /> Recent Orders
      </div>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <span className="d-badge yellow">{pendingCount} Pending</span>
        <button className="d-btn sm" onClick={onViewAll}>
          View All
        </button>
      </div>
    </div>

    <div className="d-table-wrap">
      <table className="d-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Value</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} onClick={() => onRowClick(order.id)}>
              <td>
                <span
                  className="d-mono"
                  style={{
                    color:
                      order.statusBadge === "yellow"
                        ? "var(--accent)"
                        : "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  {order.id}
                </span>
              </td>
              <td>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    className="d-avatar"
                    style={{
                      background: order.avatarBg,
                      color: order.avatarColor,
                      fontSize: "9px",
                    }}
                  >
                    {order.customerInitials}
                  </div>
                  {order.customerName}
                </div>
              </td>
              <td>{order.items}</td>
              <td>
                <strong>{order.total}</strong>
              </td>
              <td>
                <span className={`d-badge ${order.statusBadge}`}>
                  {order.status}
                </span>
              </td>
              <td>
                {order.paymentType === "Prepaid" ? (
                  <span
                    className="d-tag"
                    style={{ color: "var(--green)", borderColor: "#A7F3D0" }}
                  >
                    Prepaid
                  </span>
                ) : (
                  <span className="d-tag">COD</span>
                )}
              </td>
              <td style={{ color: "var(--text-faint)" }}>{order.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default RecentOrdersTable;
