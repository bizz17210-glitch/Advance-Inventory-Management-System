import React from "react";
import { StgToggleRow, StgRow } from "./SettingsShared";

// ── SecurityTab ────────────────────────────────────────────

const SecurityTab: React.FC = () => (
  <>
    <div className="grid-2" style={{ marginBottom: 14 }}>
      {/* Security Settings */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-shield-halved" /> Security Settings
          </div>
        </div>
        <div className="card-body" style={{ padding: "10px 14px" }}>
          <StgToggleRow
            label="Two-Factor Authentication (2FA)"
            desc="Require 2FA for Admin and Manager logins"
          />
          <StgRow label="Session Timeout (minutes)">
            <input
              type="number"
              defaultValue={60}
              className="form-input"
              style={{ width: 70, height: 26, fontSize: 11 }}
            />
          </StgRow>
          <StgToggleRow
            label="Single Device Login"
            desc="Log out previous session on new login"
          />
          <StgToggleRow
            label="Restrict Login to Office IP"
            desc="Block logins from unknown IP addresses"
          />
          <StgToggleRow label="Alert on Login from New Device" defaultChecked />
          <StgToggleRow
            label="Log All Admin Actions to Audit Trail"
            defaultChecked
          />
          <StgRow label="Audit Log Retention (days)">
            <input
              type="number"
              defaultValue={90}
              className="form-input"
              style={{ width: 70, height: 26, fontSize: 11 }}
            />
          </StgRow>
          <hr />
          <button className="header-btn primary">
            <i className="fa-solid fa-check" /> Save Security Settings
          </button>
        </div>
      </div>

      {/* IP Whitelist */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-network-wired" /> IP Whitelist
          </div>
          <button className="header-btn primary">
            <i className="fa-solid fa-plus" /> Add IP
          </button>
        </div>
        <div className="card-body">
          <div className="alert-strip info" style={{ marginBottom: 10 }}>
            <i className="fa-solid fa-circle-info" />
            Only whitelisted IPs can access the admin panel. Leave empty to
            allow all IPs.
          </div>
          <div className="list-item">
            <div className="list-content">
              <div className="list-title">
                <code className="ip-code">192.168.1.0/24</code>
              </div>
              <div className="list-meta">Office LAN — Lahore HQ</div>
            </div>
            <div className="list-right">
              <span className="badge green">Active</span>
            </div>
          </div>
          <div className="list-item">
            <div className="list-content">
              <div className="list-title">
                <code className="ip-code">203.55.11.10</code>
              </div>
              <div className="list-meta">Admin Home — Static IP</div>
            </div>
            <div className="list-right">
              <span className="badge green">Active</span>
            </div>
          </div>
          <hr />
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">IP Address / Range</div>
              <input className="form-input" placeholder="e.g. 192.168.1.100" />
            </div>
            <div className="form-group">
              <div className="form-label">Label</div>
              <input className="form-input" placeholder="e.g. Office Network" />
            </div>
          </div>
          <button className="header-btn primary">
            <i className="fa-solid fa-plus" /> Add to Whitelist
          </button>
        </div>
      </div>
    </div>

    {/* Security Events */}
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <i className="fa-solid fa-clock-rotate-left" /> Recent Security Events
        </div>
        <button className="header-btn" disabled>
          <i className="fa-solid fa-file-export" /> Export Log
        </button>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "40px 20px",
          gap: 8,
        }}
      >
        <i
          className="fa-solid fa-clock-rotate-left"
          style={{ fontSize: 24, color: "var(--text-muted)", opacity: 0.5 }}
        />
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--text-secondary)",
          }}
        >
          Security Event Log — Coming Soon
        </div>
        <div
          style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 420 }}
        >
          Live login history, audit trail, and IP-based security events will
          appear here once the audit log API endpoint is available.
        </div>
      </div>
    </div>
  </>
);

export default SecurityTab;
