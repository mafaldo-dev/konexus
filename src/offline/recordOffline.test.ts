import { apiClient } from '../api/client';

const scope = { companyId: 901, legalEntityId: 902, userId: 903 };
const catalog = [
  {
    type: 'customer', label: 'Clientes', module: 'gestao', permission: 'create', editPermission: 'edit',
    operations: ['create', 'update'], entity: false, subscription: false, admin: false,
    fields: [
      { key: 'name', label: 'Nome', type: 'text', required: true, createOnly: false, optional: false, min: null, max: 150, options: null, reference: null, default: null },
      { key: 'code', label: 'Código', type: 'text', required: true, createOnly: false, optional: false, min: null, max: 60, options: null, reference: null, default: null },
    ],
  },
] as any;
let recordOffline: typeof import('./recordOffline');
let invoke: jest.Mock;

beforeAll(async () => {
  invoke = jest.fn();
  (window as any).ipcRenderer = { invoke };
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });
  recordOffline = await import('./recordOffline');
});

beforeEach(() => {
  invoke.mockReset();
  localStorage.clear();
  jest.restoreAllMocks();
});

it('baixa e cacheia catálogo e opções sem expor tabelas', async () => {
  jest.spyOn(apiClient, 'get').mockResolvedValue({ ok: true, status: 200, error: null, data: { success: true, data: catalog } });
  await expect(recordOffline.fetchRecordCatalog()).resolves.toEqual(catalog);
  expect(recordOffline.loadCachedRecordCatalog()).toEqual(catalog);
  jest.spyOn(apiClient, 'get').mockResolvedValue({ ok: true, status: 200, error: null, data: { success: true, data: { customer: [{ id: 1, label: 'Cliente' }] } } });
  await expect(recordOffline.fetchRecordOptions(scope)).resolves.toEqual({ customer: [{ id: 1, label: 'Cliente' }] });
  expect(recordOffline.loadCachedRecordOptions(scope)).toEqual({ customer: [{ id: 1, label: 'Cliente' }] });
});

it('atualiza a cópia central sem sobrescrever rascunho local nem apagar fora da primeira página', async () => {
  const draft = { localId: 'central:1', recordType: 'customer', remoteId: 1, baseVersion: 'v1', status: 'draft', payload: { name: 'Local' }, updatedAt: 1 };
  const stale = { localId: 'central:99', recordType: 'customer', remoteId: 99, baseVersion: 'v1', status: 'synced', payload: { name: 'Antigo' }, updatedAt: 1 };
  invoke.mockImplementation((_channel: string, request: any) => {
    if (request.method === 'list-records') return Promise.resolve([draft, stale]);
    if (request.method === 'save-record') return Promise.resolve({ ...request.record, updatedAt: 2 });
    if (request.method === 'delete-record') return Promise.resolve({ deleted: true });
    return Promise.resolve(null);
  });
  jest.spyOn(apiClient, 'get').mockResolvedValue({
    ok: true, status: 200, error: null,
    data: { success: true, data: [{ id: 1, version: 'v2', name: 'Central', code: 'C1' }, { id: 2, version: 'v1', name: 'Nova', code: 'C2' }] },
  });
  await recordOffline.refreshCentralRecords(scope, 'customer', catalog);
  const saved = invoke.mock.calls.filter(call => call[1].method === 'save-record').map(call => call[1].record);
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ localId: 'central:2', remoteId: 2, baseVersion: 'v1', status: 'synced', payload: { name: 'Nova', code: 'C2' } });
  expect(invoke.mock.calls.some(call => call[1].method === 'delete-record')).toBe(false);
});

