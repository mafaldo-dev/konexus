/**
 * services/accountingService.ts
 * Cliente do modulo de Contabilidade (extra contratado do Financeiro).
 *
 * As rotas exigem, no backend: sessao valida, modulo `contabil` disponivel,
 * contratacao ativa do extra e a permissao da acao. As mutacoes passam pelo
 * fluxo de reautenticacao por senha (modal de confirmacao de identidade).
 */

import { apiClient, ApiResponse } from "../api/client";

export type AccountingClassification =
  | "ativo"
  | "passivo"
  | "patrimonio_liquido"
  | "receita"
  | "custo"
  | "despesa"
  | "resultado";

export type AccountingGroupKey =
  | "ativo"
  | "passivo"
  | "patrimonio_liquido"
  | "receita"
  | "custo"
  | "despesa"
  | "resultado";

export interface AccountingAccount {
  id: number;
  company_id: number;
  code: string;
  name: string;
  description: string | null;
  parent_id: number | null;
  parent_code?: string | null;
  parent_name?: string | null;
  level: number;
  classification: AccountingClassification;
  nature: "devedora" | "credora";
  account_type: "patrimonial" | "resultado";
  group_key: AccountingGroupKey;
  is_synthetic: boolean;
  allows_entries: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountingCostCenter {
  id: number;
  company_id: number;
  code: string;
  name: string;
  parent_id: number | null;
  active: boolean;
}

export interface AccountingPeriod {
  id: number;
  company_id: number;
  fiscal_year: number;
  fiscal_month: number;
  name: string;
  starts_at: string;
  ends_at: string;
  status: "open" | "closed" | "locked";
  closed_at: string | null;
  close_notes: string | null;
  posted_entries: number;
}

export interface AccountingEntryItem {
  id: number;
  entry_id: number;
  account_id: number;
  account_code: string;
  account_name: string;
  cost_center_id: number | null;
  cost_center_code: string | null;
  side: "debit" | "credit";
  amount: number;
  description: string | null;
}

export interface AccountingEntry {
  id: number;
  company_id: number;
  number: string;
  entry_date: string;
  period_id: number;
  period_name: string;
  period_status: string;
  description: string;
  origin_type: string;
  origin_id: string | null;
  origin_key: string | null;
  status: "draft" | "pending" | "posted" | "reversed";
  created_by: number | null;
  created_by_username: string | null;
  posted_by: number | null;
  posted_by_username: string | null;
  posted_at: string | null;
  reversed_at: string | null;
  reversal_of_id: number | null;
  notes: string | null;
  total_debit: number;
  total_credit: number;
  created_at: string;
  items?: AccountingEntryItem[];
}

export interface AccountingMapping {
  id: number;
  company_id: number;
  event_type: string;
  debit_account_id: number;
  debit_code: string;
  debit_name: string;
  credit_account_id: number;
  credit_code: string;
  credit_name: string;
  cost_center_id: number | null;
  cost_center_code: string | null;
  active: boolean;
}

export interface AccountingFixedAsset {
  id: number;
  company_id: number;
  code: string;
  description: string;
  category: string | null;
  acquisition_date: string;
  acquisition_amount: number;
  residual_amount: number;
  useful_life_months: number;
  depreciation_method: string;
  depreciation_start_date: string | null;
  account_id: number | null;
  account_code: string | null;
  depreciation_account_id: number | null;
  depreciation_account_code: string | null;
  cost_center_id: number | null;
  cost_center_code: string | null;
  status: "active" | "disposed";
  accumulated_depreciation: number;
  notes: string | null;
}

export interface AccountingDepreciation {
  id: number;
  asset_id: number;
  asset_code: string;
  asset_description: string;
  period_id: number;
  fiscal_year: number;
  fiscal_month: number;
  period_name: string;
  amount: number;
  accumulated: number;
  net_book_value: number;
  entry_id: number | null;
  created_at: string;
}

export interface AccountingReconciliation {
  id: number;
  company_id: number;
  financial_type: "payable" | "receivable";
  financial_id: number;
  entry_id: number | null;
  entry_number: string | null;
  entry_date: string | null;
  entry_description: string | null;
  status: "pending" | "reconciled" | "divergent";
  difference_amount: number | null;
  notes: string | null;
  reconciled_by_username: string | null;
  reconciled_at: string | null;
  updated_at: string;
}

export interface AccountingSettings {
  company_id: number;
  rounding_mode: string;
  require_cost_center: boolean;
  allow_manual_posting: boolean;
  depreciation_method: string;
  notes: string | null;
  updated_at: string;
}

export interface AccountingDashboard {
  period: { from: string | null; to: string | null; year: number | null };
  totals: {
    debit: number;
    credit: number;
    balanced: boolean;
    result: number;
    assets: number;
    liabilities: number;
    equity: number;
  };
  entries: { draft: number; pending: number; posted: number; reversed: number; open: number };
  periods: { open: number; closed: number; locked: number; total: number };
  groups: Record<string, { key: string; name: string; debit: number; credit: number; balance: number }>;
  reconciliation: { pending: number; reconciled: number; divergent: number };
  fixedAssets: {
    total: number;
    active: number;
    acquisitionAmount: number;
    accumulatedDepreciation: number;
    netBookValue: number;
  };
  alerts: Array<{ level: string; message: string }>;
}

export interface AccountingJournalRow {
  entry_id: number;
  number: string;
  entry_date: string;
  description: string;
  origin_type: string;
  origin_id: string | null;
  item_id: number;
  side: "debit" | "credit";
  amount: number;
  account_code: string;
  account_name: string;
  nature: string;
  group_key: string;
  cost_center_code: string | null;
}

function query(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

/* ------------------------------------------------------------ Plano de contas */

export async function listAccountingAccounts(
  filters: {
    search?: string;
    groupKey?: string;
    classification?: string;
    active?: boolean;
  } = {}
): Promise<ApiResponse<AccountingAccount[]>> {
  const response = await apiClient.get<AccountingAccount[]>(
    `accounting/accounts${query(filters)}`
  );
  return { ...response, data: response.data || [] };
}

export async function createAccountingAccount(
  payload: Partial<AccountingAccount>
): Promise<ApiResponse<AccountingAccount>> {
  return apiClient.post<AccountingAccount>("accounting/accounts", payload);
}

export async function updateAccountingAccount(
  id: number,
  payload: Partial<AccountingAccount>
): Promise<ApiResponse<AccountingAccount>> {
  return apiClient.put<AccountingAccount>(`accounting/accounts/${id}`, payload);
}

export async function deleteAccountingAccount(
  id: number
): Promise<ApiResponse<{ deleted: boolean }>> {
  return apiClient.delete<{ deleted: boolean }>(`accounting/accounts/${id}`);
}

/* ---------------------------------------------------------- Centros de custo */

export async function listCostCenters(): Promise<ApiResponse<AccountingCostCenter[]>> {
  const response = await apiClient.get<AccountingCostCenter[]>("accounting/cost-centers");
  return { ...response, data: response.data || [] };
}

export async function createCostCenter(
  payload: Partial<AccountingCostCenter>
): Promise<ApiResponse<AccountingCostCenter>> {
  return apiClient.post<AccountingCostCenter>("accounting/cost-centers", payload);
}

export async function updateCostCenter(
  id: number,
  payload: Partial<AccountingCostCenter>
): Promise<ApiResponse<AccountingCostCenter>> {
  return apiClient.put<AccountingCostCenter>(`accounting/cost-centers/${id}`, payload);
}

/* ------------------------------------------------------ Exercicios e periodos */

export async function listAccountingPeriods(
  filters: { year?: number; status?: string } = {}
): Promise<ApiResponse<AccountingPeriod[]>> {
  const response = await apiClient.get<AccountingPeriod[]>(
    `accounting/periods${query(filters)}`
  );
  return { ...response, data: response.data || [] };
}

export async function createAccountingPeriod(payload: {
  fiscalYear: number;
  fiscalMonth: number;
  name: string;
  startsAt: string;
  endsAt: string;
}): Promise<ApiResponse<AccountingPeriod>> {
  return apiClient.post<AccountingPeriod>("accounting/periods", payload);
}

export async function closeAccountingPeriod(
  id: number,
  notes?: string
): Promise<ApiResponse<AccountingPeriod>> {
  return apiClient.post<AccountingPeriod>(`accounting/periods/${id}/close`, { notes });
}

export async function reopenAccountingPeriod(
  id: number,
  notes: string
): Promise<ApiResponse<AccountingPeriod>> {
  return apiClient.post<AccountingPeriod>(`accounting/periods/${id}/reopen`, { notes });
}

export async function lockAccountingPeriod(
  id: number,
  notes?: string
): Promise<ApiResponse<AccountingPeriod>> {
  return apiClient.post<AccountingPeriod>(`accounting/periods/${id}/lock`, { notes });
}

/* --------------------------------------------------------------- Lancamentos */

export async function listAccountingEntries(
  filters: {
    status?: string;
    periodId?: number;
    originType?: string;
    from?: string;
    to?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<ApiResponse<AccountingEntry[]> & { total: number }> {
  const response = await apiClient.get<{ data: AccountingEntry[]; total: number }>(
    `accounting/entries${query(filters)}`
  );
  return {
    ...response,
    data: response.data?.data || [],
    total: response.data?.total || 0,
  } as ApiResponse<AccountingEntry[]> & { total: number };
}

export async function getAccountingEntry(
  id: number
): Promise<ApiResponse<AccountingEntry>> {
  return apiClient.get<AccountingEntry>(`accounting/entries/${id}`);
}

export async function createAccountingEntry(payload: {
  entryDate: string;
  periodId?: number;
  description: string;
  notes?: string;
  items: Array<{
    accountId: number;
    costCenterId?: number | null;
    side: "debit" | "credit";
    amount: number;
    description?: string;
  }>;
}): Promise<ApiResponse<AccountingEntry>> {
  return apiClient.post<AccountingEntry>("accounting/entries", payload);
}

export async function updateAccountingEntry(
  id: number,
  payload: {
    description?: string;
    notes?: string;
    items?: Array<{
      accountId: number;
      costCenterId?: number | null;
      side: "debit" | "credit";
      amount: number;
      description?: string;
    }>;
  }
): Promise<ApiResponse<AccountingEntry>> {
  return apiClient.put<AccountingEntry>(`accounting/entries/${id}`, payload);
}

export async function postAccountingEntry(
  id: number
): Promise<ApiResponse<AccountingEntry>> {
  return apiClient.post<AccountingEntry>(`accounting/entries/${id}/post`);
}

export async function reverseAccountingEntry(
  id: number,
  payload: { description?: string; notes?: string; entryDate?: string }
): Promise<ApiResponse<{ reversal: AccountingEntry; reversed: number }>> {
  return apiClient.post<{ reversal: AccountingEntry; reversed: number }>(
    `accounting/entries/${id}/reverse`,
    payload
  );
}

export async function deleteAccountingEntry(
  id: number
): Promise<ApiResponse<{ deleted: boolean }>> {
  return apiClient.delete<{ deleted: boolean }>(`accounting/entries/${id}`);
}

/* --------------------------------------------------------------- Mapeamentos */

export async function listAccountingMappings(): Promise<ApiResponse<AccountingMapping[]>> {
  const response = await apiClient.get<AccountingMapping[]>("accounting/mappings");
  return { ...response, data: response.data || [] };
}

export async function saveAccountingMapping(payload: {
  eventType: string;
  debitAccountId: number;
  creditAccountId: number;
  costCenterId?: number | null;
  active?: boolean;
}): Promise<ApiResponse<AccountingMapping>> {
  return apiClient.post<AccountingMapping>("accounting/mappings", payload);
}

export async function deleteAccountingMapping(
  id: number
): Promise<ApiResponse<{ deleted: boolean }>> {
  return apiClient.delete<{ deleted: boolean }>(`accounting/mappings/${id}`);
}

/* ------------------------------------------------------------- Configuracoes */

export async function getAccountingSettings(): Promise<ApiResponse<AccountingSettings>> {
  return apiClient.get<AccountingSettings>("accounting/settings");
}

export async function saveAccountingSettings(payload: {
  requireCostCenter?: boolean;
  allowManualPosting?: boolean;
  depreciationMethod?: string;
  notes?: string;
}): Promise<ApiResponse<AccountingSettings>> {
  return apiClient.put<AccountingSettings>("accounting/settings", payload);
}

/* ----------------------------------------------------------------- Relatorios */

export async function getAccountingDashboard(
  filters: { year?: number; from?: string; to?: string } = {}
): Promise<ApiResponse<AccountingDashboard>> {
  return apiClient.get<AccountingDashboard>(`accounting/dashboard${query(filters)}`);
}

export async function getAccountingJournal(filters: {
  from: string;
  to: string;
  accountId?: number;
  originType?: string;
  page?: number;
  pageSize?: number;
}): Promise<
  ApiResponse<{
    rows: AccountingJournalRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    totals: { debit: number; credit: number; balanced: boolean };
  }>
> {
  return apiClient.get(`accounting/reports/journal${query(filters)}`);
}

export async function getAccountingLedger(filters: {
  accountId?: number;
  from?: string;
  to?: string;
}): Promise<
  ApiResponse<{
    account: AccountingAccount | null;
    accounts: Array<{
      account_id: number;
      code: string;
      name: string;
      nature: string;
      debit: number;
      credit: number;
    }>;
    rows: Array<{
      entry_id: number;
      number: string;
      entry_date: string;
      description: string;
      side: string;
      amount: number;
      debit: number;
      credit: number;
      balance: number;
    }>;
    totals: {
      openingDebit: number;
      openingCredit: number;
      openingBalance: number;
      debit: number;
      credit: number;
      closingBalance: number;
    } | null;
  }>
> {
  return apiClient.get(`accounting/reports/ledger${query(filters)}`);
}

export async function getTrialBalance(filters: {
  from: string;
  to: string;
}): Promise<
  ApiResponse<{
    period: { from: string; to: string };
    accounts: Array<{
      accountId: number;
      code: string;
      name: string;
      groupKey: string;
      nature: string;
      openingDebit: number;
      openingCredit: number;
      openingBalance: number;
      debit: number;
      credit: number;
      closingBalance: number;
    }>;
    totals: Record<string, number>;
    balanced: boolean;
  }>
> {
  return apiClient.get(`accounting/reports/trial-balance${query(filters)}`);
}

export async function getBalanceSheet(filters: {
  from: string;
  to: string;
  compareFrom?: string;
  compareTo?: string;
}): Promise<ApiResponse<any>> {
  return apiClient.get(`accounting/reports/balance-sheet${query(filters)}`);
}

export async function getIncomeStatement(filters: {
  from: string;
  to: string;
  compareFrom?: string;
  compareTo?: string;
}): Promise<ApiResponse<any>> {
  return apiClient.get(`accounting/reports/income-statement${query(filters)}`);
}

/* ------------------------------------------------------------------ Integracao */

export async function listPendingFinancialItems(): Promise<
  ApiResponse<{
    payables: Array<{
      financialType: string;
      financialId: number;
      title: string;
      amount: number;
      dueDate: string | null;
      status: string;
      settled: boolean;
    }>;
    receivables: Array<{
      financialType: string;
      financialId: number;
      title: string;
      amount: number;
      dueDate: string | null;
      status: string;
      settled: boolean;
    }>;
  }>
> {
  return apiClient.get("accounting/integration/pending");
}

export async function processFinancialEvent(payload: {
  financialType: "payable" | "receivable";
  financialId: number;
  eventType: string;
}): Promise<ApiResponse<{ created: boolean; entry: AccountingEntry | null }>> {
  return apiClient.post("accounting/integration/events", payload);
}

export async function listReconciliations(filters: {
  status?: string;
  financialType?: string;
} = {}): Promise<ApiResponse<AccountingReconciliation[]>> {
  const response = await apiClient.get<AccountingReconciliation[]>(
    `accounting/reconciliations${query(filters)}`
  );
  return { ...response, data: response.data || [] };
}

export async function reconcileFinancialItem(payload: {
  financialType: "payable" | "receivable";
  financialId: number;
  entryId?: number | null;
  status?: "reconciled" | "divergent";
  notes?: string;
}): Promise<ApiResponse<AccountingReconciliation>> {
  return apiClient.post<AccountingReconciliation>(
    "accounting/reconciliations",
    payload
  );
}

export async function unreconcileFinancialItem(
  id: number,
  reason: string
): Promise<ApiResponse<AccountingReconciliation>> {
  return apiClient.post<AccountingReconciliation>(
    `accounting/reconciliations/${id}/unreconcile`,
    { reason }
  );
}

/* --------------------------------------------------------------------- Ativos */

export async function listFixedAssets(filters: {
  status?: string;
  search?: string;
} = {}): Promise<ApiResponse<AccountingFixedAsset[]>> {
  const response = await apiClient.get<AccountingFixedAsset[]>(
    `accounting/assets${query(filters)}`
  );
  return { ...response, data: response.data || [] };
}

export async function createFixedAsset(payload: {
  code: string;
  description: string;
  category?: string;
  acquisitionDate: string;
  acquisitionAmount: number;
  residualAmount?: number;
  usefulLifeMonths: number;
  accountId?: number | null;
  depreciationAccountId?: number | null;
  costCenterId?: number | null;
  notes?: string;
}): Promise<ApiResponse<AccountingFixedAsset>> {
  return apiClient.post<AccountingFixedAsset>("accounting/assets", payload);
}

export async function listDepreciations(filters: {
  assetId?: number;
} = {}): Promise<ApiResponse<AccountingDepreciation[]>> {
  const response = await apiClient.get<AccountingDepreciation[]>(
    `accounting/depreciations${query(filters)}`
  );
  return { ...response, data: response.data || [] };
}

export async function runDepreciation(
  periodId: number
): Promise<
  ApiResponse<{
    processed: number;
    skipped: number;
    items: Array<{
      assetId: number;
      code: string;
      amount: number;
      accumulated: number;
      netBookValue: number;
    }>;
  }>
> {
  return apiClient.post(`accounting/periods/${periodId}/depreciation`);
}
