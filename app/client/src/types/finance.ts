// ═══════════════════════════════════════════════════════════
// FINANCE TYPES — aligned with NEXUS IMS Backend API
// ═══════════════════════════════════════════════════════════

// ── Shared Pagination ──────────────────────────────────────
export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SimplePagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Shared Ref Types ───────────────────────────────────────
export interface UserRef {
  _id?: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

// ═══════════════════════════════════════════════════════════
// EXPENSES  —  /api/expenses
// ═══════════════════════════════════════════════════════════

/** Categories accepted by POST /api/expenses */
export type ExpenseCategoryName =
  | "Shipping"
  | "Marketing"
  | "Utilities"
  | "Salaries"
  | "Supplies"
  | "Software"
  | "Other";

export type ExpenseStatus = "Active" | "Cancelled";

/** Single expense record returned by GET /api/expenses and GET /api/expenses/:id */
export interface ApiExpense {
  _id: string;
  date: string; // ISO date string
  amount: number;
  category: ExpenseCategoryName;
  description: string;
  status: ExpenseStatus;
  attachments?: string[]; // Cloudinary URLs
  recordedBy: UserRef;
  createdAt?: string;
  updatedAt?: string;
}

/** POST /api/expenses body */
export interface CreateExpensePayload {
  date: string; // ISO date e.g. '2026-05-11'
  amount: number;
  category: ExpenseCategoryName;
  description: string;
  attachments?: string[];
}

/** PUT /api/expenses/:id body */
export type UpdateExpensePayload = Partial<CreateExpensePayload>;

/** GET /api/expenses list response */
export interface ExpenseListResponse {
  success: boolean;
  data: {
    expenses: ApiExpense[];
    pagination: Pagination;
  };
}

/** GET /api/expenses/:id response */
export interface ExpenseDetailResponse {
  success: boolean;
  expense: ApiExpense;
}

/** GET /api/expenses/categories response */
export interface ExpenseCategoriesResponse {
  success: boolean;
  data: {
    categories: ExpenseCategoryName[];
    total: number;
  };
}

/** GET /api/expenses/analytics/summary response */
export interface ExpenseAnalyticsResponse {
  success: boolean;
  data: {
    kpis: {
      totalExpenses: number;
      totalAmount: string;
      avgPerExpense: string;
      maxSingleExpense: string;
    };
    categoryBreakdown: Array<{
      category: ExpenseCategoryName;
      total: string;
      count: number;
      avg: string;
    }>;
    timeline: Array<{
      date: string;
      total: string;
      count: number;
    }>;
  };
}

// ═══════════════════════════════════════════════════════════
// SUPPLIERS  —  /api/suppliers
// ═══════════════════════════════════════════════════════════

export type SupplierPaymentTerms =
  | "Net 15"
  | "Net 30"
  | "Net 60"
  | "Net 90"
  | "Immediate";
export type SupplierBalanceStatus = "cleared" | "low" | "medium" | "high";

/** Supplier record returned by API */
export interface ApiSupplier {
  _id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    country?: string;
  };
  paymentTerms?: SupplierPaymentTerms;
  totalPurchases: number;
  totalPaid: number;
  outstanding: number;
  lastPaymentDate?: string;
  isActive?: boolean;
  createdAt?: string;
}

/** GET /api/suppliers list response */
export interface SupplierListResponse {
  success: boolean;
  data: {
    suppliers: ApiSupplier[];
    pagination: Pagination;
  };
}

/** GET /api/suppliers/payments/summary */
export interface SupplierSummaryItem {
  _id: string;
  name: string;
  totalPurchases: number;
  totalPaid: number;
  outstanding: number;
  status: SupplierBalanceStatus;
  lastPaymentDate?: string;
}

export interface SupplierPaymentsSummaryResponse {
  success: boolean;
  data: {
    summary: SupplierSummaryItem[];
    grandTotals: {
      totalPurchases: number;
      totalPaid: number;
      totalOutstanding: number;
      supplierCount: number;
    };
    statusBreakdown: {
      cleared: number;
      low: number;
      medium: number;
      high: number;
    };
  };
}

// ═══════════════════════════════════════════════════════════
// SUPPLIER PAYMENTS  —  /api/suppliers/:id/payments
// ═══════════════════════════════════════════════════════════

export type SupplierPaymentMethod =
  | "Bank Transfer"
  | "Cash"
  | "Cheque"
  | "Online"
  | "Other";

