// config/moduleMapping.ts
/**
 * Mapeamento completo entre as chaves do menu e os module_keys do banco/token
 * 
 * Database modules: dashboard, finance, crm, estoque, vendas, relatorios, gestao, compras, rh
 * Menu keys: dashboard, gestao, vendas, compras, estoque, financeiro, rh, crm, config
 */

// Mapeamento principal: menu key -> module key
export const MODULE_MAPPING: Record<string, string> = {
  // Mapeamento direto (mesmo nome)
  'dashboard': 'dashboard',
  'gestao': 'gestao',
  'vendas': 'vendas',
  'compras': 'compras',
  'estoque': 'estoque',
  'rh': 'rh',
  'crm': 'crm',
  
  // Mapeamento com nomes diferentes
  'financeiro': 'finance',
  
  // Casos especiais
  'config': 'dashboard',
  'relatorios': 'relatorios',
};

// Mapeamento reverso: module key -> menu keys
export const REVERSE_MODULE_MAPPING: Record<string, string[]> = {
  'dashboard': ['dashboard', 'config'],
  'finance': ['financeiro'],
  'crm': ['crm'],
  'estoque': ['estoque'],
  'vendas': ['vendas'],
  'relatorios': [],
  'gestao': ['gestao'],
  'compras': ['compras'],
  'rh': ['rh'],
};

// Submenus que dependem de módulos específicos
export const SUBMENU_MODULE_DEPENDENCIES: Record<string, string> = {
  // Submenus específicos que requerem módulos principais
  'financer/financial': 'finance',
  'sales/goals': 'finance',
  'financial/order-nfe': 'finance',
  'sales/completed': 'finance',
  'sales/comissions': 'finance',
  'stock/inventory': 'estoque',
  'stock/movements': 'estoque',
  'shopping/purchase-order': 'compras',
  'shopping/invoice-entry': 'compras',
  'manager/products': 'gestao',
  'manager/customer': 'gestao',
  'manager/suppliers': 'gestao',
  'manager/categories': 'gestao',
  'manager/services': 'gestao',
  'sales/orders': 'vendas',
  'sales/order-list': 'vendas',
  'rh/employee': 'rh',
  'rh/infos': 'rh',
  'rh/folha': 'rh',
  'rh/ponto': 'rh',
  'rh/ferias': 'rh',
  'rh/beneficios': 'rh',
  'rh/treinamentos': 'rh',
  'crm/dashboard': 'crm',
};

// Módulos que incluem relatórios automaticamente
export const REPORT_ENABLED_MODULES = ['vendas', 'estoque', 'finance', 'compras'];

/**
 * Converte chave do menu para module_key do banco
 */
export function menuKeyToModuleKey(menuKey: string): string {
  return MODULE_MAPPING[menuKey] || menuKey;
}

/**
 * Converte module_key do banco para chaves do menu
 */
export function moduleKeyToMenuKeys(moduleKey: string): string[] {
  return REVERSE_MODULE_MAPPING[moduleKey] || [moduleKey];
}

/**
 * Verifica se um item de menu deve ser exibido
 */
export function shouldShowMenuItem(menuKey: string, availableModules: string[]): boolean {
  const moduleKey = menuKeyToModuleKey(menuKey);
  
  // Caso especial: config requer dashboard + permissão especial (verificada em outro lugar)
  if (menuKey === 'config') {
    return availableModules.includes('dashboard');
  }
  
  // Caso especial: relatórios
  if (menuKey === 'relatorios') {
    const hasReportModule = availableModules.includes('relatorios');
    const hasEnabledModule = availableModules.some(module => 
      REPORT_ENABLED_MODULES.includes(module)
    );
    return hasReportModule || hasEnabledModule;
  }
  
  // Verificação normal
  return availableModules.includes(moduleKey);
}

/**
 * Verifica se um submenu pode ser acessado
 */
export function canAccessSubmenu(
  submenuPath: string, 
  availableModules: string[], 
  userRole: string,
  allowedRoles?: string[]
): boolean {
  // 1. Verifica cargo se houver restrição
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole)) {
      return false;
    }
  }
  
  // 2. Verifica dependência de módulo
  const requiredModule = SUBMENU_MODULE_DEPENDENCIES[submenuPath];
  if (requiredModule && !availableModules.includes(requiredModule)) {
    return false;
  }
  
  // 3. Casos especiais por path
  if (submenuPath.includes('/reports')) {
    // Relatórios específicos
    const moduleFromPath = submenuPath.split('/')[0]; // 'sales', 'stock', etc
    const moduleMap: Record<string, string> = {
      'sales': 'vendas',
      'stock': 'estoque',
      'financial': 'finance',
      'shopping': 'compras',
    };
    const requiredModule = moduleMap[moduleFromPath];
    if (requiredModule && !availableModules.includes(requiredModule)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Filtra itens de menu baseado nos módulos disponíveis
 */
export function filterMenuItems<T extends { key: string; access?: string[] }>(
  items: T[],
  availableModules: string[],
  userRole: string
): T[] {
  return items.filter(item => {
    // Verifica módulo
    if (!shouldShowMenuItem(item.key, availableModules)) {
      return false;
    }
    
    // Verifica cargo se especificado
    if (item.access && item.access.length > 0) {
      if (!item.access.includes(userRole)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Filtra subitens de menu
 */
export function filterSubmenuItems<T extends { to: string; access?: string[] }>(
  items: T[],
  availableModules: string[],
  userRole: string
): T[] {
  return items.filter(item => {
    return canAccessSubmenu(item.to, availableModules, userRole, item.access);
  });
}

/**
 * Obtém todos os módulos disponíveis para uma empresa
 */
export function getAvailableModulesForPlan(planType: string): string[] {
  const plans: Record<string, string[]> = {
    'free': ['dashboard'],
    'starter': ['dashboard', 'gestao', 'vendas', 'compras'],
    'professional': ['dashboard', 'gestao', 'vendas', 'compras', 'estoque', 'finance'],
    'enterprise': ['dashboard', 'gestao', 'vendas', 'compras', 'estoque', 'finance', 'rh', 'crm', 'relatorios'],
  };
  
  return plans[planType] || plans['starter'];
}

/**
 * Verifica se uma rota específica pode ser acessada
 */
export function canAccessRoute(
  pathname: string,
  availableModules: string[],
  userRole: string
): boolean {
  // Rotas públicas (não requerem módulo)
  const publicRoutes = ['/', '/login', '/forgot-password', '/reset-password'];
  if (publicRoutes.includes(pathname)) {
    return true;
  }
  
  // Extrai o contexto da rota
  const pathParts = pathname.split('/').filter(Boolean);
  if (pathParts.length === 0) return false;
  
  const context = pathParts[0]; // 'dashboard', 'sales', 'stock', etc
  
  // Mapeamento de contexto para módulo
  const contextToModule: Record<string, string> = {
    'dashboard': 'dashboard',
    'manager': 'gestao',
    'sales': 'vendas',
    'shopping': 'compras',
    'stock': 'estoque',
    'financer': 'finance',
    'financial': 'finance',
    'rh': 'rh',
    'crm': 'crm',
    'config': 'dashboard',
  };
  
  const requiredModule = contextToModule[context];
  
  // Se não encontrou mapeamento, permite (pode ser rota interna)
  if (!requiredModule) {
    console.warn(`Rota não mapeada: ${pathname}`);
    return true; // Ou false, dependendo da sua política
  }
  
  // Verifica se o módulo está disponível
  return availableModules.includes(menuKeyToModuleKey(requiredModule));
}