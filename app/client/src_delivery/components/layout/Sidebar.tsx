import React from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, tokenHelper } from "../../services/api";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentPath }) => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [userName, setUserName] = React.useState<string>("");
  const [userRole, setUserRole] = React.useState<string>("");
  const [initials, setInitials] = React.useState<string>("");

  const navItems = [
    { path: "/dashboard", icon: "fa-gauge-high", label: "Dashboard" },
    { path: "/orders", icon: "fa-bag-shopping", label: "Orders" },
    { path: "/products", icon: "fa-box-open", label: "Products" },
    { path: "/inventory", icon: "fa-warehouse", label: "Inventory" },
    { path: "/customers", icon: "fa-users", label: "Customers" },
    { path: "/couriers", icon: "fa-truck", label: "Couriers" },
    { path: "/riders", icon: "fa-person-biking", label: "Riders" },
    { path: "/finance", icon: "fa-sack-dollar", label: "Financials" },
    { path: "/tasks", icon: "fa-calendar-check", label: "Tasks" },
    { path: "/staff", icon: "fa-id-badge", label: "Staff & Roles" },
    { path: "/reports", icon: "fa-chart-pie", label: "Reports" },
    { path: "/settings", icon: "fa-gear", label: "Settings" },
    { path: "/security", icon: "fa-shield-halved", label: "Security" },
    // { path: '/audit',     icon: 'fa-file-alt',       label: 'Audit Logs' },
  ];

  React.useEffect(() => {
    authAPI
      .me()
      .then((res) => {
        const user = res.data?.data;
        if (user) {
          const full = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
          setUserName(full || user.username || "User");
          setUserRole(user.role ?? "");
          const parts = (full || user.username || "U").split(" ");
          setInitials(
            parts
              .map((w: string) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const refreshToken = tokenHelper.getRefresh();
      if (refreshToken) {
        await authAPI.logout({ refreshToken });
      }
    } catch {
      // Even if API call fails, clear tokens and redirect
    } finally {
      tokenHelper.clear();
      navigate("/login");
    }
  };

  return (
    <aside
      style={{
        width: "220px",
        minWidth: "220px",
        background: "#111827",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: isOpen ? 0 : 0,
        bottom: 0,
        zIndex: 100,
        overflowY: "auto",
      }}
    >
      {/* ── LOGO ── */}
      <div
        style={{
          padding: "16px 14px 12px",
          borderBottom: "1px solid #1F2937",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            background: "#FF6A00",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          ZI
        </div>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>
            Zone<span style={{ color: "#FF6A00" }}>In</span>
          </div>
          <div style={{ fontSize: "9px", color: "#6B7280" }}>
            Operations Management
          </div>
        </div>
      </div>

      {/* ── NAV ── */}
      <nav style={{ padding: "10px", flex: 1 }}>
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 10px",
                borderRadius: "6px",
                marginBottom: "1px",
                cursor: "pointer",
                fontSize: "11.5px",
                color: isActive ? "#fff" : "#9CA3AF",
                background: isActive ? "#1F2937" : "transparent",
                fontWeight: isActive ? 500 : 400,
                position: "relative",
              }}
            >
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "6px",
                    bottom: "6px",
                    width: "3px",
                    background: "#FF6A00",
                    borderRadius: "0 3px 3px 0",
                  }}
                />
              )}
              <i
                className={`fa-solid ${item.icon}`}
                style={{ fontSize: "13px", width: "16px", textAlign: "center" }}
              />
              {item.label}
            </div>
          );
        })}
      </nav>

      {/* ── USER + LOGOUT ── */}
      <div style={{ padding: "10px", borderTop: "1px solid #1F2937" }}>
        {/* User info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              background: "#FF6A00",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            {initials || "—"}
          </div>
          <div>
            <div
              style={{ fontSize: "11px", fontWeight: 500, color: "#E5E7EB" }}
            >
              {userName || "—"}
            </div>
            <div style={{ fontSize: "9.5px", color: "#6B7280" }}>
              {userRole || "—"}
            </div>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "7px 10px",
            borderRadius: "6px",
            marginTop: "4px",
            cursor: isLoggingOut ? "not-allowed" : "pointer",
            fontSize: "11.5px",
            color: isLoggingOut ? "#6B7280" : "#F87171",
            background: "transparent",
            border: "none",
            fontFamily: "inherit",
            fontWeight: 400,
            transition: "background 0.15s, color 0.15s",
            opacity: isLoggingOut ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLoggingOut) {
              (e.currentTarget as HTMLButtonElement).style.background =
                "#1F2937";
              (e.currentTarget as HTMLButtonElement).style.color = "#FCA5A5";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = isLoggingOut
              ? "#6B7280"
              : "#F87171";
          }}
        >
          <i
            className={
              isLoggingOut
                ? "fa-solid fa-spinner fa-spin"
                : "fa-solid fa-arrow-right-from-bracket"
            }
            style={{ fontSize: "13px", width: "16px", textAlign: "center" }}
          />
          {isLoggingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
