export interface OrderItem {
  productId: string;
  product_name: string;
  quantity: number;
  product_code: string,
  unit_price: number
  total: number
  location: string
}

type PaymentMethods = "Pix" | "Boleto" | "Cartão Credito" | "Cartao Debito"

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
  status: "Pendente" | "Liberado" |"Separando" | "Finalizado" | "Enviado";
  items: OrderItem[];
  notes: string
  delivery_date: string
  payment_methods: PaymentMethods[]
}