import React, { useState } from "react";
import { ToggleSwitch, InnerTabs } from "./helpers";

const SettingsPanel: React.FC = () => {
  const [innerTab, setInnerTab] = useState("general");

  return (
    <>
      <div className="panel-heading">Financial Settings</div>
      <div className="panel-desc">
        Configure default payment terms, COD limits, report schedules, and
        automated reconciliation rules.
      </div>

      <InnerTabs
        tabs={[
          { id: "general", label: "General" },
          { id: "cod", label: "COD Rules" },
          { id: "supplier", label: "Supplier Terms" },
          { id: "notif", label: "Notifications" },
        ]}
        active={innerTab}
        onChange={setInnerTab}
      />

      {/* ── GENERAL ── */}
      {innerTab === "general" && (
        <>
          <div className="settings-grid-2">
            <div className="settings-section">
              <div className="settings-section-head">
                <i className="fa-solid fa-sliders" /> General Defaults
              </div>
              <div className="settings-section-body">
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Default Currency</div>
                    <div className="stg-desc">
                      Used across all financial records
                    </div>
                  </div>
                  <select className="stg-select">
                    <option>PKR (₨)</option>
                    <option>USD ($)</option>
                  </select>
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Fiscal Month Start</div>
                  </div>
                  <select className="stg-select">
                    <option>1st of month</option>
                    <option>15th of month</option>
                  </select>
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Auto-generate Daily Summary</div>
                    <div className="stg-desc">
                      Generate end-of-day financial snapshot
                    </div>
                  </div>
                  <ToggleSwitch defaultChecked />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Require Notes on All Expenses</div>
                  </div>
                  <ToggleSwitch />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Require Approval Above (₨)</div>
                    <div className="stg-desc">
                      Expense needs manager approval
                    </div>
                  </div>
                  <input
                    type="number"
                    defaultValue={10000}
                    className="stg-input"
                  />
                </div>
              </div>
            </div>
            <div className="settings-section">
              <div className="settings-section-head">
                <i className="fa-solid fa-file-invoice-dollar" /> Report
                Automation
              </div>
              <div className="settings-section-body">
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Auto Daily Report</div>
                    <div className="stg-desc">
                      Email or notify managers daily
                    </div>
                  </div>
                  <ToggleSwitch defaultChecked />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Weekly Report Day</div>
                  </div>
                  <select className="stg-select">
                    <option>Sunday</option>
                    <option>Monday</option>
                    <option>Saturday</option>
                  </select>
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Monthly Report On</div>
                  </div>
                  <input
                    type="number"
                    defaultValue={1}
                    className="stg-input"
                    style={{ width: 60 }}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Send Report To</div>
                  </div>
                  <select className="stg-select">
                    <option>Administrator</option>
                    <option>Operations Manager</option>
                    <option>Owner</option>
                  </select>
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Export Format Default</div>
                  </div>
                  <select className="stg-select">
                    <option>Excel (.xlsx)</option>
                    <option>CSV</option>
                    <option>PDF</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <button className="f-btn primary">
            <i className="fa-solid fa-check" /> Save General Settings
          </button>
        </>
      )}

      {/* ── COD RULES ── */}
      {innerTab === "cod" && (
        <>
          <div className="settings-section">
            <div className="settings-section-head">
              <i className="fa-solid fa-money-bills" /> COD Configuration
            </div>
            <div className="settings-section-body">
              <div className="stg-row">
                <div>
                  <div className="stg-key">Max COD Per Order (₨)</div>
                  <div className="stg-desc">
                    Orders above this need manager approval
                  </div>
                </div>
                <input
                  type="number"
                  defaultValue={20000}
                  className="stg-input"
                />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">Max COD Per Rider (₨)</div>
                  <div className="stg-desc">
                    Total cash a rider can hold before submitting
                  </div>
                </div>
                <input
                  type="number"
                  defaultValue={15000}
                  className="stg-input"
                />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">COD Submission Deadline</div>
                </div>
                <select className="stg-select">
                  <option>End of shift</option>
                  <option>Next morning 10 AM</option>
                  <option>Daily 6 PM</option>
                </select>
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">Auto-Alert on COD Limit Breach</div>
                </div>
                <ToggleSwitch defaultChecked />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">
                    Require Accounts Sign-off on Submission
                  </div>
                </div>
                <ToggleSwitch defaultChecked />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">
                    COD Deduction for Failed Delivery
                  </div>
                  <div className="stg-desc">
                    Deduct rider pay for unexplained shortfall
                  </div>
                </div>
                <ToggleSwitch />
              </div>
            </div>
          </div>
          <button className="f-btn primary">
            <i className="fa-solid fa-check" /> Save COD Settings
          </button>
        </>
      )}

      {/* ── SUPPLIER TERMS ── */}
      {innerTab === "supplier" && (
        <>
          <div className="settings-section">
            <div className="settings-section-head">
              <i className="fa-solid fa-handshake" /> Supplier Payment Terms
            </div>
            <div className="settings-section-body">
              <div className="stg-row">
                <div>
                  <div className="stg-key">Default Payment Terms (Days)</div>
                  <div className="stg-desc">
                    e.g. Net 30 means payment due in 30 days
                  </div>
                </div>
                <input
                  type="number"
                  defaultValue={30}
                  className="stg-input"
                  style={{ width: 60 }}
                />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">Overdue Alert After (Days)</div>
                </div>
                <input
                  type="number"
                  defaultValue={7}
                  className="stg-input"
                  style={{ width: 60 }}
                />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">Auto-Flag Overdue Balances</div>
                </div>
                <ToggleSwitch defaultChecked />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">Require PO Reference on Payment</div>
                </div>
                <ToggleSwitch />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">
                    Notify Manager on Large Payments Above (₨)
                  </div>
                </div>
                <input
                  type="number"
                  defaultValue={50000}
                  className="stg-input"
                />
              </div>
            </div>
          </div>
          <button className="f-btn primary">
            <i className="fa-solid fa-check" /> Save Supplier Settings
          </button>
        </>
      )}

      {/* ── NOTIFICATIONS ── */}
      {innerTab === "notif" && (
        <>
          <div className="settings-section">
            <div className="settings-section-head">
              <i className="fa-solid fa-bell" /> Financial Notifications
            </div>
            <div className="settings-section-body">
              {(
                [
                  ["Daily P&L Summary to Admin", true],
                  ["Alert on COD Submission Delay", true],
                  ["Alert on Supplier Balance Overdue", true],
                  ["Alert on High Expense Entry", true],
                  ["Weekly Financial Report to Manager", true],
                  ["Alert on Unusual COD Amount", true],
                ] as [string, boolean][]
              ).map(([k, v]) => (
                <div className="stg-row" key={k}>
                  <div>
                    <div className="stg-key">{k}</div>
                  </div>
                  <ToggleSwitch defaultChecked={v} />
                </div>
              ))}
            </div>
          </div>
          <button className="f-btn primary">
            <i className="fa-solid fa-check" /> Save Notification Settings
          </button>
        </>
      )}
    </>
  );
};

export default SettingsPanel;
