import { apiClient } from '../api/client';

/** Exercita a ponte renderer -> IPC sem simular o SQLite: o banco real é testado no processo principal. */
const scope = { companyId: 901, legalEntityId: 902, userId: 903 };
let drafts: typeof import('./salesDrafts');
let invoke: jest.Mock;

function installBridge() {
  const database = {
    transaction: () => ({
      objectStore: () => ({
        getAll: () => {
          const request: any = {};
          queueMicrotask(() => { request.result = []; request.onsuccess?.(); });
          return request;
        },
      }),
    }),
  };
  (window as any).indexedDB = {
    open: () => {
      const request: any = {};
      queueMicrotask(() => { request.result = database; request.onsuccess?.(); });
      return request;
    },
  };
  invoke = jest.fn();
  (window as any).ipcRenderer = { invoke };
}

beforeAll(async () => {
  installBridge();
  drafts = await import('./salesDrafts');
});

beforeEach(() => {
  invoke.mockReset();
  window.localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('carrega o rascunho da ponte SQLite sem abrir IndexedDB com conteúdo', async () => {
  const row = { ...scope, key: '901:902:903:new', draftId: crypto.randomUUID(), revisionId: crypto.randomUUID(), updatedAt: new Date().toISOString(), synced: false, storage: 'sqlite' as const };
  invoke.mockResolvedValue(row);

  await expect(drafts.loadLocalDraft(scope)).resolves.toEqual(row);
  expect(invoke).toHaveBeenCalledWith('offline-store', { method: 'load', scope, slot: 'new' });
});

it('salva pela ponte e anuncia a mudança para as outras telas', async () => {
  const listener = jest.fn();
  window.addEventListener('konexus:drafts-changed', listener);
  const row = { ...scope, key: '901:902:903:new', draftId: crypto.randomUUID(), revisionId: crypto.randomUUID(), updatedAt: new Date().toISOString(), synced: false, storage: 'sqlite' as const };
  invoke.mockResolvedValue(row);
  const payload = { values: { notes: 'ponte' }, products: [], selectedCustomer: null, addressConfirmed: false, orderNumber: 'pending' };

  await expect(drafts.saveLocalDraft(scope, payload, null)).resolves.toEqual(row);
  expect(invoke).toHaveBeenCalledWith('offline-store', { method: 'save', scope, slot: 'new', payload, expectedRevision: null });
  expect(listener).toHaveBeenCalled();
  window.removeEventListener('konexus:drafts-changed', listener);
});

it('sincroniza somente após ACK com os mesmos IDs e libera a fila', async () => {
  const operation = { operationId: crypto.randomUUID(), revisionId: crypto.randomUUID(), draftId: crypto.randomUUID(), leaseToken: crypto.randomUUID(), payload: { values: {}, products: [] } };
  invoke.mockImplementation(async (_channel, request) => {
    if (request.method === 'claim') return invoke.mock.calls.filter(([, item]) => item.method === 'claim').length === 1 ? [operation] : [];
    if (request.method === 'ack') return { confirmed: true };
    throw new Error('método inesperado: ' + request.method);
  });
  jest.spyOn(apiClient, 'put').mockResolvedValue({ ok: true, status: 200, data: { success: true, data: { draftId: operation.draftId, revisionId: operation.revisionId } }, error: null });

  await drafts.syncLocalDrafts(scope);

  expect(apiClient.put).toHaveBeenCalledWith(`sales-drafts/${operation.draftId}`, {
    owner: scope, revisionId: operation.revisionId, payload: operation.payload,
  }, { legalEntityId: scope.legalEntityId, reauth: false });
  expect(invoke).toHaveBeenCalledWith('offline-store', {
    method: 'ack', scope, operationId: operation.operationId, leaseToken: operation.leaseToken,
    ack: { draftId: operation.draftId, revisionId: operation.revisionId },
  });
});

it('recusa confirmação divergente e mantém a operação bloqueada no SQLite', async () => {
  const operation = { operationId: crypto.randomUUID(), revisionId: crypto.randomUUID(), draftId: crypto.randomUUID(), leaseToken: crypto.randomUUID(), payload: { values: {}, products: [] } };
  invoke.mockImplementation(async (_channel, request) => {
    if (request.method === 'claim') return invoke.mock.calls.filter(([, item]) => item.method === 'claim').length === 1 ? [operation] : [];
    if (request.method === 'reject') return { retained: true };
    throw new Error('método inesperado: ' + request.method);
  });
  jest.spyOn(apiClient, 'put').mockResolvedValue({ ok: true, status: 200, data: { success: true, data: { draftId: 'outro', revisionId: 'outro' } }, error: null });

  await drafts.syncLocalDrafts(scope);

  expect(invoke).toHaveBeenCalledWith('offline-store', {
    method: 'reject', scope, operationId: operation.operationId, leaseToken: operation.leaseToken, code: 'INVALID_ACK',
  });
  expect(invoke).not.toHaveBeenCalledWith('offline-store', expect.objectContaining({ method: 'ack' }));
});

it('remove o prefixo técnico do IPC e mostra a mensagem de cofre indisponível', async () => {
  invoke.mockRejectedValue(new Error("Error invoking remote method 'offline-store': Error: Cofre do sistema indisponível."));

  await expect(drafts.loadLocalDraft(scope)).rejects.toThrow('Cofre do sistema indisponível.');
});
