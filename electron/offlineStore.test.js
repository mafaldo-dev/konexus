const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomBytes, randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { OfflineStore } = require('./offlineStore');
const { dispatch, openProtectedStore } = require('./offlineStorage');
const scope = { companyId: 10, legalEntityId: 20, userId: 30 };
const payload = note => ({ values: { notes: note }, products: [], selectedCustomer: null, addressConfirmed: false, orderNumber: 'pending' });
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'konexus-sqlite-'));
  const filename = path.join(directory, 'local.sqlite'), key = randomBytes(32), installation = randomUUID();
  const stores = [];
  const open = options => { const store = new OfflineStore(filename, key, installation, options); stores.push(store); return store; };
  t.after(() => { for (const store of stores) { try { store.close(); } catch {} } fs.rmSync(directory, { recursive: true, force: true }); });
  return { directory, filename, key, installation, open };
}
test('SQLite real: migration, constraints, criptografia e persistência após reabrir', t => {
  const f = fixture(t), store = f.open();
  const row = store.save(scope, 'new', payload('CONFIDENTIAL-QA-PAYLOAD'), null);
  assert.equal(store.db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  assert.equal(store.db.prepare('PRAGMA journal_mode').get().journal_mode, 'wal');
  assert.equal(store.db.prepare('PRAGMA synchronous').get().synchronous, 2);
  assert.equal(store.stats(scope).pending, 1);
  store.close();
  const reopened = f.open();
  assert.equal(reopened.load(scope, 'new').revisionId, row.revisionId);
  assert.equal(reopened.read(scope, 'new', row.revisionId).values.notes, 'CONFIDENTIAL-QA-PAYLOAD');
  for (const name of fs.readdirSync(f.directory)) assert.equal(fs.readFileSync(path.join(f.directory, name)).includes(Buffer.from('CONFIDENTIAL-QA-PAYLOAD')), false);
  assert.throws(() => new OfflineStore(f.filename, randomBytes(32), f.installation), /adulterado|incorreta/);
  assert.throws(() => new OfflineStore(f.filename, f.key, randomUUID()), /outra instalação/);
});
test('falha no outbox reverte também o documento: transação atômica', t => {
  const store = fixture(t).open();
  store.db.exec("CREATE TRIGGER fail_outbox BEFORE INSERT ON offline_outbox BEGIN SELECT RAISE(ABORT,'fault injection'); END");
  assert.throws(() => store.save(scope, 'new', payload('não pode ficar órfão'), null), /fault injection/);
  assert.equal(store.load(scope, 'new'), null);
  assert.equal(store.stats(scope).pending, 0);
});
test('duas conexões: versão concorrente recusada e edição pendente coalescida', t => {
  const f = fixture(t), a = f.open(), b = f.open();
  const first = a.save(scope, 'new', payload('primeiro'), null);
  const second = b.save(scope, 'new', payload('segundo'), first.revisionId);
  assert.throws(() => a.save(scope, 'new', payload('obsoleto'), first.revisionId), /outra janela/);
  assert.equal(a.read(scope, 'new', second.revisionId).values.notes, 'segundo');
  assert.equal(a.stats(scope).pending, 1);
  assert.equal(a.load({ ...scope, userId: 31 }, 'new'), null);
  assert.deepEqual(a.claim({ ...scope, legalEntityId: 21 }), []);
  assert.throws(() => a.save({ ...scope, userId: NaN }, 'new', payload('x'), null), /inválidos/);
  assert.throws(() => dispatch(a, { method: 'sql', sql: 'DELETE FROM offline_documents' }), /não permitida/);
});
test('confirmação antiga não apaga edição nova nem aceita escopo/token incorreto', t => {
  const store = fixture(t).open();
  const first = store.save(scope, 'new', payload('primeiro'), null);
  const operation = store.claim(scope)[0];
  assert.deepEqual(store.claim(scope), []);
  const next = store.save(scope, 'new', payload('novo durante envio'), first.revisionId);
  const ack = { draftId: first.draftId, revisionId: first.revisionId };
  assert.equal(store.acknowledge({ ...scope, userId: 31 }, operation.operationId, operation.leaseToken, ack).confirmed, false);
  assert.throws(() => store.acknowledge(scope, operation.operationId, operation.leaseToken, { ...ack, revisionId: randomUUID() }), /não confirmou/);
  assert.equal(store.stats(scope).leased, 1);
  assert.equal(store.acknowledge(scope, operation.operationId, operation.leaseToken, ack).confirmed, true);
  assert.equal(store.load(scope, 'new').synced, false);
  assert.equal(store.read(scope, 'new', next.revisionId).values.notes, 'novo durante envio');
  const latest = store.claim(scope)[0];
  store.acknowledge(scope, latest.operationId, latest.leaseToken, { draftId: latest.draftId, revisionId: latest.revisionId });
  assert.equal(store.load(scope, 'new').synced, true);
  assert.equal(store.stats(scope).pending, 0);
});
test('queda após envio: lease expira, mesmo UUID é reenviado, ack antigo não interfere', t => {
  let now = 1000;
  const store = fixture(t).open({ now: () => now });
  store.save(scope, 'new', payload('retry'), null);
  const first = store.claim(scope)[0];
  now += 61000;
  const retry = store.claim(scope)[0];
  assert.equal(first.operationId, retry.operationId);
  assert.notEqual(first.leaseToken, retry.leaseToken);
  const ack = { draftId: retry.draftId, revisionId: retry.revisionId };
  assert.equal(store.acknowledge(scope, first.operationId, first.leaseToken, ack).confirmed, false);
  assert.equal(store.acknowledge(scope, retry.operationId, retry.leaseToken, ack).confirmed, true);
  assert.equal(store.acknowledge(scope, retry.operationId, retry.leaseToken, ack).confirmed, false);
  assert.equal(store.db.prepare('SELECT count(*) n FROM offline_receipts').get().n, 1);
});
test('falhas transitórias mantêm dados; bloqueio de conflito não é reenviado automaticamente', t => {
  let now = 1000;
  const store = fixture(t).open({ now: () => now });
  const row = store.save(scope, 'new', payload('preservar'), null);
  let operation = store.claim(scope)[0];
  store.reject(scope, operation.operationId, operation.leaseToken, 'NETWORK');
  assert.equal(store.stats(scope).pending, 1);
  assert.equal(store.claim(scope).length, 0);
  now += 10000;
  operation = store.claim(scope)[0];
  store.reject(scope, operation.operationId, operation.leaseToken, 'AUTH');
  assert.equal(store.stats(scope).blocked, 1);
  store.resumeAuth(scope);
  operation = store.claim(scope)[0];
  store.reject(scope, operation.operationId, operation.leaseToken, 'CONFLICT');
  store.resumeAuth(scope); now += 100000;
  assert.equal(store.claim(scope).length, 0);
  assert.equal(store.read(scope, 'new', row.revisionId).values.notes, 'preservar');
});
test('migração preserva IDs, é idempotente e não ressuscita dados já concluídos', t => {
  const store = fixture(t).open();
  const legacy = { key: '10:20:30:new', draftId: randomUUID(), revisionId: randomUUID(), synced: false };
  assert.equal(store.importLegacy(scope, 'new', legacy, payload('legado')).imported, true);
  assert.equal(store.importLegacy(scope, 'new', legacy, payload('legado')).imported, false);
  assert.equal(store.load(scope, 'new').draftId, legacy.draftId);
  assert.equal(store.clear(scope, 'new', randomUUID()).deleted, false);
  assert.equal(store.clear(scope, 'new', legacy.revisionId).deleted, true);
  assert.equal(store.stats(scope).pending, 0);
  assert.equal(store.importLegacy(scope, 'new', legacy, payload('legado')).row, null);
  assert.throws(() => store.importLegacy(scope, 'new', { ...legacy, revisionId: randomUUID() }, payload('mudança antiga')), /versão antiga/);
});
test('disco cheio não sobrescreve rascunho nem fila e devolve erro real', t => {
  const store = fixture(t).open();
  const first = store.save(scope, 'new', payload('antes-do-disco-cheio'), null);
  const pages = store.db.prepare('PRAGMA page_count').get().page_count;
  store.db.exec(`PRAGMA max_page_count=${pages}`);
  assert.throws(() => store.save(scope, 'new', payload('x'.repeat(90000)), first.revisionId), /disk is full|full/i);
  const current = store.load(scope, 'new');
  assert.equal(current.revisionId, first.revisionId);
  assert.equal(store.read(scope, 'new', current.revisionId).values.notes, 'antes-do-disco-cheio');
  assert.equal(store.stats(scope).pending, 1);
});
test('dois dispositivos isolados não compartilham arquivo nem enxergam rascunhos', t => {
  const f = fixture(t), deviceA = f.open();
  const isolated = fixture(t), deviceB = isolated.open();
  const a = deviceA.save(scope, 'new', payload('dispositivo-A'), null);
  const b = deviceB.save(scope, 'new', payload('dispositivo-B'), null);
  assert.notEqual(a.draftId, b.draftId);
  assert.equal(deviceA.load(scope, 'new').draftId, a.draftId);
  assert.equal(deviceB.load(scope, 'new').draftId, b.draftId);
  assert.equal(deviceA.stats(scope).pending, 1);
  assert.equal(deviceB.stats(scope).pending, 1);
});
test('cofre protegido cria chave, reabre, faz backup e recusa banco sem chave', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'konexus-vault-'));
  const installation = randomUUID();
  const safeStorage = {
    isEncryptionAvailable: () => true,
    getSelectedStorageBackend: () => 'dpapi',
    encryptString: value => Buffer.from(`vault:${value}`),
    decryptString: value => value.toString().slice(6),
  };
  const opened = [];
  t.after(() => { for (const item of opened) { try { item.close(); } catch {} } fs.rmSync(directory, { recursive: true, force: true }); });
  const first = openProtectedStore(directory, safeStorage, installation);
  opened.push(first.store);
  const row = first.store.save(scope, 'new', payload('segredo-do-cofre'), null);
  const keyFile = path.join(directory, 'offline', 'key.v1.enc');
  const dbFile = path.join(directory, 'offline', 'konexus.sqlite');
  assert.equal(fs.existsSync(keyFile), true);
  assert.equal(fs.existsSync(dbFile), true);
  if (process.platform !== 'win32') assert.equal(fs.statSync(keyFile).mode & 0o777, 0o600);
  const backup = first.backup();
  assert.equal(backup.schemaVersion, 2);
  assert.match(backup.sha256, /^[0-9a-f]{64}$/);
  assert.equal(fs.existsSync(path.join(backup.directory, 'key.v1.enc')), true);
  assert.equal(fs.readFileSync(path.join(backup.directory, 'konexus.sqlite')).includes(Buffer.from('segredo-do-cofre')), false);
  first.store.close();
  opened.splice(opened.indexOf(first.store), 1);
  const reopened = openProtectedStore(directory, safeStorage, installation);
  opened.push(reopened.store);
  assert.equal(reopened.store.read(scope, 'new', row.revisionId).values.notes, 'segredo-do-cofre');
  reopened.store.close();
  opened.splice(opened.indexOf(reopened.store), 1);
  fs.rmSync(keyFile);
  assert.throws(() => openProtectedStore(directory, safeStorage, installation), /Chave local ausente/);
});
test('backup real reabre com documento e outbox íntegros; adulteração é detectada', t => {
  const f = fixture(t), store = f.open();
  const row = store.save(scope, 'new', payload('backup'), null);
  const backup = path.join(f.directory, 'backup.sqlite');
  store.backup(backup);
  const restored = new OfflineStore(backup, f.key, f.installation);
  try {
    assert.equal(restored.read(scope, 'new', row.revisionId).values.notes, 'backup');
    assert.equal(restored.stats(scope).pending, 1);
    restored.db.prepare('UPDATE offline_outbox SET encrypted=?').run(Buffer.alloc(40));
    assert.throws(() => restored.claim(scope), /inválido/);
    assert.equal(restored.stats(scope).pending, 1);
  } finally { restored.close(); }
});
test('encerramento abrupto após COMMIT conserva SQLite/WAL e fila', t => {
  const f = fixture(t);
  const child = spawnSync(process.execPath, ['-e', `
    const { OfflineStore } = require(process.argv[1]);
    const s = new OfflineStore(process.argv[2],Buffer.from(process.argv[3],'hex'),process.argv[4]);
    s.save({companyId:10,legalEntityId:20,userId:30},'new',{values:{notes:'crash-commit'},products:[]},null);
    process.exit(77);
  `, require.resolve('./offlineStore'), f.filename, f.key.toString('hex'), f.installation], { encoding: 'utf8' });
  assert.equal(child.status, 77, child.stderr);
  const store = f.open(), row = store.load(scope, 'new');
  assert.equal(store.read(scope, 'new', row.revisionId).values.notes, 'crash-commit');
  assert.equal(store.stats(scope).pending, 1);
});
test('cofre indisponível falha fechado antes de criar banco ou chave', t => {
  const f = fixture(t);
  assert.throws(() => openProtectedStore(f.directory, { isEncryptionAvailable: () => false }, f.installation), /Cofre/);
  assert.equal(fs.existsSync(path.join(f.directory, 'offline')), false);
});
function reservation(overrides = {}) {
  return {
    id: randomUUID(),
    reservationToken: randomBytes(32).toString('base64url'),
    deviceId: 99,
    deviceName: 'Estação QA',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    items: [{ productId: 101, quantity: 2 }],
    ...overrides,
  };
}
function orderPayload(scope, reservationId, operationId, quantity = 2) {
  return {
    orderDate: '2026-10-24',
    orderStatus: 'pending',
    customerId: 55,
    totalAmount: quantity * 10,
    currency: 'BRL',
    salesperson: 'QA',
    carrier: 'QA',
    payment_method: 'pix',
    orderItems: [{ productId: 101, quantity, unitPrice: 10 }],
    clientRequestId: operationId,
    reservationId,
  };
}
test('SQLite v2: reserva cifrada, fila de pedido, claim, ack exato e limpeza do rascunho', t => {
  const store = fixture(t).open();
  const res = store.saveReservation(scope, 'new', reservation());
  assert.equal(res.status, 'active');
  assert.equal(res.reservationToken, undefined);
  assert.deepEqual(res.items, [{ productId: 101, quantity: 2 }]);
  assert.equal(store.loadReservation(scope, 'new').id, res.id);
  const raw = store.db.prepare('SELECT token_encrypted FROM offline_stock_reservations WHERE reservation_id=?').get(res.id);
  assert.equal(Buffer.from(raw.token_encrypted).includes(Buffer.from(res.id)), false);
  assert.equal(Buffer.from(raw.token_encrypted).includes(Buffer.from('qa-token')), false);

  const draft = store.save(scope, 'new', payload('pedido offline'), null);
  const operationId = randomUUID();
  const queued = store.queueOrder(scope, 'new', orderPayload(scope, res.id, operationId), res.id, operationId, draft.revisionId);
  assert.equal(queued.state, 'pending');
  assert.equal(queued.draftRevision, draft.revisionId);
  assert.equal(store.loadReservation(scope, 'new').status, 'queued');
  assert.throws(() => store.queueOrder(scope, 'new', orderPayload(scope, res.id, randomUUID()), res.id, randomUUID(), draft.revisionId), /enfileirado/);

  const claimed = store.claimOrders(scope)[0];
  assert.equal(claimed.operationId, operationId);
  assert.equal(claimed.reservationId, res.id);
  assert.equal(claimed.payload.customerId, 55);
  assert.match(claimed.reservationToken, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(store.claimOrders(scope).length, 0);
  assert.throws(() => store.acknowledgeOrder(scope, operationId, claimed.leaseToken, { orderId: 1, orderNumber: 'P-1', reservationId: randomUUID() }), /outra reserva/);
  const acked = store.acknowledgeOrder(scope, operationId, claimed.leaseToken, { orderId: 1, orderNumber: 'P-100', reservationId: res.id });
  assert.equal(acked.confirmed, true);
  assert.equal(acked.operation.state, 'confirmed');
  assert.equal(acked.operation.serverOrderNumber, 'P-100');
  assert.equal(store.loadReservation(scope, 'new'), null);
  assert.equal(store.load(scope, 'new'), null);
  assert.equal(store.listOrders(scope)[0].state, 'confirmed');
  assert.equal(store.stats(scope).orders.confirmed, 1);
  assert.equal(store.stats(scope).reservations.consumed, 1);
  assert.equal(store.acknowledgeOrder(scope, operationId, claimed.leaseToken, { orderId: 1, orderNumber: 'P-100', reservationId: res.id }).confirmed, false);
});
test('SQLite v2: lease expira, mesmo UUID é reenviado e ack antigo não confirma', t => {
  let now = 1000;
  const store = fixture(t).open({ now: () => now });
  const res = store.saveReservation(scope, 'new', reservation());
  const operationId = randomUUID();
  store.queueOrder(scope, 'new', orderPayload(scope, res.id, operationId), res.id, operationId, null);
  const first = store.claimOrders(scope)[0];
  now += 61000;
  const retry = store.claimOrders(scope)[0];
  assert.equal(first.operationId, retry.operationId);
  assert.notEqual(first.leaseToken, retry.leaseToken);
  assert.equal(store.acknowledgeOrder(scope, operationId, first.leaseToken, { orderId: 1, orderNumber: 'P-1', reservationId: res.id }).confirmed, false);
  assert.equal(store.acknowledgeOrder(scope, operationId, retry.leaseToken, { orderId: 1, orderNumber: 'P-1', reservationId: res.id }).confirmed, true);
});
test('SQLite v2: conflito bloqueia sem reenvio automático, retry manual e AUTH/DEVICE retomam', t => {
  let now = 1000;
  const store = fixture(t).open({ now: () => now });
  const res = store.saveReservation(scope, 'new', reservation());
  const operationId = randomUUID();
  store.queueOrder(scope, 'new', orderPayload(scope, res.id, operationId), res.id, operationId, null);
  let claimed = store.claimOrders(scope)[0];
  store.rejectOrder(scope, operationId, claimed.leaseToken, 'CONFLICT');
  assert.equal(store.loadOrder(scope, operationId).state, 'blocked');
  assert.equal(store.loadReservation(scope, 'new').status, 'blocked');
  assert.equal(store.claimOrders(scope).length, 0);
  assert.equal(store.retryOrder(scope, operationId).state, 'pending');
  assert.equal(store.loadReservation(scope, 'new').status, 'queued');

  claimed = store.claimOrders(scope)[0];
  store.rejectOrder(scope, operationId, claimed.leaseToken, 'AUTH');
  assert.equal(store.loadOrder(scope, operationId).state, 'blocked');
  assert.equal(store.loadReservation(scope, 'new').status, 'blocked');
  assert.equal(store.resumeOrderAuth(scope).resumed, 1);
  assert.equal(store.loadOrder(scope, operationId).state, 'pending');
  assert.equal(store.loadReservation(scope, 'new').status, 'queued');

  claimed = store.claimOrders(scope)[0];
  store.rejectOrder(scope, operationId, claimed.leaseToken, 'DEVICE');
  assert.equal(store.loadOrder(scope, operationId).state, 'blocked');
  now += 1000;
  assert.equal(store.resumeOrderAuth(scope).resumed, 1);
  claimed = store.claimOrders(scope)[0];
  store.rejectOrder(scope, operationId, claimed.leaseToken, 'NETWORK');
  assert.equal(store.loadOrder(scope, operationId).state, 'pending');
  assert.equal(store.claimOrders(scope).length, 0);
});
test('SQLite v2: payload adulterado bloqueia em vez de vazar ou reenviar', t => {
  const store = fixture(t).open();
  const res = store.saveReservation(scope, 'new', reservation());
  const operationId = randomUUID();
  store.queueOrder(scope, 'new', orderPayload(scope, res.id, operationId), res.id, operationId, null);
  store.db.prepare('UPDATE offline_order_outbox SET payload_encrypted=? WHERE operation_id=?').run(Buffer.alloc(40), operationId);
  assert.deepEqual(store.claimOrders(scope), []);
  assert.equal(store.loadOrder(scope, operationId).state, 'blocked');
  assert.equal(store.loadOrder(scope, operationId).errorCode, 'LOCAL_CORRUPT');
  assert.equal(store.loadReservation(scope, 'new').status, 'blocked');
  assert.throws(() => store.retryOrder(scope, operationId), /corrompido/);
});
test('SQLite v2: migração de banco v1 existente preserva rascunho e cria journal de pedidos', t => {
  const f = fixture(t);
  const first = f.open();
  const draft = first.save(scope, 'new', payload('rascunho v1'), null);
  first.db.exec('DROP TABLE offline_order_outbox; DROP TABLE offline_stock_reservations; PRAGMA user_version=1;');
  first.close();
  const upgraded = f.open();
  assert.equal(upgraded.schemaVersion(), 2);
  assert.equal(upgraded.read(scope, 'new', draft.revisionId).values.notes, 'rascunho v1');
  assert.equal(upgraded.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='offline_stock_reservations'").get().name, 'offline_stock_reservations');
  assert.equal(upgraded.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='offline_order_outbox'").get().name, 'offline_order_outbox');
});
test('SQLite v2: banco de versão futura falha fechado sem alterar dados', t => {
  const f = fixture(t), store = f.open();
  store.db.exec('PRAGMA user_version=3;');
  store.close();
  assert.throws(() => f.open(), /versão mais nova/);
});
test('SQLite v2: reserva e pedido de outro escopo não são visíveis', t => {
  const store = fixture(t).open();
  const res = store.saveReservation(scope, 'new', reservation());
  assert.equal(store.loadReservation({ ...scope, userId: 31 }, 'new'), null);
  assert.deepEqual(store.listReservations({ ...scope, userId: 31 }), []);
  assert.equal(store.loadReservation({ ...scope, legalEntityId: 21 }, 'new'), null);
  assert.throws(() => store.saveReservation({ ...scope, companyId: NaN }, 'new', reservation()), /inválidos/);
  const operationId = randomUUID();
  assert.throws(() => store.queueOrder({ ...scope, userId: 31 }, 'new', orderPayload(scope, res.id, operationId), res.id, operationId, null), /não encontrada/);
});
test('SQLite v2: liberar reserva bloqueada remove o journal que não pode mais ser consumido', t => {
  const store = fixture(t).open();
  const res = store.saveReservation(scope, 'new', reservation());
  const operationId = randomUUID();
  store.queueOrder(scope, 'new', orderPayload(scope, res.id, operationId), res.id, operationId, null);
  const claimed = store.claimOrders(scope)[0];
  store.rejectOrder(scope, operationId, claimed.leaseToken, 'VALIDATION');
  assert.equal(store.loadOrder(scope, operationId).state, 'blocked');
  const cancelled = store.markReservationCancelled(scope, res.id);
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(store.loadOrder(scope, operationId), null);
  assert.equal(store.listOrders(scope).length, 0);
  assert.equal(store.markReservationCancelled(scope, res.id).status, 'cancelled');
  assert.equal(store.loadOrder(scope, operationId), null);
});
test('SQLite v2: liberação confirmada pela central remove journal enfileirado ou em voo', t => {
  const store = fixture(t).open();
  const res = store.saveReservation(scope, 'new', reservation());
  const operationId = randomUUID();
  store.queueOrder(scope, 'new', orderPayload(scope, res.id, operationId), res.id, operationId, null);
  assert.throws(() => store.markReservationCancelled(scope, res.id), /pedido enfileirado/i);
  const claimed = store.claimOrders(scope)[0];
  assert.ok(claimed.leaseToken);
  const cancelled = store.markReservationCancelled(scope, res.id, { force: true });
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(store.loadOrder(scope, operationId), null);
  assert.deepEqual(store.claimOrders(scope), []);
  assert.equal(store.stats(scope).orders.confirmed, 0);
});
