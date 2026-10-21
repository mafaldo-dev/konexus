/**
 * services/financialService.ts
 * Serviço financeiro (domínio: financeiro).
 * Agrupa contas a pagar (payment_account) e pagamentos de pedidos (order_payments).
 * Endpoints reais do backend:
 *
 * Contas a pagar:
 *   GET  /payment/accounts
 *   GET  /payment/accounts/summary
 *   GET  /payment/accounts/:id
 *   POST /payment/accounts
 *   PUT  /payment/accounts/:id
 *   DELETE /payment/accounts/:id
 *
 * Pagamentos de pedidos:
 *   GET  /payments/dashboard
 *   GET  /payments/all
 *   GET  /payments/customer/:id/payments
 *   GET  /payments/:id
 *   PUT  /payments/:orderId/status
 *   PUT  /payments/:id/mark-payd
 *
 * O backend NAO expõe payment/dashboard (singular), payment/fornecedores,
 * payment/pagamentos, payment/relatorios nem payment/accounts/exportar.
 */

import { apiClient, ApiResponse } from "../api/client";

/* ---------- Contas a pagar (payment_account) ---------- */

export interface PaymentAccount {
  id: number;
  title: string;
  supplier: string;
  total_amount: number;
  description?: string | null;
  payment_date: string;
  payment_status: "pending" | "paid" | "overdue" | "cancelled";
  companyId: number;
  createdat?: string;
  updatedat?: string;
}

export interface PaymentAccountFilters {
  payment_status?: string;
  supplier?: string;
  date_start?: string;
  date_end?: string;
  page?: number;
  limit?: number;
}

