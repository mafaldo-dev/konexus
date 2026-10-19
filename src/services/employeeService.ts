/**
 * services/employeeService.ts
 * Serviço de colaboradores (domínio: RH).
 * Endpoints reais do backend:
 *   POST /employees/create
 *   GET  /employees/all
 *   PUT  /employees/:id
 *   DELETE /employees/:id
 *   PUT  /employees/:id/status
 *   GET  /employees/:id/status
 */

import { apiClient, ApiResponse } from "../api/client";

export interface Employee {
  id: number | string;
  username: string;
  password?: string;
  role: string;
  status?: string | boolean;
  active: boolean;
  access: string;
  sector: string;
  companyId?: number;
}

export interface EmployeeFilters {
  page?: number;
  limit?: number;
}

/**
 * Lista colaboradores da empresa autenticada.
 */
export async function listEmployees(
  filters: EmployeeFilters = {}
): Promise<ApiResponse<Employee[]>> {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", String(filters.page));
  if (filters.limit) params.append("limit", String(filters.limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient.get<Employee[]>(`employees/all${query}`);
}

/**
 * Busca colaborador pelo ID (restrito à empresa).
 */
export async function getEmployeeById(
  id: number | string
): Promise<ApiResponse<Employee>> {
  return apiClient.get<Employee>(`employees/${id}`);
}

/**
 * Cria um colaborador.
 */
export async function createEmployee(
  data: Omit<Employee, "id">
): Promise<ApiResponse<Employee>> {
  return apiClient.post<Employee>("employees/create", data);
}

/**
 * Atualiza um colaborador (campos parciais).
 */
export async function updateEmployee(
  id: number | string,
  data: Partial<Employee>
): Promise<ApiResponse<Employee>> {
  return apiClient.put<Employee>(`employees/${id}`, data);
}

/**
 * Exclui um colaborador (restrito à empresa).
 */
export async function deleteEmployee(
  id: number | string
): Promise<ApiResponse<{ result: number }>> {
  return apiClient.delete(`employees/${id}`);
}

/**
 * Atualiza o status de um colaborador.
 */
export async function updateEmployeeStatus(
  id: number | string,
  status: "Ativo" | "Ausente" | "Inativo"
): Promise<ApiResponse<Employee>> {
  return apiClient.put<Employee>(`employees/${id}/status`, { status });
}

/**
 * Busca o status de um colaborador.
 */
export async function getEmployeeStatus(
  id: number | string
): Promise<ApiResponse<Employee>> {
  return apiClient.get<Employee>(`employees/${id}/status`);
}
