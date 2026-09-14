import React from "react";

interface CardProps {
  title?: string;
  icon?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  icon,
  actions,
  children,
  className = "",
  bodyClassName = "",
  headerClassName = "",
}) => {
  return (
    <div className={`card ${className}`.trim()}>
      {(title || actions) && (
        <div className={`card-header ${headerClassName}`.trim()}>
          {title && (
            <div className="card-title">
              {icon && <i className={icon} />}
              {title}
            </div>
          )}
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className={`card-body ${bodyClassName}`.trim()}>{children}</div>
    </div>
  );
};
