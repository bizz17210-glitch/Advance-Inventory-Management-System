import React from "react";

// ═══════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════

const ComingSoon: React.FC<{ icon: string; title: string; desc: string }> = ({
  icon,
  title,
  desc,
}) => (
  <div className="empty-state">
    <i className={`fa-solid ${icon}`} />
    <h4>{title}</h4>
    <p>{desc}</p>
  </div>
);

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

const IPWhitelistPanel: React.FC = () => {
  return (
    <>
      {/* Info Banner */}
      <div className="alert-strip info">
        <i className="fa-solid fa-circle-info" />
        IP whitelisting is not yet connected to a backend endpoint. Entries
        added here will not be persisted or enforced until the security API is
        available.
      </div>

      <div className="detail-grid-2">
        {/* Whitelist Table — empty state */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-list-check" /> Whitelisted IPs
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "10.5px",
                  color: "var(--text-muted)",
                }}
              >
                Enforce Whitelist
                <label className="toggle-switch">
                  <input type="checkbox" disabled />
                  <span className="toggle-track" />
                </label>
              </div>
            </div>
            <div className="card-body">
              <ComingSoon
                icon="fa-list-check"
                title="IP Whitelist — Coming Soon"
                desc="Whitelisted IP ranges will appear here once the security API endpoint is implemented."
              />
            </div>
          </div>
        </div>

        {/* Add IP Form + Format Guide */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-plus-circle ic-orange" /> Add IP /
                Range
              </div>
            </div>
            <div className="card-body">
              <div className="form-row single">
                <div className="form-group">
                  <div className="form-label">IP Address or CIDR Range *</div>
                  <input
                    className="form-input"
                    placeholder="e.g. 192.168.1.0/24 or 203.55.11.10"
                    disabled
                  />
                </div>
              </div>
              <div className="form-row single">
                <div className="form-group">
                  <div className="form-label">Label / Description *</div>
                  <input
                    className="form-input"
                    placeholder="e.g. Office Network — Lahore HQ"
                    disabled
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <div className="form-label">Status</div>
                  <select className="form-select" disabled>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid var(--divider)",
                  margin: "12px 0",
                }}
              />
              <button className="t-btn primary" disabled>
                <i className="fa-solid fa-plus" /> Add to Whitelist
              </button>
            </div>
          </div>

          {/* Format Guide — kept, purely informational */}
          <div className="card" style={{ marginTop: 14 }}>
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-circle-info ic-blue" /> IP Format
                Guide
              </div>
            </div>
            <div className="card-body">
              {[
                ["Single IP", "203.55.11.10"],
                ["IP Range (CIDR)", "192.168.1.0/24"],
                ["Subnet Mask", "10.0.0.0/8"],
                ["Wildcard Range", "192.168.1.*"],
              ].map(([k, v]) => (
                <div className="detail-row" key={k}>
                  <div className="detail-key">{k}</div>
                  <div className="detail-val">
                    <code className="ref">{v}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IPWhitelistPanel;
