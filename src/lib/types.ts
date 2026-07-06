import { UserRole, CustomerType, PaymentMethod, SaleStatus, MovementType, AccountType, PlanType } from "@prisma/client";

export type { UserRole, CustomerType, PaymentMethod, SaleStatus, MovementType, AccountType, PlanType };

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  stock: number;
}

export interface OfflineSale {
  offlineId: string;
  tenantId: string;
  storeId: string;
  userId: string;
  customerId?: string;
  receiptNumber: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  change: number;
  debtAmount: number;
  paymentMethod: PaymentMethod;
  items: OfflineSaleItem[];
  createdAt: string;
  synced: boolean;
}

export interface OfflineSaleItem {
  productId: string;
  variantId?: string;
  name: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface DashboardStats {
  todaySales: number;
  todayRevenue: number;
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  monthlyRevenue: number;
  pendingDebt: number;
}

export interface SalesChartData {
  date: string;
  sales: number;
  revenue: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  totalQty: number;
  totalRevenue: number;
}

export interface PlanFeatures {
  pos: boolean;
  inventory: boolean;
  basicReports: boolean;
  suppliers: boolean;
  purchaseOrders: boolean;
  barcode: boolean;
  sms: boolean;
  accounting: boolean;
  customerDebt: boolean;
  loyalty: boolean;
  multiStore: boolean;
  wholesalePricing: boolean;
  advancedReports: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
