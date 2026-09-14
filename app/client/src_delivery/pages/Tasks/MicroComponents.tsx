// ═══════════════════════════════════════════════════════════
// TASKS — SHARED MICRO COMPONENTS
// ═══════════════════════════════════════════════════════════

import React, { useState } from "react";
import type { TaskPriority } from "./types";
import { badgeClass } from "./helpers";

// ── Badge ────────────────────────────────────────────────────
export const Badge: React.FC<{ label: string }> = ({ label }) => (
  <span className={`badge ${badgeClass(label)}`}>{label}</span>
);

// ── Priority Dot ─────────────────────────────────────────────
export const PriorityDot: React.FC<{ priority: TaskPriority }> = ({
  priority,
}) => {
  const colors: Record<TaskPriority, string> = {
    High: "var(--red)",
    Medium: "var(--yellow)",
    Low: "var(--green)",
  };
  return (
    <div className="priority-dot" style={{ background: colors[priority] }} />
  );
};

// ── Progress Bar ─────────────────────────────────────────────
export const ProgressBar: React.FC<{ pct: number; color: string }> = ({
  pct,
  color,
}) => (
  <div className="prog-bar">
    <div
      className="prog-fill"
      style={{ width: `${pct}%`, background: color }}
    />
  </div>
);

// ── Toggle Switch ────────────────────────────────────────────
export const ToggleSwitch: React.FC<{ defaultChecked?: boolean }> = ({
  defaultChecked = false,
}) => {
  const [on, setOn] = useState(defaultChecked);
  return (
    <label className="toggle-switch">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
      />
      <span className="toggle-track" />
    </label>
  );
};

// ── Empty State ──────────────────────────────────────────────
export const EmptyState: React.FC<{
  icon: string;
  title: string;
  desc?: string;
}> = ({ icon, title, desc }) => (
  <div className="empty-state">
    <i className={`fa-solid ${icon}`} />
    <h4>{title}</h4>
    {desc && <p>{desc}</p>}
  </div>
);

// ── Skeleton rows ────────────────────────────────────────────
export const SkeletonRows: React.FC<{ cols: number; rows?: number }> = ({
  cols,
  rows = 5,
}) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} style={{ opacity: 1 - i * 0.15 }}>
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j}>
            <div
              style={{
                height: 10,
                borderRadius: 3,
                background:
                  "linear-gradient(90deg,var(--divider) 25%,var(--bg) 50%,var(--divider) 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s infinite",
                width: j === 0 ? "55%" : "75%",
              }}
            />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// ── Inner Tabs ───────────────────────────────────────────────
interface InnerTabsProps {
  tabs: { id: string; label: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
}
export const InnerTabs: React.FC<InnerTabsProps> = ({
  tabs,
  active,
  onChange,
}) => (
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

// ── Error Banner ─────────────────────────────────────────────
export const ErrorBanner: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <div className="alert-strip danger" style={{ marginBottom: 14 }}>
    <i className="fa-solid fa-circle-exclamation" />
    <div>{message}</div>
    {onRetry && (
      <button
        className="t-btn danger"
        style={{ marginLeft: "auto" }}
        onClick={onRetry}
      >
        <i className="fa-solid fa-rotate-right" /> Retry
      </button>
    )}
  </div>
);
