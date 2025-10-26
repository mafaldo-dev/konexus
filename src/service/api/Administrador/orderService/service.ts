import { OrderService } from "../../../interfaces/stock/service";
import { apiRequest } from "../../api";

export const insertOrderOfService = async (order: OrderService, token?: string): Promise<any> => {
  const tkn = localStorage.getItem("token")
    try {
    const orderData = {
      ...order,
      orderStatus: order.orderStatus || 'initialized'
    };


    const response = await apiRequest("service/create", "POST", orderData, token || tkn as string);

    if (!response) {
      console.error("Erro ao criar pedido: resposta inválida");
      return null;
    }
    
    if (response.order && response.order.id) {
      return response;
    } else {
      console.warn("⚠️ API retornou sucesso mas order está incompleta:", response);
      return response;
    }
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return null;
  }
};

export const handleAllOrderServices = async(token?: string) => {
  try {
    const response = await apiRequest("service/all", "GET", undefined, token)
    console.log(response)
    return response
  }catch(err){
    console.error("Erro ao recuperar lista de orders", err)
    throw new Error("Erro interno do servidor!")
  }
}