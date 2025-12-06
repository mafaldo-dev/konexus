// types/modules.ts
export type ModuleKey = 
  | 'dashboard' 
  | 'finance' 
  | 'crm' 
  | 'estoque' 
  | 'vendas' 
  | 'relatorios' 
  | 'gestao' 
  | 'compras' 
  | 'rh';

export type MenuKey = 
  | 'dashboard'
  | 'gestao'
  | 'vendas'
  | 'compras'
  | 'estoque'
  | 'financeiro'
  | 'rh'
  | 'crm'
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