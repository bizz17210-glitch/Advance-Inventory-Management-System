import React, { useState } from "react";
import ComingSoon from "./ComingSoon";

// ── TOGGLE ROW ────────────────────────────────────────────
const ToggleRow: React.FC<{
  label: string;
  desc?: string;
  defaultChecked: boolean;
}> = ({ label, desc, defaultChecked }) => {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="stg-row">
      <div>
        <div className="stg-key">{label}</div>
        {desc && <div className="stg-desc">{desc}</div>}
      </div>
      <label className="toggle-switch" onClick={() => setChecked((v) => !v)}>
        <input type="checkbox" checked={checked} onChange={() => {}} />
        <span className="toggle-track" />
      </label>
    </div>
  );
};

// ── SETTINGS TAB ──────────────────────────────────────────
const SettingsTab: React.FC = () => (
  <>
    <ComingSoon
      feature="Audit Settings"
      note="No GET/PUT /api/audit/settings endpoint exists yet, so changes here cannot be saved. The form below is a preview of upcoming configuration options."
    />

    <div className="settings-grid">
      {/* Audit Log Configuration */}
      <div className="settings-section">
        <div className="settings-section-head">
          <i className="fa-solid fa-sliders" /> Audit Log Configuration
        </div>
        <div className="settings-section-body">
          <div className="stg-row">
            <div>
              <div className="stg-key">Log Retention Period</div>
              <div className="stg-desc">How long to keep audit records</div>
            </div>
            <select className="stg-select">
              <option>30 Days</option>
              <option>90 Days</option>
              <option>180 Days</option>
              <option>1 Year</option>
              <option>Forever</option>
            </select>
          </div>
          <ToggleRow
            label="Auto-purge Expired Logs"
            desc="Delete logs older than retention period"
            defaultChecked={true}
          />
          <ToggleRow
            label="Log All Admin Actions"
            desc="Record every action by Administrator role"
            defaultChecked={true}
          />
          <ToggleRow label="Log Staff Login / Logout" defaultChecked={true} />
          <ToggleRow
            label="Log Data Modifications"
            desc="Track creates, updates, deletes"
            defaultChecked={true}
          />
          <ToggleRow label="Log Report Exports" defaultChecked={true} />
          <ToggleRow label="Log Settings Changes" defaultChecked={true} />
          <ToggleRow
            label="Log API Access"
            desc="Record external API calls"
            defaultChecked={false}
          />
        </div>
      </div>

      {/* Alert & Notification Settings */}
      <div className="settings-section">
        <div className="settings-section-head">
          <i className="fa-solid fa-bell" /> Alert &amp; Notification Settings
        </div>
        <div className="settings-section-body">
          <ToggleRow
            label="Alert on Critical Events"
            desc="Notify Admin immediately"
            defaultChecked={true}
          />
          <ToggleRow
            label="Alert on Failed Login Attempts"
            defaultChecked={true}
          />
          <div className="stg-row">
            <div>
              <div className="stg-key">Failed Login Threshold</div>
              <div className="stg-desc">Alert after N consecutive failures</div>
            </div>
            <input
              type="number"
              defaultValue={3}
              className="stg-input"
              style={{ width: 60 }}
            />
          </div>
          <ToggleRow
            label="Alert on Data Deletion"
            desc="Notify Admin on any delete action"
            defaultChecked={true}
          />
          <ToggleRow
            label="Alert on Role / Permission Change"
            defaultChecked={true}
          />
          <ToggleRow
            label="Alert on Bulk Export"
            desc="Notify when large data export occurs"
            defaultChecked={true}
          />
          <ToggleRow
            label="Daily Audit Summary Email"
            desc="End-of-day digest to Administrator"
            defaultChecked={true}
          />
          <div className="stg-row">
            <div>
              <div className="stg-key">Notify Who</div>
            </div>
            <select className="stg-select">
              <option>Administrator</option>
              <option>Ops Manager</option>
              <option>Both</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div className="settings-grid">
      {/* Export & Archive */}
      <div className="settings-section" style={{ marginBottom: 0 }}>
        <div className="settings-section-head">
          <i className="fa-solid fa-file-export" /> Export &amp; Archive
        </div>
        <div className="settings-section-body">
          <div className="stg-row">
            <div>
              <div className="stg-key">Default Export Format</div>
            </div>
            <select className="stg-select">
              <option>CSV</option>
              <option>Excel (.xlsx)</option>
              <option>JSON</option>
              <option>PDF</option>
            </select>
          </div>
          <ToggleRow
            label="Auto-archive Monthly Logs"
            desc="Compress and archive each month's logs"
            defaultChecked={true}
          />
          <div className="stg-row">
            <div>
              <div className="stg-key">Archive Storage</div>
            </div>
            <select className="stg-select">
              <option>Local Server</option>
              <option>Google Drive</option>
              <option>AWS S3</option>
            </select>
          </div>
          <ToggleRow label="Encrypt Archived Logs" defaultChecked={true} />
        </div>
      </div>

      {/* Compliance & Access */}
      <div className="settings-section" style={{ marginBottom: 0 }}>
        <div className="settings-section-head">
          <i className="fa-solid fa-shield-halved" /> Compliance &amp; Access
        </div>
        <div className="settings-section-body">
          <div className="stg-row">
            <div>
              <div className="stg-key">Restrict Log Access To</div>
              <div className="stg-desc">Who can view audit logs</div>
            </div>
            <select className="stg-select">
              <option>Admin Only</option>
              <option>Admin + Ops Manager</option>
              <option>All Managers</option>
            </select>
          </div>
          <div className="stg-row">
            <div>
              <div className="stg-key">Allow Log Export By</div>
            </div>
            <select className="stg-select">
              <option>Admin Only</option>
              <option>Admin + Ops Manager</option>
            </select>
          </div>
          <ToggleRow
            label="Tamper-proof Mode"
            desc="Logs cannot be edited or deleted by any user"
            defaultChecked={true}
          />
          <ToggleRow
            label="Show Raw IP in Logs"
            desc="Display full IP or partially mask it"
            defaultChecked={true}
          />
        </div>
      </div>
    </div>

    <div style={{ marginTop: 14 }}>
      <button
        className="t-btn primary"
        disabled
        title="Audit Settings API not available yet"
      >
        <i className="fa-solid fa-check" /> Save Audit Settings (Coming Soon)
      </button>
    </div>
  </>
);

export default SettingsTab;
