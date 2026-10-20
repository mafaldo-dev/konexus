/**
 * api/reauth.ts
 * Registro do manipulador de reautenticao usado pelo cliente HTTP.
 *
 * O fluxo e sempre comandado pelo backend: quando uma rota protegida responde
 * 403 com `REAUTH_REQUIRED`, o cliente pede a confirmacao de senha ao
 * usuario, obtem uma concessao de uso unico e repete a mesma requisicao.
 *
 * O frontend NUNCA decide sozinho que a identidade foi confirmada: quem
 * valida a senha e o backend, e a concessao e consumida no servidor.
 */

export interface ReauthIntent {
  moduleKey: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  description?: string;
}

export type ReauthHandler = (
  intent: ReauthIntent,
  payload: unknown
) => Promise<string | null>;

let handler: ReauthHandler | null = null;

export function setReauthHandler(next: ReauthHandler | null): void {
  handler = next;
}

export function getReauthHandler(): ReauthHandler | null {
  return handler;
}
