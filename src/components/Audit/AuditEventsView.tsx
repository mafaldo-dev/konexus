import { useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import {
  describeAuditEvent,
  formatDateTime,
  getActionLabel,
  getEntityLabel,
  getModuleLabel,
  getOutcomeLabel,
  getReauthLabel,
  AuditFilterOption,
} from "../../pages/configurations/audit/format";

export interface AuditViewEvent {
  id: number;
  company_id: number | null;
  legal_entity_id?: number | null;
  legal_entity_name?: string | null;
  legal_entity_cnpj?: string | null;
  username: string | null;
  station_name: string | null;
  module_key: string | null;
  entity_type: string | null;
  entity_id: string | null;
  action: string;
  outcome: string;
  reauth_outcome: string | null;
  reason: string | null;
  correlation_id: string | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditViewFilters {
  from?: string;
  to?: string;
  userId?: string;
  stationId?: string;
  moduleKey?: string;
  action?: string;
  outcome?: string;
  reauthOutcome?: string;
  search?: string;
}

export interface AuditViewOptions {
  modules: AuditFilterOption[];
  actions: AuditFilterOption[];
  stations: AuditFilterOption[];
  users: AuditFilterOption[];
}

interface Props {
  events: AuditViewEvent[];
  total: number;
  page: number;
  pageSize?: number;
  loading: boolean;
  error: string | null;
  filters: AuditViewFilters;
  options: AuditViewOptions;
  onFiltersChange: (filters: AuditViewFilters) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  /** Exibicao opcional do nome da empresa (visao do administrador global). */
  companyNames?: Record<number, string>;
}

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

/**
 * Visao reutilizavel do historico de acoes: filtros, tabela, paginacao e o
 * detalhe do evento em linguagem de negocio.
 *
 * Usada pela tela da empresa (Configuracoes > Historico de acoes) e pela aba
 * de auditoria do painel administrativo global.
 */
export default function AuditEventsView({
  events,
  total,
  page,
  pageSize = 25,
  loading,
  error,
  filters,
  options,
  onFiltersChange,
  onPageChange,
  onRefresh,
  companyNames,
}: Props) {
  const [selected, setSelected] = useState<AuditViewEvent | null>(null);

  const totalPages = useMemo(
    () => Math.max(Math.ceil(total / pageSize), 1),
    [total, pageSize]
  );

  const updateFilter = (key: keyof AuditViewFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
    onPageChange(1);
  };

  return (
    <div className="space-y-4">
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
              onChange={(event) => updateFilter("stationId", event.target.value)}
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
              onChange={(event) => updateFilter("moduleKey", event.target.value)}
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
                  {companyNames ? <th className="px-4 py-3">Empresa</th> : null}
                  <th className="px-4 py-3">CNPJ emitente</th>
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
                    {companyNames ? (
                      <td className="px-4 py-3 text-slate-600">
                        {event.company_id
                          ? companyNames[event.company_id] || `#${event.company_id}`
                          : "Administrador global"}
                      </td>
                    ) : null}
                    <td className="px-4 py-3 text-slate-600">
                      {event.legal_entity_name ? (
                        <span>
                          <span className="block text-slate-800">{event.legal_entity_name}</span>
                          {event.legal_entity_cnpj ? <span className="block text-[11px] text-slate-500">{event.legal_entity_cnpj}</span> : null}
                        </span>
                      ) : (
                        <span className="text-slate-400">Não aplicável</span>
                      )}
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
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 disabled:opacity-40"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar
            </button>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 disabled:opacity-40"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </button>
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
              <div>
                <dt className="text-xs text-slate-500">CNPJ emitente</dt>
                <dd className="text-slate-800">
                  {selected.legal_entity_name
                    ? `${selected.legal_entity_name}${selected.legal_entity_cnpj ? ` · ${selected.legal_entity_cnpj}` : ""}`
                    : "Não aplicável"}
                </dd>
              </div>
              {companyNames ? (
                <div>
                  <dt className="text-xs text-slate-500">Empresa</dt>
                  <dd className="text-slate-800">
                    {selected.company_id
                      ? companyNames[selected.company_id] || `#${selected.company_id}`
                      : "Administrador global"}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
}
