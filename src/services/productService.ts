/**
 * services/productService.ts
 * Serviço de produtos (domínio: gestão/estoque).
 * Endpoints reais do backend:
 *   POST /products/create
 *   GET  /products/all
 *   GET  /products/:id
 *   PUT  /products/:id
 *   PUT  /products/:id/stock
 *   DELETE /products/:id
 */

import { apiClient, ApiResponse } from "../api/client";
import { asList, asObject } from "../api/payload";

export interface Product {
  id: number;
  name: string;
  code: string;
  price: number;
  coast: number;
  stock: number;
  description: string;
  location: string;
  minimum_stock: number;
  brand: string;
  supplier_id: number;
  category: string;
  companyId: number;
  ncm?: string;
  cfop?: string;
  unidade?: string;
  origem?: string | number;
  supplier_name?: string;
  supplier_code?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
}

/**
 * Lista produtos da empresa autenticada.
 */
export async function listProducts(
  filters: ProductFilters = {}
): Promise<ApiResponse<Product[]>> {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", String(filters.page));
  if (filters.limit) params.append("limit", String(filters.limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return asList<Product>(
    await apiClient.get(`products/all${query}`),
    ["products", "data"],
    "produtos"
  );
}

/**
 * Busca produto pelo ID (restrito à empresa).
 */
export async function getProductById(
  id: number | string
): Promise<ApiResponse<Product>> {
  return asObject<Product>(
    await apiClient.get(`products/${id}`),
    ["product"],
    "produto"
  );
}

/**
 * Cria um produto (companyId definido pelo backend pelo token).
 */
export async function createProduct(
  data: Omit<Product, "id" | "createdAt" | "updatedAt" | "stock">
): Promise<ApiResponse<Product>> {
  return asObject<Product>(
    await apiClient.post("products/create", data),
    ["product"],
    "produto criado"
  );
}

/**
 * Atualiza um produto (campos parciais).
 */
export async function updateProduct(
  id: number | string,
  data: Partial<Product>
): Promise<ApiResponse<Product>> {
  return asObject<Product>(
    await apiClient.put(`products/${id}`, data),
    ["product"],
    "produto atualizado"
  );
}

/**
 * Atualiza o estoque de um produto.
 */
export async function updateProductStock(
  id: number | string,
  quantity: number
): Promise<ApiResponse<Product>> {
  return asObject<Product>(
    await apiClient.put(`products/${id}/stock`, { quantity }),
    ["product"],
    "estoque do produto"
  );
}

/**
 * Exclui um produto (restrito à empresa).
 */
export async function deleteProduct(
  id: number | string
): Promise<ApiResponse<{ id: number; name: string }>> {
  return apiClient.delete(`products/${id}`);
}
