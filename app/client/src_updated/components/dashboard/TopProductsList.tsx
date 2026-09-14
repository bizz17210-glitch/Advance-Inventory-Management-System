// ─── components/dashboard/TopProductsList.tsx ────────────────

import React from "react";
import { TopProduct } from "../../types/dashboard";

interface TopProductsListProps {
  products: TopProduct[];
  onViewAll: () => void;
}

const stockColor: Record<string, string> = {
  critical: "var(--red)",
  low: "var(--yellow)",
  ok: "var(--text-faint)",
};

const TopProductsList: React.FC<TopProductsListProps> = ({
  products,
  onViewAll,
}) => (
  <div className="d-card">
    <div className="d-card-header">
      <div className="d-card-title">
        <i className="fa-solid fa-boxes-stacked" /> Top Products
      </div>
      <button className="d-btn sm" onClick={onViewAll}>
        All Products
      </button>
    </div>

    <div className="d-card-body-flush">
      {products.map((p) => (
        <div className="d-list-item" key={p.sku}>
          <div
            style={{
              width: "20px",
              textAlign: "center",
              fontSize: "12px",
              flexShrink: 0,
              fontWeight: 800,
              color: p.rank === 1 ? "var(--accent)" : "var(--text-faint)",
            }}
          >
            {p.rank}
          </div>

          <div className="d-list-body">
            <div className="d-list-title">{p.name}</div>
            <div className="d-list-meta">
              <code
                style={{
                  fontSize: "9.5px",
                  background: "var(--bg)",
                  padding: "1px 4px",
                  borderRadius: "3px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {p.sku}
              </code>
              {" · "}
              {p.sold} sold
              {" · "}
              <span style={{ color: stockColor[p.stockStatus] }}>
                {p.stock} left
              </span>
            </div>
          </div>

          <div className="d-list-right">
            <div style={{ fontSize: "12px", fontWeight: 700 }}>{p.revenue}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default TopProductsList;
