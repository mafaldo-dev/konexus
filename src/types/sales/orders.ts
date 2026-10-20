/**
 * src/types/sales/orders.ts
 * Interfaces de pedidos de venda.
 */

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  location?: string;
}

export interface Order {
  id?: string | any;
  orderDate: string;
  orderStatus: string | any;
  orderNumber: string | any;
  customerName: string;
  customerCode: string;
  customerId: string | number;
  customerPhone?: string;
  totalAmount: number;
  currency: string;
  shippingAddressId?: number;
  billingAddressId?: number;
  salesperson?: string;
  notes?: string;
  orderItems: OrderItem[];
  carrier: string;
  payment_method?: string;
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
  carrier: string;
  payment_method?: string;
  companyCnpj?: string;
  payment?: {
    id?: string;
    status?: string;
    date?: string | any;
    due_date?: string | any;
    amount?: string;
  };
  // Análise de crédito (aplica-se quando módulo Financeiro está ativo)
  creditAnalysis?: {
    status: "pending" | "approved" | "rejected" | "exempt";
    score?: number;
    limit?: number;
    analyzedAt?: string | any;
    analyzedBy?: string;
    notes?: string;
  };
  customer: {
    id: number | any;
    name: string;
    code: string;
    phone?: string;
    email?: string;
    status?: string;
    cpf_cnpj?: string;
    // Limite de crédito do cliente
    creditLimit?: number;
    creditStatus?: "active" | "blocked" | "exempt";
  };
  shipping?: Address;
  billing?: Address;
  orderItems: OrderItemResponse[];
  totalVolumes?: number;
  totalWeight?: number;
  /**
   * Rastro da conferencia final (liberacao para expedicao).
   * `user` e o usuario autenticado que confirmou a senha: dado imutavel,
   * gravado pelo backend. `checkedBy` e o conferente declarado na tela.
   */
  conference?: {
    user?: string;
    checkedBy?: string;
    separator?: string;
    weight?: number;
    volumes?: number;
    at?: string;
  } | null;
}

export interface OrderItemResponse {
  productId: number | string;
  productName?: string;
  productCode?: string;
  productBrand?: string;
  quantity: number;
  unitPrice: number;
  location?: string;
  subtotal?: number;
  codigo_barras?: number | any;
}

export interface Address {
  id?: number;
  street?: string;
  number?: number;
  city?: string;
  zip?: string;
  state?: string;
  city_code?: string;
  neighborhood?: string;
}
