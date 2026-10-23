import { apiClient, ApiResponse } from "../api/client";
import { pickData } from "../api/payload";

export type CashFlowGranularity = "day" | "week" | "month";

export interface CashFlowSummary {
  openingBalance: number;
  realizedCredits: number;
  realizedDebits: number;
  realizedNet: number;
  closingBalance: number;
  forecastCredits: number;
  forecastDebits: number;
  forecastNet: number;
  projectedBalance: number;
}

export interface CashFlowSeriesItem {
  key: string;
  startDate: string;
  endDate: string;
  opening: number;
  credits: number;
  debits: number;
  net: number;
  closing: number;
  forecastCredits: number;
  forecastDebits: number;
  forecastNet: number;
  projectedClosing: number;
}

export interface CashFlowDetail {
  id: number;
  date: string;
  amount: number;
  direction?: "credit" | "debit";
  kind?: "receivable" | "payable";
  description?: string;
  category?: string | null;
  status?: string;
  document?: string;
  party?: string;
  bank_name?: string;
  agency?: string;
  account_number?: string;
}

export interface CashFlowSettled {
  receivables: { count: number; total: number };
  payables: { count: number; total: number };
  note: string;
}

export interface CashFlowResponse {
  period: {
    from: string;
    to: string;
    granularity: CashFlowGranularity;
  };
  summary: CashFlowSummary;
  series: CashFlowSeriesItem[];
  daily: Array<{
    date: string;
    opening: number;
    credits: number;
    debits: number;
    net: number;
    closing: number;
    forecastCredits: number;
    forecastDebits: number;
    forecastNet: number;
    projectedClosing: number;
  }>;
  details: {
    realized: CashFlowDetail[];
    forecast: CashFlowDetail[];
  };
  settled: CashFlowSettled;
  categories: Array<{
    category: string;
    direction: "credit" | "debit";
    total: number;
  }>;
}

export interface CashFlowFilters {
  from?: string;
  to?: string;
  granularity?: CashFlowGranularity;
  accountId?: number | string;
}

const base = "finance/cash-flow";

export async function getCashFlow(
  filters: CashFlowFilters
): Promise<ApiResponse<CashFlowResponse>> {
  const params = new URLSearchParams();
  if (filters.from) params.append("from", filters.from);
  if (filters.to) params.append("to", filters.to);
  if (filters.granularity) params.append("granularity", filters.granularity);
  if (filters.accountId) params.append("accountId", String(filters.accountId));
  const query = params.toString() ? `?${params.toString()}` : "";
  return pickData<CashFlowResponse>(
    await apiClient.get(`${base}${query}`),
    (body) => body?.data,
    "fluxo de caixa"
  );
}
