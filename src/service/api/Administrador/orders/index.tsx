import { apiRequest } from "../../api";
import { Order, Customer, OrderResponse } from "../../../interfaces";


export const getLastOrderNumber = async (token?: string): Promise<string> => {
  try {
    const response = await apiRequest("orders/last-number", "GET", undefined, token);
  
    
    if (!response || !response.lastOrderNumber) {
      return "100"; 
    }
    return response.lastOrderNumber.toString(); 
  } catch (error) {
    console.error("Erro ao buscar último número do pedido:", error);
    return "100";
  }
};

export const generateNextOrderNumber = (lastOrderNumber: string): string => {

  if (typeof lastOrderNumber === 'number') {
    return `P-${lastOrderNumber + 1}`;
  }
  
  const match = lastOrderNumber.match(/P-(\d+)/);
  if (match && match[1]) {
    const nextNumber = parseInt(match[1]) + 1;
    return `P-${nextNumber}`;
  }
  
  if (!isNaN(Number(lastOrderNumber))) {
    return `P-${parseInt(lastOrderNumber) + 1}`;
  }
  
  return "P-100";
};

export const getNextOrderNumber = async (token?: string): Promise<string> => {
  try {
    const lastOrderNumber = await getLastOrderNumber(token);
   
    const nextOrderNumber = generateNextOrderNumber(lastOrderNumber);
    
    return nextOrderNumber;
  } catch (error) {
    console.error("Erro ao gerar próximo número do pedido:", error);
    return "P-100"; 
};

}
export const getCustomers = async (token?: string): Promise<Customer[]> => {
  try {
    const response = await apiRequest("orders/customers/list", "GET", undefined, token);
    if (!response || !response.customers) return [];
    return response.customers;
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return [];
  }
};

export const insertOrder = async (order: Order, token?: string): Promise<any> => {
  try {
    const orderData = {
      ...order,
      orderStatus: order.orderStatus || 'pending'
    };


    const response = await apiRequest("orders/create", "POST", orderData, token);

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

export const handleAllOrders = async (token?: string): Promise<OrderResponse[]> => {
  const tkn = token || localStorage.getItem('token');
  
  try {
    const response = await apiRequest("orders/all", "GET", undefined, tkn as string);

    const orders = (response as any)?.orders || response || [];
    
    if (!Array.isArray(orders)) {
      console.warn("Orders não é um array:", orders);
      return [];
    }
    
    return orders;
  } catch (error) {
    console.error("Erro ao recuperar pedidos:", error);
    return [];
  }
};


export const getOrderById = async (orderId: string | number, token?: string): Promise<Order | null> => {
  try {
    const response = await apiRequest(`orders/${orderId}`, "GET", undefined, token);
    if (!response || !response.order) return null;
    return response.order;
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    return null;
  }
};

export const updateOrderStatus = async (
  orderId: number | string,
  orderStatus: string,
  token?: string,
  extraData?: { totalVolumes?: number; totalWeight?: number }
): Promise<any> => {
  try {
    const body = { orderStatus, ...extraData }; 
    const response = await apiRequest(`orders/${orderId}/status`, "PUT", body, token);
    return response;
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error);
    return null;
  }
};


/**
 * Cancela um pedido e atualiza o estoque automaticamente
 */
export const handleCancelOrder = async (orderId: number | string, token?: string): Promise<any> => {
  try {
    const tkn = token || localStorage.getItem("token");
    const response = await apiRequest(`orders/${orderId}/cancel`, "PATCH", undefined, tkn as string);
    if (response?.message) {
      console.info("✅ Pedido cancelado com sucesso:", response.message);
    }
    return response;
  } catch (error: any) {
    console.error("❌ Erro ao cancelar pedido:", error);
    throw new Error(error.response?.data?.error || "Erro ao cancelar pedido.");
  }
};


export const deleteOrder = async (orderId: number | string, token?: string): Promise<boolean> => {
  try {
    const response = await apiRequest(`orders/${orderId}`, "DELETE", undefined, token);
    return !!response;
  } catch (error) {
    console.error("Erro ao deletar pedido:", error);
    return false;
  }
};

// service/api/Administrador/orders.ts
export const updateOrder = async (orderId: number, order: Order, token?: string): Promise<any> => {
  try {
    const response = await apiRequest(`orders/${orderId}`, "PUT", order, token);
    
    if (!response) {
      console.error("Erro ao atualizar pedido: resposta inválida");
      return null;
    }
    
    return response;
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    return null;
  }
};

export const getOrderForEdit = async (orderId: string, token?: string): Promise<any> => {
  try {
    
    const response = await apiRequest(`orders/edit/${orderId}`, "GET", null, token);
    
    if (!response) {
      console.error("Erro ao buscar pedido para edição: resposta inválida");
      return null;
    }
    
    return response;
  } catch (error) {
    console.error("Erro ao buscar pedido para edição:", error);
    return null;
  }
};