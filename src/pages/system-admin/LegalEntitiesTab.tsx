import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Landmark,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import {
  LegalEntityContractStatus,
  LegalEntityRequestStatus,
  SystemAdminCapacityEvent,
  SystemAdminCompany,
  SystemAdminLegalEntityCapacityView,
  SystemAdminLegalEntityRequest,
  systemAdminService,
} from "../../services/systemAdminService";
import {
  Alert,
  Button,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Select,
  Spinner,
  StatusBadge,
  Textarea,
} from "./components";
import { formatDateTime } from "./utils";

const requestStatusLabels: Record<LegalEntityRequestStatus, string> = {
  pending: "Pendente",
  contacted: "Em contato",
  approved: "Aprovada",
  rejected: "Recusada",
  cancelled: "Cancelada",
};

const contractStatusLabels: Record<LegalEntityContractStatus, string> = {
  active: "Ativa",
  suspended: "Suspensa",
  cancelled: "Cancelada",
  pending: "Pendente",
};

interface Props {
  refreshKey: number;
  initialCompanyId: number | null;
  onPresetConsumed: () => void;
  onDataChanged: () => void;
}

export default function LegalEntitiesTab({
  refreshKey,
  initialCompanyId,
  onPresetConsumed,
  onDataChanged,
}: Props) {
  const [requests, setRequests] = useState<SystemAdminLegalEntityRequest[]>([]);
  const [companies, setCompanies] = useState<SystemAdminCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [overview, setOverview] = useState<SystemAdminLegalEntityCapacityView | null>(null);
  const [events, setEvents] = useState<SystemAdminCapacityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestFilter, setRequestFilter] = useState<"" | LegalEntityRequestStatus>("pending");
  const [form, setForm] = useState({
    enabled: false,
    limit: 1,
    contractStatus: "active" as LegalEntityContractStatus,
    notes: "",
  });

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const [requestList, companyList] = await Promise.all([
        systemAdminService.listLegalEntityRequests(requestFilter || undefined),
        systemAdminService.listCompanies(),
      ]);
      setRequests(requestList);
      setCompanies(companyList);
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar as solicitações de CNPJ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, requestFilter]);

  const loadOverview = async (companyId: number) => {
    setLoadingDetail(true);
    setError(null);
    try {
      const [detail, capacityEvents] = await Promise.all([
        systemAdminService.getLegalEntityCapacity(companyId),
        systemAdminService.listLegalEntityCapacityEvents(companyId),
      ]);
      setOverview(detail);
      setEvents(capacityEvents);
      setSelectedCompany(companyId);
      setForm({
        enabled: detail.company.multiCnpjEnabled,
        limit: detail.company.legalEntityLimit,
        contractStatus: detail.company.contractStatus,
        notes: "",
      });
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar a capacidade da organização.");
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (!initialCompanyId) return;
    loadOverview(initialCompanyId);
    setModalOpen(true);
    onPresetConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCompanyId]);

  const pendingCount = useMemo(
    () => requests.filter((item) => item.status === "pending").length,
    [requests]
  );

  const updateRequest = async (
    request: SystemAdminLegalEntityRequest,
    status: LegalEntityRequestStatus
  ) => {
    try {
      await systemAdminService.updateLegalEntityRequest(request.id, { status });
      await load(false);
      onDataChanged();
    } catch (err: any) {
      setError(err.message || "Não foi possível atualizar a solicitação.");
    }
  };

  const submitCapacity = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCompany) return;
    setSaving(true);
    setError(null);
    try {
      await systemAdminService.updateLegalEntityCapacity(selectedCompany, {
        enabled: form.enabled,
        limit: form.limit,
        contractStatus: form.contractStatus,
        notes: form.notes || null,
      });
      await loadOverview(selectedCompany);
      setModalOpen(false);
      onDataChanged();
    } catch (err: any) {
      setError(err.message || "Não foi possível atualizar a capacidade de CNPJs.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Empresas / CNPJs"
        description="Capacidade contratada, uso real e solicitações das organizações. Somente o suporte altera a capacidade; reduções nunca excluem CNPJs nem transferem dados."
        action={
          <Button variant="outline" onClick={() => load()} disabled={loading}>
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Atualizar
          </Button>
        }
      />

      {error ? <Alert>{error}</Alert> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Clock3 className="h-4 w-4 text-amber-600" />
            Solicitações pendentes
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Landmark className="h-4 w-4 text-blue-600" />
            Organizações
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{companies.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <ShieldAlert className="h-4 w-4 text-violet-600" />
            Limite comercial
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900">Até 3 CNPJs ativos</p>
          <p className="text-xs text-slate-500">por organização, mediante contratação</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Solicitações de CNPJ</h2>
            <p className="text-xs text-slate-500">
              A aprovação comercial não habilita capacidade sozinha: ajuste a capacidade abaixo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={requestFilter}
              onChange={(event) =>
                setRequestFilter(event.target.value as "" | LegalEntityRequestStatus)
              }
            >
              <option value="">Todas</option>
              {Object.entries(requestStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Button variant="outline" onClick={() => load()} disabled={loading}>
              <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
            <Spinner /> Carregando solicitações...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Landmark}
              title="Nenhuma solicitação encontrada"
              description="Quando um administrador de organização pedir CNPJs adicionais, a solicitação aparecerá aqui."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Organização</th>
                  <th className="px-4 py-3">Solicitante</th>
                  <th className="px-4 py-3">Observação</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Criada em</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((request) => (
                  <tr key={request.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{request.company_name}</p>
                      <p className="text-xs text-slate-500">Organização #{request.company_id}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {request.requested_by_username || "—"}
                    </td>
                    <td className="max-w-[320px] px-4 py-3 text-xs text-slate-600">
                      {request.notes || "—"}
                      {request.support_notes ? (
                        <p className="mt-1 text-slate-500">Suporte: {request.support_notes}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={requestStatusLabels[request.status]}
                        className={
                          request.status === "pending"
                            ? "bg-amber-50 text-amber-700 ring-amber-200"
                            : request.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : request.status === "rejected"
                                ? "bg-rose-50 text-rose-700 ring-rose-200"
                                : "bg-slate-100 text-slate-600 ring-slate-200"
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDateTime(request.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Button
                          variant="outline"
                          onClick={() => loadOverview(request.company_id)}
                          disabled={loadingDetail}
                        >
                          <Building2 className="h-4 w-4" />
                          Capacidade
                        </Button>
                        {request.status === "pending" ? (
                          <Button
                            variant="outline"
                            onClick={() => updateRequest(request, "contacted")}
                          >
                            Em contato
                          </Button>
                        ) : null}
                        {request.status !== "approved" && request.status !== "cancelled" ? (
                          <Button onClick={() => updateRequest(request, "approved")}>
                            <CheckCircle2 className="h-4 w-4" />
                            Aprovar
                          </Button>
                        ) : null}
                        {request.status !== "rejected" && request.status !== "cancelled" ? (
                          <Button
                            variant="outline"
                            onClick={() => updateRequest(request, "rejected")}
                          >
                            <XCircle className="h-4 w-4" />
                            Recusar
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {overview ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">{overview.company.name}</h2>
                <p className="text-xs text-slate-500">
                  {overview.company.cnpj || "CNPJ não informado"} · contrato{" "}
                  {contractStatusLabels[overview.company.contractStatus]}
                </p>
              </div>
              <Button onClick={() => setModalOpen(true)}>
                <Building2 className="h-4 w-4" />
                Alterar capacidade
              </Button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Contratado</p>
                <p className="text-xl font-bold text-slate-900">
                  {overview.capacity.multiCnpjEnabled ? overview.capacity.limit : 1}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Em uso ativo</p>
                <p className="text-xl font-bold text-slate-900">{overview.capacity.active}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Disponível</p>
                <p className="text-xl font-bold text-slate-900">{overview.capacity.available}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Regularização</p>
                <p className="text-xl font-bold text-slate-900">
                  {overview.entities.filter((entity) => entity.status === "regularization").length}
                </p>
              </div>
            </div>
            {!overview.capacity.multiCnpjEnabled ? (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Multi-CNPJ desabilitado: a organização permanece no limite freemium de 1 CNPJ ativo.
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-4">
                <h3 className="text-sm font-bold text-slate-900">CNPJs da organização</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {overview.entities.map((entity) => (
                  <div key={entity.id} className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {entity.tradeName || entity.legalName}
                        {entity.isPrimary ? (
                          <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                            Principal
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {entity.legalName} · {entity.cnpjFormatted}
                      </p>
                    </div>
                    <StatusBadge
                      label={
                        entity.status === "active"
                          ? "Ativo"
                          : entity.status === "regularization"
                            ? "Regularização"
                            : "Inativo"
                      }
                      className={
                        entity.status === "active"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : entity.status === "regularization"
                            ? "bg-amber-50 text-amber-700 ring-amber-200"
                            : "bg-slate-100 text-slate-600 ring-slate-200"
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-4">
                <h3 className="text-sm font-bold text-slate-900">Histórico de capacidade</h3>
              </div>
              <div className="max-h-[340px] divide-y divide-slate-100 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">Nenhuma alteração registrada.</p>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="p-4 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">
                        {event.new_enabled ? "Multi-CNPJ habilitado" : "Multi-CNPJ desabilitado"} ·
                        limite {event.new_limit} · contrato {event.new_contract_status}
                      </p>
                      <p className="mt-1">
                        {event.changed_by_username || "Suporte"} · {formatDateTime(event.created_at)}
                      </p>
                      {event.notes ? <p className="mt-1 text-slate-500">{event.notes}</p> : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Capacidade de CNPJs"
        description="Somente o suporte altera a capacidade. Reduções preservam todos os registros e colocam excedentes em regularização."
      >
        <form onSubmit={submitCapacity} className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">
              {overview?.company.name || "Selecione uma organização"}
            </p>
            <p>
              Uso atual: {overview?.capacity.active ?? 0} ativo(s) de{" "}
              {overview?.capacity.limit ?? 1} contratado(s).
            </p>
          </div>

          <Field label="Multi-CNPJ habilitado">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(event) =>
                  setForm((current) => ({ ...current, enabled: event.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              Permitir mais de um CNPJ ativo nesta organização
            </label>
          </Field>

          <Field label="Quantidade contratada (inclui o principal)">
            <Select
              value={form.limit}
              onChange={(event) =>
                setForm((current) => ({ ...current, limit: Number(event.target.value) }))
              }
              disabled={!form.enabled}
            >
              <option value={1}>1 CNPJ</option>
              <option value={2}>2 CNPJs</option>
              <option value={3}>3 CNPJs</option>
            </Select>
          </Field>

          <Field label="Situação contratual">
            <Select
              value={form.contractStatus}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  contractStatus: event.target.value as LegalEntityContractStatus,
                }))
              }
            >
              {Object.entries(contractStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Observação do suporte">
            <Textarea
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Registre a autorização comercial, o chamado ou a justificativa."
              rows={3}
            />
          </Field>

          {form.limit < (overview?.capacity.active ?? 0) ? (
            <Alert>
              A redução não exclui CNPJs. As empresas excedentes ficarão em regularização e não
              poderão iniciar novas operações; o histórico permanece acessível.
            </Alert>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !overview}>
              {saving ? "Salvando..." : "Confirmar capacidade"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
