import { apiClient, ApiResponse } from "../api/client";
import { asList, asObject, pickData } from "../api/payload";

export type BankAccountType =
  | "checking"
  | "savings"
  | "payment"
  | "investment"
  | "cash";

export interface BankAccount {
  id: number;
  company_id: number;
  legal_entity_id: number;
  bank_code: string;
  bank_name: string;
  agency: string;
  account_number: string;
  account_digit?: string | null;
  account_type: BankAccountType;
  holder_name: string;
  holder_document?: string | null;
  initial_balance: number;
  initial_balance_date?: string | null;
  current_balance: number;
  status: "active" | "inactive";
  notes?: string | null;
  transaction_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface BankTransaction {
  id: number;
  bank_account_id: number;
  direction: "credit" | "debit";
  amount: number;
  transaction_date: string;
  description: string;
  category?: string | null;
  source_type: string;
  status: "posted" | "reversed";
  idempotency_key?: string | null;
  reversal_reason?: string | null;
  created_by_username?: string | null;
}

export interface BankAccountSummary {
  accounts: number;
  activeAccounts: number;
  totalBalance: number;
}

export interface BankAccountInput {
  bankCode: string;
  bankName: string;
  agency: string;
  accountNumber: string;
  accountDigit?: string;
  accountType: BankAccountType;
  holderName: string;
  holderDocument?: string;
  initialBalance: number | string;
  initialBalanceDate?: string;
  status?: "active" | "inactive";
  notes?: string;
}

export interface BankTransactionInput {
  direction: "credit" | "debit";
  amount: number | string;
  transactionDate: string;
  description: string;
  category?: string;
  idempotencyKey?: string;
}

const base = "finance/bank-accounts";

export async function listBankAccounts(filters: {
  status?: string;
  search?: string;
} = {}): Promise<ApiResponse<BankAccount[]>> {
  const params = new URLSearchParams({ limit: "200" });
  if (filters.status) params.append("status", filters.status);
  if (filters.search) params.append("search", filters.search);
  return asList<BankAccount>(
    await apiClient.get(`${base}?${params.toString()}`),
    ["data"],
    "contas bancárias"
  );
}

export async function getBankAccountSummary(): Promise<ApiResponse<BankAccountSummary>> {
  return pickData<BankAccountSummary>(
    await apiClient.get(`${base}/summary`),
    (body) => body?.data,
    "resumo de contas bancárias"
  );
}

export async function createBankAccount(
  payload: BankAccountInput
): Promise<ApiResponse<BankAccount>> {
  return asObject<BankAccount>(
    await apiClient.post(base, payload),
    ["data"],
    "conta bancária criada"
  );
}

export async function updateBankAccount(
  id: number | string,
  payload: Partial<BankAccountInput>
): Promise<ApiResponse<BankAccount>> {
  return asObject<BankAccount>(
    await apiClient.patch(`${base}/${id}`, payload),
    ["data"],
    "conta bancária atualizada"
  );
}

export async function listBankTransactions(
  accountId: number | string
): Promise<ApiResponse<BankTransaction[]>> {
  return asList<BankTransaction>(
    await apiClient.get(`${base}/${accountId}/transactions?limit=200`),
    ["data"],
    "movimentações bancárias"
  );
}

export async function createBankTransaction(
  accountId: number | string,
  payload: BankTransactionInput
): Promise<ApiResponse<{ transaction: BankTransaction; replayed: boolean }>> {
  return pickData<{ transaction: BankTransaction; replayed: boolean }>(
    await apiClient.post(`${base}/${accountId}/transactions`, payload),
    (body) => body?.data,
    "movimentação bancária"
  );
}

export async function reverseBankTransaction(
  accountId: number | string,
  transactionId: number | string,
  reason: string
): Promise<ApiResponse<BankTransaction>> {
  return asObject<BankTransaction>(
    await apiClient.post(
      `${base}/${accountId}/transactions/${transactionId}/reverse`,
      { reason }
    ),
    ["data"],
    "estorno da movimentação"
  );
}
