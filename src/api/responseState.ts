import { ApiResponse } from "./client";
import type { DataStateVariant } from "../components/ui/DataState";

const COMPANY_CODES = new Set([
  "LEGAL_ENTITY_REQUIRED",
  "LEGAL_ENTITY_EXPLICIT_REQUIRED",
]);

const MODULE_CODES = new Set([
  "MODULE_NOT_AVAILABLE",
  "MODULE_NOT_CONTRACTED",
  "NO_MODULES",
]);

/**
 * Converte a resposta do cliente HTTP no estado visual correto.
 *
 * A mensagem do backend continua sendo exibida; o que muda é o título e o
 * ícone. Assim, acesso negado, módulo não contratado e CNPJ ausente não são
 * apresentados como falha de comunicação.
 */
export function getResponseDataState(
  response: ApiResponse<unknown>
): DataStateVariant {
  if (response.ok) return "empty";

  // O backend usa 400 para ausência de CNPJ, 403 para módulo/permissão e
  // 409 para CNPJ em regularização. O código é mais confiável que o status.
  if (response.code && COMPANY_CODES.has(response.code)) {
    return "company-required";
  }
  if (response.code && MODULE_CODES.has(response.code)) {
    return "module-not-contracted";
  }
  if (response.status === 403) return "forbidden";

  return "error";
}
