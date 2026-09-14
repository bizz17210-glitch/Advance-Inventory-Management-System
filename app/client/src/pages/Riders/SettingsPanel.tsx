// SettingsPanel.tsx
import React, { useState } from "react";
import { ToggleSwitch, InnerTabs } from "./shared";

const SettingsPanel: React.FC = () => {
  const [innerTab, setInnerTab] = useState("general");

  return (
    <>
      <div className="panel-heading">Rider Settings</div>
      <div className="panel-desc">
        Configure system-wide rider defaults — dispatch rules, COD collection
        limits, notification preferences, and performance thresholds.
      </div>

      <InnerTabs
        tabs={[
          { id: "general", label: "General" },
          { id: "dispatch", label: "Dispatch" },
          { id: "notif", label: "Notifications" },
          { id: "pay", label: "Pay Rules" },
        ]}
        active={innerTab}
        onChange={setInnerTab}
      />

      {/* ── GENERAL ── */}
      {innerTab === "general" && (
        <>
          <div className="settings-grid">
            <div className="settings-section">
              <div className="settings-section-head">
                <i className="fa-solid fa-sliders" /> General Defaults
              </div>
              <div className="settings-section-body">
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Default Shift Duration</div>
                    <div className="stg-desc">
                      Standard working hours per day
                    </div>
                  </div>
                  <input
                    type="number"
                    defaultValue={8}
                    className="stg-input"
                    style={{ width: 60 }}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Max Deliveries Per Rider/Day</div>
                    <div className="stg-desc">
                      Cap per rider before overflow
                    </div>
                  </div>
                  <input
                    type="number"
                    defaultValue={20}
                    className="stg-input"
                    style={{ width: 60 }}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">COD Collection Limit (₨)</div>
                    <div className="stg-desc">Max cash a rider can hold</div>
                  </div>
                  <input
                    type="number"
                    defaultValue={15000}
                    className="stg-input"
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Allow Rider Self Check-In</div>
                    <div className="stg-desc">Rider marks own attendance</div>
                  </div>
                  <ToggleSwitch defaultChecked />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Require Customer Signature</div>
                    <div className="stg-desc">Confirm delivery via app</div>
                  </div>
                  <ToggleSwitch />
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-head">
                <i className="fa-solid fa-shield-halved" /> Performance
                Thresholds
              </div>
              <div className="settings-section-body">
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Min. Completion Rate (%)</div>
                    <div className="stg-desc">Below this flags for review</div>
                  </div>
                  <input
                    type="number"
                    defaultValue={85}
                    className="stg-input"
                    style={{ width: 60 }}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">On-Time Target (%)</div>
                  </div>
                  <input
                    type="number"
                    defaultValue={90}
                    className="stg-input"
                    style={{ width: 60 }}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Max Failed Deliveries/Week</div>
                    <div className="stg-desc">Before escalation alert</div>
                  </div>
                  <input
                    type="number"
                    defaultValue={3}
                    className="stg-input"
                    style={{ width: 60 }}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Auto-Flag Low Performers</div>
                  </div>
                  <ToggleSwitch defaultChecked />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Rating Below Alert</div>
                    <div className="stg-desc">
                      Alert if rider rating drops below
                    </div>
                  </div>
                  <input
                    type="number"
                    defaultValue={3.5}
                    className="stg-input"
                    style={{ width: 60 }}
                    step={0.1}
                  />
                </div>
              </div>
            </div>
          </div>
          <button className="c-btn primary">
            <i className="fa-solid fa-check" /> Save General Settings
          </button>
        </>
      )}

      {/* ── DISPATCH ── */}
      {innerTab === "dispatch" && (
        <>
          <div className="settings-section" style={{ marginBottom: 12 }}>
            <div className="settings-section-head">
              <i className="fa-solid fa-paper-plane" /> Dispatch Configuration
            </div>
            <div className="settings-section-body">
              <div className="stg-row">
                <div>
                  <div className="stg-key">Auto-Assign Rider</div>
                  <div className="stg-desc">
                    Assign based on zone and availability
                  </div>
                </div>
                <ToggleSwitch defaultChecked />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">Dispatch Cut-off Time</div>
                  <div className="stg-desc">Orders after this go next day</div>
                </div>
                <input type="time" defaultValue="15:00" className="stg-input" />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">Max Delivery Attempts</div>
                </div>
                <input
                  type="number"
                  defaultValue={3}
                  className="stg-input"
                  style={{ width: 60 }}
                />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">Re-attempt After (hours)</div>
                </div>
                <input
                  type="number"
                  defaultValue={2}
                  className="stg-input"
                  style={{ width: 60 }}
                />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">High Value COD Threshold (₨)</div>
                  <div className="stg-desc">
                    Flag for manager approval before dispatch
                  </div>
                </div>
                <input
                  type="number"
                  defaultValue={8000}
                  className="stg-input"
                />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">Notify Manager on Assignment</div>
                </div>
                <ToggleSwitch defaultChecked />
              </div>
            </div>
          </div>
          <button className="c-btn primary">
            <i className="fa-solid fa-check" /> Save Dispatch Settings
          </button>
        </>
      )}

      {/* ── NOTIFICATIONS ── */}
      {innerTab === "notif" && (
        <>
          <div className="settings-section" style={{ marginBottom: 12 }}>
            <div className="settings-section-head">
              <i className="fa-solid fa-bell" /> Notification Preferences
            </div>
            <div className="settings-section-body">
              {[
                "Notify Rider on Assignment",
                "Notify Manager on Delay",
                "Notify Accounts on COD Collection",
                "Daily Summary to Manager",
              ].map((k) => (
                <div key={k} className="stg-row">
                  <div>
                    <div className="stg-key">{k}</div>
                  </div>
                  <ToggleSwitch defaultChecked />
                </div>
              ))}
              <div className="stg-row">
                <div>
                  <div className="stg-key">Delay Alert After (min)</div>
                  <div className="stg-desc">
                    Alert when delivery exceeds ETA by N mins
                  </div>
                </div>
                <input
                  type="number"
                  defaultValue={20}
                  className="stg-input"
                  style={{ width: 60 }}
                />
              </div>
            </div>
          </div>
          <button className="c-btn primary">
            <i className="fa-solid fa-check" /> Save Notification Settings
          </button>
        </>
      )}

      {/* ── PAY RULES ── */}
      {innerTab === "pay" && (
        <>
          <div className="settings-section" style={{ marginBottom: 12 }}>
            <div className="settings-section-head">
              <i className="fa-solid fa-coins" /> Pay Rules
            </div>
            <div className="settings-section-body">
              <div className="stg-row">
                <div>
                  <div className="stg-key">Default Pay Type</div>
                </div>
                <select className="stg-select">
                  <option>Per Delivery</option>
                  <option>Monthly Fixed</option>
                  <option>Hybrid</option>
                </select>
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">Default Per-Delivery Rate (₨)</div>
                </div>
                <input
                  type="number"
                  defaultValue={80}
                  className="stg-input"
                  style={{ width: 80 }}
                />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">Performance Bonus Threshold</div>
                  <div className="stg-desc">
                    Deliveries above this earn bonus
                  </div>
                </div>
                <input
                  type="number"
                  defaultValue={15}
                  className="stg-input"
                  style={{ width: 60 }}
                />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">Bonus Per Extra Delivery (₨)</div>
                </div>
                <input
                  type="number"
                  defaultValue={20}
                  className="stg-input"
                  style={{ width: 60 }}
                />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">Fuel Allowance (₨/day)</div>
                </div>
                <input
                  type="number"
                  defaultValue={200}
                  className="stg-input"
                  style={{ width: 80 }}
                />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">Deduct for Failed Deliveries</div>
                  <div className="stg-desc">
                    Reduce pay for rider-caused failures
                  </div>
                </div>
                <ToggleSwitch />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">Pay Cycle</div>
                </div>
                <select className="stg-select">
                  <option>Weekly</option>
                  <option>Bi-weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
            </div>
          </div>
          <button className="c-btn primary">
            <i className="fa-solid fa-check" /> Save Pay Rules
          </button>
        </>
      )}
    </>
  );
};

export default SettingsPanel;
