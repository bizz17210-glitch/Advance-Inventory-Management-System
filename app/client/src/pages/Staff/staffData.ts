// ═══════════════════════════════════════════════════════════
// staffData.ts — static lookup data + API-to-UI mappers
// Dynamic data is fetched in components via usersAPI / analyticsAPI
// ═══════════════════════════════════════════════════════════

import {
  ApiUser,
  ApiRole,
  ApiStatus,
  AccessLevel,
  Severity,
  StaffMember,
  Role,
  ActivityEntry,
  MatrixModule,
  IntegrationConfig,
  TaskPerfEntry,
  OrderProcEntry,
} from "./staff.types";

// ── Role → colour palette ─────────────────────────────────
const ROLE_COLORS: Record<ApiRole, string> = {
  Administrator: "#FF6A00",
  OperationsManager: "#8B5CF6",
  InventoryManager: "#2563EB",
  SalesOperator: "#EC4899",
  Accounts: "#059669",
  CourierHandler: "#7C3AED",
  Rider: "#16A34A",
};

const ROLE_DEPT: Record<ApiRole, string> = {
  Administrator: "Management",
  OperationsManager: "Operations",
  InventoryManager: "Inventory",
  SalesOperator: "Sales",
  Accounts: "Finance",
  CourierHandler: "Logistics",
  Rider: "Logistics",
};

const ROLE_DISPLAY: Record<ApiRole, string> = {
  Administrator: "Administrator",
  OperationsManager: "Ops Manager",
  InventoryManager: "Inventory Manager",
  SalesOperator: "Sales Operator",
  Accounts: "Accounts",
  CourierHandler: "Courier Handler",
  Rider: "Rider",
};

// ── Generate a deterministic avatar colour / initials ─────
function initials(u: ApiUser): string {
  return (
    ((u.firstName?.[0] ?? "") + (u.lastName?.[0] ?? "")).toUpperCase() ||
    u.username.slice(0, 2).toUpperCase()
  );
}

