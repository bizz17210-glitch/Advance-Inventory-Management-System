import React from "react";

// ── Nav ────────────────────────────────────────────────────
export type NavPanel =
  | "overview"
  | "cod"
  | "cod-log"
  | "prepaid"
  | "expenses"
  | "exp-add"
  | "exp-edit"
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

// ── Shared ─────────────────────────────────────────────────
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

export interface UserRef {
  _id?: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

// ── Expenses ───────────────────────────────────────────────
export type ExpenseCategoryName =
  | "Shipping"
  | "Marketing"
  | "Utilities"
  | "Salaries"
  | "Supplies"
  | "Software"
  | "Other";

export type ExpenseStatus = "Active" | "Cancelled";

export interface ApiExpense {
  _id: string;
  date: string;
  amount: number;
  category: ExpenseCategoryName;
  description: string;
  status: ExpenseStatus;
  attachments?: string[];
  recordedBy: UserRef;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExpensePayload {
  date: string;
  amount: number;
  category: ExpenseCategoryName;
  description: string;
  attachments?: string[];
}

export type UpdateExpensePayload = Partial<CreateExpensePayload>;

export interface ExpenseAnalyticsKPIs {
  totalExpenses: number;
  totalAmount: string;
  avgPerExpense: string;
  maxSingleExpense: string;
}

export interface ExpenseCategoryBreakdown {
  category: ExpenseCategoryName;
  total: string;
  count: number;
  avg: string;
}

export interface ExpenseTimeline {
  date: string;
  total: string;
  count: number;
}

// ── Suppliers ──────────────────────────────────────────────
export type SupplierBalanceStatus = "cleared" | "low" | "medium" | "high";
export type SupplierPaymentMethod =
  | "Bank Transfer"
  | "Cash"
  | "Cheque"
  | "Online"
  | "Other";

export interface ApiSupplier {
  _id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: { street?: string; city?: string; country?: string };
  paymentTerms?: string;
  totalPurchases: number;
  totalPaid: number;
  outstanding: number;
  lastPaymentDate?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface SupplierSummaryItem {
  _id: string;
  name: string;
  totalPurchases: number;
  totalPaid: number;
  outstanding: number;
  status: SupplierBalanceStatus;
  lastPaymentDate?: string;
}

export interface SupplierGrandTotals {
  totalPurchases: number;
  totalPaid: number;
  totalOutstanding: number;
  supplierCount: number;
}

// ── Supplier Payments ──────────────────────────────────────
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

export interface RecordSupplierPaymentPayload {
  amount: number;
  paymentMethod: SupplierPaymentMethod;
  referenceNumber?: string;
  paymentDate: string;
  notes?: string;
  invoiceReference?: string;
}

// ── Orders (COD / Prepaid) ─────────────────────────────────
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
  customer: { _id?: string; fullName: string; email?: string; phone?: string };
  rider?: { _id: string; name?: string };
  trackingNumber?: string;
}

// ── Analytics ──────────────────────────────────────────────
export interface FinancialKPIs {
  totalRevenue: string;
  totalExpenses: string;
  grossProfit: string;
  profitMargin: string;
  codPending: { count: number; amount: string };
  codCollected: { count: number; amount: string };
  totalSupplierDebt: string;
}

export interface FinancialTimelineEntry {
  date: string;
  revenue: number;
  expenses: number;
  profit: string;
  orders: number;
  codCollected: number;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  cod: number;
  prepaid: number;
  expenses: number;
  supPaid: number;
  profit: number;
}
