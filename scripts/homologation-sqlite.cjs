// Integração SQLite real -> API local -> PostgreSQL. Não usa banco de produção.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const { OfflineStore } = require('../electron/offlineStore');

(async () => {
  const base = process.env.HOMOLOGATION_API || 'http://127.0.0.1:3010';
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const context = JSON.parse(fs.readFileSync(process.env.HOMOLOGATION_CONTEXT || '/tmp/opencode/homologation-context.json', 'utf8'));
  assert.match(context.username, /^qa\./, 'Use somente o perfil sintético do harness.');
  const output = process.env.HOMOLOGATION_OUTPUT || '/tmp/opencode';
  const directory = fs.mkdtempSync(path.join(output, 'sqlite-e2e-'));
  const filename = path.join(directory, 'local.sqlite'), key = randomBytes(32), installation = randomUUID();
  const results = [];
  let store, token, now = Date.now();
  const check = (name, condition) => { assert.ok(condition, name); results.push({ name, status: 'Aprovado' }); console.log('PASS', name); };
  const request = async (method, route, body, expected = 200, entityId = context.legalEntityId) => {
    const response = await fetch(base + route, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(entityId ? { 'x-legal-entity-id': String(entityId) } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    const data = await response.json(); assert.equal(response.status, expected, JSON.stringify(data)); return data;
  };
  try {
    const login = await request('POST', '/login/auth-employee', { username: context.username, password: context.password }, 200, null);
    token = login.token;
    const scope = { companyId: context.companyId, legalEntityId: context.legalEntityId, userId: Number(login.user.id) };
    store = new OfflineStore(filename, key, installation, { now: () => now });
    const payload = { values: { notes: `SQLite-Postgres-${randomUUID()}` }, products: [], selectedCustomer: null, addressConfirmed: false, orderNumber: 'pending' };
    const row = store.save(scope, 'new', payload, null);
    let operation = store.claim(scope)[0];
    // Porta local fechada: falha de rede real, sem mock da API.
    await assert.rejects(fetch('http://127.0.0.1:1/sales-drafts', { signal: AbortSignal.timeout(1000) }));
    store.reject(scope, operation.operationId, operation.leaseToken, 'NETWORK');
    check('queda de rede mantém rascunho e outbox SQLite', store.stats(scope).pending === 1 && store.read(scope, 'new', row.revisionId).values.notes === payload.values.notes);
    store.close(); now += 10000;
    store = new OfflineStore(filename, key, installation, { now: () => now });
    operation = store.claim(scope)[0];
    const send = op => request('PUT', `/sales-drafts/${op.draftId}`, { owner: scope, revisionId: op.revisionId, payload: op.payload });
    const firstAck = await send(operation);
    check('API confirma revisão gravada no PostgreSQL', firstAck.success && firstAck.data.revisionId === row.revisionId);
    // Backup feito antes da confirmação: restaurado depois, não pode duplicar efeitos.
    const staleBackup = path.join(directory, 'stale-before-ack.sqlite');
    store.backup(staleBackup);
    // Simula perda da confirmação local APÓS o COMMIT remoto: mantém lease.
    store.close(); now += 61000;
    store = new OfflineStore(filename, key, installation, { now: () => now });
    const retry = store.claim(scope)[0];
    check('reinício reenvia o mesmo UUID, não uma nova operação', retry.operationId === operation.operationId);
    const retryAck = await send(retry);
    check('confirmação idempotente limpa fila local', store.acknowledge(scope, retry.operationId, retry.leaseToken, retryAck.data).confirmed && store.stats(scope).pending === 0 && store.load(scope, 'new').synced);
    const stale = new OfflineStore(staleBackup, key, installation, { now: () => now });
    try {
      const staleOperation = stale.claim(scope)[0];
      const staleAck = await send(staleOperation);
      const staleConfirmed = stale.acknowledge(scope, staleOperation.operationId, staleOperation.leaseToken, staleAck.data).confirmed;
      const afterStale = await request('GET', '/sales-drafts');
      check('backup antigo reenviado não duplica revisão nem efeitos', staleConfirmed && afterStale.data.filter(item => item.draft_id === row.draftId && item.revision_id === row.revisionId).length === 1);
    } finally { stale.close(); }
    const remote = await request('GET', '/sales-drafts');
    check('PostgreSQL contém exatamente uma revisão com conteúdo correto', remote.data.filter(item => item.draft_id === row.draftId && item.revision_id === row.revisionId && item.payload.values.notes === payload.values.notes).length === 1);
    await request('PUT', `/sales-drafts/${row.draftId}`, { owner: scope, revisionId: row.revisionId, payload: { ...payload, values: { notes: 'different' } } }, 409);
    check('revisão imutável não pode ser sobrescrita', true);
    const other = await request('GET', '/sales-drafts', undefined, 200, context.branchLegalEntityId);
    check('outro CNPJ não lê o rascunho', !other.data.some(item => item.draft_id === row.draftId));
    const backup = path.join(directory, 'backup.sqlite'); store.backup(backup);
    const restored = new OfflineStore(backup, key, installation);
    try { check('backup SQLite restaurável conserva revisão confirmada', restored.load(scope, 'new').synced && restored.read(scope, 'new', row.revisionId).values.notes === payload.values.notes); }
    finally { restored.close(); }
    store.close(); store = null;
    check('arquivo local não contém observação em texto aberto', !fs.readFileSync(filename).includes(Buffer.from(payload.values.notes)));
  } catch (error) { results.push({ status: 'Reprovado', error: error.message }); console.error(error); process.exitCode = 1; }
  finally {
    if (store) store.close(); key.fill(0);
    fs.writeFileSync(path.join(output, 'sqlite-e2e.json'), JSON.stringify({ scope: 'SQLite e API/PostgreSQL locais reais; perfil sintético; queda de rede e perda de ACK injetadas.', results }, null, 2));
  }
})();
