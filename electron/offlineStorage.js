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
      const manifest = { schemaVersion: 1, installationId, createdAt: new Date().toISOString(),
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
    default: throw new Error('Operação SQLite não permitida.');
  }
}
module.exports = { openProtectedStore, dispatch };
