/**
 * Mapeamento de módulos, permissões e rotas do Konexus.
 *
 * A autorização real é sempre validada no backend. Este arquivo apenas evita
 * exibir menus/rotas que o usuário não pode usar e mantém a navegação coerente
 * com o catálogo de permissões retornado pelo servidor.
 *
 * Classificação comercial (fonte de verdade: backend
 * `src/domain/security/moduleCatalog.js`, exposta em
 * `GET /collaborators/permissions/catalog`):
 *  - Módulos padrão (freemium): dashboard, gestão, vendas, compras, estoque,
 *    RH e Financeiro. O Financeiro está liberado no freemium e não depende de
 *    contratação extra.
 *  - Módulos extras contratados de forma independente: CRM, Contábil e NF-e.
 *    A contratação de um não libera os outros.
 *  - A lista de módulos disponíveis vem do login (`modules`), calculada pelo
 *    backend a partir da instalação e das contratações da empresa.
 *  - O nome do cargo não concede acesso. O que vale são as permissões
 *    efetivas (cargo + exceções) e o cargo administrativo da empresa.
 *  - O Financeiro controla a liberação de pedidos de venda (análise de
 *    crédito) e a aprovação de pagamentos.
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
  contabilidade: "contabil",
  contabil: "contabil",
  config: "dashboard",
  planos: "dashboard",
  relatorios: "dashboard",
};

export const REVERSE_MODULE_MAPPING: Record<string, string[]> = {
  dashboard: ["dashboard", "config", "planos"],
  finance: ["financeiro"],
  nfe: ["financeiro"],
  crm: ["crm"],
  contabil: ["contabilidade"],
  estoque: ["estoque"],
  vendas: ["vendas"],
  gestao: ["gestao"],
  compras: ["compras"],
  rh: ["rh"],
};

export const SUBMENU_MODULE_DEPENDENCIES: Record<string, string> = {
  "financer/financial": "finance",
  "financial/order-nfe": "nfe",
  "crm/dashboard": "crm",
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
  // Regras mais específicas precisam vencer o prefixo genérico da listagem.
  { prefix: "/sales/orders/edit", anyOf: [["vendas", "edit"]] },
  { prefix: "/sales/newOrder", anyOf: [["vendas", "create"]] },
  { prefix: "/sales/orders", anyOf: [["vendas", "view"]] },
  { prefix: "/sales/order-list", anyOf: [["vendas", "view"]] },
  { prefix: "/sales/completed", anyOf: [["vendas", "view"], ["finance", "view"]] },
  { prefix: "/sales/goals", anyOf: [["crm", "view"], ["vendas", "view"]] },
  { prefix: "/sales/comissions", anyOf: [["rh", "view"], ["finance", "view"]] },
  { prefix: "/sales/reports", anyOf: [["vendas", "view"]] },
  { prefix: "/shopping", anyOf: [["compras", "view"], ["estoque", "view"]] },
  // Salários e posições são dados sensíveis do RH.
  { prefix: "/rh/infos", anyOf: [["rh", "edit"]] },
  { prefix: "/rh/folha", anyOf: [["rh", "view_payroll"]] },
  { prefix: "/rh/treinamentos", anyOf: [["rh", "view"]] },
  { prefix: "/config/audit-log", anyOf: [["audit", "view"]] },
  { prefix: "/config/stations", anyOf: [["audit", "manage_stations"]] },
  { prefix: "/financer/contabilidade/painel", anyOf: [["contabil", "reports"]] },
  { prefix: "/financer/contabilidade/conexao-fiscal", anyOf: [["nfe", "configure"]] },
  { prefix: "/financer/contabilidade/plano-de-contas", anyOf: [["contabil", "manage_plan"]] },
  { prefix: "/financer/contabilidade/lancamentos", anyOf: [["contabil", "create"]] },
  { prefix: "/financer/contabilidade/livro-diario", anyOf: [["contabil", "reports"]] },
  { prefix: "/financer/contabilidade/livro-razao", anyOf: [["contabil", "reports"]] },
  { prefix: "/financer/contabilidade/balancete", anyOf: [["contabil", "reports"]] },
  { prefix: "/financer/contabilidade/balanco-patrimonial", anyOf: [["contabil", "reports"]] },
  { prefix: "/financer/contabilidade/demonstracao-resultado", anyOf: [["contabil", "reports"]] },
  { prefix: "/financer/contabilidade/conciliacao", anyOf: [["contabil", "reconcile"]] },
  { prefix: "/financer/contabilidade/exercicios", anyOf: [["contabil", "manage_periods"]] },
  { prefix: "/financer/contabilidade/ativos", anyOf: [["contabil", "manage_assets"]] },
  { prefix: "/financer/contabilidade/relatorios", anyOf: [["contabil", "reports"]] },
  { prefix: "/financer/contabilidade/configuracoes", anyOf: [["contabil", "settings"]] },
  { prefix: "/financer", anyOf: [["finance", "view"]] },
  { prefix: "/financial/order-nfe", anyOf: [["nfe", "view"]] },
  { prefix: "/rh", anyOf: [["rh", "view"]] },
  { prefix: "/stock", anyOf: [["estoque", "view"]] },
  { prefix: "/crm", anyOf: [["crm", "view"]] },
];
SUBMENU_REQUIREMENTS.sort((a, b) => b.prefix.length - a.prefix.length);

const ROUTE_REQUIREMENTS: Array<{
  prefix: string;
  anyOf: PermissionRequirement[];
}> = [
  { prefix: "/dashboard", anyOf: [["dashboard", "view"]] },
  { prefix: "/config/audit-log", anyOf: [["audit", "view"]] },
  { prefix: "/config/stations", anyOf: [["audit", "manage_stations"]] },
  ...SUBMENU_REQUIREMENTS,
];
ROUTE_REQUIREMENTS.sort((a, b) => b.prefix.length - a.prefix.length);

/** Escolhe sempre a regra de prefixo mais específica. */
function findRouteRule<T extends { prefix: string }>(
  rules: T[],
  path: string
): T | undefined {
  return rules.find(
    (item) => path === item.prefix || path.startsWith(`${item.prefix}/`)
  );
}

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

  // O grupo Financeiro também abriga Contabilidade, NF-e e RH. Um usuário
  // que só possui um desses módulos precisa enxergar o grupo para chegar às
  // telas liberadas; cada filho continua com sua própria regra de acesso.
  if (menuKey === "financeiro") {
    return ["finance", "rh", "contabil", "nfe"].some(
      (moduleKey) =>
        availableModules.includes(moduleKey) &&
        (isCompanyAdmin ||
          permissions.some(
            (group) =>
              group.moduleKey === moduleKey &&
              Array.isArray(group.actions) &&
              group.actions.length > 0
          ))
    );
  }

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

    // Historico de auditoria e estacoes de trabalho tem regras proprias.
    const auditRule = findRouteRule(SUBMENU_REQUIREMENTS, path);
    if (auditRule) {
      return requirementsAllowed(
        auditRule.anyOf,
        availableModules,
        permissions,
        isCompanyAdmin
      );
    }

    return isCompanyAdmin;
  }
  if (path === "/planos") return true;

  const rule = findRouteRule(SUBMENU_REQUIREMENTS, path);
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

