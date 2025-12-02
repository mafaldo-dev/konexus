export interface Titulo {
  id: number;
  fornecedor_id?: number;
  fornecedor_nome?: string;
  fornecedor_cnpj?: string;
  descricao: string;
  categoria?: string;
  centro_custo?: string;
  documento?: string;
  data_emissao: string;
  data_vencimento: string;
  valor_total: number;
  valor_pago: number;
  saldo?: number;
  forma_pagamento?: string;
  status: 'previsto' | 'a_vencer' | 'vence_hoje' | 'pago' | 'atrasado' | 'parcial' | any
  observacoes?: string;
  parcela_numero?: number;
  parcela_total?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentAccount {
  id?: number
  title: string
  supplier: string
  total_amount: number | any
  createdat: string
  updatedat: string 
  description: string
  payment_date: string 
  payment_status: string
  due_date?: string
}

export interface Fornecedor {
  id: number;
  nome: string;
  cnpj: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo: boolean;
}

export interface Pagamento {
  id: number;
  titulo_id: number;
  data_pagamento: string;
  valor_pago: number;
  forma_pagamento: string;
  conta_bancaria?: string;
  juros?: number;
  multa?: number;
  desconto?: number;
  comprovante_url?: string;
  observacao?: string;
  usuario_id: number;
  usuario_nome?: string;
  created_at?: string;
}

export interface Dashboard {
  total_a_pagar_hoje: number | any;
  total_atrasado: number | any;
  total_mes: number | any;
  contas_maior_valor: Titulo[];
}

export interface PaginationResponse<T> {
  status: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
export interface Payment {
  id: number;
  orderid: number;
  customerid: number;
  amount: number;
  payment_status: 'pending' | 'paid' | 'overdue' | 'due_today';
  payment_date?: string;
  due_date: string;
  transaction_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Campos JOIN
  ordernumber?: string;
  orderdate?: string;
  salesperson?: string;
  customer_name?: string;
  customer_code?: string;
  customer_email?: string;
  customer_phone?: string;
}

export interface PaymentDashboard {
  total_a_receber_hoje: number;
  total_atrasado: number;
  total_mes: number;
  total_recebido_mes: number;
  quantidade_faturas_pagas: number;
}

export interface PaginationResponse<T> {
  status: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FinancialStats {
  totalReceber: number;
  totalPagar: number;
  pedidosPendentes: number;
  payment_date?: number;
  due_date?: any
}

export interface FilterState {
  status: string;
  startDate: string;
  endDate: string;
  minValue: string;
  maxValue: string;
}

export interface DeleteModalState {
  isOpen: boolean;
  contaId: string | null;
  contaFornecedor: string;
}

export type OrderStatus = "pending" | "approved" | "in_progress" | "shipped" | "delivered" | "cancelled" | "backout" | any;

export interface ColumnsMap {
  [key: string]: any[];
}

export interface ContasReceberColumnsProps {
  handleMarkAsPaid: (id: number) => void;
}

export interface PedidosColumnsProps {
  handleLoadCustomerOrders: (customerId: number, customerName: string) => void;
  pedidos: any[];
  setPedidos: (pedidos: any[]) => void;
}

export interface CreateTituloData {
  fornecedor_nome: string;
  fornecedor_cnpj?: string;
  descricao: string;
  documento?: string;
  valor_total: number;
  data_vencimento: string;
  data_emissao?: string;
  categoria?: string;
  observacoes?: string;
  status?: string;
}