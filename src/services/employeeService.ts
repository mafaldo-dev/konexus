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
import { asList, asObject, pickData } from "../api/payload";

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
  role_name?: string;
  position_title?: string | null;
  department?: string | null;
  cost_center?: string | null;
  employer_legal_name?: string | null;
  employer_trade_name?: string | null;
  employer_cnpj?: string | null;
  employment_started_at?: string | null;
  createdat?: string | null;
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
  return asList<Employee>(
    await apiClient.get(`employees/all${query}`),
    ["data", "employees"],
    "colaboradores"
  );
}

/**
 * Busca colaborador pelo ID (restrito à empresa).
 */
export async function getEmployeeById(
  id: number | string
): Promise<ApiResponse<Employee>> {
  return asObject<Employee>(
    await apiClient.get(`employees/${id}`),
    ["employee", "collaborator"],
    "colaborador"
  );
}

/**
 * Cria um colaborador.
 */
export async function createEmployee(
  data: Omit<Employee, "id">
): Promise<ApiResponse<Employee>> {
  return pickData<Employee>(
    await apiClient.post("employees/create", data),
    (body) => body?.data?.collaborator ?? body?.data,
    "colaborador criado"
  );
}

/**
 * Atualiza um colaborador (campos parciais).
 */
export async function updateEmployee(
  id: number | string,
  data: Partial<Employee>
): Promise<ApiResponse<Employee>> {
  return pickData<Employee>(
    await apiClient.put(`employees/${id}`, data),
    (body) => body?.data?.collaborator ?? body?.data,
    "colaborador atualizado"
  );
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
  return asObject<Employee>(
    await apiClient.put(`employees/${id}/status`, { status }),
    ["employee"],
    "status do colaborador"
  );
}

/**
 * Busca o status de um colaborador.
 */
export async function getEmployeeStatus(
  id: number | string
): Promise<ApiResponse<Employee>> {
  return asObject<Employee>(
    await apiClient.get(`employees/${id}/status`),
    ["employee"],
    "status do colaborador"
  );
}
