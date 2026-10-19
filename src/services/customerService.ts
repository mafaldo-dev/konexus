/**
 * services/customerService.ts
 * Serviço de clientes (domínio: gestão/vendas).
 * Endpoints reais do backend:
 *   POST /customers/create
 *   GET  /customers/all
 *   PUT  /customers/:id
 *   DELETE /customers/:id
 */

import { apiClient, ApiResponse } from "../api/client";

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  code: string;
  status?: string;
  cpf_cnpj: string;
  companyId?: number;
  address: {
    id?: number | string;
    street: string;
    city: string;
    zip: string;
    number: number | string;
    state: string;
    city_code: string;
    neighborhood: string;
    type?: 'shipping' | 'billing';
  };
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
}

/**
 * Lista clientes da empresa autenticada (com paginação).
 */
export async function listCustomers(
  filters: CustomerFilters = {}
): Promise<
  ApiResponse<{
    data: Customer[];
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
  return apiClient.get(`customers/all${query}`);
}

/**
 * Busca cliente pelo ID (restrito à empresa).
 */
export async function getCustomerById(
  id: number | string
): Promise<ApiResponse<Customer>> {
  return apiClient.get<Customer>(`customers/${id}`);
}

/**
 * Cria um cliente.
 */
export async function createCustomer(
  data: Omit<Customer, "id" | "createdAt" | "updatedAt">
): Promise<ApiResponse<Customer>> {
  return apiClient.post<Customer>("customers/create", data);
}

/**
 * Atualiza um cliente (campos parciais).
 */
export async function updateCustomer(
  id: number | string,
  data: Partial<Customer>
): Promise<ApiResponse<Customer>> {
  return apiClient.put<Customer>(`customers/${id}`, data);
}

/**
 * Exclui um cliente (restrito à empresa).
 */
export async function deleteCustomer(
  id: number | string
): Promise<ApiResponse<{ result: number }>> {
  return apiClient.delete(`customers/${id}`);
}
