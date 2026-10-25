import { apiClient } from '../api/client';
import { DraftScope, nativeCall, nativeStorage } from './salesDrafts';

export type RecordType =
  | 'customer' | 'supplier' | 'product'
  | 'crm_lead' | 'crm_opportunity' | 'crm_activity'
  | 'training_category' | 'training' | 'training_session' | 'training_enrollment'
  | 'admin_role' | 'admin_user';

export type RecordFieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'datetime' | 'select' | 'reference' | 'json' | 'password';
export type RecordField = {
  key: string;
  label: string;
  type: RecordFieldType;
  required: boolean;
  createOnly: boolean;
  optional: boolean;
  min: number | null;
  max: number | null;
  options: string[] | null;
  reference: string | null;
  default: unknown;
};
export type RecordDefinition = {
  type: RecordType;
  label: string;
  module: string;
  permission: string;
  editPermission: string;
  operations: Array<'create' | 'update'>;
  entity: boolean;
  subscription: boolean;
  admin: boolean;
  fields: RecordField[];
};
export type RecordOption = { id: number; label: string; secondary?: string | null; legalEntityId?: number };
export type RecordOptions = Record<string, RecordOption[]>;
export type LocalRecordStatus = 'draft' | 'queued' | 'synced' | 'conflict';
export type LocalRecord = {
  localId: string;
  recordType: RecordType;
  remoteId: number | null;
  baseVersion: string | null;
  status: LocalRecordStatus;
  payload: Record<string, any>;
  updatedAt: number;
};
export type RecordOperationState = 'pending' | 'leased' | 'blocked' | 'confirmed';
export type RecordOperation = {
  operationId: string;
  recordType: RecordType;
  operation: 'create' | 'update';
  localId: string;
  remoteId: number | null;
  baseVersion: string | null;
  state: RecordOperationState;
  attempts: number;
  errorCode: string | null;
  result: { id: number; version: string | null; replayed?: boolean } | null;
  createdAt: number;
  updatedAt: number;
};
type ClaimedRecordOperation = {
  operationId: string;
  recordType: RecordType;
  operation: 'create' | 'update';
  localId: string;
  remoteId: number | null;
  baseVersion: string | null;
  leaseToken: string;
  payload: Record<string, any>;
};

const CATALOG_KEY = 'konexus.offline.recordCatalog.v1';
const OPTIONS_KEY = (scope: DraftScope) => `konexus.offline.recordOptions.${scope.companyId}.${scope.legalEntityId}.${scope.userId}.v1`;
const changed = () => {
  window.dispatchEvent(new Event('konexus:record-offline-changed'));
};
const requireDesktop = () => {
  if (!nativeStorage()) throw new Error('Os cadastros offline exigem o aplicativo desktop com SQLite protegido.');
};
const errorMessage = (response: { error?: string | null }, fallback: string) => response.error || fallback;
const responseErrorCode = (response: { status: number; code?: string | null }) => {
  if (response.status === 401) return 'AUTH';
  if (response.status === 403) return response.code === 'DEVICE_REGISTRATION_REQUIRED' ? 'DEVICE' : 'ACCESS';
  if (response.status === 409) return 'CONFLICT';
  if (response.status === 0 || response.status === 408 || response.status === 429) return 'NETWORK';
  if (response.status >= 500) return 'SERVER';
  return 'VALIDATION';
};
const parseCache = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch { return null; }
};
const writeCache = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* cache é opcional */ }
};

export const RECORD_GROUPS: Array<{ key: string; label: string; types: RecordType[] }> = [
  { key: 'cadastros', label: 'Cadastros', types: ['customer', 'supplier', 'product'] },
  { key: 'crm', label: 'CRM', types: ['crm_lead', 'crm_opportunity', 'crm_activity'] },
  { key: 'treinamentos', label: 'Treinamentos', types: ['training_category', 'training', 'training_session', 'training_enrollment'] },
  { key: 'administracao', label: 'Administração', types: ['admin_role', 'admin_user'] },
];

