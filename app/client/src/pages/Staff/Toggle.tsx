// ═══════════════════════════════════════════════════════════
// Toggle.tsx — Checkbox toggle switch
// ═══════════════════════════════════════════════════════════

import React, { useState } from "react";

interface Props {
  checked: boolean;
  onChange?: (v: boolean) => void;
}

const Toggle: React.FC<Props> = ({ checked, onChange }) => {
  const [val, setVal] = useState(checked);

  return (
    <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        checked={val}
        onChange={(e) => {
          setVal(e.target.checked);
          onChange?.(e.target.checked);
        }}
      />
      <span className="toggle-slider" />
    </label>
  );
};

export default Toggle;
