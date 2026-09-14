// AddRiderPanel.tsx — with full validation (onBlur + submit, auto CNIC, field errors + summary)
import React, { useState, useRef } from "react";
import { NavPanel, ZONES_DATA } from "./shared";
import { ridersAPI, authAPI } from "../../services/api";

interface Props {
  onNav: (p: NavPanel) => void;
}

// ── Validation Rules ────────────────────────────────────────────────────────
const PHONE_REGEX = /^(\+92|0)(3\d{9}|[0-9]{9,10})$/;
const CNIC_CLEAN_REGEX = /^\d{13}$/; // after stripping dashes
const CNIC_FORMATTED_REGEX = /^\d{5}-\d{7}-\d{1}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CURRENT_YEAR = new Date().getFullYear();

type FieldErrors = Record<string, string>;

// ── Auto-format CNIC (inserts dashes at positions 5 and 13) ────────────────
const formatCNIC = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

// ── Individual field validators (return error string or "") ─────────────────
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
    if (!v.trim()) return "Email is required to create rider account.";
    if (!EMAIL_REGEX.test(v.trim())) return "Enter a valid email address.";
    return "";
  },
  cnic: (v) => {
    if (!v.trim()) return ""; // optional
    const digits = v.replace(/\D/g, "");
    if (digits.length !== 13)
      return "CNIC must be 13 digits (XXXXX-XXXXXXX-X).";
    return "";
  },
  licenseNumber: (v) => {
    if (!v.trim()) return ""; // optional
    if (v.trim().length < 3) return "License number seems too short.";
    return "";
  },
  licenseExpiry: (v) => {
    if (!v) return ""; // optional
    const date = new Date(v);
    if (isNaN(date.getTime())) return "Enter a valid date.";
    if (date < new Date()) return "License expiry date cannot be in the past.";
    return "";
  },
  vehicleYear: (v) => {
    if (!v) return ""; // optional
    const yr = parseInt(v);
    if (isNaN(yr)) return "Enter a valid year.";
    if (yr < 1980 || yr > CURRENT_YEAR + 1)
      return `Year must be between 1980 and ${CURRENT_YEAR + 1}.`;
    return "";
  },
  vehicleRegistration: (v) => {
    if (!v.trim()) return ""; // optional
    if (v.trim().length < 4) return "Registration number seems too short.";
    return "";
  },
  serviceCities: (v) => {
    if (!v.trim()) return "Enter at least one service city.";
    return "";
  },
  bankAccountNumber: (v, form) => {
    if (!v.trim()) return ""; // optional
    if (v.trim().length < 6) return "Account number seems too short.";
    return "";
  },
  bankAccountTitle: (v, form) => {
    // required only if account number is filled
    if (!form?.bankAccountNumber?.trim()) return "";
    if (!v.trim())
      return "Account title is required when account number is provided.";
    return "";
  },
};

// ── Run all validations and return full error map ───────────────────────────
const validateAll = (form: Record<string, string>): FieldErrors => {
  const errs: FieldErrors = {};
  Object.keys(validators).forEach((field) => {
    const msg = validators[field](form[field] ?? "", form);
    if (msg) errs[field] = msg;
  });
  return errs;
};

