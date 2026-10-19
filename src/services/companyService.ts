/**
 * services/companyService.ts
 * Serviço de empresas (domínio: administração global).
 * Endpoints reais do backend:
 *   POST /admin/create-company
 *   GET  /admin/companie/:companyId
 *   PATCH /admin/companie/:companyId
 *   POST /admin/upload-logo
 *   DELETE /admin/logo/:filename
 */

import { apiClient, ApiResponse } from "../api/client";

export interface CompanyData {
  companyName: string;
  adminUsername: string;
  adminPassword: string;
  installation_id: number;
  icon?: string | null;
}

export interface Company {
  id: number;
  name: string;
  icon?: string | null;
  email?: string | null;
  phone?: string | null;
  cnpj?: string | null;
  createdAt?: string;
  updatedAt?: string;
  installation_id?: number;
}

/**
 * Cria uma empresa e seu administrador (operação global).
 */
export async function createCompany(
  data: CompanyData
): Promise<ApiResponse<{ id: number; name: string }>> {
  return apiClient.post("admin/create-company", data);
}

/**
 * Busca dados de uma empresa pelo ID.
 */
export async function getCompany(
  companyId: number | string
): Promise<ApiResponse<Company>> {
  return apiClient.get<Company>(`admin/companie/${companyId}`);
}

/**
 * Atualiza dados de uma empresa (inclui envio de logo via FormData).
 */
export async function updateCompany(
  companyId: number | string,
  body: Record<string, any>
): Promise<ApiResponse<Company>> {
  return apiClient.patch<Company>(`admin/companie/${companyId}`, body);
}

/**
 * Faz upload de logo de empresa.
 */
export async function uploadCompanyLogo(
  formData: FormData
): Promise<ApiResponse<{ logoUrl: string; filename: string }>> {
  return apiClient.post("admin/upload-logo", formData);
}

/**
 * Remove uma logo de empresa pelo nome do arquivo.
 */
export async function deleteCompanyLogo(
  filename: string
): Promise<ApiResponse<{ message: string }>> {
  return apiClient.delete(`admin/logo/${filename}`);
}
