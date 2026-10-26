/**
 * services/plugnotasService.ts
 * Serviço de configuracao PlugNotas (dominio: configuracoes).
 * Endpoints reais do backend:
 *   GET  /plugnotas/config
 *   POST /plugnotas/config
 *   POST /plugnotas/config/test
 *   PATCH /plugnotas/config/toggle
 *   DELETE /plugnotas/config
 *
 * Todas as operacoes usam o companyId do contexto autenticado (token),
 * nunca um companyId enviado pelo cliente como autorizacao.
 */

import { apiClient, ApiResponse } from "../api/client";

export interface PlugNotasConfig {
  config_id?: number;
  company_id: number;
  api_key: string;
  ambiente: string;
  producao: boolean;
  ativo: boolean;
  certificado_pfx?: string | null;
  senha_certificado?: string | null;
  validade_certificado?: string | null;
  usuario_prefeitura?: string | null;
  senha_prefeitura?: string | null;
  regime_tributario?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlugNotasConfigData {
  api_key: string;
  ambiente?: string;
  producao?: boolean;
  ativo?: boolean;
  certificado_pfx?: string | null;
  senha_certificado?: string | null;
  validade_certificado?: string | null;
  usuario_prefeitura?: string | null;
  senha_prefeitura?: string | null;
  regime_tributario?: string;
}

export interface PlugNotasConfigView {
  success: boolean;
  configured: boolean;
  data?: PlugNotasConfig;
  company?: {
    id: number;
    razao_social: string;
    cnpj: string;
    email?: string;
    telefone?: string;
  };
  message?: string;
}

/**
 * Busca configuracao PlugNotas da empresa autenticada.
 */
export async function getPlugNotasConfig(): Promise<ApiResponse<PlugNotasConfigView>> {
  return apiClient.get<PlugNotasConfigView>("plugnotas/config");
}

/**
 * Salva (cria ou atualiza) configuracao PlugNotas da empresa autenticada.
 */
export async function savePlugNotasConfig(
  data: PlugNotasConfigData
): Promise<ApiResponse<PlugNotasConfigView>> {
  return apiClient.post<PlugNotasConfigView>("plugnotas/config", data);
}

/**
 * Testa a conexao com a PlugNotas.
 */
export async function testPlugNotasConnection(
  data: { api_key?: string; ambiente?: string }
): Promise<ApiResponse<any>> {
  return apiClient.post("plugnotas/config/test", data);
}

/**
 * Ativa/desativa a PlugNotas da empresa autenticada.
 */
export async function togglePlugNotas(
  ativo: boolean
): Promise<ApiResponse<{ ativo: boolean }>> {
  return apiClient.patch<{ ativo: boolean }>("plugnotas/config/toggle", {
    ativo,
  });
}

/**
 * Remove a configuracao PlugNotas da empresa autenticada.
 */
export async function deletePlugNotasConfig(): Promise<
  ApiResponse<{ message: string }>
> {
  return apiClient.delete("plugnotas/config");
}
