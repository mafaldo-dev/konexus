export interface PurchaseOrder {
  id: string | any;
  orderNumber: string;
  supplierId: string | number;
  orderDate: string;
  deliveryDate?: string | Date | any
  orderStatus: 'pending' | 'approved' | 'in_progress' | 'canceled' | 'received' | string;
  totalCost: number;
  currency: string;
  notes?: string;
  companyId?: string | number;
  invoiceNumber?: number | string
  orderItems: {
    productid: string | number;
    quantity: number;
    cost: number;
    productname?: string
    productcode?: string
    productlocation?: string
    productbrand?: string
  }[];
  supplier?: {
    id: string | number;
    name: string;
    email?: string;
    phone?: string;
    cnpj?: string
    address?: {
      street: string
      city: string
      number: number
      state: string
    }
  };
  requestingCompany?: {
    id: string | any;
    name: string | any;
    logo?: string;
    buyer?: string;
  };
  createdAt?: string | Date
}

export interface InvoiceDataEntries {
  order_id: string;
  invoice_number: string | number;
  issue_date?: Date;
  total_value?: number;
  xml_path?: string | null;
  status: string
}
