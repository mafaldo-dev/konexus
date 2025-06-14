export interface Supplier {
  id?: string
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
  createdAt: Date | string 
  updatedAt?: Date | string 
  active: boolean 
}