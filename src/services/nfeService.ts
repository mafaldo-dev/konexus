/**
 * services/nfeService.ts
 * Serviço de NF-e (PlugNotas) (domínio: notas fiscais).
 * Endpoints reais do backend:
 *   POST /nfe/:orderId/emitir
 *   GET  /nfe/all
 *   GET  /nfe/:nfeId/danfe
 *   GET  /nfe/:nfeId/status
 *
 * A configuracao PlugNotas vem do backend (plugnotasMiddleware), que usa o
 * companyId do token autenticado. O frontend nao envia companyId como autorizacao.
 */

import { apiClient, ApiResponse } from "../api/client";

export interface NfeEmitResult {
  success: boolean;
  message?: string;
  data?: {
    nfe_id: string | number;
    chave_acesso?: string;
    numero?: string;
    serie?: string;
    status: string;
    ambiente: string;
    pedido_id: number | string;
    empresa_id: number | string;
  };
}

/**
 * Emite NF-e de um pedido (usa configuracao PlugNotas da empresa autenticada).
 */
export async function emitNfe(
  orderId: number | string
): Promise<ApiResponse<NfeEmitResult>> {
  return apiClient.post<NfeEmitResult>(`nfe/${orderId}/emitir`);
}

/**
 * Lista NF-e (consulta PlugNotas da empresa autenticada).
 */
export async function listNfe(): Promise<ApiResponse<any>> {
  return apiClient.get("nfe/all");
}

/**
 * Consulta status de uma NF-e (via PlugNotas da empresa autenticada).
 */
export async function getNfeStatus(
  nfeId: string
): Promise<ApiResponse<any>> {
  return apiClient.get(`nfe/${nfeId}/status`);
}

/**
 * Faz download do DANFE (PDF) de uma NF-e.
 */
export async function downloadDanfe(
  nfeId: string
): Promise<ApiResponse<Blob>> {
  return apiClient.get(`nfe/${nfeId}/danfe`) as unknown as Promise<
    ApiResponse<Blob>
  >;
}