it('salva rascunho e enfileira criação com UUID local', async () => {
  invoke.mockResolvedValue({ operationId: 'op-1', state: 'pending' });
  const draft = await recordOffline.saveRecordDraft(scope, 'customer', { localId: 'local:11111111-1111-4111-8111-111111111111', remoteId: null, baseVersion: null, payload: { name: 'Cliente' } });
  expect(draft).toEqual({ operationId: 'op-1', state: 'pending' });
  expect(invoke).toHaveBeenCalledWith('offline-store', expect.objectContaining({ method: 'save-record', recordType: 'customer' }));
  await recordOffline.enqueueRecord(scope, 'customer', { operation: 'create', localId: 'local:11111111-1111-4111-8111-111111111111', remoteId: null, baseVersion: null, payload: { name: 'Cliente' } });
  const queue = invoke.mock.calls.find(call => call[1].method === 'queue-record-operation')[1];
  expect(queue.operation).toMatchObject({ recordType: 'customer', operation: 'create', localId: 'local:11111111-1111-4111-8111-111111111111' });
  expect(queue.operation.operationId).toMatch(/^[0-9a-f-]{36}$/);
});

it('sincroniza criação, confirma somente o ACK exato e para em conflito', async () => {
  const operation = {
    operationId: '11111111-1111-4111-8111-111111111111',
    recordType: 'customer', operation: 'create',
    localId: 'local:22222222-2222-4222-8222-222222222222',
    remoteId: null, baseVersion: null, leaseToken: 'lease-1', payload: { name: 'Cliente' },
  };
  invoke.mockImplementation((_channel: string, request: any) => {
    if (request.method === 'claim-record-operations') return Promise.resolve(invoke.mock.calls.filter(call => call[1].method === 'claim-record-operations').length === 1 ? [operation] : []);
    return Promise.resolve({ confirmed: true });
  });
  jest.spyOn(apiClient, 'post').mockResolvedValue({
    ok: true, status: 201, error: null,
    data: { success: true, data: { type: 'customer', id: 55, version: '2026-10-25T12:00:00.000Z', localId: operation.localId } },
  });
  await recordOffline.syncRecordOperations(scope);
  expect(apiClient.post).toHaveBeenCalledWith(
    'offline-records/customer/create',
    expect.objectContaining({ clientRequestId: operation.operationId, localId: operation.localId, payload: { name: 'Cliente' } }),
    { legalEntityId: 902, reauth: false }
  );
  expect(invoke).toHaveBeenCalledWith('offline-store', expect.objectContaining({
    method: 'ack-record-operation',
    ack: expect.objectContaining({ recordType: 'customer', localId: operation.localId, id: 55, version: '2026-10-25T12:00:00.000Z' }),
  }));

  invoke.mockClear();
  invoke.mockImplementation((_channel: string, request: any) => {
    if (request.method === 'claim-record-operations') return Promise.resolve(invoke.mock.calls.filter(call => call[1].method === 'claim-record-operations').length === 1 ? [operation] : []);
    return Promise.resolve({ retained: true });
  });
  jest.spyOn(apiClient, 'post').mockResolvedValue({ ok: false, status: 409, error: 'Versão divergente', code: 'OFFLINE_RECORD_CONFLICT', data: null });
  await recordOffline.syncRecordOperations(scope);
  expect(invoke).toHaveBeenCalledWith('offline-store', expect.objectContaining({ method: 'reject-record-operation', code: 'CONFLICT' }));
});

it('referência local pendente não é bloqueada como conflito definitivo', async () => {
  const operation = {
    operationId: '33333333-3333-4333-8333-333333333333', recordType: 'product', operation: 'create',
    localId: 'local:44444444-4444-4444-8444-444444444444', remoteId: null, baseVersion: null,
    leaseToken: 'lease-2', payload: { name: 'Produto', supplier_id: 'local:55555555-5555-4555-8555-555555555555' },
  };
  invoke.mockImplementation((_channel: string, request: any) => {
    if (request.method === 'claim-record-operations') return Promise.resolve(invoke.mock.calls.filter(call => call[1].method === 'claim-record-operations').length === 1 ? [operation] : []);
    return Promise.resolve({ retained: true });
  });
  jest.spyOn(apiClient, 'post').mockResolvedValue({ ok: false, status: 409, error: 'Aguardando', code: 'OFFLINE_LOCAL_REFERENCE_PENDING', data: null });
  await recordOffline.syncRecordOperations(scope);
  expect(invoke).toHaveBeenCalledWith('offline-store', expect.objectContaining({ method: 'reject-record-operation', code: 'NETWORK' }));
});
