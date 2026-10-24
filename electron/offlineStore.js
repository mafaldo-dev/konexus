const { DatabaseSync } = require('node:sqlite');
const { randomUUID, randomBytes, createCipheriv, createDecipheriv } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function fail(code, message) { const error = new Error(message); error.code = code; throw error; }
function validateScope(scope) {
  if (!scope || ['companyId', 'legalEntityId', 'userId'].some(key => !Number.isSafeInteger(scope[key]) || scope[key] <= 0)) {
    fail('INVALID_SCOPE', 'Organização, CNPJ e usuário locais inválidos.');
  }
  return scope;
}
function recordKey(scope, slot = 'new') {
  validateScope(scope);
  if (typeof slot !== 'string' || !/^(new|edit-[1-9]\d{0,14})$/.test(slot)) fail('INVALID_SLOT', 'Identificador local inválido.');
  return `${scope.companyId}:${scope.legalEntityId}:${scope.userId}:${slot}`;
}
function validatePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) fail('INVALID_PAYLOAD', 'Rascunho inválido.');
  const allowed = ['values', 'products', 'selectedCustomer', 'addressConfirmed', 'orderNumber', 'editOrderId'];
  if (Object.keys(payload).some(key => !allowed.includes(key))) fail('INVALID_PAYLOAD', 'Campo de rascunho não permitido.');
  const serialized = JSON.stringify(payload);
  if (Buffer.byteLength(serialized) > 100000) fail('PAYLOAD_TOO_LARGE', 'Rascunho excede 100 KB.');
  return serialized;
}

