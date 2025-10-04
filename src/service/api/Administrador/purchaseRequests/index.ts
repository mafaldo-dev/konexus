// purchaseApi.ts
import Swal from "sweetalert2";
import { apiRequest } from "../../api";
import { PurchaseRequest } from "../../../interfaces";

/**
 * Cria uma solicitação de compra
 */
export const purchaseRequisition = async (order: PurchaseRequest, token?: string): Promise<string | null> => {
  try {
    const response = await apiRequest("purchase-orders", "POST", order, token);
    if (!response || !response.purchaseOrder) {
      console.error("Erro ao criar solicitação de compra: resposta inválida");
      return null;
    }
    return response.purchaseOrder.id;
  } catch (error: any) {
    console.error("Erro ao criar solicitação de compra:", error.message || error);
    Swal.fire("Erro", error.message || "Erro ao criar solicitação de compra", "error");
    return null;
  }
};

/**
 * Recupera todas as solicitações de compra
 */
export const purchaseAllOrders = async (token?: string): Promise<PurchaseRequest[]> => {
  try {
    const response = await apiRequest("purchase-orders", "GET", undefined, token);
    return response?.purchaseOrders || [];
  } catch (error: any) {
    console.error("Erro ao recuperar solicitações de compra:", error.message || error);
    Swal.fire("Erro", "Erro ao recuperar solicitações de compra", "error");
    return [];
  }
};
