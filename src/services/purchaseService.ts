/**
 * services/purchaseService.ts
 * Serviço de pedidos de compra (domínio: compras).
 * Endpoints reais do backend:
 *   POST /purchase/create
 *   GET  /purchase/all
 *   GET  /purchase/:orderNumber
 *   PUT  /purchase/:id
 *   DELETE /purchase/:id
 */

import { apiClient, ApiResponse } from "../api/client";
import { asList, asObject } from "../api/payload";

export interface PurchaseOrderItem {
  productid: string | number;
  quantity: number;
  cost: number;
  productname?: string;
  productcode?: string;
  productlocation?: string;
  productbrand?: string;
}

export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  totalCost: number;
  currency: string;
  notes?: string;
  buyer: string;
  companyId: number;
  supplierId: string | number;
  createdAt?: string | Date;
  supplier?: {
    id: string | number;
    name: string;
    email?: string;
    phone?: string;
    cnpj?: string;
    address?: {
      street: string;
      city: string;
      number: number;
      state: string;
    };
  };
  requestingCompany?: {
    id: string | number;
    name: string;
    logo?: string;
    buyer?: string;
  };
  orderItems: PurchaseOrderItem[];
}

export interface PurchaseFilters {
  page?: number;
  limit?: number;
}

/**
 * Cria um pedido de compra (companyId definido pelo backend).
 */
export async function createPurchaseOrder(
  data: Omit<PurchaseOrder, "id" | "companyId"> & {
    orderItems: PurchaseOrderItem[];
  }
): Promise<ApiResponse<PurchaseOrder>> {
  return asObject<PurchaseOrder>(
    await apiClient.post("purchase/create", data),
    ["order"],
    "pedido de compra criado"
  );
}

/**
 * Lista pedidos de compra da empresa autenticada (com paginação).
 */
export async function listPurchaseOrders(
  filters: PurchaseFilters = {}
): Promise<ApiResponse<PurchaseOrder[]>> {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", String(filters.page));
  if (filters.limit) params.append("limit", String(filters.limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return asList<PurchaseOrder>(
    await apiClient.get(`purchase/all${query}`),
    ["data", "orders", "purchaseOrders"],
    "pedidos de compra"
  );
}

/**
 * Busca pedido de compra pelo número (restrito à empresa).
 */
export async function getPurchaseOrderByNumber(
  orderNumber: string
): Promise<ApiResponse<PurchaseOrder>> {
  return asObject<PurchaseOrder>(
    await apiClient.get(`purchase/${orderNumber}`),
    ["order"],
    "pedido de compra",
    { allowDirect: true }
  );
}

/**
 * Atualiza um pedido de compra (restrito à empresa).
 */
export async function updatePurchaseOrder(
  id: number | string,
  data: { orderStatus?: string; notes?: string }
): Promise<ApiResponse<PurchaseOrder>> {
  return asObject<PurchaseOrder>(
    await apiClient.put(`purchase/${id}`, data),
    ["order"],
    "pedido de compra"
  );
}

/**
 * Exclui um pedido de compra (restrito à empresa).
 */
export async function deletePurchaseOrder(
  id: number | string
): Promise<ApiResponse<{ message: string }>> {
  return apiClient.delete(`purchase/${id}`);
}
