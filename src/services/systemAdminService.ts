import { apiRequest } from "../api/client";

export type SubscriptionStatus = "active" | "cancelled" | "expired" | "pending";
export type SupportStatus = "active" | "pending" | "suspended" | "cancelled";
export type PlanType = "monthly" | "yearly";
export type ExtraModuleKey = "finance" | "nfe" | "crm" | "contabil";
export type ExtraModuleStatus = "pending" | "active" | "suspended" | "cancelled";
export type AuthorizationType = "extra_user" | "password_reset" | "extra_module";
export type AuthorizationStatus = "active" | "consumed" | "revoked" | "expired";

export const SYSTEM_ADMIN_TOKEN_KEY = "systemAdminToken";
export const SYSTEM_ADMIN_USER_KEY = "systemAdminUser";

export interface SystemAdminSessionUser {
  id: number | string;
  username: string;
  role: string;
  userType: string;
}

export interface SystemAdminCompany {
  id: number;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  installation_id: number;
  createdat: string;
  users_count: number;
  subscription_id: number | null;
  subscription_status: SubscriptionStatus | null;
  plan_id: number | null;
  subscription_started_at: string | null;
  subscription_ended_at: string | null;
  plan_name: string | null;
  plan_price_cents: number | null;
  plan_currency: string | null;
  support_id: number | null;
  support_status: SupportStatus | null;
  support_plan_name: string | null;
  support_monthly_fee_cents: number | null;
  support_started_at: string | null;
  support_ended_at: string | null;
  support_notes: string | null;
  contributors?: SystemAdminContributor[];
}

export interface SystemAdminContributor {
  id: number;
  username: string;
  role: string;
  active: boolean;
  status: boolean;
  access: string;
  sector: string;
  createdat: string;
}

