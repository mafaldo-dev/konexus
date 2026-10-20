/**
 * Mapeamento de módulos, permissões e rotas do Konexus.
 *
 * A autorização real é sempre validada no backend. Este arquivo apenas evita
 * exibir menus/rotas que o usuário não pode usar e mantém a navegação coerente
 * com o catálogo de permissões retornado pelo servidor.
 *
 * Regras do modelo 1.2.1:
 *  - Módulos padrão são universais (dashboard, gestao, vendas, compras,
 *    estoque, rh e crm).
 *  - Financeiro e NF-e são extras independentes; a permissão individual só
 *    libera o acesso quando o módulo também está contratado.
 *  - O nome do cargo não concede acesso. O que vale são as permissões
 *    efetivas (cargo + exceções) e o cargo administrativo da empresa.
 */

export interface PermissionGroup {
  moduleKey: string;
  actions: string[];
}

export type PermissionRequirement = [moduleKey: string, actionKey: string];

export const MODULE_MAPPING: Record<string, string> = {
  dashboard: "dashboard",
  gestao: "gestao",
  vendas: "vendas",
  compras: "compras",
  estoque: "estoque",
  rh: "rh",
  crm: "crm",
  financeiro: "finance",
  finance: "finance",
  nfe: "nfe",
  config: "dashboard",
  planos: "dashboard",
  relatorios: "dashboard",
};

export const REVERSE_MODULE_MAPPING: Record<string, string[]> = {
  dashboard: ["dashboard", "config", "planos"],
  finance: ["financeiro"],
  nfe: ["financeiro"],
  crm: ["crm"],
  estoque: ["estoque"],
  vendas: ["vendas"],
  gestao: ["gestao"],
  compras: ["compras"],
  rh: ["rh"],
};

export const SUBMENU_MODULE_DEPENDENCIES: Record<string, string> = {
  "financer/financial": "finance",
  "financial/order-nfe": "nfe",
  "sales/goals": "crm",
  "sales/completed": "vendas",
  "sales/comissions": "rh",
  "stock/inventory": "estoque",
  "shopping/purchase-order": "compras",
  "shopping/invoice-entry": "compras",
  "manager/products": "gestao",
  "manager/customer": "gestao",
  "manager/suppliers": "gestao",
  "manager/categories": "gestao",
  "manager/services": "gestao",
  "sales/orders": "vendas",
  "sales/order-list": "vendas",
  "rh/employee": "rh",
  "rh/infos": "rh",
  "crm/dashboard": "crm",
};

export const REPORT_ENABLED_MODULES = ["vendas", "estoque", "finance", "compras"];

const MENU_REQUIREMENTS: Record<string, PermissionRequirement[]> = {
  dashboard: [["dashboard", "view"]],
  gestao: [
    ["gestao", "view"],
    ["estoque", "view"],
    ["compras", "view"],
    ["vendas", "view"],
  ],
  vendas: [["vendas", "view"]],
  compras: [["compras", "view"]],
  estoque: [["estoque", "view"]],
  financeiro: [["finance", "view"]],
  rh: [["rh", "view"]],
  crm: [["crm", "view"]],
};

const SUBMENU_REQUIREMENTS: Array<{
  prefix: string;
  anyOf: PermissionRequirement[];
}> = [
  { prefix: "/manager/products", anyOf: [["gestao", "view"], ["estoque", "view"], ["vendas", "view"], ["compras", "view"]] },
  { prefix: "/manager/customer", anyOf: [["gestao", "view"], ["vendas", "view"]] },
  { prefix: "/manager/suppliers", anyOf: [["gestao", "view"], ["compras", "view"]] },
  { prefix: "/manager/categories", anyOf: [["gestao", "view"]] },
  { prefix: "/manager/services", anyOf: [["gestao", "view"]] },
  { prefix: "/sales/orders", anyOf: [["vendas", "view"]] },
  { prefix: "/sales/order-list", anyOf: [["vendas", "view"]] },
  { prefix: "/sales/newOrder", anyOf: [["vendas", "view"]] },
  { prefix: "/sales/completed", anyOf: [["vendas", "view"], ["finance", "view"]] },
  { prefix: "/sales/goals", anyOf: [["crm", "view"], ["vendas", "view"]] },
  { prefix: "/sales/comissions", anyOf: [["rh", "view"], ["finance", "view"]] },
  { prefix: "/sales/reports", anyOf: [["vendas", "view"]] },
  { prefix: "/shopping", anyOf: [["compras", "view"], ["estoque", "view"]] },
  { prefix: "/financer", anyOf: [["finance", "view"]] },
  { prefix: "/financial/order-nfe", anyOf: [["nfe", "view"]] },
  { prefix: "/rh", anyOf: [["rh", "view"]] },
  { prefix: "/stock", anyOf: [["estoque", "view"]] },
  { prefix: "/crm", anyOf: [["crm", "view"]] },
];

const ROUTE_REQUIREMENTS: Array<{
  prefix: string;
  anyOf: PermissionRequirement[];
}> = [
  { prefix: "/dashboard", anyOf: [["dashboard", "view"]] },
  ...SUBMENU_REQUIREMENTS,
];

export function menuKeyToModuleKey(menuKey: string): string {
  return MODULE_MAPPING[menuKey] || menuKey;
}

export function moduleKeyToMenuKeys(moduleKey: string): string[] {
  return REVERSE_MODULE_MAPPING[moduleKey] || [moduleKey];
}

