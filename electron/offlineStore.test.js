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
  assert.equal(backup.schemaVersion, 7);
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
test('SQLite v4: migração de banco v1 existente preserva rascunho e cria journals de pedidos e domínios', t => {
  const f = fixture(t);
  const first = f.open();
  const draft = first.save(scope, 'new', payload('rascunho v1'), null);
  first.db.exec('DROP TABLE offline_order_outbox; DROP TABLE offline_stock_reservations; PRAGMA user_version=1;');
  first.close();
  const upgraded = f.open();
  assert.equal(upgraded.schemaVersion(), 7);
  assert.equal(upgraded.read(scope, 'new', draft.revisionId).values.notes, 'rascunho v1');
  assert.equal(upgraded.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='offline_stock_reservations'").get().name, 'offline_stock_reservations');
  assert.equal(upgraded.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='offline_order_outbox'").get().name, 'offline_order_outbox');
  assert.equal(upgraded.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='offline_domain_snapshots'").get().name, 'offline_domain_snapshots');
  assert.equal(upgraded.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='offline_domain_reservations'").get().name, 'offline_domain_reservations');
  assert.equal(upgraded.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='offline_domain_outbox'").get().name, 'offline_domain_outbox');
});
test('SQLite v7: cadastro offline cifrado, fila idempotente, ACK e conflito', t => {
  const store = fixture(t).open();
  const localId = `local:${randomUUID()}`;
  const record = store.saveRecord(scope, 'customer', {
    localId, remoteId: null, baseVersion: null, status: 'draft',
    payload: { name: 'Cliente local confidencial', code: 'C1', email: 'c@example.test' },
  });
  assert.equal(record.status, 'draft');
  assert.equal(store.listRecords(scope, 'customer').length, 1);
  const raw = store.db.prepare('SELECT payload_encrypted FROM offline_records WHERE local_id=?').get(localId);
  assert.equal(raw.payload_encrypted.includes(Buffer.from('Cliente local confidencial')), false);
  const operationId = randomUUID();
  const queued = store.queueRecordOperation(scope, {
    operationId, recordType: 'customer', operation: 'create', localId,
    remoteId: null, baseVersion: null,
    payload: { name: 'Cliente local confidencial', code: 'C1', email: 'c@example.test' },
  });
  assert.equal(queued.state, 'pending');
  const claimed = store.claimRecordOperations(scope)[0];
  assert.equal(claimed.operationId, operationId);
  assert.equal(claimed.payload.name, 'Cliente local confidencial');
  assert.equal(store.claimRecordOperations(scope).length, 0);
  const ack = store.acknowledgeRecordOperation(scope, operationId, claimed.leaseToken, {
    recordType: 'customer', operation: 'create', localId, id: 501, version: '2026-10-25T12:00:00.000Z',
  });
  assert.equal(ack.confirmed, true);
  const synced = store.loadRecord(scope, 'customer', localId);
  assert.equal(synced.remoteId, 501);
  assert.equal(synced.status, 'synced');
  assert.equal(synced.baseVersion, '2026-10-25T12:00:00.000Z');
  assert.equal(store.stats(scope).records.synced, 1);
  assert.equal(store.stats(scope).recordOperations.confirmed, 1);
  assert.throws(() => store.queueRecordOperation(scope, {
    operationId: randomUUID(), recordType: 'customer', operation: 'create', localId,
    remoteId: null, baseVersion: null, payload: { name: 'Duplicado' },
  }), /já foi sincronizado/);

  const updateId = randomUUID();
  store.queueRecordOperation(scope, {
    operationId: updateId, recordType: 'customer', operation: 'update', localId,
    remoteId: 501, baseVersion: synced.baseVersion,
    payload: { name: 'Cliente local editado' },
  });
  const update = store.claimRecordOperations(scope)[0];
  assert.equal(update.operation, 'update');
  store.rejectRecordOperation(scope, updateId, update.leaseToken, 'CONFLICT');
  assert.equal(store.loadRecord(scope, 'customer', localId).status, 'conflict');
  assert.throws(() => store.saveRecord(scope, 'customer', {
    localId, remoteId: 501, baseVersion: synced.baseVersion, status: 'draft', payload: { name: 'x' },
  }), /enfileirado|conflito/);
  assert.equal(store.retryRecordOperation(scope, updateId).state, 'pending');
  assert.equal(store.loadRecord(scope, 'customer', localId).status, 'queued');
  assert.throws(() => store.queueRecordOperation(scope, {
    operationId: randomUUID(), recordType: 'desconhecido', operation: 'create', localId: `local:${randomUUID()}`, payload: {},
  }), /Tipo de registro/);
});

test('SQLite v7: descartar conflito remove registro e operação bloqueada', t => {
  const store = fixture(t).open();
  const localId = `local:${randomUUID()}`, operationId = randomUUID();
  store.saveRecord(scope, 'customer', {
    localId, remoteId: null, baseVersion: null, status: 'draft', payload: { name: 'Conflito', code: 'C9' },
  });
  store.queueRecordOperation(scope, {
    operationId, recordType: 'customer', operation: 'create', localId,
    remoteId: null, baseVersion: null, payload: { name: 'Conflito', code: 'C9' },
  });
  const claimed = store.claimRecordOperations(scope)[0];
  store.rejectRecordOperation(scope, operationId, claimed.leaseToken, 'CONFLICT');
  assert.equal(store.loadRecord(scope, 'customer', localId).status, 'conflict');
  assert.equal(store.listRecordOperations(scope).length, 1);
  assert.equal(store.deleteRecord(scope, 'customer', localId).deleted, true);
  assert.equal(store.loadRecord(scope, 'customer', localId), null);
  assert.equal(store.listRecordOperations(scope).length, 0);
  assert.equal(store.stats(scope).recordOperations.blocked, 0);
});

test('SQLite v7: senha inicial de colaborador é removida após o ACK', t => {
  const store = fixture(t).open();
  const localId = `local:${randomUUID()}`;
  const operationId = randomUUID();
  const password = 'SenhaInicialMuitoSecreta#2026';
  store.saveRecord(scope, 'admin_user', {
    localId, remoteId: null, baseVersion: null, status: 'draft',
    payload: { username: 'novo.colaborador', password, roleId: 9, legalEntityIds: [20] },
  });
  store.queueRecordOperation(scope, {
    operationId, recordType: 'admin_user', operation: 'create', localId,
    remoteId: null, baseVersion: null,
    payload: { username: 'novo.colaborador', password, roleId: 9, legalEntityIds: [20] },
  });
  const claimed = store.claimRecordOperations(scope)[0];
  const ack = store.acknowledgeRecordOperation(scope, operationId, claimed.leaseToken, {
    recordType: 'admin_user', operation: 'create', localId, id: 777, version: '2026-10-25T12:00:00.000Z',
  });
  assert.equal(ack.confirmed, true);
  const synced = store.loadRecord(scope, 'admin_user', localId);
  assert.equal(synced.status, 'synced');
  assert.equal(synced.payload.password, undefined);
  const rawRecord = store.db.prepare('SELECT payload_encrypted FROM offline_records WHERE local_id=?').get(localId);
  const rawOperation = store.db.prepare('SELECT payload_encrypted FROM offline_record_outbox WHERE operation_id=?').get(operationId);
  assert.equal(Buffer.from(rawRecord.payload_encrypted).includes(Buffer.from(password)), false);
  assert.equal(Buffer.from(rawOperation.payload_encrypted).includes(Buffer.from(password)), false);
  assert.deepEqual(JSON.parse(store.decrypt('10:20:30:record-operation:' + operationId, rawOperation.payload_encrypted)), {});
  const decryptedRecord = JSON.parse(store.decrypt('10:20:30:record:admin_user:' + localId, rawRecord.payload_encrypted));
  assert.equal(decryptedRecord.password, undefined);
  assert.equal(decryptedRecord.username, 'novo.colaborador');
});

test('SQLite v4: banco de versão futura falha fechado sem alterar dados', t => {
  const f = fixture(t), store = f.open();
  store.db.exec('PRAGMA user_version=8;');
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

function domainReservation(domain = 'financial_receivable', targetId = 501, overrides = {}) {
  return {
    id: randomUUID(),
    domain,
    targetId,
    reservationToken: randomBytes(32).toString('base64url'),
    deviceId: 99,
    deviceName: 'Estação QA',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    status: 'active',
    ...overrides,
  };
}
function domainTarget(domain, targetId, overrides = {}) {
  return {
    domain,
    targetId,
    label: `Alvo ${targetId}`,
    secondary: 'Cliente QA',
    status: domain === 'accounting_period' ? 'open' : 'pending',
    amount: 123.45,
    dueDate: '2026-10-30',
    reference: `REF-${targetId}`,
    ...overrides,
  };
}
test('SQLite v4: snapshot de domínio é cifrado, isolado por escopo e validado ao ler', t => {
  const store = fixture(t).open();
  const targets = [domainTarget('financial_receivable', 501), domainTarget('financial_receivable', 502, { label: 'Alvo 502' })];
  const saved = store.saveDomainSnapshot(scope, 'financial_receivable', targets);
  assert.equal(saved.targets.length, 2);
  assert.equal(store.loadDomainSnapshot(scope, 'financial_receivable').targets[1].targetId, 502);
  const raw = store.db.prepare('SELECT payload_encrypted FROM offline_domain_snapshots WHERE domain=?').get('financial_receivable');
  assert.equal(Buffer.from(raw.payload_encrypted).includes(Buffer.from('Alvo 501')), false);
  assert.equal(store.loadDomainSnapshot({ ...scope, userId: 31 }, 'financial_receivable'), null);
  assert.throws(() => store.saveDomainSnapshot(scope, 'financial_receivable', [{ ...targets[0], domain: 'financial_payable' }]), /outro domínio/);
  assert.throws(() => store.saveDomainSnapshot(scope, 'financial_receivable', [{ ...targets[0], targetId: 0 }]), /Alvo offline inválido/);
  assert.deepEqual(store.stats(scope).domains, {
    reservations: { active: 0, queued: 0, consumed: 0, cancelled: 0, blocked: 0 },
    operations: { pending: 0, leased: 0, blocked: 0, confirmed: 0 },
  });
});
test('SQLite v4: reserva e operação de domínio cifradas, claim, ack exato e consumo', t => {
  const store = fixture(t).open();
  const domain = 'financial_receivable';
  const res = store.saveDomainReservation(scope, domain, domainReservation(domain, 501));
  assert.equal(res.status, 'active');
  assert.equal(res.reservationToken, undefined);
  const rawReservation = store.db.prepare('SELECT token_encrypted FROM offline_domain_reservations WHERE reservation_id=?').get(res.id);
  assert.equal(Buffer.from(rawReservation.token_encrypted).includes(Buffer.from('A'.repeat(20))), false);
  const operationId = randomUUID();
  const input = {
    domain,
    action: 'settle',
    targetId: 501,
    reservationId: res.id,
    operationId,
    payload: { notes: 'Baixa preparada offline', transactionId: 'TX-501' },
  };
  const queued = store.queueDomainOperation(scope, input);
  assert.equal(queued.state, 'pending');
  assert.equal(store.queueDomainOperation(scope, input).operationId, operationId);
  assert.equal(store.loadDomainReservation(scope, domain, 501).status, 'queued');
  assert.throws(() => store.queueDomainOperation(scope, { ...input, operationId: randomUUID() }), /enfileirada/);
  const rawOperation = store.db.prepare('SELECT payload_encrypted,token_encrypted FROM offline_domain_outbox WHERE operation_id=?').get(operationId);
  assert.equal(Buffer.from(rawOperation.payload_encrypted).includes(Buffer.from('Baixa preparada offline')), false);
  const claimed = store.claimDomainOperations(scope);
  assert.equal(claimed.length, 1);
  assert.equal(claimed[0].domain, domain);
  assert.equal(claimed[0].action, 'settle');
  assert.equal(claimed[0].targetId, 501);
  assert.deepEqual(claimed[0].payload, { notes: 'Baixa preparada offline', transactionId: 'TX-501' });
  assert.match(claimed[0].reservationToken, /^[A-Za-z0-9_-]{43}$/);
  assert.deepEqual(store.claimDomainOperations(scope), []);
  assert.throws(() => store.acknowledgeDomainOperation(scope, operationId, claimed[0].leaseToken, {
    domain, targetId: 999, reservationId: res.id, status: 'paid',
  }), /outro alvo/);
  const acked = store.acknowledgeDomainOperation(scope, operationId, claimed[0].leaseToken, {
    domain, targetId: 501, reservationId: res.id, status: 'paid',
  });
  assert.equal(acked.confirmed, true);
  assert.equal(acked.operation.serverStatus, 'paid');
  assert.equal(store.acknowledgeDomainOperation(scope, operationId, claimed[0].leaseToken, {
    domain, targetId: 501, reservationId: res.id, status: 'paid',
  }).confirmed, false);
  assert.equal(store.loadDomainReservation(scope, domain, 501), null);
  assert.equal(store.listDomainReservations(scope, domain)[0].status, 'consumed');
  assert.equal(store.stats(scope).domains.operations.confirmed, 1);
  assert.equal(store.stats(scope).domains.reservations.consumed, 1);
});
test('SQLite v4: conflito bloqueia sem reenvio automático; retry manual e AUTH retomam', t => {
  const store = fixture(t).open();
  const domain = 'financial_payable';
  const res = store.saveDomainReservation(scope, domain, domainReservation(domain, 701));
  const operationId = randomUUID();
  store.queueDomainOperation(scope, {
    domain, action: 'settle', targetId: 701, reservationId: res.id, operationId,
    payload: { paymentDate: '2026-10-24' },
  });
  let claimed = store.claimDomainOperations(scope)[0];
  store.rejectDomainOperation(scope, operationId, claimed.leaseToken, 'VALIDATION');
  assert.equal(store.loadDomainOperation(scope, operationId).state, 'blocked');
  assert.equal(store.loadDomainReservation(scope, domain, 701).status, 'blocked');
  assert.deepEqual(store.claimDomainOperations(scope), []);
  store.retryDomainOperation(scope, operationId);
  claimed = store.claimDomainOperations(scope)[0];
  store.rejectDomainOperation(scope, operationId, claimed.leaseToken, 'AUTH');
  assert.equal(store.loadDomainOperation(scope, operationId).state, 'blocked');
  assert.deepEqual(store.resumeDomainAuth(scope), { resumed: 1 });
  claimed = store.claimDomainOperations(scope)[0];
  const acked = store.acknowledgeDomainOperation(scope, operationId, claimed.leaseToken, {
    domain, targetId: 701, reservationId: res.id, status: 'paid',
  });
  assert.equal(acked.confirmed, true);
  assert.equal(store.loadDomainReservation(scope, domain, 701), null);
});
test('SQLite v4: payload adulterado bloqueia em vez de reenviar; liberação forçada remove journal', t => {
  const store = fixture(t).open();
  const domain = 'accounting_period';
  const res = store.saveDomainReservation(scope, domain, domainReservation(domain, 801, { status: 'active' }));
  const operationId = randomUUID();
  store.queueDomainOperation(scope, {
    domain, action: 'close', targetId: 801, reservationId: res.id, operationId,
    payload: { notes: 'Fechamento offline' },
  });
  store.db.prepare('UPDATE offline_domain_outbox SET payload_encrypted=? WHERE operation_id=?')
    .run(Buffer.from([1, 2, 3, 4]), operationId);
  assert.deepEqual(store.claimDomainOperations(scope), []);
  assert.equal(store.loadDomainOperation(scope, operationId).errorCode, 'LOCAL_CORRUPT');
  assert.equal(store.loadDomainReservation(scope, domain, 801).status, 'blocked');
  assert.throws(() => store.retryDomainOperation(scope, operationId), /corrompido/);
  const cancelled = store.markDomainReservationCancelled(scope, res.id, { force: true });
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(store.loadDomainOperation(scope, operationId), null);
  assert.deepEqual(store.claimDomainOperations(scope), []);
});
test('SQLite v4: migração de banco v2 preserva dados e cria tabelas de domínio', t => {
  const f = fixture(t), first = f.open();
  const draft = first.save(scope, 'new', payload('rascunho v2'), null);
  first.db.exec('DROP TABLE offline_domain_outbox; DROP TABLE offline_domain_reservations; DROP TABLE offline_domain_snapshots; PRAGMA user_version=2;');
  first.close();
  const upgraded = f.open();
  assert.equal(upgraded.schemaVersion(), 7);
  assert.equal(upgraded.read(scope, 'new', draft.revisionId).values.notes, 'rascunho v2');
  for (const name of ['offline_domain_snapshots', 'offline_domain_reservations', 'offline_domain_outbox']) {
    assert.equal(upgraded.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name).name, name);
  }
  assert.equal(upgraded.stats(scope).domains.operations.pending, 0);
});
test('SQLite v4: reserva de domínio de outro escopo e ação inválida são recusadas', t => {
  const store = fixture(t).open();
  const domain = 'payroll_competency';
  const res = store.saveDomainReservation(scope, domain, domainReservation(domain, 901));
  assert.equal(store.loadDomainReservation({ ...scope, legalEntityId: 21 }, domain, 901), null);
  assert.throws(() => store.queueDomainOperation(scope, {
    domain, action: 'settle', targetId: 901, reservationId: res.id, operationId: randomUUID(), payload: {},
  }), /não permitida/);
  assert.throws(() => store.queueDomainOperation(scope, {
    domain, action: 'close', targetId: 902, reservationId: res.id, operationId: randomUUID(), payload: {},
  }), /não encontrada/);
});
test('SQLite v4: migração de banco v3 preserva domínios e libera compras', t => {
  const f = fixture(t), first = f.open();
  const domain = 'financial_receivable';
  const res = first.saveDomainReservation(scope, domain, domainReservation(domain, 501));
  first.saveDomainSnapshot(scope, domain, [domainTarget(domain, 501)]);
  const operationId = randomUUID();
  first.queueDomainOperation(scope, {
    domain, action: 'settle', targetId: 501, reservationId: res.id, operationId,
    payload: { notes: 'Antes da migração' },
  });
  first.db.exec('PRAGMA user_version=3;');
  first.close();

  const upgraded = f.open();
  assert.equal(upgraded.schemaVersion(), 7);
  assert.equal(upgraded.loadDomainSnapshot(scope, domain).targets[0].targetId, 501);
  assert.equal(upgraded.loadDomainOperation(scope, operationId).state, 'pending');
  assert.equal(upgraded.loadDomainReservation(scope, domain, 501).status, 'queued');

  const purchaseDomain = 'purchase_order';
  const purchaseRes = upgraded.saveDomainReservation(
    scope,
    purchaseDomain,
    domainReservation(purchaseDomain, 1001)
  );
  const purchaseOperationId = randomUUID();
  upgraded.queueDomainOperation(scope, {
    domain: purchaseDomain,
    action: 'approve',
    targetId: 1001,
    reservationId: purchaseRes.id,
    operationId: purchaseOperationId,
    payload: { notes: 'Aprovado offline' },
  });
  const claimed = upgraded.claimDomainOperations(scope).find(item => item.domain === purchaseDomain);
  assert.equal(claimed.domain, purchaseDomain);
  assert.equal(claimed.action, 'approve');
  assert.deepEqual(claimed.payload, { notes: 'Aprovado offline' });
  const ack = upgraded.acknowledgeDomainOperation(scope, purchaseOperationId, claimed.leaseToken, {
    domain: purchaseDomain, targetId: 1001, reservationId: purchaseRes.id, status: 'approved',
  });
  assert.equal(ack.confirmed, true);
  assert.equal(upgraded.loadDomainReservation(scope, purchaseDomain, 1001), null);
});
test('SQLite v4: compra offline aceita somente aprovação de pedido pendente', t => {
  const store = fixture(t).open();
  const domain = 'purchase_order';
  const res = store.saveDomainReservation(scope, domain, domainReservation(domain, 1101));
  assert.throws(() => store.queueDomainOperation(scope, {
    domain, action: 'settle', targetId: 1101, reservationId: res.id,
    operationId: randomUUID(), payload: {},
  }), /não permitida/);
  const operationId = randomUUID();
  const queued = store.queueDomainOperation(scope, {
    domain, action: 'approve', targetId: 1101, reservationId: res.id, operationId,
    payload: { notes: 'Pedido aprovado no desktop' },
  });
  assert.equal(queued.state, 'pending');
  const claimed = store.claimDomainOperations(scope)[0];
  const ack = store.acknowledgeDomainOperation(scope, operationId, claimed.leaseToken, {
    domain, targetId: 1101, reservationId: res.id, status: 'approved',
  });
  assert.equal(ack.confirmed, true);
  assert.equal(ack.operation.serverStatus, 'approved');
});
test('SQLite v5: migração v4 preserva fila cifrada e permite CRM/treinamento', t => {
  const f = fixture(t), old = f.open();
  // Fixture v4 real: os CHECKs antigos recusam os dois novos dominios/acoes.
  // As tabelas ainda estao vazias; conservar os indices do schema anterior.
  const oldSchema = old.db.prepare(`SELECT sql FROM sqlite_master WHERE sql IS NOT NULL
    AND tbl_name IN ('offline_domain_snapshots','offline_domain_reservations','offline_domain_outbox')
    ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END`).all();
  old.db.exec('DROP TABLE offline_domain_outbox; DROP TABLE offline_domain_reservations; DROP TABLE offline_domain_snapshots;');
  for (const { sql } of oldSchema) old.db.exec(sql
    .replace(/CHECK\(domain IN \([^)]*\)\)/g, "CHECK(domain IN ('financial_receivable','financial_payable','payroll_competency','accounting_period','purchase_order'))")
    .replace(/CHECK\(action IN \([^)]*\)\)/g, "CHECK(action IN ('settle','close','reopen','lock','approve'))"));
  assert.throws(() => old.saveDomainSnapshot(scope, 'crm_activity', [domainTarget('crm_activity', 1)]), /CHECK constraint/);
  const res = old.saveDomainReservation(scope, 'purchase_order', domainReservation('purchase_order', 1201));
  const operationId = randomUUID();
  old.queueDomainOperation(scope, { domain: 'purchase_order', action: 'approve', targetId: 1201, reservationId: res.id, operationId, payload: { notes: 'preservar-v4' } });
  const encrypted = old.db.prepare('SELECT payload_encrypted FROM offline_domain_outbox WHERE operation_id=?').get(operationId).payload_encrypted;
  old.db.exec('PRAGMA user_version=4;');
  old.close();
  const upgraded = f.open();
  assert.equal(upgraded.schemaVersion(), 7);
  assert.deepEqual(upgraded.db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.deepEqual(upgraded.db.prepare('SELECT payload_encrypted FROM offline_domain_outbox WHERE operation_id=?').get(operationId).payload_encrypted, encrypted);
  assert.equal(upgraded.loadDomainOperation(scope, operationId).state, 'pending');
  let nextTargetId = 2000;
  for (const [domain, action, status, payload] of [
    ['crm_activity', 'complete', 'completed', {}],
    ['training_enrollment', 'complete', 'completed', { grade: 95, notes: 'conclusão' }],
    ['training_enrollment', 'attend', 'attended', { notes: 'presença' }],
  ]) {
    const targetId = ++nextTargetId;
    const reservation = upgraded.saveDomainReservation(scope, domain, domainReservation(domain, targetId));
    const id = randomUUID();
    upgraded.queueDomainOperation(scope, { domain, action, targetId, reservationId: reservation.id, operationId: id, payload });
    const claimed = upgraded.claimDomainOperations(scope).find(item => item.operationId === id);
    assert.deepEqual(claimed.payload, payload);
    assert.equal(upgraded.acknowledgeDomainOperation(scope, id, claimed.leaseToken, { domain, targetId, reservationId: reservation.id, status }).confirmed, true);
  }
  const reservation = upgraded.saveDomainReservation(scope, 'training_enrollment', domainReservation('training_enrollment', 1301));
  assert.throws(() => upgraded.queueDomainOperation(scope, { domain: 'training_enrollment', action: 'complete', targetId: 1301, reservationId: reservation.id, operationId: randomUUID(), payload: { grade: 101 } }), /Nota inválida/);
});
test('SQLite v6: quota cifrada persiste, restringe ação e exige status exato no ACK', t => {
  const f=fixture(t), first=f.open();
  first.db.exec('DROP TABLE offline_domain_allocations; PRAGMA user_version=5;');
  first.close();
  let store=f.open();
  assert.equal(store.schemaVersion(),7);
  const allocation={action:'transfer',quantity:3,direction:'exit',productId:90,destinationLegalEntityId:21,items:[{productId:90,quantity:3}]};
  const res=store.saveDomainReservation(scope,'stock_movement',domainReservation('stock_movement',901,{allocation}));
  const blob=store.db.prepare('SELECT payload_encrypted FROM offline_domain_allocations WHERE reservation_id=?').get(res.id).payload_encrypted;
  assert.equal(Buffer.from(blob).includes(Buffer.from('destinationLegalEntityId')),false);
  store.close();store=f.open();
  assert.deepEqual(store.loadDomainReservation(scope,'stock_movement',901).allocation,allocation);
  assert.throws(()=>store.queueDomainOperation(scope,{domain:'stock_movement',action:'entry',targetId:901,reservationId:res.id,operationId:randomUUID(),payload:{notes:'Entrada incorreta'}}),/corresponder/);
  const operationId=randomUUID();
  store.queueDomainOperation(scope,{domain:'stock_movement',action:'transfer',targetId:901,reservationId:res.id,operationId,payload:{notes:'Transferência QA'}});
  const claim=store.claimDomainOperations(scope)[0];
  const ack={domain:'stock_movement',targetId:901,reservationId:res.id,status:'approved'};
  assert.throws(()=>store.acknowledgeDomainOperation(scope,operationId,claim.leaseToken,ack),/Status final/);
  assert.equal(store.loadDomainOperation(scope,operationId).state,'leased');
  assert.equal(store.acknowledgeDomainOperation(scope,operationId,claim.leaseToken,{...ack,status:'completed'}).confirmed,true);
});
