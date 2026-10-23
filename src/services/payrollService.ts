import { apiClient, ApiResponse } from "../api/client";
import { asList, asObject, pickData } from "../api/payload";

export type PayrollRubricKind = "earning" | "deduction";
export type PayrollCalculationType = "fixed" | "percentage";
export type PayrollStatus = "open" | "calculated" | "approved" | "closed";

export interface PayrollRubricVersion {
  id: number;
  rubric_id: number;
  version: number;
  calculation_type: PayrollCalculationType;
  rate?: number | null;
  fixed_amount?: number | null;
  source_note: string;
  source_url?: string | null;
  effective_from: string;
  effective_to?: string | null;
}

export interface PayrollRubric {
  id: number;
  code: string;
  name: string;
  kind: PayrollRubricKind;
  active: boolean;
  version_id?: number | null;
  version?: number | null;
  calculation_type?: PayrollCalculationType | null;
  rate?: number | null;
  fixed_amount?: number | null;
  source_note?: string | null;
  effective_from?: string | null;
  effective_to?: string | null;
  version_count: number;
  versions?: PayrollRubricVersion[];
}

export interface PayrollCompensationRow {
  employment_link_id: number;
  contributor_id: number;
  legal_entity_id: number;
  position_title?: string | null;
  department?: string | null;
  link_status: string;
  contributor_name: string;
  legal_name: string;
  trade_name?: string | null;
  cnpj: string;
  compensation_id?: number | null;
  base_salary?: number | null;
  currency?: string | null;
  effective_from?: string | null;
  source_note?: string | null;
}

export interface PayrollEntryItem {
  id: number;
  rubric_code?: string | null;
  name: string;
  kind: PayrollRubricKind;
  quantity: number;
  reference_amount?: number | null;
  amount: number;
  source: string;
  source_note?: string | null;
}

export interface PayrollEntry {
  id: number;
  contributor_id: number;
  contributor_name: string;
  employment_link_id: number;
  position_title?: string | null;
  department?: string | null;
  legal_name: string;
  cnpj: string;
  base_salary: number;
  gross_amount: number;
  deductions_amount: number;
  net_amount: number;
  items: PayrollEntryItem[];
}

export interface PayrollEvent {
  id: number;
  rubric_id: number;
  employment_link_id?: number | null;
  rubric_code: string;
  rubric_name: string;
  rubric_kind: PayrollRubricKind;
  quantity: number;
  reference_amount?: number | null;
  notes?: string | null;
}

export interface PayrollCompetency {
  id: number;
  legal_entity_id: number;
  label: string;
  period_start: string;
  period_end: string;
  status: PayrollStatus;
  gross_total: number;
  deductions_total: number;
  net_total: number;
  employee_count: number;
  payment_account_id?: number | null;
  financial_posted_at?: string | null;
  calculated_at?: string | null;
  approved_at?: string | null;
  closed_at?: string | null;
  entries?: PayrollEntry[];
  events?: PayrollEvent[];
}

