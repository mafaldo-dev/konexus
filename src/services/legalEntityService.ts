/**
 * Serviço de empresas jurídicas (CNPJs) da organização contratante.
 *
 * O backend é a autoridade: a lista abaixo apenas alimenta o seletor e a tela
 * de configuração. Nenhum id enviado pelo cliente é aceito sem revalidação de
 * organização, vínculo do usuário e status da empresa jurídica.
 */
import { apiClient, apiRequestBlob, ApiResponse } from "../api/client";

export type LegalEntityStatus = "active" | "inactive" | "regularization";

export interface LegalEntity {
  id: number;
  companyId: number;
  legalName: string;
  tradeName?: string | null;
  cnpj?: string | null;
  cnpjFormatted?: string;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  taxRegime?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  cityCode?: string | null;
  state?: string | null;
  zip?: string | null;
  email?: string | null;
  phone?: string | null;
  status: LegalEntityStatus;
  isPrimary: boolean;
  parentLegalEntityId?: number | null;
  hasLogo: boolean;
  logoWidth?: number | null;
  logoHeight?: number | null;
  logoBytes?: number | null;
  logoUpdatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  canOperate?: boolean;
}

export interface LegalEntityCapacity {
  multiCnpjEnabled: boolean;
  contractStatus: string;
  limit: number;
  active: number;
  total: number;
  available: number;
  canAdd: boolean;
  maxCommercialLimit: number;
  requiresSupport: boolean;
}

export interface LegalEntityRequest {
  id: number;
  status: string;
  notes?: string | null;
  support_notes?: string | null;
  created_at?: string;
  updated_at?: string;
  requested_by_username?: string | null;
}

export interface LegalEntityListResponse {
  capacity: LegalEntityCapacity;
  entities: LegalEntity[];
  requests: LegalEntityRequest[];
}

export interface LegalEntityMineResponse {
  entities: LegalEntity[];
  defaultLegalEntityId: number | null;
}

export interface LegalEntityInput {
  legalName: string;
  tradeName?: string | null;
  cnpj?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  taxRegime?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  cityCode?: string | null;
  state?: string | null;
  zip?: string | null;
  email?: string | null;
  phone?: string | null;
}

const base = "legal-entities";

export const getMyLegalEntities = (): Promise<ApiResponse<LegalEntityMineResponse>> =>
  apiClient.get<LegalEntityMineResponse>(`${base}/mine`);

export const listLegalEntities = (): Promise<ApiResponse<LegalEntityListResponse>> =>
  apiClient.get<LegalEntityListResponse>(base);

export const getLegalEntity = (id: number): Promise<ApiResponse<{ entity: LegalEntity }>> =>
  apiClient.get<{ entity: LegalEntity }>(`${base}/${id}`);

export const createLegalEntity = (
  input: LegalEntityInput
): Promise<ApiResponse<{ entity: LegalEntity; capacity: LegalEntityCapacity }>> =>
  apiClient.post(`${base}`, input);

export const updateLegalEntity = (
  id: number,
  input: Partial<LegalEntityInput>
): Promise<ApiResponse<{ entity: LegalEntity }>> =>
  apiClient.patch(`${base}/${id}`, input);

export const setLegalEntityStatus = (
  id: number,
  status: LegalEntityStatus
): Promise<ApiResponse<{ entity: LegalEntity }>> =>
  apiClient.post(`${base}/${id}/status`, { status });

export const requestLegalEntityCapacity = (
  notes: string
): Promise<ApiResponse<{ request: LegalEntityRequest }>> =>
  apiClient.post(`${base}/requests`, { notes });

export const uploadLegalEntityLogo = (
  id: number,
  file: File
): Promise<ApiResponse<{ logo: any }>> => {
  const form = new FormData();
  form.append("logo", file);
  return apiClient.post(`${base}/${id}/logo`, form);
};

export const removeLegalEntityLogo = (id: number): Promise<ApiResponse<any>> =>
  apiClient.delete(`${base}/${id}/logo`);

const logoCache = new Map<number, { url: string; updatedAt?: string | null }>();

/** Baixa o logo por endpoint autenticado e devolve um object URL. */
export async function loadLegalEntityLogo(
  entity: Pick<LegalEntity, "id" | "logoUpdatedAt" | "hasLogo">
): Promise<string | null> {
  if (!entity.hasLogo) return null;
  const cached = logoCache.get(entity.id);
  if (cached && cached.updatedAt === entity.logoUpdatedAt) return cached.url;
  const response = await apiRequestBlob(`${base}/${entity.id}/logo`);
  if (!response.ok || !response.data) return null;
  const url = URL.createObjectURL(response.data);
  if (cached) URL.revokeObjectURL(cached.url);
  logoCache.set(entity.id, { url, updatedAt: entity.logoUpdatedAt });
  cacheLogoUrlForDocument(entity.id, url);
  return url;
}

/**
 * Cache de conveniência para documentos que recebem apenas o id da empresa.
 * O documento sempre usa o emissor gravado no registro; este cache só evita
 * uma nova requisição quando o mesmo logo já foi carregado.
 */
const documentLogoCache = new Map<number, string>();
export function cacheLogoUrlForDocument(id: number, url: string) {
  documentLogoCache.set(Number(id), url);
}
export function getCachedLogoUrl(id?: number | null): string | null {
  if (!id) return null;
  return documentLogoCache.get(Number(id)) ?? null;
}

export const LEGAL_ENTITY_STATUS_LABEL: Record<string, string> = {
  active: "Ativa",
  inactive: "Inativa",
  regularization: "Em regularização",
};

export const TAX_REGIME_LABEL: Record<string, string> = {
  "1": "Simples Nacional",
  "2": "Simples Nacional – excesso de sublimite",
  "3": "Regime Normal",
  "4": "MEI",
};
