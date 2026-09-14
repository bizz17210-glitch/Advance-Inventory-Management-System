import React, { useState, useEffect } from "react";
import { usersAPI } from "../../services/api";

// ═══════════════════════════════════════════════════════════
// MICRO-COMPONENTS
// ═══════════════════════════════════════════════════════════

const ToggleSwitch: React.FC<{
  defaultChecked?: boolean;
  onChange?: (v: boolean) => void;
}> = ({ defaultChecked = false, onChange }) => {
  const [on, setOn] = useState(defaultChecked);
  return (
    <label className="toggle-switch">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => {
          setOn(e.target.checked);
          onChange?.(e.target.checked);
        }}
      />
      <span className="toggle-track" />
    </label>
  );
};

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface PasswordRequirements {
  minLength: number;
  maxLength: number;
  requiresUppercase: boolean;
  requiresLowercase: boolean;
  requiresNumber: boolean;
  requiresSpecialChar: boolean;
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

const AuthPanel: React.FC = () => {
  const [policy, setPolicy] = useState<PasswordRequirements | null>(null);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [policyError, setPolicyError] = useState<string | null>(null);

  // Password-change form state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ── Fetch password policy ────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setPolicyLoading(true);
        const res = await usersAPI.getPasswordPolicy();
        const req = res.data?.data?.requirements as PasswordRequirements;
        if (req) setPolicy(req);
      } catch (err: any) {
        setPolicyError(
          err?.response?.data?.message ?? "Could not load password policy.",
        );
      } finally {
        setPolicyLoading(false);
      }
    })();
  }, []);

  // ── Change password ──────────────────────────────────────
  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      setPwMsg({ type: "error", text: "All password fields are required." });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({
        type: "error",
        text: "New password and confirmation do not match.",
      });
      return;
    }
    try {
      setPwSaving(true);
      setPwMsg(null);
      await usersAPI.updatePassword({
        currentPassword: currentPw,
        newPassword: newPw,
        confirmPassword: confirmPw,
      });
      setPwMsg({ type: "success", text: "Password updated successfully." });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err: any) {
      const errors: { message: string }[] = err?.response?.data?.errors ?? [];
      const msg =
        errors.map((e) => e.message).join(" ") ||
        err?.response?.data?.message ||
        "Password update failed.";
      setPwMsg({ type: "error", text: msg });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <>
      {/* Banner — 2FA & session policy have no backend API yet */}
      <div className="alert-strip info">
        <i className="fa-solid fa-circle-info" />
        2FA, lockout, and session policies are not yet connected to a backend
        endpoint. Only the
        <strong> password policy</strong> and <strong>password change</strong>{" "}
        are live.
      </div>

      <div className="settings-grid">
        {/* ── Two-Factor Authentication (static / UI-only) ── */}
        <div className="settings-section">
          <div className="settings-section-head">
            <i className="fa-solid fa-mobile-screen" /> Two-Factor
            Authentication (2FA)
          </div>
          <div className="settings-section-body">
            <div className="stg-row">
              <div>
                <div className="stg-key">Require 2FA for Administrators</div>
                <div className="stg-desc">
                  Enforce 2FA on all admin-level logins
                </div>
              </div>
              <ToggleSwitch />
            </div>
            <div className="stg-row">
              <div>
                <div className="stg-key">Require 2FA for Managers</div>
                <div className="stg-desc">
                  Ops Manager, Inventory Manager, Accounts
                </div>
              </div>
              <ToggleSwitch />
            </div>
            <div className="stg-row">
              <div>
                <div className="stg-key">Require 2FA for All Staff</div>
                <div className="stg-desc">Applies to all system users</div>
              </div>
              <ToggleSwitch />
            </div>
            <div className="stg-row">
              <div>
                <div className="stg-key">2FA Method</div>
                <div className="stg-desc">Preferred second-factor channel</div>
              </div>
              <select className="stg-select">
                <option>Authenticator App (TOTP)</option>
                <option>SMS OTP</option>
                <option>Email OTP</option>
              </select>
            </div>
            <div className="stg-row">
              <div>
                <div className="stg-key">Remember Device (days)</div>
                <div className="stg-desc">Skip 2FA on trusted devices</div>
              </div>
              <input type="number" defaultValue={30} className="stg-input" />
            </div>
          </div>
        </div>

        {/* ── Password Policy (from API) ────────────────── */}
        <div className="settings-section">
          <div className="settings-section-head">
            <i className="fa-solid fa-key" /> Password Policy
            {policyLoading && (
              <i
                className="fa-solid fa-spinner fa-spin"
                style={{ marginLeft: 6, fontSize: 10 }}
              />
            )}
          </div>
          <div className="settings-section-body">
            {policyError && (
              <div className="alert-strip danger" style={{ marginBottom: 8 }}>
                <i className="fa-solid fa-circle-xmark" /> {policyError}
              </div>
            )}
            <div className="stg-row">
              <div>
                <div className="stg-key">Minimum Password Length</div>
              </div>
              <input
                type="number"
                className="stg-input"
                value={policy?.minLength ?? 8}
                readOnly
              />
            </div>
            <div className="stg-row">
              <div>
                <div className="stg-key">Maximum Password Length</div>
              </div>
              <input
                type="number"
                className="stg-input"
                value={policy?.maxLength ?? 128}
                readOnly
              />
            </div>
            <div className="stg-row">
              <div>
                <div className="stg-key">Require Uppercase Letter</div>
              </div>
              <ToggleSwitch
                defaultChecked={policy?.requiresUppercase ?? true}
              />
            </div>
            <div className="stg-row">
              <div>
                <div className="stg-key">Require Lowercase Letter</div>
              </div>
              <ToggleSwitch
                defaultChecked={policy?.requiresLowercase ?? true}
              />
            </div>
            <div className="stg-row">
              <div>
                <div className="stg-key">Require Number</div>
              </div>
              <ToggleSwitch defaultChecked={policy?.requiresNumber ?? true} />
            </div>
            <div className="stg-row">
              <div>
                <div className="stg-key">Require Special Character</div>
              </div>
              <ToggleSwitch
                defaultChecked={policy?.requiresSpecialChar ?? false}
              />
            </div>
            <div className="stg-row">
              <div>
                <div className="stg-key">Password Expiry (days)</div>
                <div className="stg-desc">
                  Force change after N days (0 = never) — not yet enforced
                </div>
              </div>
              <input
                type="number"
                defaultValue={0}
                className="stg-input"
                placeholder="0 = never"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Change Password (live API) ────────────────────── */}
      <div className="settings-section" style={{ marginBottom: 14 }}>
        <div className="settings-section-head">
          <i className="fa-solid fa-lock" /> Change My Password
        </div>
        <div className="settings-section-body">
          {pwMsg && (
            <div
              className={`alert-strip ${pwMsg.type === "success" ? "success" : "danger"}`}
              style={{ marginBottom: 10 }}
            >
              <i
                className={`fa-solid fa-${pwMsg.type === "success" ? "circle-check" : "circle-xmark"}`}
              />
              {pwMsg.text}
            </div>
          )}
          <div className="stg-row">
            <div>
              <div className="stg-key">Current Password</div>
            </div>
            <input
              type="password"
              className="stg-input"
              style={{ width: 180 }}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Current password"
            />
          </div>
          <div className="stg-row">
            <div>
              <div className="stg-key">New Password</div>
            </div>
            <input
              type="password"
              className="stg-input"
              style={{ width: 180 }}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="New password"
            />
          </div>
          <div className="stg-row">
            <div>
              <div className="stg-key">Confirm New Password</div>
            </div>
            <input
              type="password"
              className="stg-input"
              style={{ width: 180 }}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Confirm password"
            />
          </div>
          <div style={{ marginTop: 10 }}>
            <button
              className="t-btn primary"
              onClick={handleChangePassword}
              disabled={pwSaving}
            >
              {pwSaving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> Saving…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check" /> Update Password
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="settings-grid">
        {/* ── Login Lockout Policy (static) ─────────────── */}
        <div className="settings-section">
          <div className="settings-section-head">
            <i className="fa-solid fa-ban" /> Login Lockout Policy
          </div>
          <div className="settings-section-body">
            <div className="stg-row">
              <div>
                <div className="stg-key">Max Failed Attempts</div>
                <div className="stg-desc">Before temporary lockout</div>
              </div>
              <input type="number" defaultValue={5} className="stg-input" />
            </div>
            <div className="stg-row">
              <div>
                <div className="stg-key">Lockout Duration (minutes)</div>
              </div>
              <input type="number" defaultValue={30} className="stg-input" />
            </div>
            <div className="stg-row">
              <div>
                <div className="stg-key">Alert Admin on Lockout</div>
              </div>
              <ToggleSwitch defaultChecked />
            </div>
            <div className="stg-row">
              <div>
                <div className="stg-key">Auto-block IP After Lockouts</div>
                <div className="stg-desc">
                  Permanently block after 3 lockouts
                </div>
              </div>
              <ToggleSwitch defaultChecked />
            </div>
          </div>
        </div>

        {/* ── Session Policy (static) ────────────────────── */}
        <div className="settings-section">
          <div className="settings-section-head">
            <i className="fa-solid fa-clock" /> Session Policy
          </div>
          <div className="settings-section-body">
            <div className="stg-row">
              <div>
                <div className="stg-key">Session Timeout (minutes)</div>
                <div className="stg-desc">Auto-logout after inactivity</div>
              </div>
              <input type="number" defaultValue={60} className="stg-input" />
            </div>
            <div className="stg-row">
              <div>
                <div className="stg-key">Single Device Login</div>
                <div className="stg-desc">
                  Terminate previous session on new login
                </div>
              </div>
              <ToggleSwitch />
            </div>
            <div className="stg-row">
              <div>
                <div className="stg-key">Alert on New Device Login</div>
                <div className="stg-desc">
                  Notify user when logging in from new device
                </div>
              </div>
              <ToggleSwitch defaultChecked />
            </div>
            <div className="stg-row">
              <div>
                <div className="stg-key">Max Concurrent Sessions Per User</div>
              </div>
              <select className="stg-select">
                <option>1 (Strict)</option>
                <option>2</option>
                <option>3</option>
                <option>Unlimited</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Save 2FA/Session/Lockout — no backend yet */}
      <button className="t-btn primary" disabled>
        <i className="fa-solid fa-check" /> Save Authentication Settings
      </button>
    </>
  );
};

export default AuthPanel;
