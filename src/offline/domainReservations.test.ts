import { apiClient } from '../api/client';

const scope = { companyId: 901, legalEntityId: 902, userId: 903 };
let reservations: typeof import('./domainReservations');

const saved = (overrides: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  domain: 'financial_receivable',
  scopeId: 902,
  legalEntityId: 902,
  status: 'active',
  effectiveStatus: 'active',
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  consumedAt: null,
  consumedAfterExpiry: false,
  cancelledAt: null,
  cancelReason: null,
  deviceId: 77,
  deviceName: 'Estação QA',
  userId: 903,
  userName: 'Gestor QA',
  targetId: 501,
  targetIds: [501],
  targetCount: 1,
  ...overrides,
});

beforeAll(async () => {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });
  reservations = await import('./domainReservations');
});

beforeEach(() => {
  jest.restoreAllMocks();
});

it('lista reservas ativas do CNPJ no endpoint administrativo', async () => {
  const active = saved();
  jest.spyOn(apiClient, 'get').mockResolvedValue({
    ok: true, status: 200, error: null, data: { success: true, data: [active] },
  });
  await expect(
    reservations.listAllDomainReservations(scope, 'financial-receivables')
  ).resolves.toEqual([active]);
  expect(apiClient.get).toHaveBeenCalledWith('offline-reservations/financial-receivables/all', {
    legalEntityId: 902, reauth: false,
  });
});

it('reconcilia somente com motivo e reautenticação', async () => {
  const active = saved();
  const reconciled = { ...active, status: 'cancelled', effectiveStatus: 'cancelled' };
  jest.spyOn(apiClient, 'post').mockResolvedValue({
    ok: true, status: 200, error: null, data: { success: true, data: reconciled },
  });
  await expect(
    reservations.reconcileDomainReservation(
      scope,
      'financial-receivables',
      active.id,
      '  estação sem cópia local  '
    )
  ).resolves.toEqual(reconciled);
  expect(apiClient.post).toHaveBeenCalledWith(
    `offline-reservations/financial-receivables/${active.id}/reconcile`,
    { reason: 'estação sem cópia local' },
    { legalEntityId: 902, reauth: true }
  );
  await expect(
    reservations.reconcileDomainReservation(scope, 'financial-receivables', active.id, '   ')
  ).rejects.toThrow('motivo');
});

it('não chama a central sem rede', async () => {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: false });
  const post = jest.spyOn(apiClient, 'post');
  await expect(
    reservations.reconcileDomainReservation(scope, 'financial-payables', 'id', 'motivo válido')
  ).rejects.toThrow('autoridade central');
  expect(post).not.toHaveBeenCalled();
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });
});

it('permite reconciliar apenas reserva ativa', () => {
  expect(reservations.canReconcileDomainReservation({ status: 'active' })).toBe(true);
  expect(reservations.canReconcileDomainReservation({ status: 'consumed' })).toBe(false);
  expect(reservations.canReconcileDomainReservation({ status: 'cancelled' })).toBe(false);
});
