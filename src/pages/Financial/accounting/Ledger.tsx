import { useCallback, useEffect, useState } from "react";

import {
  getAccountingLedger,
  listAccountingAccounts,
} from "../../../services/accountingService";
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

/**
 * Livro razão: extrato de uma conta com saldo progressivo.
 */
export default function LedgerBookPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAccountingAccounts().then((response) => {
      const list = response.data || [];
      setAccounts(list);
      setAccountId((current) =>
        current || (list.length ? String(list[0].id) : "")
      );
    });
  }, []);

  const load = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    const response = await getAccountingLedger({
      accountId: Number(accountId),
      from,
      to,
    });
    if (response.ok && response.data) {
      setData(response.data);
    } else {
      setData(null);
      setError(response.error || "Não foi possível carregar o livro razão.");
    }
    setLoading(false);
  }, [accountId, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AccountingPage
      title="Livro razão"
      description="Extrato de uma conta com saldo inicial, movimentos e saldo final no período."
    >
      <ErrorState message={error} />

      <Card title="Filtros">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Conta">
            <select
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              className={inputClass}
            >
              <option value="">Selecione a conta</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} - {account.name}
                </option>
              ))}
            </select>
          </Field>
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
        </div>
      </Card>

      <Card
        title={
          data?.account
            ? `${data.account.code} - ${data.account.name}`
            : "Extrato"
        }
      >
        {loading ? (
          <LoadingState label="Carregando o livro razão..." />
        ) : !data || !data.rows?.length ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Nenhum movimento no período selecionado.
          </p>
        ) : (
          <>
            <DataTable
              rows={data.rows}
              rowKey={(row: any) => `${row.entry_id}-${row.item_id ?? row.account_id}`}
              columns={[
                {
                  key: "date",
                  header: "Data",
                  render: (row: any) => formatDate(row.entry_date),
                },
                { key: "number", header: "Lançamento", render: (row: any) => row.number },
                { key: "description", header: "Histórico", render: (row: any) => row.description },
                {
                  key: "debit",
                  header: "Débito",
                  render: (row: any) => formatMoney(row.debit),
                },
                {
                  key: "credit",
                  header: "Crédito",
                  render: (row: any) => formatMoney(row.credit),
                },
                {
                  key: "balance",
                  header: "Saldo",
                  render: (row: any) => (
                    <strong>{formatMoney(row.balance)}</strong>
                  ),
                },
              ]}
            />
            <div className="mt-3 flex flex-wrap justify-end gap-4 rounded-xl bg-slate-50 p-3 text-sm">
              <span>
                Saldo inicial:{" "}
                <strong>{formatMoney(data.totals?.openingBalance)}</strong>
              </span>
              <span>
                Débitos: <strong>{formatMoney(data.totals?.debit)}</strong>
              </span>
              <span>
                Créditos: <strong>{formatMoney(data.totals?.credit)}</strong>
              </span>
              <span>
                Saldo final:{" "}
                <strong>{formatMoney(data.totals?.closingBalance)}</strong>
              </span>
            </div>
          </>
        )}
      </Card>
    </AccountingPage>
  );
}
