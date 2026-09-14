import React from "react";

interface BadgeProps {
  variant?:
    | "green"
    | "red"
    | "yellow"
    | "blue"
    | "gray"
    | "orange"
    | "purple"
    | "teal";
  children: React.ReactNode;
  icon?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "gray",
  children,
  icon,
  className = "",
}) => {
  return (
    <span className={`badge ${variant} ${className}`.trim()}>
      {icon && <i className={icon} />}
      {children}
    </span>
  );
};
