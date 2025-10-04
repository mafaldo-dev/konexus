export enum EmployeeDesignation {
    ADMIN = "Full-access",
    EMPLOYEE = "Normal"
}
export enum EmployeeFunction {
    SELLER = "Vendedor",
    RECEIVER = "Conferente",
    STOCKIST = "Estoquista",
    MANAGER = "Gerente",
    ADMIN = "Administração"
}
export enum EmployeeSector {
    COMERCIAL = "Comercial",
    ESTOQUE = "Estoque",
    GERENCIA = "Gerencia",
    ESCRITORIO = "Escritorio"
}

export interface Employee {
    id?: string
    username: string
    password: string
    role: EmployeeFunction
    access: EmployeeDesignation
    active: boolean
    status: boolean
    sector: EmployeeSector
}