export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  location?: string
}

export interface Order {
  id?: string | any
  orderDate: string;
  orderStatus: string | any
  orderNumber: string | any
  customerName: string
  customerCode: string
  customerId: string | number;
  customerPhone?: string
  totalAmount: number;
  currency: string;
  shippingAddressId?: number
  billingAddressId?: number
  salesperson?: string;
  notes?: string;
  orderItems: OrderItem[];
  carrier: string
  payment_method?: string
}


// -----------<->------------//

// Para RESPOSTA DA API (GET)
export interface OrderResponse {
  id: number | any;
  orderDate: string;
  orderStatus: string;
  orderNumber: string;
  totalAmount: number | any;
  currency: string;
  salesperson?: string;
  notes?: string;
  carrier: string
  payment_method?: string
  companyCnpj: string
  payment?:{
    id?:string
    status?: string
    date?: string | any
    due_date?: string | any
    amount?: string
  }

  customer: {
    id: number | any;
    name: string;
    code: string;
    phone?: string;
    email?: string;
    status?: string
    cpf_cnpj?: string
  };

  shipping?: Address;
  billing?: Address;

  orderItems: OrderItemResponse[];
  totalVolumes?: number
  totalWeight?: number
}
export interface OrderItemResponse {
  productId: number;
  productName: string;
  productCode: string;
  productBrand: string
  quantity: number;
  unitPrice: number;
  location?: string;
  subtotal: number;
}

export interface Address {
  id?: number;
  street?: string;
  number?: number;
  city?: string;
  zip?: string;
  state?: string
  city_code?: string
}


