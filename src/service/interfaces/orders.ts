export interface OrderItem {
  id?: string;
  product_name: string;
  quantity: number;
  product_code: string,
  unit_price: number
  total: number
  location: string
}

export interface Order {
  id?: string | any;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_address: string
  salesperson: string;
  order_date: string;
  total_amount: number | any;
  status: "pendente" | "separando" | "separado" | "enviado";
  items: OrderItem[];
  notes: string
  delivery_date: string
}