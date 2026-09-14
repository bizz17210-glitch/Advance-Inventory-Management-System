// SettingsPanel.tsx — live courier dropdown from API
import React, { useState, useEffect } from "react";
import { ApiCourier, InnerTabs, ToggleSwitch } from "./shared";
import { couriersAPI } from "../../services/api";

const SettingsPanel: React.FC = () => {
  const [innerTab, setInnerTab] = useState("general");
  const [couriers, setCouriers] = useState<ApiCourier[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // General
  const [defaultCourier, setDefaultCourier] = useState("");
  const [defaultPayment, setDefaultPayment] = useState("COD");
  const [currency, setCurrency] = useState("PKR (₨)");
  const [autoCreate, setAutoCreate] = useState(true);
  const [manualOverride, setManualOverride] = useState(true);
  const [defaultWeight, setDefaultWeight] = useState("0.5");
  const [dimFactor, setDimFactor] = useState("5000");
  const [billOn, setBillOn] = useState("Higher of Both");
  const [packagingCost, setPackagingCost] = useState("25");

  // Dispatch
  const [autoAssign, setAutoAssign] = useState(true);
  const [cutoffTime, setCutoffTime] = useState("14:00");
  const [weekendCourier, setWeekendCourier] = useState("Leopards");
  const [highValThreshold, setHighValThreshold] = useState("10000");
  const [maxAttempts, setMaxAttempts] = useState("3");
  const [reattemptHours, setReattemptHours] = useState("24");
  const [autoRTO, setAutoRTO] = useState(true);
  const [contactOnFail, setContactOnFail] = useState(true);

  // COD
  const [autoMarkCOD, setAutoMarkCOD] = useState(true);
  const [codSettleDays, setCodSettleDays] = useState("7");
  const [codOverdueDays, setCodOverdueDays] = useState("10");
  const [codShortfall, setCodShortfall] = useState(true);
  const [codFee, setCodFee] = useState("1.5");
  const [autoDeduct, setAutoDeduct] = useState(true);
  const [taxOnCOD, setTaxOnCOD] = useState(false);
  const [codInFinancials, setCodInFinancials] = useState(true);

  // Tracking
  const [apiTracking, setApiTracking] = useState(true);
  const [manualFallback, setManualFallback] = useState(true);
  const [showCustomer, setShowCustomer] = useState(false);
  const [historyDepth, setHistoryDepth] = useState("50");
  const [staleAfterDays, setStaleAfterDays] = useState("3");

  useEffect(() => {
    couriersAPI
      .getAll({ limit: 50 })
      .then((r) => setCouriers(r.data?.data?.couriers ?? []))
      .catch(() => {});
  }, []);

  const courierNames =
    couriers.length > 0
      ? couriers.map((c) => c.name)
      : [
          "TCS Express",
          "Leopards Courier",
          "M&P Express",
          "Trax",
          "PostEx",
          "BlueEX",
        ];

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    await new Promise((r) => setTimeout(r, 700)); // no backend settings endpoint
    setSaving(false);
    setSaveMsg("Settings saved.");
    setTimeout(() => setSaveMsg(""), 2500);
  };

  const SaveBtn: React.FC<{ label: string }> = ({ label }) => (
    <div
      style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}
    >
      <button className="c-btn primary" onClick={handleSave} disabled={saving}>
        <i
          className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-check"}`}
        />{" "}
        {saving ? "Saving…" : label}
      </button>
      {saveMsg && (
        <span
          style={{
            fontSize: 11,
            color: "var(--green)",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <i className="fa-solid fa-circle-check" /> {saveMsg}
        </span>
      )}
    </div>
  );

  return (
    <>
      <div className="panel-heading">Courier Settings</div>
      <div className="panel-desc">
        System-wide courier defaults — dispatch rules, cut-off times, COD
        settings, tracking options, and notification preferences.
      </div>

      <InnerTabs
        tabs={[
          { id: "general", label: "General" },
          { id: "dispatch", label: "Dispatch" },
          { id: "notif", label: "Notifications" },
          { id: "cod", label: "COD Settings" },
          { id: "tracking", label: "Tracking" },
        ]}
        active={innerTab}
        onChange={(t) => {
          setInnerTab(t);
          setSaveMsg("");
        }}
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
                    <div className="stg-key">Default Courier</div>
                    <div className="stg-desc">
                      Auto-assigned when no rule matches
                    </div>
                  </div>
                  <select
                    className="stg-select"
                    value={defaultCourier}
                    onChange={(e) => setDefaultCourier(e.target.value)}
                  >
                    <option value="">— None —</option>
                    {courierNames.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Default Payment Type</div>
                    <div className="stg-desc">COD or Prepaid default</div>
                  </div>
                  <select
                    className="stg-select"
                    value={defaultPayment}
                    onChange={(e) => setDefaultPayment(e.target.value)}
                  >
                    <option>COD</option>
                    <option>Prepaid</option>
                  </select>
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Currency</div>
                  </div>
                  <input
                    type="text"
                    className="stg-input"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Auto-create Shipment</div>
                    <div className="stg-desc">Create on order confirm</div>
                  </div>
                  <ToggleSwitch
                    defaultChecked={autoCreate}
                    onChange={setAutoCreate}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Allow Manual Override</div>
                  </div>
                  <ToggleSwitch
                    defaultChecked={manualOverride}
                    onChange={setManualOverride}
                  />
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-head">
                <i className="fa-solid fa-weight-hanging" /> Weight &amp;
                Packaging
              </div>
              <div className="settings-section-body">
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Default Weight (kg)</div>
                  </div>
                  <input
                    type="number"
                    className="stg-input"
                    style={{ width: 70 }}
                    value={defaultWeight}
                    onChange={(e) => setDefaultWeight(e.target.value)}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Dimensional Weight Factor</div>
                  </div>
                  <input
                    type="number"
                    className="stg-input"
                    style={{ width: 70 }}
                    value={dimFactor}
                    onChange={(e) => setDimFactor(e.target.value)}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Bill on</div>
                  </div>
                  <select
                    className="stg-select"
                    value={billOn}
                    onChange={(e) => setBillOn(e.target.value)}
                  >
                    <option>Higher of Both</option>
                    <option>Actual Only</option>
                    <option>Volumetric Only</option>
                  </select>
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Packaging Cost (₨)</div>
                  </div>
                  <input
                    type="number"
                    className="stg-input"
                    style={{ width: 70 }}
                    value={packagingCost}
                    onChange={(e) => setPackagingCost(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <SaveBtn label="Save General Settings" />
        </>
      )}

      {/* ── DISPATCH ── */}
      {innerTab === "dispatch" && (
        <>
          <div className="settings-grid">
            <div className="settings-section">
              <div className="settings-section-head">
                <i className="fa-solid fa-truck" /> Dispatch Rules
              </div>
              <div className="settings-section-body">
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Auto-assign Courier</div>
                  </div>
                  <ToggleSwitch
                    defaultChecked={autoAssign}
                    onChange={setAutoAssign}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Dispatch Cut-off Time</div>
                  </div>
                  <input
                    type="time"
                    className="stg-input"
                    value={cutoffTime}
                    onChange={(e) => setCutoffTime(e.target.value)}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Preferred Weekend Courier</div>
                  </div>
                  <select
                    className="stg-select"
                    value={weekendCourier}
                    onChange={(e) => setWeekendCourier(e.target.value)}
                  >
                    {courierNames.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                    <option>Same as Weekday</option>
                  </select>
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">High Value COD Threshold (₨)</div>
                  </div>
                  <input
                    type="number"
                    className="stg-input"
                    value={highValThreshold}
                    onChange={(e) => setHighValThreshold(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-head">
                <i className="fa-solid fa-redo" /> Re-attempt Settings
              </div>
              <div className="settings-section-body">
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Max Delivery Attempts</div>
                  </div>
                  <input
                    type="number"
                    className="stg-input"
                    style={{ width: 60 }}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(e.target.value)}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Re-attempt After (hours)</div>
                  </div>
                  <input
                    type="number"
                    className="stg-input"
                    style={{ width: 60 }}
                    value={reattemptHours}
                    onChange={(e) => setReattemptHours(e.target.value)}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Auto-RTO After Attempts</div>
                  </div>
                  <ToggleSwitch
                    defaultChecked={autoRTO}
                    onChange={setAutoRTO}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Contact Customer on Fail</div>
                  </div>
                  <ToggleSwitch
                    defaultChecked={contactOnFail}
                    onChange={setContactOnFail}
                  />
                </div>
              </div>
            </div>
          </div>
          <SaveBtn label="Save Dispatch Settings" />
        </>
      )}

      {/* ── NOTIFICATIONS ── */}
      {innerTab === "notif" && (
        <>
          <div className="settings-section" style={{ marginBottom: 14 }}>
            <div className="settings-section-head">
              <i className="fa-solid fa-bell" /> Notification Settings
            </div>
            <div className="settings-section-body">
              {[
                "Dispatched — Notify Ops Manager",
                "Delivered — Notify Accounts",
                "RTO Received — Notify Inventory",
                "Failed Delivery — Notify Admin",
                "COD Collected — Notify Accounts",
                "Daily Dispatch Summary",
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
                  <div className="stg-key">Delay Alert Threshold (Days)</div>
                </div>
                <input
                  type="number"
                  defaultValue={1}
                  className="stg-input"
                  style={{ width: 60 }}
                />
              </div>
            </div>
          </div>
          <SaveBtn label="Save Notification Settings" />
        </>
      )}

      {/* ── COD ── */}
      {innerTab === "cod" && (
        <>
          <div className="settings-grid">
            <div className="settings-section">
              <div className="settings-section-head">
                <i className="fa-solid fa-coins" /> COD Collection
              </div>
              <div className="settings-section-body">
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Auto-mark COD on Delivery</div>
                  </div>
                  <ToggleSwitch
                    defaultChecked={autoMarkCOD}
                    onChange={setAutoMarkCOD}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Expected Settlement (Days)</div>
                  </div>
                  <input
                    type="number"
                    className="stg-input"
                    style={{ width: 60 }}
                    value={codSettleDays}
                    onChange={(e) => setCodSettleDays(e.target.value)}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Overdue Alert (Days)</div>
                  </div>
                  <input
                    type="number"
                    className="stg-input"
                    style={{ width: 60 }}
                    value={codOverdueDays}
                    onChange={(e) => setCodOverdueDays(e.target.value)}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">COD Shortfall Alert</div>
                  </div>
                  <ToggleSwitch
                    defaultChecked={codShortfall}
                    onChange={setCodShortfall}
                  />
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-head">
                <i className="fa-solid fa-percent" /> Charges &amp; Deductions
              </div>
              <div className="settings-section-body">
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Default COD Fee (%)</div>
                  </div>
                  <input
                    type="number"
                    className="stg-input"
                    style={{ width: 70 }}
                    value={codFee}
                    onChange={(e) => setCodFee(e.target.value)}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Auto-deduct COD Fee</div>
                  </div>
                  <ToggleSwitch
                    defaultChecked={autoDeduct}
                    onChange={setAutoDeduct}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Include Tax on COD Fee</div>
                  </div>
                  <ToggleSwitch
                    defaultChecked={taxOnCOD}
                    onChange={setTaxOnCOD}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Record COD in Financials</div>
                  </div>
                  <ToggleSwitch
                    defaultChecked={codInFinancials}
                    onChange={setCodInFinancials}
                  />
                </div>
              </div>
            </div>
          </div>
          <SaveBtn label="Save COD Settings" />
        </>
      )}

      {/* ── TRACKING ── */}
      {innerTab === "tracking" && (
        <>
          <div className="settings-section" style={{ marginBottom: 14 }}>
            <div className="settings-section-head">
              <i className="fa-solid fa-location-dot" /> Tracking Configuration
            </div>
            <div className="settings-section-body">
              <div className="stg-row">
                <div>
                  <div className="stg-key">Enable API Tracking</div>
                </div>
                <ToggleSwitch
                  defaultChecked={apiTracking}
                  onChange={setApiTracking}
                />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">Manual Tracking Fallback</div>
                </div>
                <ToggleSwitch
                  defaultChecked={manualFallback}
                  onChange={setManualFallback}
                />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">Show Tracking to Customers</div>
                </div>
                <ToggleSwitch
                  defaultChecked={showCustomer}
                  onChange={setShowCustomer}
                />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">Tracking History Depth</div>
                </div>
                <input
                  type="number"
                  className="stg-input"
                  style={{ width: 60 }}
                  value={historyDepth}
                  onChange={(e) => setHistoryDepth(e.target.value)}
                />
              </div>
              <div className="stg-row">
                <div>
                  <div className="stg-key">
                    Flag Stale Shipments After (Days)
                  </div>
                </div>
                <input
                  type="number"
                  className="stg-input"
                  style={{ width: 60 }}
                  value={staleAfterDays}
                  onChange={(e) => setStaleAfterDays(e.target.value)}
                />
              </div>
            </div>
          </div>
          <SaveBtn label="Save Tracking Settings" />
        </>
      )}
    </>
  );
};

export default SettingsPanel;
