/**
 * services/accountingService.ts
 * Cliente do modulo de Contabilidade (extra contratado do Financeiro).
 *
 * As rotas exigem, no backend: sessao valida, modulo `contabil` disponivel,
 * contratacao ativa do extra e a permissao da acao. As mutacoes passam pelo
 * fluxo de reautenticacao por senha (modal de confirmacao de identidade).
 */

import { apiClient, ApiResponse } from "../api/client";
import { pickData } from "../api/payload";

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

/**
 * O backend contábil responde sempre `{ success: true, data: ... }`.
 * Desembrulhar aqui evita que as telas recebam um objeto onde esperam uma
 * lista (o que acionava o Error Boundary) e mantém os erros HTTP intactos.
 */
function accountingData<T>(
  response: ApiResponse<any>,
  label: string
): ApiResponse<T> {
  return pickData<T>(response, (body) => body?.data, label);
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
  return accountingData<AccountingAccount[]>(
    await apiClient.get(`accounting/accounts${query(filters)}`),
    "plano de contas"
  );
}

export async function createAccountingAccount(
  payload: Partial<AccountingAccount>
): Promise<ApiResponse<AccountingAccount>> {
  return accountingData<AccountingAccount>(
    await apiClient.post("accounting/accounts", payload),
    "conta contábil criada"
  );
}

export async function updateAccountingAccount(
  id: number,
  payload: Partial<AccountingAccount>
): Promise<ApiResponse<AccountingAccount>> {
  return accountingData<AccountingAccount>(
    await apiClient.put(`accounting/accounts/${id}`, payload),
    "conta contábil atualizada"
  );
}

export async function deleteAccountingAccount(
  id: number
): Promise<ApiResponse<{ deleted: boolean }>> {
  return accountingData<{ deleted: boolean }>(
    await apiClient.delete(`accounting/accounts/${id}`),
    "conta contábil removida"
  );
}

/* ---------------------------------------------------------- Centros de custo */

export async function listCostCenters(): Promise<ApiResponse<AccountingCostCenter[]>> {
  return accountingData<AccountingCostCenter[]>(
    await apiClient.get("accounting/cost-centers"),
    "centros de custo"
  );
}

export async function createCostCenter(
  payload: Partial<AccountingCostCenter>
): Promise<ApiResponse<AccountingCostCenter>> {
  return accountingData<AccountingCostCenter>(
    await apiClient.post("accounting/cost-centers", payload),
    "centro de custo criado"
  );
}

export async function updateCostCenter(
  id: number,
  payload: Partial<AccountingCostCenter>
): Promise<ApiResponse<AccountingCostCenter>> {
  return accountingData<AccountingCostCenter>(
    await apiClient.put(`accounting/cost-centers/${id}`, payload),
    "centro de custo atualizado"
  );
}

/* ------------------------------------------------------ Exercicios e periodos */

export async function listAccountingPeriods(
  filters: { year?: number; status?: string } = {}
): Promise<ApiResponse<AccountingPeriod[]>> {
  return accountingData<AccountingPeriod[]>(
    await apiClient.get(`accounting/periods${query(filters)}`),
    "períodos contábeis"
  );
}

export async function createAccountingPeriod(payload: {
  fiscalYear: number;
  fiscalMonth: number;
  name: string;
  startsAt: string;
  endsAt: string;
}): Promise<ApiResponse<AccountingPeriod>> {
  return accountingData<AccountingPeriod>(
    await apiClient.post("accounting/periods", payload),
    "período contábil criado"
  );
}

export async function closeAccountingPeriod(
  id: number,
  notes?: string
): Promise<ApiResponse<AccountingPeriod>> {
  return accountingData<AccountingPeriod>(
    await apiClient.post(`accounting/periods/${id}/close`, { notes }),
    "fechamento contábil"
  );
}

