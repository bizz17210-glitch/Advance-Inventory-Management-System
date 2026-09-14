import React from "react";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface DangerAction {
  title: string;
  desc: string;
  icon: string;
  label: string;
  word: string;
  critical: boolean;
}

// ═══════════════════════════════════════════════════════════
// STATIC DATA
// ═══════════════════════════════════════════════════════════

export const DANGER_ACTIONS: DangerAction[] = [
  {
    title: "Clear All Order History",
    desc: "Permanently deletes all orders, shipments, and COD records. Products and customers are retained. Cannot be undone.",
    icon: "fa-trash",
    label: "Clear Orders",
    word: "CONFIRM",
    critical: false,
  },
  {
    title: "Reset All Inventory Counts to Zero",
    desc: "Sets all product stock quantities to 0. Use before a full physical recount. Does not delete products.",
    icon: "fa-rotate-left",
    label: "Reset Stock",
    word: "CONFIRM",
    critical: false,
  },
  {
    title: "Delete All Customer Records",
    desc: "Permanently removes all customer profiles and their order history associations. Orders are anonymised.",
    icon: "fa-users-slash",
    label: "Delete Customers",
    word: "CONFIRM",
    critical: false,
  },
  {
    title: "Purge Audit Logs",
    desc: "Permanently deletes all system activity logs. This cannot be reversed and may affect compliance reporting.",
    icon: "fa-file-slash",
    label: "Purge Logs",
    word: "CONFIRM",
    critical: false,
  },
  {
    title: "Factory Reset — Wipe All Data",
    desc: "Completely resets the system to its initial state. ALL data including products, orders, customers, staff, and logs will be permanently deleted.",
    icon: "fa-bomb",
    label: "Factory Reset",
    word: "DELETE EVERYTHING",
    critical: true,
  },
];

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

interface DangerPanelProps {
  onDangerAction: (action: DangerAction) => void;
  completedActions: Set<string>;
}

const DangerPanel: React.FC<DangerPanelProps> = ({
  onDangerAction,
  completedActions,
}) => (
  <>
    {/* Warning Banner */}
    <div className="alert-strip danger">
      <i className="fa-solid fa-skull-crossbones" />
      <strong>Warning:</strong>&nbsp;All actions in this section are
      irreversible. A full backup will be created automatically before any
      destructive action is performed.
    </div>

    {/* Actions Card */}
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <i className="fa-solid fa-triangle-exclamation ic-red" /> Irreversible
          Actions
        </div>
      </div>
      <div className="card-body">
        {DANGER_ACTIONS.map((action) => {
          const done = completedActions.has(action.title);
          return (
            <div
              className={`danger-box ${action.critical ? "critical" : ""}`}
              key={action.title}
            >
              <div>
                <div
                  className="danger-box-title"
                  style={action.critical ? { color: "#991B1B" } : undefined}
                >
                  {action.title}
                </div>
                <div className="danger-box-desc">{action.desc}</div>
              </div>
              <button
                className="t-btn danger"
                style={{
                  flexShrink: 0,
                  ...(action.critical
                    ? { borderColor: "#991B1B", color: "#991B1B" }
                    : {}),
                  ...(done
                    ? { color: "var(--green)", borderColor: "var(--green)" }
                    : {}),
                }}
                onClick={() => !done && onDangerAction(action)}
                disabled={done}
              >
                <i
                  className={`fa-solid ${done ? "fa-circle-check" : action.icon}`}
                />
                {done ? "Done" : action.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  </>
);

export default DangerPanel;
