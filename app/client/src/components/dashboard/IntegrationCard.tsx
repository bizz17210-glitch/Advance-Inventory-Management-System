// ─── components/dashboard/IntegrationCard.tsx ────────────────

import React, { useState } from "react";
import { IntegrationItem } from "../../types/dashboard";

type IntStatus = "live" | "error" | "disconnected" | "loading";

interface IntegrationCardProps {
  item: IntegrationItem;
  onFixKey?: () => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  item,
  onFixKey,
}) => {
  const [status, setStatus] = useState<IntStatus>(item.initialStatus);
  const [meta, setMeta] = useState(item.meta ?? "");
  const [metaType, setMetaType] = useState(item.metaType ?? "neutral");

  const handleConnect = () => {
    setStatus("loading");
    setTimeout(() => {
      setStatus("live");
      setMeta("Just connected");
      setMetaType("ok");
    }, 1500);
  };

  const handleDisconnect = () => {
    setStatus("loading");
    setTimeout(() => {
      setStatus("disconnected");
      setMeta("Disconnected");
      setMetaType("neutral");
    }, 800);
  };

  const cardClass = [
    "d-int-card",
    status === "live" ? "connected" : "",
    status === "error" ? "error" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const renderBadge = () => {
    if (status === "loading")
      return (
        <span className="d-badge gray">
          <i className="fa-solid fa-spinner fa-spin" />
        </span>
      );
    if (status === "live")
      return (
        <span className="d-badge green">
          <span className="d-pulse" />
          Live
        </span>
      );
    if (status === "error")
      return <span className="d-badge red">API Error</span>;
    return <span className="d-badge gray">Not Connected</span>;
  };

  const renderAction = () => {
    if (status === "loading") {
      return (
        <button className="d-btn sm" disabled>
          <i className="fa-solid fa-spinner fa-spin" />
        </button>
      );
    }
    if (status === "live") {
      return (
        <button
          className="d-btn sm"
          style={{
            background: "#ECFDF5",
            borderColor: "#A7F3D0",
            color: "#059669",
          }}
          onClick={handleDisconnect}
        >
          <i className="fa-solid fa-circle-check" /> Connected
        </button>
      );
    }
    if (status === "error") {
      return (
        <button
          className="d-btn sm"
          style={{
            background: "#FEF2F2",
            borderColor: "#FECACA",
            color: "#DC2626",
          }}
          onClick={onFixKey}
        >
          <i className="fa-solid fa-key" /> Fix Key
        </button>
      );
    }
    return (
      <button className="d-btn sm" onClick={handleConnect}>
        <i className="fa-solid fa-plug" /> Connect
      </button>
    );
  };

  const metaClass = `d-int-meta${metaType === "ok" ? " ok" : metaType === "err" ? " err" : ""}`;

  return (
    <div className={cardClass}>
      {/* Top row */}
      <div className="d-int-top">
        <div
          className="d-int-logo"
          style={item.logoBg ? { background: item.logoBg } : undefined}
        >
          {item.logoText ? (
            <span
              style={{
                color: item.logoTextColor ?? "#fff",
                fontSize: "10px",
                fontWeight: 800,
              }}
            >
              {item.logoText}
            </span>
          ) : null}
        </div>
        <div>
          <div className="d-int-name">{item.name}</div>
          <div className="d-int-type">{item.type}</div>
        </div>
        <div className="d-int-badge">{renderBadge()}</div>
      </div>

      {/* Description */}
      <div className="d-int-desc">{item.desc}</div>

      {/* Footer */}
      <div className="d-int-footer">
        <div className={metaClass}>
          {metaType === "ok" && (
            <i
              className="fa-solid fa-circle-check"
              style={{ fontSize: "8px", marginRight: "3px" }}
            />
          )}
          {metaType === "err" && (
            <i
              className="fa-solid fa-circle-xmark"
              style={{ fontSize: "8px", marginRight: "3px" }}
            />
          )}
          {meta}
        </div>
        <div style={{ display: "flex", gap: "5px" }}>
          {status === "live" && (
            <button className="d-btn sm">
              <i className="fa-solid fa-gear" />
            </button>
          )}
          {renderAction()}
        </div>
      </div>
    </div>
  );
};

export default IntegrationCard;
