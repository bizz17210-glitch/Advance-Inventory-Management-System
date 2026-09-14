import React from "react";
import { StgToggleRow, StgRow } from "./SettingsShared";

const GeneralTab: React.FC = () => (
  <>
    <div className="info-banner">
      <i className="fa-solid fa-circle-info" />
      <div className="info-banner-text">
        General settings control system-wide defaults. Changes take effect
        immediately and apply to all users.
      </div>
    </div>

    <div className="grid-2" style={{ marginBottom: 14 }}>
      {/* Localisation */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-globe" /> Localisation
          </div>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Country</div>
              <select className="form-select">
                <option>Pakistan</option>
                <option>India</option>
                <option>UAE</option>
                <option>UK</option>
              </select>
            </div>
            <div className="form-group">
              <div className="form-label">Language</div>
              <select className="form-select">
                <option>English (UK)</option>
                <option>English (US)</option>
                <option>Urdu</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Currency</div>
              <select className="form-select">
                <option>PKR — Pakistani Rupee (₨)</option>
                <option>USD — US Dollar ($)</option>
                <option>AED — UAE Dirham (د.إ)</option>
              </select>
            </div>
            <div className="form-group">
              <div className="form-label">Currency Position</div>
              <select className="form-select">
                <option>Before amount — ₨1,200</option>
                <option>After amount — 1,200₨</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Date Format</div>
              <select className="form-select">
                <option>DD MMM YYYY (07 May 2026)</option>
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
            <div className="form-group">
              <div className="form-label">Time Format</div>
              <select className="form-select">
                <option>12-hour (2:30 PM)</option>
                <option>24-hour (14:30)</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Timezone</div>
              <select className="form-select">
                <option>PKT — Pakistan Standard Time (UTC+5)</option>
                <option>GMT — Greenwich Mean Time</option>
                <option>EST — Eastern Standard Time</option>
              </select>
            </div>
            <div className="form-group">
              <div className="form-label">Week Starts On</div>
              <select className="form-select">
                <option>Monday</option>
                <option>Sunday</option>
                <option>Saturday</option>
              </select>
            </div>
          </div>
          <hr />
          <button className="header-btn primary">
            <i className="fa-solid fa-check" /> Save Localisation
          </button>
        </div>
      </div>

      {/* Display & UI */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-display" /> Display & UI
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <StgToggleRow
              label="Compact Table Rows"
              desc="Reduce row height to show more data per screen"
            />
            <StgToggleRow
              label="Show Cost Price in Tables"
              desc="Visible to Admin and Manager roles only"
              defaultChecked
            />
            <StgToggleRow
              label="Show Profit Margin in Products"
              desc="Display gross margin % next to each product"
              defaultChecked
            />
            <StgRow label="Rows Per Page (default)">
              <select
                className="form-select"
                style={{ height: 26, fontSize: 11, minWidth: 80 }}
              >
                <option>10</option>
                <option>15</option>
                <option>25</option>
                <option>50</option>
              </select>
            </StgRow>
            <StgRow label="Default Sort Order">
              <select
                className="form-select"
                style={{ height: 26, fontSize: 11, minWidth: 130 }}
              >
                <option>Newest First</option>
                <option>Oldest First</option>
                <option>Alphabetical</option>
              </select>
            </StgRow>
            <StgToggleRow
              label="Sidebar Collapsed by Default"
              desc="Start with sidebar collapsed on login"
            />
            <StgToggleRow
              label="Show Onboarding Tips"
              desc="Display contextual help tooltips for new users"
              defaultChecked
            />
          </div>
          <hr />
          <button className="header-btn primary">
            <i className="fa-solid fa-check" /> Save Display Settings
          </button>
        </div>
      </div>
    </div>

    {/* Printing & Export */}
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <i className="fa-solid fa-print" /> Printing & Export Defaults
        </div>
      </div>
      <div className="card-body">
        <div className="grid-2">
          <div>
            <div className="form-row">
              <div className="form-group">
                <div className="form-label">Default Export Format</div>
                <select className="form-select">
                  <option>Excel (.xlsx)</option>
                  <option>CSV (.csv)</option>
                  <option>PDF</option>
                </select>
              </div>
              <div className="form-group">
                <div className="form-label">Paper Size (Printing)</div>
                <select className="form-select">
                  <option>A4</option>
                  <option>Letter</option>
                  <option>A5</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <div className="form-label">Invoice Logo</div>
                <input
                  className="form-input"
                  placeholder="Upload or paste URL..."
                />
              </div>
              <div className="form-group">
                <div className="form-label">Footer Text on Invoices</div>
                <input
                  className="form-input"
                  placeholder="e.g. Thank you for your order!"
                />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <StgToggleRow label="Print Cost Price on Invoices" />
            <StgToggleRow
              label="Include Barcode on Packing Slips"
              defaultChecked
            />
            <StgToggleRow label="Auto-generate PDF on Order Confirm" />
          </div>
        </div>
        <hr />
        <button className="header-btn primary">
          <i className="fa-solid fa-check" /> Save Print & Export Settings
        </button>
      </div>
    </div>
  </>
);

export default GeneralTab;