// ── Component ───────────────────────────────────────────────────────────────
const AddRiderPanel: React.FC<Props> = ({ onNav }) => {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const summaryRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<Record<string, string>>({
    fullName: "",
    phone: "",
    cnic: "",
    email: "",
    licenseNumber: "",
    licenseExpiry: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    vehicleType: "Motorcycle",
    vehicleRegistration: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleColor: "",
    assignedZone: ZONES_DATA[0]?.name ?? "",
    shift: "Morning (9AM–5PM)",
    serviceCities: "Lahore",
    paymentMethod: "JazzCash",
    bankAccountTitle: "",
    bankAccountNumber: "",
    bankName: "",
  });

  // ── Generic setter ────────────────────────────────────────────────────────
  const set = (k: string, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    // Clear field error as user types (after it was touched)
    if (touched[k] && fieldErrors[k]) {
      const updated = { ...form, [k]: v };
      const msg = validators[k] ? validators[k](v, updated) : "";
      setFieldErrors((p) => ({ ...p, [k]: msg }));
    }
  };

  // ── CNIC special setter (auto-format) ─────────────────────────────────────
  const setCNIC = (raw: string) => {
    const formatted = formatCNIC(raw);
    set("cnic", formatted);
  };

  // ── onBlur handler ────────────────────────────────────────────────────────
  const handleBlur = (field: string) => {
    setTouched((p) => ({ ...p, [field]: true }));
    if (validators[field]) {
      const msg = validators[field](form[field] ?? "", form);
      setFieldErrors((p) => ({ ...p, [field]: msg }));
    }
  };

  // ── Error display helper ──────────────────────────────────────────────────
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

  // ── Input border color ────────────────────────────────────────────────────
  const inputStyle = (field: string): React.CSSProperties => ({
    borderColor: touched[field] && fieldErrors[field] ? "#ef4444" : undefined,
  });

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // Mark all validatable fields as touched
    const allFields = Object.keys(validators);
    const allTouched = allFields.reduce(
      (acc, k) => ({ ...acc, [k]: true }),
      {} as Record<string, boolean>,
    );
    setTouched(allTouched);

    // Run full validation
    const errs = validateAll(form);
    setFieldErrors(errs);

    const errorCount = Object.values(errs).filter(Boolean).length;
    if (errorCount > 0) {
      setSubmitError(
        `Please fix ${errorCount} error${errorCount > 1 ? "s" : ""} before submitting.`,
      );
      // Scroll to summary
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
      // Step 1: Create User with Rider role
      const username =
        form.fullName.trim().toLowerCase().replace(/\s+/g, "_") +
        "_" +
        Date.now().toString().slice(-4);
      const password =
        "Rider@" + form.phone.trim().replace(/\D/g, "").slice(-4) + "2024!";

      const userRes = await authAPI.register({
        username,
        email: form.email.trim(),
        password,
        firstName: form.fullName.trim().split(" ")[0],
        lastName: form.fullName.trim().split(" ").slice(1).join(" ") || ".",
        phone: form.phone.trim(),
        role: "Rider",
      });

      const userId =
        userRes.data?.data?.user?._id ?? userRes.data?.data?.user?.id;
      if (!userId)
        throw new Error("User creation failed — no userId returned.");

      // Step 2: Create Rider profile
      const vehicle: Record<string, any> = { type: form.vehicleType };
      if (form.vehicleMake.trim()) vehicle.make = form.vehicleMake.trim();
      if (form.vehicleModel.trim()) vehicle.model = form.vehicleModel.trim();
      if (form.vehicleYear) vehicle.year = parseInt(form.vehicleYear);
      if (form.vehicleRegistration.trim())
        vehicle.registrationNumber = form.vehicleRegistration.trim();
      if (form.vehicleColor.trim()) vehicle.color = form.vehicleColor.trim();

      const payload: Record<string, any> = {
        userId,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        vehicle,
        assignedZone: form.assignedZone,
        serviceCities: form.serviceCities
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        paymentMethod: form.paymentMethod,
      };

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

      await ridersAPI.create(payload);
      setSuccess(
        `Rider registered successfully! Login: ${form.email.trim()} | Password: ${password}`,
      );
      setTimeout(() => onNav("all"), 3500);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "";
      const err = e?.response?.data?.error ?? "";
      const status = e?.response?.status;

      // ── Parse server-side errors[] array and show on fields ──────────────
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
        const fieldList = serverErrors
          .map((se) => `${se.field}: ${se.message}`)
          .join(", ");
        setSubmitError(`Please fix the following: ${fieldList}`);
      } else if (
        status === 409 ||
        err.toLowerCase().includes("email") ||
        msg.toLowerCase().includes("email")
      ) {
        setFieldErrors((p) => ({
          ...p,
          email: "This email is already registered. Use a different email.",
        }));
        setTouched((p) => ({ ...p, email: true }));
        setSubmitError(
          "Email is already registered. Please use a different email address.",
        );
      } else if (msg.toLowerCase().includes("username")) {
        setSubmitError("Username conflict — please try again.");
      } else {
        setSubmitError(msg || "Failed to register rider. Please try again.");
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

  // ── Summary error list (visible only after submit attempt) ────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="panel-heading">Add New Rider</div>
      <div className="panel-desc">
        Register a new internal delivery rider. Fill in personal details,
        vehicle information, assigned zone, and payment structure.
      </div>

      {/* ── Summary block (top) ── */}
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
              className="fa-solid fa-bolt"
              style={{ color: "#f59e0b", marginRight: 6 }}
            />
            Rider Registration
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
                Email *
                <span
                  style={{
                    fontSize: 10,
                    color: "#6B7280",
                    marginLeft: 6,
                    fontWeight: 400,
                  }}
                >
                  (must be unique per rider)
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
                min={new Date().toISOString().split("T")[0]}
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
                  // Re-validate accountTitle when accountNumber changes
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
                  <i className="fa-solid fa-check" /> Register Rider
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
            {/* Live error count badge */}
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

export default AddRiderPanel;
