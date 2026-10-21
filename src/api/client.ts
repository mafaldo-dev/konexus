/**
 * api/client.ts
 * Cliente HTTP centralizado do Konexus ERP.
 *
 * Substitui chamadas diretas de `fetch` espalhadas por páginas e serviços.
 * Toda comunicação com o backend passa por aqui, garantindo:
 *  - URL base única (variável de ambiente)
 *  - Cabeçalho Authorization (Bearer token) automático
 *  - Cabeçalho X-Company-Id (contexto da empresa) quando disponível
 *  - Tratamento unificado de erros HTTP (401, 403, 404, 500)
 *  - Resposta padronizada: ApiResponse<T> = { data, error, status, ok }
 *  - Suporte a JSON, blob (downloads) e FormData (uploads)
 */

import { API_CONFIG } from "./config";
import { getReauthHandler } from "./reauth";

const STATION_TOKEN_KEY = "konexus.stationToken";

/**
 * Códigos que indicam que cargo, permissões, módulos ou CNPJs podem ter
 * mudado. A sessão é recarregada para atualizar menus, rotas e o seletor.
 */
const ACCESS_CHANGED_CODES = new Set([
  "PERMISSION_DENIED",
  "MODULE_NOT_AVAILABLE",
  "MODULE_NOT_CONTRACTED",
  "NO_MODULES",
  "ROLE_INACTIVE",
  "COMPANY_ADMIN_REQUIRED",
  "LEGAL_ENTITY_FORBIDDEN",
  "LEGAL_ENTITY_INACTIVE",
  "LEGAL_ENTITY_REQUIRED",
  "LEGAL_ENTITY_EXPLICIT_REQUIRED",
  "LEGAL_ENTITY_REGULARIZATION",
]);

function notifyAccessChanged(code: string | null | undefined, endpoint: string) {
  if (!code || typeof window === "undefined") return;
  if (endpoint.replace(/^\/+/, "").startsWith("login/session")) return;
  if (ACCESS_CHANGED_CODES.has(code)) {
    window.dispatchEvent(new Event("konexus:access-changed"));
  }
}

export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
  /** Codigo de erro padronizado devolvido pelo backend (ex.: REAUTH_REQUIRED). */
  code?: string | null;
}

interface ClientOptions {
  token?: string;
  companyId?: number | string;
  /** Empresa jurídica operacional (CNPJ) da requisição. */
  legalEntityId?: number | string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /**
   * Quando false, a requisicao nao dispara o fluxo de reautenticacao.
   * Usado pelas proprias chamadas de confirmacao de identidade.
   */
  reauth?: boolean;
  /** Uso interno: impede laco infinito de reautenticacao. */
  __reauthAttempted?: boolean;
  asBlob?: boolean;
}

/**
 * Normaliza o corpo da requisição: JSON para a maioria dos casos,
 * FormData quando o body já for uma instância de FormData (uploads).
 */
function normalizeBody(method: string, body: any): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  if (method === "GET") return undefined;

  if (body instanceof FormData) {
    return body;
  }

  return JSON.stringify(body);
}

function normalizeHeaders(
  method: string,
  body: any,
  extraHeaders: Record<string, string> = {}
): HeadersInit {
  const headers: Record<string, string> = { ...extraHeaders };

  // FormData: não define Content-Type (o navegador define com boundary)
  if (body instanceof FormData) {
    delete headers["Content-Type"];
    return headers;
  }

  if (method !== "GET" && body) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  return headers;
}

/**
 * Lê o corpo da resposta de acordo com o tipo esperado.
 */
