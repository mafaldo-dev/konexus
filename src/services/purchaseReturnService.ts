import { apiClient, ApiResponse } from "../api/client";
import { asList, asObject, pickData } from "../api/payload";

export type PurchaseReturnStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "received"
  | "cancelled";

export interface PurchaseReturnItem {
  id: number;
  purchase_order_item_id: number;
  product_id: number;
  product_name: string;
  product_code?: string;
  quantity: number;
  unit_cost: number;
  total_amount: number;
  original_quantity?: number;
  consumed_by_others?: number;
}

export interface PurchaseReturnEvent {
  id: number;
  event_type: string;
  from_status?: string | null;
  to_status?: string | null;
  actor_username?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface PurchaseReturn {
  id: number;
  return_number: string;
  purchase_order_id: number;
  ordernumber: string;
  supplier_id: number;
  supplier_name: string;
  supplier_document?: string | null;
  status: PurchaseReturnStatus;
  reason: string;
  notes?: string | null;
  total_amount: number;
  requires_nfe: boolean;
  fiscal_status: string;
  financial_credit_registered?: boolean;
  created_at: string;
  approved_at?: string | null;
  received_at?: string | null;
  items?: PurchaseReturnItem[];
  events?: PurchaseReturnEvent[];
  credit?: {
    id: number;
    amount: number;
    source_note?: string | null;
    created_at: string;
  } | null;
}

export interface EligiblePurchaseOrder {
  id: number;
  ordernumber: string;
  orderdate: string;
  orderstatus: string;
  supplierid: number;
  supplier_name: string;
  item_count: number;
}

export interface EligibleOrderItem {
  id: number;
  productid: number;
  product_name: string;
  product_code?: string;
  quantity: number;
  coast: number;
  consumed_quantity: number;
  eligible_quantity: number;
}

export interface EligibleOrderDetail extends EligiblePurchaseOrder {
  supplier_document?: string | null;
  items: EligibleOrderItem[];
}

export interface PurchaseReturnSummary {
  drafts: number;
  pendingApproval: number;
  approved: number;
  received: number;
  totalValue: number;
}

export interface PurchaseReturnInput {
  purchaseOrderId: number | string;
  reason: string;
  notes?: string;
  requiresNfe?: boolean;
  idempotencyKey?: string;
  items: Array<{ purchaseOrderItemId: number | string; quantity: number }>;
}

const base = "purchase/returns";

export async function listPurchaseReturns(filters: {
  status?: string;
  search?: string;
} = {}): Promise<ApiResponse<PurchaseReturn[]>> {
  const params = new URLSearchParams({ limit: "100" });
  if (filters.status) params.append("status", filters.status);
  if (filters.search) params.append("search", filters.search);
  return asList<PurchaseReturn>(
    await apiClient.get(`${base}?${params.toString()}`),
    ["data"],
    "devoluções de compra"
  );
}

export async function getPurchaseReturnSummary(): Promise<
  ApiResponse<PurchaseReturnSummary>
> {
  return pickData<PurchaseReturnSummary>(
    await apiClient.get(`${base}/summary`),
    (body) => body?.data,
    "resumo de devoluções"
  );
}

export async function getPurchaseReturn(
  id: number | string
): Promise<ApiResponse<PurchaseReturn>> {
  return asObject<PurchaseReturn>(
    await apiClient.get(`${base}/${id}`),
    ["data"],
    "devolução de compra"
  );
}

export async function listEligiblePurchaseOrders(search = ""): Promise<
  ApiResponse<EligiblePurchaseOrder[]>
> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return asList<EligiblePurchaseOrder>(
    await apiClient.get(`${base}/orders${query}`),
    ["data"],
    "pedidos elegíveis para devolução"
  );
}

export async function getEligiblePurchaseOrder(
  orderId: number | string
): Promise<ApiResponse<EligibleOrderDetail>> {
  return asObject<EligibleOrderDetail>(
    await apiClient.get(`${base}/orders/${orderId}`),
    ["data"],
    "itens do pedido de compra"
  );
}

export async function createPurchaseReturn(
  payload: PurchaseReturnInput
): Promise<ApiResponse<PurchaseReturn>> {
  return asObject<PurchaseReturn>(
    await apiClient.post(base, payload),
    ["data"],
    "devolução criada"
  );
}

export async function updatePurchaseReturn(
  id: number | string,
  payload: Omit<PurchaseReturnInput, "purchaseOrderId" | "idempotencyKey">
): Promise<ApiResponse<PurchaseReturn>> {
  return asObject<PurchaseReturn>(
    await apiClient.patch(`${base}/${id}`, payload),
    ["data"],
    "devolução atualizada"
  );
}

export async function submitPurchaseReturn(
  id: number | string
): Promise<ApiResponse<PurchaseReturn>> {
  return asObject<PurchaseReturn>(
    await apiClient.post(`${base}/${id}/submit`),
    ["data"],
    "envio da devolução"
  );
}

export async function approvePurchaseReturn(
  id: number | string,
  notes?: string
): Promise<ApiResponse<PurchaseReturn>> {
  return asObject<PurchaseReturn>(
    await apiClient.post(`${base}/${id}/approve`, { notes }),
    ["data"],
    "aprovação da devolução"
  );
}

export async function rejectPurchaseReturn(
  id: number | string,
  reason: string
): Promise<ApiResponse<PurchaseReturn>> {
  return asObject<PurchaseReturn>(
    await apiClient.post(`${base}/${id}/reject`, { reason }),
    ["data"],
    "rejeição da devolução"
  );
}

export async function cancelPurchaseReturn(
  id: number | string,
  reason?: string
): Promise<ApiResponse<PurchaseReturn>> {
  return asObject<PurchaseReturn>(
    await apiClient.post(`${base}/${id}/cancel`, { reason }),
    ["data"],
    "cancelamento da devolução"
  );
}

export async function receivePurchaseReturn(
  id: number | string
): Promise<ApiResponse<PurchaseReturn>> {
  return asObject<PurchaseReturn>(
    await apiClient.post(`${base}/${id}/receive`),
    ["data"],
    "recebimento da devolução"
  );
}

export async function registerPurchaseReturnCredit(
  id: number | string,
  sourceNote?: string
): Promise<ApiResponse<PurchaseReturn & { replayed: boolean }>> {
  return asObject<PurchaseReturn & { replayed: boolean }>(
    await apiClient.post(`${base}/${id}/financial-credit`, { sourceNote }),
    ["data"],
    "crédito da devolução"
  );
}
