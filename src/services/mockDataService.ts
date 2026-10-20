/**
 * src/services/mockDataService.ts
 * Serviço de dados mock para evitar quebra do sistema quando módulos
 * são acessados pela primeira vez sem dados reais no backend.
 *
 * Fornece listas vazias com estrutura válida e dados de exemplo
 * para telas de compras, vendas, estoque, financeiro, etc.
 */

export interface MockOrder {
  id: number;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  totalAmount: number;
  currency: string;
  salesperson?: string;
  customer: {
    id: number;
    name: string;
    code: string;
    phone?: string;
    email?: string;
  };
  orderItems: Array<{
    productId: string | number;
    productName: string;
    productCode: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  payment?: {
    id?: string;
    status?: string;
    date?: string | any;
    due_date?: string | any;
    amount?: string;
  };
}

export interface MockProduct {
  id: number | string;
  name: string;
  code: string;
  stock: number;
  min_stock: number;
  price: number;
  supplier_id?: number | string;
  category?: string;
}

export interface MockSupplier {
  id: number | string;
  name: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  active: boolean;
}

/**
 * Retorna uma lista vazia de pedidos com estrutura válida.
 */
export function getMockOrders(): MockOrder[] {
  return [];
}

/**
 * Retorna uma lista vazia de produtos com estrutura válida.
 */
export function getMockProducts(): MockProduct[] {
  return [];
}

/**
 * Retorna uma lista vazia de fornecedores com estrutura válida.
 */
export function getMockSuppliers(): MockSupplier[] {
  return [];
}

/**
 * Verifica se um array está vazio e retorna um valor padrão seguro.
 */
export function safeArray<T>(data: T[] | null | undefined): T[] {
  return Array.isArray(data) ? data : [];
}

/**
 * Retorna dados de exemplo para exibição quando não há dados reais.
 * Útil para telas que precisam mostrar algo ao usuário pela primeira vez.
 */
export function getMockDashboardStats() {
  return {
    totalOrders: 0,
    totalValue: "R$ 0,00",
    pendingOrders: 0,
    inProgressOrders: 0,
    activeEmployees: 0,
  };
}
