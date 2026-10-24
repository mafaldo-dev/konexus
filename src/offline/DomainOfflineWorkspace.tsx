import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarRange,
  CheckCircle2,
  CloudOff,
  Landmark,
  RefreshCw,
  ShieldCheck,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { DraftScope, nativeStorage } from './salesDrafts';
import {
  cancelDomainReservation,
  DOMAIN_OFFLINE_CONFIG,
  DomainAction,
  DomainKey,
  DomainLocalReservation,
  DomainOperation,
  DomainOperationPayload,
  DomainSnapshot,
  DomainTarget,
  domainActionLabel,
  domainStatusLabel,
  domainTargetActions,
  listDomainOperations,
  listLocalDomainReservations,
  loadCachedDomainTargets,
  queueDomainOperation,
  refreshDomainTargets,
  reserveDomainTarget,
  resumeDomainOperations,
  retryDomainOperation,
  syncDomainOperations,
} from './domainOffline';

type Tab = {
  key: DomainKey;
  label: string;
  module: string;
  viewAction: string;
  operateAction: string;
  icon: typeof Wallet;
};

const TABS: Tab[] = [
  { key: 'financial_receivable', label: 'A receber', module: 'finance', viewAction: 'view', operateAction: 'approve', icon: Wallet },
  { key: 'financial_payable', label: 'A pagar', module: 'finance', viewAction: 'view', operateAction: 'edit', icon: Landmark },
  { key: 'payroll_competency', label: 'Folha', module: 'rh', viewAction: 'view_payroll', operateAction: 'approve_payroll', icon: Users },
  { key: 'accounting_period', label: 'Contábil', module: 'contabil', viewAction: 'view', operateAction: 'manage_periods', icon: CalendarRange },
];

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatMoney = (value: number | null) => (value == null ? '—' : money.format(value));
const formatDate = (value: string | null) => {
  if (!value) return '—';
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('pt-BR');
};
const formatTimestamp = (value: number | null | undefined) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR');
};
const statusClass = (status: string) => {
  if (['paid', 'closed', 'confirmed', 'consumed'].includes(status)) return 'bg-emerald-100 text-emerald-800';
  if (['pending', 'open', 'active'].includes(status)) return 'bg-sky-100 text-sky-800';
  if (['queued', 'leased', 'calculated'].includes(status)) return 'bg-amber-100 text-amber-900';
  if (['overdue', 'blocked', 'cancelled', 'locked'].includes(status)) return 'bg-rose-100 text-rose-800';
  if (['approved'].includes(status)) return 'bg-indigo-100 text-indigo-800';
  return 'bg-slate-100 text-slate-700';
};
const isLiveReservation = (reservation: DomainLocalReservation | undefined) =>
  Boolean(reservation && ['active', 'queued', 'blocked'].includes(reservation.status));

