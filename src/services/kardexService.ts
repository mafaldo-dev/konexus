/**
 * services/kardexService.ts
 * Serviço de Kardex / estoque (domínio: estoque).
 * Endpoints reais do backend:
 *   POST /kardex/create
 *   GET  /kardex/products/:productId
 *   GET  /kardex/orders/:orderId
 *
 * O backend NAO expõe /orders/:id/kardex. Chamadas antigas corrigidas aqui.
 *
 * Observacao sobre o formato: as consultas do backend usam identificadores
 * sem aspas no PostgreSQL, portanto as chaves retornadas sao minusculas
 * (movementtype, unitprice, movementdate, ordernumber, stockbefore...).
 */

import { apiClient, ApiResponse } from "../api/client";
import { asList, asObject, pickData } from "../api/payload";

export interface KardexMovement {
  id: number;
  movementtype: "entrada" | "saida" | "produção";
  quantity: number;
  unitprice?: number | string;
  movementdate: string;
  orderid?: number;
  ordernumber?: string;
  invoicenumber?: string;
  documenttype?: string;
  productname?: string;
  productcode?: string;
  stockbefore?: number;
  stockafter?: number;
}

export interface KardexByProduct {
  product: { id: number; name: string; stock: number };
  movements: KardexMovement[];
}

export interface KardexData {
  productId: number;
  orderId?: number;
  movementType: "entrada" | "saida" | "produção";
  quantity: number;
  unitPrice?: number;
  companyId: number;
}

/**
 * Registra uma movimentação de estoque no Kardex.
 */
export async function createKardexMovement(
  data: KardexData
): Promise<ApiResponse<KardexMovement>> {
  return asObject<KardexMovement>(
    await apiClient.post<any>("kardex/create", data),
    ["kardex", "data"],
    "movimentação de estoque"
  );
}

/**
 * Busca movimentações do Kardex por produto (restrito à empresa).
 */
export async function getKardexByProduct(
  productId: number | string
): Promise<ApiResponse<KardexByProduct>> {
  const response = await apiClient.get<any>(`kardex/products/${productId}`);
  return pickData<KardexByProduct>(
    response,
    (body) => {
      if (
        !body ||
        typeof body !== "object" ||
        !Array.isArray(body.movements) ||
        typeof body.product !== "object"
      ) {
        return undefined;
      }
      return { product: body.product, movements: body.movements };
    },
    "movimentações do produto"
  );
}

/**
 * Busca movimentações do Kardex por pedido (restrito à empresa).
 */
export async function getKardexByOrder(
  orderId: number | string
): Promise<ApiResponse<KardexMovement[]>> {
  return asList<KardexMovement>(
    await apiClient.get<any>(`kardex/orders/${orderId}`),
    ["movements", "data"],
    "movimentações do pedido"
  );
}
