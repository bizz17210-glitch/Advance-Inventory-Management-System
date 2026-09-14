import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { authAPI, tokenHelper } from "../../services/api";

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await authAPI.login({ identifier: email, password });
      tokenHelper.save(
        res.data.data.tokens.accessToken,
        res.data.data.tokens.refreshToken,
      );
      navigate("/dashboard");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Invalid email or password. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ── HEADER ── */}
      <header className="login-header">
        <Link to="/" className="login-logo">
          <div className="login-logo-icon">
            <i className="fa-solid fa-chart-network" />
          </div>
          <span className="login-logo-text">
            Inventory<span>OS</span>
          </span>
        </Link>
        <nav className="login-header-nav">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          {/* <Link to="/signup" className="login-btn-outline">Create Account</Link> */}
        </nav>
      </header>

      {/* ── MAIN ── */}
      <main className="login-main">
        <div className="login-wrapper">
          <div className="login-card">
            {/* Auth Header */}
            <div className="login-auth-header">
              <div className="login-auth-icon">
                <i className="fa-solid fa-lock-open" />
              </div>
              <h1>Welcome back</h1>
              <p>
                Sign in to your Zone In account to manage your inventory and
                operations.
              </p>
            </div>

            {/* Info Banner */}
            <div className="login-info-banner">
              <i className="fa-solid fa-circle-info" />
              <p>
                This platform is restricted to authorized personnel. Contact
                your administrator if you need access.
              </p>
            </div>

            {/* ── Error Banner ── */}
            {error && (
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
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="login-form-group">
                <label htmlFor="login-email">Email Address</label>
                <div className="login-input-wrap">
                  <i className="fa-regular fa-envelope login-input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    className="login-input"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="login-form-group">
                <label htmlFor="login-password">Password</label>
                <div className="login-input-wrap">
                  <i className="fa-solid fa-key login-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    className="login-input with-eye"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="login-eye-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label="Toggle password visibility"
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
              </div>

              <div className="login-form-row">
                <label className="login-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <button type="button" className="login-link">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="login-btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" /> Signing in...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-arrow-right-to-bracket" /> Sign In
                  </>
                )}
              </button>
            </form>

            <div className="login-divider">
              <span>or continue with</span>
            </div>

            <div className="login-social-btns">
              <button type="button" className="login-social-btn">
                <i className="fa-brands fa-google" /> Google
              </button>
              <button type="button" className="login-social-btn">
                <i className="fa-brands fa-microsoft" /> Microsoft
              </button>
            </div>

            {/* <p className="login-auth-footer">
              Don't have an account? <Link to="/signup">Create one</Link>
            </p> */}
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="login-footer">
        <div className="login-footer-left">
          © 2026 <span>Zone In</span>. All rights reserved.
        </div>
        <div className="login-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Support</a>
        </div>
      </footer>
    </div>
  );
};

export default Login;
