/**
 * src/types/reports/index.ts
 * Interfaces de relatórios.
 */

export interface SalesReport {
  totalSales: number;
  numberOfOrders: number;
  averageOrderValue: number;
}

export interface PurchaseReport {
  totalPurchases: number;
  numberOfInvoices: number;
  averageInvoiceValue: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  totalSpent: number;
}

export interface CustomerRank {
  rank: number;
  customerId: string | number;
  name: string;
  totalSpent: number;
}

export interface ReportItem {
  code: string;
  name: string;
  brand: string;
  quantity: number;
  location: string;
  orderNumber: string;
}