export function hasPermission(
  permissions: PermissionGroup[] | undefined,
  moduleKey: string,
  actionKey: string
): boolean {
  if (!Array.isArray(permissions)) return false;
  return permissions.some(
    (group) =>
      group.moduleKey === moduleKey &&
      Array.isArray(group.actions) &&
      group.actions.includes(actionKey)
  );
}

export function hasAnyPermission(
  permissions: PermissionGroup[] | undefined,
  requirements: PermissionRequirement[]
): boolean {
  return requirements.some(([moduleKey, actionKey]) =>
    hasPermission(permissions, moduleKey, actionKey)
  );
}

function isModuleAvailable(moduleKey: string, availableModules: string[]): boolean {
  return availableModules.includes(moduleKey);
}

function requirementsAllowed(
  requirements: PermissionRequirement[],
  availableModules: string[],
  permissions: PermissionGroup[],
  isCompanyAdmin: boolean
): boolean {
  return requirements.some(([moduleKey, actionKey]) => {
    if (!isModuleAvailable(moduleKey, availableModules)) return false;
    return isCompanyAdmin || hasPermission(permissions, moduleKey, actionKey);
  });
}

/**
 * Item de menu principal. Itens especiais:
 *  - config: somente administrador da empresa;
 *  - planos: qualquer usuário autenticado (visão comercial da própria empresa).
 */
export function canAccessMenuItemWithPermissions(
  menuKey: string,
  availableModules: string[],
  permissions: PermissionGroup[],
  isCompanyAdmin: boolean
): boolean {
  if (menuKey === "config") return isCompanyAdmin;
  if (menuKey === "planos") return true;

  const requirements = MENU_REQUIREMENTS[menuKey];
  if (!requirements) return false;
  return requirementsAllowed(requirements, availableModules, permissions, isCompanyAdmin);
}

export function canAccessSubmenuWithPermissions(
  submenuPath: string,
  availableModules: string[],
  permissions: PermissionGroup[],
  isCompanyAdmin: boolean
): boolean {
  const path = submenuPath.startsWith("/") ? submenuPath : `/${submenuPath}`;

  if (path.startsWith("/config")) {
    if (path === "/config/system") {
      return (
        isModuleAvailable("nfe", availableModules) &&
        (isCompanyAdmin || hasPermission(permissions, "nfe", "configure"))
      );
    }
    return isCompanyAdmin;
  }
  if (path === "/planos") return true;

  const rule = SUBMENU_REQUIREMENTS.find(
    (item) => path === item.prefix || path.startsWith(`${item.prefix}/`)
  );
  if (!rule) return true;
  return requirementsAllowed(rule.anyOf, availableModules, permissions, isCompanyAdmin);
}

/**
 * Compatibilidade com chamadas antigas. As restrições por nome de cargo foram
 * substituídas por permissões; `allowedRoles` é ignorado de propósito.
 */
export function shouldShowMenuItem(menuKey: string, availableModules: string[]): boolean {
  const moduleKey = menuKeyToModuleKey(menuKey);
  if (menuKey === "config" || menuKey === "planos") return true;
  return availableModules.includes(moduleKey);
}

export function canAccessSubmenu(
  submenuPath: string,
  availableModules: string[],
  _userRole: string,
  _allowedRoles?: string[]
): boolean {
  return canAccessSubmenuWithPermissions(submenuPath, availableModules, [], false);
}

export function filterMenuItems<
  T extends { key: string; access?: string[] }
>(
  items: T[],
  availableModules: string[],
  _userRole: string,
  permissions: PermissionGroup[] = [],
  isCompanyAdmin = false
): T[] {
  return items.filter((item) =>
    canAccessMenuItemWithPermissions(
      item.key,
      availableModules,
      permissions,
      isCompanyAdmin
    )
  );
}

export function filterSubmenuItems<
  T extends { to: string; access?: string[] }
>(
  items: T[],
  availableModules: string[],
  _userRole: string,
  _allowedRoles?: string[],
  permissions: PermissionGroup[] = [],
  isCompanyAdmin = false
): T[] {
  return items.filter((item) =>
    canAccessSubmenuWithPermissions(
      item.to,
      availableModules,
      permissions,
      isCompanyAdmin
    )
  );
}

export function getAvailableModulesForPlan(planType: string): string[] {
  const plans: Record<string, string[]> = {
    free: ["dashboard", "gestao", "vendas", "compras", "estoque", "rh", "crm"],
    starter: ["dashboard", "gestao", "vendas", "compras", "estoque", "rh", "crm"],
    professional: ["dashboard", "gestao", "vendas", "compras", "estoque", "rh", "crm", "finance"],
    enterprise: ["dashboard", "gestao", "vendas", "compras", "estoque", "rh", "crm", "finance", "nfe"],
  };
  return plans[planType] || plans.free;
}

export function canAccessRoute(
  pathname: string,
  availableModules: string[],
  _userRole: string,
  permissions: PermissionGroup[] = [],
  isCompanyAdmin = false
): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const publicRoutes = ["/", "/login", "/change-password", "/system-admin"];
  if (publicRoutes.includes(normalized)) return true;

  if (normalized === "/planos") return true;

  if (normalized.startsWith("/config")) {
    if (normalized === "/config/system") {
      return (
        isModuleAvailable("nfe", availableModules) &&
        (isCompanyAdmin || hasPermission(permissions, "nfe", "configure"))
      );
    }
    return isCompanyAdmin;
  }

  const rule = ROUTE_REQUIREMENTS.find(
    (item) => normalized === item.prefix || normalized.startsWith(`${item.prefix}/`)
  );
  if (!rule) return true;
  return requirementsAllowed(rule.anyOf, availableModules, permissions, isCompanyAdmin);
}