export function loadCachedRecordCatalog(): RecordDefinition[] {
  return parseCache<RecordDefinition[]>(CATALOG_KEY) || [];
}
export async function fetchRecordCatalog(scope?: DraftScope): Promise<RecordDefinition[]> {
  if (!navigator.onLine) throw new Error('Conecte-se à internet para atualizar o catálogo de cadastros offline.');
  const response = await apiClient.get('offline-records/catalog', { legalEntityId: scope?.legalEntityId, reauth: false });
  const rows = response.data?.data;
  if (!response.ok || response.data?.success !== true || !Array.isArray(rows)) {
    throw new Error(errorMessage(response, 'Não foi possível carregar o catálogo de cadastros offline.'));
  }
  writeCache(CATALOG_KEY, rows);
  return rows as RecordDefinition[];
}
export function loadCachedRecordOptions(scope: DraftScope): RecordOptions {
  return parseCache<RecordOptions>(OPTIONS_KEY(scope)) || {};
}
export async function fetchRecordOptions(scope: DraftScope): Promise<RecordOptions> {
  if (!navigator.onLine) throw new Error('Conecte-se à internet para atualizar as opções de cadastros offline.');
  const response = await apiClient.get('offline-records/options', { legalEntityId: scope.legalEntityId, reauth: false });
  const data = response.data?.data;
  if (!response.ok || response.data?.success !== true || !data || typeof data !== 'object') {
    throw new Error(errorMessage(response, 'Não foi possível carregar as opções de cadastros offline.'));
  }
  writeCache(OPTIONS_KEY(scope), data);
  return data as RecordOptions;
}
export function recordFields(catalog: RecordDefinition[], type: RecordType): RecordField[] {
  return catalog.find(item => item.type === type)?.fields || [];
}
export function recordDefinition(catalog: RecordDefinition[], type: RecordType): RecordDefinition | null {
  return catalog.find(item => item.type === type) || null;
}
export function recordDisplayLabel(record: LocalRecord): string {
  const payload = record.payload || {};
  return String(payload.name || payload.title || payload.username || payload.sessionId || `#${record.remoteId || record.localId.slice(-6)}`);
}
export function recordSecondary(record: LocalRecord): string {
  const payload = record.payload || {};
  if (payload.code) return String(payload.code);
  if (payload.email) return String(payload.email);
  if (payload.cnpj) return String(payload.cnpj);
  if (record.remoteId) return `Central #${record.remoteId}`;
  return 'Criado offline';
}
export function recordReferenceType(reference: string): RecordType | null {
  const map: Record<string, RecordType> = {
    supplier: 'supplier', customer: 'customer', crm_lead: 'crm_lead', crm_opportunity: 'crm_opportunity',
    training_category: 'training_category', training: 'training', training_session: 'training_session',
    admin_role: 'admin_role', contributor: 'admin_user',
  };
  return map[reference] || null;
}

export async function listLocalRecords(scope: DraftScope, type: RecordType, limit = 200): Promise<LocalRecord[]> {
  if (!nativeStorage()) return [];
  return nativeCall<LocalRecord[]>('list-records', { scope, recordType: type, limit });
}
export async function listRecordOperations(scope: DraftScope, limit = 100): Promise<RecordOperation[]> {
  if (!nativeStorage()) return [];
  return nativeCall<RecordOperation[]>('list-record-operations', { scope, limit });
}
export async function saveRecordDraft(
  scope: DraftScope,
  type: RecordType,
  input: { localId: string; remoteId: number | null; baseVersion: string | null; payload: Record<string, any> }
): Promise<LocalRecord> {
  requireDesktop();
  const record = await nativeCall<LocalRecord>('save-record', {
    scope,
    recordType: type,
    record: { ...input, status: 'draft' },
  });
  changed();
  return record;
}
export async function enqueueRecord(
  scope: DraftScope,
  type: RecordType,
  input: {
    operation: 'create' | 'update';
    localId: string;
    remoteId: number | null;
    baseVersion: string | null;
    payload: Record<string, any>;
  }
): Promise<RecordOperation> {
  requireDesktop();
  const operation = await nativeCall<RecordOperation>('queue-record-operation', {
    scope,
    operation: { ...input, recordType: type, operationId: crypto.randomUUID() },
  });
  changed();
  return operation;
}
export async function deleteLocalRecord(scope: DraftScope, type: RecordType, localId: string): Promise<boolean> {
  requireDesktop();
  const result = await nativeCall<{ deleted: boolean }>('delete-record', { scope, recordType: type, localId });
  changed();
  return result.deleted;
}
export async function retryRecordOperation(scope: DraftScope, operationId: string): Promise<RecordOperation> {
  requireDesktop();
  const operation = await nativeCall<RecordOperation>('retry-record-operation', { scope, operationId });
  changed();
  return operation;
}
export async function resumeRecordOperations(scope: DraftScope): Promise<void> {
  if (!nativeStorage()) return;
  await nativeCall('resume-record-auth', { scope });
  changed();
}

function payloadFor(type: RecordType, row: any, fields: RecordField[]): Record<string, any> {
  const payload: Record<string, any> = {};
  for (const field of fields) {
    if (field.createOnly) continue;
    if (row[field.key] !== undefined) payload[field.key] = row[field.key];
  }
  if (type === 'customer' && row.address !== undefined) payload.address = row.address;
  return payload;
}

