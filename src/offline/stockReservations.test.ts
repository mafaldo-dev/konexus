import { apiClient } from '../api/client';

const scope = { companyId: 901, legalEntityId: 902, userId: 903 };
let reservations: typeof import('./stockReservations');
let invoke: jest.Mock;

const savedReservation = (overrides: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  status: 'active',
  effectiveStatus: 'active',
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  deviceId: 77,
  deviceName: 'Estação QA',
  items: [{ productId: 501, quantity: 2 }],
  ...overrides,
});

const claimedOperation = (overrides: Record<string, unknown> = {}) => ({
  operationId: crypto.randomUUID(),
  reservationId: crypto.randomUUID(),
  leaseToken: crypto.randomUUID(),
  reservationToken: 'token-local-da-reserva',
  payload: { customerId: 10, orderItems: [{ productId: 501, quantity: 2, unitPrice: 9 }], clientRequestId: 'x' },
  ...overrides,
});

beforeAll(async () => {
  invoke = jest.fn();
  (window as any).ipcRenderer = { invoke };
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });
  reservations = await import('./stockReservations');
});

beforeEach(() => {
  invoke.mockReset();
  jest.restoreAllMocks();
});

it('cria a reserva somente com reautenticação e persiste o token no SQLite', async () => {
  const created = savedReservation();
  invoke.mockResolvedValue(created);
  jest.spyOn(apiClient, 'post').mockResolvedValue({
    ok: true, status: 201, error: null, data: { success: true, data: created },
  });

  await expect(reservations.reserveStock(scope, 'new', [{ productId: 501, quantity: 2 }])).resolves.toEqual(created);
  expect(apiClient.post).toHaveBeenCalledWith('orders/reservations', {
    items: [{ productId: 501, quantity: 2 }], ttlMinutes: 1440,
  }, { legalEntityId: 902, reauth: true });
  expect(invoke).toHaveBeenCalledWith('offline-store', { method: 'save-reservation', scope, slot: 'new', reservation: created });
});

it('não salva reserva quando o servidor recusa ou o cofre está fechado', async () => {
  jest.spyOn(apiClient, 'post').mockResolvedValue({ ok: false, status: 409, error: 'Estoque insuficiente', data: null });
  await expect(reservations.reserveStock(scope, 'new', [{ productId: 501, quantity: 2 }])).rejects.toThrow('Estoque insuficiente');
  expect(invoke).not.toHaveBeenCalled();
});

it('enfileira pedido com UUID, status pendente e número ignorado pelo servidor', async () => {
  const queued = { operationId: crypto.randomUUID(), reservationId: crypto.randomUUID(), state: 'pending' };
  invoke.mockResolvedValue(queued);
  const payload = {
    orderDate: '2026-10-24', customerId: 10, totalAmount: 18, currency: 'BRL', salesperson: 'QA', carrier: 'QA',
    orderItems: [{ productId: 501, quantity: 2, unitPrice: 9 }],
  };
  await expect(reservations.queueOfflineOrder(scope, 'new', 'reserva-1', payload, 'revisao-1')).resolves.toEqual(queued);
  expect(invoke).toHaveBeenCalledWith('offline-store', expect.objectContaining({
    method: 'queue-order', scope, slot: 'new', reservationId: 'reserva-1', draftRevision: 'revisao-1',
    payload: expect.objectContaining({
      orderStatus: 'pending', orderNumber: 'Pendente', reservationId: 'reserva-1',
      clientRequestId: expect.stringMatching(/^[0-9a-f-]{36}$/),
    }),
  }));
});

it('confirma somente com ACK exato do servidor e usa o número devolvido', async () => {
  const operation = claimedOperation();
  invoke.mockImplementation(async (_channel, request) => {
    if (request.method === 'claim-orders') {
      return invoke.mock.calls.filter(([, item]) => item.method === 'claim-orders').length === 1 ? [operation] : [];
    }
    if (request.method === 'ack-order') return { confirmed: true };
    throw new Error('método inesperado: ' + request.method);
  });
  jest.spyOn(apiClient, 'post').mockResolvedValue({
    ok: true, status: 201, error: null, data: { id: 44, orderNumber: 'P-100', stockReservationId: operation.reservationId },
  });

  await reservations.syncOfflineOrders(scope);

  expect(apiClient.post).toHaveBeenCalledWith('orders/offline-create', {
    ...operation.payload, reservationId: operation.reservationId, reservationToken: operation.reservationToken,
  }, { legalEntityId: 902, reauth: false });
  expect(invoke).toHaveBeenCalledWith('offline-store', {
    method: 'ack-order', scope, operationId: operation.operationId, leaseToken: operation.leaseToken,
    ack: { orderId: 44, orderNumber: 'P-100', reservationId: operation.reservationId },
  });
});

