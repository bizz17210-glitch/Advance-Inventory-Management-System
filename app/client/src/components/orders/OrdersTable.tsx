import React from "react";
import { Order } from "../../types/order";

interface OrdersTableProps {
  orders: Order[];
  onViewOrder: (orderId: string) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onViewOrder,
}) => {
  return (
    <div className="table-wrap">
      <table className="d-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              onClick={() => onViewOrder(order.id)}
              style={{ cursor: "pointer" }}
            >
              <td>
                <span
                  className="d-mono"
                  style={{ color: "var(--accent)", fontWeight: 600 }}
                >
                  {order.id}
                </span>
              </td>
              <td>{order.customer?.name ?? "—"}</td>
              <td>{order.items.length}</td>
              <td>
                <strong>₨{order.total.toLocaleString()}</strong>
              </td>
              <td>
                <span
                  className={`badge ${order.status === "Delivered" ? "green" : order.status === "Pending" ? "yellow" : "blue"}`}
                >
                  {order.status}
                </span>
              </td>
              <td>
                <span className="tag">{order.paymentType}</span>
              </td>
              <td style={{ color: "var(--text-muted)" }}>
                {new Date(order.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
