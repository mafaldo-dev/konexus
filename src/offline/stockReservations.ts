import { apiClient } from '../api/client';
import { DraftScope, nativeCall, nativeStorage } from './salesDrafts';

export type ReservationStatus = 'active' | 'queued' | 'consumed' | 'cancelled' | 'blocked';
export type ReservationItem = { productId: number; quantity: number };
export type StockReservation = {
  id: string;
  status: ReservationStatus;
  effectiveStatus: 'active' | 'expired' | 'consumed' | 'cancelled' | 'queued' | 'blocked';
  expiresAt: string;
  createdAt?: string;
  updatedAt?: string;
  deviceId: number;
  deviceName?: string | null;
  slot?: string;
  orderId?: number | null;
  items: ReservationItem[];
  errorCode?: string | null;
  expired?: boolean;
};

export type OfflineOrderState = 'pending' | 'leased' | 'blocked' | 'confirmed';
export type OfflineOrder = {
  operationId: string;
  reservationId: string;
  state: OfflineOrderState;
  attempts: number;
  errorCode: string | null;
  serverOrderId: number | null;
  serverOrderNumber: string | null;
  slot: string;
  draftRevision: string | null;
  createdAt: number;
  updatedAt: number;
  confirmedAt: number | null;
};

export type OfflineOrderPayload = {
  orderDate: string;
  customerId: number;
  totalAmount: number;
  currency: string;
  salesperson: string;
  notes?: string;
  carrier: string;
  payment_method?: string;
  shippingAddressId?: number | string | null;
  billingAddressId?: number | string | null;
  orderItems: Array<{ productId: number; quantity: number; unitPrice: number; location?: string }>;
};

type ClaimedOrder = {
  operationId: string;
  reservationId: string;
  leaseToken: string;
  payload: Record<string, unknown>;
  reservationToken: string;
};

const changed = () => {
  window.dispatchEvent(new Event('konexus:drafts-changed'));
  window.dispatchEvent(new Event('konexus:offline-orders-changed'));
};
const requireDesktop = () => {
  if (!nativeStorage()) {
    throw new Error('A reserva e a fila de pedidos offline exigem o aplicativo desktop com SQLite protegido.');
  }
};
const errorMessage = (response: { error?: string | null }, fallback: string) =>
  response.error || fallback;

export async function reserveStock(
  scope: DraftScope,
  slot: string,
  items: ReservationItem[],
  ttlMinutes = 24 * 60
): Promise<StockReservation> {
  requireDesktop();
  if (!navigator.onLine) throw new Error('Conecte-se à internet para reservar estoque. A reserva é criada somente pela autoridade central.');
  if (!Array.isArray(items) || items.length === 0) throw new Error('Adicione itens ao pedido antes de reservar estoque.');
  const response = await apiClient.post(
    'orders/reservations',
    { items, ttlMinutes },
    { legalEntityId: scope.legalEntityId, reauth: true }
  );
  if (!response.ok || response.data?.success !== true || !response.data?.data?.id) {
    throw new Error(errorMessage(
      response,
      'Não foi possível confirmar a reserva na central. Antes de tentar novamente, verifique as reservas desta estação na Área de continuidade offline; uma resposta perdida pode ter deixado estoque retido.'
    ));
  }
  const reservation = response.data.data as StockReservation;
  try {
    await nativeCall('save-reservation', { scope, slot, reservation });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `A reserva ${reservation.id} foi criada na central, mas o cofre local não a salvou (${message}). ` +
      'O estoque está retido. Abra a Área de continuidade offline para reconciliar a estação.'
    );
  }
  changed();
  return reservation;
}

export async function loadReservation(scope: DraftScope, slot: string): Promise<StockReservation | null> {
  if (!nativeStorage()) return null;
  return nativeCall<StockReservation | null>('load-reservation', { scope, slot });
}

export async function listReservations(scope: DraftScope, limit = 50): Promise<StockReservation[]> {
  if (!nativeStorage()) return [];
  return nativeCall<StockReservation[]>('list-reservations', { scope, limit });
}

export async function listServerReservations(scope: DraftScope): Promise<StockReservation[]> {
  const response = await apiClient.get('orders/reservations', {
    legalEntityId: scope.legalEntityId,
    reauth: false,
  });
  if (!response.ok || response.data?.success !== true) {
    throw new Error(errorMessage(response, 'Não foi possível listar as reservas desta estação.'));
  }
  return Array.isArray(response.data.data) ? response.data.data as StockReservation[] : [];
}

