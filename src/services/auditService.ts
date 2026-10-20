import { apiRequest, ApiResponse } from "../api/client";

export type AuditOutcome = "success" | "denied" | "failed" | "cancelled" | "pending";

export type ReauthOutcome =
  | "not_required"
  | "not_attempted"
  | "valid"
  | "invalid"
  | "expired"
  | "reused"
  | "cancelled";

export interface AuditEvent {
  id: number;
  company_id: number | null;
  user_id: number | null;
  username: string | null;
  session_id: string | null;
  station_id: number | null;
  station_name: string | null;
  module_key: string | null;
  entity_type: string | null;
  entity_id: string | null;
  action: string;
  outcome: AuditOutcome;
  reauth_outcome: ReauthOutcome | null;
  reason: string | null;
  correlation_id: string | null;
  metadata: Record<string, unknown> | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditEventFilters {
  from?: string;
  to?: string;
  userId?: string;
  stationId?: string;
  moduleKey?: string;
  action?: string;
  outcome?: string;
  reauthOutcome?: string;
  entityType?: string;
  entityId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuditEventPage {
  data: AuditEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WorkStation {
  id: number;
  company_id: number;
  name: string;
  sector: string | null;
  technical_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const STATION_TOKEN_KEY = "konexus.stationToken";

function buildQuery(filters: AuditEventFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

/**
 * Historico de acoes da empresa (acesso restrito a quem tem a permissao
 * `audit:view`; o backend tambem filtra pela empresa do token).
 */
export async function listAuditEvents(
  filters: AuditEventFilters = {}
): Promise<ApiResponse<AuditEventPage>> {
  const response = await apiRequest<AuditEventPage>(
    `audit/events${buildQuery(filters)}`
  );
  return {
    ...response,
    data: response.data
      ? {
          data: response.data.data || [],
          total: response.data.total || 0,
          page: response.data.page || 1,
          limit: response.data.limit || 50,
          totalPages: response.data.totalPages || 0,
        }
      : null,
  };
}

export async function getAuditEvent(id: number): Promise<ApiResponse<AuditEvent>> {
  return apiRequest<AuditEvent>(`audit/events/${id}`);
}

/**
 * Estacoes de trabalho cadastradas pela empresa.
 */
export async function listWorkStations(): Promise<ApiResponse<WorkStation[]>> {
  const response = await apiRequest<WorkStation[]>("audit/stations");
  return { ...response, data: response.data || [] };
}

export async function createWorkStation(input: {
  name: string;
  sector?: string;
  technicalId?: string;
}): Promise<ApiResponse<WorkStation>> {
  return apiRequest<WorkStation>("audit/stations", "POST", input);
}

export async function updateWorkStation(
  id: number,
  input: Partial<Pick<WorkStation, "name" | "sector" | "technical_id" | "active">>
): Promise<ApiResponse<WorkStation>> {
  return apiRequest<WorkStation>(`audit/stations/${id}`, "PATCH", input);
}

export async function createStationPairingCode(
  id: number,
  label?: string
): Promise<ApiResponse<{ station: WorkStation; code: string }>> {
  return apiRequest<{ station: WorkStation; code: string }>(
    `audit/stations/${id}/pairing`,
    "POST",
    { label }
  );
}

export async function revokeStationTokens(
  id: number
): Promise<ApiResponse<WorkStation>> {
  return apiRequest<WorkStation>(`audit/stations/${id}/tokens`, "DELETE");
}

/**
 * Guarda o codigo de pareamento da estacao neste computador.
 *
 * O codigo identifica o AMBIENTE de trabalho; nao e prova de identidade.
 */
export function saveStationToken(code: string): void {
  try {
    localStorage.setItem(STATION_TOKEN_KEY, code.trim());
  } catch {
    // storage indisponivel: a sessao funciona sem identificacao de estacao
  }
}

export function getStationToken(): string | null {
  try {
    return localStorage.getItem(STATION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearStationToken(): void {
  try {
    localStorage.removeItem(STATION_TOKEN_KEY);
  } catch {
    // ignora
  }
}
