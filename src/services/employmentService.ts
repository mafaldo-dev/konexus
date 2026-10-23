/**
 * Vínculos empregatícios do RH.
 *
 * O diretório de RH usa `/employment/contributors`, protegido pelo módulo
 * `rh` e pela permissão `rh:view`. Não usa `/employees/all`, que exige
 * administrador da empresa e serve à gestão de contas de acesso.
 */

import { apiClient, ApiResponse } from "../api/client";
import { asList, asObject } from "../api/payload";

export interface EmploymentContributor {
  id: number;
  username: string;
  role?: string | null;
  active: boolean;
  status?: string | null;
  sector?: string | null;
  employment_link_id?: number | null;
  legal_entity_id?: number | null;
  position_title?: string | null;
  department?: string | null;
  cost_center?: string | null;
  started_at?: string | null;
  employer_legal_name?: string | null;
  employer_trade_name?: string | null;
  employer_cnpj?: string | null;
}

export interface EmploymentLink {
  id: number;
  company_id: number;
  contributor_id: number;
  legal_entity_id: number;
  position_title?: string | null;
  department?: string | null;
  cost_center?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  status: "active" | "ended" | string;
  notes?: string | null;
  username?: string;
  contributor_role?: string;
  legal_name?: string;
  trade_name?: string | null;
  cnpj?: string;
  legal_entity_status?: string;
  is_primary?: boolean;
}

export async function listEmploymentContributors(): Promise<
  ApiResponse<EmploymentContributor[]>
> {
  return asList<EmploymentContributor>(
    await apiClient.get("employment/contributors"),
    ["data", "contributors"],
    "colaboradores"
  );
}

export async function listEmploymentLinks(filters: {
  contributorId?: number | string;
  status?: string;
} = {}): Promise<ApiResponse<EmploymentLink[]>> {
  const params = new URLSearchParams();
  if (filters.contributorId) {
    params.append("contributorId", String(filters.contributorId));
  }
  if (filters.status) params.append("status", filters.status);
  const query = params.toString() ? `?${params.toString()}` : "";
  return asList<EmploymentLink>(
    await apiClient.get(`employment/links${query}`),
    ["data", "links"],
    "vínculos empregatícios"
  );
}

export async function createEmploymentLink(payload: {
  contributorId: number | string;
  legalEntityId: number | string;
  positionTitle?: string;
  department?: string;
  costCenter?: string;
  startedAt: string;
  notes?: string;
}): Promise<ApiResponse<EmploymentLink>> {
  return asObject<EmploymentLink>(
    await apiClient.post("employment/links", payload),
    ["data", "link"],
    "vínculo empregatício criado"
  );
}

export async function updateEmploymentLink(
  id: number | string,
  payload: {
    positionTitle?: string;
    department?: string;
    costCenter?: string;
    notes?: string;
  }
): Promise<ApiResponse<EmploymentLink>> {
  return asObject<EmploymentLink>(
    await apiClient.patch(`employment/links/${id}`, payload),
    ["data", "link"],
    "vínculo empregatício atualizado"
  );
}

export async function endEmploymentLink(
  id: number | string,
  payload: { endedAt: string; reason?: string }
): Promise<ApiResponse<EmploymentLink>> {
  return asObject<EmploymentLink>(
    await apiClient.post(`employment/links/${id}/end`, payload),
    ["data", "link"],
    "vínculo empregatício encerrado"
  );
}
