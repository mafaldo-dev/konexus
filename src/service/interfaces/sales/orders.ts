export interface OrderItem {
  productId: string;
  product_name: string;
  quantity: number;
  product_code: string,
  unit_price: number
  total: number
  location: string
}

export interface Order {
  id?: string | any;
  userId: string
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_address: string
  salesperson: string;
  order_date: string | Date | any;
  total_amount: number | any;
  status: "Pendente" | "Separando" | "Finalizado" | "Enviado";
  items: OrderItem[];
  notes: string
  delivery_date: string
}