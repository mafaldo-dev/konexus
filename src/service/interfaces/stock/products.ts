// interfaces.ts
export interface Products {
  id: number | any;
  name: string;
  code: string;
  description: string;
  price: number;
  coast: number;
  stock: number; 
  location: string;
  minimum_stock: number;
  brand: string;
  supplier_id: number | any;
  category: string;
  companyId: number;
  created_at?: string | Date
  updated_at?: string | Date;
  quantity?: number | any
}