it('recusa ACK divergente e bloqueia sem apagar o pedido', async () => {
  const operation = claimedOperation();
  invoke.mockImplementation(async (_channel, request) => {
    if (request.method === 'claim-orders') return invoke.mock.calls.filter(([, item]) => item.method === 'claim-orders').length === 1 ? [operation] : [];
    if (request.method === 'reject-order') return { retained: true };
    throw new Error('método inesperado: ' + request.method);
  });
  jest.spyOn(apiClient, 'post').mockResolvedValue({
    ok: true, status: 201, error: null, data: { id: 44, orderNumber: 'P-100', stockReservationId: 'outra-reserva' },
  });

  await reservations.syncOfflineOrders(scope);

  expect(invoke).toHaveBeenCalledWith('offline-store', {
    method: 'reject-order', scope, operationId: operation.operationId, leaseToken: operation.leaseToken, code: 'INVALID_ACK',
  });
  expect(invoke).not.toHaveBeenCalledWith('offline-store', expect.objectContaining({ method: 'ack-order' }));
});

it.each([
  [409, undefined, 'CONFLICT'],
  [401, undefined, 'AUTH'],
  [403, 'DEVICE_REGISTRATION_REQUIRED', 'DEVICE'],
  [403, 'PERMISSION_DENIED', 'ACCESS'],
  [0, undefined, 'NETWORK'],
  [503, undefined, 'SERVER'],
  [422, undefined, 'VALIDATION'],
])('classifica falha HTTP %s (%s) como %s sem confirmar', async (status, code, expected) => {
  const operation = claimedOperation();
  invoke.mockImplementation(async (_channel, request) => {
    if (request.method === 'claim-orders') return invoke.mock.calls.filter(([, item]) => item.method === 'claim-orders').length === 1 ? [operation] : [];
    if (request.method === 'reject-order') return { retained: true };
    throw new Error('método inesperado: ' + request.method);
  });
  jest.spyOn(apiClient, 'post').mockResolvedValue({ ok: false, status, error: 'falha', code, data: null });

  await reservations.syncOfflineOrders(scope);

  expect(invoke).toHaveBeenCalledWith('offline-store', {
    method: 'reject-order', scope, operationId: operation.operationId, leaseToken: operation.leaseToken, code: expected,
  });
  expect(invoke).not.toHaveBeenCalledWith('offline-store', expect.objectContaining({ method: 'ack-order' }));
});

it('não chama a API sem rede e não libera reserva sem confirmação do servidor', async () => {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: false });
  const post = jest.spyOn(apiClient, 'post');
  await reservations.syncOfflineOrders(scope);
  expect(post).not.toHaveBeenCalled();

  post.mockResolvedValue({ ok: false, status: 0, error: 'sem rede', data: null });
  await expect(reservations.cancelReservation(scope, 'reserva-1', 'teste')).rejects.toThrow('autoridade central');
  expect(post).not.toHaveBeenCalled();
  expect(invoke).not.toHaveBeenCalled();
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });
});

it('lista todas as reservas do CNPJ e reconcilia somente com motivo e reautenticação', async () => {
  const active = savedReservation({ userName: 'Gestor QA', itemCount: 1, totalQuantity: 2 });
  jest.spyOn(apiClient, 'get').mockResolvedValue({
    ok: true, status: 200, error: null, data: { success: true, data: [active] },
  });
  await expect(reservations.listAllServerReservations(scope)).resolves.toEqual([active]);
  expect(apiClient.get).toHaveBeenCalledWith('orders/reservations/all', {
    legalEntityId: 902, reauth: false,
  });

  const reconciled = { ...active, status: 'cancelled', effectiveStatus: 'cancelled' };
  jest.spyOn(apiClient, 'post').mockResolvedValue({
    ok: true, status: 200, error: null, data: { success: true, data: reconciled },
  });
  await expect(reservations.reconcileReservation(scope, active.id, '  estação perdida  ')).resolves.toEqual(reconciled);
  expect(apiClient.post).toHaveBeenCalledWith(`orders/reservations/${active.id}/reconcile`, {
    reason: 'estação perdida',
  }, { legalEntityId: 902, reauth: true });

  await expect(reservations.reconcileReservation(scope, active.id, '   ')).rejects.toThrow('motivo');
});

it('permite reconciliar apenas reserva ativa', () => {
  expect(reservations.canReconcileReservation({ status: 'active' })).toBe(true);
  expect(reservations.canReconcileReservation({ status: 'consumed' })).toBe(false);
  expect(reservations.canReconcileReservation({ status: 'cancelled' })).toBe(false);
});

it('compara a reserva com os itens exatos e trava apenas estados pendentes', () => {
  const reservation = savedReservation();
  expect(reservations.reservationMatchesProducts(reservation as any, [{ id: '501', quantity: 2 }])).toBe(true);
  expect(reservations.reservationMatchesProducts(reservation as any, [{ id: '501', quantity: 1 }])).toBe(false);
  expect(reservations.reservationMatchesProducts(reservation as any, [{ id: '501', quantity: 2 }, { id: '502', quantity: 1 }])).toBe(false);
  expect(reservations.reservationIsLocked(reservation as any)).toBe(true);
  expect(reservations.reservationIsLocked(savedReservation({ status: 'consumed' }) as any)).toBe(false);
  expect(reservations.reservationIsLocked(null)).toBe(false);
});
