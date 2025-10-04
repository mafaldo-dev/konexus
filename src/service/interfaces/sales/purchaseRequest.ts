
export interface PurchaseRequest {
  id: string
  requestNumber: string;
  requestDate: string;
  enterprise_name: string,
  buyer: string
  companyData: {
    id: string
    code: string
    company_name: string,
    email: string
    cnpj: string
    phone: number
  }
  products: {
    id: string,
    code: string,
    product_name: string,
    quantity: number,
    price: number,
    total_price: number
  }[]
  createdAt: Date | any
  deliveryDate: Date | any
  status: 'pending' | 'approved' | 'completed';
  notes: string;
}