/** SQLite real no processo principal. Nenhum método recebe SQL ou caminho do renderer. */
class OfflineStore {
  constructor(filename, encryptionKey, installationId, { now = Date.now } = {}) {
    if (!Buffer.isBuffer(encryptionKey) || encryptionKey.length !== 32 || !UUID.test(installationId)) throw new Error('Chave ou instalação inválida.');
    this.key = Buffer.from(encryptionKey);
    this.installationId = installationId;
    this.now = now;
    this.filename = filename;
    this.db = new DatabaseSync(filename, { enableForeignKeyConstraints: true, enableDoubleQuotedStringLiterals: false });
    try {
      this.db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000; PRAGMA trusted_schema=OFF; PRAGMA secure_delete=ON;');
      const version = this.db.prepare('PRAGMA user_version').get().user_version;
      if (version > 1) fail('SCHEMA_NEWER', 'Banco local criado por versão mais nova. Não foi alterado.');
      if (!version) this.transaction(() => {
        this.db.exec(`
          CREATE TABLE offline_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
          CREATE TABLE offline_documents (
            key TEXT PRIMARY KEY, company_id INTEGER NOT NULL, legal_entity_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL, slot TEXT NOT NULL, draft_id TEXT NOT NULL,
            revision_id TEXT NOT NULL, updated_at TEXT NOT NULL, encrypted BLOB NOT NULL,
            synced_revision TEXT, error_code TEXT,
            CHECK(company_id>0 AND legal_entity_id>0 AND user_id>0)
          ) STRICT;
          CREATE TABLE offline_outbox (
            operation_id TEXT PRIMARY KEY, document_key TEXT NOT NULL REFERENCES offline_documents(key) ON DELETE CASCADE,
            draft_id TEXT NOT NULL, encrypted BLOB NOT NULL,
            state TEXT NOT NULL CHECK(state IN ('pending','leased','blocked')),
            attempts INTEGER NOT NULL DEFAULT 0, next_attempt INTEGER NOT NULL DEFAULT 0,
            lease_token TEXT, lease_until INTEGER, error_code TEXT, created_at INTEGER NOT NULL
          ) STRICT;
          CREATE INDEX offline_outbox_pending ON offline_outbox(state,next_attempt,lease_until);
          CREATE INDEX offline_documents_owner ON offline_documents(company_id,legal_entity_id,user_id);
          CREATE TABLE offline_legacy_imports (key TEXT PRIMARY KEY, revision_id TEXT NOT NULL, imported_at INTEGER NOT NULL) STRICT;
          CREATE TABLE offline_receipts (operation_id TEXT PRIMARY KEY, document_key TEXT NOT NULL, draft_id TEXT NOT NULL, confirmed_at INTEGER NOT NULL) STRICT;
          PRAGMA user_version=1;
        `);
        this.db.prepare('INSERT INTO offline_meta(key,value) VALUES(?,?)').run('installation_id', installationId);
        this.db.prepare('INSERT INTO offline_meta(key,value) VALUES(?,?)').run('key_check', this.encrypt('key-check', installationId).toString('base64'));
      });
      const stored = this.db.prepare('SELECT value FROM offline_meta WHERE key=?').get('installation_id');
      if (stored?.value !== installationId) fail('INSTALLATION_MISMATCH', 'Banco local pertence a outra instalação. Use o procedimento de recuperação.');
      const check = this.db.prepare('SELECT value FROM offline_meta WHERE key=?').get('key_check');
      if (this.decrypt('key-check', Buffer.from(check.value, 'base64')) !== installationId) fail('KEY_MISMATCH', 'Chave do banco local inválida.');
      if (this.db.prepare('PRAGMA quick_check').get().quick_check !== 'ok') fail('CORRUPT_DATABASE', 'Verificação de integridade local falhou. Preserve o banco para recuperação.');
      if (filename !== ':memory:') fs.chmodSync(filename, 0o600);
    } catch (error) { this.db.close(); this.key.fill(0); throw error; }
  }
  transaction(work) {
    this.db.exec('BEGIN IMMEDIATE');
    try { const result = work(); this.db.exec('COMMIT'); return result; }
    catch (error) {
      try { this.db.exec('ROLLBACK'); }
      catch (rollbackError) {
        // SQLITE_FULL pode provocar rollback automático; preservar o erro original.
        if (!/no transaction is active/i.test(rollbackError.message || '')) error.rollbackError = rollbackError.message;
      }
      throw error;
    }
  }
  encrypt(aad, text) {
    const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', this.key, iv);
    cipher.setAAD(Buffer.from(aad));
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return Buffer.concat([Buffer.from([1]), iv, cipher.getAuthTag(), encrypted]);
  }
  decrypt(aad, bytes) {
    const data = Buffer.from(bytes);
    if (data.length < 29 || data[0] !== 1) fail('CORRUPT_PAYLOAD', 'Formato de dado local inválido.');
    try {
      const decipher = createDecipheriv('aes-256-gcm', this.key, data.subarray(1, 13));
      decipher.setAAD(Buffer.from(aad)); decipher.setAuthTag(data.subarray(13, 29));
      return Buffer.concat([decipher.update(data.subarray(29)), decipher.final()]).toString('utf8');
    } catch { fail('CORRUPT_PAYLOAD', 'Dado local adulterado ou chave incorreta. Nenhum envio foi realizado.'); }
  }
  metadata(row) {
    if (!row) return null;
    return { storage: 'sqlite', key: row.key, companyId: row.company_id, legalEntityId: row.legal_entity_id,
      userId: row.user_id, draftId: row.draft_id, revisionId: row.revision_id, updatedAt: row.updated_at,
      synced: row.synced_revision === row.revision_id, error: row.error_code ? `Sincronização pendente (${row.error_code})` : undefined };
  }
  load(scope, slot) {
    const row = this.db.prepare('SELECT * FROM offline_documents WHERE key=?').get(recordKey(scope, slot));
    if (row && (row.company_id !== scope.companyId || row.legal_entity_id !== scope.legalEntityId || row.user_id !== scope.userId)) fail('CORRUPT_SCOPE', 'Metadados locais inconsistentes.');
    return this.metadata(row);
  }
  read(scope, slot, revisionId) {
    const key = recordKey(scope, slot), row = this.db.prepare('SELECT * FROM offline_documents WHERE key=?').get(key);
    if (!row || row.revision_id !== revisionId) fail('LOCAL_CONFLICT', 'Rascunho mudou. Recarregue antes de continuar.');
    this.load(scope, slot);
    return JSON.parse(this.decrypt(`${key}:${revisionId}:${row.draft_id}`, row.encrypted));
  }
  write(scope, slot, payload, previous, ids = {}) {
    const key = recordKey(scope, slot), text = validatePayload(payload);
    const draftId = ids.draftId || previous?.draft_id || randomUUID(), revisionId = ids.revisionId || randomUUID();
    const encrypted = this.encrypt(`${key}:${revisionId}:${draftId}`, text), updatedAt = new Date(this.now()).toISOString();
    this.db.prepare(`INSERT INTO offline_documents(key,company_id,legal_entity_id,user_id,slot,draft_id,revision_id,updated_at,encrypted,synced_revision)
      VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET draft_id=excluded.draft_id,revision_id=excluded.revision_id,updated_at=excluded.updated_at,encrypted=excluded.encrypted,error_code=NULL,synced_revision=excluded.synced_revision`)
      .run(key, scope.companyId, scope.legalEntityId, scope.userId, slot || 'new', draftId, revisionId, updatedAt, encrypted, ids.synced ? revisionId : previous?.synced_revision || null);
    // Coalesce edições de rascunho ainda não enviadas, preservando operações em trânsito.
    this.db.prepare("DELETE FROM offline_outbox WHERE document_key=? AND state<>'leased'").run(key);
    if (!ids.synced) this.db.prepare(`INSERT INTO offline_outbox(operation_id,document_key,draft_id,encrypted,state,created_at) VALUES(?,?,?,?,'pending',?)`)
      .run(revisionId, key, draftId, encrypted, this.now());
    return this.load(scope, slot);
  }
  save(scope, slot, payload, expectedRevision) {
    const key = recordKey(scope, slot);
    if (expectedRevision !== null && !UUID.test(expectedRevision || '')) fail('INVALID_REVISION', 'Revisão local inválida.');
    return this.transaction(() => {
      const previous = this.db.prepare('SELECT * FROM offline_documents WHERE key=?').get(key);
      if ((previous?.revision_id || null) !== expectedRevision) fail('LOCAL_CONFLICT', 'Rascunho alterado em outra janela. Recarregue para não sobrescrever os dados.');
      return this.write(scope, slot, payload, previous);
    });
  }
  importLegacy(scope, slot, legacy, payload) {
    const key = recordKey(scope, slot);
    if (legacy?.key !== key || !UUID.test(legacy.draftId || '') || !UUID.test(legacy.revisionId || '')) fail('INVALID_LEGACY', 'Rascunho antigo inválido.');
    return this.transaction(() => {
      const marker = this.db.prepare('SELECT * FROM offline_legacy_imports WHERE key=?').get(key);
      if (marker) {
        if (marker.revision_id !== legacy.revisionId) fail('LEGACY_CONFLICT', 'Uma versão antiga alterou o rascunho após a migração. Preserve as duas cópias.');
        return { imported: false, row: this.load(scope, slot) };
      }
      const existing = this.db.prepare('SELECT * FROM offline_documents WHERE key=?').get(key);
      if (existing) fail('LEGACY_CONFLICT', 'Já existe rascunho SQLite neste contexto. O original foi preservado.');
      const row = this.write(scope, slot, payload, null, { draftId: legacy.draftId, revisionId: legacy.revisionId, synced: legacy.synced === true });
      // Confere a leitura antes de confirmar a migração. O IndexedDB não é apagado.
      if (JSON.stringify(this.read(scope, slot, row.revisionId)) !== JSON.stringify(payload)) throw new Error('Falha na conferência da migração.');
      this.db.prepare('INSERT INTO offline_legacy_imports VALUES(?,?,?)').run(key, legacy.revisionId, this.now());
      return { imported: true, row };
    });
  }
  claim(scope, limit = 10) {
    validateScope(scope);
    if (!Number.isInteger(limit) || limit < 1 || limit > 20) fail('INVALID_LIMIT', 'Lote inválido.');
    return this.transaction(() => {
      const rows = this.db.prepare(`SELECT o.*, d.company_id,d.legal_entity_id,d.user_id,d.slot FROM offline_outbox o
        JOIN offline_documents d ON d.key=o.document_key WHERE d.company_id=? AND d.legal_entity_id=? AND d.user_id=?
        AND ((o.state='pending' AND o.next_attempt<=?) OR (o.state='leased' AND o.lease_until<=?)) ORDER BY o.created_at,o.rowid LIMIT ?`)
        .all(scope.companyId, scope.legalEntityId, scope.userId, this.now(), this.now(), limit);
      return rows.map(row => {
        if (row.document_key !== recordKey(scope, row.slot)) fail('CORRUPT_SCOPE', 'Metadados locais inconsistentes.');
        const payload = JSON.parse(this.decrypt(`${row.document_key}:${row.operation_id}:${row.draft_id}`, row.encrypted));
        const leaseToken = randomUUID();
        this.db.prepare("UPDATE offline_outbox SET state='leased',lease_token=?,lease_until=?,attempts=attempts+1 WHERE operation_id=?")
          .run(leaseToken, this.now() + 60000, row.operation_id);
        return { operationId: row.operation_id, revisionId: row.operation_id, draftId: row.draft_id, leaseToken, payload };
      });
    });
  }
  leased(scope, operationId, leaseToken) {
    validateScope(scope);
    if (!UUID.test(operationId || '') || !UUID.test(leaseToken || '')) fail('INVALID_OPERATION', 'Operação local inválida.');
    return this.db.prepare(`SELECT o.* FROM offline_outbox o JOIN offline_documents d ON d.key=o.document_key
      WHERE o.operation_id=? AND o.state='leased' AND o.lease_token=? AND d.company_id=? AND d.legal_entity_id=? AND d.user_id=?`)
      .get(operationId, leaseToken, scope.companyId, scope.legalEntityId, scope.userId);
  }
  acknowledge(scope, operationId, leaseToken, ack) {
    return this.transaction(() => {
      const row = this.leased(scope, operationId, leaseToken);
      if (!row) return { confirmed: false };
      if (ack?.draftId !== row.draft_id || ack?.revisionId !== operationId) fail('INVALID_ACK', 'Servidor não confirmou esta revisão.');
      this.db.prepare('INSERT OR IGNORE INTO offline_receipts VALUES(?,?,?,?)').run(operationId, row.document_key, row.draft_id, this.now());
      this.db.prepare('UPDATE offline_documents SET synced_revision=?,error_code=NULL WHERE key=? AND revision_id=?').run(operationId, row.document_key, operationId);
      this.db.prepare('DELETE FROM offline_outbox WHERE operation_id=?').run(operationId);
      return { confirmed: true };
    });
  }
  reject(scope, operationId, leaseToken, code) {
    if (!['NETWORK','SERVER','INVALID_ACK','AUTH','ACCESS','CONFLICT','VALIDATION'].includes(code)) fail('INVALID_ERROR', 'Categoria de erro inválida.');
    return this.transaction(() => {
      const row = this.leased(scope, operationId, leaseToken);
      if (!row) return { retained: false };
      const state = ['AUTH','ACCESS','CONFLICT','VALIDATION'].includes(code) ? 'blocked' : 'pending';
      this.db.prepare('UPDATE offline_outbox SET state=?,next_attempt=?,lease_token=NULL,lease_until=NULL,error_code=? WHERE operation_id=?')
        .run(state, this.now() + Math.min(60000, 1000 * 2 ** Math.min(row.attempts - 1, 6)), code, operationId);
      this.db.prepare('UPDATE offline_documents SET error_code=? WHERE key=? AND revision_id=?').run(code, row.document_key, operationId);
      return { retained: true };
    });
  }
  resumeAuth(scope) {
    validateScope(scope);
    this.db.prepare(`UPDATE offline_outbox SET state='pending',next_attempt=0 WHERE state='blocked' AND error_code IN ('AUTH','ACCESS') AND document_key IN
      (SELECT key FROM offline_documents WHERE company_id=? AND legal_entity_id=? AND user_id=?)`).run(scope.companyId, scope.legalEntityId, scope.userId);
  }
  clear(scope, slot, expectedRevision) {
    const key = recordKey(scope, slot);
    if (!UUID.test(expectedRevision || '')) fail('INVALID_REVISION', 'Revisão local inválida.');
    return this.transaction(() => ({ deleted: this.db.prepare('DELETE FROM offline_documents WHERE key=? AND revision_id=?').run(key, expectedRevision).changes === 1 }));
  }
  stats(scope) {
    validateScope(scope);
    const counts = this.db.prepare(`SELECT o.state,count(*) AS count FROM offline_outbox o JOIN offline_documents d ON d.key=o.document_key
      WHERE d.company_id=? AND d.legal_entity_id=? AND d.user_id=? GROUP BY o.state`).all(scope.companyId, scope.legalEntityId, scope.userId);
    return { engine: 'sqlite', schemaVersion: this.db.prepare('PRAGMA user_version').get().user_version, pending: 0, leased: 0, blocked: 0, ...Object.fromEntries(counts.map(row => [row.state, row.count])) };
  }
  backup(destination) {
    if (!path.isAbsolute(destination) || fs.existsSync(destination)) throw new Error('Destino de backup inválido.');
    this.db.prepare('VACUUM INTO ?').run(destination);
    fs.chmodSync(destination, 0o600);
    return destination;
  }
  close() { this.db.close(); this.key.fill(0); }
}
module.exports = { OfflineStore, recordKey, validateScope };
