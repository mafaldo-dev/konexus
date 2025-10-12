// purchaseApi.ts
import Swal from "sweetalert2";
import { apiRequest } from "../../api";
import { PurchaseOrder } from "../../../interfaces/sales/purchaseRequest";


/**
 * Cria uma solicitação de compra
 */
export const purchaseRequisition = async (order: PurchaseOrder): Promise<string> => {
  const tkn = localStorage.getItem("token")
  
  if (!tkn) {
    throw new Error("Token não encontrado. Faça login novamente.");
  }
  
  try {
    const response = await apiRequest("purchase/create", "POST", order, tkn as string);

    if (!response || !response.order) {
      throw new Error("Resposta inválida do servidor");
    }

    return response.order.id;
  } catch (error: any) {
    console.error("Erro ao criar solicitação de compra:", error.message || error);
    Swal.fire("Erro", error.message || "Erro ao criar solicitação de compra", "error");
    throw error
  }
};

/**
 * Recupera todas as solicitações de compra
 */
export const purchaseAllOrders = async (token?: string): Promise<PurchaseOrder[]> => {
  const tkn = localStorage.getItem("token")
  try {
    const response = await apiRequest("purchase/all", "GET", undefined, tkn as string);
    return response
  } catch (error: any) {
    console.error("Erro ao recuperar solicitações de compra:", error.message || error);
    Swal.fire("Erro", "Erro ao recuperar solicitações de compra", "error");
    return [];
  }
};
