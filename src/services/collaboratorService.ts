/**
 * Serviço de colaboradores, cargos, permissões e regras comerciais.
 *
 * Todo companyId é resolvido pelo backend a partir do token. O frontend nunca
 * envia companyId nestas chamadas.
 */

import { apiClient, ApiResponse } from "../api/client";
import { PermissionGroup } from "../utils/moduleMapping";

export interface Collaborator {
  id: number;
  username: string;
  role: string;
  active: boolean;
  status: boolean;
  access: string;
  sector: string;
  roleid: number | null;
  passwordmustchange: boolean;
  removedat: string | null;
  createdat: string;
  role_name: string | null;
  is_system_admin: boolean;
  overrides_count: number;
  employment_link_id?: number | null;
  legal_entity_id?: number | null;
  position_title?: string | null;
  department?: string | null;
  cost_center?: string | null;
  employment_started_at?: string | null;
  employer_legal_name?: string | null;
  employer_trade_name?: string | null;
  employer_cnpj?: string | null;
}

export interface CompanyRole {
  id: number;
  company_id: number;
  name: string;
  description: string | null;
  active: boolean;
  is_system_admin: boolean;
  created_at: string;
  updated_at: string;
  active_collaborators: number;
  total_collaborators: number;
  permissions: PermissionGroup[];
}

export interface PermissionAction {
  key: string;
  label: string;
}

export interface PermissionCatalogModule {
  key: string;
  name: string;
  description: string | null;
  isPaid: boolean;
  isExtra: boolean;
  extraModuleStatus: string | null;
  available: boolean;
  actions: PermissionAction[];
}

export interface CommercialModule {
  key: string;
  name: string;
  description: string | null;
  isPaid: boolean;
  isExtra: boolean;
  status: string;
  available: boolean;
  startedAt: string | null;
  endedAt: string | null;
  notes: string | null;
}

export interface AccountQuota {
  freeLimit: number;
  activeAccounts: number;
  freeRemaining: number;
  limitReached: boolean;
  extraAuthorizedRemaining: number;
  extraUserPriceCents: number;
  removalPriceCents: number;
}

export interface PasswordResetQuota {
  freeLimit: number;
  used: number;
  remaining: number;
  freeExhausted: boolean;
  extraPriceCents: number;
  nextOperationIsFree: boolean;
}

