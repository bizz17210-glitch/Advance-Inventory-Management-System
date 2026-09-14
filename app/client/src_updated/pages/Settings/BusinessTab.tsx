import React from "react";

const BusinessTab: React.FC = () => (
  <div className="grid-2" style={{ marginBottom: 14 }}>
    {/* Business Details */}
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <i className="fa-solid fa-store" /> Business Details
        </div>
      </div>
      <div className="card-body">
        <div className="form-row" style={{ gridTemplateColumns: "1fr" }}>
          <div className="form-group">
            <div className="form-label">Business Name *</div>
            <input
              className="form-input"
              defaultValue="My Fashion Store"
              style={{ width: "100%" }}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <div className="form-label">Business Type</div>
            <select className="form-select">
              <option>Retail — Fashion & Apparel</option>
              <option>Wholesale</option>
              <option>Manufacturing</option>
              <option>E-commerce</option>
            </select>
          </div>
          <div className="form-group">
            <div className="form-label">NTN / Tax ID</div>
            <input className="form-input" placeholder="e.g. 1234567-8" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <div className="form-label">Phone Number</div>
            <input className="form-input" defaultValue="0321-1234567" />
          </div>
          <div className="form-group">
            <div className="form-label">Email Address</div>
            <input
              className="form-input"
              type="email"
              defaultValue="hello@mystore.pk"
            />
          </div>
        </div>
        <div className="form-row" style={{ gridTemplateColumns: "1fr" }}>
          <div className="form-group">
            <div className="form-label">Website / Shopify URL</div>
            <input
              className="form-input"
              placeholder="https://mystore.myshopify.com"
              style={{ width: "100%" }}
            />
          </div>
        </div>
        <div className="form-row" style={{ gridTemplateColumns: "1fr" }}>
          <div className="form-group">
            <div className="form-label">Business Address (Line 1)</div>
            <input
              className="form-input"
              placeholder="Street, Building"
              style={{ width: "100%" }}
            />
          </div>
        </div>
        <div className="form-row triple">
          <div className="form-group">
            <div className="form-label">City</div>
            <input className="form-input" defaultValue="Lahore" />
          </div>
          <div className="form-group">
            <div className="form-label">Province</div>
            <select className="form-select">
              <option>Punjab</option>
              <option>Sindh</option>
              <option>KPK</option>
              <option>Balochistan</option>
            </select>
          </div>
          <div className="form-group">
            <div className="form-label">Postal Code</div>
            <input className="form-input" placeholder="54000" />
          </div>
        </div>
        <hr />
        <button className="header-btn primary">
          <i className="fa-solid fa-check" /> Save Business Details
        </button>
      </div>
    </div>

    <div>
      {/* Branding */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-image" /> Branding
          </div>
        </div>
        <div className="card-body">
          <div className="form-group" style={{ marginBottom: 12 }}>
            <div className="form-label">Business Logo</div>
            <div className="upload-zone">
              <i className="fa-solid fa-cloud-arrow-up ic-orange upload-zone-icon" />
              <div className="upload-zone-title">Upload Logo</div>
              <div className="upload-zone-hint">
                PNG, JPG · Max 2MB · Recommended: 300×100px
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Primary Accent Color</div>
              <input
                className="form-input"
                type="color"
                defaultValue="#FF6A00"
                style={{ padding: "2px 4px", height: 28, cursor: "pointer" }}
              />
            </div>
            <div className="form-group">
              <div className="form-label">Invoice Color Theme</div>
              <select className="form-select">
                <option>Orange (Default)</option>
                <option>Blue</option>
                <option>Green</option>
                <option>Monochrome</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <div className="form-label">
              SMS Sender Name (for customer alerts)
            </div>
            <input
              className="form-input"
              placeholder="MyStore"
              style={{ width: "100%" }}
            />
          </div>
          <hr />
          <button className="header-btn primary">
            <i className="fa-solid fa-check" /> Save Branding
          </button>
        </div>
      </div>

      {/* Social Media */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-share-nodes" /> Social Media Links
          </div>
        </div>
        <div className="card-body">
          <div className="form-group" style={{ marginBottom: 8 }}>
            <div className="form-label">
              <i
                className="fa-brands fa-whatsapp"
                style={{ color: "#25D366" }}
              />{" "}
              WhatsApp Business
            </div>
            <input
              className="form-input"
              placeholder="https://wa.me/923XX..."
              style={{ width: "100%" }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 8 }}>
            <div className="form-label">
              <i
                className="fa-brands fa-instagram"
                style={{ color: "#E1306C" }}
              />{" "}
              Instagram
            </div>
            <input
              className="form-input"
              placeholder="https://instagram.com/..."
              style={{ width: "100%" }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 8 }}>
            <div className="form-label">
              <i
                className="fa-brands fa-facebook"
                style={{ color: "#1877F2" }}
              />{" "}
              Facebook Page
            </div>
            <input
              className="form-input"
              placeholder="https://facebook.com/..."
              style={{ width: "100%" }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <div className="form-label">
              <i className="fa-brands fa-tiktok" /> TikTok
            </div>
            <input
              className="form-input"
              placeholder="https://tiktok.com/@..."
              style={{ width: "100%" }}
            />
          </div>
          <hr />
          <button className="header-btn primary">
            <i className="fa-solid fa-check" /> Save Social Links
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default BusinessTab;
