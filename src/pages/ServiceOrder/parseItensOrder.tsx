import { OrderService } from "../../service/interfaces/stock/service";

export const parseOrderItems = (items: any): Array<{ productCode: string; quantity: number }> => {

  if (Array.isArray(items) && items.length > 0) {
    return items.map(item => ({
      productCode: String(item.productCode || ''),
      quantity: Number(item.quantity || 0)
    }));
  }

  if (typeof items === 'string') {
    try {
      let cleanString = items.replace(/\\/g, '');
      
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

  return [];
};

export const extractOrderItemsFromMessage = (message: any): Array<{ productCode: string; quantity: number }> => {
  if (!message) return [];

  try {
    if (typeof message === 'string') {
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

export const normalizeOrderService = (order: any): OrderService => {
  let orderItems: Array<{ productCode: string; quantity: number }> = [];

  if (order.orderItems) {
    orderItems = parseOrderItems(order.orderItems);
  }

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
      ? '' 
      : order.message || '',
    userCreate: order.userCreate || order.usercreate || '',
    userReceiv: order.userReceiv || order.userreceiv || '',
    sector: order.sector || '',
    orderItems: orderItems,
    createdAt: order.createdAt || order.createdat || new Date(),
  };
};

export const normalizeOrderServices = (orders: any[]): OrderService[] => {
  if (!Array.isArray(orders)) return [];
  
  return orders.map(normalizeOrderService);
};

export const prepareOrderServiceForSubmit = (order: Partial<OrderService>): any => {
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
    orderItems: orderItems.map(item => ({
      productCode: String(item.productCode || ''),
      quantity: Number(item.quantity || 1)
    })),
    createdAt: order.createdAt || new Date(),
  };
};