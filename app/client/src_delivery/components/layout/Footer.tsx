import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-brand-icon">
            <i className="fa-solid fa-chart-network" />
          </div>
          <span className="footer-brand-text">
            Zone<span>In</span>
          </span>
        </div>
        <div className="footer-center">
          © 2026 <span>Zone In</span>. All rights reserved. Built with MERN
          Stack.
        </div>
        <div className="footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/support">Support</Link>
          <Link to="/about">About</Link>
        </div>
      </div>
    </footer>
  );
};
