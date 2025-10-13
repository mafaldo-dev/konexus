// No seu arquivo de interfaces
export interface PurchaseOrder {
  id?: string;
  orderNumber: string;
  supplierId: string; // MUDANÇA CRÍTICA: backend espera supplierId, não supplier object
  orderDate: string;
  deliveryDate?: string  | Date | any// Opcional no backend
  orderStatus: 'pending' | 'approved' | 'in_progress' | 'canceled' | 'received';
  totalCost: number;
  currency: string;
  notes?: string;
  companyId?: string;
  orderItems: { // MUDANÇA CRÍTICA: backend espera orderItems, não products
    productid: string;
    quantity: number;
    cost: number;
    productname?: string
    productcode?: string
    productlocation?:string
  }[];
  // Campos opcionais para UI
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