export interface CommercialAuthorization {
  id: number;
  company_id: number;
  company_name: string;
  authorization_type: "extra_user" | "password_reset" | "extra_module";
  module_key: string | null;
  quantity: number;
  consumed_quantity: number;
  status: "active" | "consumed" | "revoked" | "expired";
  responsible: string;
  notes: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportInfo {
  contact: string | null;
  message: string;
}

export interface CommercialRules {
  timezone: string;
  passwordReset: { freeLimit: number; extraPriceCents: number };
  accounts: {
    freeLimit: number;
    extraUserPriceCents: number;
    removalPriceCents: number;
  };
}

export interface CommercialOverview {
  companyId: number;
  period: { referenceMonth: string; timezone: string };
  modules: CommercialModule[];
  standardModules: CommercialModule[];
  extraModules: CommercialModule[];
  usage: {
    accounts: AccountQuota;
    passwordResets: PasswordResetQuota;
    extraUserPriceCents: number;
    removalPriceCents: number;
  };
  authorizations: CommercialAuthorization[];
  support: SupportInfo;
  rules: CommercialRules;
}

export interface CollaboratorUsage {
  period: { referenceMonth: string; timezone: string };
  accounts: AccountQuota;
  passwordResets: PasswordResetQuota;
  extraModules: Array<{
    id: number;
    company_id: number;
    module_key: string;
    status: string;
    started_at: string | null;
    ended_at: string | null;
    notes: string | null;
  }>;
  support: SupportInfo;
}

export interface ContributorEvent {
  id: number;
  company_id: number;
  contributor_id: number | null;
  contributor_username: string | null;
  actor_id: number | null;
  actor_username: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface PasswordResetEvent {
  id: number;
  company_id: number;
  contributor_id: number;
  contributor_username: string;
  requested_by: number | null;
  requested_by_username: string | null;
  status: string;
  is_free: boolean;
  amount_cents: number;
  reference_month: string;
  authorization_id: number | null;
  reason: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface CollaboratorLegalEntityAccess {
  id: number;
  legalName: string;
  tradeName: string | null;
  cnpj: string | null;
  cnpjFormatted: string | null;
  status: "active" | "inactive" | "regularization";
  isPrimary: boolean;
  granted: boolean;
}

export interface CollaboratorPermissionsDetail {
  collaborator: {
    id: number;
    username: string;
    roleId: number | null;
    roleName: string | null;
    isSystemAdmin: boolean;
    active: boolean;
  };
  rolePermissions: PermissionGroup[];
  overrides: Array<{ moduleKey: string; actionKey: string; allowed: boolean }>;
  effectivePermissions: PermissionGroup[];
  legalEntities: CollaboratorLegalEntityAccess[];
  legalEntityIds: number[];
}

export interface CreateCollaboratorPayload {
  username: string;
  password: string;
  roleId?: number | null;
  sector?: string;
  forcePasswordChange?: boolean;
  permissions?: PermissionGroup[];
  legalEntityIds?: number[];
}

export interface UpdateCollaboratorPayload {
  username?: string;
  roleId?: number;
  sector?: string;
  status?: boolean;
  active?: boolean;
}

export interface CreateRolePayload {
  name: string;
  description?: string | null;
  permissions: PermissionGroup[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string | null;
  active?: boolean;
  permissions?: PermissionGroup[];
  reassignToRoleId?: number | null;
}

function unwrap<T>(
  response: ApiResponse<any>,
  pick: (body: any) => T
): ApiResponse<T> {
  if (!response.ok) {
    return {
      data: null,
      error: response.error,
      status: response.status,
      ok: false,
    };
  }
  return {
    data: pick(response.data),
    error: null,
    status: response.status,
    ok: true,
  };
}

export async function listCollaborators(): Promise<ApiResponse<Collaborator[]>> {
  return unwrap(await apiClient.get("collaborators"), (body) => body?.data || []);
}

export async function getCollaboratorUsage(): Promise<ApiResponse<CollaboratorUsage>> {
  return unwrap(await apiClient.get("collaborators/usage"), (body) => body?.data);
}

export async function getCommercialOverview(): Promise<ApiResponse<CommercialOverview>> {
  return unwrap(await apiClient.get("collaborators/overview"), (body) => body?.data);
}

export async function listCollaboratorAuthorizations(): Promise<
  ApiResponse<CommercialAuthorization[]>
> {
  return unwrap(
    await apiClient.get("collaborators/authorizations"),
    (body) => body?.data || []
  );
}

export async function listContributorEvents(
  limit = 100
): Promise<ApiResponse<ContributorEvent[]>> {
  return unwrap(
    await apiClient.get(`collaborators/events?limit=${limit}`),
    (body) => body?.data || []
  );
}

export async function listPasswordResetEvents(
  limit = 50
): Promise<ApiResponse<PasswordResetEvent[]>> {
  return unwrap(
    await apiClient.get(`collaborators/password-resets?limit=${limit}`),
    (body) => body?.data || []
  );
}

export async function createCollaborator(
  payload: CreateCollaboratorPayload
): Promise<ApiResponse<{ collaborator: Collaborator; accountQuota: AccountQuota }>> {
  return unwrap(await apiClient.post("collaborators", payload), (body) => body?.data);
}

export async function updateCollaborator(
  id: number,
  payload: UpdateCollaboratorPayload
): Promise<ApiResponse<Collaborator>> {
  return unwrap(await apiClient.put(`collaborators/${id}`, payload), (body) => body?.data);
}

export async function removeCollaborator(
  id: number,
  reason?: string
): Promise<
  ApiResponse<{
    removed: Collaborator;
    removalFeeCents: number;
    message: string;
    support: SupportInfo;
  }>
> {
  return unwrap(
    await apiClient.delete(`collaborators/${id}`, reason ? { reason } : undefined),
    (body) => body?.data
  );
}

export async function resetCollaboratorPassword(
  id: number,
  reason?: string
): Promise<
  ApiResponse<{
    collaborator: { id: number; username: string; roleName: string | null };
    temporaryPassword: string;
    mustChangePassword: boolean;
    quota: PasswordResetQuota;
    charge: { isFree: boolean; amountCents: number; authorizationId: number | null };
    delivery: string;
  }>
> {
  return unwrap(
    await apiClient.post(`collaborators/${id}/reset-password`, { reason }),
    (body) => body?.data
  );
}

export async function listCompanyRoles(): Promise<ApiResponse<CompanyRole[]>> {
  return unwrap(await apiClient.get("collaborators/roles"), (body) => body?.data || []);
}

export async function createCompanyRole(
  payload: CreateRolePayload
): Promise<ApiResponse<CompanyRole>> {
  return unwrap(await apiClient.post("collaborators/roles", payload), (body) => body?.data);
}

export async function updateCompanyRole(
  roleId: number,
  payload: UpdateRolePayload
): Promise<ApiResponse<CompanyRole>> {
  return unwrap(
    await apiClient.put(`collaborators/roles/${roleId}`, payload),
    (body) => body?.data
  );
}

export async function deactivateCompanyRole(
  roleId: number,
  reassignToRoleId?: number
): Promise<ApiResponse<CompanyRole>> {
  return unwrap(
    await apiClient.patch(`collaborators/roles/${roleId}/status`, {
      reassignToRoleId,
    }),
    (body) => body?.data
  );
}

export async function getPermissionsCatalog(): Promise<
  ApiResponse<PermissionCatalogModule[]>
> {
  return unwrap(
    await apiClient.get("collaborators/permissions/catalog"),
    (body) => body?.data || []
  );
}

export async function getCollaboratorPermissions(
  id: number
): Promise<ApiResponse<CollaboratorPermissionsDetail>> {
  return unwrap(
    await apiClient.get(`collaborators/${id}/permissions`),
    (body) => body?.data
  );
}

export async function updateCollaboratorPermissions(
  id: number,
  permissions: PermissionGroup[] | undefined,
  legalEntityIds?: number[]
): Promise<ApiResponse<CollaboratorPermissionsDetail>> {
  const payload: { permissions?: PermissionGroup[]; legalEntityIds?: number[] } = {};
  if (permissions !== undefined) payload.permissions = permissions;
  if (legalEntityIds !== undefined) payload.legalEntityIds = legalEntityIds;
  return unwrap(
    await apiClient.put(`collaborators/${id}/permissions`, payload),
    (body) => body?.data
  );
}

/* ---------- Vínculo empregatício (RH) ---------- */

export interface EmploymentLink {
  id: number;
  company_id: number;
  contributor_id: number;
  legal_entity_id: number;
  position_title: string | null;
  department: string | null;
  cost_center: string | null;
  started_at: string | null;
  ended_at: string | null;
  status: "active" | "transferred" | "ended";
  notes: string | null;
  legal_name: string;
  trade_name: string | null;
  cnpj: string;
  legal_entity_status: string;
  is_primary: boolean;
}

export interface EmploymentPayload {
  contributorId: number;
  legalEntityId: number;
  positionTitle?: string;
  department?: string;
  costCenter?: string;
  startedAt?: string;
  notes?: string;
}

export interface EmploymentUpdatePayload {
  positionTitle?: string;
  department?: string;
  costCenter?: string;
  notes?: string;
}

export async function listEmploymentLinks(
  contributorId?: number
): Promise<ApiResponse<EmploymentLink[]>> {
  const query = contributorId ? `?contributorId=${contributorId}` : "";
  return unwrap(
    await apiClient.get(`employment/links${query}`),
    (body) => (body?.data || []) as EmploymentLink[]
  );
}

export async function createEmploymentLink(
  payload: EmploymentPayload
): Promise<ApiResponse<EmploymentLink>> {
  return unwrap(
    await apiClient.post("employment/links", payload),
    (body) => body?.data as EmploymentLink
  );
}

export async function updateEmploymentLink(
  id: number,
  payload: EmploymentUpdatePayload
): Promise<ApiResponse<EmploymentLink>> {
  return unwrap(
    await apiClient.patch(`employment/links/${id}`, payload),
    (body) => body?.data as EmploymentLink
  );
}

export async function endEmploymentLink(
  id: number,
  payload: { endedAt?: string; notes?: string } = {}
): Promise<ApiResponse<EmploymentLink>> {
  return unwrap(
    await apiClient.post(`employment/links/${id}/end`, payload),
    (body) => body?.data as EmploymentLink
  );
}
