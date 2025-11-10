import { OrderService } from "../../service/interfaces/stock/service";

// ✅ Agora usa productId
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

// ✅ Agora extrai productId da mensagem com validação robusta
export const extractOrderItemsFromMessage = (message: any): Array<{ productId: number; quantity: number }> => {
  if (!message) return [];

  try {
    if (typeof message === 'string') {
      // Ignora se a mensagem não parece um JSON de array/objeto
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
    // Silenciosamente retorna array vazio se não for JSON válido
    // (a mensagem pode ser apenas texto livre)
    return [];
  }

  return [];
};

// ✅ Normaliza mantendo productId com validação melhorada
export const normalizeOrderService = (order: any): OrderService => {
  let orderItems: Array<{ productId: number; quantity: number }> = [];

  // Tenta pegar de orderItems primeiro
  if (order.orderItems) {
    orderItems = parseOrderItems(order.orderItems);
  }

  // Se não encontrou itens e a mensagem parece conter JSON, tenta extrair
  if (orderItems.length === 0 && order.message) {
    const trimmedMessage = String(order.message).trim();
    // Só tenta fazer parse se parecer JSON
    if (trimmedMessage.startsWith('[') || trimmedMessage.startsWith('{')) {
      const itemsFromMessage = extractOrderItemsFromMessage(order.message);
      if (itemsFromMessage.length > 0) {
        orderItems = itemsFromMessage;
      }
    }
  }

  // Determina se a mensagem é texto livre ou JSON
  let messageText = '';
  if (order.message) {
    const trimmedMessage = String(order.message).trim();
    // Se não começa com [ ou {, é texto livre
    if (!trimmedMessage.startsWith('[') && !trimmedMessage.startsWith('{')) {
      messageText = order.message;
    }
  }

  return {
    id: order.id || order.orderId || 0,
    orderNumber: order.ordernumber || order.orderNumber || 'N/A',
    orderStatus: order.orderStatus || order.orderstatus || 'initialized',
    orderDate: order.orderDate || order.orderdate || new Date(),
    notes: order.notes || '',
    message: messageText,
    username: order.username || '',
    receiver_name: order.receiver_name || '',
    sector: order.sector || '',
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

// ✅ Prepara para submit usando productId
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
    receiver: order.receiver_name || '',  // ✅ Envia como receiver
    orderItems: orderItems.map(item => ({
      productId: Number(item.productId || 0),  // ✅ Envia productId como number
      quantity: Number(item.quantity || 1)
    }))
  };
};