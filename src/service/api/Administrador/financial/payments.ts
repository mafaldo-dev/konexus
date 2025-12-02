import { OrderResponse } from "../../../interfaces";
import { apiRequest } from "../../api";

export interface Payment {
  id: number;
  orderid: number;
  customerid: number;
  amount: number;
  payment_status: 'pending' | 'paid' | 'cancelled' | 'overdue' | 'due_today';
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

export interface CombinedOrderItem {
  id: number;
  type: "order";
  title: string;
  amount: string | number;
  status: string;
  date: string;
}

export interface CombinedPaymentItem {
  id: number;
  type: "payment";
  title: string;
  amount: string | number;
  status: string;
  date: string;
  orderId: number;
  notes?: string;
}

export type CombinedItem = CombinedOrderItem | CombinedPaymentItem;

export interface CustomerPaymentsAndOrders {
  status: string;
  customer: {
    id: number;
    name: string;
  };
  combined: CombinedItem[]; 
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}



// ====================== DASHBOARD ====================== //

export async function getPaymentsDashboard(token?: string): Promise<PaymentDashboard> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    const response = await apiRequest("payments/dashboard", "GET", undefined, tkn);
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar dashboard de pagamentos:", error);
    throw new Error("Erro ao carregar dashboard");
  }
}

// ====================== LISTAR PAGAMENTOS ====================== //

export async function getPayments(
  filters?: {
    payment_status?: string;
    customer_id?: number;
    data_inicio?: string;
    data_fim?: string;
    page?: number;
    limit?: number;
  },
  token?: string
): Promise<PaginationResponse<Payment>> { 
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    const params = new URLSearchParams();
    if (filters?.payment_status) params.append('payment_status', filters.payment_status);
    if (filters?.customer_id) params.append('customer_id', filters.customer_id.toString());
    if (filters?.data_inicio) params.append('data_inicio', filters.data_inicio);
    if (filters?.data_fim) params.append('data_fim', filters.data_fim);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiRequest(`payments/all${queryString}`, "GET", undefined, tkn);
    return response;
  } catch (error) {
    console.error("Erro ao buscar pagamentos:", error);
    throw new Error("Erro ao carregar pagamentos");
  }
}

// ====================== BUSCAR PAGAMENTOS POR CLIENTE ====================== //

export async function getPaymentsByCustomer(
  id: string | number,
  filters?: {
    page?: number;
    limit?: number;
  },
  token?: string
): Promise<CustomerPaymentsAndOrders> {

  const tkn = token || localStorage.getItem("token") as string;

  try {
    const params = new URLSearchParams();
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await apiRequest(
      `payments/customer/${id}/payments${queryString}`,
      "GET",
      undefined,
      tkn
    );
    
    return response as CustomerPaymentsAndOrders;

  } catch (error) {
    console.error("Erro ao buscar pagamentos do cliente:", error);
    throw new Error("Erro ao carregar pagamentos do cliente");
  }
}

// ====================== BUSCAR POR ID ====================== //

export async function getPaymentById(id: string | number, token?: string): Promise<Payment> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    const response = await apiRequest(`payments/${id}`, "GET", undefined, tkn);
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar pagamento:", error);
    throw new Error("Erro ao carregar pagamento");
  }
}

// ====================== ATUALIZAR STATUS ====================== //

export async function updatePaymentStatus(
  id: string | number,
  data: {
    payment_status: string,
    payment_date?: string | null,
    transaction_id?: string | number | null,
    notes?: string
  },
  token?: string
): Promise<Payment> {

  const tkn = token || (localStorage.getItem("token") as string);
  
  try {
    const response = await apiRequest(`payments/${id}/status`, "PUT", data, tkn);

    // backend devolve { Info, data: {...} }
    return response.data.data;
  } catch (error) {
    console.error("Erro ao atualizar status de pagamento:", error);
    throw new Error("Erro ao atualizar status");
  }
}


// ====================== MARCAR COMO PAGO ====================== //

export async function markAsPaid(
  id: string | number,
  data?: {
    transaction_id?: string;
    notes?: string;
  },
  token?: string
): Promise<Payment> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    const response = await apiRequest(`payments/${id}/status`, "PUT", data, tkn);
    return response.data;
  } catch (error) {
    console.error("Erro ao marcar como pago:", error);
    throw new Error("Erro ao marcar pagamento");
  }
}

// ====================== DELETAR ====================== //

export async function deletePayment(id: string | number, token?: string): Promise<void> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    await apiRequest(`payments/${id}`, "DELETE", undefined, tkn);
  } catch (error) {
    console.error("Erro ao deletar pagamento:", error);
    throw new Error("Erro ao deletar pagamento");
  }
}