export async function cancelReservation(scope: DraftScope, reservationId: string, reason: string): Promise<StockReservation> {
  requireDesktop();
  if (!navigator.onLine) throw new Error('A liberação da reserva exige conexão com a autoridade central.');
  const response = await apiClient.post(
    `orders/reservations/${reservationId}/cancel`,
    { reason },
    { legalEntityId: scope.legalEntityId, reauth: true }
  );
  if (!response.ok || response.data?.success !== true) {
    throw new Error(errorMessage(response, 'O servidor não liberou a reserva. O estoque continua reservado.'));
  }
  try {
    await nativeCall('cancel-reservation', { scope, reservationId, force: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // A central já liberou. Uma reserva órfã (por exemplo, resposta perdida
    // antes de gravar o token) não existe no SQLite; isso não é falha.
    if (!/não encontrada/i.test(message)) {
      throw new Error(
        `A central liberou o estoque, mas a cópia local não pôde ser limpa (${message}). ` +
        'Tente liberar novamente para remover o registro local; a reserva na central já está cancelada.'
      );
    }
  }
  changed();
  return response.data.data as StockReservation;
}

export async function queueOfflineOrder(
  scope: DraftScope,
  slot: string,
  reservationId: string,
  payload: OfflineOrderPayload,
  draftRevision: string | null
): Promise<OfflineOrder> {
  requireDesktop();
  const operationId = crypto.randomUUID();
  const body = {
    ...payload,
    orderStatus: 'pending',
    // O numero definitivo e atribuido pelo servidor na sincronizacao.
    orderNumber: 'Pendente',
    clientRequestId: operationId,
    reservationId,
  };
  const order = await nativeCall<OfflineOrder>('queue-order', {
    scope,
    slot,
    payload: body,
    reservationId,
    operationId,
    draftRevision,
  });
  changed();
  return order;
}

export async function loadOfflineOrder(scope: DraftScope, operationId: string): Promise<OfflineOrder | null> {
  if (!nativeStorage()) return null;
  return nativeCall<OfflineOrder | null>('load-order', { scope, operationId });
}

export async function listOfflineOrders(scope: DraftScope, limit = 50): Promise<OfflineOrder[]> {
  if (!nativeStorage()) return [];
  return nativeCall<OfflineOrder[]>('list-orders', { scope, limit });
}

let syncingOrders = false;
export async function syncOfflineOrders(scope: DraftScope): Promise<void> {
  if (syncingOrders || !navigator.onLine || !nativeStorage()) return;
  syncingOrders = true;
  try {
    for (let count = 0; count < 10; count++) {
      const operations = await nativeCall<ClaimedOrder[]>('claim-orders', { scope, limit: 1 });
      const operation = operations[0];
      if (!operation) return;
      let response;
      try {
        response = await apiClient.post(
          'orders/offline-create',
          {
            ...operation.payload,
            reservationId: operation.reservationId,
            reservationToken: operation.reservationToken,
          },
          { legalEntityId: scope.legalEntityId, reauth: false }
        );
      } catch (error) {
        await nativeCall('reject-order', {
          scope,
          operationId: operation.operationId,
          leaseToken: operation.leaseToken,
          code: 'NETWORK',
        });
        changed();
        throw error;
      }
      const data = response.data;
      const confirmed =
        response.ok &&
        data &&
        Number.isSafeInteger(Number(data.id)) &&
        Number(data.id) > 0 &&
        typeof data.orderNumber === 'string' &&
        data.orderNumber.length > 0 &&
        data.stockReservationId === operation.reservationId;
      if (confirmed) {
        await nativeCall('ack-order', {
          scope,
          operationId: operation.operationId,
          leaseToken: operation.leaseToken,
          ack: {
            orderId: Number(data.id),
            orderNumber: data.orderNumber,
            reservationId: data.stockReservationId,
          },
        });
        changed();
        continue;
      }
      const code =
        response.status === 401 ? 'AUTH'
          : response.status === 403 ? (response.code === 'DEVICE_REGISTRATION_REQUIRED' ? 'DEVICE' : 'ACCESS')
            : response.status === 409 ? 'CONFLICT'
              : response.status === 0 || response.status === 408 || response.status === 429 ? 'NETWORK'
                : response.status >= 500 ? 'SERVER'
                  : response.ok ? 'INVALID_ACK'
                    : 'VALIDATION';
      await nativeCall('reject-order', {
        scope,
        operationId: operation.operationId,
        leaseToken: operation.leaseToken,
        code,
      });
      changed();
      return;
    }
  } finally {
    syncingOrders = false;
  }
}

export async function resumeOfflineOrders(scope: DraftScope): Promise<void> {
  if (!nativeStorage()) return;
  await nativeCall('resume-order-auth', { scope });
}

export async function retryOfflineOrder(scope: DraftScope, operationId: string): Promise<OfflineOrder> {
  requireDesktop();
  const order = await nativeCall<OfflineOrder>('retry-order', { scope, operationId });
  changed();
  return order;
}

export function reservationMatchesProducts(
  reservation: StockReservation,
  products: Array<{ id: number | string; quantity: number }>
): boolean {
  const expected = new Map<number, number>();
  for (const item of reservation.items) expected.set(Number(item.productId), (expected.get(Number(item.productId)) || 0) + Number(item.quantity));
  const actual = new Map<number, number>();
  for (const item of products) actual.set(Number(item.id), (actual.get(Number(item.id)) || 0) + Number(item.quantity));
  if (expected.size !== actual.size) return false;
  for (const [productId, quantity] of Array.from(expected.entries())) if (actual.get(productId) !== quantity) return false;
  return true;
}

export function reservationIsLocked(reservation: StockReservation | null): boolean {
  return Boolean(reservation && ['active', 'queued', 'blocked'].includes(reservation.status));
}
