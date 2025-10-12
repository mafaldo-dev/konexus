export interface Supplier {
  id?: string | any
  code: string
  name: string
  trading_name?: string
  cnpj: string
  email: string
  phone: string
  createdAt: string | Date
  updatedAt?: string | Date
  active: boolean
}