/**
 * services/invoiceService.ts
 * Serviço de notas fiscais de entrada (domínio: estoque/NF-e).
 * Endpoints reais do backend:
 *   POST /invoice/create
 *   GET  /invoice/in/:order_id
 */

import { apiClient, ApiResponse } from "../api/client";

export interface Invoice {
  id: number;
  order_id: number;
  invoice_number: string;
  issue_date?: string | null;
  total_value: number;
  xml_path?: string | null;
  status: string;
  companyId: number;
  createdAt?: string;
}

export interface InvoiceData {
  order_id: number;
  invoice_number: string;
  issue_date?: string;
  total_value?: number;
  xml_path?: string;
  status?: string;
}

/**
 * Registra uma nota fiscal de entrada (baixa no estoque + kardex via backend).
 */
export async function createInvoice(
  data: InvoiceData
): Promise<ApiResponse<Invoice>> {
  return apiClient.post<Invoice>("invoice/create", data);
}

/**
 * Lista notas fiscais de um pedido (restrito à empresa).
 */
export async function getInvoicesByOrder(
  orderId: number | string
): Promise<ApiResponse<Invoice[]>> {
  return apiClient.get<Invoice[]>(`invoice/in/${orderId}`);
}
