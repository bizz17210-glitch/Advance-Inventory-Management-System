// CRUD_Project/app/client/src/types/customer.ts

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city?: string; // ✅ add this
  segment: "Regular" | "VIP" | "Occasional" | "New" | "Inactive";
  totalOrders: number;
  totalSpend?: number; // ✅ add this (your mock uses totalSpend)
  totalSpent?: number; // keep optional for backward compat
  totalSpendAmount?: number;
  averageOrderValue?: number; // ✅ make optional
  lastOrder?: string; // ✅ add this (your mock uses lastOrder)
  lastOrderDate?: string; // keep optional
  createdAt: string;
  updatedAt?: string; // ✅ make optional
  status?: "Active" | "Inactive" | "Suspended" | "Blocked";
  notes?: string;
  tags?: string[];
  preferredCourier?: string;
  deliveryInstructions?: string;
  isWhatsAppOptIn: boolean;
  isEmailOptIn: boolean;
  loyaltyPoints?: number;
  referredBy?: string; // Customer ID
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  city: string;
  segment: Customer["segment"];
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  status: Customer["status"];
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  segment?: Customer["segment"];
  notes?: string;
  tags?: string[];
  isWhatsAppOptIn?: boolean;
  isEmailOptIn?: boolean;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  id: string;
  status?: Customer["status"];
  loyaltyPoints?: number;
}

export interface CustomerFilter {
  search?: string;
  segment?: Customer["segment"][];
  status?: Customer["status"][];
  city?: string;
  minOrders?: number;
  maxOrders?: number;
  minSpent?: number;
  maxSpent?: number;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

export interface CustomerStats {
  total: number;
  bySegment: Record<Customer["segment"], number>;
  byStatus: Record<NonNullable<Customer["status"]>, number>;
  avgOrdersPerCustomer: number;
  avgSpentPerCustomer: number;
  newThisMonth: number;
  vipCount: number;
}