export async function reopenAccountingPeriod(
  id: number,
  notes: string
): Promise<ApiResponse<AccountingPeriod>> {
  return accountingData<AccountingPeriod>(
    await apiClient.post(`accounting/periods/${id}/reopen`, { notes }),
    "reabertura contábil"
  );
}

export async function lockAccountingPeriod(
  id: number,
  notes?: string
): Promise<ApiResponse<AccountingPeriod>> {
  return accountingData<AccountingPeriod>(
    await apiClient.post(`accounting/periods/${id}/lock`, { notes }),
    "bloqueio contábil"
  );
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
  const response = await apiClient.get<any>(
    `accounting/entries${query(filters)}`
  );
  const normalized = pickData<AccountingEntry[]>(
    response,
    (body) => (Array.isArray(body?.data) ? body.data : undefined),
    "lançamentos contábeis"
  );
  return {
    ...normalized,
    total: normalized.ok ? Number(response.data?.total) || 0 : 0,
  };
}

export async function getAccountingEntry(
  id: number
): Promise<ApiResponse<AccountingEntry>> {
  return accountingData<AccountingEntry>(
    await apiClient.get(`accounting/entries/${id}`),
    "lançamento contábil"
  );
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
  return accountingData<AccountingEntry>(
    await apiClient.post("accounting/entries", payload),
    "lançamento contábil criado"
  );
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
  return accountingData<AccountingEntry>(
    await apiClient.put(`accounting/entries/${id}`, payload),
    "lançamento contábil atualizado"
  );
}

export async function postAccountingEntry(
  id: number
): Promise<ApiResponse<AccountingEntry>> {
  return accountingData<AccountingEntry>(
    await apiClient.post(`accounting/entries/${id}/post`),
    "lançamento contábil"
  );
}

export async function reverseAccountingEntry(
  id: number,
  payload: { description?: string; notes?: string; entryDate?: string }
): Promise<ApiResponse<{ reversal: AccountingEntry; reversed: number }>> {
  return accountingData<{ reversal: AccountingEntry; reversed: number }>(
    await apiClient.post(`accounting/entries/${id}/reverse`, payload),
    "estorno contábil"
  );
}

export async function deleteAccountingEntry(
  id: number
): Promise<ApiResponse<{ deleted: boolean }>> {
  return accountingData<{ deleted: boolean }>(
    await apiClient.delete(`accounting/entries/${id}`),
    "lançamento contábil removido"
  );
}

/* --------------------------------------------------------------- Mapeamentos */

export async function listAccountingMappings(): Promise<ApiResponse<AccountingMapping[]>> {
  return accountingData<AccountingMapping[]>(
    await apiClient.get("accounting/mappings"),
    "mapeamentos contábeis"
  );
}

export async function saveAccountingMapping(payload: {
  eventType: string;
  debitAccountId: number;
  creditAccountId: number;
  costCenterId?: number | null;
  active?: boolean;
}): Promise<ApiResponse<AccountingMapping>> {
  return accountingData<AccountingMapping>(
    await apiClient.post("accounting/mappings", payload),
    "mapeamento contábil"
  );
}

export async function deleteAccountingMapping(
  id: number
): Promise<ApiResponse<{ deleted: boolean }>> {
  return accountingData<{ deleted: boolean }>(
    await apiClient.delete(`accounting/mappings/${id}`),
    "mapeamento contábil removido"
  );
}

/* ------------------------------------------------------------- Configuracoes */

export async function getAccountingSettings(): Promise<ApiResponse<AccountingSettings>> {
  return accountingData<AccountingSettings>(
    await apiClient.get("accounting/settings"),
    "configurações contábeis"
  );
}

export async function saveAccountingSettings(payload: {
  requireCostCenter?: boolean;
  allowManualPosting?: boolean;
  depreciationMethod?: string;
  notes?: string;
}): Promise<ApiResponse<AccountingSettings>> {
  return accountingData<AccountingSettings>(
    await apiClient.put("accounting/settings", payload),
    "configurações contábeis"
  );
}