/**
 * Módulos disponíveis por plano (uso legado).
 *
 * Os planos não concedem mais acesso: a liberação de módulos extras é feita
 * por contratação independente registrada pelo suporte. Esta função devolve
 * apenas o conjunto padrão (freemium), que é o mesmo para todos os planos.
 */
export function getAvailableModulesForPlan(planType: string): string[] {
  const standard = [
    "dashboard",
    "gestao",
    "vendas",
    "compras",
    "estoque",
    "rh",
    "finance",
  ];

  const plans: Record<string, string[]> = {
    free: standard,
    starter: standard,
    professional: standard,
    enterprise: standard,
  };

  return plans[planType] || plans.free;
}

/**
 * Módulos que podem liberar uma rota. Usado pela interface para distinguir
 * "módulo não contratado" de "permissão insuficiente".
 */
export function getRouteModules(pathname: string): string[] {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/config/system") return ["nfe"];

  const rule = findRouteRule(ROUTE_REQUIREMENTS, normalized);
  return rule ? Array.from(new Set(rule.anyOf.map(([moduleKey]) => moduleKey))) : [];
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

    const auditRule = findRouteRule(ROUTE_REQUIREMENTS, normalized);
    if (auditRule) {
      return requirementsAllowed(
        auditRule.anyOf,
        availableModules,
        permissions,
        isCompanyAdmin
      );
    }

    return isCompanyAdmin;
  }

  const rule = findRouteRule(ROUTE_REQUIREMENTS, normalized);
  if (!rule) return true;
  return requirementsAllowed(rule.anyOf, availableModules, permissions, isCompanyAdmin);
}