export interface SystemAdminSubscription {
  id: number;
  company_id: number;
  company_name: string;
  plan_id: number;
  plan_name: string;
  plan_type: PlanType;
  price_cents: number;
  currency: string;
  status: SubscriptionStatus;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemAdminSupportContract {
  company_id: number;
  company_name: string;
  cnpj: string | null;
  id: number | null;
  status: SupportStatus | null;
  plan_name: string | null;
  monthly_fee_cents: number | null;
  started_at: string | null;
  ended_at: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SystemAdminPlan {
  id: number;
  name: string;
  type: PlanType;
  price_cents: number;
  currency: string;
  active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemAdminModule {
  id: number;
  module_key: string;
  name: string;
  description: string | null;
  is_paid: boolean;
}

export interface SystemAdminExtraModule {
  id: number | null;
  company_id: number;
  company_name: string;
  module_key: ExtraModuleKey;
  status: ExtraModuleStatus | null;
  started_at: string | null;
  ended_at: string | null;
  notes: string | null;
  updated_at: string | null;
}

export interface SystemAdminModuleEvent {
  id: number;
  company_id: number;
  module_key: ExtraModuleKey;
  previous_status: ExtraModuleStatus | null;
  new_status: ExtraModuleStatus;
  changed_by: number | null;
  changed_by_username: string | null;
  notes: string | null;
  created_at: string;
}

export interface SystemAdminAuthorization {
  id: number;
  company_id: number;
  company_name: string;
  authorization_type: AuthorizationType;
  module_key: ExtraModuleKey | null;
  quantity: number;
  consumed_quantity: number;
  status: AuthorizationStatus;
  responsible: string;
  notes: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemAdminDashboard {
  metrics: {
    companies: number;
    users: number;
    activeSubscriptions: number;
    activeSupport: number;
    activePlans: number;
    subscriptionRevenueCents: number;
    activeExtraModules?: number;
    activeAuthorizations?: number;
  };
  planDistribution: Array<{
    plan_id: number;
    plan_name: string;
    price_cents: number;
    total: number;
  }>;
  supportDistribution: Array<{ status: SupportStatus; total: number }>;
  companies: SystemAdminCompany[];
}

export interface CreateCompanyPayload {
  companyName: string;
  adminUsername: string;
  adminPassword: string;
  installation_id?: number;
  planId?: number | null;
}

export interface CreateCompanyResult {
  info: string;
  company: { id: number; name: string; installation_id: number };
  admin: { id: number; username: string; role: string };
  subscription: { id: number; plan_id: number; status: SubscriptionStatus } | null;
}

export interface CreateSubscriptionPayload {
  companyId: number;
  planId: number;
  status?: SubscriptionStatus;
}

export interface UpdateSubscriptionPayload {
  plan_id?: number;
  status?: SubscriptionStatus;
  ended_at?: string | null;
}

export interface UpsertSupportPayload {
  status: SupportStatus;
  plan_name?: string | null;
  monthly_fee_cents?: number;
  started_at?: string | null;
  ended_at?: string | null;
  notes?: string | null;
}

export interface PlanPayload {
  name: string;
  type: PlanType;
  price_cents: number;
  currency?: string;
  description?: string | null;
  active?: boolean;
}

function getToken() {
  return localStorage.getItem(SYSTEM_ADMIN_TOKEN_KEY) || "";
}

function clearSession() {
  localStorage.removeItem(SYSTEM_ADMIN_TOKEN_KEY);
  localStorage.removeItem(SYSTEM_ADMIN_USER_KEY);
}

export function saveSystemAdminSession(token: string, user: SystemAdminSessionUser) {
  localStorage.setItem(SYSTEM_ADMIN_TOKEN_KEY, token);
  localStorage.setItem(SYSTEM_ADMIN_USER_KEY, JSON.stringify(user));
}

export function getSystemAdminSession(): {
  token: string;
  user: SystemAdminSessionUser | null;
} {
  const token = getToken();
  const rawUser = localStorage.getItem(SYSTEM_ADMIN_USER_KEY);
  let user: SystemAdminSessionUser | null = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      user = null;
    }
  }
  return { token, user };
}

export function clearSystemAdminSession() {
  clearSession();
}

async function request<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: unknown
): Promise<T> {
  const token = getToken();
  if (!token) {
    throw new Error("Sessão administrativa expirada. Entre novamente pelo F1.");
  }

  const response = await apiRequest<T>(endpoint, method, body, { token });
  if (!response.ok || response.data === null) {
    if (response.status === 401 || response.status === 403) {
      clearSession();
    }
    throw new Error(response.error || "Não foi possível concluir a operação.");
  }
  return response.data;
}

export const systemAdminService = {
  getDashboard: () => request<SystemAdminDashboard>("admin/system/dashboard"),

  listCompanies: async () => {
    const data = await request<{ companies: SystemAdminCompany[] }>("admin/system/companies");
    return data.companies || [];
  },

  getCompany: async (companyId: number) => {
    const data = await request<{ company: SystemAdminCompany }>(
      `admin/system/companies/${companyId}`
    );
    return data.company;
  },

  createCompany: (payload: CreateCompanyPayload) =>
    request<CreateCompanyResult>("admin/system/companies", "POST", payload),

  listSubscriptions: async () => {
    const data = await request<{ subscriptions: SystemAdminSubscription[] }>(
      "admin/system/subscriptions"
    );
    return data.subscriptions || [];
  },

  createSubscription: async (payload: CreateSubscriptionPayload) => {
    const data = await request<{ subscription: SystemAdminSubscription }>(
      "admin/system/subscriptions",
      "POST",
      payload
    );
    return data.subscription;
  },

  updateSubscription: async (subscriptionId: number, payload: UpdateSubscriptionPayload) => {
    const data = await request<{ subscription: SystemAdminSubscription }>(
      `admin/system/subscriptions/${subscriptionId}`,
      "PUT",
      payload
    );
    return data.subscription;
  },

  listPlans: async () => {
    const data = await request<{ plans: SystemAdminPlan[] }>("admin/system/plans");
    return data.plans || [];
  },

  createPlan: async (payload: PlanPayload) => {
    const data = await request<{ plan: SystemAdminPlan }>("admin/system/plans", "POST", payload);
    return data.plan;
  },

  updatePlan: async (planId: number, payload: Partial<PlanPayload>) => {
    const data = await request<{ plan: SystemAdminPlan }>(
      `admin/system/plans/${planId}`,
      "PUT",
      payload
    );
    return data.plan;
  },

  listPlanModules: async (planId: number) => {
    const data = await request<{ modules: Array<{ module_key: string }> }>(
      `admin/system/plans/${planId}/modules`
    );
    return (data.modules || []).map((m) => m.module_key);
  },

  addPlanModule: (planId: number, moduleKey: string) =>
    request(`admin/system/plans/${planId}/modules`, "POST", { module_key: moduleKey }),

  removePlanModule: (planId: number, moduleKey: string) =>
    request(`admin/system/plans/${planId}/modules/${encodeURIComponent(moduleKey)}`, "DELETE"),

  listModules: async () => {
    const data = await request<{ modules: SystemAdminModule[] }>("admin/system/modules");
    return data.modules || [];
  },

  listExtraModules: async () => {
    const data = await request<{ extraModules: SystemAdminExtraModule[] }>(
      "admin/system/extra-modules"
    );
    return data.extraModules || [];
  },

  getCompanyExtraModules: async (companyId: number) => {
    const data = await request<{ extraModules: SystemAdminExtraModule[] }>(
      `admin/system/companies/${companyId}/extra-modules`
    );
    return data.extraModules || [];
  },

  updateExtraModule: async (
    companyId: number,
    moduleKey: ExtraModuleKey,
    payload: {
      status: ExtraModuleStatus;
      started_at?: string | null;
      ended_at?: string | null;
      notes?: string | null;
    }
  ) => {
    const data = await request<{ extraModule: SystemAdminExtraModule }>(
      `admin/system/companies/${companyId}/extra-modules/${moduleKey}`,
      "PUT",
      payload
    );
    return data.extraModule;
  },

  listModuleEvents: async (
    companyId: number,
    moduleKey?: ExtraModuleKey
  ) => {
    const query = moduleKey ? `?moduleKey=${moduleKey}` : "";
    const data = await request<{ events: SystemAdminModuleEvent[] }>(
      `admin/system/companies/${companyId}/module-events${query}`
    );
    return data.events || [];
  },

  listAuthorizations: async (filters: {
    companyId?: number;
    type?: AuthorizationType;
    status?: AuthorizationStatus;
  } = {}) => {
    const search = new URLSearchParams();
    if (filters.companyId) search.set("companyId", String(filters.companyId));
    if (filters.type) search.set("type", filters.type);
    if (filters.status) search.set("status", filters.status);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    const data = await request<{ authorizations: SystemAdminAuthorization[] }>(
      `admin/system/authorizations${suffix}`
    );
    return data.authorizations || [];
  },

  createAuthorization: async (payload: {
    companyId: number;
    authorizationType: AuthorizationType;
    moduleKey?: ExtraModuleKey | null;
    quantity: number;
    expiresAt?: string | null;
    notes?: string | null;
  }) => {
    const data = await request<{ authorization: SystemAdminAuthorization }>(
      "admin/system/authorizations",
      "POST",
      payload
    );
    return data.authorization;
  },

  revokeAuthorization: async (authorizationId: number) => {
    const data = await request<{ authorization: SystemAdminAuthorization }>(
      `admin/system/authorizations/${authorizationId}/revoke`,
      "POST"
    );
    return data.authorization;
  },

  listSupportContracts: async () => {
    const data = await request<{ contracts: SystemAdminSupportContract[] }>("admin/system/support");
    return data.contracts || [];
  },

  upsertSupport: async (companyId: number, payload: UpsertSupportPayload) => {
    const data = await request<{ contract: SystemAdminSupportContract }>(
      `admin/system/support/${companyId}`,
      "PUT",
      payload
    );
    return data.contract;
  },
};
