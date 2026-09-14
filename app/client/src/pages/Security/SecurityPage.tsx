import React, { useState, useCallback } from "react";
import "./SecurityPage.css";
import TopLoadingBar from "../../components/ui/TopLoadingBar";
import { useTabLoading } from "../../hooks/useTabLoading";

// ── Panel imports ────────────────────────────────────────────
import OverviewPanel from "./OverviewPanel";
import AuthPanel from "./AuthPanel";
import SessionsPanel from "./SessionsPanel";
import IPWhitelistPanel from "./IPWhitelistPanel";
import BackupPanel from "./BackupPanel";
import ExportPanel from "./ExportPanel";
import DangerPanel, { DANGER_ACTIONS, DangerAction } from "./DangerPanel";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type SecTab =
  | "overview"
  | "auth"
  | "sessions"
  | "ip"
  | "backup"
  | "export"
  | "danger";

interface ModalState {
  open: boolean;
  title: string;
  body: string;
  confirmWord: string;
  onConfirm: () => void;
}

// ═══════════════════════════════════════════════════════════
// CONFIRM MODAL
// ═══════════════════════════════════════════════════════════

const ConfirmModal: React.FC<{ modal: ModalState; onClose: () => void }> = ({
  modal,
  onClose,
}) => {
  const [inputVal, setInputVal] = useState("");
  const [inputError, setInputError] = useState(false);

  const handleConfirm = () => {
    if (inputVal === modal.confirmWord) {
      modal.onConfirm();
      onClose();
      setInputVal("");
      setInputError(false);
    } else {
      setInputError(true);
    }
  };

  if (!modal.open) return null;

  return (
    <div className="sec-modal-backdrop open">
      <div className="sec-modal">
        <div className="sec-modal-title">⚠ Confirm: {modal.title}</div>
        <div className="sec-modal-body">{modal.body}</div>
        <div className="sec-modal-hint">
          Type <strong>{modal.confirmWord}</strong> to proceed:
        </div>
        <input
          className={`form-input sec-modal-input ${inputError ? "error" : ""}`}
          placeholder="Type confirmation word..."
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            setInputError(false);
          }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="t-btn danger"
            style={{ flex: 1, justifyContent: "center" }}
            onClick={handleConfirm}
          >
            Proceed
          </button>
          <button
            className="t-btn"
            style={{ flex: 1, justifyContent: "center" }}
            onClick={() => {
              onClose();
              setInputVal("");
              setInputError(false);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// INNER TABS
// ═══════════════════════════════════════════════════════════

const InnerTabs: React.FC<{
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}> = ({ tabs, active, onChange }) => (
  <div className="inner-tabs">
    {tabs.map((t) => (
      <div
        key={t.id}
        className={`itab ${active === t.id ? "active" : ""}`}
        onClick={() => onChange(t.id)}
      >
        {t.label}
      </div>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

const SecurityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SecTab>("overview");
  const { isLoading, loadingProgress, switchTab } = useTabLoading(
    setActiveTab,
    activeTab,
  );

  const [modal, setModal] = useState<ModalState>({
    open: false,
    title: "",
    body: "",
    confirmWord: "",
    onConfirm: () => {},
  });
  const [completedActions, setCompletedActions] = useState<Set<string>>(
    new Set(),
  );

  const openDangerModal = useCallback((action: DangerAction) => {
    setModal({
      open: true,
      title: action.title,
      body: `This action is irreversible. A backup will be created automatically before proceeding. Are you absolutely sure you want to ${action.title.toLowerCase()}?`,
      confirmWord: action.word,
      onConfirm: () => {
        setCompletedActions(
          (prev) => new Set(Array.from(prev).concat(action.title)),
        );
      },
    });
  }, []);

  const TABS: { id: SecTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "auth", label: "Authentication" },
    { id: "sessions", label: "Active Sessions" },
    { id: "ip", label: "IP Whitelist" },
    { id: "backup", label: "Backup" },
    { id: "export", label: "Data Export" },
    { id: "danger", label: "Danger Zone" },
  ];

  const renderPanel = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewPanel onNav={setActiveTab} />;
      case "auth":
        return <AuthPanel />;
      case "sessions":
        return <SessionsPanel />;
      case "ip":
        return <IPWhitelistPanel />;
      case "backup":
        return <BackupPanel />;
      case "export":
        return <ExportPanel />;
      case "danger":
        return (
          <DangerPanel
            onDangerAction={openDangerModal}
            completedActions={completedActions}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div id="page-security">
      <TopLoadingBar progress={loadingProgress} isLoading={isLoading} />

      {/* Page Hero */}
      <div className="page-hero">
        <div className="page-hero-title">Security &amp; Backup</div>
        <div className="page-hero-sub">
          Manage system security policies, active sessions, IP whitelisting,
          backup configuration, and data export controls.
        </div>
      </div>

      {/* Security Health Strip */}
      <div className="alert-strip warn">
        <i className="fa-solid fa-triangle-exclamation" />
        <div>
          <strong>2FA is not enabled</strong> for any accounts. Enable
          two-factor authentication to improve security posture.
        </div>
        <button
          className="t-btn primary"
          style={{ marginLeft: "auto" }}
          onClick={() => setActiveTab("auth")}
        >
          <i className="fa-solid fa-shield-halved" /> Enable 2FA
        </button>
      </div>

      {/* Mini Stats */}
      <div className="mini-stats">
        <div className="mini-stat">
          <div className="ms-label">Security Score</div>
          <div className="ms-value" style={{ color: "var(--yellow)" }}>
            75%
          </div>
          <div className="ms-trend down">
            <i className="fa-solid fa-triangle-exclamation" /> 2FA not enabled
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Active Sessions</div>
          <div className="ms-value">—</div>
          <div className="ms-trend">
            <i className="fa-solid fa-desktop" /> See Sessions tab
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Failed Logins (24h)</div>
          <div className="ms-value" style={{ color: "var(--text-muted)" }}>
            —
          </div>
          <div className="ms-trend">
            <i className="fa-solid fa-circle-info" /> No audit API yet
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Last Backup</div>
          <div className="ms-value" style={{ fontSize: 14 }}>
            11 May
          </div>
          <div className="ms-trend up">
            <i
              className="fa-solid fa-circle-check"
              style={{ color: "var(--green)" }}
            />{" "}
            08:00 AM · Success
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <InnerTabs
        tabs={TABS}
        active={activeTab}
        onChange={(id) => switchTab(id as SecTab)}
      />

      {/* Active Panel */}
      {renderPanel()}

      {/* Confirm Modal */}
      <ConfirmModal
        modal={modal}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
      />
    </div>
  );
};

export default SecurityPage;
