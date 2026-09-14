import React from "react";

interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
  showCloseButton?: boolean;
}

export const Overlay: React.FC<OverlayProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = "420px",
  showCloseButton = true,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="backdrop open" onClick={onClose} />
      <div className="overlay open" style={{ width }}>
        <div className="overlay-header">
          <div className="overlay-title">{title}</div>
          {showCloseButton && (
            <button className="close-btn" onClick={onClose}>
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
        <div className="overlay-body">{children}</div>
      </div>
    </>
  );
};