async function readBody(response: Response, asBlob: boolean): Promise<any> {
  if (asBlob) return await response.blob();
  const text = await response.text();
  if (!text || text.trim() === "") return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Requisição genérica padronizada.
 */
export async function apiRequest<T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: any,
  options: ClientOptions = {}
): Promise<ApiResponse<T>> {
  const { token, companyId, legalEntityId, signal, headers: extraHeaders = {} } = options;

  const url = `${API_CONFIG.BASE_URL}/${endpoint.replace(/^\/+/, "")}`;

  const headers: Record<string, string> = { ...extraHeaders };

  // Autenticação: token do parâmetro ou do localStorage
  let authToken: string | null = token ?? null;
  if (!authToken && typeof localStorage !== "undefined") {
    authToken = localStorage.getItem("token");
  }
  const cleanToken = authToken
    ? String(authToken).replace(/^["']|["']$/g, "").trim()
    : "";
  if (cleanToken) {
    headers["Authorization"] = `Bearer ${cleanToken}`;
  }

  // Contexto empresarial (enviado quando disponível; o backend autoriza via JWT)
  if (companyId != null) {
    headers["X-Company-Id"] = String(companyId);
  } else if (typeof localStorage !== "undefined") {
    const storedCompany = localStorage.getItem("companyData");
    if (storedCompany) {
      try {
        const parsed = JSON.parse(storedCompany);
        if (parsed?.id) {
          headers["X-Company-Id"] = String(parsed.id);
        }
      } catch {
        // ignora empresa malformada no storage
      }
    }
  }

  // Empresa juridica operacional. O backend revalida o vinculo em cada
  // requisicao; o localStorage e apenas preferencia de interface.
  if (legalEntityId != null) {
    headers["X-Legal-Entity-Id"] = String(legalEntityId);
  } else if (typeof localStorage !== "undefined") {
    const storedEntity = localStorage.getItem("activeLegalEntity");
    if (storedEntity) {
      try {
        const parsed = JSON.parse(storedEntity);
        if (parsed?.id) headers["X-Legal-Entity-Id"] = String(parsed.id);
      } catch {
        // ignora seleção malformada no storage
      }
    }
  }

  // Estacao de trabalho da sessao (rotulo do ambiente, nunca prova de identidade).
  if (typeof localStorage !== "undefined" && !window.ipcRenderer && !headers["X-Station-Token"]) {
    const stationToken = localStorage.getItem(STATION_TOKEN_KEY);
    if (stationToken) {
      headers["X-Station-Token"] = stationToken;
    }
  }

  const requestBody = normalizeBody(method, body);
  const requestHeaders = normalizeHeaders(method, requestBody, headers);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal: signal || controller.signal,
    });

    clearTimeout(timeoutId);

    const responseBody = await readBody(response, Boolean(options.asBlob && response.ok));

    // 401: sessão inválida/expirada
    if (response.status === 401) {
      if (!endpoint.replace(/^\/+/, '').startsWith('login/auth') &&
          endpoint.replace(/^\/+/, '') !== 'audit/reauth' && cleanToken &&
          typeof localStorage !== "undefined" && localStorage.getItem('token') === cleanToken) {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        localStorage.removeItem("companyData");
        localStorage.removeItem("companyModules");
        localStorage.removeItem("legalEntities");
        localStorage.removeItem("activeLegalEntity");
        window.dispatchEvent(new Event('konexus:session-invalid'));
      }
      return {
        data: null,
        error: "Sessão expirada ou inválida. Faça login novamente.",
        status: 401,
        ok: false,
      };
    }

    // 403: autorização / empresa não permitida
    if (response.status === 403) {
      // O backend pediu confirmacao de identidade: pedimos a senha, obtemos
      // a concessao e repetimos a mesma requisicao uma unica vez.
      const needsReauth =
        responseBody?.code === "REAUTH_REQUIRED" &&
        options.reauth !== false &&
        !options.__reauthAttempted;

      if (needsReauth) {
        const handler = getReauthHandler();
        if (handler) {
            const correlationId = responseBody.reauth?.correlationId || response.headers?.get?.('X-Correlation-Id');
            const grantId = await handler({ ...responseBody.reauth, correlationId }, body, cleanToken);
          if (grantId) {
            return apiRequest<T>(endpoint, method, body, {
              ...options,
              __reauthAttempted: true,
               headers: { ...extraHeaders, "X-Reauth-Grant": grantId,
                 ...(correlationId ? { 'X-Correlation-Id': correlationId } : {}) },
            });
          }
        }
      }

      const code = responseBody?.code || null;
      notifyAccessChanged(code, endpoint);
      return {
        data: null,
        error:
          responseBody?.message ||
          responseBody?.error ||
          "Você não possui acesso a este recurso.",
        status: 403,
        code,
        ok: false,
      };
    }

    // 404: recurso não encontrado
    if (response.status === 404) {
      return {
        data: null,
        error:
          responseBody?.message ||
          responseBody?.error ||
          "Recurso não encontrado.",
        status: 404,
        ok: false,
      };
    }

    // Erros de servidor ou requisição mal formada
    if (!response.ok) {
      const code = responseBody?.code || null;
      notifyAccessChanged(code, endpoint);
      return {
        data: null,
        error:
          responseBody?.message ||
          responseBody?.error ||
          `Erro HTTP ${response.status}`,
        status: response.status,
        code,
        ok: false,
      };
    }

    return {
      data: responseBody,
      error: null,
      status: response.status,
      ok: true,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      return {
        data: null,
        error: "A requisição excedeu o tempo limite.",
        status: 408,
        ok: false,
      };
    }

    // Falha de rede
    return {
      data: null,
      error:
        err?.message ||
        "Falha de comunicação com o servidor. Verifique sua conexão.",
        status: 0,
        ok: false,
      };
  }
}

/**
 * Requisição que retorna blob (PDF, Excel, imagem).
 */
export async function apiRequestBlob(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: any,
  options: ClientOptions = {}
): Promise<ApiResponse<Blob>> {
  return apiRequest<Blob>(endpoint, method, body, {
    ...options,
    asBlob: true,
  }) as Promise<ApiResponse<Blob>>;
}

/**
 * Atalhos por método HTTP.
 */
export const apiClient = {
  get: <T = any>(
    endpoint: string,
    options: ClientOptions = {}
  ): Promise<ApiResponse<T>> =>
    apiRequest<T>(endpoint, "GET", undefined, options),

  post: <T = any>(
    endpoint: string,
    body?: any,
    options: ClientOptions = {}
  ): Promise<ApiResponse<T>> =>
    apiRequest<T>(endpoint, "POST", body, options),

  put: <T = any>(
    endpoint: string,
    body?: any,
    options: ClientOptions = {}
  ): Promise<ApiResponse<T>> =>
    apiRequest<T>(endpoint, "PUT", body, options),

  patch: <T = any>(
    endpoint: string,
    body?: any,
    options: ClientOptions = {}
  ): Promise<ApiResponse<T>> =>
    apiRequest<T>(endpoint, "PATCH", body, options),

  delete: <T = any>(
    endpoint: string,
    body?: any,
    options: ClientOptions = {}
  ): Promise<ApiResponse<T>> =>
    apiRequest<T>(endpoint, "DELETE", body, options),
};

export default apiClient;
