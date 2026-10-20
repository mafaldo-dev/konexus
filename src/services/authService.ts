/**
 * services/authService.ts
 * Serviço de autenticação (domínio: auth).
 * Endpoints reais do backend:
 *   POST /login/auth
 *   POST /login/auth-employee
 */

import { apiClient, ApiResponse } from "../api/client";

export interface AdminUser {
  id: string;
  username: string;
  role: string;
  userType: string;
  active?: boolean;
  status?: string;
  sector?: string;
  companyId?: number;
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyIcon?: string | null;
  companyIconUrl?: string | null;
  companyCnpj?: string;
  modules?: string[];
  roleId?: number | null;
  roleName?: string;
  isCompanyAdmin?: boolean;
  mustChangePassword?: boolean;
  permissions?: Array<{ moduleKey: string; actions: string[] }>;
}

export interface AdminLoginResponse {
  token: string;
  user: AdminUser;
}

export interface EmployeeUser {
  id: string;
  username: string;
  role: string;
  companyId: number;
  active: boolean;
  status: string;
  access: string;
  sector: string;
  userType: string;
  companyName?: string;
  companyIcon?: string | null;
  companyIconUrl?: string | null;
  companyEmail?: string;
  companyPhone?: string;
  companyCnpj?: string;
  modules: string[];
  roleId?: number | null;
  roleName?: string;
  isCompanyAdmin?: boolean;
  mustChangePassword?: boolean;
  permissions?: Array<{ moduleKey: string; actions: string[] }>;
}

export interface EmployeeLoginResponse {
  token: string;
  user: EmployeeUser;
}

/**
 * Login de administrador do sistema.
 */
export async function loginAdmin(
  username: string,
  password: string
): Promise<ApiResponse<AdminLoginResponse>> {
  return apiClient.post<AdminLoginResponse>("login/auth", {
    username,
    password,
  });
}

/**
 * Login de colaborador (usuário de empresa).
 */
export async function loginEmployee(
  username: string,
  password: string
): Promise<ApiResponse<EmployeeLoginResponse>> {
  return apiClient.post<EmployeeLoginResponse>("login/auth-employee", {
    username,
    password,
  });
}