export interface PayrollRubricInput {
  code: string;
  name: string;
  kind: PayrollRubricKind;
  calculationType: PayrollCalculationType;
  rate?: number | string;
  fixedAmount?: number | string;
  sourceNote: string;
  sourceUrl?: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

const base = "rh/payroll";

export async function listPayrollRubrics(): Promise<ApiResponse<PayrollRubric[]>> {
  return asList<PayrollRubric>(
    await apiClient.get(`${base}/rubrics`),
    ["data"],
    "rubricas da folha"
  );
}

export async function getPayrollRubric(
  id: number | string
): Promise<ApiResponse<PayrollRubric>> {
  return asObject<PayrollRubric>(
    await apiClient.get(`${base}/rubrics/${id}`),
    ["data"],
    "rubrica da folha"
  );
}

export async function createPayrollRubric(
  payload: PayrollRubricInput
): Promise<ApiResponse<PayrollRubric>> {
  return asObject<PayrollRubric>(
    await apiClient.post(`${base}/rubrics`, payload),
    ["data"],
    "rubrica criada"
  );
}

export async function addPayrollRubricVersion(
  id: number | string,
  payload: Omit<PayrollRubricInput, "code" | "name" | "kind">
): Promise<ApiResponse<PayrollRubricVersion>> {
  return asObject<PayrollRubricVersion>(
    await apiClient.post(`${base}/rubrics/${id}/versions`, payload),
    ["data"],
    "nova versão da rubrica"
  );
}

export async function listPayrollCompensations(): Promise<
  ApiResponse<PayrollCompensationRow[]>
> {
  return asList<PayrollCompensationRow>(
    await apiClient.get(`${base}/compensations`),
    ["data"],
    "remunerações da folha"
  );
}

export async function upsertPayrollCompensation(payload: {
  employmentLinkId: number | string;
  baseSalary: number | string;
  effectiveFrom: string;
  sourceNote: string;
}): Promise<ApiResponse<PayrollCompensationRow>> {
  return asObject<PayrollCompensationRow>(
    await apiClient.put(`${base}/compensations`, payload),
    ["data"],
    "remuneração salva"
  );
}

export async function listPayrollCompetencies(
  status?: string
): Promise<ApiResponse<PayrollCompetency[]>> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return asList<PayrollCompetency>(
    await apiClient.get(`${base}/competencies${query}`),
    ["data"],
    "competências da folha"
  );
}

export async function createPayrollCompetency(
  label: string
): Promise<ApiResponse<PayrollCompetency>> {
  return asObject<PayrollCompetency>(
    await apiClient.post(`${base}/competencies`, { label }),
    ["data"],
    "competência da folha"
  );
}

export async function getPayrollCompetency(
  id: number | string
): Promise<ApiResponse<PayrollCompetency>> {
  return asObject<PayrollCompetency>(
    await apiClient.get(`${base}/competencies/${id}`),
    ["data"],
    "competência da folha"
  );
}

export async function reopenPayrollCompetency(
  id: number | string
): Promise<ApiResponse<PayrollCompetency>> {
  return asObject<PayrollCompetency>(
    await apiClient.post(`${base}/competencies/${id}/reopen`),
    ["data"],
    "reabertura da competência"
  );
}

export async function createPayrollEvent(
  competencyId: number | string,
  payload: {
    rubricId: number | string;
    employmentLinkId?: number | string | null;
    quantity: number | string;
    referenceAmount?: number | string | null;
    notes?: string;
  }
): Promise<ApiResponse<PayrollEvent>> {
  return asObject<PayrollEvent>(
    await apiClient.post(`${base}/competencies/${competencyId}/events`, payload),
    ["data"],
    "evento da folha"
  );
}

export async function deletePayrollEvent(
  competencyId: number | string,
  eventId: number | string
): Promise<ApiResponse<{ id: number }>> {
  return pickData(
    await apiClient.delete(`${base}/competencies/${competencyId}/events/${eventId}`),
    (body) => body?.data,
    "remoção do evento"
  );
}

export async function calculatePayroll(
  id: number | string
): Promise<ApiResponse<PayrollCompetency>> {
  return asObject<PayrollCompetency>(
    await apiClient.post(`${base}/competencies/${id}/calculate`),
    ["data"],
    "cálculo da folha"
  );
}

export async function approvePayroll(
  id: number | string
): Promise<ApiResponse<PayrollCompetency>> {
  return asObject<PayrollCompetency>(
    await apiClient.post(`${base}/competencies/${id}/approve`),
    ["data"],
    "aprovação da folha"
  );
}

export async function closePayroll(
  id: number | string
): Promise<ApiResponse<PayrollCompetency>> {
  return asObject<PayrollCompetency>(
    await apiClient.post(`${base}/competencies/${id}/close`),
    ["data"],
    "fechamento da folha"
  );
}

export async function postPayrollToFinance(
  id: number | string
): Promise<ApiResponse<{
  competency: PayrollCompetency;
  paymentAccountId: number;
  replayed: boolean;
}>> {
  return pickData(
    await apiClient.post(`${base}/competencies/${id}/post-finance`),
    (body) => body?.data,
    "integração financeira da folha"
  );
}