export async function refreshCentralRecords(
  scope: DraftScope,
  type: RecordType,
  catalog: RecordDefinition[]
): Promise<LocalRecord[]> {
  if (!navigator.onLine) throw new Error('Conecte-se à internet para atualizar a cópia central dos cadastros.');
  const response = await apiClient.get(`offline-records/${type}`, { legalEntityId: scope.legalEntityId, reauth: false });
  const rows = response.data?.data;
  if (!response.ok || response.data?.success !== true || !Array.isArray(rows)) {
    throw new Error(errorMessage(response, `Não foi possível carregar ${type} da central.`));
  }
  const fields = recordFields(catalog, type);
  const existing = await listLocalRecords(scope, type, 500);
  const current = new Map(existing.map(record => [record.localId, record]));
  const byRemote = new Map(
    existing.filter(record => record.remoteId != null).map(record => [Number(record.remoteId), record])
  );
  for (const row of rows) {
    const remoteId = Number(row.id);
    if (!Number.isSafeInteger(remoteId) || remoteId <= 0) continue;
    // Um registro criado neste computador continua com localId local mesmo
    // depois de sincronizado; não criamos uma segunda cópia central.
    const localMatch = byRemote.get(remoteId);
    const localId = localMatch?.localId || `central:${remoteId}`;
    const found = current.get(localId);
    if (found && found.status !== 'synced') continue;
    await nativeCall('save-record', {
      scope,
      recordType: type,
      record: {
        localId,
        remoteId,
        baseVersion: row.version == null ? null : String(row.version),
        status: 'synced',
        payload: payloadFor(type, row, fields),
      },
    });
  }
  changed();
  return listLocalRecords(scope, type, 500);
}

let syncingRecords = false;
export async function syncRecordOperations(scope: DraftScope): Promise<void> {
  if (syncingRecords || !navigator.onLine || !nativeStorage()) return;
  syncingRecords = true;
  try {
    for (let count = 0; count < 50; count++) {
      const operations = await nativeCall<ClaimedRecordOperation[]>('claim-record-operations', { scope, limit: 5 });
      if (!operations.length) return;
      for (const operation of operations) {
        let response;
        try {
          response = await apiClient.post(
            `offline-records/${operation.recordType}/${operation.operation}`,
            {
              clientRequestId: operation.operationId,
              localId: operation.localId,
              targetId: operation.remoteId,
              baseVersion: operation.baseVersion,
              payload: operation.payload,
            },
            { legalEntityId: scope.legalEntityId, reauth: false }
          );
        } catch (error) {
          await nativeCall('reject-record-operation', {
            scope,
            operationId: operation.operationId,
            leaseToken: operation.leaseToken,
            code: 'NETWORK',
          });
          changed();
          throw error;
        }
        const data = response.data?.data;
        const confirmed = Boolean(
          response.ok &&
          response.data?.success === true &&
          data &&
          data.type === operation.recordType &&
          Number.isSafeInteger(Number(data.id)) &&
          Number(data.id) > 0 &&
          (!data.localId || data.localId === operation.localId)
        );
        if (confirmed) {
          await nativeCall('ack-record-operation', {
            scope,
            operationId: operation.operationId,
            leaseToken: operation.leaseToken,
            ack: {
              recordType: operation.recordType,
              operation: operation.operation,
              localId: operation.localId,
              id: Number(data.id),
              version: data.version == null ? null : String(data.version),
              replayed: Boolean(data.replayed),
            },
          });
          changed();
          continue;
        }
        if (response.code === 'OFFLINE_LOCAL_REFERENCE_PENDING') {
          // A dependência ainda não foi confirmada. O próximo lote tenta
          // novamente depois do backoff e segue com operações independentes.
          await nativeCall('reject-record-operation', {
            scope,
            operationId: operation.operationId,
            leaseToken: operation.leaseToken,
            code: 'NETWORK',
          });
          changed();
          continue;
        }
        await nativeCall('reject-record-operation', {
          scope,
          operationId: operation.operationId,
          leaseToken: operation.leaseToken,
          code: response.ok ? 'INVALID_ACK' : responseErrorCode(response),
        });
        changed();
      }
    }
  } finally {
    syncingRecords = false;
  }
}

export function recordStatusLabel(status: LocalRecordStatus | RecordOperationState): string {
  return {
    draft: 'Rascunho', queued: 'Na fila', synced: 'Sincronizado', conflict: 'Conflito',
    pending: 'Pendente', leased: 'Enviando', blocked: 'Bloqueado', confirmed: 'Confirmado',
  }[status] || status;
}
export function recordStatusClass(status: LocalRecordStatus | RecordOperationState): string {
  if (status === 'synced' || status === 'confirmed') return 'bg-emerald-100 text-emerald-800';
  if (status === 'draft') return 'bg-slate-100 text-slate-700';
  if (status === 'queued' || status === 'pending' || status === 'leased') return 'bg-amber-100 text-amber-900';
  return 'bg-rose-100 text-rose-800';
}
