import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Signup.css";
import signUpImage from "../../assets/images/signUp_Image.png";
import organizationRoleImage from "../../assets/images/organization_role_image.jpg";
import almostThereImage from "../../assets/images/almost_there.jpg";
import { authAPI, tokenHelper } from "../../services/api";
import type { UserRole } from "../../services/types/auth";

// ── Types ──────────────────────────────────────────────────
type StepNumber = 1 | 2 | 3;

interface FormStep1 {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormStep2 {
  organization: string;
  role: string;
  accessCode: string;
}

interface FormStep3 {
  agreeTerms: boolean;
  agreeApproval: boolean;
  agreeNotifications: boolean;
}

interface RoleOption {
  icon: string;
  name: string;
  apiRole: UserRole;
  desc: string;
}

// ── Static Data ────────────────────────────────────────────
const ROLES: RoleOption[] = [
  {
    icon: "fa-user-shield",
    name: "Administrator",
    apiRole: "Administrator",
    desc: "Full system access and user management",
  },
  {
    icon: "fa-chart-bar",
    name: "Operations Manager",
    apiRole: "OperationsManager",
    desc: "Oversee orders, staff and reports",
  },
  {
    icon: "fa-boxes-stacked",
    name: "Inventory Manager",
    apiRole: "InventoryManager",
    desc: "Product and stock control",
  },
  {
    icon: "fa-headset",
    name: "Sales Operator",
    apiRole: "SalesOperator",
    desc: "Order entry and status tracking",
  },
  {
    icon: "fa-calculator",
    name: "Accounts",
    apiRole: "Accounts",
    desc: "COD, expenses and supplier payments",
  },
  {
    icon: "fa-truck",
    name: "Courier Handler",
    apiRole: "CourierHandler",
    desc: "Shipment assignment and tracking",
  },
];

// ── Password Strength ──────────────────────────────────────
function getPasswordStrength(val: string): { score: number; label: string } {
  if (!val) return { score: 0, label: "Enter a password to see strength" };
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const labels = [
    "Too short",
    "Weak – add numbers and symbols",
    "Medium – add special characters",
    "Strong password",
  ];
  return { score, label: labels[score] };
}

function getSegClass(segIdx: number, score: number): string {
  if (score === 0 || segIdx >= score) return "signup-strength-seg";
  if (score === 1) return "signup-strength-seg weak";
  if (score === 2) return "signup-strength-seg medium";
  return "signup-strength-seg strong";
}

// ── Error Banner ───────────────────────────────────────────
const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div
    style={{
      background: "#fef2f2",
      border: "1px solid #fecaca",
      borderRadius: "8px",
      padding: "10px 14px",
      marginBottom: "16px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "13px",
      color: "#dc2626",
    }}
  >
    <i className="fa-solid fa-circle-exclamation" />
    {message}
  </div>
);

