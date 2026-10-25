const fs = require('node:fs');
const path = require('node:path');
const { randomBytes, randomUUID, createHash } = require('node:crypto');
const { OfflineStore } = require('./offlineStore');

function openProtectedStore(userData, safeStorage, installationId, platform = process.platform) {
  if (!safeStorage.isEncryptionAvailable() || (platform === 'linux' && safeStorage.getSelectedStorageBackend() === 'basic_text')) {
    throw new Error('Cofre do sistema indisponível. SQLite protegido não foi aberto; não há fallback em texto aberto.');
  }
  const directory = path.join(userData, 'offline');
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  if (process.platform !== 'win32') fs.chmodSync(directory, 0o700);
  const keyFile = path.join(directory, 'key.v1.enc'), filename = path.join(directory, 'konexus.sqlite');
  if (!fs.existsSync(keyFile)) {
    if (fs.existsSync(filename) && fs.statSync(filename).size > 0) throw new Error('Chave local ausente. Preserve o banco e restaure o backup; uma chave nova não foi criada.');
    const key = randomBytes(32);
    const temporary = `${keyFile}.${randomUUID()}.tmp`;
    try {
      const fd = fs.openSync(temporary, 'wx', 0o600);
      try { fs.writeFileSync(fd, safeStorage.encryptString(key.toString('base64'))); fs.fsyncSync(fd); }
      finally { fs.closeSync(fd); }
      try { fs.linkSync(temporary, keyFile); } catch (error) { if (error.code !== 'EEXIST') throw error; }
    } finally { key.fill(0); fs.rmSync(temporary, { force: true }); }
  }
  const key = Buffer.from(safeStorage.decryptString(fs.readFileSync(keyFile)), 'base64');
  let store;
  try { store = new OfflineStore(filename, key, installationId); } finally { key.fill(0); }
  return {
    store,
    backup() {
      const target = path.join(directory, 'backups', `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}`);
      fs.mkdirSync(target, { recursive: true, mode: 0o700 });
      const dbFile = store.backup(path.join(target, 'konexus.sqlite'));
      fs.copyFileSync(keyFile, path.join(target, 'key.v1.enc'), fs.constants.COPYFILE_EXCL);
      fs.chmodSync(path.join(target, 'key.v1.enc'), 0o600);
      const manifest = { schemaVersion: store.schemaVersion(), installationId, createdAt: new Date().toISOString(),
        sha256: createHash('sha256').update(fs.readFileSync(dbFile)).digest('hex'),
        keyProtection: 'Cofre do SO: recuperação requer o mesmo contexto de usuário/máquina ou procedimento de recuperação externo.' };
      fs.writeFileSync(path.join(target, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx', mode: 0o600 });
      return { directory: target, ...manifest };
    },
  };
}
function dispatch(store, request) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) throw new Error('Pedido local inválido.');
  const { scope, slot = 'new' } = request;
  switch (request.method) {
    case 'load': return store.load(scope, slot);
    case 'read': return store.read(scope, slot, request.revisionId);
    case 'save': return store.save(scope, slot, request.payload, request.expectedRevision);
    case 'import': return store.importLegacy(scope, slot, request.legacy, request.payload);
    case 'claim': return store.claim(scope, request.limit);
    case 'ack': return store.acknowledge(scope, request.operationId, request.leaseToken, request.ack);
    case 'reject': return store.reject(scope, request.operationId, request.leaseToken, request.code);
    case 'resume-auth': return store.resumeAuth(scope);
    case 'clear': return store.clear(scope, slot, request.expectedRevision);
    case 'stats': return store.stats(scope);
    case 'save-reservation': return store.saveReservation(scope, slot, request.reservation);
    case 'load-reservation': return store.loadReservation(scope, slot);
    case 'list-reservations': return store.listReservations(scope, request.limit);
    case 'cancel-reservation': return store.markReservationCancelled(scope, request.reservationId, { force: request.force === true });
    case 'queue-order': return store.queueOrder(scope, slot, request.payload, request.reservationId, request.operationId, request.draftRevision);
    case 'load-order': return store.loadOrder(scope, request.operationId);
    case 'list-orders': return store.listOrders(scope, request.limit);
    case 'claim-orders': return store.claimOrders(scope, request.limit);
    case 'leased-order': return store.leasedOrder(scope, request.operationId, request.leaseToken);
    case 'ack-order': return store.acknowledgeOrder(scope, request.operationId, request.leaseToken, request.ack);
    case 'reject-order': return store.rejectOrder(scope, request.operationId, request.leaseToken, request.code);
    case 'resume-order-auth': return store.resumeOrderAuth(scope);
    case 'retry-order': return store.retryOrder(scope, request.operationId);
    case 'save-domain-snapshot': return store.saveDomainSnapshot(scope, request.domain, request.targets);
    case 'load-domain-snapshot': return store.loadDomainSnapshot(scope, request.domain);
    case 'save-domain-reservation': return store.saveDomainReservation(scope, request.domain, request.reservation);
    case 'load-domain-reservation': return store.loadDomainReservation(scope, request.domain, request.targetId);
    case 'list-domain-reservations': return store.listDomainReservations(scope, request.domain, request.limit);
    case 'cancel-domain-reservation': return store.markDomainReservationCancelled(scope, request.reservationId, { force: request.force === true });
    case 'queue-domain-operation': return store.queueDomainOperation(scope, request.operation);
    case 'load-domain-operation': return store.loadDomainOperation(scope, request.operationId);
    case 'list-domain-operations': return store.listDomainOperations(scope, request.limit);
    case 'claim-domain-operations': return store.claimDomainOperations(scope, request.limit);
    case 'leased-domain-operation': return store.leasedDomainOperation(scope, request.operationId, request.leaseToken);
    case 'ack-domain-operation': return store.acknowledgeDomainOperation(scope, request.operationId, request.leaseToken, request.ack);
    case 'reject-domain-operation': return store.rejectDomainOperation(scope, request.operationId, request.leaseToken, request.code);
    case 'resume-domain-auth': return store.resumeDomainAuth(scope);
    case 'retry-domain-operation': return store.retryDomainOperation(scope, request.operationId);
    case 'save-record': return store.saveRecord(scope, request.recordType, request.record);
    case 'list-records': return store.listRecords(scope, request.recordType, request.limit);
    case 'load-record': return store.loadRecord(scope, request.recordType, request.localId);
    case 'delete-record': return store.deleteRecord(scope, request.recordType, request.localId);
    case 'queue-record-operation': return store.queueRecordOperation(scope, request.operation);
    case 'list-record-operations': return store.listRecordOperations(scope, request.limit);
    case 'claim-record-operations': return store.claimRecordOperations(scope, request.limit);
    case 'leased-record-operation': return store.leasedRecordOperation(scope, request.operationId, request.leaseToken);
    case 'ack-record-operation': return store.acknowledgeRecordOperation(scope, request.operationId, request.leaseToken, request.ack);
    case 'reject-record-operation': return store.rejectRecordOperation(scope, request.operationId, request.leaseToken, request.code);
    case 'retry-record-operation': return store.retryRecordOperation(scope, request.operationId);
    case 'resume-record-auth': return store.resumeRecordAuth(scope);
    default: throw new Error('Operação SQLite não permitida.');
  }
}
module.exports = { openProtectedStore, dispatch };
