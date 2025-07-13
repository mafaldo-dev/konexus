
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
  customerId: string;
  name: string;
  totalSpent: number;
}
