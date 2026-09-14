import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import About from "./pages/About";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import OrdersPage from "./pages/Orders/OrdersPage";
import ProductPage from "./pages/Products/ProductPage";
import InventoryPage from "./pages/Inventory/InventoryPage";
import CustomersPage from "./pages/Customers/CustomersPage";
import CouriersPage from "./pages/Couriers/CouriersPage";
import RidersPage from "./pages/Riders/RidersPage";
import FinancePage from "./pages/Finance/FinancePage";
import TasksPage from "./pages/Tasks/TasksPage";
import StaffPage from "./pages/Staff/StaffPage";
import ReportsPage from "./pages/Reports/ReportsPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import SecurityPage from "./pages/Security/SecurityPage";
import AuditPage from "./pages/Audit/AuditPage";
import { tokenHelper } from "./services/api";

// ── Protected Route ────────────────────────────────────────
// If no token in localStorage → redirect to /login
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const token = tokenHelper.getAccess();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ── Public Route ───────────────────────────────────────────
// If already logged in → redirect away from login/signup to /dashboard
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = tokenHelper.getAccess();
  if (token) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// ── App ────────────────────────────────────────────────────
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — no sidebar */}
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />

        {/* Auth routes — redirect to dashboard if already logged in */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        {/* Protected routes — redirect to login if not logged in */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/couriers" element={<CouriersPage />} />
          <Route path="/riders" element={<RidersPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
