import { OrderService } from "../../service/interfaces/stock/service";

/**
 * Processa os orderItems que podem vir em formato JSON string escapado
 */
export const parseOrderItems = (items: any): Array<{ productCode: string; quantity: number }> => {
  // Se já for um array válido, retorna
  if (Array.isArray(items) && items.length > 0) {
    return items.map(item => ({
      productCode: String(item.productCode || ''),
      quantity: Number(item.quantity || 0)
    }));
  }

  // Se for string, tenta fazer parse
  if (typeof items === 'string') {
    try {
      // Remove caracteres de escape extras
      let cleanString = items.replace(/\\/g, '');
      
      // Tenta fazer parse direto
      const parsed = JSON.parse(cleanString);
      
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          productCode: String(item.productCode || ''),
          quantity: Number(item.quantity || 0)
        }));
      }
      
      if (typeof parsed === 'object' && parsed.productCode) {
        return [{
          productCode: String(parsed.productCode),
          quantity: Number(parsed.quantity || 1)
        }];
      }
    } catch (error) {
      console.error('Erro ao fazer parse dos items:', error);
    }
  }

  // Retorna array vazio se não conseguir processar
  return [];
};

/**
 * Processa a mensagem que pode estar armazenada no campo message
 * quando deveria estar em orderItems
 */
export const extractOrderItemsFromMessage = (message: any): Array<{ productCode: string; quantity: number }> => {
  if (!message) return [];

  try {
    // Se message for string com formato de array JSON
    if (typeof message === 'string') {
      // Remove chaves extras e escapes
      let cleaned = message
        .replace(/^\{/g, '[')
        .replace(/\}$/g, ']')
        .replace(/\\/g, '')
        .replace(/"\{/g, '{')
        .replace(/\}"/g, '}');

      const parsed = JSON.parse(cleaned);
      
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          productCode: String(item.productCode || ''),
          quantity: Number(item.quantity || 0)
        }));
      }
    }
  } catch (error) {
    console.error('Erro ao extrair items da mensagem:', error);
  }

  return [];
};

/**
 * Normaliza uma OrderService vinda do backend
 */
export const normalizeOrderService = (order: any): OrderService => {
  let orderItems: Array<{ productCode: string; quantity: number }> = [];

  // Tenta pegar os items do campo orderItems
  if (order.orderItems) {
    orderItems = parseOrderItems(order.orderItems);
  }

  // Se não tiver items, tenta extrair do campo message
  if (orderItems.length === 0 && order.message) {
    const itemsFromMessage = extractOrderItemsFromMessage(order.message);
    if (itemsFromMessage.length > 0) {
      orderItems = itemsFromMessage;
    }
  }

  return {
    id: order.id || order.orderId || 0,
    orderNumber: order.orderNumber || order.ordernumber || 'N/A',
    orderStatus: order.orderStatus || order.orderstatus || 'initialized',
    orderDate: order.orderDate || order.orderdate || new Date(),
    notes: order.notes || '',
    message: typeof order.message === 'string' && order.message.startsWith('{') 
      ? '' // Limpa message se contiver os items
      : order.message || '',
    userCreate: order.userCreate || order.usercreate || '',
    userReceiv: order.userReceiv || order.userreceiv || '',
    sector: order.sector || '',
    orderItems: orderItems,
    createdAt: order.createdAt || order.createdat || new Date(),
  };
};

/**
 * Normaliza um array de OrderServices
 */
export const normalizeOrderServices = (orders: any[]): OrderService[] => {
  if (!Array.isArray(orders)) return [];
  
  return orders.map(normalizeOrderService);
};

/**
 * Prepara os dados para envio ao backend
 */
/**
 * Prepara os dados para envio ao backend
 */
export const prepareOrderServiceForSubmit = (order: Partial<OrderService>): any => {
  // Garante que orderItems seja um array válido
  const orderItems = Array.isArray(order.orderItems) && order.orderItems.length > 0 
    ? order.orderItems 
    : [];

  return {
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus || 'initialized',
    orderDate: order.orderDate,
    notes: order.notes || '',
    message: order.message || '',
    userCreate: order.userCreate,
    userReceiv: order.userReceiv || '',
    sector: order.sector,
    // Envia orderItems como array de objetos, não como string JSON
    orderItems: orderItems.map(item => ({
      productCode: String(item.productCode || ''),
      quantity: Number(item.quantity || 1)
    })),
    createdAt: order.createdAt || new Date(),
  };
};