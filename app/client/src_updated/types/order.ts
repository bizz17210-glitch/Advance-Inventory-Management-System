// CRUD_Project/app/client/src/types/order.ts

import { Customer } from "./customer";

// Add this after the Customer import
export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  city?: string;
}

export interface OrderItem {
  sku: string;
  id?: string; // ✅ make optional
  name?: string; // ✅ add this (mock uses name)
  productName?: string; // ✅ make optional
  productSku?: string; // ✅ make optional
  variant?: {
    size?: string;
    color?: string;
    material?: string;
  };
  qty?: number; // ✅ add this (mock uses qty)
  quantity?: number; // ✅ make optional
  price?: number; // ✅ add this (mock uses price)
  unitPrice?: number; // ✅ make optional
  discount?: number;
  subtotal?: number; // ✅ make optional
  imageUrl?: string;
}

export interface Order {
  id: string; // e.g., "ORD-1052"
  orderNumber: string; // human-readable, e.g., "ORD-1052"
  customerId?: string;
  customer?: CustomerSummary; // embedded for list views
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  shippingCost: number;
  tax?: number;
  total: number; // final amount
  paymentType: "COD" | "Prepaid";
  paymentStatus: "Pending" | "Paid" | "Refunded" | "Failed";
  paymentMethod?: "Cash" | "JazzCash" | "EasyPaisa" | "BankTransfer" | "Card";
  transactionRef?: string;
  channel:
    | "WhatsApp"
    | "Shopify"
    | "Manual"
    | "Instagram"
    | "Facebook"
    | "WooCommerce";
  status:
    | "Pending"
    | "Confirmed"
    | "Packed"
    | "Shipped"
    | "Delivered"
    | "Cancelled"
    | "Returned";
  courierId?: string;
  courierName?: string;
  trackingNumber?: string;
  shippingAddress: {
    recipientName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    landmark?: string;
  };
  billingAddress?: {
    recipientName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  notes?: string;
  internalNotes?: string; // for staff only
  assignedTo?: string; // Staff ID
  assignedAt?: string;
  confirmedAt?: string;
  packedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelledReason?: string;
  returnedAt?: string;
  returnReason?: string;
  codAmount: number; // amount to be collected on delivery
  codCollected?: boolean;
  codCollectedAt?: string;
  codCollectedBy?: string; // Rider/Staff ID
  createdAt: string;
  updatedAt: string;
  sourceIp?: string;
  userAgent?: string;
  tags?: string[];
  priority: "Low" | "Normal" | "High" | "Urgent";
  isFragile?: boolean;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  deliveryAttempts?: number;
  lastDeliveryAttempt?: string;
  failureReason?: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  paymentType: Order["paymentType"];
  status: Order["status"];
  channel: Order["channel"];
  createdAt: string;
  itemsCount: number;
  codAmount: number;
  priority: Order["priority"];
}

export interface CreateOrderInput {
  customerId?: string;
  customer?: {
    name: string;
    phone: string;
    email?: string;
  };
  items: {
    productId: string;
    quantity: number;
    variant?: {
      size?: string;
      color?: string;
      material?: string;
    };
    unitPrice: number;
    discount?: number;
  }[];
  shippingAddress: {
    recipientName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    landmark?: string;
  };
  paymentType: Order["paymentType"];
  channel: Order["channel"];
  notes?: string;
  shippingCost?: number;
  discount?: number;
  tax?: number;
  priority?: Order["priority"];
  isFragile?: boolean;
  estimatedDeliveryDate?: string;
  tags?: string[];
}

export interface UpdateOrderInput extends Partial<CreateOrderInput> {
  id: string;
  status?: Order["status"];
  paymentStatus?: Order["paymentStatus"];
  courierId?: string;
  trackingNumber?: string;
  assignedTo?: string;
  codCollected?: boolean;
  cancelledReason?: string;
  returnReason?: string;
  internalNotes?: string;
}

export interface OrderFilter {
  search?: string; // order number, customer name, phone
  status?: Order["status"][];
  paymentStatus?: Order["paymentStatus"][];
  paymentType?: Order["paymentType"][];
  channel?: Order["channel"][];
  dateFrom?: string;
  dateTo?: string;
  minTotal?: number;
  maxTotal?: number;
  codOnly?: boolean;
  customerId?: string;
  courierId?: string;
  assignedTo?: string;
  priority?: Order["priority"][];
  tags?: string[];
  hasTracking?: boolean;
  isOverdue?: boolean;
}

export interface OrderStats {
  total: number;
  byStatus: Record<Order["status"], number>;
  byPaymentType: Record<Order["paymentType"], number>;
  byChannel: Record<Order["channel"], number>;
  totalRevenue: number;
  codRevenue: number;
  prepaidRevenue: number;
  avgOrderValue: number;
  pendingCount: number;
  cancelledCount: number;
  returnedCount: number;
  codPendingCollection: number;
}

export interface OrderTimelineEvent {
  timestamp: string;
  status: Order["status"];
  updatedBy: string; // Staff name or "System"
  notes?: string;
  metadata?: Record<string, unknown>;
}
