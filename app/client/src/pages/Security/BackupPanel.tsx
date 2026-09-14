import React, { useState } from "react";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface BackupEntry {
  date: string;
  size: string;
  duration: string;
  status: "Success" | "Failed";
  type: "Scheduled" | "Manual";
}

// ═══════════════════════════════════════════════════════════
// STATIC DATA
// ═══════════════════════════════════════════════════════════

const INITIAL_BACKUPS: BackupEntry[] = [
  {
    date: "11 May 2026, 08:00",
    size: "4.2 MB",
    duration: "12s",
    status: "Success",
    type: "Scheduled",
  },
  {
    date: "10 May 2026, 08:00",
    size: "4.1 MB",
    duration: "11s",
    status: "Success",
    type: "Scheduled",
  },
  {
    date: "09 May 2026, 08:00",
    size: "4.0 MB",
    duration: "13s",
    status: "Success",
    type: "Scheduled",
  },
  {
    date: "08 May 2026, 08:00",
    size: "3.9 MB",
    duration: "10s",
    status: "Success",
    type: "Scheduled",
  },
  {
    date: "07 May 2026, 08:00",
    size: "3.8 MB",
    duration: "14s",
    status: "Failed",
    type: "Scheduled",
  },
  {
    date: "06 May 2026, 08:00",
    size: "3.8 MB",
    duration: "11s",
    status: "Success",
    type: "Scheduled",
  },
  {
    date: "05 May 2026, 14:30",
    size: "3.7 MB",
    duration: "9s",
    status: "Success",
    type: "Manual",
  },
];

// ═══════════════════════════════════════════════════════════
// MICRO-COMPONENTS
// ═══════════════════════════════════════════════════════════

const ToggleSwitch: React.FC<{
  defaultChecked?: boolean;
  onChange?: (v: boolean) => void;
}> = ({ defaultChecked = false, onChange }) => {
  const [on, setOn] = useState(defaultChecked);
  return (
    <label className="toggle-switch">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => {
          setOn(e.target.checked);
          onChange?.(e.target.checked);
        }}
      />
      <span className="toggle-track" />
    </label>
  );
};

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

const BackupPanel: React.FC = () => {
  const [backups, setBackups] = useState<BackupEntry[]>(INITIAL_BACKUPS);
  const [running, setRunning] = useState(false);
  const [runDone, setRunDone] = useState(false);

  const runNow = () => {
    setRunning(true);
    setRunDone(false);
    setTimeout(() => {
      setRunning(false);
      setRunDone(true);
      const now = new Date();
      const label = `${now.getDate()} May 2026, ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setBackups((prev) => [
        {
          date: label,
          size: "4.3 MB",
          duration: "11s",
          status: "Success",
          type: "Manual",
        },
        ...prev,
      ]);
      setTimeout(() => setRunDone(false), 3000);
    }, 2000);
  };

  return (
    <>
      {/* Stats */}
      <div className="mini-stats">
        {[
          {
            label: "Last Successful Backup",
            value: "11 May",
            sub: "08:00 AM · 4.2 MB",
            subClass: "up",
          },
          {
            label: "Backups Stored",
            value: "30",
            sub: "Retained 30 days",
            subClass: "",
          },
          {
            label: "Storage Used",
            value: "126 MB",
            sub: "of unlimited",
            subClass: "",
          },
          {
            label: "Next Scheduled",
            value: "12 May",
            sub: "08:00 AM · Auto",
            subClass: "",
          },
        ].map((s) => (
          <div className="mini-stat" key={s.label}>
            <div className="ms-label">{s.label}</div>
            <div
              className="ms-value"
              style={{ fontSize: s.value.length > 4 ? 14 : undefined }}
            >
              {s.value}
            </div>
            <div className={`ms-trend ${s.subClass}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="detail-grid-2">
        {/* Backup Config */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-gear" /> Backup Configuration
              </div>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <div className="form-label">Frequency</div>
                  <select className="form-select">
                    <option>Daily</option>
                    <option>Twice Daily</option>
                    <option>Weekly</option>
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
                  <input
                    className="form-input"
                    type="number"
                    defaultValue={30}
                  />
                </div>
                <div className="form-group">
                  <div className="form-label">Format</div>
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
                  <div className="form-label">Notify On</div>
                  <select className="form-select">
                    <option>Failure Only</option>
                    <option>Always</option>
                    <option>Never</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Include Product Images</div>
                    <div className="stg-desc">
                      Significantly increases backup size
                    </div>
                  </div>
                  <ToggleSwitch />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Encrypt Backup (AES-256)</div>
                  </div>
                  <ToggleSwitch defaultChecked />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">
                      Auto-delete After Retention Period
                    </div>
                  </div>
                  <ToggleSwitch defaultChecked />
                </div>
              </div>

              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid var(--divider)",
                  margin: "12px 0",
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button className="t-btn primary">
                  <i className="fa-solid fa-check" /> Save Backup Config
                </button>
                <button className="t-btn" onClick={runNow} disabled={running}>
                  {running ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" /> Running...
                    </>
                  ) : runDone ? (
                    <>
                      <i
                        className="fa-solid fa-circle-check"
                        style={{ color: "var(--green)" }}
                      />{" "}
                      Done!
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-play" /> Run Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Backup History */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-clock-rotate-left" /> Backup History
              </div>
              <button className="t-btn">
                <i className="fa-solid fa-file-export" /> Export Log
              </button>
            </div>
            <div className="card-body" style={{ padding: "6px 14px" }}>
              {backups.map((b, i) => (
                <div className="list-item" key={i}>
                  <div
                    className="list-icon"
                    style={{
                      background:
                        b.status === "Success"
                          ? "var(--green-bg)"
                          : "var(--red-bg)",
                    }}
                  >
                    <i
                      className={`fa-solid fa-${b.status === "Success" ? "circle-check ic-green" : "circle-xmark ic-red"}`}
                      style={{ fontSize: 11 }}
                    />
                  </div>
                  <div className="list-content">
                    <div className="list-title" style={{ fontSize: 11 }}>
                      {b.date}
                    </div>
                    <div className="list-meta">
                      {b.size} · {b.duration} ·{" "}
                      <span className="tag">{b.type}</span>
                    </div>
                  </div>
                  <div className="list-right">
                    {b.status === "Success" ? (
                      <button
                        className="t-btn"
                        style={{ height: 22, fontSize: 9.5 }}
                      >
                        <i className="fa-solid fa-download" />
                      </button>
                    ) : (
                      <button
                        className="t-btn danger"
                        style={{ height: 22, fontSize: 9.5 }}
                      >
                        <i className="fa-solid fa-rotate" />
                      </button>
                    )}
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

export default BackupPanel;
