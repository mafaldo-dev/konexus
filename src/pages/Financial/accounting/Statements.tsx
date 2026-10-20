import { useCallback, useEffect, useState } from "react";

import {
  getBalanceSheet,
  getIncomeStatement,
} from "../../../services/accountingService";
import {
  AccountingPage,
  Card,
  DataTable,
  ErrorState,
  Field,
  LoadingState,
  formatMoney,
  inputClass,
} from "./components";

/**
 * Balanço patrimonial (gerencial) e demonstração do resultado.
 *
 * Os valores vêm dos lançamentos contabilizados. Até que a configuração
 * contábil seja validada pelo responsável contábil, estas demonstrações
 * não devem ser apresentadas como livros oficiais.
 */
export function BalanceSheetPage() {
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getBalanceSheet({ from, to });
    if (response.ok && response.data) {
      setData(response.data);
    } else {
      setData(null);
      setError(response.error || "Não foi possível carregar o balanço.");
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const groups = Object.values(data?.groups || {}) as any[];

  return (
    <AccountingPage
      title="Balanço patrimonial"
      description="Ativo, passivo e patrimônio líquido com base nos lançamentos contabilizados. Documento gerencial."
    >
      <ErrorState message={error} />

      <Card title="Período">
        <div className="grid gap-3 sm:grid-cols-2">
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

      {loading ? (
        <LoadingState label="Calculando o balanço..." />
      ) : !data ? (
        <Card>
          <p className="py-10 text-center text-sm text-slate-500">
            Selecione o período para gerar o balanço patrimonial.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.key} title={group.name}>
              <DataTable
                rows={group.accounts}
                rowKey={(row: any) => row.code}
                emptyMessage="Sem movimentos no grupo."
                columns={[
                  { key: "code", header: "Código", render: (row: any) => row.code },
                  { key: "name", header: "Conta", render: (row: any) => row.name },
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
              <p className="mt-2 text-right text-sm">
                Total do grupo: <strong>{formatMoney(group.balance)}</strong>
              </p>
            </Card>
          ))}

          <Card title="Resumo">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs uppercase text-slate-500">Ativo</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatMoney(data.totals?.assets)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Passivo</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatMoney(data.totals?.liabilities)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">
                  Patrimônio líquido (com resultado)
                </p>
                <p className="text-lg font-bold text-slate-900">
                  {formatMoney(data.totals?.equity)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Situação</p>
                <p
                  className={`text-lg font-bold ${
                    data.totals?.balanced ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {data.totals?.balanced
                    ? "Ativo = Passivo + PL"
                    : "Divergência"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </AccountingPage>
  );
}

export function IncomeStatementPage() {
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getIncomeStatement({ from, to });
    if (response.ok && response.data) {
      setData(response.data);
    } else {
      setData(null);
      setError(response.error || "Não foi possível carregar a demonstração.");
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const block = (title: string, group: any) => (
    <Card key={title} title={title}>
      <DataTable
        rows={group?.accounts || []}
        rowKey={(row: any) => row.code}
        emptyMessage="Sem movimentos no grupo."
        columns={[
          { key: "code", header: "Código", render: (row: any) => row.code },
          { key: "name", header: "Conta", render: (row: any) => row.name },
          {
            key: "amount",
            header: "Valor",
            render: (row: any) => formatMoney(row.amount),
          },
        ]}
      />
      <p className="mt-2 text-right text-sm">
        Total: <strong>{formatMoney(group?.total)}</strong>
      </p>
    </Card>
  );

  return (
    <AccountingPage
      title="Demonstração do resultado"
      description="Receitas, custos, despesas e resultado do período. Documento gerencial."
    >
      <ErrorState message={error} />

      <Card title="Período">
        <div className="grid gap-3 sm:grid-cols-2">
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

      {loading ? (
        <LoadingState label="Calculando a demonstração..." />
      ) : !data ? (
        <Card>
          <p className="py-10 text-center text-sm text-slate-500">
            Selecione o período para gerar a demonstração do resultado.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {block("Receitas", data.revenue)}
          {block("Custos", data.costs)}
          {block("Despesas", data.expenses)}
          <Card title="Resultado">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase text-slate-500">Resultado bruto</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatMoney(data.grossProfit)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Resultado líquido</p>
                <p
                  className={`text-lg font-bold ${
                    Number(data.netResult) >= 0
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  {formatMoney(data.netResult)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Comparativo</p>
                <p className="text-sm text-slate-600">
                  {data.comparative
                    ? formatMoney(data.comparative.netResult)
                    : "Informe um período comparativo para ver a evolução."}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </AccountingPage>
  );
}
