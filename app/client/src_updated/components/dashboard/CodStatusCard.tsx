// ─── components/dashboard/CodStatusCard.tsx ──────────────────

import React from "react";
import { CodRing } from "../../types/dashboard";

interface CodStatusCardProps {
  rings: CodRing[];
  onViewCouriers: () => void;
  onNewOrder: () => void;
  onAddProduct: () => void;
  onLogCod: () => void;
  onExportReport: () => void;
}

const CodStatusCard: React.FC<CodStatusCardProps> = ({
  rings,
  onViewCouriers,
  onNewOrder,
  onAddProduct,
  onLogCod,
  onExportReport,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
    {/* COD Rings */}
    <div className="d-card">
      <div className="d-card-header">
        <div className="d-card-title">
          <i className="fa-solid fa-coins" /> COD Status
        </div>
        <button className="d-btn sm" onClick={onViewCouriers}>
          View
        </button>
      </div>

      <div className="d-card-body">
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            padding: "4px 0 2px",
          }}
        >
          {rings.map((ring) => (
            <div className="d-ring-wrap" key={ring.label}>
              <div className={`d-ring ${ring.ringClass}`}>{ring.pct}</div>
              <div className="d-ring-lbl">
                {ring.label}
                <br />
                {ring.subLabel}
              </div>
            </div>
          ))}
        </div>

        <hr className="d-hr" />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
          }}
        >
          {[
            {
              value: "₨84K",
              label: "Outstanding",
              color: "var(--text-primary)",
            },
            { value: "₨12K", label: "Overdue", color: "var(--red)" },
            { value: "₨2.14L", label: "Collected", color: "var(--green)" },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, color: item.color }}>
                {item.value}
              </div>
              <div
                className="d-kpi-label"
                style={{ color: "var(--text-faint)", marginTop: "2px" }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="d-card">
      <div className="d-card-header">
        <div className="d-card-title">
          <i className="fa-solid fa-bolt" /> Quick Actions
        </div>
      </div>

      <div className="d-card-body">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "7px",
          }}
        >
          <button className="d-quick-btn" onClick={onNewOrder}>
            <i
              className="fa-solid fa-plus"
              style={{ color: "var(--accent)" }}
            />
            New Order
          </button>
          <button className="d-quick-btn" onClick={onAddProduct}>
            <i
              className="fa-solid fa-box-open"
              style={{ color: "var(--blue)" }}
            />
            Add Product
          </button>
          <button className="d-quick-btn" onClick={onLogCod}>
            <i
              className="fa-solid fa-coins"
              style={{ color: "var(--green)" }}
            />
            Log COD
          </button>
          <button className="d-quick-btn" onClick={onExportReport}>
            <i
              className="fa-solid fa-file-export"
              style={{ color: "var(--purple)" }}
            />
            Export Report
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default CodStatusCard;
