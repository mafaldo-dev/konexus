/**
 * services/supplierService.ts
 * Serviço de fornecedores (domínio: gestão/compras).
 * Endpoints reais do backend:
 *   POST /suppliers/create
 *   GET  /suppliers/all
 *   GET  /suppliers/:id
 *   PUT  /suppliers/:id
 *   DELETE /suppliers/:id
 *
 * O backend NAO expõe /suppliers/code/:code nem /suppliers/search.
 * Chamadas antigas para essas rotas foram removidas daqui.
 */

import { apiClient, ApiResponse } from "../api/client";

export interface Supplier {
  id: number;
  name: string;
  code: string;
  trading_name?: string;
  email: string;
  phone: string;
  national_register_code: string;
  active: boolean | string;
  companyId?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface SupplierFilters {
  page?: number;
  limit?: number;
}

/**
 * Lista fornecedores da empresa autenticada (com paginação).
 */
export async function listSuppliers(
  filters: SupplierFilters = {}
): Promise<
  ApiResponse<{
    data: Supplier[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>
> {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", String(filters.page));
  if (filters.limit) params.append("limit", String(filters.limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient.get(`suppliers/all${query}`);
}

/**
 * Busca fornecedor pelo ID (restrito à empresa).
 */
export async function getSupplierById(
  id: number | string
): Promise<ApiResponse<Supplier>> {
  return apiClient.get<Supplier>(`suppliers/${id}`);
}

/**
 * Cria um fornecedor.
 */
export async function createSupplier(
  data: Omit<Supplier, "id" | "createdAt">
): Promise<ApiResponse<Supplier>> {
  return apiClient.post<Supplier>("suppliers/create", data);
}

/**
 * Atualiza um fornecedor (campos parciais).
 */
export async function updateSupplier(
  id: number | string,
  data: Partial<Supplier>
): Promise<ApiResponse<Supplier>> {
  return apiClient.put<Supplier>(`suppliers/${id}`, data);
}

/**
 * Exclui um fornecedor (restrito à empresa).
 */
export async function deleteSupplier(
  id: number | string
): Promise<ApiResponse<{ result: number }>> {
  return apiClient.delete(`suppliers/${id}`);
}
