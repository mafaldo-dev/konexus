/**
 * Normalização dos contratos de resposta do backend.
 *
 * O backend histórico do Konexus usa mais de um envelope (`products`,
 * `orders`, `suppliers`, `data`, `entity`, ...). Os serviços não devem
 * assumir que o corpo é diretamente um array/objeto: isso transformava um
 * contrato diferente em `.map is not a function` e acionava o Error Boundary.
 *
 * Regra importante: uma resposta HTTP 2xx com formato inesperado NÃO vira
 * lista vazia. Ela vira erro de contrato (`ok: false`), para a tela mostrar
 * uma falha de comunicação em vez de esconder um defeito do backend.
 */

import { ApiResponse } from "./client";

function contractError<T>(
  response: ApiResponse<any>,
  label: string
): ApiResponse<T> {
  return {
    data: null,
    error:
      `Resposta inesperada do servidor ao carregar ${label}. ` +
      "O formato retornado não corresponde ao contrato esperado.",
    status: 502,
    ok: false,
    code: "INVALID_API_CONTRACT",
  };
}

/**
 * Extrai uma lista de uma resposta. Aceita um array direto ou um envelope
 * com uma das chaves informadas. Chaves devem ser explícitas: não usamos
 * `Object.values` para não escolher um array interno por acidente.
 */
export function asList<T>(
  response: ApiResponse<any>,
  keys: string[],
  label: string
): ApiResponse<T[]> {
  if (!response.ok) {
    return { ...response, data: null };
  }

  const body = response.data;
  if (Array.isArray(body)) {
    return { ...response, data: body as T[] };
  }

  if (body && typeof body === "object" && !Array.isArray(body)) {
    for (const key of keys) {
      if (Array.isArray((body as Record<string, unknown>)[key])) {
        return {
          ...response,
          data: (body as Record<string, unknown>)[key] as T[],
        };
      }
    }
  }

  return contractError<T[]>(response, label);
}

/**
 * Extrai um objeto de uma resposta. Com `allowDirect`, aceita o próprio
 * corpo quando ele já é a entidade (usado por endpoints legados que
 * devolvem o pedido diretamente).
 */
export function asObject<T>(
  response: ApiResponse<any>,
  keys: string[],
  label: string,
  options: { allowDirect?: boolean } = {}
): ApiResponse<T> {
  if (!response.ok) {
    return { ...response, data: null };
  }

  const body = response.data;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return contractError<T>(response, label);
  }

  for (const key of keys) {
    const value = (body as Record<string, unknown>)[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return { ...response, data: value as T };
    }
  }

  if (options.allowDirect) {
    return { ...response, data: body as T };
  }

  return contractError<T>(response, label);
}

/**
 * Mantém a resposta de erro original e aplica um seletor somente quando a
 * requisição foi bem-sucedida. Se o seletor devolver `undefined` ou `null`,
 * o resultado é erro de contrato (nunca sucesso silencioso).
 */
export function pickData<T>(
  response: ApiResponse<any>,
  pick: (body: any) => T | null | undefined,
  label: string
): ApiResponse<T> {
  if (!response.ok) {
    return { ...response, data: null };
  }
  try {
    const value = pick(response.data);
    if (value === undefined || value === null) {
      return contractError<T>(response, label);
    }
    return { ...response, data: value };
  } catch {
    return contractError<T>(response, label);
  }
}
