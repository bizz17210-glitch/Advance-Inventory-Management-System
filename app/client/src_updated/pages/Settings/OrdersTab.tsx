import React from "react";
import { StgToggleRow } from "./SettingsShared";

const OrdersTab: React.FC = () => (
  <>
    <div className="grid-2" style={{ marginBottom: 14 }}>
      {/* Order Defaults */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-bag-shopping" /> Order Defaults
          </div>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Default Order Status (on Create)</div>
              <select className="form-select">
                <option>Pending</option>
                <option>Confirmed</option>
              </select>
            </div>
            <div className="form-group">
              <div className="form-label">Default Payment Type</div>
              <select className="form-select">
                <option>COD</option>
                <option>Prepaid</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Default Order Channel</div>
              <select className="form-select">
                <option>WhatsApp</option>
                <option>Shopify</option>
                <option>Manual</option>
              </select>
            </div>
            <div className="form-group">
              <div className="form-label">Auto-confirm After (hours)</div>
              <input className="form-input" type="number" defaultValue={24} />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
              marginTop: 8,
            }}
          >
            <StgToggleRow
              label="Auto-deduct Stock on Order Confirm"
              desc="Reduce inventory when order is confirmed"
              defaultChecked
            />
            <StgToggleRow
              label="Reserve Stock on Pending Orders"
              desc="Hold stock while order awaits confirmation"
              defaultChecked
            />
            <StgToggleRow
              label="Allow Orders on Out-of-Stock Items"
              desc="Accept orders even if stock is zero"
            />
            <StgToggleRow
              label="Auto-assign Courier on Confirm"
              desc="Use assignment rules to auto-pick courier"
              defaultChecked
            />
            <StgToggleRow
              label="Alert Manager on Cancellation"
              defaultChecked
            />
          </div>
          <hr />
          <button className="header-btn primary">
            <i className="fa-solid fa-check" /> Save Order Defaults
          </button>
        </div>
      </div>

      {/* COD Settings */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-money-bills" /> COD Settings
          </div>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Max COD Amount Per Order (₨)</div>
              <input
                className="form-input"
                type="number"
                defaultValue={20000}
              />
            </div>
            <div className="form-group">
              <div className="form-label">
                High-Value COD Flag Threshold (₨)
              </div>
              <input
                className="form-input"
                type="number"
                defaultValue={10000}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">COD Submission Deadline</div>
              <select className="form-select">
                <option>End of Shift</option>
                <option>Daily 6 PM</option>
                <option>Next Morning 10 AM</option>
              </select>
            </div>
            <div className="form-group">
              <div className="form-label">Max COD Per Rider (₨)</div>
              <input
                className="form-input"
                type="number"
                defaultValue={15000}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
              marginTop: 8,
            }}
          >
            <StgToggleRow
              label="Require Manager Approval for High COD"
              defaultChecked
            />
            <StgToggleRow
              label="Auto-mark COD Collected on Delivery Confirm"
              defaultChecked
            />
            <StgToggleRow
              label="Alert Accounts on COD Submission Delay"
              defaultChecked
            />
            <StgToggleRow
              label="Record COD in Financial Module Automatically"
              defaultChecked
            />
          </div>
          <hr />
          <button className="header-btn primary">
            <i className="fa-solid fa-check" /> Save COD Settings
          </button>
        </div>
      </div>
    </div>

    {/* Order ID Format */}
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <i className="fa-solid fa-id-card" /> Order ID & Reference Format
        </div>
      </div>
      <div className="card-body">
        <div className="grid-2">
          <div>
            <div className="form-row">
              <div className="form-group">
                <div className="form-label">Order ID Prefix</div>
                <input className="form-input" defaultValue="ORD-" />
              </div>
              <div className="form-group">
                <div className="form-label">Starting Number</div>
                <input
                  className="form-input"
                  type="number"
                  defaultValue={1001}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <div className="form-label">Invoice Prefix</div>
                <input className="form-input" defaultValue="INV-" />
              </div>
              <div className="form-group">
                <div className="form-label">Invoice Starting Number</div>
                <input
                  className="form-input"
                  type="number"
                  defaultValue={1001}
                />
              </div>
            </div>
          </div>
          <div className="order-id-preview">
            <div className="order-id-preview-label">Preview</div>
            <div className="detail-row">
              <div className="detail-key">Next Order ID</div>
              <div className="detail-val">
                <code
                  style={{
                    fontSize: 11,
                    background: "var(--card)",
                    padding: "2px 7px",
                    borderRadius: 4,
                    fontFamily: "monospace",
                    border: "1px solid var(--border)",
                  }}
                >
                  ORD-1049
                </code>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-key">Next Invoice No.</div>
              <div className="detail-val">
                <code
                  style={{
                    fontSize: 11,
                    background: "var(--card)",
                    padding: "2px 7px",
                    borderRadius: 4,
                    fontFamily: "monospace",
                    border: "1px solid var(--border)",
                  }}
                >
                  INV-1049
                </code>
              </div>
            </div>
          </div>
        </div>
        <hr />
        <button className="header-btn primary">
          <i className="fa-solid fa-check" /> Save ID Format
        </button>
      </div>
    </div>
  </>
);

export default OrdersTab;
