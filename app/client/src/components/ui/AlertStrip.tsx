import React from "react";

interface AlertStripProps {
  variant?: "info" | "warn" | "danger" | "success";
  icon?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const AlertStrip: React.FC<AlertStripProps> = ({
  variant = "info",
  icon,
  children,
  action,
  className = "",
}) => {
  const variantClasses = {
    info: "alert-strip info",
    warn: "alert-strip warn",
    danger: "alert-strip danger",
    success: "alert-strip success",
  };

  const defaultIcons = {
    info: "fa-solid fa-circle-info",
    warn: "fa-solid fa-triangle-exclamation",
    danger: "fa-solid fa-shield-exclamation",
    success: "fa-solid fa-circle-check",
  };

  return (
    <div className={`${variantClasses[variant]} ${className}`.trim()}>
      <i className={icon || defaultIcons[variant]} />
      <div className="alert-strip-content">{children}</div>
      {action && <div className="alert-strip-action">{action}</div>}
    </div>
  );
};
