// ═══════════════════════════════════════════════════════════
// ProgBar.tsx — Reusable progress bar
// ═══════════════════════════════════════════════════════════

import React from "react";

interface Props {
  pct: number;
  fill: string; // 'green' | 'yellow' | 'red'
  width?: number;
}

const ProgBar: React.FC<Props> = ({ pct, fill, width = 64 }) => (
  <div className="prog-bar" style={{ width }}>
    <div className={`prog-fill ${fill}`} style={{ width: `${pct}%` }} />
  </div>
);

export default ProgBar;
