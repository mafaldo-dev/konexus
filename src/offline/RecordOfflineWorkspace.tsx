import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, CheckCircle2, CloudOff, Database, RefreshCw, Save, ShieldCheck, Trash2, X,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { DraftScope, nativeStorage } from './salesDrafts';
import {
  deleteLocalRecord, enqueueRecord, fetchRecordCatalog, fetchRecordOptions, listLocalRecords,
  listRecordOperations, loadCachedRecordCatalog, loadCachedRecordOptions, LocalRecord, RecordDefinition,
  RecordField, RecordOperation, RecordOptions, RecordType, RECORD_GROUPS, recordDefinition,
  recordDisplayLabel, recordFields, recordReferenceType, recordSecondary, recordStatusClass,
  recordStatusLabel, refreshCentralRecords, resumeRecordOperations, retryRecordOperation,
  saveRecordDraft, syncRecordOperations,
} from './recordOffline';

type FormState = {
  record: LocalRecord | null;
  localId: string;
  remoteId: number | null;
  baseVersion: string | null;
  payload: Record<string, any>;
  isNew: boolean;
};

const statusOrder = (record: LocalRecord) => {
  if (record.status === 'conflict') return 0;
  if (record.status === 'draft') return 1;
  if (record.status === 'queued') return 2;
  return 3;
};
const blankAddress = () => ({ street: '', city: '', zip: '', number: '', state: '', city_code: '', neighborhood: '' });
const isoToInput = (value: unknown) => {
  if (!value) return '';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const inputToIso = (value: string) => value ? new Date(value).toISOString() : '';

export default function RecordOfflineWorkspace() {
  const { hasPermission, hasModule, isCompanyAdmin } = useAuth();
  const [scope] = useState<DraftScope | null>(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || 'null');
      const company = JSON.parse(localStorage.getItem('companyData') || 'null');
      const entity = JSON.parse(localStorage.getItem('activeLegalEntity') || 'null');
      return userData?.id && company?.id && entity?.id && localStorage.getItem('token')
        ? { companyId: Number(company.id), legalEntityId: Number(entity.id), userId: Number(userData.id) }
        : null;
    } catch { return null; }
  });
  const [catalog, setCatalog] = useState<RecordDefinition[]>(loadCachedRecordCatalog);
  const [options, setOptions] = useState<RecordOptions>(() => scope ? loadCachedRecordOptions(scope) : {});
  const [activeType, setActiveType] = useState<RecordType>('customer');
  const [records, setRecords] = useState<LocalRecord[]>([]);
  const [operations, setOperations] = useState<RecordOperation[]>([]);
  const [refRecords, setRefRecords] = useState<Partial<Record<RecordType, LocalRecord[]>>>({});
  const [form, setForm] = useState<FormState | null>(null);
  const [jsonDrafts, setJsonDrafts] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const alive = useRef(true);

  const definition = useMemo(() => recordDefinition(catalog, activeType), [catalog, activeType]);
  const availableGroups = useMemo(() => RECORD_GROUPS.map(group => ({
    ...group,
    types: group.types.filter(type => {
      const item = recordDefinition(catalog, type);
      if (!item) return false;
      if (item.admin) return isCompanyAdmin;
      return hasModule(item.module) && (isCompanyAdmin || hasPermission(item.module, 'view'));
    }),
  })).filter(group => group.types.length), [catalog, hasModule, hasPermission, isCompanyAdmin]);

  const canWrite = useCallback((item: RecordDefinition | null, operation: 'create' | 'update' = 'create') => {
    if (!item) return false;
    if (item.admin) return isCompanyAdmin;
    return isCompanyAdmin || hasPermission(item.module, operation === 'create' ? item.permission : item.editPermission);
  }, [hasPermission, isCompanyAdmin]);

  const loadLocal = useCallback(async () => {
    if (!scope) return;
    const [nextRecords, nextOperations] = await Promise.all([
      listLocalRecords(scope, activeType, 300),
      listRecordOperations(scope, 100),
    ]);
    if (!alive.current) return;
    setRecords(nextRecords);
    setOperations(nextOperations.filter(operation => operation.recordType === activeType));
  }, [scope, activeType]);

  useEffect(() => {
    alive.current = true;
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      alive.current = false;
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => {
    if (!scope) return;
    loadLocal().catch(nextError => setError(nextError instanceof Error ? nextError.message : String(nextError)));
  }, [scope, loadLocal]);

  useEffect(() => {
    if (!availableGroups.length) return;
    if (!availableGroups.some(group => group.types.includes(activeType))) {
      setActiveType(availableGroups[0].types[0]);
    }
  }, [availableGroups, activeType]);

  const loadOnlineData = useCallback(async (central: boolean) => {
    if (!scope || !navigator.onLine) return;
    setLoading(true);
    setError('');
    try {
      const nextCatalog = await fetchRecordCatalog(scope);
      const nextOptions = await fetchRecordOptions(scope);
      if (!alive.current) return;
      setCatalog(nextCatalog);
      setOptions(nextOptions);
      if (central) {
        await refreshCentralRecords(scope, activeType, nextCatalog);
        setMessage('Cópia central dos cadastros atualizada no cofre local.');
      } else {
        setMessage('Catálogo e opções atualizados.');
      }
      await loadLocal();
    } catch (nextError) {
      if (alive.current) setError(nextError instanceof Error ? nextError.message : String(nextError));
      await loadLocal().catch(() => undefined);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [scope, activeType, loadLocal]);

  useEffect(() => {
    if (!scope || !navigator.onLine) return;
    loadOnlineData(false);
    // Primeira carga online apenas do catálogo; a cópia central é explícita.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope?.companyId, scope?.legalEntityId, scope?.userId]);

  const sync = useCallback(async () => {
    if (!scope || !online) {
      setError('Conecte-se à internet para sincronizar a fila de cadastros.');
      return;
    }
    setSyncing(true);
    setError('');
    try {
      await syncRecordOperations(scope);
      await loadLocal();
      if (alive.current) setMessage('Fila de cadastros sincronizada com a central.');
    } catch (nextError) {
      if (alive.current) setError(nextError instanceof Error ? nextError.message : String(nextError));
      await loadLocal().catch(() => undefined);
    } finally {
      if (alive.current) setSyncing(false);
    }
  }, [scope, loadLocal, online]);

  const openNew = useCallback(() => {
    if (!definition) return;
    const payload: Record<string, any> = {};
    for (const field of definition.fields) {
      if (field.createOnly && field.key === 'password') continue;
      if (field.default !== null && field.default !== undefined) payload[field.key] = field.default;
      if (field.key === 'address') payload.address = blankAddress();
    }
    if (activeType === 'admin_user') {
      payload.legalEntityIds = scope ? [scope.legalEntityId] : [];
      // Em branco usa as permissões do cargo escolhido. Só enviamos uma
      // lista explícita quando o administrador editar o campo.
      payload.active = true;
      payload.status = true;
      payload.forcePasswordChange = true;
    }
    if (activeType === 'admin_role') payload.permissions = [];
    setJsonDrafts({
      permissions: activeType === 'admin_user' ? '' : JSON.stringify(payload.permissions || [], null, 2),
      legalEntityIds: '',
      address: '',
    });
    setFormError('');
    setForm({ record: null, localId: `local:${crypto.randomUUID()}`, remoteId: null, baseVersion: null, payload, isNew: true });
  }, [definition, activeType, scope]);

  const openEdit = useCallback((record: LocalRecord) => {
    if (!definition) return;
    const payload = { ...(record.payload || {}) };
    if (activeType === 'customer') payload.address = { ...blankAddress(), ...(payload.address || {}) };
    if (activeType === 'admin_user') {
      // A lista central devolve as permissões efetivas e os CNPJs atuais.
      // Se uma cópia antiga não os tiver, eles não são enviados.
      if (!Array.isArray(payload.permissions)) delete payload.permissions;
      if (!Array.isArray(payload.legalEntityIds)) delete payload.legalEntityIds;
    }
    setJsonDrafts({
      permissions: JSON.stringify(payload.permissions || [], null, 2),
      legalEntityIds: '',
      address: '',
    });
    setFormError('');
    setForm({
      record, localId: record.localId, remoteId: record.remoteId,
      baseVersion: record.baseVersion, payload, isNew: false,
    });
  }, [definition, activeType]);

  useEffect(() => {
    if (!form || !scope || !definition) return;
    const references = new Set(definition.fields.map(field => field.reference).filter(Boolean) as string[]);
    for (const reference of Array.from(references)) {
      const type = recordReferenceType(reference);
      if (!type) continue;
      listLocalRecords(scope, type, 300)
        .then(rows => { if (alive.current) setRefRecords(previous => ({ ...previous, [type]: rows })); })
        .catch(() => undefined);
    }
  }, [form?.localId, form?.remoteId, scope, definition]);

  const setField = (key: string, value: any) => {
    setForm(current => current ? { ...current, payload: { ...current.payload, ...(activeType === 'purchase_return' && key === 'purchaseOrderId' ? {items: []} : {}), [key]: value } } : current);
  };
  const setAddressField = (key: string, value: string) => {
    setForm(current => current ? {
      ...current,
      payload: { ...current.payload, address: { ...(current.payload.address || blankAddress()), [key]: value } },
    } : current);
  };
  const toggleLegalEntity = (id: number) => {
    setForm(current => {
      if (!current) return current;
      const currentIds = Array.isArray(current.payload.legalEntityIds) ? current.payload.legalEntityIds.map(Number) : [];
      const next = currentIds.includes(id) ? currentIds.filter(item => item !== id) : [...currentIds, id];
      return { ...current, payload: { ...current.payload, legalEntityIds: next } };
    });
  };
  const setPermissionsText = (text: string) => {
    setJsonDrafts(current => ({ ...current, permissions: text }));
    if (!text.trim()) {
      setForm(current => {
        if (!current) return current;
        const payload = { ...current.payload };
        delete payload.permissions;
        return { ...current, payload };
      });
      return;
    }
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) setField('permissions', parsed);
    } catch { /* validação no envio */ }
  };

  const submit = async () => {
    if (!form || !definition || !scope) return;
    setFormError('');
    const payload = { ...form.payload };
    if (activeType === 'purchase_return' && (!Array.isArray(payload.items) || !payload.items.length)) {
      setFormError('Selecione ao menos um item para devolver.');
      return;
    }
    for (const field of definition.fields) {
      if (field.createOnly && form.remoteId) { delete payload[field.key]; continue; }
      if (field.type === 'json' && field.key === 'permissions') {
        const text = jsonDrafts.permissions.trim();
        if (text) {
          try {
            const parsed = JSON.parse(text);
            if (!Array.isArray(parsed)) {
              setFormError('Permissões devem ser uma lista JSON.');
              return;
            }
            payload.permissions = parsed;
          } catch {
            setFormError('Permissões devem ser um JSON válido.');
            return;
          }
        } else if (activeType === 'admin_role' && form.isNew) {
          payload.permissions = [];
        } else {
          // Em branco: usa o cargo (novo colaborador) ou mantém o atual.
          delete payload.permissions;
        }
      }
    }
    if (!form.isNew && activeType === 'admin_user') {
      // Envia acessos/permissões somente quando o administrador mudou algo.
      // Isso evita reescrever vínculos antigos ao editar apenas o cadastro.
      if (JSON.stringify(payload.permissions) === JSON.stringify(form.record?.payload?.permissions)) {
        delete payload.permissions;
      }
      if (JSON.stringify(payload.legalEntityIds) === JSON.stringify(form.record?.payload?.legalEntityIds)) {
        delete payload.legalEntityIds;
      }
    }
    if (payload.address && !Object.values(payload.address).some(value => String(value || '').trim())) {
      delete payload.address;
    }
    if (payload.address) {
      const missing = ['street', 'city', 'zip', 'number', 'state', 'city_code', 'neighborhood']
        .filter(key => !String(payload.address[key] || '').trim());
      if (missing.length) {
        setFormError('Preencha todos os campos do endereço ou deixe o endereço vazio.');
        return;
      }
    }
    for (const field of definition.fields) {
      if (field.createOnly && form.remoteId) continue;
      if (field.key === 'permissions' && payload.permissions === undefined) continue;
      if (field.key === 'legalEntityIds' && payload.legalEntityIds === undefined) continue;
      if (field.required && (payload[field.key] === undefined || payload[field.key] === null || payload[field.key] === '')) {
        setFormError(`Informe ${field.label.toLowerCase()}.`);
        return;
      }
    }
    const operation = form.remoteId ? 'update' : 'create';
    if (operation === 'update' && !form.baseVersion) {
      setFormError('A versão central deste registro não está disponível. Atualize a cópia central antes de editar.');
      return;
    }
    try {
      await saveRecordDraft(scope, activeType, {
        localId: form.localId, remoteId: form.remoteId,
        baseVersion: form.baseVersion, payload,
      });
      await enqueueRecord(scope, activeType, {
        operation, localId: form.localId, remoteId: form.remoteId,
        baseVersion: form.baseVersion, payload,
      });
      setForm(null);
      setMessage('Registro salvo no cofre local e enfileirado para sincronização.');
      await loadLocal();
    } catch (nextError) {
      setFormError(nextError instanceof Error ? nextError.message : String(nextError));
    }
  };

  const remove = async (record: LocalRecord) => {
    if (!scope || !window.confirm(`Descartar a cópia local de ${recordDisplayLabel(record)}?`)) return;
    try {
      await deleteLocalRecord(scope, activeType, record.localId);
      await loadLocal();
      setMessage('Cópia local descartada.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    }
  };

  const retry = async (operationId: string) => {
    if (!scope) return;
    try {
      await retryRecordOperation(scope, operationId);
      await sync();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    }
  };

  const resume = async () => {
    if (!scope) return;
    try {
      await resumeRecordOperations(scope);
      await sync();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    }
  };

  const referenceOptions = (field: RecordField) => {
    const central = (options[field.reference || ''] || []).map(option => ({
      value: String(option.id), label: option.label, secondary: option.secondary || null,
      legalEntityId: option.legalEntityId,
    }));
    const type = recordReferenceType(field.reference || '');
    const local = type
      ? (refRecords[type] || [])
        .filter(record => record.remoteId == null && record.status === 'queued')
        .map(record => ({ value: record.localId, label: `[Offline] ${recordDisplayLabel(record)}`, secondary: recordSecondary(record), legalEntityId: undefined }))
      : [];
    const all = [...local, ...central];
    return field.reference === 'employment_link' && scope
      ? all.filter(option => option.legalEntityId == null || Number(option.legalEntityId) === Number(scope.legalEntityId))
      : all;
  };

  const renderField = (field: RecordField) => {
    const value = form?.payload[field.key];
    if (activeType === 'purchase_return' && field.key === 'items') {
      const order = options.purchase_order?.find(item => Number(item.id) === Number(form?.payload.purchaseOrderId));
      return <fieldset key={field.key} className="space-y-2 rounded border p-3 md:col-span-2">
        <legend className="font-medium">Itens a devolver</legend>
        <p className="text-xs text-slate-600">Saldo da última consulta. A central revalida as quantidades ao sincronizar. A devolução será criada como rascunho.</p>
        {!order?.items?.length && <p>Selecione um pedido recebido nas opções atualizadas online.</p>}
        {order?.items?.map(item => <label key={item.id} className="flex items-center justify-between gap-3 text-sm">
          <span>{item.label} · saldo consultado: {item.eligibleQuantity}</span>
          <input aria-label={`Devolver ${item.label}`} className="w-24 rounded border p-2" type="number" min={0} max={Number(item.eligibleQuantity)} step={1}
            value={(Array.isArray(value) ? value : []).find(row => Number(row.purchaseOrderItemId) === Number(item.id))?.quantity ?? 0}
            onChange={event => {
              const rows = (Array.isArray(value) ? value : []).filter(row => Number(row.purchaseOrderItemId) !== Number(item.id));
              const quantity = Number(event.target.value);
              if (quantity > 0) rows.push({purchaseOrderItemId: Number(item.id), quantity});
              setField('items', rows);
            }}/>
        </label>)}
      </fieldset>;
    }
    if (field.type === 'boolean') {
      return (
        <label className="flex items-center gap-2 text-sm" key={field.key}>
          <input type="checkbox" checked={Boolean(value)} onChange={event => setField(field.key, event.target.checked)} />
          {field.label}
        </label>
      );
    }
    if (field.type === 'reference') {
      return (
        <label className="block text-sm" key={field.key}>
          <span className="font-medium">{field.label}{field.required ? ' *' : ''}</span>
          <select
            className="mt-1 w-full rounded border p-2"
            disabled={activeType === 'purchase_return' && field.key === 'purchaseOrderId' && Boolean(form?.remoteId)}
            value={value == null ? '' : String(value)}
            onChange={event => {
              const next = event.target.value;
              setField(field.key, next.startsWith('local:') ? next : next ? Number(next) : null);
            }}
          >
            <option value="">Selecione</option>
            {referenceOptions(field).map(option => (
              <option key={option.value} value={option.value}>{option.label}{option.secondary ? ` — ${option.secondary}` : ''}</option>
            ))}
          </select>
        </label>
      );
    }
    if (field.type === 'select') {
      return (
        <label className="block text-sm" key={field.key}>
          <span className="font-medium">{field.label}{field.required ? ' *' : ''}</span>
          <select className="mt-1 w-full rounded border p-2" value={value == null ? '' : String(value)} onChange={event => setField(field.key, event.target.value || null)}>
            <option value="">Selecione</option>
            {(field.options || []).map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      );
    }
    if (field.type === 'textarea') {
      return (
        <label className="block text-sm" key={field.key}>
          <span className="font-medium">{field.label}{field.required ? ' *' : ''}</span>
          <textarea className="mt-1 w-full rounded border p-2" rows={3} maxLength={field.max || undefined} value={value == null ? '' : String(value)} onChange={event => setField(field.key, event.target.value)} />
        </label>
      );
    }
    if (field.type === 'number') {
      return (
        <label className="block text-sm" key={field.key}>
          <span className="font-medium">{field.label}{field.required ? ' *' : ''}</span>
          <input type="number" className="mt-1 w-full rounded border p-2" min={field.min ?? undefined} max={field.max ?? undefined} step="any" value={value == null ? '' : String(value)} onChange={event => setField(field.key, event.target.value === '' ? null : Number(event.target.value))} />
        </label>
      );
    }
    if (field.type === 'date') {
      return (
        <label className="block text-sm" key={field.key}>
          <span className="font-medium">{field.label}{field.required ? ' *' : ''}</span>
          <input type="date" className="mt-1 w-full rounded border p-2" value={value ? String(value).slice(0, 10) : ''} onChange={event => setField(field.key, event.target.value || null)} />
        </label>
      );
    }
    if (field.type === 'datetime') {
      return (
        <label className="block text-sm" key={field.key}>
          <span className="font-medium">{field.label}{field.required ? ' *' : ''}</span>
          <input type="datetime-local" className="mt-1 w-full rounded border p-2" value={isoToInput(value)} onChange={event => setField(field.key, inputToIso(event.target.value))} />
          <span className="text-xs text-slate-500">Horário convertido para UTC com fuso do computador.</span>
        </label>
      );
    }
    if (field.type === 'password') {
      return (
        <label className="block text-sm" key={field.key}>
          <span className="font-medium">{field.label}{field.required ? ' *' : ''}</span>
          <input type="password" autoComplete="new-password" className="mt-1 w-full rounded border p-2" minLength={field.min || 8} value={value == null ? '' : String(value)} onChange={event => setField(field.key, event.target.value)} />
        </label>
      );
    }
    if (field.key === 'address') {
      const address = value || blankAddress();
      const labels: Record<string, string> = { street: 'Rua', city: 'Cidade', zip: 'CEP', number: 'Número', state: 'UF', city_code: 'Código IBGE', neighborhood: 'Bairro' };
      return (
        <fieldset className="rounded border p-3" key={field.key}>
          <legend className="px-1 text-sm font-medium">Endereço (opcional)</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(labels).map(([key, label]) => (
              <label className="block text-sm" key={key}>
                <span>{label}</span>
                <input className="mt-1 w-full rounded border p-2" value={address[key] || ''} onChange={event => setAddressField(key, event.target.value)} />
              </label>
            ))}
          </div>
        </fieldset>
      );
    }
    if (field.key === 'legalEntityIds' && activeType === 'admin_user') {
      return (
        <fieldset className="rounded border p-3" key={field.key}>
          <legend className="px-1 text-sm font-medium">CNPJs de acesso</legend>
          {!form?.isNew && <p className="mb-2 text-xs text-slate-500">Deixe sem alterações para manter os CNPJs atuais.</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            {(options.legal_entity || []).map(option => {
              const ids = Array.isArray(form?.payload.legalEntityIds) ? form.payload.legalEntityIds.map(Number) : [];
              return (
                <label className="flex items-center gap-2 text-sm" key={option.id}>
                  <input type="checkbox" checked={ids.includes(Number(option.id))} onChange={() => toggleLegalEntity(Number(option.id))} />
                  {option.label}{option.secondary ? ` — ${option.secondary}` : ''}
                </label>
              );
            })}
          </div>
        </fieldset>
      );
    }
    if (field.type === 'json' && field.key === 'permissions') {
      return (
        <label className="block text-sm" key={field.key}>
          <span className="font-medium">{field.label}</span>
          {activeType === 'admin_user' && (
            <span className="ml-2 text-xs text-slate-500">
              {form?.isNew ? 'em branco usa as permissões do cargo' : 'em branco mantém as permissões atuais'}
            </span>
          )}
          <textarea
            className="mt-1 w-full rounded border p-2 font-mono text-xs" rows={6}
            placeholder='[{"moduleKey":"crm","actions":["view","edit"]}]'
            value={jsonDrafts.permissions}
            onChange={event => setPermissionsText(event.target.value)}
          />
        </label>
      );
    }
    if (field.type === 'json') {
      return (
        <label className="block text-sm" key={field.key}>
          <span className="font-medium">{field.label}</span>
          <textarea className="mt-1 w-full rounded border p-2 font-mono text-xs" rows={3} value={jsonDrafts[field.key] ?? (value == null ? '' : JSON.stringify(value, null, 2))} onChange={event => {
            setJsonDrafts(current => ({ ...current, [field.key]: event.target.value }));
            try { setField(field.key, event.target.value.trim() ? JSON.parse(event.target.value) : undefined); } catch { /* validação no envio */ }
          }} />
        </label>
      );
    }
    return (
      <label className="block text-sm" key={field.key}>
        <span className="font-medium">{field.label}{field.required ? ' *' : ''}</span>
        <input className="mt-1 w-full rounded border p-2" maxLength={field.max || undefined} value={value == null ? '' : String(value)} onChange={event => setField(field.key, event.target.value)} />
      </label>
    );
  };

  if (!scope) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded border border-amber-300 bg-amber-50 p-4 text-amber-900">
          Entre com uma empresa e um CNPJ ativo para usar os cadastros offline.
        </div>
      </div>
    );
  }

  const visibleRecords = [...records].sort((a, b) => statusOrder(a) - statusOrder(b) || b.updatedAt - a.updatedAt);

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link to="/offline" className="underline">Continuidade offline</Link>
            <span>/</span>
            <Link to="/offline/domains" className="underline">Operações por setor</Link>
          </div>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <Database className="h-6 w-6" /> Cadastros offline
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Crie e edite cadastros, CRM, treinamentos e administração no cofre SQLite. A central revalida permissões, versão e vínculos ao sincronizar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => loadOnlineData(true)} disabled={loading || !online} className="inline-flex items-center gap-2 rounded border bg-white px-3 py-2 text-sm disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar central
          </button>
          <button onClick={sync} disabled={syncing || !online} className="inline-flex items-center gap-2 rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50">
            <CloudOff className="h-4 w-4" /> {syncing ? 'Sincronizando…' : 'Sincronizar fila'}
          </button>
        </div>
      </div>

      {!nativeStorage() && (
        <div className="rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">
          Abra esta tela no aplicativo desktop. O navegador não possui o cofre SQLite protegido exigido para cadastros offline.
        </div>
      )}
      {error && <div className="flex items-start gap-2 rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900"><AlertTriangle className="mt-0.5 h-4 w-4" /> {error}</div>}
      {message && <div className="flex items-start gap-2 rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900"><CheckCircle2 className="mt-0.5 h-4 w-4" /> {message}</div>}
      {!online && <div className="rounded border border-slate-300 bg-slate-50 p-3 text-sm text-slate-700">Sem internet: você pode criar, editar e enfileirar. A sincronização ocorrerá quando a conexão voltar.</div>}

      <div className="grid gap-4 lg:grid-cols-[240px,1fr]">
        <aside className="space-y-3">
          {availableGroups.map(group => (
            <div key={group.key} className="rounded border bg-white p-2">
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</p>
              <div className="space-y-1">
                {group.types.map(type => {
                  const item = recordDefinition(catalog, type);
                  return (
                    <button key={type} onClick={() => { setActiveType(type); setForm(null); setError(''); }} className={`w-full rounded px-2 py-2 text-left text-sm ${activeType === type ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`}>
                      {item?.label || type}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {!catalog.length && <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Conecte-se uma vez para baixar o catálogo de cadastros.</div>}
        </aside>

        <main className="space-y-4">
          <div className="rounded border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">{definition?.label || 'Cadastros'}</h2>
                <p className="text-xs text-slate-500">Cópias centrais e registros criados neste computador ficam no cofre local.</p>
              </div>
              {definition?.operations.includes('create') && canWrite(definition, 'create') && (
                <button onClick={openNew} className="rounded bg-emerald-700 px-3 py-2 text-sm text-white disabled:opacity-50" disabled={!nativeStorage()}>Novo</button>
              )}
            </div>

            {form && (
              <div className="mt-4 rounded border border-slate-300 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{form.isNew ? 'Novo' : 'Editar'} — {definition?.label}</h3>
                  <button onClick={() => setForm(null)} className="rounded p-1 hover:bg-slate-200" aria-label="Fechar"><X className="h-4 w-4" /></button>
                </div>
                {form.remoteId && <p className="mt-1 text-xs text-slate-500">Registro central #{form.remoteId} · versão {form.baseVersion}</p>}
                {!form.isNew && form.record?.status === 'synced' && <p className="mt-1 text-xs text-amber-700">A edição será aplicada somente se a versão central ainda for esta.</p>}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {definition?.fields.filter(field => !(field.createOnly && form.remoteId)).map(renderField)}
                </div>
                {formError && <p className="mt-3 rounded border border-rose-300 bg-rose-50 p-2 text-sm text-rose-900">{formError}</p>}
                <div className="mt-4 flex gap-2">
                  <button onClick={submit} className="inline-flex items-center gap-2 rounded bg-slate-900 px-3 py-2 text-sm text-white"><Save className="h-4 w-4" /> Salvar e enfileirar</button>
                  <button onClick={() => setForm(null)} className="rounded border bg-white px-3 py-2 text-sm">Cancelar</button>
                </div>
              </div>
            )}

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="border-b text-left text-xs uppercase text-slate-500"><th className="p-2">Registro</th><th className="p-2">Referência</th><th className="p-2">Origem</th><th className="p-2">Estado</th><th className="p-2">Ações</th></tr></thead>
                <tbody>
                  {visibleRecords.map(record => (
                    <tr key={record.localId} className="border-b last:border-0">
                      <td className="p-2 font-medium">{recordDisplayLabel(record)}</td>
                      <td className="p-2 text-slate-600">{recordSecondary(record)}</td>
                      <td className="p-2 text-slate-600">{record.localId.startsWith('local:') ? 'Criado offline' : 'Central'}</td>
                      <td className="p-2"><span className={`rounded px-2 py-1 text-xs ${recordStatusClass(record.status)}`}>{recordStatusLabel(record.status)}</span></td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-2">
                          {definition?.operations.includes('update') && canWrite(definition, 'update') && !['queued', 'conflict'].includes(record.status) && (
                            <button onClick={() => openEdit(record)} className="text-xs underline">Editar</button>
                          )}
                          {['draft', 'conflict'].includes(record.status) && <button onClick={() => remove(record)} className="inline-flex items-center gap-1 text-xs text-rose-700 underline"><Trash2 className="h-3 w-3" /> Descartar</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!visibleRecords.length && <tr><td colSpan={5} className="p-4 text-center text-slate-500">Nenhum registro local para este tipo. Atualize a central ou crie um novo.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Fila de sincronização</h2>
              <button onClick={resume} className="inline-flex items-center gap-2 rounded border px-3 py-1.5 text-xs"><ShieldCheck className="h-3.5 w-3.5" /> Retomar após login/dispositivo</button>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="border-b text-left text-xs uppercase text-slate-500"><th className="p-2">Operação</th><th className="p-2">Registro</th><th className="p-2">Estado</th><th className="p-2">Erro</th><th className="p-2">Ações</th></tr></thead>
                <tbody>
                  {operations.map(operation => (
                    <tr key={operation.operationId} className="border-b last:border-0">
                      <td className="p-2">{operation.operation === 'create' ? 'Criar' : 'Editar'}</td>
                      <td className="p-2 font-mono text-xs">{operation.localId}{operation.remoteId ? ` → #${operation.remoteId}` : ''}</td>
                      <td className="p-2"><span className={`rounded px-2 py-1 text-xs ${recordStatusClass(operation.state)}`}>{recordStatusLabel(operation.state)}</span></td>
                      <td className="p-2 text-xs text-rose-700">{operation.errorCode || '—'}</td>
                      <td className="p-2">{operation.state === 'blocked' && operation.errorCode !== 'LOCAL_CORRUPT' && <button onClick={() => retry(operation.operationId)} className="text-xs underline">Reenviar</button>}</td>
                    </tr>
                  ))}
                  {!operations.length && <tr><td colSpan={5} className="p-4 text-center text-slate-500">Nenhuma operação pendente para este tipo.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded border bg-slate-50 p-3 text-xs text-slate-600">
            <span>Conflitos não são reenviados automaticamente. Descarte a cópia em conflito, atualize a central e refaça a edição.</span>
            <Link to="/offline/domains" className="inline-flex items-center gap-1 underline"><ArrowLeft className="h-3 w-3" /> Operações por setor</Link>
          </div>
        </main>
      </div>
    </div>
  );
}
