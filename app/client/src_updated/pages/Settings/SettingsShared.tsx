import React, { useState } from "react";

// ── ToggleSwitch ───────────────────────────────────────────

interface ToggleSwitchProps {
  checked?: boolean;
  onChange?: (v: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked = false,
  onChange,
}) => {
  const [on, setOn] = useState(checked);
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

// ── SectionDivider ─────────────────────────────────────────

export const SectionDivider: React.FC<{ label: string }> = ({ label }) => (
  <div className="section-divider">
    <span>{label}</span>
  </div>
);

// ── StgToggleRow ───────────────────────────────────────────

interface StgToggleRowProps {
  label: string;
  desc?: string;
  defaultChecked?: boolean;
}

export const StgToggleRow: React.FC<StgToggleRowProps> = ({
  label,
  desc,
  defaultChecked = false,
}) => (
  <div className="stg-row">
    <div>
      <div className="stg-key">{label}</div>
      {desc && <div className="stg-desc">{desc}</div>}
    </div>
    <ToggleSwitch checked={defaultChecked} />
  </div>
);

// ── StgRow ─────────────────────────────────────────────────

interface StgRowProps {
  label: string;
  children: React.ReactNode;
}

export const StgRow: React.FC<StgRowProps> = ({ label, children }) => (
  <div className="stg-row">
    <div>
      <div className="stg-key">{label}</div>
    </div>
    {children}
  </div>
);
