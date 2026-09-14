import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import AppHeader from "./AppHeader";

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={location.pathname}
      />
      <div
        style={{
          marginLeft: "220px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AppHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main style={{ padding: "18px 20px", flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