/* ----------------------------------------------------------------- Relatorios */

export async function getAccountingDashboard(
  filters: { year?: number; from?: string; to?: string } = {}
): Promise<ApiResponse<AccountingDashboard>> {
  return accountingData<AccountingDashboard>(
    await apiClient.get(`accounting/dashboard${query(filters)}`),
    "painel contábil"
  );
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
  return accountingData(
    await apiClient.get(`accounting/reports/journal${query(filters)}`),
    "livro diário"
  );
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
  return accountingData(
    await apiClient.get(`accounting/reports/ledger${query(filters)}`),
    "livro razão"
  );
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
  return accountingData(
    await apiClient.get(`accounting/reports/trial-balance${query(filters)}`),
    "balancete"
  );
}

export async function getBalanceSheet(filters: {
  from: string;
  to: string;
  compareFrom?: string;
  compareTo?: string;
}): Promise<ApiResponse<any>> {
  return accountingData(
    await apiClient.get(`accounting/reports/balance-sheet${query(filters)}`),
    "balanço patrimonial"
  );
}

export async function getIncomeStatement(filters: {
  from: string;
  to: string;
  compareFrom?: string;
  compareTo?: string;
}): Promise<ApiResponse<any>> {
  return accountingData(
    await apiClient.get(`accounting/reports/income-statement${query(filters)}`),
    "demonstração do resultado"
  );
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
  return accountingData(
    await apiClient.get("accounting/integration/pending"),
    "pendências de integração contábil"
  );
}

export async function processFinancialEvent(payload: {
  financialType: "payable" | "receivable";
  financialId: number;
  eventType: string;
}): Promise<ApiResponse<{ created: boolean; entry: AccountingEntry | null }>> {
  return accountingData(
    await apiClient.post("accounting/integration/events", payload),
    "evento contábil"
  );
}

export async function listReconciliations(filters: {
  status?: string;
  financialType?: string;
} = {}): Promise<ApiResponse<AccountingReconciliation[]>> {
  return accountingData<AccountingReconciliation[]>(
    await apiClient.get(`accounting/reconciliations${query(filters)}`),
    "conciliações contábeis"
  );
}

export async function reconcileFinancialItem(payload: {
  financialType: "payable" | "receivable";
  financialId: number;
  entryId?: number | null;
  status?: "reconciled" | "divergent";
  notes?: string;
}): Promise<ApiResponse<AccountingReconciliation>> {
  return accountingData<AccountingReconciliation>(
    await apiClient.post("accounting/reconciliations", payload),
    "conciliação contábil"
  );
}

export async function unreconcileFinancialItem(
  id: number,
  reason: string
): Promise<ApiResponse<AccountingReconciliation>> {
  return accountingData<AccountingReconciliation>(
    await apiClient.post(`accounting/reconciliations/${id}/unreconcile`, {
      reason,
    }),
    "conciliação contábil"
  );
}

/* --------------------------------------------------------------------- Ativos */

export async function listFixedAssets(filters: {
  status?: string;
  search?: string;
} = {}): Promise<ApiResponse<AccountingFixedAsset[]>> {
  return accountingData<AccountingFixedAsset[]>(
    await apiClient.get(`accounting/assets${query(filters)}`),
    "ativos imobilizados"
  );
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
  return accountingData<AccountingFixedAsset>(
    await apiClient.post("accounting/assets", payload),
    "ativo imobilizado"
  );
}

export async function listDepreciations(filters: {
  assetId?: number;
} = {}): Promise<ApiResponse<AccountingDepreciation[]>> {
  return accountingData<AccountingDepreciation[]>(
    await apiClient.get(`accounting/depreciations${query(filters)}`),
    "depreciações contábeis"
  );
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
  return accountingData(
    await apiClient.post(`accounting/periods/${periodId}/depreciation`),
    "depreciação contábil"
  );
}