export interface PaymentAccountPage {
  data: PaymentAccount[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaymentSummary {
  pending: { count: number; total: number };
  paid: { count: number; total: number };
  overdue: { count: number; total: number };
  cancelled: { count: number; total: number };
}

/**
 * Lista contas a pagar da empresa autenticada (com filtros e paginação).
 */
export async function listPaymentAccounts(
  filters: PaymentAccountFilters = {}
): Promise<ApiResponse<PaymentAccountPage>> {
  const params = new URLSearchParams();
  if (filters.payment_status) params.append("payment_status", filters.payment_status);
  if (filters.supplier) params.append("supplier", filters.supplier);
  if (filters.date_start) params.append("date_start", filters.date_start);
  if (filters.date_end) params.append("date_end", filters.date_end);
  if (filters.page) params.append("page", String(filters.page));
  if (filters.limit) params.append("limit", String(filters.limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient.get(`payment/accounts${query}`);
}

/**
 * Busca conta a pagar pelo ID (restrito à empresa).
 */
export async function getPaymentAccountById(
  id: number | string
): Promise<ApiResponse<PaymentAccount>> {
  return apiClient.get<PaymentAccount>(`payment/accounts/${id}`);
}

/**
 * Cria uma conta a pagar.
 */
export async function createPaymentAccount(
  data: Omit<PaymentAccount, "id" | "createdat" | "updatedat" | "companyId">
): Promise<ApiResponse<PaymentAccount>> {
  return apiClient.post<PaymentAccount>("payment/accounts", data);
}

/**
 * Atualiza uma conta a pagar (campos parciais).
 */
export async function updatePaymentAccount(
  id: number | string,
  data: Partial<PaymentAccount>
): Promise<ApiResponse<PaymentAccount>> {
  return apiClient.put<PaymentAccount>(`payment/accounts/${id}`, data);
}

/**
 * Exclui uma conta a pagar (restrito à empresa).
 */
export async function deletePaymentAccount(
  id: number | string
): Promise<ApiResponse<{ message: string }>> {
  return apiClient.delete(`payment/accounts/${id}`);
}

/**
 * Resumo financeiro (contas a pagar por status).
 */
export async function getPaymentSummary(): Promise<ApiResponse<PaymentSummary>> {
  return apiClient.get<PaymentSummary>("payment/accounts/summary");
}

/* ---------- Pagamentos de pedidos (order_payments) ---------- */

export interface Payment {
  id: number;
  orderid: number;
  customerid: number;
  amount: number;
  payment_status:
    | "pending"
    | "paid"
    | "cancelled"
    | "overdue"
    | "due_today";
  payment_date?: string | null;
  due_date: string;
  transaction_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  ordernumber?: string;
  customer_name?: string;
}

export interface PaymentDashboard {
  total_pendente: number;
  total_a_receber_hoje: number;
  total_atrasado: number;
  total_recebido_mes: number;
}

export interface PaymentFilters {
  payment_status?: string;
  customer_id?: number | string;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  limit?: number;
}

/**
 * Dashboard financeiro (totais agregados por empresa).
 */
export async function getPaymentsDashboard(): Promise<ApiResponse<PaymentDashboard>> {
  return apiClient.get<PaymentDashboard>("payments/dashboard");
}

/**
 * Lista pagamentos de pedidos (com filtros e paginação).
 */
export async function listPayments(
  filters: PaymentFilters = {}
): Promise<ApiResponse<{ data: Payment[]; total: number }>> {
  const params = new URLSearchParams();
  if (filters.payment_status) params.append("payment_status", filters.payment_status);
  if (filters.customer_id) params.append("customer_id", String(filters.customer_id));
  if (filters.data_inicio) params.append("data_inicio", filters.data_inicio);
  if (filters.data_fim) params.append("data_fim", filters.data_fim);
  if (filters.page) params.append("page", String(filters.page));
  if (filters.limit) params.append("limit", String(filters.limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient.get(`payments/all${query}`);
}

/**
 * Busca pagamento pelo ID (restrito à empresa).
 */
export async function getPaymentById(
  id: number | string
): Promise<ApiResponse<Payment>> {
  return apiClient.get<Payment>(`payments/${id}`);
}

/**
 * Lista pagamentos e pedidos de um cliente (restrito à empresa).
 */
export async function getPaymentsByCustomer(
  customerId: number | string,
  filters: { page?: number; limit?: number } = {}
): Promise<ApiResponse<any>> {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", String(filters.page));
  if (filters.limit) params.append("limit", String(filters.limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient.get(`payments/customer/${customerId}/payments${query}`);
}

/**
 * Atualiza o status de um pagamento (via orderId).
 * Corpo segue o contrato do backend: { payment_status, payment_date, transaction_id, notes }.
 */
export async function updatePaymentStatus(
  orderId: number | string,
  data: {
    payment_status: string;
    payment_date?: string | null;
    transaction_id?: string | null;
    notes?: string | null;
  }
): Promise<ApiResponse<Payment>> {
  return apiClient.put<Payment>(`payments/${orderId}/status`, data);
}

/**
 * Marca um pagamento como pago (via id de order_payments, restrito à empresa).
 */
export async function markPaymentAsPaid(
  id: number | string,
  data?: { transaction_id?: string | null; notes?: string | null }
): Promise<ApiResponse<Payment>> {
  return apiClient.put<Payment>(`payments/${id}/mark-payd`, data ?? {});
}

/* ---------- Painel gerencial (por CNPJ ou consolidado) ---------- */

export interface OrderPaymentDashboard {
  total_pendente: number;
  total_a_receber_hoje: number;
  total_atrasado: number;
  total_recebido_mes: number;
  total_a_pagar_pendente: number;
  total_a_pagar_hoje: number;
  total_a_pagar_atrasado: number;
  total_pago_mes: number;
}

export interface FinancialDashboardResponse {
  status: string;
  data: OrderPaymentDashboard;
  scope: {
    mode: "legal_entity" | "consolidated_management";
    legalEntityId: number | null;
    warning: string | null;
  };
}

/**
 * Painel de pagamentos de pedidos.
 *
 * Sem `consolidated`, o backend aplica o CNPJ ativo enviado no cabecalho.
 * Com `consolidated`, devolve apenas totais gerenciais da organizacao inteira,
 * sem misturar contas nem permitir transferencias entre CNPJs. A permissao e
 * revalidada no backend; a UI nao e a fronteira de seguranca.
 */
export async function getPaymentDashboard(
  consolidated = false
): Promise<ApiResponse<FinancialDashboardResponse>> {
  return apiClient.get<FinancialDashboardResponse>(
    `payments/dashboard?consolidated=${consolidated ? "true" : "false"}`
  );
}
