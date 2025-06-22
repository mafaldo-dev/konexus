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

export interface Employee {
    id?: string
    username: string
    password: string
    designation: EmployeeFunction
    access: EmployeeDesignation
    salary: string
    dataEmployee: {
        fullname: string
        phone: string
        email: string
        birth_date: string | any
        RG: string
        CPF: string
    },
    address: {
        city: string
        state: string
        street: string
        num: number | any
    },
    createdAt: Date | string
    updatedAt?: Date | string
    active: boolean
}