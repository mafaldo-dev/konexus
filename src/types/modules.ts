// types/modules.ts
/**
 * Chaves de módulo do backend (fonte de verdade:
 * konexus-back/src/domain/security/moduleCatalog.js).
 *
 * Padrão (freemium): dashboard, gestao, vendas, compras, estoque, rh, finance.
 * Extras (contratação independente): crm, contabil, nfe.
 */
export type ModuleKey =
  | 'dashboard'
  | 'gestao'
  | 'vendas'
  | 'compras'
  | 'estoque'
  | 'rh'
  | 'finance'
  | 'crm'
  | 'contabil'
  | 'nfe';

export type MenuKey =
  | 'dashboard'
  | 'gestao'
  | 'vendas'
  | 'compras'
  | 'estoque'
  | 'financeiro'
  | 'rh'
  | 'crm'
  | 'planos'
  | 'config';

export interface Module {
  id: number;
  module_key: ModuleKey;
  name: string;
  description: string;
}

export interface MenuItem {
  key: MenuKey;
  title: string;
  icon: any;
  href?: string;
  to?: string;
  access?: string[];
  submenu?: Array<{
    title: string;
    to: string;
    icon: any;
    access?: string[];
  }>;
}