import { apiRequest } from "../api/client";
import { ReauthIntent } from "../api/reauth";

export interface ReauthGrant {
  grantId: string;
  expiresAt: string;
  moduleKey: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
}

export interface ReauthGrantResponse {
  success: boolean;
  grant?: ReauthGrant;
  error?: string;
  status: number;
}

/**
 * Solicita ao backend a confirmacao de identidade para uma operacao.
 *
 * O backend valida a senha da conta autenticada e devolve uma concessao de
 * uso unico, vinculada a operacao exata. A senha nunca e armazenada nem
 * registrada.
 */
export async function requestReauthGrant(input: {
  password: string;
  intent: ReauthIntent;
  payload?: unknown;
}): Promise<ReauthGrantResponse> {
  const response = await apiRequest<{
    grantId: string;
    expiresAt: string;
    moduleKey: string;
    action: string;
    entityType?: string | null;
    entityId?: string | null;
  }>("audit/reauth", "POST", {
    password: input.password,
    intent: input.intent,
    payload: input.payload ?? null,
  }, { reauth: false });

  if (!response.ok || !response.data) {
    return {
      success: false,
      error: response.error || "Não foi possível confirmar sua identidade.",
      status: response.status,
    };
  }

  return {
    success: true,
    status: response.status,
    grant: {
      grantId: response.data.grantId,
      expiresAt: response.data.expiresAt,
      moduleKey: response.data.moduleKey,
      action: response.data.action,
      entityType: response.data.entityType,
      entityId: response.data.entityId,
    },
  };
}
