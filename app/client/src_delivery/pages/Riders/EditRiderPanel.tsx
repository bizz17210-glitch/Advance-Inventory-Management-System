// EditRiderPanel.tsx — pre-filled edit form for existing rider
import React, { useState, useRef, useEffect } from "react";
import { NavPanel, ZONES_DATA } from "./shared";
import { ridersAPI } from "../../services/api";
import { ApiRider } from "./shared";

interface Props {
  onNav: (p: NavPanel) => void;
  rider: ApiRider;
  onSuccess?: () => void; // called after successful update
}

// ── Validation Rules ────────────────────────────────────────────────────────
const PHONE_REGEX = /^(\+92|0)(3\d{9}|[0-9]{9,10})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CURRENT_YEAR = new Date().getFullYear();

type FieldErrors = Record<string, string>;

const formatCNIC = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

const validators: Record<string, (v: string, form?: any) => string> = {
  fullName: (v) => {
    if (!v.trim()) return "Full name is required.";
    if (v.trim().length < 2) return "Name must be at least 2 characters.";
    if (!/^[a-zA-Z\s'.'-]+$/.test(v.trim()))
      return "Name can only contain letters, spaces, and apostrophes.";
    return "";
  },
  phone: (v) => {
    if (!v.trim()) return "Phone number is required.";
    const cleaned = v.trim().replace(/[\s-]/g, "");
    if (!PHONE_REGEX.test(cleaned))
      return "Enter a valid Pakistani number (e.g. +923001234567 or 03001234567).";
    return "";
  },
  email: (v) => {
    if (!v.trim()) return "";
    if (!EMAIL_REGEX.test(v.trim())) return "Enter a valid email address.";
    return "";
  },
  cnic: (v) => {
    if (!v.trim()) return "";
    const digits = v.replace(/\D/g, "");
    if (digits.length !== 13)
      return "CNIC must be 13 digits (XXXXX-XXXXXXX-X).";
    return "";
  },
  licenseNumber: (v) => {
    if (!v.trim()) return "";
    if (v.trim().length < 3) return "License number seems too short.";
    return "";
  },
  licenseExpiry: (v) => {
    if (!v) return "";
    const date = new Date(v);
    if (isNaN(date.getTime())) return "Enter a valid date.";
    return "";
  },
  vehicleYear: (v) => {
    if (!v) return "";
    const yr = parseInt(v);
    if (isNaN(yr)) return "Enter a valid year.";
    if (yr < 1980 || yr > CURRENT_YEAR + 1)
      return `Year must be between 1980 and ${CURRENT_YEAR + 1}.`;
    return "";
  },
  vehicleRegistration: (v) => {
    if (!v.trim()) return "";
    if (v.trim().length < 4) return "Registration number seems too short.";
    return "";
  },
  serviceCities: (v) => {
    if (!v.trim()) return "Enter at least one service city.";
    return "";
  },
  bankAccountNumber: (v) => {
    if (!v.trim()) return "";
    if (v.trim().length < 6) return "Account number seems too short.";
    return "";
  },
  bankAccountTitle: (v, form) => {
    if (!form?.bankAccountNumber?.trim()) return "";
    if (!v.trim())
      return "Account title is required when account number is provided.";
    return "";
  },
};

const validateAll = (form: Record<string, string>): FieldErrors => {
  const errs: FieldErrors = {};
  Object.keys(validators).forEach((field) => {
    const msg = validators[field](form[field] ?? "", form);
    if (msg) errs[field] = msg;
  });
  return errs;
};

// ── Helpers to extract initial values from ApiRider ─────────────────────────
const toDateInput = (val: any): string => {
  if (!val) return "";
  try {
    return new Date(val).toISOString().split("T")[0];
  } catch {
    return "";
  }
};

