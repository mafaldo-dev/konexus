import { apiClient } from '../api/client';

const scope = { companyId: 901, legalEntityId: 902, userId: 903 };
let domainOffline: typeof import('./domainOffline');
let invoke: jest.Mock;

const localReservation = (overrides: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  reservationId: crypto.randomUUID(),
  companyId: 901,
  legalEntityId: 902,
  userId: 903,
  domain: 'financial_receivable',
  targetId: 501,
  deviceId: 77,
  deviceName: 'Estação QA',
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  status: 'active',
  effectiveStatus: 'active',
  expired: false,
  operationId: null,
  errorCode: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

const claimedOperation = (overrides: Record<string, unknown> = {}) => ({
  operationId: crypto.randomUUID(),
  domain: 'financial_receivable',
  action: 'settle',
  targetId: 501,
  reservationId: crypto.randomUUID(),
  leaseToken: crypto.randomUUID(),
  reservationToken: 'token-local-da-reserva',
  payload: { notes: 'Baixa offline', transactionId: 'TX-1' },
  ...overrides,
});

beforeAll(async () => {
  invoke = jest.fn();
  (window as any).ipcRenderer = { invoke };
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });
  domainOffline = await import('./domainOffline');
});

beforeEach(() => {
  invoke.mockReset();
  jest.restoreAllMocks();
});

it('atualiza a cópia local de títulos a receber somente com alvos elegíveis', async () => {
  jest.spyOn(apiClient, 'get').mockResolvedValue({
    ok: true,
    status: 200,
    error: null,
    data: {
      status: 'success',
      data: [
        { id: 501, payment_status: 'pending', amount: '100.50', customer_name: 'Cliente QA', ordernumber: 'P-1', due_date: '2026-10-30', transaction_id: 'TX-1' },
        { id: 502, payment_status: 'paid', amount: '20.00', customer_name: 'Cliente QA', ordernumber: 'P-2' },
        { id: 503, payment_status: 'overdue', amount: '30.00', customer_name: 'Cliente QA', ordernumber: 'P-3' },
      ],
    },
  });
  invoke.mockResolvedValue({ domain: 'financial_receivable', targets: [], updatedAt: 1 });

  const snapshot = await domainOffline.refreshDomainTargets(scope, 'financial_receivable');

  expect(apiClient.get).toHaveBeenCalledWith('payments/all?limit=200', { legalEntityId: 902, reauth: false });
  expect(snapshot.targets.map(target => target.targetId)).toEqual([501, 503]);
  expect(snapshot.targets[0]).toEqual(expect.objectContaining({
    domain: 'financial_receivable', label: 'Título #501', secondary: 'Cliente QA · P-1', amount: 100.5,
  }));
  expect(invoke).toHaveBeenCalledWith('offline-store', {
    method: 'save-domain-snapshot', scope, domain: 'financial_receivable', targets: snapshot.targets,
  });
});

it('filtra períodos contábeis pelo CNPJ ativo e ignora bloqueados', async () => {
  jest.spyOn(apiClient, 'get').mockResolvedValue({
    ok: true,
    status: 200,
    error: null,
    data: {
      success: true,
      data: [
        { id: 1, legal_entity_id: 902, status: 'open', name: 'Outubro/2026', fiscal_month: 10, fiscal_year: 2026, ends_at: '2026-10-31' },
        { id: 2, legal_entity_id: 902, status: 'locked', name: 'Setembro/2026', fiscal_month: 9, fiscal_year: 2026, ends_at: '2026-09-30' },
        { id: 3, legal_entity_id: 999, status: 'open', name: 'Outubro/999', fiscal_month: 10, fiscal_year: 2026, ends_at: '2026-10-31' },
      ],
    },
  });
  invoke.mockResolvedValue({});
  const snapshot = await domainOffline.refreshDomainTargets(scope, 'accounting_period');
  expect(snapshot.targets).toHaveLength(1);
  expect(snapshot.targets[0]).toEqual(expect.objectContaining({ targetId: 1, label: 'Outubro/2026' }));
});

it('cria a reserva online com reautenticação e salva o token no SQLite', async () => {
  const reservation = localReservation();
  jest.spyOn(apiClient, 'post').mockResolvedValue({
    ok: true, status: 201, error: null, data: { success: true, data: reservation },
  });
  invoke.mockResolvedValue(reservation);

  await expect(domainOffline.reserveDomainTarget(scope, 'financial_receivable', 501)).resolves.toEqual(reservation);
  expect(apiClient.post).toHaveBeenCalledWith(
    'offline-reservations/financial-receivables',
    { targetId: 501, ttlMinutes: 1440 },
    { legalEntityId: 902, reauth: true }
  );
  expect(invoke).toHaveBeenCalledWith('offline-store', {
    method: 'save-domain-reservation', scope, domain: 'financial_receivable', reservation,
  });
});

it('avisa quando a central reservou mas o cofre local não salvou', async () => {
  const reservation = localReservation();
  jest.spyOn(apiClient, 'post').mockResolvedValue({
    ok: true, status: 201, error: null, data: { success: true, data: reservation },
  });
  invoke.mockRejectedValue(new Error('disco cheio'));
  await expect(domainOffline.reserveDomainTarget(scope, 'financial_receivable', 501)).rejects.toThrow(
    /criada na central.*disco cheio.*alvo está retido/i
  );
});

