/**
 * src/types/humanResources/employees.ts
 * Interfaces e enums de colaboradores.
 */

export enum EmployeeDesignation {
  ADMIN = "Full-access",
  EMPLOYEE = "Normal",
}

export enum EmployeeFunction {
  SELLER = "Vendedor",
  RECEIVER = "Conferente",
  STOCKIST = "Estoquista",
  MANAGER = "Gerente",
  ADMIN = "Administração",
}

export enum EmployeeSector {
  COMERCIAL = "Comercial",
  ESTOQUE = "Estoque",
  GERENCIA = "Gerencia",
  ESCRITORIO = "Escritorio",
}

export interface Employee {
  id?: string | number;
  username: string;
  password?: string;
  role: EmployeeFunction | string;
  access: EmployeeDesignation | string;
  active: boolean;
  status?: string | boolean | any;
  sector: EmployeeSector | string;
  companyId?: number;
}
