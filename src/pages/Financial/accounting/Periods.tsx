import { FormEvent, useCallback, useEffect, useState } from "react";
import { Lock, LockOpen, Plus, Unlock } from "lucide-react";

import {
  closeAccountingPeriod,
  createAccountingPeriod,
  listAccountingPeriods,
  lockAccountingPeriod,
  reopenAccountingPeriod,
  runDepreciation,
  AccountingPeriod,
} from "../../../services/accountingService";
import {
  ActionButton,
  AccountingPage,
  Card,
  DataTable,
  ErrorState,
  Field,
  LoadingState,
  Modal,
  StatusBadge,
  formatDate,
  inputClass,
} from "./components";

const STATUS_LABELS: Record<string, { text: string; className: string }> = {
  open: { text: "Aberto", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  closed: { text: "Encerrado", className: "border-slate-200 bg-slate-50 text-slate-600" },
  locked: { text: "Bloqueado", className: "border-rose-200 bg-rose-50 text-rose-700" },
};

/**
 * Exercícios e períodos contábeis.
 *
 * Períodos encerrados ou bloqueados não aceitam lançamentos. A reabertura
 * exige motivo e é registrada na auditoria.
 */
export default function AccountingPeriodsPage() {
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fiscalYear: new Date().getFullYear(),
    fiscalMonth: 1,
    name: "",
    startsAt: "",
    endsAt: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await listAccountingPeriods({
      status: statusFilter || undefined,
    });
    if (response.ok) {
      setPeriods(response.data || []);
    } else {
      setPeriods([]);
      setError(response.error || "Não foi possível carregar os períodos.");
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await createAccountingPeriod({
      fiscalYear: Number(form.fiscalYear),
      fiscalMonth: Number(form.fiscalMonth),
      name: form.name || `${form.fiscalMonth}/${form.fiscalYear}`,
      startsAt: form.startsAt,
      endsAt: form.endsAt,
    });

    if (response.ok) {
      setModalOpen(false);
      await load();
    } else {
      setError(response.error || "Não foi possível criar o período.");
    }
    setSaving(false);
  };

  const handleAction = async (
    period: AccountingPeriod,
    action: "close" | "reopen" | "lock"
  ) => {
    setError(null);
    let response;
    if (action === "close") {
      response = await closeAccountingPeriod(period.id);
    } else if (action === "lock") {
      response = await lockAccountingPeriod(period.id);
    } else {
      const reason = window.prompt(
        "Motivo da reabertura do período (obrigatório):"
      );
      if (!reason) return;
      response = await reopenAccountingPeriod(period.id, reason);
    }

    if (response.ok) {
      await load();
    } else {
      setError(response.error || "Não foi possível alterar o período.");
    }
  };

  const handleDepreciation = async (period: AccountingPeriod) => {
    setError(null);
    const response = await runDepreciation(period.id);
    if (response.ok && response.data) {
      const summary = response.data;
      setError(
        summary.processed === 0
          ? `Nenhum ativo novo para depreciar em ${period.name} (${summary.skipped} já processado(s)).`
          : null
      );
      await load();
    } else {
      setError(response.error || "Não foi possível executar a depreciação.");
    }
  };

  return (
    <AccountingPage
      title="Exercícios e períodos"
      description="Controle de abertura, encerramento e bloqueio de períodos contábeis. Períodos encerrados não aceitam lançamentos."
      actions={
        <ActionButton
          variant="primary"
          onClick={() => {
            setForm({
              fiscalYear: new Date().getFullYear(),
              fiscalMonth: 1,
              name: "",
              startsAt: "",
              endsAt: "",
            });
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo período
        </ActionButton>
      }
    >
      <ErrorState message={error} />

      <Card>
        <div className="mb-3 flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={inputClass}
          >
            <option value="">Todos</option>
            <option value="open">Abertos</option>
            <option value="closed">Encerrados</option>
            <option value="locked">Bloqueados</option>
          </select>
        </div>

        {loading ? (
          <LoadingState label="Carregando os períodos..." />
        ) : (
          <DataTable
            rows={periods}
            rowKey={(row) => row.id}
            emptyMessage="Nenhum período cadastrado."
            columns={[
              { key: "name", header: "Período", render: (row) => row.name },
              {
                key: "range",
                header: "Período",
                render: (row) => `${formatDate(row.starts_at)} a ${formatDate(row.ends_at)}`,
              },
              {
                key: "entries",
                header: "Lançamentos",
                render: (row) => String(row.posted_entries ?? 0),
              },
              {
                key: "status",
                header: "Situação",
                render: (row) => (
                  <StatusBadge status={row.status} labels={STATUS_LABELS} />
                ),
              },
              {
                key: "actions",
                header: "Ações",
                render: (row) => (
                  <div className="flex flex-wrap justify-end gap-1">
                    {row.status === "open" ? (
                      <>
                        <ActionButton onClick={() => handleAction(row, "close")}>
                          Encerrar
                        </ActionButton>
                        <ActionButton onClick={() => handleAction(row, "lock")}>
                          <Lock className="h-3.5 w-3.5" />
                          Bloquear
                        </ActionButton>
                      </>
                    ) : null}
                    {row.status === "closed" ? (
                      <>
                        <ActionButton onClick={() => handleAction(row, "reopen")}>
                          <Unlock className="h-3.5 w-3.5" />
                          Reabrir
                        </ActionButton>
                        <ActionButton onClick={() => handleAction(row, "lock")}>
                          <Lock className="h-3.5 w-3.5" />
                          Bloquear
                        </ActionButton>
                      </>
                    ) : null}
                    {row.status === "locked" ? (
                      <ActionButton onClick={() => handleAction(row, "reopen")}>
                        <LockOpen className="h-3.5 w-3.5" />
                        Reabrir
                      </ActionButton>
                    ) : null}
                    <ActionButton onClick={() => handleDepreciation(row)}>
                      Depreciar
                    </ActionButton>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title="Novo período contábil"
        onClose={() => setModalOpen(false)}
        footer={
          <ActionButton variant="primary" onClick={handleCreate} disabled={saving}>
            {saving ? "Criando..." : "Criar período"}
          </ActionButton>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Exercício">
              <input
                type="number"
                value={form.fiscalYear}
                onChange={(event) =>
                  setForm({ ...form, fiscalYear: Number(event.target.value) })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Mês">
              <select
                value={form.fiscalMonth}
                onChange={(event) =>
                  setForm({ ...form, fiscalMonth: Number(event.target.value) })
                }
                className={inputClass}
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map(
                  (month) => (
                    <option key={month} value={month}>
                      {String(month).padStart(2, "0")}
                    </option>
                  )
                )}
              </select>
            </Field>
            <Field label="Início">
              <input
                type="date"
                value={form.startsAt}
                onChange={(event) =>
                  setForm({ ...form, startsAt: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Fim">
              <input
                type="date"
                value={form.endsAt}
                onChange={(event) =>
                  setForm({ ...form, endsAt: event.target.value })
                }
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Nome" hint="Opcional: usa mês/ano.">
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className={inputClass}
            />
          </Field>
        </form>
      </Modal>
    </AccountingPage>
  );
}
