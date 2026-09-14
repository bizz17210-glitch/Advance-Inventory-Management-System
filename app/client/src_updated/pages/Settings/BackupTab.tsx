import React from "react";
import { StgToggleRow } from "./SettingsShared";

// ═══════════════════════════════════════════════════════════
// BackupTab.tsx
// No backend endpoints exist yet for backup/export/danger-zone
// operations. Stats are zeroed and history/lists show
// "Coming Soon" empty states until an API is available.
// ═══════════════════════════════════════════════════════════

const BackupTab: React.FC = () => {
  return (
    <>
      {/* Stats Row — zeroed, no backend source */}
      <div className="stats-row" style={{ marginBottom: 14 }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Last Backup</div>
            <div className="stat-icon" style={{ background: "var(--divider)" }}>
              <i
                className="fa-solid fa-circle-minus"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
          </div>
          <div className="stat-value stat-value-sm">—</div>
          <div className="stat-trend neutral">No backups yet</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Backup Size</div>
            <div className="stat-icon" style={{ background: "var(--divider)" }}>
              <i
                className="fa-solid fa-database"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
          </div>
          <div className="stat-value">0 MB</div>
          <div className="stat-trend neutral">—</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Backups Stored</div>
            <div className="stat-icon" style={{ background: "var(--divider)" }}>
              <i
                className="fa-solid fa-boxes-stacked"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
          </div>
          <div className="stat-value">0</div>
          <div className="stat-trend neutral">—</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Next Scheduled</div>
            <div className="stat-icon" style={{ background: "var(--divider)" }}>
              <i
                className="fa-solid fa-clock"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
          </div>
          <div className="stat-value stat-value-sm">—</div>
          <div className="stat-trend neutral">Not scheduled</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 14 }}>
        {/* Backup Configuration */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-database" /> Backup Configuration
            </div>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <div className="form-label">Auto-backup Frequency</div>
                <select className="form-select">
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Twice Daily</option>
                  <option>Manual Only</option>
                </select>
              </div>
              <div className="form-group">
                <div className="form-label">Backup Time</div>
                <input
                  className="form-input"
                  type="time"
                  defaultValue="08:00"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <div className="form-label">Retention Period (days)</div>
                <input className="form-input" type="number" defaultValue={30} />
              </div>
              <div className="form-group">
                <div className="form-label">Backup Format</div>
                <select className="form-select">
                  <option>Compressed ZIP</option>
                  <option>SQL Dump</option>
                  <option>JSON Export</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <div className="form-label">Storage Destination</div>
                <select className="form-select">
                  <option>Local Server</option>
                  <option>Google Drive</option>
                  <option>AWS S3</option>
                  <option>Dropbox</option>
                </select>
              </div>
              <div className="form-group">
                <div className="form-label">Notify Admin on Failure</div>
                <select className="form-select">
                  <option>Yes — Dashboard</option>
                  <option>Yes — Email</option>
                  <option>No</option>
                </select>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                marginTop: 4,
              }}
            >
              <StgToggleRow label="Include Product Images in Backup" />
              <StgToggleRow
                label="Encrypt Backup File"
                desc="AES-256 encryption applied to all backups"
                defaultChecked
              />
            </div>
            <hr />
            <div className="info-banner" style={{ marginBottom: 0 }}>
              <i className="fa-solid fa-circle-info" />
              <div className="info-banner-text">
                Backup configuration and manual backup actions will be enabled
                once the backup API endpoint is available.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="header-btn primary" disabled>
                <i className="fa-solid fa-check" /> Save Backup Settings
              </button>
              <button className="header-btn" disabled>
                <i className="fa-solid fa-play" /> Run Backup Now
              </button>
            </div>
          </div>
        </div>

        {/* Backup History — empty state */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-clock-rotate-left" /> Backup History
            </div>
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
              Backup History — Coming Soon
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                maxWidth: 320,
              }}
            >
              Backup records will appear here once the backup API endpoint is
              available.
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Data Export */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-file-export" /> Data Export
            </div>
          </div>
          <div className="card-body">
            <div
              style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                marginBottom: 12,
              }}
            >
              Export all your data in a portable format. Use for migration,
              compliance, or archiving purposes.
            </div>
            <div className="form-row">
              <div className="form-group">
                <div className="form-label">Export Type</div>
                <select className="form-select">
                  <option>Full System Export</option>
                  <option>Products Only</option>
                  <option>Orders Only</option>
                  <option>Customers Only</option>
                  <option>Financial Records</option>
                </select>
              </div>
              <div className="form-group">
                <div className="form-label">File Format</div>
                <select className="form-select">
                  <option>Excel (.xlsx)</option>
                  <option>CSV (.csv)</option>
                  <option>JSON</option>
                </select>
              </div>
            </div>
            <button
              className="header-btn primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled
            >
              <i className="fa-solid fa-file-export" /> Export Data
            </button>
            <div
              style={{
                fontSize: 9.5,
                color: "var(--text-muted)",
                marginTop: 6,
                textAlign: "center",
              }}
            >
              Coming Soon — analytics export endpoint not yet wired
            </div>
          </div>
        </div>

        {/* Danger Zone — empty state */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-triangle-exclamation ic-red" /> Danger
              Zone
            </div>
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
              className="fa-solid fa-triangle-exclamation"
              style={{ fontSize: 24, color: "var(--text-muted)", opacity: 0.5 }}
            />
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              Danger Zone Actions — Coming Soon
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                maxWidth: 320,
              }}
            >
              Bulk data clearing, inventory resets, and factory reset actions
              will be available once the corresponding API endpoints are
              implemented.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BackupTab;
