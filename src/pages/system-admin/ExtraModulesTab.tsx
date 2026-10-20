import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  FileClock,
  Pencil,
  RefreshCw,
  SearchX,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import {
  ExtraModuleKey,
  ExtraModuleStatus,
  SystemAdminExtraModule,
  SystemAdminModuleEvent,
  systemAdminService,
} from "../../services/systemAdminService";
import {
  Alert,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Spinner,
  StatusBadge,
  Textarea,
  Select,
} from "./components";
import { formatDateOnly, formatDateTime, toDateInputValue } from "./utils";

const moduleLabels: Record<ExtraModuleKey, string> = {
  finance: "Financeiro",
  nfe: "NF-e",
};

const statusLabels: Record<ExtraModuleStatus, string> = {
  pending: "Pendente",
  active: "Ativo",
  suspended: "Suspenso",
  cancelled: "Cancelado",
};

function statusTone(status: ExtraModuleStatus | null): string {
  if (status === "active") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "pending") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (status === "suspended") return "bg-orange-50 text-orange-700 ring-orange-200";
  if (status === "cancelled") return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

interface Props {
  refreshKey: number;
  initialCompanyId: number | null;
  onPresetConsumed: () => void;
  onDataChanged: () => void;
}

export default function ExtraModulesTab({
  refreshKey,
  initialCompanyId,
  onPresetConsumed,
  onDataChanged,
}: Props) {
  const [rows, setRows] = useState<SystemAdminExtraModule[]>([]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<"" | ExtraModuleKey>("");
  const [statusFilter, setStatusFilter] = useState<"" | ExtraModuleStatus>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<SystemAdminExtraModule | null>(null);
  const [eventsRow, setEventsRow] = useState<SystemAdminExtraModule | null>(null);
  const [events, setEvents] = useState<SystemAdminModuleEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      setRows(await systemAdminService.listExtraModules());
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar os módulos extras.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useEffect(() => {
    if (!initialCompanyId) return;
    const company = rows.find((row) => row.company_id === initialCompanyId);
    if (company) {
      setSearch(company.company_name);
      onPresetConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCompanyId, rows.length]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesTerm =
        !term ||
        `${row.company_name} ${moduleLabels[row.module_key]} ${row.notes || ""}`
          .toLowerCase()
          .includes(term);
      const matchesModule = !moduleFilter || row.module_key === moduleFilter;
      const matchesStatus = !statusFilter || row.status === statusFilter;
      return matchesTerm && matchesModule && matchesStatus;
    });
  }, [rows, search, moduleFilter, statusFilter]);

  const activeFinance = rows.filter(
    (row) => row.module_key === "finance" && row.status === "active"
  ).length;
  const activeNfe = rows.filter(
    (row) => row.module_key === "nfe" && row.status === "active"
  ).length;
  const activeTotal = activeFinance + activeNfe;

  const openEvents = async (row: SystemAdminExtraModule) => {
    setEventsRow(row);
    setEvents([]);
    setEventsLoading(true);
    try {
      setEvents(
        await systemAdminService.listModuleEvents(row.company_id, row.module_key)
      );
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar o histórico.");
    } finally {
      setEventsLoading(false);
    }
  };

  const handleSaved = async () => {
    await load(false);
    onDataChanged();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Módulos extras"
        description="Ative, suspenda ou cancele Financeiro e NF-e por empresa. Apenas o operador global registra estas alterações."
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
            <WalletCards className="h-4 w-4 text-blue-600" />
            Financeiro ativo
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{activeFinance}</p>
          <p className="text-xs text-slate-500">empresa(s) com contratação ativa</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            NF-e ativa
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{activeNfe}</p>
          <p className="text-xs text-slate-500">empresa(s) com contratação ativa</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <FileClock className="h-4 w-4 text-emerald-600" />
            Contratações ativas
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{activeTotal}</p>
          <p className="text-xs text-slate-500">Financeiro + NF-e</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar empresa, módulo ou observação..."
            className="min-w-[240px] flex-1"
          />
          <Select
            value={moduleFilter}
            onChange={(event) =>
              setModuleFilter(event.target.value as "" | ExtraModuleKey)
            }
            className="w-auto"
          >
            <option value="">Todos os módulos</option>
            <option value="finance">Financeiro</option>
            <option value="nfe">NF-e</option>
          </Select>
          <Select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "" | ExtraModuleStatus)
            }
            className="w-auto"
          >
            <option value="">Todos os estados</option>
            <option value="active">Ativo</option>
            <option value="pending">Pendente</option>
            <option value="suspended">Suspenso</option>
            <option value="cancelled">Cancelado</option>
          </Select>
        </div>

        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Nenhum módulo encontrado"
            description="Ajuste os filtros ou verifique se há empresas cadastradas."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Empresa</th>
                  <th className="px-4 py-3 font-semibold">Módulo</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Início</th>
                  <th className="px-4 py-3 font-semibold">Fim</th>
                  <th className="px-4 py-3 font-semibold">Observação</th>
                  <th className="px-4 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => (
                  <tr key={`${row.company_id}:${row.module_key}`} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {row.company_name}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {moduleLabels[row.module_key]}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={row.status ? statusLabels[row.status] : "Não contratado"}
                        className={statusTone(row.status)}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDateOnly(row.started_at)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDateOnly(row.ended_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {row.notes || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEvents(row)}
                          title="Histórico de alterações"
                        >
                          <FileClock className="h-3.5 w-3.5" />
                          Histórico
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditing(row)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Gerenciar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExtraModuleFormModal
        open={Boolean(editing)}
        row={editing}
        onClose={() => setEditing(null)}
        onSaved={handleSaved}
      />

      <Modal
        open={Boolean(eventsRow)}
        onClose={() => setEventsRow(null)}
        title={`Histórico · ${eventsRow?.company_name || ""}`}
        description={
          eventsRow
            ? `${moduleLabels[eventsRow.module_key]} · alterações registradas pelo operador global`
            : undefined
        }
        size="lg"
      >
        {eventsLoading ? (
          <Spinner label="Carregando histórico..." />
        ) : events.length === 0 ? (
          <EmptyState
            icon={FileClock}
            title="Sem histórico"
            description="Este módulo ainda não teve alterações registradas."
          />
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {event.previous_status
                      ? `${statusLabels[event.previous_status]} → `
                      : "Sem estado anterior → "}
                    {statusLabels[event.new_status]}
                  </p>
                  <span className="text-xs text-slate-500">
                    {formatDateTime(event.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  por {event.changed_by_username || "sistema"}
                  {event.notes ? ` · ${event.notes}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

function ExtraModuleFormModal({
  open,
  row,
  onClose,
  onSaved,
}: {
  open: boolean;
  row: SystemAdminExtraModule | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [status, setStatus] = useState<ExtraModuleStatus>("active");
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !row) return;
    setStatus(row.status || "active");
    setStartedAt(toDateInputValue(row.started_at));
    setEndedAt(toDateInputValue(row.ended_at));
    setNotes(row.notes || "");
    setError(null);
  }, [open, row]);

  if (!row) {
    return (
      <Modal open={open} onClose={onClose} title="Módulo extra">
        <Spinner />
      </Modal>
    );
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (startedAt && endedAt && endedAt < startedAt) {
      setError("A data final não pode ser anterior à data inicial.");
      return;
    }
    setSaving(true);
    try {
      await systemAdminService.updateExtraModule(row.company_id, row.module_key, {
        status,
        started_at: startedAt || null,
        ended_at: endedAt || null,
        notes: notes.trim() || null,
      });
      await onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Não foi possível atualizar o módulo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${moduleLabels[row.module_key]} · ${row.company_name}`}
      description="A alteração é registrada no histórico global e passa a valer imediatamente para a empresa."
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="extra-module-form" loading={saving}>
            <ShieldCheck className="h-4 w-4" />
            Salvar estado
          </Button>
        </>
      }
    >
      <form id="extra-module-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <Alert>{error}</Alert> : null}
        <Field label="Estado da contratação" required>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as ExtraModuleStatus)}
          >
            <option value="pending">Pendente</option>
            <option value="active">Ativo</option>
            <option value="suspended">Suspenso</option>
            <option value="cancelled">Cancelado</option>
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Início">
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="date"
                value={startedAt}
                onChange={(event) => setStartedAt(event.target.value)}
                className="pl-10"
              />
            </div>
          </Field>
          <Field label="Encerramento">
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="date"
                value={endedAt}
                onChange={(event) => setEndedAt(event.target.value)}
                className="pl-10"
              />
            </div>
          </Field>
        </div>
        <Field label="Observação">
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Contrato, autorização ou referência comercial..."
          />
        </Field>
        {status === "active" && !startedAt ? (
          <Alert variant="info">
            Ao salvar como ativo sem data de início, o sistema usará a data
            oficial de hoje no fuso America/Sao_Paulo.
          </Alert>
        ) : null}
      </form>
    </Modal>
  );
}
