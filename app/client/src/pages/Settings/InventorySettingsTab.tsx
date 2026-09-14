import React from "react";
import { StgToggleRow } from "./SettingsShared";

const InventorySettingsTab: React.FC = () => (
  <>
    <div className="grid-2" style={{ marginBottom: 14 }}>
      {/* Stock Management */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-cubes" /> Stock Management
          </div>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Default Low Stock Threshold</div>
              <input className="form-input" type="number" defaultValue={10} />
            </div>
            <div className="form-group">
              <div className="form-label">Critical Stock Threshold</div>
              <input className="form-input" type="number" defaultValue={3} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Alert Notifications To</div>
              <select className="form-select">
                <option>Inventory Manager</option>
                <option>Admin</option>
                <option>Both</option>
              </select>
            </div>
            <div className="form-group">
              <div className="form-label">Alert Frequency</div>
              <select className="form-select">
                <option>Real-time</option>
                <option>Daily Digest</option>
                <option>Weekly Digest</option>
              </select>
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
              label="Allow Negative Stock"
              desc="Accept orders when stock is at zero"
            />
            <StgToggleRow
              label="Track Variants Independently"
              desc="Separate stock counts per size/color"
              defaultChecked
            />
            <StgToggleRow
              label="Auto-reorder Notifications"
              desc="Notify buyer when threshold is hit"
              defaultChecked
            />
            <StgToggleRow
              label="Require Reason on Manual Adjustment"
              defaultChecked
            />
          </div>
          <hr />
          <button className="header-btn primary">
            <i className="fa-solid fa-check" /> Save Stock Settings
          </button>
        </div>
      </div>

      {/* SKU Configuration */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-barcode" /> SKU Configuration
          </div>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">SKU Prefix</div>
              <input className="form-input" defaultValue="SKU-" />
            </div>
            <div className="form-group">
              <div className="form-label">Starting Number</div>
              <input className="form-input" type="number" defaultValue={1} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">SKU Format</div>
              <select className="form-select">
                <option>PREFIX-NNNN (SKU-0041)</option>
                <option>PREFIX-NAME (SKU-KURTA)</option>
                <option>Auto-increment only</option>
              </select>
            </div>
            <div className="form-group">
              <div className="form-label">Variant SKU Separator</div>
              <select className="form-select">
                <option>Dash — SKU-0041-XL</option>
                <option>Slash — SKU-0041/XL</option>
                <option>Underscore — SKU-0041_XL</option>
              </select>
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
              label="Auto-generate SKU on Add"
              desc="Assign SKU automatically when product is created"
              defaultChecked
            />
            <StgToggleRow label="Allow Manual SKU Override" defaultChecked />
            <StgToggleRow
              label="Enforce SKU Uniqueness"
              desc="Block duplicate SKUs on import or add"
              defaultChecked
            />
          </div>
          <hr />
          <div className="sku-preview-box">
            <div className="sku-preview-label">Next SKU Preview</div>
            <code className="sku-preview-value">SKU-0249</code>
          </div>
          <button className="header-btn primary">
            <i className="fa-solid fa-check" /> Save SKU Settings
          </button>
        </div>
      </div>
    </div>

    {/* Bulk Import */}
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <i className="fa-solid fa-file-import" /> Bulk Import Defaults
        </div>
      </div>
      <div className="card-body">
        <div className="grid-2">
          <div>
            <div className="form-row">
              <div className="form-group">
                <div className="form-label">On Duplicate SKU</div>
                <select className="form-select">
                  <option>Skip (keep existing)</option>
                  <option>Update existing</option>
                  <option>Error and stop</option>
                </select>
              </div>
              <div className="form-group">
                <div className="form-label">Max Rows Per Import</div>
                <input
                  className="form-input"
                  type="number"
                  defaultValue={500}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <div className="form-label">
                  Default Category for Unspecified
                </div>
                <select className="form-select">
                  <option>— None —</option>
                  <option>Suits</option>
                  <option>Kurtas</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <div className="form-label">Notify on Import Completion</div>
                <select className="form-select">
                  <option>Yes — Dashboard</option>
                  <option>Yes — Email</option>
                  <option>No</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <StgToggleRow
              label="Auto-generate Missing SKUs on Import"
              defaultChecked
            />
            <StgToggleRow
              label="Validate Prices Before Import"
              desc="Reject rows where sale price < cost price"
              defaultChecked
            />
            <StgToggleRow label="Log Import History" defaultChecked />
          </div>
        </div>
        <hr />
        <button className="header-btn primary">
          <i className="fa-solid fa-check" /> Save Import Settings
        </button>
      </div>
    </div>
  </>
);

export default InventorySettingsTab;
