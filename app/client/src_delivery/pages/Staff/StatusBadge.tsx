// ═══════════════════════════════════════════════════════════
// StatusBadge.tsx — Active / Inactive / Suspended badge
// ═══════════════════════════════════════════════════════════

import React from "react";
import { ApiStatus } from "./staff.types";
import { statusBadgeClass, statusDotClass } from "./staffData";

interface Props {
  status: ApiStatus;
}

const StatusBadge: React.FC<Props> = ({ status }) => (
  <span className={`badge ${statusBadgeClass[status]}`}>
    <span className={`online-dot ${statusDotClass[status]}`} />
    {status}
  </span>
);

export default StatusBadge;
