import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";

import {
  getAccountingJournal,
  listAccountingAccounts,
  AccountingJournalRow,
} from "../../../services/accountingService";
import { Button } from "../../../components/dashboard/components/ui/Button";
import {
  AccountingPage,
  Card,
  DataTable,
  ErrorState,
  Field,
  LoadingState,
  formatDate,
  formatMoney,
  inputClass,
} from "./components";

function firstDayOfYear(): string {
  return `${new Date().getFullYear()}-01-01`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>
) {
  const lines = [headers.join(";"), ...rows.map((row) => row.join(";"))];
  const blob = new Blob([`\uFEFF${lines.join("\n")}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Livro diário: movimentos contabilizados do período, por lançamento.
 */
export default function JournalBookPage() {
  const [from, setFrom] = useState(firstDayOfYear());
  const [to, setTo] = useState(today());
  const [accountId, setAccountId] = useState("");
  const [originType, setOriginType] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [rows, setRows] = useState<AccountingJournalRow[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAccountingAccounts().then((response) => setAccounts(response.data || []));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getAccountingJournal({
      from,
      to,
      accountId: accountId ? Number(accountId) : undefined,
      originType: originType || undefined,
      pageSize: 500,
    });
    if (response.ok && response.data) {
      setRows(response.data.rows || []);
      setTotals(response.data.totals);
    } else {
      setRows([]);
      setTotals(null);
      setError(response.error || "Não foi possível carregar o livro diário.");
    }
    setLoading(false);
  }, [from, to, accountId, originType]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AccountingPage
      title="Livro diário"
      description="Movimentos contabilizados do período, agrupados por lançamento. Relatório gerencial."
      actions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            downloadCsv(
              `livro-diario-${from}-a-${to}.csv`,
              ["Data", "Lançamento", "Histórico", "Conta", "Tipo", "Valor"],
              rows.map((row) => [
                row.entry_date,
                row.number,
                row.description,
                row.account_code,
                row.side === "debit" ? "Débito" : "Crédito",
                Number(row.amount).toFixed(2),
              ])
            )
          }
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      }
    >
      <ErrorState message={error} />

      <Card title="Filtros">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="De">
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Até">
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Conta">
            <select
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              className={inputClass}
            >
              <option value="">Todas as contas</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} - {account.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Origem">
            <select
              value={originType}
              onChange={(event) => setOriginType(event.target.value)}
              className={inputClass}
            >
              <option value="">Todas as origens</option>
              <option value="manual">Manual</option>
              <option value="payable">Conta a pagar</option>
              <option value="receivable">Conta a receber</option>
              <option value="depreciation">Depreciação</option>
              <option value="reversal">Estorno</option>
            </select>
          </Field>
        </div>
      </Card>

      <Card>
        {loading ? (
          <LoadingState label="Carregando o livro diário..." />
        ) : (
          <>
            <DataTable
              rows={rows}
              rowKey={(row) => row.item_id}
              emptyMessage="Nenhum movimento contabilizado no período."
              columns={[
                {
                  key: "date",
                  header: "Data",
                  render: (row) => formatDate(row.entry_date),
                },
                { key: "number", header: "Lançamento", render: (row) => row.number },
                { key: "description", header: "Histórico", render: (row) => row.description },
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
            {totals ? (
              <div className="mt-3 flex flex-wrap justify-end gap-4 rounded-xl bg-slate-50 p-3 text-sm">
                <span>
                  Débitos: <strong>{formatMoney(totals.debit)}</strong>
                </span>
                <span>
                  Créditos: <strong>{formatMoney(totals.credit)}</strong>
                </span>
                <span className={totals.balanced ? "text-emerald-700" : "text-rose-700"}>
                  {totals.balanced ? "Balanceado" : "Divergente"}
                </span>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </AccountingPage>
  );
}