// ── Map an ApiUser → UI StaffMember ──────────────────────
export function mapUserToStaff(
  u: ApiUser,
  perfMap?: Map<string, { tasks: number; completed: number; score: number }>,
  orderMap?: Map<string, { orders: number }>,
): StaffMember {
  const perf = perfMap?.get(u._id);
  const order = orderMap?.get(u._id);

  return {
    id: u._id,
    name: `${u.firstName} ${u.lastName}`.trim() || u.username,
    email: u.email,
    phone: u.phone ?? "—",
    role: ROLE_DISPLAY[u.role] ?? u.role,
    apiRole: u.role,
    dept: ROLE_DEPT[u.role] ?? "Other",
    status: u.status,
    joined: u.createdAt
      ? new Date(u.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—",
    lastActive: u.lastLogin ? formatLastActive(u.lastLogin) : "Never",
    avatar: initials(u),
    color: ROLE_COLORS[u.role] ?? "#6B7280",
    tasks: perf?.tasks ?? 0,
    completed: perf?.completed ?? 0,
    orders: order?.orders ?? 0,
    errors: 0,
    score: perf?.score ?? 0,
  };
}

function formatLastActive(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 2) return "Just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr === 1 ? "1 hr ago" : `${hr} hrs ago`;
  const dy = Math.floor(hr / 24);
  if (dy === 1) return "Yesterday";
  if (dy < 7) return `${dy} days ago`;
  return new Date(isoStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

// ── Build performance maps from analytics response ────────
export function buildPerfMap(
  taskPerf: TaskPerfEntry[],
): Map<string, { tasks: number; completed: number; score: number }> {
  const map = new Map<
    string,
    { tasks: number; completed: number; score: number }
  >();
  taskPerf.forEach((p) =>
    map.set(p._id, {
      tasks: p.totalTasks,
      completed: p.completed,
      score: Math.round(p.completionRate),
    }),
  );
  return map;
}

export function buildOrderMap(
  orderProc: OrderProcEntry[],
): Map<string, { orders: number }> {
  const map = new Map<string, { orders: number }>();
  orderProc.forEach((p) => map.set(p._id, { orders: p.ordersPlaced }));
  return map;
}

// ── Lookup Maps ────────────────────────────────────────────
export const statusDotClass: Record<ApiStatus, string> = {
  Active: "online",
  Inactive: "offline",
  Suspended: "suspended",
};

export const statusBadgeClass: Record<ApiStatus, string> = {
  Active: "green",
  Inactive: "gray",
  Suspended: "orange",
};

export const severityBadgeClass: Record<Severity, string> = {
  Info: "blue",
  Warning: "orange",
  Critical: "red",
};

export const levelBadgeClass: Record<AccessLevel, string> = {
  Full: "orange",
  High: "blue",
  Medium: "blue",
  Limited: "gray",
  Minimal: "gray",
};

// ── Helpers ────────────────────────────────────────────────
export const scoreColor = (s: number) =>
  s >= 90 ? "#16A34A" : s >= 75 ? "#D97706" : "#DC2626";

export const scoreFill = (s: number) =>
  s >= 90 ? "green" : s >= 75 ? "yellow" : "red";

export const completionPct = (s: StaffMember) =>
  s.tasks > 0 ? Math.round((s.completed / s.tasks) * 100) : 0;

export const STAFF_PER_PAGE = 14;

// ── Static: Roles data ─────────────────────────────────────
export const ROLES_DATA: Role[] = [
  {
    name: "Administrator",
    members: 0,
    level: "Full",
    color: "#FF6A00",
    desc: "Complete system access and configuration.",
  },
  {
    name: "Ops Manager",
    members: 0,
    level: "High",
    color: "#8B5CF6",
    desc: "Oversight of operations, reports, and staff.",
  },
  {
    name: "Inventory Manager",
    members: 0,
    level: "Medium",
    color: "#2563EB",
    desc: "Product and stock management.",
  },
  {
    name: "Sales Operator",
    members: 0,
    level: "Limited",
    color: "#EC4899",
    desc: "Order entry and customer management.",
  },
  {
    name: "Accounts",
    members: 0,
    level: "Limited",
    color: "#059669",
    desc: "Financial tracking and supplier payments.",
  },
  {
    name: "Courier Handler",
    members: 0,
    level: "Limited",
    color: "#7C3AED",
    desc: "Courier assignment and shipment tracking.",
  },
  {
    name: "Rider",
    members: 0,
    level: "Minimal",
    color: "#16A34A",
    desc: "View and update own delivery assignments.",
  },
];

// ── Static: Permissions Matrix ────────────────────────────
export const MATRIX_MODULES: MatrixModule[] = [
  { mod: "Dashboard", perms: [true, true, true, true, true, true, false] },
  { mod: "Products", perms: [true, true, true, false, false, false, false] },
  { mod: "Orders", perms: [true, true, false, true, true, true, true] },
  { mod: "Inventory", perms: [true, true, true, false, false, false, false] },
  { mod: "Customers", perms: [true, true, false, true, false, false, false] },
  { mod: "Couriers", perms: [true, true, false, false, false, true, false] },
  { mod: "Riders", perms: [true, true, false, false, false, false, true] },
  { mod: "Finance", perms: [true, false, false, false, true, false, false] },
  { mod: "Tasks", perms: [true, true, true, true, true, true, true] },
  { mod: "Staff", perms: [true, true, false, false, false, false, false] },
  { mod: "Reports", perms: [true, true, false, false, true, false, false] },
  { mod: "Settings", perms: [true, false, false, false, false, false, false] },
];

export const MODULE_PERMS: Record<string, Record<string, boolean>> = {
  Administrator: {
    Dashboard: true,
    Products: true,
    Orders: true,
    Inventory: true,
    Customers: true,
    Couriers: true,
    Riders: true,
    Finance: true,
    Tasks: true,
    Staff: true,
    Reports: true,
    Settings: true,
  },
  "Ops Manager": {
    Dashboard: true,
    Products: true,
    Orders: true,
    Inventory: true,
    Customers: true,
    Couriers: true,
    Riders: true,
    Finance: false,
    Tasks: true,
    Staff: true,
    Reports: true,
    Settings: false,
  },
  "Inventory Manager": {
    Dashboard: true,
    Products: true,
    Orders: false,
    Inventory: true,
    Customers: false,
    Couriers: false,
    Riders: false,
    Finance: false,
    Tasks: true,
    Staff: false,
    Reports: false,
    Settings: false,
  },
  "Sales Operator": {
    Dashboard: true,
    Products: false,
    Orders: true,
    Inventory: false,
    Customers: true,
    Couriers: false,
    Riders: false,
    Finance: false,
    Tasks: true,
    Staff: false,
    Reports: false,
    Settings: false,
  },
  Accounts: {
    Dashboard: true,
    Products: false,
    Orders: true,
    Inventory: false,
    Customers: false,
    Couriers: false,
    Riders: false,
    Finance: true,
    Tasks: true,
    Staff: false,
    Reports: true,
    Settings: false,
  },
  "Courier Handler": {
    Dashboard: true,
    Products: false,
    Orders: true,
    Inventory: false,
    Customers: false,
    Couriers: true,
    Riders: false,
    Finance: false,
    Tasks: true,
    Staff: false,
    Reports: false,
    Settings: false,
  },
  Rider: {
    Dashboard: false,
    Products: false,
    Orders: true,
    Inventory: false,
    Customers: false,
    Couriers: false,
    Riders: true,
    Finance: false,
    Tasks: true,
    Staff: false,
    Reports: false,
    Settings: false,
  },
};

// ── Static: Integrations ──────────────────────────────────
export const INTEGRATIONS: IntegrationConfig[] = [
  {
    id: "slack",
    name: "Slack",
    sub: "Team messaging & notifications",
    desc: "Send automatic staff notifications for new task assignments, overdue tasks, and performance alerts directly to Slack channels.",
    imgUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/120px-Slack_icon_2019.svg.png",
    fallbackBg: "#4A154B",
    fallbackChar: "S",
    iconClass: "fa-brands fa-slack",
    connected: false,
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    sub: "Staff alerts via WhatsApp",
    desc: "Notify staff of task assignments and urgent alerts through WhatsApp Business API.",
    imgUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/120px-WhatsApp.svg.png",
    fallbackBg: "#25D366",
    fallbackChar: "W",
    iconClass: "fa-brands fa-whatsapp",
    connected: true,
  },
  {
    id: "google",
    name: "Google Workspace",
    sub: "Calendar, Gmail, Drive sync",
    desc: "Sync staff schedules with Google Calendar, send task email reminders via Gmail, and share reports on Drive automatically.",
    imgUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/120px-Google_%22G%22_Logo.svg.png",
    fallbackBg: "#4285F4",
    fallbackChar: "G",
    iconClass: "fa-brands fa-google",
    connected: false,
  },
  {
    id: "shopify",
    name: "Shopify",
    sub: "E-commerce staff sync",
    desc: "Assign staff roles to handle Shopify-synced orders.",
    imgUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shopify_logo_2018.svg/120px-Shopify_logo_2018.svg.png",
    fallbackBg: "#96BF48",
    fallbackChar: "SH",
    iconClass: "fa-solid fa-store",
    connected: false,
  },
  {
    id: "zoom",
    name: "Zoom",
    sub: "Team meetings & standups",
    desc: "Schedule and launch team meetings directly from the staff dashboard.",
    imgUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Zoom_Logo_2022.svg/120px-Zoom_Logo_2022.svg.png",
    fallbackBg: "#2D8CFF",
    fallbackChar: "Z",
    iconClass: "fa-solid fa-video",
    connected: false,
  },
  {
    id: "trello",
    name: "Trello",
    sub: "Visual task board sync",
    desc: "Sync tasks assigned in this system to Trello boards.",
    imgUrl:
      "https://upload.wikimedia.org/wikipedia/en/thumb/8/8c/Trello_logo.svg/120px-Trello_logo.svg.png",
    fallbackBg: "#0052CC",
    fallbackChar: "T",
    iconClass: "fa-solid fa-table-columns",
    connected: false,
  },
];

export const NOTIF_TRIGGERS = [
  { label: "New task assigned to staff member", checked: true },
  { label: "Task overdue (past due date)", checked: true },
  { label: "Task marked as completed", checked: false },
  { label: "New staff member added", checked: true },
  { label: "Staff login from new device", checked: false },
  { label: "Role or permission changed", checked: true },
];

export const NOTIF_CHANNELS = [
  { label: "In-app dashboard notification", checked: true },
  { label: "WhatsApp (if connected)", checked: true },
  { label: "Slack (if connected)", checked: false },
  { label: "Email (Google Workspace)", checked: false },
  { label: "Weekly performance digest", checked: false },
];

// ── Panel placeholder data (shown when no real data yet) ──
export const PANEL_TASKS = [
  {
    title: "Review low-stock items",
    due: "Today",
    status: "In Progress",
    priority: "High",
  },
  {
    title: "Process pending returns",
    due: "Today",
    status: "Done",
    priority: "Normal",
  },
  {
    title: "Update supplier payments",
    due: "11 May",
    status: "Pending",
    priority: "High",
  },
  {
    title: "Prepare daily sales report",
    due: "11 May",
    status: "Done",
    priority: "Normal",
  },
  {
    title: "Follow up on overdue COD",
    due: "12 May",
    status: "Pending",
    priority: "High",
  },
];

export const PANEL_ACTIVITY = [
  { action: "Logged in", module: "System", time: "Today 09:12" },
  {
    action: "Updated order status to Packed",
    module: "Orders",
    time: "Today 09:45",
  },
  {
    action: "Added stock for SKU-0041",
    module: "Inventory",
    time: "Today 10:20",
  },
  { action: "Marked task as complete", module: "Tasks", time: "Today 11:00" },
  {
    action: "Exported sales report",
    module: "Reports",
    time: "Yesterday 16:30",
  },
];

// ── Static: Activity log (real audit API not exposed; keep static) ──
export const ACTIVITY_LOG = [
  {
    time: "11 May 09:12",
    staff: "Admin",
    action: "Logged in to system",
    module: "System",
    detail: "Session started",
    severity: "Info" as Severity,
  },
  {
    time: "11 May 09:45",
    staff: "Ops Manager",
    action: "Updated order ORD-1052 to Packed",
    module: "Orders",
    detail: "Order ID: ORD-1052",
    severity: "Info" as Severity,
  },
  {
    time: "11 May 10:03",
    staff: "Inv Manager",
    action: "Added 30 units for SKU-0041",
    module: "Inventory",
    detail: "Stock: 3 → 33",
    severity: "Info" as Severity,
  },
  {
    time: "11 May 10:44",
    staff: "Accounts",
    action: "Recorded COD collection",
    module: "Finance",
    detail: "Amount: ₨5,400",
    severity: "Info" as Severity,
  },
  {
    time: "11 May 11:30",
    staff: "Admin",
    action: "Changed role for a staff member",
    module: "Staff",
    detail: "Role updated",
    severity: "Warning" as Severity,
  },
  {
    time: "11 May 12:15",
    staff: "Sales Op",
    action: "Failed login attempt",
    module: "System",
    detail: "IP: 203.55.11.4",
    severity: "Critical" as Severity,
  },
  {
    time: "11 May 12:30",
    staff: "Sales Op",
    action: "Cancelled order ORD-1046",
    module: "Orders",
    detail: "Reason: Customer request",
    severity: "Warning" as Severity,
  },
  {
    time: "11 May 13:00",
    staff: "Admin",
    action: "Modified product pricing",
    module: "Products",
    detail: "Price updated",
    severity: "Info" as Severity,
  },
];

export const DEPT_PERFORMANCE = [
  { dept: "Operations", score: 94 },
  { dept: "Sales", score: 80 },
  { dept: "Inventory", score: 88 },
  { dept: "Finance", score: 86 },
  { dept: "Logistics", score: 91 },
  { dept: "Management", score: 98 },
];
