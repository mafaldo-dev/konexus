import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Link2, Undo2 } from "lucide-react";

import {
  listAccountingEntries,
  listPendingFinancialItems,
  listReconciliations,
  processFinancialEvent,
  reconcileFinancialItem,
  unreconcileFinancialItem,
} from "../../../services/accountingService";
import {
  ActionButton,
  AccountingPage,
  Card,
  DataTable,
  ErrorState,
  LoadingState,
  StatusBadge,
  formatDate,
  formatMoney,
} from "./components";

const STATUS_LABELS: Record<string, { text: string; className: string }> = {
  pending: { text: "Pendente", className: "border-amber-200 bg-amber-50 text-amber-700" },
  reconciled: { text: "Conciliado", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  divergent: { text: "Divergente", className: "border-rose-200 bg-rose-50 text-rose-700" },
};

const EVENT_TYPES: Record<
  string,
  { recognized: string; settled?: string; received?: string }
> = {
  payable: {
    recognized: "payable_recognized",
    settled: "payable_settled",
  },
  receivable: {
    recognized: "receivable_recognized",
    received: "receivable_received",
  },
};

/**
 * Conciliação entre os itens financeiros (contas a pagar/receber) e os
 * lançamentos contábeis.
 *
 * A conciliação exige referência válida: mesmo empresa, lançamento
 * contabilizado e valor compativel. Valores iguais não bastam.
 */
export default function ReconciliationPage() {
  const [pending, setPending] = useState<any>({ payables: [], receivables: [] });
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [pendingResponse, reconciliationsResponse, entriesResponse] =
      await Promise.all([
        listPendingFinancialItems(),
        listReconciliations({ status: statusFilter || undefined }),
        listAccountingEntries({ status: "posted", limit: 100 }),
      ]);

    if (pendingResponse.ok && pendingResponse.data) {
      setPending(pendingResponse.data);
    }
    if (reconciliationsResponse.ok) {
      setReconciliations(reconciliationsResponse.data || []);
    }
    if (entriesResponse.ok) {
      setEntries(entriesResponse.data || []);
    }
    setError(
      pendingResponse.error ||
        reconciliationsResponse.error ||
        entriesResponse.error ||
        null
    );
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async (
    financialType: "payable" | "receivable",
    financialId: number,
    eventType: string
  ) => {
    setError(null);
    const response = await processFinancialEvent({
      financialType,
      financialId,
      eventType,
    });
    if (response.ok) {
      await load();
    } else {
      setError(response.error || "Não foi possível gerar o lançamento.");
    }
  };

  const handleReconcile = async (
    financialType: "payable" | "receivable",
    financialId: number,
    entryId: string
  ) => {
    setError(null);
    const response = await reconcileFinancialItem({
      financialType,
      financialId,
      entryId: entryId ? Number(entryId) : null,
    });
    if (response.ok) {
      await load();
    } else {
      setError(response.error || "Não foi possível conciliar o item.");
    }
  };

  const handleUnreconcile = async (id: number) => {
    const reason = window.prompt("Motivo para desfazer a conciliação:");
    if (!reason) return;
    setError(null);
    const response = await unreconcileFinancialItem(id, reason);
    if (response.ok) {
      await load();
    } else {
      setError(response.error || "Não foi possível desfazer a conciliação.");
    }
  };

  const pendingRows = [
    ...(pending.payables || []).map((item: any) => ({ ...item, group: "Conta a pagar" })),
    ...(pending.receivables || []).map((item: any) => ({ ...item, group: "Conta a receber" })),
  ];

  return (
    <AccountingPage
      title="Conciliação contábil"
      description="Itens financeiros sem lançamento contábil e conferência dos já conciliados. A conciliação exige referência válida (mesma empresa, lançamento contabilizado e valor compativel)."
    >
      <ErrorState message={error} />

      <Card title="Itens financeiros sem conciliação">
        {loading ? (
          <LoadingState label="Carregando os itens financeiros..." />
        ) : (
          <DataTable
            rows={pendingRows}
            rowKey={(row: any) => `${row.financialType}-${row.financialId}`}
            emptyMessage="Todos os itens financeiros já possuem lançamento contábil."
            columns={[
              { key: "group", header: "Tipo", render: (row: any) => row.group },
              { key: "title", header: "Item", render: (row: any) => row.title },
              {
                key: "amount",
                header: "Valor",
                render: (row: any) => formatMoney(row.amount),
              },
              {
                key: "due",
                header: "Vencimento",
                render: (row: any) => formatDate(row.dueDate),
              },
              {
                key: "status",
                header: "Situação",
                render: (row: any) => (
                  <span className="text-xs text-slate-600">
                    {row.settled ? "Quitado" : "Em aberto"}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Ações",
                render: (row: any) => (
                  <div className="flex flex-wrap justify-end gap-1">
                    <ActionButton
                      variant="primary"
                      onClick={() =>
                        handleGenerate(
                          row.financialType,
                          row.financialId,
                          EVENT_TYPES[row.financialType].recognized
                        )
                      }
                    >
                      Gerar reconhecimento
                    </ActionButton>
                    {row.settled ? (
                      <ActionButton
                        onClick={() =>
                          handleGenerate(
                            row.financialType,
                            row.financialId,
                            EVENT_TYPES[row.financialType].settled ||
                              EVENT_TYPES[row.financialType].received ||
                              EVENT_TYPES[row.financialType].recognized
                          )
                        }
                      >
                        Gerar baixa
                      </ActionButton>
                    ) : null}
                    <ActionButton
                      onClick={() => handleReconcile(row.financialType, row.financialId, "")}
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Conciliar
                    </ActionButton>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Card title="Conciliações">
        <div className="mb-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            <option value="pending">Pendentes</option>
            <option value="reconciled">Conciliados</option>
            <option value="divergent">Divergentes</option>
          </select>
        </div>

        <DataTable
          rows={reconciliations}
          rowKey={(row) => row.id}
          emptyMessage="Nenhuma conciliação registrada."
          columns={[
            {
              key: "type",
              header: "Tipo",
              render: (row) => (row.financial_type === "payable" ? "Conta a pagar" : "Conta a receber"),
            },
            {
              key: "id",
              header: "Item",
              render: (row) => `#${row.financial_id}`,
            },
            {
              key: "entry",
              header: "Lançamento",
              render: (row) => row.entry_number || "—",
            },
            {
              key: "difference",
              header: "Diferença",
              render: (row) => formatMoney(row.difference_amount),
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
                  {row.status === "reconciled" ? (
                    <ActionButton variant="danger" onClick={() => handleUnreconcile(row.id)}>
                      <Undo2 className="h-3.5 w-3.5" />
                      Desfazer
                    </ActionButton>
                  ) : (
                    <ActionButton
                      onClick={() => {
                        const entryId = window.prompt(
                          "Número do lançamento contábil (id) para conciliar:"
                        );
                        if (entryId) {
                          handleReconcile(row.financial_type, row.financial_id, entryId);
                        }
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Conciliar
                    </ActionButton>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Card title="Lançamentos contabilizados disponíveis">
        <DataTable
          rows={entries}
          rowKey={(row) => row.id}
          emptyMessage="Nenhum lançamento contabilizado."
          columns={[
            { key: "number", header: "Lançamento", render: (row) => row.number },
            {
              key: "date",
              header: "Data",
              render: (row) => formatDate(row.entry_date),
            },
            { key: "description", header: "Histórico", render: (row) => row.description },
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
          ]}
        />
      </Card>
    </AccountingPage>
  );
}