const EditRiderPanel: React.FC<Props> = ({ onNav, rider, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const summaryRef = useRef<HTMLDivElement>(null);

  // Pre-fill from rider
  const [form, setForm] = useState<Record<string, string>>({
    fullName: rider.fullName ?? "",
    phone: rider.phone ?? "",
    cnic: rider.cnic ? formatCNIC(rider.cnic) : "",
    email: rider.email ?? "",
    licenseNumber: rider.licenseNumber ?? "",
    licenseExpiry: toDateInput(rider.licenseExpiry),
    emergencyContactName: "",
    emergencyContactPhone: "",
    vehicleType: rider.vehicle?.type ?? "Motorcycle",
    vehicleRegistration: rider.vehicle?.registrationNumber ?? "",
    vehicleMake: rider.vehicle?.make ?? "",
    vehicleModel: rider.vehicle?.model ?? "",
    vehicleYear: rider.vehicle?.year ? String(rider.vehicle.year) : "",
    vehicleColor: rider.vehicle?.color ?? "",
    assignedZone: rider.assignedZone ?? ZONES_DATA[0]?.name ?? "",
    shift: "Morning (9AM–5PM)",
    serviceCities: rider.serviceCities?.join(", ") ?? "Lahore",
    paymentMethod: rider.paymentMethod ?? "JazzCash",
    bankAccountTitle: rider.bankDetails?.accountTitle ?? "",
    bankAccountNumber: rider.bankDetails?.accountNumber ?? "",
    bankName: rider.bankDetails?.bankName ?? "",
  });

  const set = (k: string, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (touched[k] && fieldErrors[k]) {
      const updated = { ...form, [k]: v };
      const msg = validators[k] ? validators[k](v, updated) : "";
      setFieldErrors((p) => ({ ...p, [k]: msg }));
    }
  };

  const setCNIC = (raw: string) => set("cnic", formatCNIC(raw));

  const handleBlur = (field: string) => {
    setTouched((p) => ({ ...p, [field]: true }));
    if (validators[field]) {
      const msg = validators[field](form[field] ?? "", form);
      setFieldErrors((p) => ({ ...p, [field]: msg }));
    }
  };

  const FieldError = ({ field }: { field: string }) => {
    const msg = fieldErrors[field];
    if (!msg || !touched[field]) return null;
    return (
      <div
        style={{
          color: "#ef4444",
          fontSize: 11,
          marginTop: 3,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <i
          className="fa-solid fa-circle-exclamation"
          style={{ fontSize: 10 }}
        />
        {msg}
      </div>
    );
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    borderColor: touched[field] && fieldErrors[field] ? "#ef4444" : undefined,
  });

  const handleSubmit = async () => {
    const allFields = Object.keys(validators);
    const allTouched = allFields.reduce(
      (acc, k) => ({ ...acc, [k]: true }),
      {} as Record<string, boolean>,
    );
    setTouched(allTouched);

    const errs = validateAll(form);
    setFieldErrors(errs);

    const errorCount = Object.values(errs).filter(Boolean).length;
    if (errorCount > 0) {
      setSubmitError(
        `Please fix ${errorCount} error${errorCount > 1 ? "s" : ""} before submitting.`,
      );
      setTimeout(
        () =>
          summaryRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        50,
      );
      return;
    }

    setLoading(true);
    setSubmitError("");

    try {
      const vehicle: Record<string, any> = { type: form.vehicleType };
      if (form.vehicleMake.trim()) vehicle.make = form.vehicleMake.trim();
      if (form.vehicleModel.trim()) vehicle.model = form.vehicleModel.trim();
      if (form.vehicleYear) vehicle.year = parseInt(form.vehicleYear);
      if (form.vehicleRegistration.trim())
        vehicle.registrationNumber = form.vehicleRegistration.trim();
      if (form.vehicleColor.trim()) vehicle.color = form.vehicleColor.trim();

      const payload: Record<string, any> = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        vehicle,
        assignedZone: form.assignedZone,
        serviceCities: form.serviceCities
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        paymentMethod: form.paymentMethod,
      };

      if (form.email.trim()) payload.email = form.email.trim();
      if (form.cnic.trim()) payload.cnic = form.cnic.trim();
      if (form.licenseNumber.trim())
        payload.licenseNumber = form.licenseNumber.trim();
      if (form.licenseExpiry) payload.licenseExpiry = form.licenseExpiry;

      if (form.bankAccountNumber.trim() || form.bankAccountTitle.trim()) {
        payload.bankDetails = {
          ...(form.bankAccountTitle.trim() && {
            accountTitle: form.bankAccountTitle.trim(),
          }),
          ...(form.bankAccountNumber.trim() && {
            accountNumber: form.bankAccountNumber.trim(),
          }),
          ...(form.bankName.trim() && { bankName: form.bankName.trim() }),
        };
      }

      await ridersAPI.update(rider._id, payload);
      setSuccess("Rider updated successfully!");
      onSuccess?.();
      setTimeout(() => onNav("all"), 2000);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "";
      const serverErrors: { field: string; message: string }[] =
        e?.response?.data?.errors ?? [];

      if (serverErrors.length > 0) {
        const newFieldErrs: Record<string, string> = {};
        const newTouched: Record<string, boolean> = {};
        serverErrors.forEach(({ field, message }) => {
          newFieldErrs[field] = message;
          newTouched[field] = true;
        });
        setFieldErrors((p) => ({ ...p, ...newFieldErrs }));
        setTouched((p) => ({ ...p, ...newTouched }));
        setSubmitError(
          `Please fix the following: ${serverErrors.map((se) => `${se.field}: ${se.message}`).join(", ")}`,
        );
      } else {
        setSubmitError(msg || "Failed to update rider. Please try again.");
      }

      setTimeout(
        () =>
          summaryRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        50,
      );
    } finally {
      setLoading(false);
    }
  };

  const summaryErrors = Object.entries(fieldErrors)
    .filter(([, v]) => Boolean(v))
    .map(([k, v]) => ({ field: k, msg: v }));

  const fieldLabels: Record<string, string> = {
    fullName: "Full Name",
    phone: "Phone Number",
    email: "Email",
    cnic: "CNIC",
    licenseNumber: "License Number",
    licenseExpiry: "License Expiry",
    vehicleYear: "Vehicle Year",
    vehicleRegistration: "Registration Number",
    serviceCities: "Service Cities",
    bankAccountNumber: "Account Number",
    bankAccountTitle: "Account Title",
  };

  return (
    <>
      <div className="panel-heading">Edit Rider</div>
      <div className="panel-desc">
        Update details for <strong>{rider.fullName}</strong>. Email and password
        cannot be changed here.
      </div>

      <div ref={summaryRef}>
        {submitError && !success && (
          <div className="alert-strip danger" style={{ marginBottom: 8 }}>
            <i
              className="fa-solid fa-triangle-exclamation"
              style={{ marginRight: 6 }}
            />
            <strong>{submitError}</strong>
            {summaryErrors.length > 0 && (
              <ul style={{ margin: "6px 0 0 16px", padding: 0, fontSize: 12 }}>
                {summaryErrors.map(({ field, msg }) => (
                  <li key={field}>
                    <strong>{fieldLabels[field] ?? field}:</strong> {msg}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {success && (
          <div className="alert-strip success" style={{ marginBottom: 8 }}>
            <i
              className="fa-solid fa-circle-check"
              style={{ marginRight: 6 }}
            />
            {success}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i
              className="fa-solid fa-pen"
              style={{ color: "#2563EB", marginRight: 6 }}
            />
            Rider Details
          </div>
        </div>
        <div className="card-body">
          {/* ══ Personal Info ══ */}
          <div className="section-label">
            <i
              className="fa-solid fa-bolt"
              style={{ color: "#f59e0b", fontSize: 10, marginRight: 5 }}
            />
            Personal Information
          </div>

          <div className="c-form-row">
            <div className="c-form-group">
              <div className="c-form-label">Full Name *</div>
              <input
                className="c-form-input"
                placeholder="e.g. Usman Ahmed"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                onBlur={() => handleBlur("fullName")}
                style={inputStyle("fullName")}
              />
              <FieldError field="fullName" />
            </div>
            <div className="c-form-group">
              <div className="c-form-label">Phone Number *</div>
              <input
                className="c-form-input"
                placeholder="+923XXXXXXXXX or 03XXXXXXXXX"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                onBlur={() => handleBlur("phone")}
                style={inputStyle("phone")}
              />
              <FieldError field="phone" />
            </div>
          </div>

          <div className="c-form-row">
            <div className="c-form-group">
              <div className="c-form-label">
                Email
                <span
                  style={{
                    fontSize: 10,
                    color: "#6B7280",
                    marginLeft: 6,
                    fontWeight: 400,
                  }}
                >
                  (optional)
                </span>
              </div>
              <input
                className="c-form-input"
                type="email"
                placeholder="rider@example.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                style={inputStyle("email")}
              />
              <FieldError field="email" />
            </div>
            <div className="c-form-group">
              <div className="c-form-label">
                CNIC Number
                <span style={{ color: "#6B7280", fontSize: 10, marginLeft: 6 }}>
                  (optional — auto-formatted)
                </span>
              </div>
              <input
                className="c-form-input"
                placeholder="XXXXX-XXXXXXX-X"
                value={form.cnic}
                onChange={(e) => setCNIC(e.target.value)}
                onBlur={() => handleBlur("cnic")}
                style={inputStyle("cnic")}
                maxLength={15}
              />
              <FieldError field="cnic" />
            </div>
          </div>

          <div className="c-form-row">
            <div className="c-form-group">
              <div className="c-form-label">License Number</div>
              <input
                className="c-form-input"
                placeholder="e.g. LHR-D-2024-001"
                value={form.licenseNumber}
                onChange={(e) => set("licenseNumber", e.target.value)}
                onBlur={() => handleBlur("licenseNumber")}
                style={inputStyle("licenseNumber")}
              />
              <FieldError field="licenseNumber" />
            </div>
            <div className="c-form-group">
              <div className="c-form-label">License Expiry</div>
              <input
                className="c-form-input"
                type="date"
                value={form.licenseExpiry}
                onChange={(e) => set("licenseExpiry", e.target.value)}
                onBlur={() => handleBlur("licenseExpiry")}
                style={inputStyle("licenseExpiry")}
              />
              <FieldError field="licenseExpiry" />
            </div>
          </div>

          <div className="c-form-row">
            <div className="c-form-group">
              <div className="c-form-label">Emergency Contact Name</div>
              <input
                className="c-form-input"
                placeholder="Name"
                value={form.emergencyContactName}
                onChange={(e) => set("emergencyContactName", e.target.value)}
              />
            </div>
            <div className="c-form-group">
              <div className="c-form-label">Emergency Contact Phone</div>
              <input
                className="c-form-input"
                placeholder="+923XXXXXXXXX"
                value={form.emergencyContactPhone}
                onChange={(e) => set("emergencyContactPhone", e.target.value)}
              />
            </div>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--divider)",
              margin: "12px 0",
            }}
          />

          {/* ══ Vehicle & Assignment ══ */}
          <div className="section-label">
            <i
              className="fa-solid fa-bolt"
              style={{ color: "#f59e0b", fontSize: 10, marginRight: 5 }}
            />
            Vehicle &amp; Assignment
          </div>

          <div className="c-form-row">
            <div className="c-form-group">
              <div className="c-form-label">Vehicle Type</div>
              <select
                className="c-form-select"
                value={form.vehicleType}
                onChange={(e) => set("vehicleType", e.target.value)}
              >
                <option>Motorcycle</option>
                <option>Bicycle</option>
                <option>Van</option>
                <option>Car</option>
              </select>
            </div>
            <div className="c-form-group">
              <div className="c-form-label">Registration Number</div>
              <input
                className="c-form-input"
                placeholder="LHR-1234"
                value={form.vehicleRegistration}
                onChange={(e) => set("vehicleRegistration", e.target.value)}
                onBlur={() => handleBlur("vehicleRegistration")}
                style={inputStyle("vehicleRegistration")}
              />
              <FieldError field="vehicleRegistration" />
            </div>
          </div>

          <div className="c-form-row triple">
            <div className="c-form-group">
              <div className="c-form-label">Make</div>
              <input
                className="c-form-input"
                placeholder="Honda"
                value={form.vehicleMake}
                onChange={(e) => set("vehicleMake", e.target.value)}
              />
            </div>
            <div className="c-form-group">
              <div className="c-form-label">Model</div>
              <input
                className="c-form-input"
                placeholder="CD 70"
                value={form.vehicleModel}
                onChange={(e) => set("vehicleModel", e.target.value)}
              />
            </div>
            <div className="c-form-group">
              <div className="c-form-label">Year</div>
              <input
                className="c-form-input"
                type="number"
                placeholder="2022"
                value={form.vehicleYear}
                onChange={(e) => set("vehicleYear", e.target.value)}
                onBlur={() => handleBlur("vehicleYear")}
                style={inputStyle("vehicleYear")}
                min={1980}
                max={CURRENT_YEAR + 1}
              />
              <FieldError field="vehicleYear" />
            </div>
          </div>

          <div className="c-form-row">
            <div className="c-form-group">
              <div className="c-form-label">Vehicle Color</div>
              <input
                className="c-form-input"
                placeholder="Red"
                value={form.vehicleColor}
                onChange={(e) => set("vehicleColor", e.target.value)}
              />
            </div>
            <div className="c-form-group">
              <div className="c-form-label">Primary Delivery Zone</div>
              <select
                className="c-form-select"
                value={form.assignedZone}
                onChange={(e) => set("assignedZone", e.target.value)}
              >
                {ZONES_DATA.map((z) => (
                  <option key={z.name}>{z.name}</option>
                ))}
                <option>All Zones</option>
              </select>
            </div>
          </div>

          <div className="c-form-row">
            <div className="c-form-group">
              <div className="c-form-label">
                Service Cities (comma-separated)
              </div>
              <input
                className="c-form-input"
                placeholder="Lahore, Islamabad"
                value={form.serviceCities}
                onChange={(e) => set("serviceCities", e.target.value)}
                onBlur={() => handleBlur("serviceCities")}
                style={inputStyle("serviceCities")}
              />
              <FieldError field="serviceCities" />
            </div>
            <div className="c-form-group">
              <div className="c-form-label">Shift</div>
              <select
                className="c-form-select"
                value={form.shift}
                onChange={(e) => set("shift", e.target.value)}
              >
                <option>Morning (9AM–5PM)</option>
                <option>Evening (5PM–11PM)</option>
                <option>Full Day</option>
                <option>Flexible</option>
              </select>
            </div>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--divider)",
              margin: "12px 0",
            }}
          />

          {/* ══ Payment Details ══ */}
          <div className="section-label">
            <i
              className="fa-solid fa-bolt"
              style={{ color: "#f59e0b", fontSize: 10, marginRight: 5 }}
            />
            Payment Details
          </div>

          <div className="c-form-row">
            <div className="c-form-group">
              <div className="c-form-label">Payment Method</div>
              <select
                className="c-form-select"
                value={form.paymentMethod}
                onChange={(e) => set("paymentMethod", e.target.value)}
              >
                <option value="JazzCash">JazzCash</option>
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="BankTransfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div className="c-form-group">
              <div className="c-form-label">Account Title</div>
              <input
                className="c-form-input"
                placeholder="Account holder name"
                value={form.bankAccountTitle}
                onChange={(e) => set("bankAccountTitle", e.target.value)}
                onBlur={() => handleBlur("bankAccountTitle")}
                style={inputStyle("bankAccountTitle")}
              />
              <FieldError field="bankAccountTitle" />
            </div>
          </div>

          <div className="c-form-row">
            <div className="c-form-group">
              <div className="c-form-label">Account Number / Mobile</div>
              <input
                className="c-form-input"
                placeholder="03001234567"
                value={form.bankAccountNumber}
                onChange={(e) => set("bankAccountNumber", e.target.value)}
                onBlur={() => {
                  handleBlur("bankAccountNumber");
                  handleBlur("bankAccountTitle");
                }}
                style={inputStyle("bankAccountNumber")}
              />
              <FieldError field="bankAccountNumber" />
            </div>
            <div className="c-form-group">
              <div className="c-form-label">Bank Name</div>
              <input
                className="c-form-input"
                placeholder="JazzCash / HBL / etc."
                value={form.bankName}
                onChange={(e) => set("bankName", e.target.value)}
              />
            </div>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--divider)",
              margin: "12px 0",
            }}
          />

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className="c-btn primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> Saving…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check" /> Save Changes
                </>
              )}
            </button>
            <button
              className="c-btn"
              onClick={() => onNav("all")}
              disabled={loading}
            >
              Cancel
            </button>
            {Object.values(fieldErrors).filter(Boolean).length > 0 &&
              !success && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#ef4444",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <i className="fa-solid fa-circle-exclamation" />
                  {Object.values(fieldErrors).filter(Boolean).length} issue
                  {Object.values(fieldErrors).filter(Boolean).length > 1
                    ? "s"
                    : ""}{" "}
                  to fix
                </span>
              )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EditRiderPanel;
