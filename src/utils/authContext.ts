import { AccessType } from "../AuthContext";

export interface CompanyInfo {
  id: number;
  name: string;
  cnpj?: string;
  address?: {
    state: string;
    city: string;
    number: number;
  };
  email?: string;
  phone?: string;
  companyIcon: string | null;
  logoUrl?: string | null;
  modules?: string[];
}

export interface UserInfo {
  id: string;
  username: string;
  role: string;
  designation: string;
  active: boolean;
  access?: AccessType | string;
  sector?: string;
  companyId?: number;
  token?: string;
}

export enum EmployeeDesignation {
  ADMIN = "Full-access",
  EMPLOYEE = "Normal"
}

export interface AuthContextType {
  isAuthenticate: boolean;
  user: UserInfo | null;
  company: CompanyInfo | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasAccess: (requiredAccess: AccessType | AccessType[]) => boolean;
  
  // Funcionalidades de módulos
  modules: string[];
  hasModule: (moduleKey: string) => boolean;
  hasRole: (allowedRoles: string[]) => boolean;
  canAccessMenuItem: (menuKey: string, allowedRoles?: string[]) => boolean;
  canAccessSubmenuItem: (path: string, allowedRoles?: string[]) => boolean;
  filterMenu: <T extends { key: string; access?: string[]; submenu?: any[] }>(
    items: T[]
  ) => T[];
  canAccessRoute: (pathname: string) => boolean;
}