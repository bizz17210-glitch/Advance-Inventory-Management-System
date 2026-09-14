export type PageKey =
  | "dashboard"
  | "orders"
  | "products"
  | "inventory"
  | "customers"
  | "couriers"
  | "riders"
  | "finance"
  | "tasks"
  | "staff"
  | "reports"
  | "settings"
  | "security"
  | "audit";

export interface BreadcrumbEntry {
  title: string;
  crumb: string;
  headerBtn: string;
}

export const breadcrumbMap: Record<PageKey, BreadcrumbEntry> = {
  dashboard: { title: "Dashboard", crumb: "Overview", headerBtn: "Quick Add" },
  orders: { title: "Orders", crumb: "All Orders", headerBtn: "New Order" },
  products: {
    title: "Products",
    crumb: "All Products",
    headerBtn: "Add Product",
  },
  inventory: {
    title: "Inventory",
    crumb: "Stock Levels",
    headerBtn: "Stock In",
  },
  customers: {
    title: "Customers",
    crumb: "All Customers",
    headerBtn: "Add Customer",
  },
  couriers: {
    title: "Couriers",
    crumb: "Courier Companies",
    headerBtn: "Add Courier",
  },
  riders: { title: "Riders", crumb: "All Riders", headerBtn: "Add Rider" },
  finance: { title: "Financials", crumb: "COD Tracking", headerBtn: "Log COD" },
  tasks: { title: "Tasks", crumb: "All Tasks", headerBtn: "Add Task" },
  staff: {
    title: "Staff & Roles",
    crumb: "Staff Members",
    headerBtn: "Add Staff",
  },
  reports: { title: "Reports", crumb: "Sales Reports", headerBtn: "Export" },
  settings: { title: "Settings", crumb: "General", headerBtn: "Save" },
  security: {
    title: "Security & Backup",
    crumb: "Overview",
    headerBtn: "Run Backup",
  },
  audit: { title: "Audit Logs", crumb: "All Logs", headerBtn: "Export Logs" },
};
