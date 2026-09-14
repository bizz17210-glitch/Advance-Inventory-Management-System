import React, { useState, useEffect } from "react";
import { Badge } from "./helpers";
import { integrationsAPI } from "../../services/api";

interface IntegrationItem {
  name: string;
  desc: string;
  logoText: string;
  logoBg?: string;
  status: string;
}

const STATIC_INTEGRATIONS: IntegrationItem[] = [
  {
    name: "Paymob",
    desc: "Accept online card payments. Automatically mark orders as prepaid on successful payment confirmation.",
    logoText: "Paymob",
    status: "Not Connected",
  },
  {
    name: "JazzCash Business",
    desc: "Receive payments via JazzCash wallet. Auto-verify prepaid orders and log COD rider payouts.",
    logoText: "JazzCash",
    logoBg: "#AA1F27",
    status: "Not Connected",
  },
  {
    name: "EasyPaisa Business",
    desc: "Accept and verify EasyPaisa payments. Log digital COD submissions from riders automatically.",
    logoText: "EasyPaisa",
    logoBg: "#02a550",
    status: "Not Connected",
  },
  {
    name: "Shopify",
    desc: "Sync Shopify order payments automatically. Prepaid Shopify orders appear verified instantly.",
    logoText: "SHOPIFY",
    status: "Not Connected",
  },
  {
    name: "QuickBooks",
    desc: "Export expenses, supplier payments, and revenue data to QuickBooks for full accounting integration.",
    logoText: "QB",
    status: "Optional",
  },
  {
    name: "Microsoft Excel Export",
    desc: "Export any financial dataset to formatted Excel sheets. Available for COD logs, expense reports, and P&L summaries.",
    logoText: "XLS",
    logoBg: "#0078D4",
    status: "Available",
  },
  {
    name: "Leopards Courier",
    desc: "Auto-import COD remittance data from Leopards courier portal. Match courier COD to order records for reconciliation.",
    logoText: "LCS",
    status: "Not Connected",
  },
  {
    name: "TCS Courier",
    desc: "Import TCS COD remittance reports. Auto-reconcile COD collected by TCS against pending order balances.",
    logoText: "TCS",
    status: "Not Connected",
  },
];

const IntegCard: React.FC<{ int: IntegrationItem }> = ({ int }) => (
  <div className="integration-card">
    <div
      className="integration-logo"
      style={
        int.logoBg
          ? { background: int.logoBg, borderColor: int.logoBg }
          : undefined
      }
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          color: int.logoBg ? "#fff" : "var(--text-secondary)",
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {int.logoText}
      </span>
    </div>
    <div>
      <div className="integration-name">{int.name}</div>
      <div className="integration-desc">{int.desc}</div>
    </div>
    <div className="integration-right">
      <Badge label={int.status} />
      <button
        className={`f-btn ${int.status === "Available" ? "primary" : int.status === "Optional" ? "" : "primary"}`}
        style={{ fontSize: 10 }}
      >
        <i
          className={`fa-solid fa-${int.status === "Available" ? "file-export" : int.status === "Optional" ? "circle-info" : "plug"}`}
        />
        {int.status === "Available"
          ? "Export Now"
          : int.status === "Optional"
            ? "Learn More"
            : "Connect"}
      </button>
    </div>
  </div>
);

const SectionLabel: React.FC<{ label: string; first?: boolean }> = ({
  label,
  first,
}) => (
  <div
    style={{
      fontSize: 9.5,
      fontWeight: 700,
      color: "var(--text-muted)",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      margin: first ? "0 0 10px" : "14px 0 10px",
    }}
  >
    {label}
  </div>
);

const IntegrationsPanel: React.FC = () => {
  const [liveStatus, setLiveStatus] = useState<any>(null);

  useEffect(() => {
    integrationsAPI
      .getStatus()
      .then((r) => setLiveStatus(r.data.data))
      .catch(() => null);
  }, []);

  // Merge live status into integrations list
  const integrations = STATIC_INTEGRATIONS.map((item) => {
    if (item.name === "Shopify" && liveStatus?.shopify?.connected) {
      return { ...item, status: "Connected" };
    }
    return item;
  });

  const paymentGateways = integrations.slice(0, 3);
  const ecommerce = integrations.slice(3, 4);
  const accounting = integrations.slice(4, 6);
  const banking = integrations.slice(6);

  return (
    <>
      <div className="panel-heading">Financial Integrations</div>
      <div className="panel-desc">
        Connect payment gateways, e-commerce platforms, and accounting tools to
        automate financial data flow.
      </div>

      <div className="alert-strip info">
        <i className="fa-solid fa-circle-info" />
        Connecting payment gateways enables automatic reconciliation of prepaid
        orders and COD updates in real time.
      </div>

      {liveStatus?.shopify?.connected && (
        <div className="alert-strip success" style={{ marginBottom: 12 }}>
          <i className="fa-solid fa-circle-check" />
          <div>
            <strong>Shopify</strong> connected —{" "}
            {liveStatus.shopify.pendingOrders ?? 0} pending orders.
          </div>
        </div>
      )}

      <SectionLabel label="Payment Gateways" first />
      {paymentGateways.map((i) => (
        <IntegCard key={i.name} int={i} />
      ))}

      <SectionLabel label="E-Commerce &amp; Order Sources" />
      {ecommerce.map((i) => (
        <IntegCard key={i.name} int={i} />
      ))}

      <SectionLabel label="Accounting Software" />
      {accounting.map((i) => (
        <IntegCard key={i.name} int={i} />
      ))}

      <SectionLabel label="Bank &amp; Courier Finance" />
      {banking.map((i) => (
        <IntegCard key={i.name} int={i} />
      ))}
    </>
  );
};

export default IntegrationsPanel;
