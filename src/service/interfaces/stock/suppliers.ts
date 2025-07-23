export interface Supplier {
  id?: string | any
  code: string
  name: string
  tradingName?: string
  cnpj: string
  email: string
  phone: string
  address: {
    street: string 
    number: string | any
    complement?: string
    neighborhood: string
    city: string 
    state: string 
    zipCode: string 
    uf: string
  };
  createdAt: string  | Date
  updatedAt?: string | Date
  active: boolean 
  deliveryTime:  number
}