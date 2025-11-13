import { OrderService } from "../../service/interfaces/stock/service";

export const parseOrderItems = (items: any): Array<{ productId: number; quantity: number }> => {
  if (Array.isArray(items) && items.length > 0) {
    return items.map(item => ({
      productId: Number(item.productId || item.productid || 0),
      quantity: Number(item.quantity || 0)
    }));
  }

  if (typeof items === 'string') {
    try {
      let cleanString = items.replace(/\\/g, '');
      const parsed = JSON.parse(cleanString);

      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          productId: Number(item.productId || item.productid || 0),
          quantity: Number(item.quantity || 0)
        }));
      }

      if (typeof parsed === 'object' && (parsed.productId || parsed.productid)) {
        return [{
          productId: Number(parsed.productId || parsed.productid),
          quantity: Number(parsed.quantity || 1)
        }];
      }
    } catch (error) {
      console.error('Erro ao fazer parse dos items:', error);
    }
  }

  return [];
};

export const extractOrderItemsFromMessage = (message: any): Array<{ productId: number; quantity: number }> => {
  if (!message) return [];

  try {
    if (typeof message === 'string') {
      const trimmed = message.trim();
      if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
        return [];
      }

      let cleaned = message
        .replace(/^\{/g, '[')
        .replace(/\}$/g, ']')
        .replace(/\\/g, '')
        .replace(/"\{/g, '{')
        .replace(/\}"/g, '}');

      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          productId: Number(item.productId || item.productid || 0),
          quantity: Number(item.quantity || 0)
        }));
      }
    }
  } catch (error) {
    return [];
  }

  return [];
};

export const normalizeOrderService = (order: any): OrderService => {

  let orderItems: Array<{ productId: number; quantity: number }> = [];

  if (order.orderItems) {
    orderItems = parseOrderItems(order.orderItems);
  }

  if (orderItems.length === 0 && order.message) {
    const trimmedMessage = String(order.message).trim();

    if (trimmedMessage.startsWith('[') || trimmedMessage.startsWith('{')) {
      const itemsFromMessage = extractOrderItemsFromMessage(order.message);
      if (itemsFromMessage.length > 0) {
        orderItems = itemsFromMessage;
      }
    }
  }

  let messageText = '';

  if (order.message) {
    const trimmedMessage = String(order.message).trim();
    if (!trimmedMessage.startsWith('[') && !trimmedMessage.startsWith('{')) {
      messageText = order.message;
    }
  }

  return {
    id: order.id || order.orderId || 0,
    orderNumber: order.ordernumber || order.orderNumber || 'N/A',
    orderStatus: order.orderStatus || order.orderstatus || 'iniciada',
    orderDate: order.orderDate || order.orderdate || new Date(),
    notes: order.notes || '',
    message: messageText,
    username: order.username || '',
    receiver_name: order.receiver_name || '',
    sector: order.sector || '',
    stock_movement: order.stock_movement,
    movement_type: order.movement_type,
    orderItems: orderItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    })),
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

  const hasStockMovement = !!order.stock_movement;

  return {
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus || 'iniciada',
    orderDate: order.orderDate,
    notes: order.notes || '',
    message: order.message || '',
    receiver: order.receiver_name || '',
    stock_movement: hasStockMovement, 
    movement_type: hasStockMovement ? (order.movement_type || 'saida') : null,
    orderItems: orderItems.map(item => ({
      productId: Number(item.productId || 0),
      quantity: Number(item.quantity || 1)
    }))
  };
};
