
export interface EnterpriseData {
  company_name: string,
  phone: string
  email: string
  address: {
    state: string,
    city: string
    street: string
    num: number
  }
  informations: {
    phantasy_name: string
    cnpj: string
  }
  createdAt: Date | any
  status: string
}