// ── Component ──────────────────────────────────────────────
const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 state
  const [step1, setStep1] = useState<FormStep1>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 2 state
  const [step2, setStep2] = useState<FormStep2>({
    organization: "",
    role: "",
    accessCode: "",
  });

  // Step 3 state
  const [step3, setStep3] = useState<FormStep3>({
    agreeTerms: false,
    agreeApproval: false,
    agreeNotifications: false,
  });

  const pwdStrength = getPasswordStrength(step1.password);

  // ── Step 1 Validation ─────────────────────────────────────
  const handleStep1Continue = () => {
    setError("");
    if (!step1.firstName || !step1.lastName)
      return setError("Please enter your first and last name.");
    if (!step1.email) return setError("Please enter your email address.");
    if (!step1.phone) return setError("Please enter your phone number.");
    if (pwdStrength.score < 2)
      return setError(
        "Password is too weak. Add uppercase, numbers and symbols.",
      );
    if (step1.password !== step1.confirmPassword)
      return setError("Passwords do not match.");
    goToStep(2);
  };

  // ── Step 2 Validation ─────────────────────────────────────
  const handleStep2Continue = () => {
    setError("");
    if (!step2.role) return setError("Please select your role.");
    goToStep(3);
  };

  // ── Final Submit ──────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");
    if (!step3.agreeTerms)
      return setError("Please agree to the Terms of Service.");
    if (!step3.agreeApproval)
      return setError(
        "Please acknowledge the administrator approval requirement.",
      );

    // Map display name → API role
    const selectedRole = ROLES.find((r) => r.name === step2.role);
    if (!selectedRole)
      return setError(
        "Invalid role selected. Please go back and select a role.",
      );

    // Build username from email (before @)
    const username = step1.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");

    setIsLoading(true);
    try {
      const res = await authAPI.register({
        username,
        email: step1.email,
        password: step1.password,
        firstName: step1.firstName,
        lastName: step1.lastName,
        phone: step1.phone,
        role: selectedRole.apiRole,
      });

      tokenHelper.save(
        res.data.data.tokens.accessToken,
        res.data.data.tokens.refreshToken,
      );
      navigate("/dashboard");
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors && apiErrors.length > 0) {
        setError(apiErrors.map((e: any) => e.message).join(", "));
      } else {
        setError(
          err?.response?.data?.message ||
            "Registration failed. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goToStep = (n: StepNumber) => {
    setError("");
    setCurrentStep(n);
  };

  const handleStep1Change = (e: React.ChangeEvent<HTMLInputElement>) =>
    setStep1((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleStep2Change = (e: React.ChangeEvent<HTMLInputElement>) =>
    setStep2((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleStep3Change = (e: React.ChangeEvent<HTMLInputElement>) =>
    setStep3((prev) => ({ ...prev, [e.target.name]: e.target.checked }));

  const selectRole = (roleName: string) =>
    setStep2((prev) => ({ ...prev, role: roleName }));

  // ── Step indicator helpers ────────────────────────────────
  const stepCircleClass = (n: number) => {
    if (n < currentStep) return "signup-step-circle done";
    if (n === currentStep) return "signup-step-circle active";
    return "signup-step-circle";
  };
  const stepLabelClass = (n: number) =>
    n === currentStep ? "signup-step-label active" : "signup-step-label";
  const stepLineClass = (n: number) =>
    n < currentStep ? "signup-step-line done" : "signup-step-line";
  const stepCircleContent = (n: number) =>
    n < currentStep ? (
      <i className="fa-solid fa-check" style={{ fontSize: "10px" }} />
    ) : (
      n
    );

  return (
    <div className="signup-page">
      {/* ── HEADER ── */}
      <header className="signup-header">
        <Link to="/" className="signup-logo">
          <div className="signup-logo-icon">
            <i className="fa-solid fa-chart-network" />
          </div>
          <span className="signup-logo-text">
            Inventory<span>OS</span>
          </span>
        </Link>
        <nav className="signup-header-nav">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/login" className="signup-btn-outline">
            Sign In
          </Link>
        </nav>
      </header>

      {/* ── MAIN ── */}
      <main className="signup-main">
        <div className="signup-wrapper">
          {/* Step Indicator */}
          <div className="signup-steps">
            <div className="signup-step-item">
              <div className={stepCircleClass(1)}>{stepCircleContent(1)}</div>
              <span className={stepLabelClass(1)}>Account Info</span>
            </div>
            <div className={stepLineClass(1)} />
            <div className="signup-step-item">
              <div className={stepCircleClass(2)}>{stepCircleContent(2)}</div>
              <span className={stepLabelClass(2)}>Role &amp; Access</span>
            </div>
            <div className={stepLineClass(2)} />
            <div className="signup-step-item">
              <div className={stepCircleClass(3)}>{stepCircleContent(3)}</div>
              <span className={stepLabelClass(3)}>Confirmation</span>
            </div>
          </div>

          <div className="signup-card">
            {/* ── STEP 1 ── */}
            {currentStep === 1 && (
              <div>
                <div className="signup-auth-header">
                  <div className="signup-auth-icon">
                    <img
                      src={signUpImage}
                      alt="Sign Up"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                  <h1>Create your account</h1>
                  <p>
                    Set up your Zone In account to start managing inventory and
                    operations efficiently.
                  </p>
                </div>

                {error && <ErrorBanner message={error} />}

                <div className="signup-section-label">Personal Information</div>

                <div className="signup-form-row-2">
                  <div className="signup-form-group">
                    <label>First Name</label>
                    <div className="signup-input-wrap">
                      <i className="fa-regular fa-user signup-input-icon" />
                      <input
                        type="text"
                        name="firstName"
                        className="signup-input"
                        placeholder="John"
                        value={step1.firstName}
                        onChange={handleStep1Change}
                      />
                    </div>
                  </div>
                  <div className="signup-form-group">
                    <label>Last Name</label>
                    <div className="signup-input-wrap">
                      <i className="fa-regular fa-user signup-input-icon" />
                      <input
                        type="text"
                        name="lastName"
                        className="signup-input"
                        placeholder="Doe"
                        value={step1.lastName}
                        onChange={handleStep1Change}
                      />
                    </div>
                  </div>
                </div>

                <div className="signup-form-group">
                  <label>Email Address</label>
                  <div className="signup-input-wrap">
                    <i className="fa-regular fa-envelope signup-input-icon" />
                    <input
                      type="email"
                      name="email"
                      className="signup-input"
                      placeholder="you@company.com"
                      value={step1.email}
                      onChange={handleStep1Change}
                    />
                  </div>
                </div>

                <div className="signup-form-group">
                  <label>Phone Number</label>
                  <div className="signup-input-wrap">
                    <i className="fa-solid fa-phone signup-input-icon" />
                    <input
                      type="tel"
                      name="phone"
                      className="signup-input"
                      placeholder="+92 300 0000000"
                      value={step1.phone}
                      onChange={handleStep1Change}
                    />
                  </div>
                </div>

                <div className="signup-section-label">Security</div>

                <div className="signup-form-group">
                  <label>Password</label>
                  <div className="signup-input-wrap">
                    <i className="fa-solid fa-lock signup-input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="signup-input with-eye"
                      placeholder="Create a strong password"
                      value={step1.password}
                      onChange={handleStep1Change}
                    />
                    <button
                      type="button"
                      className="signup-eye-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      <i
                        className={
                          showPassword
                            ? "fa-regular fa-eye-slash"
                            : "fa-regular fa-eye"
                        }
                      />
                    </button>
                  </div>
                  <div className="signup-strength-bar">
                    <div className={getSegClass(0, pwdStrength.score)} />
                    <div className={getSegClass(1, pwdStrength.score)} />
                    <div className={getSegClass(2, pwdStrength.score)} />
                  </div>
                  <div className="signup-strength-label">
                    {pwdStrength.label}
                  </div>
                </div>

                <div className="signup-form-group">
                  <label>Confirm Password</label>
                  <div className="signup-input-wrap">
                    <i className="fa-solid fa-lock signup-input-icon" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      name="confirmPassword"
                      className="signup-input with-eye"
                      placeholder="Repeat your password"
                      value={step1.confirmPassword}
                      onChange={handleStep1Change}
                    />
                    <button
                      type="button"
                      className="signup-eye-toggle"
                      onClick={() => setShowConfirm((v) => !v)}
                    >
                      <i
                        className={
                          showConfirm
                            ? "fa-regular fa-eye-slash"
                            : "fa-regular fa-eye"
                        }
                      />
                    </button>
                  </div>
                </div>

                <button
                  className="signup-btn-primary"
                  onClick={handleStep1Continue}
                >
                  Continue <i className="fa-solid fa-arrow-right" />
                </button>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {currentStep === 2 && (
              <div>
                <div className="signup-auth-header">
                  <div className="signup-auth-icon-wrap">
                    <img
                      src={organizationRoleImage}
                      alt="Role & Organization"
                      className="signup-auth-icon-img"
                    />
                  </div>
                  <h1>Role &amp; Organization</h1>
                  <p>
                    Select your role in the system. Your access permissions will
                    be configured accordingly by the administrator.
                  </p>
                </div>

                {error && <ErrorBanner message={error} />}

                <div className="signup-form-group">
                  <label>Organization / Business Name</label>
                  <div className="signup-input-wrap">
                    <i className="fa-solid fa-building signup-input-icon" />
                    <input
                      type="text"
                      name="organization"
                      className="signup-input"
                      placeholder="Your company name"
                      value={step2.organization}
                      onChange={handleStep2Change}
                    />
                  </div>
                </div>

                <div className="signup-section-label">Select Your Role</div>

                <div className="signup-role-grid">
                  {ROLES.map((role) => (
                    <div
                      key={role.name}
                      className={`signup-role-card ${step2.role === role.name ? "selected" : ""}`}
                      onClick={() => selectRole(role.name)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === "Enter" && selectRole(role.name)
                      }
                    >
                      <div className="signup-role-icon">
                        <i className={`fa-solid ${role.icon}`} />
                      </div>
                      <div className="signup-role-name">{role.name}</div>
                      <div className="signup-role-desc">{role.desc}</div>
                    </div>
                  ))}
                </div>

                <div
                  className="signup-form-group"
                  style={{ marginTop: "16px" }}
                >
                  <label>
                    Access Code{" "}
                    <span className="muted">(provided by admin)</span>
                  </label>
                  <div className="signup-input-wrap">
                    <i className="fa-solid fa-key signup-input-icon" />
                    <input
                      type="text"
                      name="accessCode"
                      className="signup-input"
                      placeholder="e.g. Inventory-XXXX"
                      value={step2.accessCode}
                      onChange={handleStep2Change}
                    />
                  </div>
                </div>

                <button
                  className="signup-btn-primary"
                  onClick={handleStep2Continue}
                >
                  Continue <i className="fa-solid fa-arrow-right" />
                </button>
                <button className="signup-btn-back" onClick={() => goToStep(1)}>
                  <i className="fa-solid fa-arrow-left" /> Back
                </button>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {currentStep === 3 && (
              <div>
                <div className="signup-auth-header">
                  <div className="signup-almost-there-wrap">
                    <img
                      src={almostThereImage}
                      alt="Almost There"
                      className="signup-almost-there-img"
                    />
                  </div>
                  <h1>Almost there!</h1>
                  <p>
                    Review your details and agree to the terms to complete your
                    registration.
                  </p>
                </div>

                {error && <ErrorBanner message={error} />}

                <div className="signup-summary-box">
                  <div className="signup-summary-header">
                    <span>Account Summary</span>
                    <button
                      className="signup-summary-edit-btn"
                      onClick={() => goToStep(1)}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="signup-summary-row">
                    <span className="label">Name</span>
                    <span className="value">
                      {`${step1.firstName} ${step1.lastName}`.trim() || "—"}
                    </span>
                  </div>
                  <div className="signup-summary-row">
                    <span className="label">Email</span>
                    <span className="value">{step1.email || "—"}</span>
                  </div>
                  <div className="signup-summary-row">
                    <span className="label">Organization</span>
                    <span className="value">{step2.organization || "—"}</span>
                  </div>
                  <div className="signup-summary-row">
                    <span className="label">Role</span>
                    <span className="value accent">{step2.role || "—"}</span>
                  </div>
                </div>

                <div className="signup-checkbox-group">
                  <label className="signup-checkbox-label">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={step3.agreeTerms}
                      onChange={handleStep3Change}
                    />
                    I agree to the <a href="#">Terms of Service</a> and{" "}
                    <a href="#">Privacy Policy</a>
                  </label>
                  <label className="signup-checkbox-label">
                    <input
                      type="checkbox"
                      name="agreeApproval"
                      checked={step3.agreeApproval}
                      onChange={handleStep3Change}
                    />
                    I understand that my account requires administrator approval
                    before access is granted
                  </label>
                  <label className="signup-checkbox-label">
                    <input
                      type="checkbox"
                      name="agreeNotifications"
                      checked={step3.agreeNotifications}
                      onChange={handleStep3Change}
                    />
                    I consent to receive important system notifications via
                    email
                  </label>
                </div>

                {/* <button className="signup-btn-primary" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <><i className="fa-solid fa-spinner fa-spin" /> Creating account...</>
                  ) : (
                    <><i className="fa-solid fa-user-check" /> Create Account</>
                  )}
                </button> */}
                <button
                  className="signup-btn-back"
                  onClick={() => goToStep(2)}
                  disabled={isLoading}
                >
                  <i className="fa-solid fa-arrow-left" /> Back
                </button>
              </div>
            )}

            <p className="signup-auth-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="signup-footer">
        <div className="signup-footer-left">
          © 2026 <span>Zone In</span>. All rights reserved.
        </div>
        <div className="signup-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Support</a>
        </div>
      </footer>
    </div>
  );
};

export default Signup;
