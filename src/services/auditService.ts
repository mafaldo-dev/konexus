import { apiRequest, ApiResponse } from "../api/client";
import { asList, asObject, pickData } from "../api/payload";

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
  installation_uuid?: string | null;
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
  const response = await apiRequest<any>(`audit/events${buildQuery(filters)}`);
  return pickData<AuditEventPage>(
    response,
    (body) => {
      const rows = Array.isArray(body)
        ? body
        : Array.isArray(body?.data)
          ? body.data
          : null;
      if (!rows) return undefined;
      const limit = Number(body?.limit) || 50;
      const total = Number(body?.total) || rows.length;
      return {
        data: rows as AuditEvent[],
        total,
        page: Number(body?.page) || 1,
        limit,
        totalPages:
          Number(body?.totalPages) || Math.ceil(total / limit) || 0,
      };
    },
    "histórico de ações"
  );
}

export async function getAuditEvent(id: number): Promise<ApiResponse<AuditEvent>> {
  return asObject<AuditEvent>(
    await apiRequest(`audit/events/${id}`),
    ["event", "data"],
    "evento de auditoria"
  );
}

/**
 * Estacoes de trabalho cadastradas pela empresa.
 */
export async function listWorkStations(): Promise<ApiResponse<WorkStation[]>> {
  const response = asList<WorkStation>(
    await apiRequest("audit/stations"),
    ["data", "stations"],
    "estações de trabalho"
  );
  return {
    ...response,
    data: response.ok
      ? (response.data as WorkStation[]).filter(
          (station) => !station.installation_uuid
        )
      : null,
  };
}

export async function createWorkStation(input: {
  name: string;
  sector?: string;
  technicalId?: string;
}): Promise<ApiResponse<WorkStation>> {
  return asObject<WorkStation>(
    await apiRequest("audit/stations", "POST", input),
    ["data", "station"],
    "estação de trabalho criada"
  );
}

export async function updateWorkStation(
  id: number,
  input: Partial<Pick<WorkStation, "name" | "sector" | "technical_id" | "active">>
): Promise<ApiResponse<WorkStation>> {
  return asObject<WorkStation>(
    await apiRequest(`audit/stations/${id}`, "PATCH", input),
    ["data", "station"],
    "estação de trabalho atualizada"
  );
}

export async function createStationPairingCode(
  id: number,
  label?: string
): Promise<ApiResponse<{ station: WorkStation; code: string }>> {
  return asObject<{ station: WorkStation; code: string }>(
    await apiRequest(`audit/stations/${id}/pairing`, "POST", { label }),
    ["data"],
    "código de pareamento"
  );
}

export async function revokeStationTokens(
  id: number
): Promise<ApiResponse<WorkStation>> {
  return asObject<WorkStation>(
    await apiRequest(`audit/stations/${id}/tokens`, "DELETE"),
    ["data", "station"],
    "tokens da estação"
  );
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
