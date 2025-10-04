// ordersApi.ts
import { apiRequest } from "../../api";
import { Order, Customer, OrderResponse } from "../../../interfaces";

/**
 * Busca o último orderNumber do backend - CORRIGIDO
 */
export const getLastOrderNumber = async (token?: string): Promise<string> => {
  try {
    const response = await apiRequest("orders/last-number", "GET", undefined, token);
   // console.log("Resposta do last-number:", response);
    
    if (!response || !response.lastOrderNumber) {
      return "100"; // Fallback como STRING
    }
    return response.lastOrderNumber.toString(); // Garantir que seja string
  } catch (error) {
    console.error("Erro ao buscar último número do pedido:", error);
    return "100"; // Fallback como STRING
  }
};

/**
 * Gera o próximo orderNumber baseado no último - CORRIGIDO
 */
export const generateNextOrderNumber = (lastOrderNumber: string): string => {
  //console.log("Último orderNumber recebido:", lastOrderNumber);
  
  // Se for número, converte para string com prefixo P-
  if (typeof lastOrderNumber === 'number') {
    return `P-${lastOrderNumber + 1}`;
  }
  
  // Se for string com prefixo P-
  const match = lastOrderNumber.match(/P-(\d+)/);
  if (match && match[1]) {
    const nextNumber = parseInt(match[1]) + 1;
    return `P-${nextNumber}`;
  }
  
  // Se for apenas número como string
  if (!isNaN(Number(lastOrderNumber))) {
    return `P-${parseInt(lastOrderNumber) + 1}`;
  }
  
  // Fallback
  return "P-100";
};

/**
 * Obtém e gera o próximo orderNumber - CORRIGIDO
 */
export const getNextOrderNumber = async (token?: string): Promise<string> => {
  try {
    const lastOrderNumber = await getLastOrderNumber(token);
    //console.log("Último número do backend:", lastOrderNumber);
    
    const nextOrderNumber = generateNextOrderNumber(lastOrderNumber);
   // console.log("Próximo número gerado:", nextOrderNumber);
    
    return nextOrderNumber;
  } catch (error) {
    console.error("Erro ao gerar próximo número do pedido:", error);
    return "P-100"; // Fallback como STRING
  }
};

/**
 * Busca lista de clientes
 */
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

/**
 * Insere um novo pedido - ATUALIZADO com orderNumber
 */
export const insertOrder = async (order: Order, token?: string): Promise<any> => {
  try {
    // Garantir que o orderStatus seja 'pending' se não informado
    const orderData = {
      ...order,
      orderStatus: order.orderStatus || 'pending'
    };

   // console.log("Enviando dados para criar pedido:", orderData);

    const response = await apiRequest("orders/create", "POST", orderData, token);
    
    if (!response) {
      console.error("Erro ao criar pedido: resposta inválida");
      return null;
    }
    
    return response;
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return null;
  }
};

/**
 * Recupera todos os pedidos - VERSÃO SIMPLIFICADA
 */
export const handleAllOrders = async (token?: string): Promise<OrderResponse[]> => {
  const tkn = token || localStorage.getItem('token');
  
  try {
    const response = await apiRequest("orders/all", "GET", undefined, tkn as string);

    console.log("Resposta completa da API:", response);
    
    // Versão simplificada - assume que a resposta é o array de orders
    // ou tem a propriedade orders
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

/**
 * Recupera um pedido específico por ID
 */
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

/**
 * Atualiza o status de um pedido - ATUALIZADO
 */
export const updateOrderStatus = async (
  orderId: number | string,
  orderStatus: string,
  token?: string
): Promise<any> => {
  try {
    const body = { orderStatus };
    const response = await apiRequest(`orders/${orderId}/status`, "PUT", body, token);
    return response;
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error);
    return null;
  }
};

/**
 * Deleta um pedido
 */
export const deleteOrder = async (orderId: number | string, token?: string): Promise<boolean> => {
  try {
    const response = await apiRequest(`orders/${orderId}`, "DELETE", undefined, token);
    return !!response;
  } catch (error) {
    console.error("Erro ao deletar pedido:", error);
    return false;
  }
};