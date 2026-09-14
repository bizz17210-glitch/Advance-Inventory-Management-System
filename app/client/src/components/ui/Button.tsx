import React from "react";
import { Link } from "react-router-dom";

interface ButtonProps {
  variant?: "primary" | "outline" | "lg-primary" | "lg-outline";
  href?: string;
  to?: string;
  onClick?: () => void;
  children: React.ReactNode;
  icon?: string;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  href,
  to,
  onClick,
  children,
  icon,
  className = "",
}) => {
  const baseClasses = "btn";
  const variantClasses = {
    primary: "btn-accent",
    outline: "btn-outline",
    "lg-primary": "btn-lg btn-lg-accent",
    "lg-outline": "btn-lg btn-lg-outline",
  };

  const classes =
    `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

  const content = (
    <>
      {icon && <i className={icon} />}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button className={classes} onClick={onClick} type="button">
      {content}
    </button>
  );
};
