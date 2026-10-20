import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";

import { getTrialBalance } from "../../../services/accountingService";
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
import { downloadCsv } from "./Journal";
import { Button } from "../../../components/dashboard/components/ui/Button";

/**
 * Balancete de verificação: saldos e movimentos por conta, com verificação
 * da igualdade entre débitos e créditos.
 */
export default function TrialBalancePage() {
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getTrialBalance({ from, to });
    if (response.ok && response.data) {
      setData(response.data);
    } else {
      setData(null);
      setError(response.error || "Não foi possível carregar o balancete.");
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AccountingPage
      title="Balancete de verificação"
      description="Saldos, movimentos e saldo final por conta no período. Relatório gerencial."
      actions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            data &&
            downloadCsv(
              `balancete-${from}-a-${to}.csv`,
              [
                "Código",
                "Conta",
                "Saldo inicial",
                "Movimento devedor",
                "Movimento credor",
                "Saldo final",
              ],
              data.accounts.map((row: any) => [
                row.code,
                row.name,
                row.openingBalance,
                row.debit,
                row.credit,
                row.closingBalance,
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

      <Card>
        {loading ? (
          <LoadingState label="Carregando o balancete..." />
        ) : !data ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Selecione o período para gerar o balancete.
          </p>
        ) : (
          <>
            <DataTable
              rows={data.accounts}
              rowKey={(row: any) => row.accountId}
              emptyMessage="Nenhuma conta com movimento no período."
              columns={[
                { key: "code", header: "Código", render: (row: any) => row.code },
                { key: "name", header: "Conta", render: (row: any) => row.name },
                {
                  key: "opening",
                  header: "Saldo inicial",
                  render: (row: any) => formatMoney(row.openingBalance),
                },
                {
                  key: "debit",
                  header: "Movimento devedor",
                  render: (row: any) => formatMoney(row.debit),
                },
                {
                  key: "credit",
                  header: "Movimento credor",
                  render: (row: any) => formatMoney(row.credit),
                },
                {
                  key: "closing",
                  header: "Saldo final",
                  render: (row: any) => (
                    <strong>{formatMoney(row.closingBalance)}</strong>
                  ),
                },
              ]}
            />
            <div className="mt-3 flex flex-wrap justify-end gap-4 rounded-xl bg-slate-50 p-3 text-sm">
              <span>
                Total débitos: <strong>{formatMoney(data.totals?.debit)}</strong>
              </span>
              <span>
                Total créditos: <strong>{formatMoney(data.totals?.credit)}</strong>
              </span>
              <span className={data.balanced ? "text-emerald-700" : "text-rose-700"}>
                {data.balanced
                  ? "Balancete equilibrado"
                  : "Balancete com divergência"}
              </span>
            </div>
          </>
        )}
      </Card>
    </AccountingPage>
  );
}
