// ─── components/dashboard/FinancialSummary.tsx ───────────────

import React from "react";
import { CodRing } from "../../types/dashboard";

interface FinancialSummaryProps {
  onViewDetails: () => void;
  codRings: CodRing[];
  sparkHeights: number[];
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  onViewDetails,
  codRings,
  sparkHeights,
}) => (
  <div className="d-card">
    <div className="d-card-header">
      <div className="d-card-title">
        <i className="fa-solid fa-sack-dollar" /> Financials Today
      </div>
      <button className="d-btn sm" onClick={onViewDetails}>
        Details
      </button>
    </div>

    <div className="d-card-body">
      {/* Net Today + sparkline */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "12px",
        }}
      >
        <div>
          <div
            className="d-kpi-label"
            style={{ color: "var(--text-faint)", marginBottom: "4px" }}
          >
            Net Today
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "var(--green)",
              letterSpacing: "-0.5px",
            }}
          >
            ₨44,600
          </div>
        </div>

        <div className="d-sparkline">
          {sparkHeights.map((h, i) => (
            <div
              key={i}
              className={`d-spark ${h >= 80 ? "hi" : h >= 55 ? "med" : ""}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* COD collected progress */}
      <div
        style={{
          background: "var(--bg)",
          borderRadius: "9px",
          padding: "10px 12px",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "6px",
          }}
        >
          <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
            COD Collected
          </div>
          <div
            style={{ fontSize: "12px", fontWeight: 700, color: "var(--green)" }}
          >
            ₨38,200
          </div>
        </div>
        <div className="d-prog">
          <div
            className="d-prog-fill"
            style={{ width: "72%", background: "var(--green)" }}
          />
        </div>
      </div>

      {/* Line items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {[
          {
            label: "Prepaid Received",
            value: "+₨22,500",
            color: "var(--green)",
          },
          { label: "Expenses Logged", value: "-₨4,100", color: "var(--red)" },
          { label: "Supplier Paid", value: "-₨12,000", color: "var(--yellow)" },
        ].map((row) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11.5px",
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
            <span style={{ fontWeight: 600, color: row.color }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <hr className="d-hr" />

      {/* Summary tiles */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}
      >
        {[
          { value: "₨84K", label: "COD Outstanding" },
          { value: "87%", label: "Confirm Rate" },
        ].map((tile) => (
          <div
            key={tile.label}
            style={{
              background: "var(--bg)",
              borderRadius: "8px",
              padding: "8px 10px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              {tile.value}
            </div>
            <div
              className="d-kpi-label"
              style={{ color: "var(--text-faint)", marginTop: "2px" }}
            >
              {tile.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default FinancialSummary;
