const { DatabaseSync } = require('node:sqlite');
const { randomUUID, randomBytes, createCipheriv, createDecipheriv } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SCHEMA_VERSION = 2;
const ORDER_STATES = ['pending', 'leased', 'blocked', 'confirmed'];
const RESERVATION_STATES = ['active', 'queued', 'consumed', 'cancelled', 'blocked'];
const ORDER_ERRORS = ['NETWORK', 'SERVER', 'INVALID_ACK', 'AUTH', 'ACCESS', 'CONFLICT', 'VALIDATION', 'DEVICE'];

const SCHEMA_V1 = `
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
`;

const SCHEMA_V2 = `
  CREATE TABLE IF NOT EXISTS offline_stock_reservations (
    reservation_id TEXT PRIMARY KEY,
    company_id INTEGER NOT NULL,
    legal_entity_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    slot TEXT NOT NULL,
    device_id INTEGER NOT NULL,
    device_name TEXT,
    items_json TEXT NOT NULL,
    token_encrypted BLOB NOT NULL,
    expires_at TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active','queued','consumed','cancelled','blocked')),
    order_operation_id TEXT,
    error_code TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    CHECK(company_id>0 AND legal_entity_id>0 AND user_id>0 AND device_id>0)
  ) STRICT;
  CREATE INDEX IF NOT EXISTS offline_stock_reservations_slot
    ON offline_stock_reservations(company_id,legal_entity_id,user_id,slot,created_at DESC);

  CREATE TABLE IF NOT EXISTS offline_order_outbox (
    operation_id TEXT PRIMARY KEY,
    company_id INTEGER NOT NULL,
    legal_entity_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    slot TEXT NOT NULL,
    draft_revision TEXT,
    reservation_id TEXT NOT NULL REFERENCES offline_stock_reservations(reservation_id) ON DELETE RESTRICT,
    payload_encrypted BLOB NOT NULL,
    token_encrypted BLOB NOT NULL,
    state TEXT NOT NULL CHECK(state IN ('pending','leased','blocked','confirmed')),
    attempts INTEGER NOT NULL DEFAULT 0,
    next_attempt INTEGER NOT NULL DEFAULT 0,
    lease_token TEXT,
    lease_until INTEGER,
    error_code TEXT,
    server_order_id INTEGER,
    server_order_number TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    confirmed_at INTEGER,
    CHECK(company_id>0 AND legal_entity_id>0 AND user_id>0)
  ) STRICT;
  CREATE INDEX IF NOT EXISTS offline_order_outbox_pending
    ON offline_order_outbox(company_id,legal_entity_id,user_id,state,next_attempt,lease_until);
  CREATE UNIQUE INDEX IF NOT EXISTS offline_order_outbox_reservation
    ON offline_order_outbox(reservation_id);
`;

