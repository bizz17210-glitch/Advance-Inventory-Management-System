// IntegrationsPanel.tsx
import React from "react";
import { Badge } from "./shared";

interface IntCardProps {
  logo: React.ReactNode;
  name: string;
  desc: string;
  badge: string;
  btnLabel: string;
  btnPrimary?: boolean;
}

const IntCard: React.FC<IntCardProps> = ({
  logo,
  name,
  desc,
  badge,
  btnLabel,
  btnPrimary,
}) => (
  <div className="integration-card">
    <div className="integration-logo">{logo}</div>
    <div>
      <div className="integration-name">{name}</div>
      <div className="integration-desc">{desc}</div>
    </div>
    <div className="integration-right">
      <Badge label={badge} />
      <button
        className={`c-btn ${btnPrimary ? "primary" : ""}`}
        style={{ fontSize: 10 }}
      >
        {btnLabel}
      </button>
    </div>
  </div>
);

const IntegrationsPanel: React.FC = () => (
  <>
    <div className="panel-heading">App Integrations</div>
    <div className="panel-desc">
      Connect third-party apps and tools to enhance rider tracking, delivery
      notifications, and operational automation.
    </div>

    <div className="alert-strip info">
      <i className="fa-solid fa-circle-info" />
      Integrations marked <strong>Option 2</strong> are available under Option 2
      of the system plan. Connect to unlock real-time tracking, automated
      dispatch, and more.
    </div>

    <div className="section-label" style={{ marginTop: 4 }}>
      Rider Mobile App
    </div>
    <IntCard
      logo={
        <i
          className="fa-solid fa-location-dot"
          style={{ color: "#FF6A00", fontSize: 20 }}
        />
      }
      name="Zone In Rider App"
      desc="Custom mobile app for riders — view tasks, update delivery status, collect COD confirmation, and share live GPS location."
      badge="Option 2"
      btnLabel="Setup Guide"
      btnPrimary
    />

    <div className="section-label" style={{ marginTop: 14 }}>
      Live Tracking &amp; Maps
    </div>
    <IntCard
      logo={
        <i
          className="fa-solid fa-map"
          style={{ color: "#4285F4", fontSize: 18 }}
        />
      }
      name="Google Maps"
      desc="Route planning and live location display for rider tracking on the Live Map view. Embed in operations dashboard."
      badge="Not Connected"
      btnLabel="Connect"
      btnPrimary
    />

    <div className="section-label" style={{ marginTop: 14 }}>
      Communication &amp; Notifications
    </div>
    <IntCard
      logo={
        <i
          className="fa-brands fa-whatsapp"
          style={{ color: "#25D366", fontSize: 22 }}
        />
      }
      name="WhatsApp Business API"
      desc="Send automated delivery status updates, assignment notifications, and COD confirmations to riders and customers via WhatsApp."
      badge="Not Connected"
      btnLabel="Connect"
      btnPrimary
    />
    <IntCard
      logo={
        <i
          className="fa-solid fa-bell"
          style={{ color: "#FF6900", fontSize: 18 }}
        />
      }
      name="Firebase Push Notifications"
      desc="Send real-time push notifications to rider mobile app for new task assignments, cancellations, and urgent alerts."
      badge="Option 2"
      btnLabel="Learn More"
    />

    <div className="section-label" style={{ marginTop: 14 }}>
      E-commerce &amp; Order Sources
    </div>
    <IntCard
      logo={
        <span style={{ fontSize: 9, fontWeight: 800, color: "#96BF48" }}>
          SHOPIFY
        </span>
      }
      name="Shopify"
      desc="Auto-pull confirmed Shopify orders into the rider dispatch queue. Orders ready for internal delivery appear automatically."
      badge="Not Connected"
      btnLabel="Connect"
      btnPrimary
    />

    <div className="section-label" style={{ marginTop: 14 }}>
      Rider Payments
    </div>
    <IntCard
      logo={
        <span
          style={{
            fontSize: 8,
            fontWeight: 800,
            color: "#AA1F27",
            textAlign: "center",
          }}
        >
          Jazz Cash
        </span>
      }
      name="JazzCash"
      desc="Pay riders directly via JazzCash mobile wallet. Record and confirm digital payouts within the earnings module."
      badge="Manual"
      btnLabel="Configure"
    />
    <IntCard
      logo={
        <span
          style={{
            fontSize: 8,
            fontWeight: 800,
            color: "#02a550",
            textAlign: "center",
            lineHeight: "1.2",
          }}
        >
          Easy Paisa
        </span>
      }
      name="EasyPaisa"
      desc="Pay riders via EasyPaisa mobile wallet. Log payments and track payout history in the earnings module."
      badge="Manual"
      btnLabel="Configure"
    />
  </>
);

export default IntegrationsPanel;
