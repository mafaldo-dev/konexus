
export interface EnterpriseData {
  id?: string
  name: string,
  phone?: string
  email?: string
  code?: string
  address?: {
    state?: string,
    city?: string
    street?: string
    num?: number
  }
  informations: {
    phantasy_name?: string
    cnpj?: string
  }
  createdAt?: Date | any
  status?: string
}
