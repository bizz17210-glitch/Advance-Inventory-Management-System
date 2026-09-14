import React from "react";

// ═══════════════════════════════════════════════════════
// COMING SOON BANNER
// Shown on every Audit tab until /api/audit/* endpoints
// (or the relevant backend equivalent) are implemented.
// ═══════════════════════════════════════════════════════
const ComingSoon: React.FC<{ feature: string; note?: string }> = ({
  feature,
  note,
}) => (
  <div className="alert-strip info" style={{ marginBottom: 14 }}>
    <i className="fa-solid fa-hourglass-half" />
    <div>
      <strong>{feature} — Coming Soon.</strong>{" "}
      {note ??
        "This section is not yet connected to a live backend endpoint. The data shown below is sample/placeholder data."}
    </div>
  </div>
);

export default ComingSoon;
