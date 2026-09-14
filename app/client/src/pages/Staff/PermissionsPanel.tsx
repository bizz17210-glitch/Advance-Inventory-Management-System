// ═══════════════════════════════════════════════════════════
// PermissionsPanel.tsx — Per-role module permission toggles
// ═══════════════════════════════════════════════════════════

import React from "react";
import Toggle from "./Toggle";
import { MODULE_PERMS } from "./staffData";

interface Props {
  role: string;
}

const PermissionsPanel: React.FC<Props> = ({ role }) => {
  const perms = MODULE_PERMS[role] ?? MODULE_PERMS["Rider"];

  return (
    <>
      {Object.entries(perms).map(([mod, has]) => (
        <div className="perm-row" key={mod}>
          <div className="perm-label">
            {mod}
            <small>{has ? "Full access" : "No access"}</small>
          </div>
          <Toggle checked={has} />
        </div>
      ))}
    </>
  );
};

export default PermissionsPanel;
