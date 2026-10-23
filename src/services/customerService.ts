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
import { asList, asObject } from "../api/payload";

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
): Promise<ApiResponse<Customer[]>> {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", String(filters.page));
  if (filters.limit) params.append("limit", String(filters.limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return asList<Customer>(
    await apiClient.get(`customers/all${query}`),
    ["data", "customers"],
    "clientes"
  );
}

/**
 * Busca cliente pelo ID (restrito à empresa).
 */
export async function getCustomerById(
  id: number | string
): Promise<ApiResponse<Customer>> {
  return asObject<Customer>(
    await apiClient.get(`customers/${id}`),
    ["data", "customer"],
    "cliente"
  );
}

/**
 * Cria um cliente.
 */
export async function createCustomer(
  data: Omit<Customer, "id" | "createdAt" | "updatedAt">
): Promise<ApiResponse<Customer>> {
  return asObject<Customer>(
    await apiClient.post("customers/create", data),
    ["customer", "data"],
    "cliente criado"
  );
}

/**
 * Atualiza um cliente (campos parciais).
 */
export async function updateCustomer(
  id: number | string,
  data: Partial<Customer>
): Promise<ApiResponse<Customer>> {
  return asObject<Customer>(
    await apiClient.put(`customers/${id}`, data),
    ["data", "customer"],
    "cliente atualizado"
  );
}

/**
 * Exclui um cliente (restrito à empresa).
 */
export async function deleteCustomer(
  id: number | string
): Promise<ApiResponse<{ result: number }>> {
  return apiClient.delete(`customers/${id}`);
}
