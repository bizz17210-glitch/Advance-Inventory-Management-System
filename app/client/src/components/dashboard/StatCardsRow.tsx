// ─── components/dashboard/StatCardsRow.tsx ───────────────────

import React from "react";
import { StatCard } from "../../types/dashboard";

interface StatCardsRowProps {
  cards: StatCard[];
}

const trendIcon: Record<string, string> = {
  up: "fa-arrow-trend-up",
  down: "fa-arrow-trend-down",
  neutral: "fa-minus",
};

const StatCardsRow: React.FC<StatCardsRowProps> = ({ cards }) => (
  <div className="d-stats-grid">
    {cards.map((card) => (
      <div className="d-stat" key={card.label}>
        <div className="d-stat-icon" style={{ background: card.iconBg }}>
          <i
            className={`fa-solid ${card.icon}`}
            style={{ color: card.iconColor }}
          />
        </div>
        <div className="d-stat-value">{card.value}</div>
        <div className="d-stat-label">{card.label}</div>
        <div className={`d-stat-trend ${card.trendDir}`}>
          <i className={`fa-solid ${trendIcon[card.trendDir]}`} />
          {card.trend}
        </div>
        <div
          className="d-stat-accent"
          style={{ background: card.accentGradient }}
        />
      </div>
    ))}
  </div>
);

export default StatCardsRow;
