import { OrderService } from "../../../interfaces/stock/service";
import { apiRequest } from "../../api";

export const insertOrderOfService = async (order: OrderService, token?: string): Promise<any> => {
  const tkn = localStorage.getItem("token")
    try {
    const orderData = {
      ...order,
      orderStatus: order.orderStatus || 'iniciada'
    };

    const response = await apiRequest("service/create", "POST", orderData, token || tkn as string);
    console.log("response do service api =>",response)

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
    return response.data
  }catch(err){
    console.error("Erro ao recuperar lista de orders", err)
    throw new Error("Erro interno do servidor!")
  }
}

export const handleOrderServiceById = async (id?: string, token?: string) => {
  const storedToken = localStorage.getItem("token");
  const authToken = token || storedToken;

  if (!authToken) {
    console.error("Token não encontrado!");
    throw new Error("Token de autenticação ausente");
  }

  if (!id) {
    console.error("ID da ordem não fornecido!");
    throw new Error("ID da ordem é obrigatório");
  }

  try {
    const response = await apiRequest(
      `service/${id}/os`,
      "GET",
      undefined,
      authToken
    );
    return response;
  } catch (err) {
    console.error("Erro ao recuperar ordem de serviço:", err);
    throw new Error("Erro interno do servidor!");
  }
};

export const handleUpdateOrderServiceStatus = async(id: string, orderStatus: string, token?: string) => {
  const tkn = localStorage.getItem("token")
  try{
    const body =  { orderStatus }
    const response  = apiRequest(`service/${id}/os`, "PATCH", body, token || tkn as string)

    if(!response) {
      console.warn("Erro: Não foi possivel atualizar o status!")
    }
    return response
  }catch(err) {
    console.error("Erro ao atualizar o status da Order de serviço:", err)
    throw new Error("Erro interno do servidor!")
  }
}
