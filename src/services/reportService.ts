/**
 * services/reportService.ts
 * Servico de relatorios (dominio: relatorios/dashboards).
 *
 * Regras:
 *  - Consome apenas endpoints reais do backend.
 *  - NAO retorna dados simulados (mock) em producao.
 *  - Quando um relatorio depende de endpoint inexistente, retorna erro
 *    estruturado em vez de valores ficticios.
 */

import { apiClient, ApiResponse } from "../api/client";

export interface SalesReport {
  totalSales: number;
  numberOfOrders: number;
  averageOrderValue: number;
}

export interface PurchaseReport {
  totalPurchases: number;
  numberOfInvoices: number;
  averageInvoiceValue: number;
}

export interface TopProduct {
  id: string;
  productId: string;
  name: string;
  quantity: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  totalSpent: number;
}

/**
 * Relatorio de vendas (com base em pedidos reais da empresa autenticada).
 */
export async function getSalesReport(): Promise<ApiResponse<SalesReport>> {
  const res = await apiClient.get<any[]>("orders/all");
  if (!res.ok || !res.data) {
    return {
      data: null,
      error: res.error || "Erro ao carregar pedidos para o relatorio.",
      status: res.status,
      ok: false,
    };
  }
  const orders = res.data;
  const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  return {
    data: {
      totalSales,
      numberOfOrders: orders.length,
      averageOrderValue: orders.length > 0 ? totalSales / orders.length : 0,
    },
    error: null,
    status: res.status,
    ok: true,
  };
}

/**
 * Relatorio de compras (com base em pedidos de compra reais da empresa autenticada).
 */
export async function getPurchaseReport(): Promise<ApiResponse<PurchaseReport>> {
  const res = await apiClient.get<any[]>("purchase/all");
  if (!res.ok || !res.data) {
    return {
      data: null,
      error: res.error || "Erro ao carregar pedidos de compra para o relatorio.",
      status: res.status,
      ok: false,
    };
  }
  const orders = res.data;
  const totalPurchases = orders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
  return {
    data: {
      totalPurchases,
      numberOfInvoices: orders.length,
      averageInvoiceValue:
        orders.length > 0 ? totalPurchases / orders.length : 0,
    },
    error: null,
    status: res.status,
    ok: true,
  };
}

/**
 * Produtos mais vendidos (com base nos pedidos reais).
 */
export async function getTopProducts(): Promise<ApiResponse<TopProduct[]>> {
  const res = await apiClient.get<any[]>("orders/all");
  if (!res.ok || !res.data) {
    return { data: null, error: res.error, status: res.status, ok: false };
  }
  const productsMap = new Map<string, TopProduct>();
  for (const order of res.data) {
    for (const item of (order.orderItems || [])) {
      const key = String(item.productId);
      if (productsMap.has(key)) {
        const cur = productsMap.get(key)!;
        cur.quantity += item.quantity || 0;
      } else {
        productsMap.set(key, {
          id: key,
          productId: key,
          name: item.productName || `Produto ${key}`,
          quantity: item.quantity || 0,
        });
      }
    }
  }
  const sorted = Array.from(productsMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
  return { data: sorted, error: null, status: res.status, ok: true };
}
