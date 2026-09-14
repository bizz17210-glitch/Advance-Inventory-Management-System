// ═══════════════════════════════════════════════════════════
// ThreeDot.tsx — Context-menu dropdown for table rows
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";

export interface ThreeDotItem {
  label: string;
  icon: string;
  danger?: boolean;
  onClick: () => void;
}

interface Props {
  id: string;
  items: ThreeDotItem[];
}

const ThreeDot: React.FC<Props> = ({ id, items }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = document.getElementById(id);
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [id]);

  return (
    <div
      id={id}
      className="three-dot"
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        className="three-dot-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <i className="fa-solid fa-ellipsis" />
      </button>
      {open && (
        <div className="three-dot-menu" style={{ display: "block" }}>
          {items.map((item, idx) =>
            item.label === "---" ? (
              <div key={idx} className="three-dot-menu-divider" />
            ) : (
              <div
                key={item.label}
                className={`three-dot-menu-item ${item.danger ? "danger" : ""}`}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
              >
                <i className={`fa-solid ${item.icon}`} /> {item.label}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default ThreeDot;
