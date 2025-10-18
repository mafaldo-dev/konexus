export interface Supplier {
  id?: string | any
  code: string
  name: string
  trading_name?: string
  national_register_code: string
  email: string
  phone: string
  createdAt: string | Date
  updatedAt?: string | Date
  active: boolean
}