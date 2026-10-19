/**
 * services/orderService.ts
 * Serviço de pedidos de venda (domínio: vendas).
 * Endpoints reais do backend:
 *   POST /orders/create
 *   GET  /orders/all
 *   GET  /orders/last-number
 *   GET  /orders/edit/:id
 *   GET  /orders/customers/list
 *   GET  /orders/:id
 *   PUT  /orders/:id
 *   PUT  /orders/:id/status
 *   PATCH /orders/:id/cancel
 *   DELETE /orders/:id
 */

import { apiClient, ApiResponse } from "../api/client";

export interface OrderItem {
  productId: string | number;
  quantity: number;
  unitPrice: number;
  location?: string;
}

export interface Order {
  id: number;
  orderDate: string;
  orderStatus: string;
  orderNumber: string;
  customerId: string | number;
  totalAmount: number;
  currency: string;
  shippingAddressId?: number;
  billingAddressId?: number;
  salesperson?: string;
  notes?: string;
  carrier: string;
  payment_method?: string;
  nfe_integration_id?: string;
  companyId: number;
  customer?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    code: string;
  };
  orderItems?: OrderItem[];
}

export interface OrderResponse extends Order {
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string;
    code: string;
  };
  orderItems: OrderItem[];
  total_volume?: number;
  total_weight?: number;
  payment?: {
    id?: string;
    status?: string;
    date?: string | any;
    due_date?: string | any;
    amount?: string;
  };
}

export interface OrderFilters {
  page?: number;
  limit?: number;
}

/**
 * Cria um pedido de venda (companyId definido pelo backend).
 */
export async function createOrder(
  data: Omit<Order, "id" | "companyId"> & { orderItems: OrderItem[] }
): Promise<ApiResponse<Order>> {
  return apiClient.post<Order>("orders/create", data);
}

/**
 * Lista pedidos da empresa autenticada (com paginação).
 */
export async function listOrders(
  filters: OrderFilters = {}
): Promise<ApiResponse<OrderResponse[]>> {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", String(filters.page));
  if (filters.limit) params.append("limit", String(filters.limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient.get<OrderResponse[]>(`orders/all${query}`);
}

/**
 * Retorna o último número de pedido da empresa.
 */
export async function getLastOrderNumber(): Promise<
  ApiResponse<{ lastOrderNumber: string }>
> {
  return apiClient.get("orders/last-number");
}

/**
 * Gera o próximo número de pedido com base no último.
 */
export async function getNextOrderNumber(): Promise<string> {
  const res = await getLastOrderNumber();
  if (!res.ok || !res.data) return "P-100";
  const last = res.data.lastOrderNumber;
  const match = String(last).match(/P-(\d+)/);
  if (match && match[1]) return `P-${parseInt(match[1], 10) + 1}`;
  if (!isNaN(Number(last))) return `P-${parseInt(String(last), 10) + 1}`;
  return "P-100";
}

/**
 * Busca pedido pelo ID (restrito à empresa).
 */
export async function getOrderById(
  id: number | string
): Promise<ApiResponse<Order>> {
  return apiClient.get<Order>(`orders/${id}`);
}

/**
 * Busca pedido para edição (restrito à empresa; apenas pending/backout).
 */
export async function getOrderForEdit(
  id: number | string
): Promise<ApiResponse<OrderResponse>> {
  return apiClient.get<OrderResponse>(`orders/edit/${id}`);
}

/**
 * Lista clientes para a área de vendas (restrito à empresa).
 */
export async function getOrderCustomers(): Promise<ApiResponse<any[]>> {
  return apiClient.get("orders/customers/list");
}

/**
 * Atualiza um pedido (campos parciais; apenas pending/backout).
 */
export async function updateOrder(
  id: number | string,
  data: Partial<Order>
): Promise<ApiResponse<Order>> {
  return apiClient.put<Order>(`orders/${id}`, data);
}

/**
 * Atualiza o status de um pedido.
 */
export async function updateOrderStatus(
  id: number | string,
  orderStatus: string,
  extraData?: { totalVolumes?: number; totalWeight?: number }
): Promise<ApiResponse<Order>> {
  return apiClient.put<Order>(`orders/${id}/status`, {
    orderStatus,
    ...extraData,
  });
}

/**
 * Cancela um pedido (reverte estoque via backend).
 */
export async function cancelOrder(
  id: number | string
): Promise<ApiResponse<{ message: string; orderId: number | string }>> {
  return apiClient.patch(`orders/${id}/cancel`);
}

/**
 * Exclui um pedido (restrito à empresa).
 */
export async function deleteOrder(
  id: number | string
): Promise<ApiResponse<{ message: string }>> {
  return apiClient.delete(`orders/${id}`);
}