/** Single supplier payment record */
export interface ApiSupplierPayment {
  _id: string;
  amount: number;
  paymentMethod: SupplierPaymentMethod;
  referenceNumber?: string;
  paymentDate: string;
  notes?: string;
  invoiceReference?: string;
  isVoided: boolean;
  voidReason?: string;
  recordedBy: UserRef;
  createdAt?: string;
}

/** GET /api/suppliers/:id/payments response */
export interface SupplierPaymentsResponse {
  success: boolean;
  data: {
    supplier: {
      _id: string;
      name: string;
      totalPurchases: number;
      totalPaid: number;
      outstanding: number;
      lastPaymentDate?: string;
    };
    payments: ApiSupplierPayment[];
    pagination: SimplePagination;
  };
}

/** POST /api/suppliers/:id/payments body */
export interface RecordSupplierPaymentPayload {
  amount: number;
  paymentMethod: SupplierPaymentMethod;
  referenceNumber?: string;
  paymentDate: string; // ISO date e.g. '2026-05-11'
  notes?: string;
  invoiceReference?: string;
}

/** POST /api/suppliers/:id/payments response */
export interface RecordPaymentResponse {
  success: boolean;
  message: string;
  data: {
    payment: ApiSupplierPayment;
    updatedOutstanding: number;
  };
}

// ═══════════════════════════════════════════════════════════
// ORDERS (COD / PREPAID)  —  /api/orders
// ═══════════════════════════════════════════════════════════

export type OrderPaymentMethod =
  | "COD"
  | "Prepaid"
  | "Card"
  | "BankTransfer"
  | "Wallet";
export type OrderPaymentStatus = "Pending" | "Paid" | "Partial" | "Refunded";
export type OrderDeliveryStatus =
  | "Pending"
  | "Assigned"
  | "PickedUp"
  | "InTransit"
  | "OutForDelivery"
  | "Delivered"
  | "Failed"
  | "Returned";
export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Packed"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Returned";

/** Order list item returned by GET /api/orders */
export interface ApiOrderListItem {
  _id: string;
  orderId: string;
  source: string;
  orderStatus: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  paymentMethod: OrderPaymentMethod;
  deliveryStatus?: OrderDeliveryStatus;
  totalAmount: number;
  shippingCost?: number;
  discount?: number;
  createdAt: string;
  customer: {
    _id?: string;
    fullName: string;
    email?: string;
    phone?: string;
  };
  rider?: {
    _id: string;
    name?: string;
  };
  trackingNumber?: string;
}

/** GET /api/orders list response */
export interface OrderListResponse {
  success: boolean;
  data: {
    orders: ApiOrderListItem[];
    pagination: Pagination;
  };
}

// ═══════════════════════════════════════════════════════════
// ANALYTICS (FINANCIAL)  —  /api/analytics/financial
// ═══════════════════════════════════════════════════════════

export interface FinancialAnalyticsResponse {
  success: boolean;
  data: {
    kpis: {
      totalRevenue: string;
      totalExpenses: string;
      grossProfit: string;
      profitMargin: string;
      codPending: { count: number; amount: string };
      codCollected: { count: number; amount: string };
      totalSupplierDebt: string;
    };
    timeline: Array<{
      date: string;
      revenue: number;
      expenses: number;
      profit: string;
      orders: number;
      codCollected: number;
    }>;
    expenseByCategory: Array<{
      category: string;
      total: string;
      count: number;
      percentage: string;
    }>;
    outstandingSuppliers: Array<{
      name: string;
      balance: number;
    }>;
  };
}

// ═══════════════════════════════════════════════════════════
// LEGACY / UI-ONLY TYPES
// Kept for static mock panels until full API migration.
// Remove once each panel is wired to live data.
// ═══════════════════════════════════════════════════════════

export type TransactionType =
  | "COD Collection"
  | "Prepaid"
  | "Expense"
  | "Supplier Payment"
  | "Rider Payout";

/** @deprecated Use ApiExpense / ApiOrderListItem / ApiSupplierPayment instead */
export interface FinanceEntry {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  relatedOrder?: string;
  relatedRider?: string;
  date: string;
  createdBy: string;
}

// ── Finance page nav panel keys (UI only) ─────────────────
export type NavPanel =
  | "overview"
  | "cod"
  | "cod-log"
  | "prepaid"
  | "expenses"
  | "exp-add"
  | "exp-categories"
  | "suppliers"
  | "sup-payments"
  | "sup-add"
  | "reports"
  | "pl"
  | "integrations"
  | "settings";

export interface OverlayState {
  open: boolean;
  title: string;
  content: React.ReactNode;
}
