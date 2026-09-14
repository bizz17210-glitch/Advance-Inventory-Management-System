// ─── components/dashboard/IntegrationsSection.tsx ────────────

import React, { useMemo } from "react";
import { IntegrationItem } from "../../types/dashboard";
import IntegrationCard from "./IntegrationCard";

interface IntegrationsSectionProps {
  ecommerce: IntegrationItem[];
  couriers: IntegrationItem[];
  payments: IntegrationItem[];
  comms: IntegrationItem[];
  onSettings: () => void;
}

// We count the initial stats from the data; the cards manage their own state.
// A more complex app would lift the state up; for this scope, we compute from initial values.
function countByStatus(
  items: IntegrationItem[],
  status: IntegrationItem["initialStatus"],
) {
  return items.filter((i) => i.initialStatus === status).length;
}

const IntegrationsSection: React.FC<IntegrationsSectionProps> = ({
  ecommerce,
  couriers,
  payments,
  comms,
  onSettings,
}) => {
  const all = [...ecommerce, ...couriers, ...payments, ...comms];

  const { connected, error, notConnected } = useMemo(
    () => ({
      connected: countByStatus(all, "live"),
      error: countByStatus(all, "error"),
      notConnected: countByStatus(all, "disconnected"),
    }),
    [all],
  );

  return (
    <section style={{ marginTop: "6px" }}>
      {/* Section header */}
      <div className="d-section-header">
        <div>
          <div className="d-section-title">API Integrations</div>
          <div className="d-section-desc">
            Connect platforms, couriers, and payment gateways to automate your
            operations end-to-end.
          </div>
        </div>
        <button className="d-btn" onClick={onSettings}>
          <i className="fa-solid fa-gear" /> All Integration Settings
        </button>
      </div>

      {/* Status strip */}
      <div className="d-status-strip">
        <div className="d-status-chip connected">
          <div
            className="d-status-chip-dot"
            style={{ background: "var(--green)" }}
          />
          {connected} Connected
        </div>
        {error > 0 && (
          <div className="d-status-chip error">
            <div
              className="d-status-chip-dot"
              style={{ background: "var(--red)" }}
            />
            {error} Error
          </div>
        )}
        <div className="d-status-chip pending">
          <div
            className="d-status-chip-dot"
            style={{ background: "var(--text-faint)" }}
          />
          {notConnected} Not Connected
        </div>
      </div>

      {/* E-Commerce */}
      <div className="d-divider">
        <span>E-Commerce Platforms</span>
      </div>
      <div className="d-int-grid">
        {ecommerce.map((item) => (
          <IntegrationCard key={item.id} item={item} onFixKey={onSettings} />
        ))}
      </div>

      {/* Courier APIs */}
      <div className="d-divider">
        <span>Courier APIs &amp; Tracking</span>
      </div>
      <div className="d-int-grid">
        {couriers.map((item) => (
          <IntegrationCard key={item.id} item={item} onFixKey={onSettings} />
        ))}
      </div>

      {/* Payment Gateways */}
      <div className="d-divider">
        <span>Payment Gateways</span>
      </div>
      <div className="d-int-grid">
        {payments.map((item) => (
          <IntegrationCard key={item.id} item={item} onFixKey={onSettings} />
        ))}
      </div>

      {/* Communication & HR */}
      <div className="d-divider">
        <span>Communication &amp; HR Tools</span>
      </div>
      <div className="d-int-grid">
        {comms.map((item) => (
          <IntegrationCard key={item.id} item={item} onFixKey={onSettings} />
        ))}
      </div>
    </section>
  );
};

export default IntegrationsSection;
