/**
 * api/config.ts
 * Configuração centralizada do cliente HTTP do frontend.
 *
 * A URL da API deve ser definida por variável de ambiente para evitar
 * endereços hardcoded no código (problema identificado na auditoria).
 *
 * Variável: REACT_APP_API_URL
 * Valor padrão: http://localhost:3010 (desenvolvimento local)
 */

export const API_CONFIG = {
  // CRA expõe apenas variáveis começando com REACT_APP_
  BASE_URL: (process.env.REACT_APP_API_URL || "http://localhost:3010").replace(/\/+$/, ""),
  TIMEOUT_MS: 30000,
} as const;

/**
 * Cabeçalhos padrão de toda requisição.
 * O token e o companyId são injetados pelo cliente no momento da chamada.
 */
export interface ApiRequestHeaders {
  "Content-Type"?: string;
  Authorization?: string;
  "X-Company-Id"?: string;
}
