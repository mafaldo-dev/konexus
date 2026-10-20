import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import Dashboard from "../../../components/dashboard/Dashboard";
import {
  AuditEvent,
  AuditEventFilters,
  listAuditEvents,
} from "../../../services/auditService";
import {
  deriveFilterOptions,
  describeAuditEvent,
  formatDateTime,
  getActionLabel,
  getEntityLabel,
  getModuleLabel,
  getOutcomeLabel,
  getReauthLabel,
} from "./format";

const PAGE_SIZE = 25;

const OUTCOME_OPTIONS = [
  { value: "", label: "Todos os resultados" },
  { value: "success", label: "Concluídas" },
  { value: "denied", label: "Não autorizadas" },
  { value: "failed", label: "Falhas" },
  { value: "cancelled", label: "Canceladas" },
];

const REAUTH_OPTIONS = [
  { value: "", label: "Todas as confirmações" },
  { value: "valid", label: "Identidade confirmada" },
  { value: "invalid", label: "Senha não validada" },
  { value: "not_attempted", label: "Identidade não confirmada" },
  { value: "expired", label: "Confirmação expirada" },
  { value: "reused", label: "Confirmação já utilizada" },
];

const emptyFilters: AuditEventFilters = {
  from: "",
  to: "",
  userId: "",
  stationId: "",
  moduleKey: "",
  action: "",
  outcome: "",
  reauthOutcome: "",
  search: "",
  page: 1,
  limit: PAGE_SIZE,
};

/**
 * Tela de historico de acoes.
 *
 * Mostra quem estava autenticado, em qual empresa, estacao, modulo e
 * horario, qual operacao foi tentada e se ela foi autorizada, rejeitada ou
 * concluida. Apenas administradores da empresa (permissao audit:view) e o
 * administrador global tem acesso.
 */
export default function AuditLogPage() {
  const [filters, setFilters] = useState<AuditEventFilters>({ ...emptyFilters });
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await listAuditEvents({ ...filters, page, limit: PAGE_SIZE });

    if (response.ok && response.data) {
      setEvents(response.data.data);
      setTotal(response.data.total);
    } else {
      setEvents([]);
      setTotal(0);
      setError(response.error || "Não foi possível carregar o histórico.");
    }

    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  const options = useMemo(() => deriveFilterOptions(events), [events]);

  const updateFilter = (key: keyof AuditEventFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <Dashboard>
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                <ClipboardList className="h-4 w-4" />
                Rastreabilidade
              </div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Histórico de ações
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-500">
                Mostra as operações executadas na sua empresa: quem estava na
                sessão, em qual estação de trabalho, o que tentou fazer e se a
                identidade foi confirmada antes da alteração.
              </p>
            </div>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Atualizar
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Filter className="h-4 w-4" />
              Filtros
            </div>

            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
              <label className="text-xs font-medium text-slate-600">
                De
                <input
                  type="date"
                  value={filters.from || ""}
                  onChange={(event) => updateFilter("from", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                />
              </label>

              <label className="text-xs font-medium text-slate-600">
                Até
                <input
                  type="date"
                  value={filters.to || ""}
                  onChange={(event) => updateFilter("to", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                />
              </label>

              <label className="text-xs font-medium text-slate-600">
                Usuário
                <select
                  value={filters.userId || ""}
                  onChange={(event) => updateFilter("userId", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                >
                  <option value="">Todos</option>
                  {options.users.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-medium text-slate-600">
                Estação de trabalho
                <select
                  value={filters.stationId || ""}
                  onChange={(event) =>
                    updateFilter("stationId", event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                >
                  <option value="">Todas</option>
                  {options.stations.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-medium text-slate-600">
                Módulo
                <select
                  value={filters.moduleKey || ""}
                  onChange={(event) =>
                    updateFilter("moduleKey", event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                >
                  <option value="">Todos</option>
                  {options.modules.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-medium text-slate-600">
                Operação
                <select
                  value={filters.action || ""}
                  onChange={(event) => updateFilter("action", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                >
                  <option value="">Todas</option>
                  {options.actions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-medium text-slate-600">
                Resultado
                <select
                  value={filters.outcome || ""}
                  onChange={(event) => updateFilter("outcome", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                >
                  {OUTCOME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-medium text-slate-600">
                Confirmação de identidade
                <select
                  value={filters.reauthOutcome || ""}
                  onChange={(event) =>
                    updateFilter("reauthOutcome", event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                >
                  {REAUTH_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-medium text-slate-600 md:col-span-2">
                Pesquisar por registro
                <div className="mt-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={filters.search || ""}
                      onChange={(event) => updateFilter("search", event.target.value)}
                      placeholder="Ex.: 123 (pedido de venda nº 123)"
                      className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-2 text-sm"
                    />
                  </div>
                  {filters.search ? (
                    <button
                      type="button"
                      onClick={() => updateFilter("search", "")}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                      title="Limpar busca"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </label>
            </div>
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando o histórico...
              </div>
            ) : events.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500">
                Nenhum evento encontrado com os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Data e hora</th>
                      <th className="px-4 py-3">Usuário</th>
                      <th className="px-4 py-3">Estação</th>
                      <th className="px-4 py-3">Módulo</th>
                      <th className="px-4 py-3">Operação</th>
                      <th className="px-4 py-3">Registro</th>
                      <th className="px-4 py-3">Resultado</th>
                      <th className="px-4 py-3">Identidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {events.map((event) => (
                      <tr
                        key={event.id}
                        onClick={() => setSelected(event)}
                        className="cursor-pointer hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {formatDateTime(event.created_at)}
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          {event.username || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {event.station_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {getModuleLabel(event.module_key)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {getActionLabel(event.action)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {getEntityLabel(event.entity_type)}
                          {event.entity_id ? ` nº ${event.entity_id}` : ""}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                              event.outcome === "success"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : event.outcome === "denied"
                                  ? "border-rose-200 bg-rose-50 text-rose-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                          >
                            {getOutcomeLabel(event.outcome)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {getReauthLabel(event.reauth_outcome)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
              <span>
                {total === 0
                  ? "Nenhum registro"
                  : `${total} registro(s) · página ${page} de ${totalPages}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 disabled:opacity-40"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Detalhes do evento
              </h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
              {describeAuditEvent(selected)}
            </p>

            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Data e hora</dt>
                <dd className="text-slate-800">
                  {formatDateTime(selected.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Módulo</dt>
                <dd className="text-slate-800">
                  {getModuleLabel(selected.module_key)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Usuário da sessão</dt>
                <dd className="text-slate-800">{selected.username || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Estação</dt>
                <dd className="text-slate-800">
                  {selected.station_name || "Não identificada"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Resultado</dt>
                <dd className="text-slate-800">
                  {getOutcomeLabel(selected.outcome)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Confirmação de identidade</dt>
                <dd className="text-slate-800">
                  {getReauthLabel(selected.reauth_outcome)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </Dashboard>
  );
}
