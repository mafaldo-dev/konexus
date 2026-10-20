import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import {
  createAccountingEntry,
  deleteAccountingEntry,
  getAccountingEntry,
  listAccountingAccounts,
  listAccountingEntries,
  listAccountingPeriods,
  listCostCenters,
  postAccountingEntry,
  reverseAccountingEntry,
  AccountingAccount,
  AccountingCostCenter,
  AccountingEntry,
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
  formatMoney,
  inputClass,
} from "./components";

const STATUS_LABELS: Record<string, { text: string; className: string }> = {
  draft: { text: "Rascunho", className: "border-slate-200 bg-slate-50 text-slate-600" },
  pending: { text: "Pendente", className: "border-amber-200 bg-amber-50 text-amber-700" },
  posted: { text: "Contabilizado", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  reversed: { text: "Estornado", className: "border-rose-200 bg-rose-50 text-rose-700" },
};

type ItemDraft = {
  accountId: string;
  costCenterId: string;
  side: "debit" | "credit";
  amount: string;
  description: string;
};

const EMPTY_ITEM: ItemDraft = {
  accountId: "",
  costCenterId: "",
  side: "debit",
  amount: "",
  description: "",
};

export default function AccountingEntriesPage() {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [costCenters, setCostCenters] = useState<AccountingCostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detail, setDetail] = useState<AccountingEntry | null>(null);
  const [saving, setSaving] = useState(false);

  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [periodId, setPeriodId] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([{ ...EMPTY_ITEM }, { ...EMPTY_ITEM, side: "credit" }]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await listAccountingEntries({
      status: statusFilter || undefined,
      search: search || undefined,
      limit: 100,
    });
    if (response.ok) {
      setEntries(response.data || []);
    } else {
      setEntries([]);
      setError(response.error || "Não foi possível carregar os lançamentos.");
    }
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    listAccountingAccounts({ active: true }).then((response) => {
      setAccounts((response.data || []).filter((account) => account.allows_entries));
    });
    listAccountingPeriods().then((response) => setPeriods(response.data || []));
    listCostCenters().then((response) => setCostCenters(response.data || []));
  }, []);

  const totals = useMemo(() => {
    const debit = items.reduce(
      (acc, item) => acc + (item.side === "debit" ? Number(item.amount || 0) : 0),
      0
    );
    const credit = items.reduce(
      (acc, item) => acc + (item.side === "credit" ? Number(item.amount || 0) : 0),
      0
    );
    return { debit, credit, difference: Number((debit - credit).toFixed(2)) };
  }, [items]);

  const openCreate = () => {
    setDescription("");
    setNotes("");
    setEntryDate(new Date().toISOString().slice(0, 10));
    setPeriodId("");
    setItems([{ ...EMPTY_ITEM }, { ...EMPTY_ITEM, side: "credit" }]);
    setModalOpen(true);
  };

  const updateItem = (index: number, patch: Partial<ItemDraft>) => {
    setItems((current) =>
      current.map((item, position) =>
        position === index ? { ...item, ...patch } : item
      )
    );
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      entryDate,
      periodId: periodId ? Number(periodId) : undefined,
      description: description || "Lançamento contábil",
      notes: notes || undefined,
      items: items
        .filter((item) => item.accountId && Number(item.amount) > 0)
        .map((item) => ({
          accountId: Number(item.accountId),
          costCenterId: item.costCenterId ? Number(item.costCenterId) : null,
          side: item.side,
          amount: Number(item.amount),
          description: item.description || undefined,
        })),
    };

    const response = await createAccountingEntry(payload);
    if (response.ok) {
      setModalOpen(false);
      await load();
    } else {
      setError(response.error || "Não foi possível criar o lançamento.");
    }
    setSaving(false);
  };

  const openDetail = async (entry: AccountingEntry) => {
    const response = await getAccountingEntry(entry.id);
    if (response.ok && response.data) {
      setDetail(response.data);
    } else {
      setError(response.error || "Não foi possível carregar o lançamento.");
    }
  };

  const handlePost = async (entry: AccountingEntry) => {
    setError(null);
    const response = await postAccountingEntry(entry.id);
    if (response.ok) {
      await load();
      if (detail?.id === entry.id) await openDetail(entry);
    } else {
      setError(response.error || "Não foi possível contabilizar o lançamento.");
    }
  };

  const handleReverse = async (entry: AccountingEntry) => {
    setError(null);
    const response = await reverseAccountingEntry(entry.id, {
      description: `Estorno do lançamento ${entry.number}`,
    });
    if (response.ok) {
      await load();
      setDetail(null);
    } else {
      setError(response.error || "Não foi possível estornar o lançamento.");
    }
  };

  const handleDelete = async (entry: AccountingEntry) => {
    setError(null);
    const response = await deleteAccountingEntry(entry.id);
    if (response.ok) {
      await load();
    } else {
      setError(response.error || "Não foi possível excluir o lançamento.");
    }
  };

  return (
    <AccountingPage
      title="Lançamentos contábeis"
      description="Escrituração por partidas dobradas: a soma dos débitos deve ser igual à soma dos créditos. Lançamentos contabilizados não são alterados: a correção é feita por estorno."
      actions={
        <ActionButton variant="primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo lançamento
        </ActionButton>
      }
    >
      <ErrorState message={error} />

      <Card>
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por número, histórico ou origem"
            className="flex-1 min-w-[220px] rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Todas as situações</option>
            <option value="draft">Rascunho</option>
            <option value="pending">Pendente</option>
            <option value="posted">Contabilizado</option>
            <option value="reversed">Estornado</option>
          </select>
        </div>

        {loading ? (
          <LoadingState label="Carregando os lançamentos..." />
        ) : (
          <DataTable
            rows={entries}
            rowKey={(row) => row.id}
            emptyMessage="Nenhum lançamento encontrado."
            onRowClick={openDetail}
            columns={[
              { key: "number", header: "Número", render: (row) => row.number },
              {
                key: "date",
                header: "Data",
                render: (row) => formatDate(row.entry_date),
              },
              { key: "description", header: "Histórico", render: (row) => row.description },
              { key: "period", header: "Período", render: (row) => row.period_name },
              {
                key: "debit",
                header: "Débitos",
                render: (row) => formatMoney(row.total_debit),
              },
              {
                key: "credit",
                header: "Créditos",
                render: (row) => formatMoney(row.total_credit),
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
                  <div className="flex justify-end gap-1">
                    {row.status === "draft" || row.status === "pending" ? (
                      <>
                        <ActionButton variant="primary" onClick={() => handlePost(row)}>
                          Contabilizar
                        </ActionButton>
                        <ActionButton variant="danger" onClick={() => handleDelete(row)}>
                          Excluir
                        </ActionButton>
                      </>
                    ) : null}
                    {row.status === "posted" ? (
                      <ActionButton variant="danger" onClick={() => handleReverse(row)}>
                        Estornar
                      </ActionButton>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title="Novo lançamento contábil"
        onClose={() => setModalOpen(false)}
        wide
        footer={
          <ActionButton variant="primary" onClick={handleCreate} disabled={saving}>
            {saving ? "Salvando..." : "Salvar rascunho"}
          </ActionButton>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Data contábil">
              <input
                type="date"
                value={entryDate}
                onChange={(event) => setEntryDate(event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Período" hint="Opcional: usa o período da data.">
              <select
                value={periodId}
                onChange={(event) => setPeriodId(event.target.value)}
                className={inputClass}
              >
                <option value="">Automático pela data</option>
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name} ({period.status})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Histórico">
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={inputClass}
                placeholder="Descrição do lançamento"
              />
            </Field>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Itens do lançamento
            </p>
            {items.map((item, index) => (
              <div
                key={index}
                className="grid gap-2 rounded-xl border border-slate-200 p-2 sm:grid-cols-12"
              >
                <div className="sm:col-span-4">
                  <Field label="Conta">
                    <select
                      value={item.accountId}
                      onChange={(event) =>
                        updateItem(index, { accountId: event.target.value })
                      }
                      className={inputClass}
                    >
                      <option value="">Selecione</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Tipo">
                    <select
                      value={item.side}
                      onChange={(event) =>
                        updateItem(index, {
                          side: event.target.value as "debit" | "credit",
                        })
                      }
                      className={inputClass}
                    >
                      <option value="debit">Débito</option>
                      <option value="credit">Crédito</option>
                    </select>
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Valor">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.amount}
                      onChange={(event) =>
                        updateItem(index, { amount: event.target.value })
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-3">
                  <Field label="Centro de custo">
                    <select
                      value={item.costCenterId}
                      onChange={(event) =>
                        updateItem(index, { costCenterId: event.target.value })
                      }
                      className={inputClass}
                    >
                      <option value="">—</option>
                      {costCenters.map((center) => (
                        <option key={center.id} value={center.id}>
                          {center.code} - {center.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="flex items-end sm:col-span-1">
                  <ActionButton
                    variant="danger"
                    onClick={() =>
                      setItems((current) =>
                        current.filter((_, position) => position !== index)
                      )
                    }
                    title="Remover item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </ActionButton>
                </div>
              </div>
            ))}
            <ActionButton
              onClick={() => setItems((current) => [...current, { ...EMPTY_ITEM }])}
            >
              <Plus className="h-4 w-4" />
              Adicionar item
            </ActionButton>
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 p-3 text-sm">
            <span>
              Débitos: <strong>{formatMoney(totals.debit)}</strong>
            </span>
            <span>
              Créditos: <strong>{formatMoney(totals.credit)}</strong>
            </span>
            <span
              className={
                totals.difference === 0 ? "text-emerald-700" : "text-rose-700"
              }
            >
              Diferença: <strong>{formatMoney(totals.difference)}</strong>
            </span>
          </div>

          <Field label="Observações">
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={inputClass}
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(detail)}
        title={detail ? `Lançamento ${detail.number}` : ""}
        onClose={() => setDetail(null)}
        wide
      >
        {detail ? (
          <div className="space-y-3 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <p>
                <span className="text-slate-500">Data:</span>{" "}
                {formatDate(detail.entry_date)}
              </p>
              <p>
                <span className="text-slate-500">Período:</span> {detail.period_name}{" "}
                ({detail.period_status})
              </p>
              <p className="sm:col-span-2">
                <span className="text-slate-500">Histórico:</span>{" "}
                {detail.description}
              </p>
              <p>
                <span className="text-slate-500">Origem:</span> {detail.origin_type}
              </p>
              <p>
                <span className="text-slate-500">Situação:</span>{" "}
                <StatusBadge status={detail.status} labels={STATUS_LABELS} />
              </p>
            </div>

            <DataTable
              rows={detail.items || []}
              rowKey={(row) => row.id}
              emptyMessage="Sem itens."
              columns={[
                {
                  key: "account",
                  header: "Conta",
                  render: (row) => `${row.account_code} - ${row.account_name}`,
                },
                {
                  key: "cost",
                  header: "Centro de custo",
                  render: (row) => row.cost_center_code || "—",
                },
                {
                  key: "side",
                  header: "Tipo",
                  render: (row) => (row.side === "debit" ? "Débito" : "Crédito"),
                },
                {
                  key: "amount",
                  header: "Valor",
                  render: (row) => formatMoney(row.amount),
                },
              ]}
            />

            <div className="flex justify-end gap-4 rounded-xl bg-slate-50 p-3 text-sm">
              <span>
                Débitos: <strong>{formatMoney(detail.total_debit)}</strong>
              </span>
              <span>
                Créditos: <strong>{formatMoney(detail.total_credit)}</strong>
              </span>
            </div>
          </div>
        ) : null}
      </Modal>
    </AccountingPage>
  );
}
