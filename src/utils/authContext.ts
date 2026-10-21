import { AccessType } from "../AuthContext";
import { PermissionGroup } from "./moduleMapping";
import { LegalEntity } from "../services/legalEntityService";

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
  roleId?: number | null;
  roleName?: string;
  designation: string;
  active: boolean;
  access?: AccessType | string;
  sector?: string;
  companyId?: number;
  token?: string;
  isCompanyAdmin?: boolean;
  mustChangePassword?: boolean;
  modules?: string[];
  permissions?: PermissionGroup[];
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

  // Funcionalidades de módulos e permissões
  modules: string[];
  permissions: PermissionGroup[];
  isCompanyAdmin: boolean;
  mustChangePassword: boolean;
  hasModule: (moduleKey: string) => boolean;
  hasPermission: (moduleKey: string, actionKey: string) => boolean;
  hasAnyPermission: (requirements: Array<[string, string]>) => boolean;
  hasRole: (allowedRoles: string[]) => boolean;
  canAccessMenuItem: (menuKey: string, allowedRoles?: string[]) => boolean;
  canAccessSubmenuItem: (path: string, allowedRoles?: string[]) => boolean;
  filterMenu: <T extends { key: string; access?: string[]; submenu?: any[] }>(
    items: T[]
  ) => T[];
  canAccessRoute: (pathname: string) => boolean;

  // Multi-CNPJ: empresas jurídicas que o usuário pode operar nesta sessão.
  legalEntities: LegalEntity[];
  activeLegalEntity: LegalEntity | null;
  setActiveLegalEntity: (entity: LegalEntity) => void;
  refreshLegalEntities: () => Promise<LegalEntity[]>;
  /** Recarrega cargo, permissões, módulos e CNPJs do backend. */
  refreshSession: () => Promise<void>;
}
