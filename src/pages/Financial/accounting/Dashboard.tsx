import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, FileText, PlusCircle } from "lucide-react";

import { getAccountingDashboard } from "../../../services/accountingService";
import {useAuth} from '../../../AuthContext';
import {
  AccountingPage,
  Card,
  DataTable,
  ErrorState,
  LoadingState,
  StatCard,
  formatMoney,
  linkButtonClass,
} from "./components";

/**
 * Painel contábil: indicadores calculados a partir dos lancamentos
 * contabilizados da empresa. Sem dados, os cards ficam zerados.
 */
export default function AccountingDashboardPage() {
  const {hasPermission,hasModule,isCompanyAdmin} = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getAccountingDashboard({ year: Number(year) });
    if (response.ok && response.data) {
      setData(response.data);
    } else {
      setData(null);
      setError(response.error || "Não foi possível carregar o painel contábil.");
    }
    setLoading(false);
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = data?.totals;
  const entries = data?.entries;
  const groups = data?.groups || {};

  return (
    <AccountingPage
      title="Painel contábil"
      description="Indicadores calculados a partir dos lançamentos contabilizados da sua empresa."
      actions={
        <>
          {hasModule('nfe') && (isCompanyAdmin || hasPermission('nfe','configure')) &&
            <Link to="/financer/contabilidade/conexao-fiscal" className={linkButtonClass}>Conexão fiscal / homologação</Link>}
          <select
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {Array.from({ length: 4 }, (_, index) => {
              const option = new Date().getFullYear() - index;
              return (
                <option key={option} value={option}>
                  Exercício {option}
                </option>
              );
            })}
          </select>
        </>
      }
    >
      <ErrorState message={error} />

      {loading ? (
        <LoadingState label="Carregando o painel contábil..." />
      ) : !data ? (
        <Card>
          <p className="text-sm text-slate-500">
            Sem dados para exibir. Cadastre o plano de contas e os períodos para
            começar.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Débitos no período"
              value={formatMoney(totals?.debit)}
              hint={`Créditos: ${formatMoney(totals?.credit)}`}
            />
            <StatCard
              label="Partidas dobradas"
              value={totals?.balanced ? "Balanceado" : "Divergente"}
              tone={totals?.balanced ? "success" : "danger"}
              hint={
                totals?.balanced
                  ? "Débitos e créditos conferem"
                  : "Revise os lançamentos posted"
              }
            />
            <StatCard
              label="Resultado acumulado"
              value={formatMoney(totals?.result)}
              tone={Number(totals?.result) >= 0 ? "success" : "danger"}
              hint="Receitas menos custos e despesas"
            />
            <StatCard
              label="Lançamentos em aberto"
              value={String(entries?.open ?? 0)}
              hint={`${entries?.posted ?? 0} contabilizados`}
              tone={Number(entries?.open) > 0 ? "warning" : "default"}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Ativos"
              value={formatMoney(totals?.assets)}
            />
            <StatCard
              label="Passivos"
              value={formatMoney(totals?.liabilities)}
            />
            <StatCard
              label="Períodos abertos"
              value={String(data?.periods?.open ?? 0)}
              hint={`${data?.periods?.closed ?? 0} encerrados, ${data?.periods?.locked ?? 0} bloqueados`}
            />
            <StatCard
              label="Conciliação"
              value={`${data?.reconciliation?.reconciled ?? 0} conciliados`}
              hint={`${data?.reconciliation?.pending ?? 0} pendentes, ${data?.reconciliation?.divergent ?? 0} divergentes`}
              tone={Number(data?.reconciliation?.divergent) > 0 ? "warning" : "default"}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Ativos imobilizados"
              value={String(data?.fixedAssets?.total ?? 0)}
              hint={formatMoney(data?.fixedAssets?.acquisitionAmount)}
            />
            <StatCard
              label="Depreciação acumulada"
              value={formatMoney(data?.fixedAssets?.accumulatedDepreciation)}
            />
            <StatCard
              label="Valor contábil líquido"
              value={formatMoney(data?.fixedAssets?.netBookValue)}
            />
            <StatCard
              label="Períodos contábeis"
              value={String(data?.periods?.total ?? 0)}
            />
          </div>

          <Card title="Saldo por grupo de contas">
            <DataTable
              rows={Object.values(groups) as any[]}
              rowKey={(row: any) => row.key}
              emptyMessage="Nenhum movimento contabilizado no período."
              columns={[
                { key: "name", header: "Grupo", render: (row: any) => row.name },
                {
                  key: "debit",
                  header: "Débitos",
                  render: (row: any) => formatMoney(row.debit),
                },
                {
                  key: "credit",
                  header: "Créditos",
                  render: (row: any) => formatMoney(row.credit),
                },
                {
                  key: "balance",
                  header: "Saldo",
                  render: (row: any) => formatMoney(row.balance),
                },
              ]}
            />
          </Card>

          {data?.alerts?.length ? (
            <Card title="Alertas">
              <ul className="space-y-2">
                {data.alerts.map((alert: any) => (
                  <li
                    key={alert.message}
                    className={`flex items-start gap-2 rounded-lg border p-2.5 text-sm ${
                      alert.level === "error"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    {alert.message}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card title="Atalhos">
            <div className="flex flex-wrap gap-2">
              <Link
                to="/financer/contabilidade/lancamentos"
                className={`${linkButtonClass} bg-blue-600 text-white hover:bg-blue-700 border-blue-600`}
              >
                <PlusCircle className="h-4 w-4" />
                Novo lançamento
              </Link>
              <Link
                to="/financer/contabilidade/livro-diario"
                className={linkButtonClass}
              >
                <FileText className="h-4 w-4" />
                Livro diário
              </Link>
              <Link
                to="/financer/contabilidade/balancete"
                className={linkButtonClass}
              >
                <FileText className="h-4 w-4" />
                Balancete
              </Link>
              <Link
                to="/financer/contabilidade/exercicios"
                className={linkButtonClass}
              >
                <FileText className="h-4 w-4" />
                Exercícios e períodos
              </Link>
            </div>
          </Card>
        </div>
      )}
    </AccountingPage>
  );
}