it('enfileira a operação com UUID local e payload permitido', async () => {
  const operation = { operationId: crypto.randomUUID(), state: 'pending' };
  invoke.mockResolvedValue(operation);
  await expect(domainOffline.queueDomainOperation(scope, {
    domain: 'financial_payable', action: 'settle', targetId: 701, reservationId: 'reserva-1',
    payload: { paymentDate: '2026-10-24' },
  })).resolves.toEqual(operation);
  expect(invoke).toHaveBeenCalledWith('offline-store', expect.objectContaining({
    method: 'queue-domain-operation', scope,
    operation: expect.objectContaining({
      domain: 'financial_payable', action: 'settle', targetId: 701, reservationId: 'reserva-1',
      operationId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      payload: { paymentDate: '2026-10-24' },
    }),
  }));
});

it('sincroniza no endpoint do domínio e confirma somente ACK exato', async () => {
  const operation = claimedOperation();
  invoke.mockImplementation(async (_channel, request) => {
    if (request.method === 'claim-domain-operations') {
      return invoke.mock.calls.filter(([, item]) => item.method === 'claim-domain-operations').length === 1 ? [operation] : [];
    }
    if (request.method === 'ack-domain-operation') return { confirmed: true };
    throw new Error('método inesperado: ' + request.method);
  });
  jest.spyOn(apiClient, 'post').mockResolvedValue({
    ok: true, status: 201, error: null,
    data: { success: true, data: {
      domain: operation.domain, action: operation.action, targetId: operation.targetId,
      reservationId: operation.reservationId, status: 'paid', replayed: false,
    } },
  });

  await domainOffline.syncDomainOperations(scope);

  expect(apiClient.post).toHaveBeenCalledWith(
    `offline-domain-operations/financial-receivables/${operation.targetId}/settle`,
    {
      ...operation.payload,
      clientRequestId: operation.operationId,
      reservationId: operation.reservationId,
      reservationToken: operation.reservationToken,
    },
    { legalEntityId: 902, reauth: false }
  );
  expect(invoke).toHaveBeenCalledWith('offline-store', {
    method: 'ack-domain-operation', scope, operationId: operation.operationId,
    leaseToken: operation.leaseToken,
    ack: {
      domain: operation.domain, targetId: operation.targetId,
      reservationId: operation.reservationId, status: 'paid',
    },
  });
});

it('recusa ACK divergente e bloqueia a operação', async () => {
  const operation = claimedOperation({ domain: 'accounting_period', action: 'close', targetId: 801, payload: { notes: 'Fechamento' } });
  invoke.mockImplementation(async (_channel, request) => {
    if (request.method === 'claim-domain-operations') {
      return invoke.mock.calls.filter(([, item]) => item.method === 'claim-domain-operations').length === 1 ? [operation] : [];
    }
    if (request.method === 'reject-domain-operation') return { retained: true };
    throw new Error('método inesperado: ' + request.method);
  });
  jest.spyOn(apiClient, 'post').mockResolvedValue({
    ok: true, status: 201, error: null,
    data: { success: true, data: {
      domain: operation.domain, action: operation.action, targetId: 999,
      reservationId: operation.reservationId, status: 'closed',
    } },
  });

  await domainOffline.syncDomainOperations(scope);

  expect(invoke).toHaveBeenCalledWith('offline-store', {
    method: 'reject-domain-operation', scope, operationId: operation.operationId,
    leaseToken: operation.leaseToken, code: 'INVALID_ACK',
  });
  expect(invoke).not.toHaveBeenCalledWith('offline-store', expect.objectContaining({ method: 'ack-domain-operation' }));
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
    if (request.method === 'claim-domain-operations') {
      return invoke.mock.calls.filter(([, item]) => item.method === 'claim-domain-operations').length === 1 ? [operation] : [];
    }
    if (request.method === 'reject-domain-operation') return { retained: true };
    throw new Error('método inesperado: ' + request.method);
  });
  jest.spyOn(apiClient, 'post').mockResolvedValue({ ok: false, status, error: 'falha', code, data: null });

  await domainOffline.syncDomainOperations(scope);

  expect(invoke).toHaveBeenCalledWith('offline-store', {
    method: 'reject-domain-operation', scope, operationId: operation.operationId,
    leaseToken: operation.leaseToken, code: expected,
  });
  expect(invoke).not.toHaveBeenCalledWith('offline-store', expect.objectContaining({ method: 'ack-domain-operation' }));
});

it('não chama a central sem rede e mantém a fila local', async () => {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: false });
  const post = jest.spyOn(apiClient, 'post');
  await domainOffline.syncDomainOperations(scope);
  expect(post).not.toHaveBeenCalled();
  await expect(domainOffline.reserveDomainTarget(scope, 'financial_receivable', 501)).rejects.toThrow('autoridade central');
  expect(post).not.toHaveBeenCalled();
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });
});

it('oferece apenas ações compatíveis com o estado do alvo', () => {
  expect(domainOffline.domainTargetActions('financial_receivable', 'pending')).toEqual(['settle']);
  expect(domainOffline.domainTargetActions('financial_receivable', 'paid')).toEqual([]);
  expect(domainOffline.domainTargetActions('financial_payable', 'overdue')).toEqual(['settle']);
  expect(domainOffline.domainTargetActions('payroll_competency', 'approved')).toEqual(['close']);
  expect(domainOffline.domainTargetActions('payroll_competency', 'calculated')).toEqual([]);
  expect(domainOffline.domainTargetActions('accounting_period', 'open')).toEqual(['close', 'lock']);
  expect(domainOffline.domainTargetActions('accounting_period', 'closed')).toEqual(['reopen', 'lock']);
  expect(domainOffline.domainTargetActions('accounting_period', 'locked')).toEqual([]);
});
