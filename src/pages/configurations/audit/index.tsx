import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";

import Dashboard from "../../../components/dashboard/Dashboard";
import AuditEventsView, {
  AuditViewFilters,
} from "../../../components/Audit/AuditEventsView";
import {
  AuditEvent,
  AuditEventFilters,
  listAuditEvents,
} from "../../../services/auditService";
import { deriveFilterOptions } from "./format";

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

/**
 * Tela de historico de acoes da empresa.
 *
 * Mostra quem estava autenticado, em qual empresa, estacao, modulo e
 * horario, qual operacao foi tentada e se ela foi autorizada, rejeitada ou
 * concluida. Apenas administradores da empresa (permissao audit:view) e o
 * administrador global tem acesso.
 */
export default function AuditLogPage() {
  const [filters, setFilters] = useState<AuditViewFilters>({ ...emptyFilters });
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await listAuditEvents({
      ...filters,
      page,
      limit: PAGE_SIZE,
    } as AuditEventFilters);

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

  return (
    <Dashboard>
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-5">
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

          <AuditEventsView
            events={events}
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            loading={loading}
            error={error}
            filters={filters}
            options={options}
            onFiltersChange={setFilters}
            onPageChange={setPage}
            onRefresh={load}
          />
        </div>
      </div>
    </Dashboard>
  );
}
