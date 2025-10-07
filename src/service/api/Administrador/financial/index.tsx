import { apiRequest } from "../../api"
import { OrderResponse } from "../../../interfaces"

export default async function handleOrderSales(id?: string, token?: string): Promise<OrderResponse[]> {
  try {
    let response;
    
    if (id) {
      // Buscar pedido específico
      response = await apiRequest(`orders/${id}`, "GET", undefined, token)
      return response.order || null
    } else {
      // Buscar todos os pedidos
      response = await apiRequest("orders/all", "GET", undefined, token)
      return response.orders || response || []
    }
  } catch (error) {
    console.error("Erro ao recuperar pedidos", error)
    throw new Error("Erro ao carregar pedidos")
  }
}

export async function updateOrderStatus(id: string, status: string, token?: string): Promise<any> {
  try {
    const response = await apiRequest(`orders/${id}/status`, "PUT", { orderStatus: status }, token)
    return response
  } catch (error) {
    console.error("Erro ao atualizar status do pedido", error)
    throw new Error("Erro ao atualizar status")
  }
}