function fail(code, message) { const error = new Error(message); error.code = code; throw error; }
function validateScope(scope) {
  if (!scope || ['companyId', 'legalEntityId', 'userId'].some(key => !Number.isSafeInteger(scope[key]) || scope[key] <= 0)) {
    fail('INVALID_SCOPE', 'Organização, CNPJ e usuário locais inválidos.');
  }
  return scope;
}
function scopeKey(scope) {
  return `${scope.companyId}:${scope.legalEntityId}:${scope.userId}`;
}
function recordKey(scope, slot = 'new') {
  validateScope(scope);
  if (typeof slot !== 'string' || !/^(new|edit-[1-9]\d{0,14})$/.test(slot)) fail('INVALID_SLOT', 'Identificador local inválido.');
  return `${scopeKey(scope)}:${slot}`;
}
function positiveInteger(value, field, max = 1000000) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0 || number > max) fail('INVALID_ORDER', `${field} inválido.`);
  return number;
}
function validatePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) fail('INVALID_PAYLOAD', 'Rascunho inválido.');
  const allowed = ['values', 'products', 'selectedCustomer', 'addressConfirmed', 'orderNumber', 'editOrderId'];
  if (Object.keys(payload).some(key => !allowed.includes(key))) fail('INVALID_PAYLOAD', 'Campo de rascunho não permitido.');
  const serialized = JSON.stringify(payload);
  if (Buffer.byteLength(serialized) > 100000) fail('PAYLOAD_TOO_LARGE', 'Rascunho excede 100 KB.');
  return serialized;
}
function validateReservationItems(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 200) fail('INVALID_RESERVATION', 'Itens da reserva inválidos.');
  const seen = new Set();
  const normalized = items.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) fail('INVALID_RESERVATION', 'Item da reserva inválido.');
    const productId = positiveInteger(item.productId, 'Produto da reserva');
    const quantity = positiveInteger(item.quantity, 'Quantidade da reserva');
    if (seen.has(productId)) fail('INVALID_RESERVATION', 'Produto repetido na reserva.');
    seen.add(productId);
    return { productId, quantity };
  }).sort((a, b) => a.productId - b.productId);
  return { items: normalized, text: JSON.stringify(normalized) };
}
function validateReservation(scope, slot, reservation) {
  validateScope(scope);
  recordKey(scope, slot);
  if (!reservation || typeof reservation !== 'object') fail('INVALID_RESERVATION', 'Reserva local inválida.');
  if (!UUID.test(reservation.id || '')) fail('INVALID_RESERVATION', 'Identificador da reserva inválido.');
  if (typeof reservation.reservationToken !== 'string' || !/^[A-Za-z0-9_-]{20,256}$/.test(reservation.reservationToken)) {
    fail('INVALID_RESERVATION', 'Prova local da reserva inválida.');
  }
  if (!Number.isSafeInteger(reservation.deviceId) || reservation.deviceId <= 0) fail('INVALID_RESERVATION', 'Dispositivo da reserva inválido.');
  if (reservation.deviceName != null && (typeof reservation.deviceName !== 'string' || reservation.deviceName.length > 150)) {
    fail('INVALID_RESERVATION', 'Nome do dispositivo inválido.');
  }
  const expires = new Date(reservation.expiresAt);
  if (Number.isNaN(expires.getTime())) fail('INVALID_RESERVATION', 'Validade da reserva inválida.');
  const { items, text } = validateReservationItems(reservation.items);
  if (Buffer.byteLength(text) > 50000) fail('INVALID_RESERVATION', 'Itens da reserva excedem 50 KB.');
  return {
    id: reservation.id,
    token: reservation.reservationToken,
    deviceId: reservation.deviceId,
    deviceName: reservation.deviceName || null,
    expiresAt: expires.toISOString(),
    items,
    itemsJson: text,
  };
}
function validateOrderPayload(payload, operationId, reservationId) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) fail('INVALID_ORDER', 'Pedido offline inválido.');
  const allowed = [
    'orderDate', 'orderStatus', 'orderNumber', 'customerId', 'totalAmount', 'currency',
    'shippingAddressId', 'billingAddressId', 'salesperson', 'notes', 'carrier',
    'payment_method', 'nfe_integration_id', 'orderItems', 'clientRequestId', 'reservationId',
  ];
  if (Object.keys(payload).some(key => !allowed.includes(key))) fail('INVALID_ORDER', 'Campo de pedido offline não permitido.');
  if (payload.clientRequestId !== operationId) fail('INVALID_ORDER', 'Chave de envio não corresponde à operação local.');
  if (payload.reservationId !== reservationId) fail('INVALID_ORDER', 'Reserva do pedido não corresponde ao journal local.');
  if (typeof payload.orderDate !== 'string' || !payload.orderDate.trim()) fail('INVALID_ORDER', 'Data do pedido é obrigatória.');
  if (typeof payload.currency !== 'string' || !payload.currency.trim()) fail('INVALID_ORDER', 'Moeda do pedido é obrigatória.');
  if (typeof payload.salesperson !== 'string' || !payload.salesperson.trim()) fail('INVALID_ORDER', 'Vendedor do pedido é obrigatório.');
  if (typeof payload.carrier !== 'string' || !payload.carrier.trim()) fail('INVALID_ORDER', 'Transportadora do pedido é obrigatória.');
  if (!Number.isSafeInteger(Number(payload.customerId)) || Number(payload.customerId) <= 0) fail('INVALID_ORDER', 'Cliente do pedido inválido.');
  if (!Number.isFinite(Number(payload.totalAmount)) || Number(payload.totalAmount) < 0) fail('INVALID_ORDER', 'Valor do pedido inválido.');
  if (payload.notes != null && typeof payload.notes !== 'string') fail('INVALID_ORDER', 'Observações do pedido inválidas.');
  if (payload.orderStatus != null && typeof payload.orderStatus !== 'string') fail('INVALID_ORDER', 'Status do pedido inválido.');
  if (payload.orderNumber != null && typeof payload.orderNumber !== 'string') fail('INVALID_ORDER', 'Número do pedido inválido.');
  if (payload.payment_method != null && typeof payload.payment_method !== 'string') fail('INVALID_ORDER', 'Forma de pagamento inválida.');
  for (const field of ['shippingAddressId', 'billingAddressId']) {
    if (payload[field] != null && (!Number.isSafeInteger(Number(payload[field])) || Number(payload[field]) <= 0)) {
      fail('INVALID_ORDER', 'Endereço do pedido inválido.');
    }
  }
  if (!Array.isArray(payload.orderItems) || payload.orderItems.length < 1 || payload.orderItems.length > 200) {
    fail('INVALID_ORDER', 'Itens do pedido inválidos.');
  }
  const seen = new Set();
  const items = payload.orderItems.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) fail('INVALID_ORDER', 'Item do pedido inválido.');
    const productId = positiveInteger(item.productId, 'Produto do pedido');
    const quantity = positiveInteger(item.quantity, 'Quantidade do pedido');
    if (seen.has(productId)) fail('INVALID_ORDER', 'Produto repetido no pedido.');
    seen.add(productId);
    if (!Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) < 0) fail('INVALID_ORDER', 'Preço unitário inválido.');
    if (item.location != null && (typeof item.location !== 'string' || item.location.length > 100)) fail('INVALID_ORDER', 'Localização do item inválida.');
    return { productId, quantity, unitPrice: Number(item.unitPrice), ...(item.location ? { location: item.location } : {}) };
  });
  const serialized = JSON.stringify({ ...payload, orderItems: items });
  if (Buffer.byteLength(serialized) > 100000) fail('PAYLOAD_TOO_LARGE', 'Pedido offline excede 100 KB.');
  return serialized;
}
function validateAck(ack, reservationId) {
  if (!ack || typeof ack !== 'object') fail('INVALID_ACK', 'Confirmação do servidor inválida.');
  const orderId = Number(ack.orderId);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) fail('INVALID_ACK', 'Pedido confirmado inválido.');
  if (typeof ack.orderNumber !== 'string' || !ack.orderNumber.trim() || ack.orderNumber.length > 100) {
    fail('INVALID_ACK', 'Número do pedido confirmado inválido.');
  }
  if (ack.reservationId !== reservationId) fail('INVALID_ACK', 'Servidor confirmou outra reserva.');
  return { orderId, orderNumber: ack.orderNumber };
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
      if (version > SCHEMA_VERSION) fail('SCHEMA_NEWER', 'Banco local criado por versão mais nova. Não foi alterado.');
      if (!version) {
        this.transaction(() => {
          this.db.exec(SCHEMA_V1);
          this.db.exec(SCHEMA_V2);
          this.db.exec(`PRAGMA user_version=${SCHEMA_VERSION};`);
          this.db.prepare('INSERT INTO offline_meta(key,value) VALUES(?,?)').run('installation_id', installationId);
          this.db.prepare('INSERT INTO offline_meta(key,value) VALUES(?,?)').run('key_check', this.encrypt('key-check', installationId).toString('base64'));
        });
      } else if (version === 1) {
        // Atualiza o banco v1 existente sem tocar em rascunhos, outbox ou
        // receipts já gravados. As tabelas novas são independentes.
        this.transaction(() => {
          this.db.exec(SCHEMA_V2);
          this.db.exec(`PRAGMA user_version=${SCHEMA_VERSION};`);
        });
      }
      // A versão 2 foi usada durante o desenvolvimento antes da coluna de
      // revisão do rascunho. Garante a coluna sem exigir uma versão nova.
      const orderColumns = this.db.prepare('PRAGMA table_info(offline_order_outbox)').all();
      if (!orderColumns.some(column => column.name === 'draft_revision')) {
        this.db.exec('ALTER TABLE offline_order_outbox ADD COLUMN draft_revision TEXT');
      }
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
  schemaVersion() {
    return this.db.prepare('PRAGMA user_version').get().user_version;
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

  reservationMetadata(row) {
    if (!row) return null;
    const items = JSON.parse(row.items_json);
    const expired = row.status === 'active' && new Date(row.expires_at).getTime() <= this.now();
    return {
      id: row.reservation_id,
      reservationId: row.reservation_id,
      companyId: row.company_id,
      legalEntityId: row.legal_entity_id,
      userId: row.user_id,
      slot: row.slot,
      deviceId: row.device_id,
      deviceName: row.device_name,
      items,
      expiresAt: row.expires_at,
      status: row.status,
      effectiveStatus: expired ? 'expired' : row.status,
      expired,
      orderOperationId: row.order_operation_id,
      errorCode: row.error_code || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  saveReservation(scope, slot, reservation) {
    validateScope(scope);
    const value = validateReservation(scope, slot, reservation);
    return this.transaction(() => {
      const existing = this.db.prepare('SELECT * FROM offline_stock_reservations WHERE reservation_id=?').get(value.id);
      if (existing) {
        if (existing.company_id !== scope.companyId || existing.legal_entity_id !== scope.legalEntityId || existing.user_id !== scope.userId || existing.slot !== slot) {
          fail('CORRUPT_SCOPE', 'Reserva local pertence a outro contexto.');
        }
        if (existing.status !== 'active') fail('LOCAL_CONFLICT', 'Reserva já foi enfileirada ou encerrada.');
      }
      const current = this.db.prepare(`SELECT * FROM offline_stock_reservations
        WHERE company_id=? AND legal_entity_id=? AND user_id=? AND slot=?
        ORDER BY created_at DESC, rowid DESC LIMIT 1`)
        .get(scope.companyId, scope.legalEntityId, scope.userId, slot);
      if (current && current.reservation_id !== value.id && ['active', 'queued', 'blocked'].includes(current.status)) {
        fail('LOCAL_CONFLICT', 'Já existe uma reserva ativa para este rascunho. Cancele-a antes de criar outra.');
      }
      const encrypted = this.encrypt(`${scopeKey(scope)}:${slot}:reservation:${value.id}`, value.token);
      const timestamp = this.now();
      this.db.prepare(`INSERT INTO offline_stock_reservations
        (reservation_id,company_id,legal_entity_id,user_id,slot,device_id,device_name,items_json,token_encrypted,expires_at,status,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?, 'active',?,?)
        ON CONFLICT(reservation_id) DO UPDATE SET device_name=excluded.device_name,items_json=excluded.items_json,
          token_encrypted=excluded.token_encrypted,expires_at=excluded.expires_at,error_code=NULL,updated_at=excluded.updated_at`)
        .run(value.id, scope.companyId, scope.legalEntityId, scope.userId, slot, value.deviceId, value.deviceName,
          value.itemsJson, encrypted, value.expiresAt, timestamp, timestamp);
      return this.reservationMetadata(this.db.prepare('SELECT * FROM offline_stock_reservations WHERE reservation_id=?').get(value.id));
    });
  }
  loadReservation(scope, slot) {
    validateScope(scope);
    const row = this.db.prepare(`SELECT * FROM offline_stock_reservations
      WHERE company_id=? AND legal_entity_id=? AND user_id=? AND slot=?
        AND status IN ('active','queued','blocked')
      ORDER BY created_at DESC, rowid DESC LIMIT 1`)
      .get(scope.companyId, scope.legalEntityId, scope.userId, slot);
    return this.reservationMetadata(row);
  }
  listReservations(scope, limit = 50) {
    validateScope(scope);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) fail('INVALID_LIMIT', 'Lote inválido.');
    return this.db.prepare(`SELECT * FROM offline_stock_reservations
      WHERE company_id=? AND legal_entity_id=? AND user_id=?
      ORDER BY created_at DESC, rowid DESC LIMIT ?`)
      .all(scope.companyId, scope.legalEntityId, scope.userId, limit)
      .map(row => this.reservationMetadata(row));
  }
  markReservationCancelled(scope, reservationId, { force = false } = {}) {
    validateScope(scope);
    if (!UUID.test(reservationId || '')) fail('INVALID_RESERVATION', 'Reserva inválida.');
    return this.transaction(() => {
      const row = this.db.prepare(`SELECT * FROM offline_stock_reservations
        WHERE reservation_id=? AND company_id=? AND legal_entity_id=? AND user_id=?`)
        .get(reservationId, scope.companyId, scope.legalEntityId, scope.userId);
      if (!row) fail('NOT_FOUND', 'Reserva local não encontrada.');
      if (row.status === 'queued' && !force) fail('LOCAL_CONFLICT', 'Existe pedido enfileirado usando esta reserva. Sincronize ou resolva o pedido antes.');
      if (row.status === 'consumed') fail('LOCAL_CONFLICT', 'A reserva já foi consumida por um pedido.');
      if (row.status === 'cancelled') return this.reservationMetadata(row);
      // A central já confirmou a liberação (force=true). Qualquer journal
      // local desta reserva não pode mais ser consumido: removê-lo evita que
      // um lease em voo reenvie um pedido órfão. Um pedido confirmado teria
      // deixado a reserva como consumed e não chega aqui.
      this.db.prepare("DELETE FROM offline_order_outbox WHERE reservation_id=? AND state IN ('pending','leased','blocked')").run(reservationId);
      this.db.prepare(`UPDATE offline_stock_reservations SET status='cancelled', error_code=NULL, updated_at=? WHERE reservation_id=?`)
        .run(this.now(), reservationId);
      return this.reservationMetadata(this.db.prepare('SELECT * FROM offline_stock_reservations WHERE reservation_id=?').get(reservationId));
    });
  }

  orderMetadata(row) {
    if (!row) return null;
    return {
      operationId: row.operation_id,
      reservationId: row.reservation_id,
      companyId: row.company_id,
      legalEntityId: row.legal_entity_id,
      userId: row.user_id,
      slot: row.slot,
      state: row.state,
      attempts: row.attempts,
      errorCode: row.error_code || null,
      serverOrderId: row.server_order_id ?? null,
      serverOrderNumber: row.server_order_number || null,
      draftRevision: row.draft_revision || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      confirmedAt: row.confirmed_at ?? null,
    };
  }
  queueOrder(scope, slot, payload, reservationId, operationId = randomUUID(), draftRevision = null) {
    validateScope(scope);
    recordKey(scope, slot);
    if (!UUID.test(operationId || '')) fail('INVALID_OPERATION', 'Chave de envio local inválida.');
    if (!UUID.test(reservationId || '')) fail('INVALID_RESERVATION', 'Reserva local inválida.');
    if (draftRevision != null && !UUID.test(draftRevision)) fail('INVALID_REVISION', 'Revisão local inválida.');
    return this.transaction(() => {
      const previousOperation = this.db.prepare('SELECT * FROM offline_order_outbox WHERE operation_id=?').get(operationId);
      if (previousOperation) {
        if (previousOperation.company_id !== scope.companyId || previousOperation.legal_entity_id !== scope.legalEntityId ||
            previousOperation.user_id !== scope.userId || previousOperation.reservation_id !== reservationId) {
          fail('LOCAL_CONFLICT', 'Chave local já usada por outro pedido.');
        }
        return this.orderMetadata(previousOperation);
      }
      const reservation = this.db.prepare(`SELECT * FROM offline_stock_reservations
        WHERE reservation_id=? AND company_id=? AND legal_entity_id=? AND user_id=? AND slot=?`)
        .get(reservationId, scope.companyId, scope.legalEntityId, scope.userId, slot);
      if (!reservation) fail('NOT_FOUND', 'Reserva local não encontrada para este rascunho.');
      if (reservation.status === 'queued' && reservation.order_operation_id !== operationId) {
        fail('LOCAL_CONFLICT', 'Já existe um pedido enfileirado para esta reserva.');
      }
      if (reservation.status !== 'active') {
        fail('LOCAL_CONFLICT', 'A reserva não está ativa para enfileirar o pedido.');
      }
      const text = validateOrderPayload(payload, operationId, reservationId);
      let token;
      try {
        token = this.decrypt(`${scopeKey(scope)}:${slot}:reservation:${reservationId}`, reservation.token_encrypted);
      } catch {
        fail('CORRUPT_PAYLOAD', 'Prova local da reserva não pôde ser lida. Nenhum pedido foi enfileirado.');
      }
      const timestamp = this.now();
      const encryptedPayload = this.encrypt(`${scopeKey(scope)}:${slot}:order:${operationId}:${reservationId}`, text);
      const encryptedToken = this.encrypt(`${scopeKey(scope)}:${slot}:order-token:${operationId}:${reservationId}`, token);
      this.db.prepare(`INSERT INTO offline_order_outbox
        (operation_id,company_id,legal_entity_id,user_id,slot,draft_revision,reservation_id,payload_encrypted,token_encrypted,state,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?, 'pending',?,?)`)
        .run(operationId, scope.companyId, scope.legalEntityId, scope.userId, slot, draftRevision,
          reservationId, encryptedPayload, encryptedToken, timestamp, timestamp);
      this.db.prepare(`UPDATE offline_stock_reservations
        SET status='queued', order_operation_id=?, error_code=NULL, updated_at=? WHERE reservation_id=?`)
        .run(operationId, timestamp, reservationId);
      return this.orderMetadata(this.db.prepare('SELECT * FROM offline_order_outbox WHERE operation_id=?').get(operationId));
    });
  }
  loadOrder(scope, operationId) {
    validateScope(scope);
    if (!UUID.test(operationId || '')) fail('INVALID_OPERATION', 'Operação local inválida.');
    return this.orderMetadata(this.db.prepare(`SELECT * FROM offline_order_outbox
      WHERE operation_id=? AND company_id=? AND legal_entity_id=? AND user_id=?`)
      .get(operationId, scope.companyId, scope.legalEntityId, scope.userId));
  }
  listOrders(scope, limit = 50) {
    validateScope(scope);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) fail('INVALID_LIMIT', 'Lote inválido.');
    return this.db.prepare(`SELECT * FROM offline_order_outbox
      WHERE company_id=? AND legal_entity_id=? AND user_id=?
      ORDER BY created_at DESC, rowid DESC LIMIT ?`)
      .all(scope.companyId, scope.legalEntityId, scope.userId, limit)
      .map(row => this.orderMetadata(row));
  }
  claimOrders(scope, limit = 5) {
    validateScope(scope);
    if (!Number.isInteger(limit) || limit < 1 || limit > 20) fail('INVALID_LIMIT', 'Lote inválido.');
    return this.transaction(() => {
      const rows = this.db.prepare(`SELECT * FROM offline_order_outbox
        WHERE company_id=? AND legal_entity_id=? AND user_id=?
          AND ((state='pending' AND next_attempt<=?) OR (state='leased' AND lease_until<=?))
        ORDER BY created_at,rowid LIMIT ?`)
        .all(scope.companyId, scope.legalEntityId, scope.userId, this.now(), this.now(), limit);
      const claimed = [];
      for (const row of rows) {
        try {
          const payload = JSON.parse(this.decrypt(
            `${scopeKey(scope)}:${row.slot}:order:${row.operation_id}:${row.reservation_id}`,
            row.payload_encrypted
          ));
          const reservationToken = this.decrypt(
            `${scopeKey(scope)}:${row.slot}:order-token:${row.operation_id}:${row.reservation_id}`,
            row.token_encrypted
          );
          const leaseToken = randomUUID();
          this.db.prepare(`UPDATE offline_order_outbox
            SET state='leased', lease_token=?, lease_until=?, attempts=attempts+1, updated_at=?
            WHERE operation_id=?`)
            .run(leaseToken, this.now() + 60000, this.now(), row.operation_id);
          claimed.push({
            operationId: row.operation_id,
            reservationId: row.reservation_id,
            leaseToken,
            payload,
            reservationToken,
          });
        } catch (error) {
          if (error?.code !== 'CORRUPT_PAYLOAD') throw error;
          this.db.prepare(`UPDATE offline_order_outbox
            SET state='blocked', lease_token=NULL, lease_until=NULL, error_code='LOCAL_CORRUPT', updated_at=?
            WHERE operation_id=?`).run(this.now(), row.operation_id);
          this.db.prepare(`UPDATE offline_stock_reservations
            SET status='blocked', error_code='LOCAL_CORRUPT', updated_at=? WHERE reservation_id=?`)
            .run(this.now(), row.reservation_id);
        }
      }
      return claimed;
    });
  }
  leasedOrder(scope, operationId, leaseToken) {
    validateScope(scope);
    if (!UUID.test(operationId || '') || !UUID.test(leaseToken || '')) fail('INVALID_OPERATION', 'Operação local inválida.');
    return this.db.prepare(`SELECT * FROM offline_order_outbox
      WHERE operation_id=? AND state='leased' AND lease_token=?
        AND company_id=? AND legal_entity_id=? AND user_id=?`)
      .get(operationId, leaseToken, scope.companyId, scope.legalEntityId, scope.userId);
  }
  acknowledgeOrder(scope, operationId, leaseToken, ack) {
    return this.transaction(() => {
      const row = this.leasedOrder(scope, operationId, leaseToken);
      if (!row) return { confirmed: false };
      const confirmed = validateAck(ack, row.reservation_id);
      const timestamp = this.now();
      this.db.prepare(`UPDATE offline_order_outbox
        SET state='confirmed', server_order_id=?, server_order_number=?, confirmed_at=?, updated_at=?,
            lease_token=NULL, lease_until=NULL, error_code=NULL
        WHERE operation_id=?`)
        .run(confirmed.orderId, confirmed.orderNumber, timestamp, timestamp, operationId);
      this.db.prepare(`UPDATE offline_stock_reservations
        SET status='consumed', error_code=NULL, updated_at=? WHERE reservation_id=?`)
        .run(timestamp, row.reservation_id);
      // O pedido confirmado substitui o rascunho local somente se a revisao
      // enfileirada ainda for a atual. Uma edicao posterior e preservada.
      if (row.draft_revision) {
        this.db.prepare('DELETE FROM offline_documents WHERE key=? AND revision_id=?')
          .run(recordKey(scope, row.slot), row.draft_revision);
      }
      return {
        confirmed: true,
        operation: this.orderMetadata(this.db.prepare('SELECT * FROM offline_order_outbox WHERE operation_id=?').get(operationId)),
      };
    });
  }
  rejectOrder(scope, operationId, leaseToken, code) {
    if (!ORDER_ERRORS.includes(code)) fail('INVALID_ERROR', 'Categoria de erro inválida.');
    return this.transaction(() => {
      const row = this.leasedOrder(scope, operationId, leaseToken);
      if (!row) return { retained: false };
      const blocked = ['AUTH', 'ACCESS', 'CONFLICT', 'VALIDATION', 'INVALID_ACK', 'DEVICE'].includes(code);
      const state = blocked ? 'blocked' : 'pending';
      const timestamp = this.now();
      this.db.prepare(`UPDATE offline_order_outbox
        SET state=?, next_attempt=?, lease_token=NULL, lease_until=NULL, error_code=?, updated_at=?
        WHERE operation_id=?`)
        .run(state, timestamp + Math.min(60000, 1000 * 2 ** Math.min(row.attempts - 1, 6)), code, timestamp, operationId);
      if (blocked) {
        this.db.prepare(`UPDATE offline_stock_reservations
          SET status='blocked', error_code=?, updated_at=?
          WHERE reservation_id=? AND status<>'consumed'`)
          .run(code, timestamp, row.reservation_id);
      }
      return { retained: true };
    });
  }
  resumeOrderAuth(scope) {
    validateScope(scope);
    return this.transaction(() => {
      const rows = this.db.prepare(`SELECT operation_id,reservation_id FROM offline_order_outbox
        WHERE company_id=? AND legal_entity_id=? AND user_id=?
          AND state='blocked' AND error_code IN ('AUTH','ACCESS','DEVICE')`)
        .all(scope.companyId, scope.legalEntityId, scope.userId);
      for (const row of rows) {
        this.db.prepare(`UPDATE offline_order_outbox SET state='pending', next_attempt=0, updated_at=?
          WHERE operation_id=?`).run(this.now(), row.operation_id);
        this.db.prepare(`UPDATE offline_stock_reservations SET status='queued', error_code=NULL, updated_at=?
          WHERE reservation_id=? AND status='blocked'`).run(this.now(), row.reservation_id);
      }
      return { resumed: rows.length };
    });
  }
  retryOrder(scope, operationId) {
    validateScope(scope);
    if (!UUID.test(operationId || '')) fail('INVALID_OPERATION', 'Operação local inválida.');
    return this.transaction(() => {
      const row = this.db.prepare(`SELECT * FROM offline_order_outbox
        WHERE operation_id=? AND company_id=? AND legal_entity_id=? AND user_id=?`)
        .get(operationId, scope.companyId, scope.legalEntityId, scope.userId);
      if (!row) fail('NOT_FOUND', 'Pedido local não encontrado.');
      if (row.state !== 'blocked') return this.orderMetadata(row);
      if (row.error_code === 'LOCAL_CORRUPT') {
        fail('LOCAL_CONFLICT', 'O conteúdo local está corrompido e não pode ser reenviado. Preserve o backup para recuperação.');
      }
      // Reenvio manual e idempotente: o servidor devolve o mesmo pedido se a
      // operação já tiver sido aplicada, resolvendo respostas perdidas.
      this.db.prepare(`UPDATE offline_order_outbox SET state='pending', next_attempt=0, error_code=NULL, updated_at=?
        WHERE operation_id=?`).run(this.now(), operationId);
      this.db.prepare(`UPDATE offline_stock_reservations SET status='queued', error_code=NULL, updated_at=?
        WHERE reservation_id=? AND status='blocked'`).run(this.now(), row.reservation_id);
      return this.orderMetadata(this.db.prepare('SELECT * FROM offline_order_outbox WHERE operation_id=?').get(operationId));
    });
  }
  stats(scope) {
    validateScope(scope);
    const counts = this.db.prepare(`SELECT o.state,count(*) AS count FROM offline_outbox o JOIN offline_documents d ON d.key=o.document_key
      WHERE d.company_id=? AND d.legal_entity_id=? AND d.user_id=? GROUP BY o.state`).all(scope.companyId, scope.legalEntityId, scope.userId);
    const orderCounts = this.db.prepare(`SELECT state,count(*) AS count FROM offline_order_outbox
      WHERE company_id=? AND legal_entity_id=? AND user_id=? GROUP BY state`)
      .all(scope.companyId, scope.legalEntityId, scope.userId);
    const reservationCounts = this.db.prepare(`SELECT status,count(*) AS count FROM offline_stock_reservations
      WHERE company_id=? AND legal_entity_id=? AND user_id=? GROUP BY status`)
      .all(scope.companyId, scope.legalEntityId, scope.userId);
    const orders = Object.fromEntries(ORDER_STATES.map(state => [state, 0]));
    for (const row of orderCounts) orders[row.state] = row.count;
    const reservations = Object.fromEntries(RESERVATION_STATES.map(state => [state, 0]));
    for (const row of reservationCounts) reservations[row.status] = row.count;
    return {
      engine: 'sqlite',
      schemaVersion: this.schemaVersion(),
      pending: 0, leased: 0, blocked: 0,
      ...Object.fromEntries(counts.map(row => [row.state, row.count])),
      orders,
      reservations,
    };
  }
  backup(destination) {
    if (!path.isAbsolute(destination) || fs.existsSync(destination)) throw new Error('Destino de backup inválido.');
    this.db.prepare('VACUUM INTO ?').run(destination);
    fs.chmodSync(destination, 0o600);
    return destination;
  }
  close() { this.db.close(); this.key.fill(0); }
}
module.exports = { OfflineStore, recordKey, validateScope, SCHEMA_VERSION };
