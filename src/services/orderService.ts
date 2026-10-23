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
import { asList, asObject, pickData } from "../api/payload";

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
  return asObject<Order>(
    await apiClient.post("orders/create", data),
    ["order"],
    "pedido criado",
    { allowDirect: true }
  );
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
  return asList<OrderResponse>(
    await apiClient.get(`orders/all${query}`),
    ["orders", "data"],
    "pedidos de venda"
  );
}

/**
 * Retorna o último número de pedido da empresa.
 */
export async function getLastOrderNumber(): Promise<
  ApiResponse<{ lastOrderNumber: string }>
> {
  const response = await apiClient.get<any>("orders/last-number");
  return pickData<{ lastOrderNumber: string }>(
    response,
    (body) => {
      if (
        !body ||
        typeof body !== "object" ||
        body.lastOrderNumber === undefined ||
        body.lastOrderNumber === null
      ) {
        return undefined;
      }
      return { lastOrderNumber: String(body.lastOrderNumber) };
    },
    "último número de pedido"
  );
}

/**
 * Gera o próximo número de pedido com base no último.
 *
 * Uma falha de comunicação não gera um número fictício: o formulário deve
 * impedir a criação do pedido até que a sequência real seja recuperada.
 */
export async function getNextOrderNumber(): Promise<string> {
  const res = await getLastOrderNumber();
  if (!res.ok || !res.data) {
    throw new Error(
      res.error || "Não foi possível obter o número do próximo pedido."
    );
  }

  const last = res.data.lastOrderNumber;
  const match = String(last).match(/P-(\d+)/);
  if (match && match[1]) return `P-${parseInt(match[1], 10) + 1}`;
  if (!isNaN(Number(last))) return `P-${parseInt(String(last), 10) + 1}`;

  throw new Error("O servidor retornou um número de pedido inválido.");
}

/**
 * Busca pedido pelo ID (restrito à empresa).
 */
export async function getOrderById(
  id: number | string
): Promise<ApiResponse<Order>> {
  return asObject<Order>(
    await apiClient.get(`orders/${id}`),
    ["order"],
    "pedido de venda"
  );
}

/**
 * Busca pedido para edição (restrito à empresa; apenas pending/backout).
 */
export async function getOrderForEdit(
  id: number | string
): Promise<ApiResponse<OrderResponse>> {
  return asObject<OrderResponse>(
    await apiClient.get(`orders/edit/${id}`),
    ["order"],
    "pedido para edição"
  );
}

/**
 * Lista clientes para a área de vendas (restrito à empresa).
 */
export async function getOrderCustomers(): Promise<ApiResponse<any[]>> {
  return asList<any>(
    await apiClient.get("orders/customers/list"),
    ["customers", "data"],
    "clientes para venda"
  );
}

/**
 * Atualiza um pedido (campos parciais; apenas pending/backout).
 */
export async function updateOrder(
  id: number | string,
  data: Partial<Order>
): Promise<ApiResponse<Order>> {
  return asObject<Order>(
    await apiClient.put(`orders/${id}`, data),
    ["order"],
    "pedido atualizado"
  );
}

/**
 * Atualiza o status de um pedido.
 */
export interface OrderConferenceData {
  /** Quem foi declarado como conferente na tela de conferencia. */
  conferente: string;
  /** Separador utilizado na conferencia. */
  separador: string;
  /** Peso conferido. */
  peso: number | string;
  /** Volumes conferidos. */
  volumes: number | string;
}

export async function updateOrderStatus(
  id: number | string,
  orderStatus: string,
  extraData?: {
    totalVolumes?: number;
    totalWeight?: number;
    conference?: OrderConferenceData;
  }
): Promise<ApiResponse<Order>> {
  return asObject<Order>(
    await apiClient.put(`orders/${id}/status`, {
      orderStatus,
      ...extraData,
    }),
    ["order"],
    "status do pedido"
  );
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
