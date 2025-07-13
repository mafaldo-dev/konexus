export interface ProductsProps {
  id: string;
  code: string;
  product_name: string;
  name?: string
  quantity: number;
  price: number;
  location?: string;
  total_price?: number
}