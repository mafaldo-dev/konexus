
export interface PurchaseOrder {
  id?: string | any;
  orderNumber: string;
  supplierId: string; 
  orderDate: string;
  deliveryDate?: string  | Date | any
  orderStatus: 'pending' | 'approved' | 'in_progress' | 'canceled' | 'received';
  totalCost: number;
  currency: string;
  notes?: string;
  companyId?: string;
  invoiceNumber?:number
  orderItems: {
    productid: string;
    quantity: number;
    cost: number;
    productname?: string
    productcode?: string
    productlocation?:string
  }[];
  supplier?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    cnpj?: string
    address?:{
      street: string
      city: string
      number: number
      state: string
    }
  };
  requestingCompany?: {
    id: string;
    name: string;
    logo?: string;
    buyer?: string;
  };
  createdAt: string | Date
}

export interface InvoiceDataEntries {
  order_id: string;
  invoice_number: string | number;
  issue_date?: Date;
  total_value?: number;
  xml_path?: string | null;
  status: string
}
