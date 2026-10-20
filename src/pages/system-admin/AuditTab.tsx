import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";

import AuditEventsView, {
  AuditViewEvent,
  AuditViewFilters,
} from "../../components/Audit/AuditEventsView";
import { deriveFilterOptions } from "../configurations/audit/format";
import {
  SystemAdminCompany,
  systemAdminService,
} from "../../services/systemAdminService";
import { Alert, SearchInput } from "./components";

const PAGE_SIZE = 25;

const emptyFilters: AuditViewFilters = {
  from: "",
  to: "",
  userId: "",
  stationId: "",
  moduleKey: "",
  action: "",
  outcome: "",
  reauthOutcome: "",
  search: "",
};

interface Props {
  refreshKey: number;
  initialCompanyId: number | null;
  onPresetConsumed: () => void;
}

/**
 * Aba de auditoria do painel administrativo global.
 *
 * Cada empresa tem o seu proprio historico: basta escolher a empresa para
 * ver apenas os eventos dela. A visao "Todas as empresas" permite o
 * acompanhamento transversal (inclusive os eventos do administrador global).
 */
export default function AuditTab({
  refreshKey,
  initialCompanyId,
  onPresetConsumed,
}: Props) {
  const [companies, setCompanies] = useState<SystemAdminCompany[]>([]);
  const [companyId, setCompanyId] = useState<string>("");
  const [companySearch, setCompanySearch] = useState("");
  const [events, setEvents] = useState<AuditViewEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AuditViewFilters>({ ...emptyFilters });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    systemAdminService
      .listCompanies()
      .then((rows) => setCompanies(rows))
      .catch(() => setCompanies([]));
  }, [refreshKey]);

  useEffect(() => {
    if (!initialCompanyId) return;
    setCompanyId(String(initialCompanyId));
    setPage(1);
    onPresetConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCompanyId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await systemAdminService.listAuditEvents({
        ...filters,
        companyId: companyId || undefined,
        page,
        limit: PAGE_SIZE,
      });

      setEvents((result.data || []) as AuditViewEvent[]);
      setTotal(result.total || 0);
    } catch (err: any) {
      setEvents([]);
      setTotal(0);
      setError(err.message || "Não foi possível carregar o histórico.");
    } finally {
      setLoading(false);
    }
  }, [companyId, filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  const companyNames = useMemo(() => {
    const map: Record<number, string> = {};
    for (const company of companies) map[company.id] = company.name;
    return map;
  }, [companies]);

  const options = useMemo(
    () => deriveFilterOptions(events as never),
    [events]
  );

  const filteredCompanies = useMemo(() => {
    const term = companySearch.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter((company) =>
      company.name.toLowerCase().includes(term)
    );
  }, [companies, companySearch]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <ClipboardList className="h-4 w-4" />
              Rastreabilidade
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Histórico de ações por empresa
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Cada empresa mantém o seu próprio histórico. Selecione a empresa
              para ver apenas os eventos dela.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-medium text-slate-600">
            Empresa
            <select
              value={companyId}
              onChange={(event) => {
                setCompanyId(event.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">Todas as empresas</option>
              {filteredCompanies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-slate-600">
            Buscar empresa
            <div className="mt-1">
              <SearchInput
                value={companySearch}
                onChange={setCompanySearch}
                placeholder="Filtrar pelo nome da empresa"
              />
            </div>
          </label>
        </div>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <AuditEventsView
        events={events}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        loading={loading}
        error={null}
        filters={filters}
        options={options}
        onFiltersChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        onPageChange={setPage}
        onRefresh={load}
        companyNames={companyNames}
      />
    </div>
  );
}
