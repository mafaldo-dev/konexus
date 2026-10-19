/**
 * services/serviceOrderService.ts
 * Serviço de ordens de serviço (domínio: gestão/serviços).
 * Endpoints reais do backend:
 *   POST /service/create
 *   GET  /service/all
 *   GET  /service/:id/os
 *   PATCH /service/:id/os
 */

import { apiClient, ApiResponse } from "../api/client";

export interface ServiceOrderItem {
  productId?: number;
  productCode?: string;
  quantity: number;
}

export interface ServiceOrder {
  id: number;
  orderNumber: string;
  orderStatus: string;
  orderDate: string;
  notes?: string;
  message?: string;
  userId: number;
  receiver?: number | string;
  stock_movement?: boolean;
  movement_type?: "entrada" | "saida" | "produção";
  companyId: number;
  orderItems?: ServiceOrderItem[];
}

export interface ServiceOrderFilters {
  page?: number;
  limit?: number;
}

/**
 * Cria uma ordem de serviço (companyId definido pelo backend).
 */
export async function createServiceOrder(
  data: Omit<ServiceOrder, "id" | "companyId"> & {
    orderItems: ServiceOrderItem[];
  }
): Promise<
  ApiResponse<{
    message: string;
    order: ServiceOrder;
    stockMovement?: boolean;
    movementType?: string;
  }>
> {
  return apiClient.post("service/create", data);
}

/**
 * Lista ordens de serviço da empresa autenticada (com paginação).
 */
export async function listServiceOrders(
  filters: ServiceOrderFilters = {}
): Promise<ApiResponse<ServiceOrder[]>> {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", String(filters.page));
  if (filters.limit) params.append("limit", String(filters.limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient.get<ServiceOrder[]>(`service/all${query}`);
}

/**
 * Busca uma ordem de serviço pelo ID (restrito à empresa).
 */
export async function getServiceOrderById(
  id: number | string
): Promise<ApiResponse<ServiceOrder>> {
  return apiClient.get<ServiceOrder>(`service/${id}/os`);
}

/**
 * Atualiza o status de uma ordem de serviço.
 */
export async function updateServiceOrderStatus(
  id: number | string,
  orderStatus: string
): Promise<ApiResponse<ServiceOrder>> {
  return apiClient.patch<ServiceOrder>(`service/${id}/os`, {
    orderStatus,
  });
}