export default function DomainOfflineWorkspace() {
  const { user, hasPermission, isCompanyAdmin } = useAuth();
  const [scope] = useState<DraftScope | null>(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || 'null');
      const company = JSON.parse(localStorage.getItem('companyData') || 'null');
      const entity = JSON.parse(localStorage.getItem('activeLegalEntity') || 'null');
      return userData?.id && company?.id && entity?.id && localStorage.getItem('token')
        ? { companyId: Number(company.id), legalEntityId: Number(entity.id), userId: Number(userData.id) }
        : null;
    } catch {
      return null;
    }
  });

  const availableTabs = useMemo(
    () =>
      TABS.filter(tab => isCompanyAdmin || hasPermission(tab.module, tab.viewAction)),
    [hasPermission, isCompanyAdmin]
  );
  const [domain, setDomain] = useState<DomainKey>(availableTabs[0]?.key || 'financial_receivable');
  const [snapshot, setSnapshot] = useState<DomainSnapshot | null>(null);
  const [reservations, setReservations] = useState<DomainLocalReservation[]>([]);
  const [operations, setOperations] = useState<DomainOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [busyTarget, setBusyTarget] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState<{ target: DomainTarget; action: DomainAction; reservation: DomainLocalReservation } | null>(null);
  const [formValues, setFormValues] = useState<DomainOperationPayload>({});
  const alive = useRef(true);

  const tab = TABS.find(item => item.key === domain) || TABS[0];
  const canOperate = isCompanyAdmin || hasPermission(tab.module, tab.operateAction);

  const loadLocal = useCallback(async () => {
    if (!scope) return;
    const [cached, nextReservations, nextOperations] = await Promise.all([
      loadCachedDomainTargets(scope, domain),
      listLocalDomainReservations(scope),
      listDomainOperations(scope),
    ]);
    if (!alive.current) return;
    setSnapshot(cached);
    setReservations(nextReservations);
    setOperations(nextOperations);
  }, [scope, domain]);

  const refresh = useCallback(async () => {
    if (!scope || !navigator.onLine) {
      setError('Conecte-se à internet para atualizar a cópia local dos alvos.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const next = await refreshDomainTargets(scope, domain);
      if (!alive.current) return;
      setSnapshot(next);
      setMessage(`Cópia local atualizada com ${next.targets.length} alvo(s) elegível(is).`);
      await loadLocal();
    } catch (refreshError) {
      if (!alive.current) return;
      setError(refreshError instanceof Error ? refreshError.message : String(refreshError));
      await loadLocal().catch(() => {});
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [scope, domain, loadLocal]);

  const sync = useCallback(async () => {
    if (!scope || !navigator.onLine) return;
    setSyncing(true);
    setError('');
    try {
      await syncDomainOperations(scope);
      await loadLocal();
      if (alive.current) setMessage('Fila local sincronizada com a autoridade central.');
    } catch (syncError) {
      if (alive.current) setError(syncError instanceof Error ? syncError.message : String(syncError));
      await loadLocal().catch(() => {});
    } finally {
      if (alive.current) setSyncing(false);
    }
  }, [scope, loadLocal]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!availableTabs.some(item => item.key === domain) && availableTabs[0]) {
      setDomain(availableTabs[0].key);
    }
  }, [availableTabs, domain]);

  useEffect(() => {
    if (!scope) return;
    setForm(null);
    setError('');
    setMessage('');
    void loadLocal().then(() => {
      if (navigator.onLine) void refresh();
    }).catch(loadError => {
      if (alive.current) setError(loadError instanceof Error ? loadError.message : String(loadError));
    });
  }, [scope, domain, loadLocal, refresh]);

  useEffect(() => {
    if (!scope) return;
    const reload = () => { void loadLocal().catch(() => {}); };
    const online = () => { void sync(); };
    const timer = window.setInterval(() => {
      if (navigator.onLine) void syncDomainOperations(scope).then(reload).catch(() => {});
    }, 20000);
    window.addEventListener('konexus:domain-offline-changed', reload);
    window.addEventListener('online', online);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('konexus:domain-offline-changed', reload);
      window.removeEventListener('online', online);
    };
  }, [scope, loadLocal, sync]);

  const domainReservations = reservations.filter(item => item.domain === domain);
  const domainOperations = operations.filter(item => item.domain === domain);
  const liveReservations = domainReservations.filter(isLiveReservation);
  const reservationFor = (targetId: number) =>
    liveReservations.find(item => item.targetId === targetId);
  const operationFor = (reservation?: DomainLocalReservation) =>
    reservation ? domainOperations.find(item => item.reservationId === reservation.id) : undefined;
  const targetLabel = (targetId: number) =>
    snapshot?.targets.find(item => item.targetId === targetId)?.label || `Alvo #${targetId}`;

  const reserve = async (target: DomainTarget) => {
    if (!scope) return;
    setBusyTarget(target.targetId);
    setError('');
    try {
      await reserveDomainTarget(scope, domain, target.targetId);
      if (alive.current) setMessage(`Alvo ${target.label} reservado para esta estação. A operação já pode ser preparada offline.`);
      await loadLocal();
    } catch (reserveError) {
      if (alive.current) setError(reserveError instanceof Error ? reserveError.message : String(reserveError));
    } finally {
      if (alive.current) setBusyTarget(null);
    }
  };

  const cancel = async (reservation: DomainLocalReservation) => {
    if (!scope) return;
    if (!navigator.onLine) {
      setError('A liberação da reserva exige conexão com a autoridade central.');
      return;
    }
    const result = await Swal.fire({
      title: 'Liberar reserva?',
      text: 'A central libera o alvo e a cópia local remove a operação pendente. Esta ação é auditada.',
      input: 'textarea',
      inputLabel: 'Motivo da liberação',
      inputPlaceholder: 'Ex.: operação cancelada antes do envio',
      inputValidator: value => (!value || value.trim().length < 5 ? 'Informe um motivo com pelo menos 5 caracteres.' : undefined),
      showCancelButton: true,
      confirmButtonText: 'Liberar',
      cancelButtonText: 'Manter',
      icon: 'warning',
    });
    if (!result.isConfirmed) return;
    setBusyTarget(reservation.targetId);
    setError('');
    try {
      await cancelDomainReservation(scope, domain, reservation.id, String(result.value || ''));
      if (alive.current) setMessage('Reserva liberada e cópia local limpa.');
      await loadLocal();
    } catch (cancelError) {
      if (alive.current) setError(cancelError instanceof Error ? cancelError.message : String(cancelError));
    } finally {
      if (alive.current) setBusyTarget(null);
    }
  };

  const openForm = (target: DomainTarget, action: DomainAction) => {
    const reservation = reservationFor(target.targetId);
    if (!reservation) {
      setError('Reserve o alvo online antes de preparar a operação offline.');
      return;
    }
    if (reservation.status !== 'active') {
      setError('A reserva já possui uma operação enfileirada. Sincronize ou resolva a fila antes de criar outra.');
      return;
    }
    const operation = operationFor(reservation);
    if (operation) {
      setError('Esta reserva já possui uma operação local. Use a fila abaixo para sincronizar ou tentar novamente.');
      return;
    }
    setError('');
    setForm({ target, action, reservation });
    setFormValues(action === 'settle' && domain === 'financial_payable'
      ? { paymentDate: new Date().toISOString().slice(0, 10) }
      : {});
  };

  const submitForm = async () => {
    if (!scope || !form) return;
    if (domain === 'financial_payable' && !formValues.paymentDate) {
      setError('Informe a data de pagamento.');
      return;
    }
    if (domain === 'accounting_period' && form.action === 'reopen' && (formValues.notes || '').trim().length < 5) {
      setError('Informe o motivo da reabertura com pelo menos 5 caracteres.');
      return;
    }
    setBusyTarget(form.target.targetId);
    setError('');
    try {
      await queueDomainOperation(scope, {
        domain,
        action: form.action,
        targetId: form.target.targetId,
        reservationId: form.reservation.id,
        payload: formValues,
      });
      if (navigator.onLine) await syncDomainOperations(scope);
      await loadLocal();
      if (alive.current) {
        setMessage(navigator.onLine
          ? 'Operação preparada e enviada para confirmação da central.'
          : 'Operação enfileirada localmente. Ela será enviada quando houver conexão.');
        setForm(null);
        setFormValues({});
      }
    } catch (submitError) {
      if (alive.current) setError(submitError instanceof Error ? submitError.message : String(submitError));
    } finally {
      if (alive.current) setBusyTarget(null);
    }
  };

  const retry = async (operation: DomainOperation) => {
    if (!scope) return;
    setBusyTarget(operation.targetId);
    setError('');
    try {
      await retryDomainOperation(scope, operation.operationId);
      if (navigator.onLine) await syncDomainOperations(scope);
      await loadLocal();
      if (alive.current) setMessage('Operação reenviada para a central.');
    } catch (retryError) {
      if (alive.current) setError(retryError instanceof Error ? retryError.message : String(retryError));
    } finally {
      if (alive.current) setBusyTarget(null);
    }
  };

  const resume = async () => {
    if (!scope) return;
    setError('');
    try {
      await resumeDomainOperations(scope);
      if (navigator.onLine) await syncDomainOperations(scope);
      await loadLocal();
      if (alive.current) setMessage('Operações bloqueadas por sessão/dispositivo foram retomadas.');
    } catch (resumeError) {
      if (alive.current) setError(resumeError instanceof Error ? resumeError.message : String(resumeError));
    }
  };

  if (!user || !scope) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Continuidade offline</h1>
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-900">
          Entre online ao menos uma vez neste computador para carregar a sessão, o CNPJ ativo e as permissões.
        </p>
        <Link className="inline-flex items-center gap-2 underline" to="/">
          <ArrowLeft size={16} /> Voltar ao login
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Continuidade offline — Financeiro, folha e contábil</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            As reservas são criadas online com confirmação de identidade e vinculadas a este computador, usuário e CNPJ.
            Depois de reservar, a operação final pode ser preparada sem internet e sincronizada com recibo idempotente.
          </p>
        </div>
        <Link className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm hover:bg-slate-50" to="/offline">
          <ArrowLeft size={16} /> Continuidade de vendas
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-slate-50 p-3 text-sm">
        <ShieldCheck size={18} className="text-emerald-700" />
        <span>Organização #{scope.companyId} · CNPJ interno #{scope.legalEntityId} · usuário #{scope.userId}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${nativeStorage() ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
          {nativeStorage() ? 'SQLite protegido disponível' : 'Somente leitura: abra o aplicativo desktop'}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${navigator.onLine ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-900'}`}>
          {navigator.onLine ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Setores com continuidade offline">
        {availableTabs.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={domain === item.key}
              onClick={() => setDomain(item.key)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                domain === item.key ? 'border-slate-900 bg-slate-900 text-white' : 'bg-white hover:bg-slate-50'
              }`}
            >
              <Icon size={16} /> {item.label}
            </button>
          );
        })}
      </div>

      {availableTabs.length === 0 && (
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Seu perfil não possui permissão de leitura ou operação em financeiro, folha ou contábil.
        </p>
      )}

      {message && <p role="status" className="flex items-start gap-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><CheckCircle2 size={18} className="mt-0.5 shrink-0" />{message}</p>}
      {error && <p role="alert" className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"><AlertTriangle size={18} className="mt-0.5 shrink-0" />{error}</p>}

      {availableTabs.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">{DOMAIN_OFFLINE_CONFIG[domain].label}</h2>
              <p className="text-xs text-slate-500">
                {snapshot ? `Cópia local de ${formatTimestamp(snapshot.updatedAt)}` : 'Sem cópia local carregada'}
                {' · '}{canOperate ? 'Seu perfil pode reservar e preparar operações' : 'Somente leitura'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void refresh()} disabled={loading || !navigator.onLine}
                className="inline-flex items-center gap-2 rounded border bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Atualizar da central
              </button>
              <button type="button" onClick={() => void sync()} disabled={syncing || !navigator.onLine}
                className="inline-flex items-center gap-2 rounded border bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50">
                <CloudOff size={16} /> Sincronizar fila
              </button>
              <button type="button" onClick={() => void resume()}
                className="inline-flex items-center gap-2 rounded border bg-white px-3 py-2 text-sm">
                <ShieldCheck size={16} /> Retomar sessão
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Alvo</th>
                  <th className="px-3 py-2">Detalhe</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Reserva local</th>
                  <th className="px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(snapshot?.targets || []).map(target => {
                  const reservation = reservationFor(target.targetId);
                  const operation = operationFor(reservation);
                  const actions = domainTargetActions(domain, target.status);
                  return (
                    <tr key={target.targetId} className="align-top hover:bg-slate-50/70">
                      <td className="px-3 py-3 font-medium">{target.label}<div className="text-xs font-normal text-slate-500">{target.reference || '—'}</div></td>
                      <td className="max-w-xs px-3 py-3 text-slate-600">{target.secondary || '—'}</td>
                      <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(target.status)}`}>{domainStatusLabel(target.status)}</span></td>
                      <td className="px-3 py-3 text-right font-mono">{formatMoney(target.amount)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatDate(target.dueDate)}</td>
                      <td className="px-3 py-3">
                        {reservation ? (
                          <div className="space-y-1">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(reservation.effectiveStatus)}`}>
                              {domainStatusLabel(reservation.effectiveStatus)}
                            </span>
                            <div className="text-xs text-slate-500">expira {formatTimestamp(new Date(reservation.expiresAt).getTime())}</div>
                            {operation && <div className="text-xs text-slate-600">operação: {domainStatusLabel(operation.state)}</div>}
                          </div>
                        ) : <span className="text-xs text-slate-400">não reservado</span>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          {!reservation && canOperate && (
                            <button type="button" onClick={() => void reserve(target)} disabled={!navigator.onLine || busyTarget === target.targetId}
                              className="rounded border border-slate-900 px-2 py-1 text-xs font-medium hover:bg-slate-900 hover:text-white disabled:opacity-50">
                              {busyTarget === target.targetId ? 'Reservando…' : 'Reservar'}
                            </button>
                          )}
                          {reservation?.status === 'active' && canOperate && actions.map(action => (
                            <button key={action} type="button" onClick={() => openForm(target, action)}
                              className="rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700">
                              {domainActionLabel(action)}
                            </button>
                          ))}
                          {reservation && operation?.state === 'blocked' && canOperate && (
                            <button type="button" onClick={() => void retry(operation)} disabled={busyTarget === target.targetId}
                              className="rounded border border-amber-500 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 disabled:opacity-50">
                              Tentar novamente
                            </button>
                          )}
                          {reservation && !operation && canOperate && (
                            <button type="button" onClick={() => void cancel(reservation)} disabled={busyTarget === target.targetId || !navigator.onLine}
                              className="rounded border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                              Liberar reserva
                            </button>
                          )}
                          {!canOperate && <span className="text-xs text-slate-400">sem permissão de operação</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {snapshot && snapshot.targets.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">Nenhum alvo elegível nesta cópia local.</td></tr>
                )}
                {!snapshot && (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                    Nenhuma cópia local. Conecte-se e use “Atualizar da central” para preparar este CNPJ.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {form && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <h3 className="font-semibold">{domainActionLabel(form.action)} — {form.target.label}</h3>
              <p className="mt-1 text-xs text-sky-900">
                Reserva {form.reservation.id.slice(0, 8)}… · a operação será gravada na fila local e confirmada pela central com recibo idempotente.
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {domain === 'financial_payable' && (
                  <label className="block text-sm font-medium">Data de pagamento
                    <input type="date" value={formValues.paymentDate || ''} onChange={event => setFormValues({ ...formValues, paymentDate: event.target.value })}
                      className="mt-1 block w-full rounded border p-2 font-normal" />
                  </label>
                )}
                {domain === 'financial_receivable' && (
                  <label className="block text-sm font-medium">Identificação da transação (opcional)
                    <input type="text" maxLength={100} value={formValues.transactionId || ''} onChange={event => setFormValues({ ...formValues, transactionId: event.target.value })}
                      className="mt-1 block w-full rounded border p-2 font-normal" placeholder="Ex.: PIX-2026-0001" />
                  </label>
                )}
                {domain !== 'payroll_competency' && (
                  <label className={`block text-sm font-medium ${domain === 'financial_payable' ? 'md:col-span-2' : ''}`}>
                    {form.action === 'reopen' ? 'Motivo da reabertura' : 'Observações (opcional)'}
                    <textarea rows={3} maxLength={domain === 'accounting_period' ? 4000 : 1000} value={formValues.notes || ''} onChange={event => setFormValues({ ...formValues, notes: event.target.value })}
                      className="mt-1 block w-full rounded border p-2 font-normal" />
                  </label>
                )}
                {domain === 'payroll_competency' && <p className="text-sm text-sky-900 md:col-span-2">O fechamento usa a competência aprovada e o cálculo já gravados na central. Nenhum valor é recalculado offline.</p>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => void submitForm()} disabled={busyTarget === form.target.targetId}
                  className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">
                  {busyTarget === form.target.targetId ? 'Enfileirando…' : 'Enfileirar operação'}
                </button>
                <button type="button" onClick={() => { setForm(null); setFormValues({}); }} className="rounded border bg-white px-3 py-2 text-sm">Cancelar</button>
              </div>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border bg-white p-4">
              <h3 className="font-semibold">Reservas locais deste domínio</h3>
              {domainReservations.length === 0 ? <p className="mt-2 text-sm text-slate-500">Nenhuma reserva local.</p> : (
                <ul className="mt-2 divide-y text-sm">
                  {domainReservations.map(reservation => (
                    <li key={reservation.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <div>
                        <span className="font-medium">{targetLabel(reservation.targetId)}</span>
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${statusClass(reservation.effectiveStatus)}`}>{domainStatusLabel(reservation.effectiveStatus)}</span>
                        <div className="text-xs text-slate-500">expira {formatTimestamp(new Date(reservation.expiresAt).getTime())}{reservation.errorCode ? ` · ${reservation.errorCode}` : ''}</div>
                      </div>
                      {isLiveReservation(reservation) && canOperate && (
                        <button type="button" onClick={() => void cancel(reservation)} disabled={!navigator.onLine || busyTarget === reservation.targetId}
                          className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 disabled:opacity-50">Liberar</button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border bg-white p-4">
              <h3 className="font-semibold">Fila de operações deste domínio</h3>
              {domainOperations.length === 0 ? <p className="mt-2 text-sm text-slate-500">Nenhuma operação local.</p> : (
                <ul className="mt-2 divide-y text-sm">
                  {domainOperations.map(operation => (
                    <li key={operation.operationId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <div>
                        <span className="font-medium">{domainActionLabel(operation.action)} · {targetLabel(operation.targetId)}</span>
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${statusClass(operation.state)}`}>{domainStatusLabel(operation.state)}</span>
                        <div className="text-xs text-slate-500">
                          {formatTimestamp(operation.updatedAt)}{operation.errorCode ? ` · ${operation.errorCode}` : ''}{operation.serverStatus ? ` · central: ${domainStatusLabel(operation.serverStatus)}` : ''}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {operation.state === 'blocked' && canOperate && (
                          <button type="button" onClick={() => void retry(operation)} disabled={busyTarget === operation.targetId}
                            className="rounded border border-amber-500 px-2 py-1 text-xs text-amber-900 disabled:opacity-50">Tentar novamente</button>
                        )}
                        {['pending', 'leased'].includes(operation.state) && (
                          <span className="text-xs text-slate-500">aguardando sincronização</span>
                        )}
                        {operation.state === 'confirmed' && <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 size={14} /> confirmada</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </section>
      )}

      <p className="flex items-start gap-2 text-xs text-slate-500">
        <XCircle size={14} className="mt-0.5 shrink-0" />
        A reserva não calcula folha, não cria lançamentos contábeis e não movimenta banco. Ela apenas garante exclusividade do alvo e permite registrar a operação final já validada pela central.
      </p>
    </main>
  );
}
