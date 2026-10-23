import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarRange,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { useAuth } from "../../../../AuthContext";
import { DataState } from "../../../ui/DataState";
import {
  Alert,
  StatusBadge,
  formatDate,
  formatMoney,
  monthBounds,
  monthInput,
} from "../../../ui/StatusBadge";
import {
  CashFlowGranularity,
  CashFlowResponse,
  getCashFlow,
} from "../../../../services/cashFlowService";
import { BankAccount, listBankAccounts } from "../../../../services/bankAccountService";

type DetailTab = "realized" | "forecast" | "settled";

const GRANULARITY_LABELS: Record<CashFlowGranularity, string> = {
  day: "Diário",
  week: "Semanal",
  month: "Mensal",
};

export const FluxoCaixaTab: React.FC = () => {
  const { activeLegalEntity, hasPermission } = useAuth();
  const [month, setMonth] = useState(monthInput());
  const [granularity, setGranularity] = useState<CashFlowGranularity>("day");
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [flow, setFlow] = useState<CashFlowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("realized");

  const legalEntityId = activeLegalEntity?.id;

  const load = useCallback(async () => {
    if (!legalEntityId) {
      setFlow(null);
      setLoading(false);
      return;
    }
    const period = monthBounds(month);
    setLoading(true);
    setError(null);
    const response = await getCashFlow({
      from: period.from,
      to: period.to,
      granularity,
      accountId: accountId || undefined,
    });
    if (!response.ok || !response.data) {
      setError(response.error || "Não foi possível carregar o fluxo de caixa.");
      setFlow(null);
    } else {
      setFlow(response.data);
    }
    setLoading(false);
  }, [accountId, granularity, legalEntityId, month]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!legalEntityId) {
      setAccounts([]);
      return;
    }
    let cancelled = false;
    void listBankAccounts().then((response) => {
      if (!cancelled && response.ok && response.data) setAccounts(response.data);
    });
    return () => {
      cancelled = true;
    };
  }, [legalEntityId]);

  const maxSeriesValue = useMemo(() => {
    if (!flow) return 1;
    return Math.max(
      1,
      ...flow.series.map((item) =>
        Math.max(item.credits, item.debits, Math.abs(item.forecastNet))
      )
    );
  }, [flow]);

  if (!activeLegalEntity) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <DataState
          variant="company-required"
          description="Selecione um CNPJ para consultar o fluxo de caixa. O realizado de cada empresa é isolado."
        />
      </div>
    );
  }

  if (!hasPermission("finance", "view")) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <DataState variant="forbidden" />
      </div>
    );
  }

  const summary = flow?.summary;
  const details = flow?.details;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Fluxo de caixa
          </h2>
          <p className="text-sm text-slate-500">
            Realizado a partir do extrato bancário e previsão a partir de títulos em
            aberto. Sem duplicidade.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-medium text-slate-600">
            Competência
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Agrupamento
            <select
              value={granularity}
              onChange={(event) =>
                setGranularity(event.target.value as CashFlowGranularity)
              }
              className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {Object.entries(GRANULARITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Conta
            <select
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              className="mt-1 block max-w-52 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todas as contas</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bank_name} · {account.account_number}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Aplicar
          </button>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <DataState variant="loading" />
        </div>
      ) : !flow || !summary ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <DataState
            variant="empty"
            description="Não há dados de fluxo de caixa para o período consultado."
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Saldo inicial</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatMoney(summary.openingBalance)}
              </p>
              <p className="text-xs text-slate-500">Saldo bancário antes do período</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">Entradas realizadas</p>
              <p className="mt-1 text-2xl font-bold text-emerald-800">
                {formatMoney(summary.realizedCredits)}
              </p>
              <p className="text-xs text-emerald-700">
                Saídas {formatMoney(summary.realizedDebits)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Saldo realizado final</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatMoney(summary.closingBalance)}
              </p>
              <p
                className={`text-xs ${
                  summary.realizedNet >= 0 ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                Variação {formatMoney(summary.realizedNet)}
              </p>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="text-sm text-violet-700">Projeção com títulos abertos</p>
              <p className="mt-1 text-2xl font-bold text-violet-800">
                {formatMoney(summary.projectedBalance)}
              </p>
              <p className="text-xs text-violet-700">
                Previsto líquido {formatMoney(summary.forecastNet)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900">Evolução no período</h3>
                <p className="text-xs text-slate-500">
                  {formatDate(flow.period.from)} a {formatDate(flow.period.to)} ·{" "}
                  {GRANULARITY_LABELS[flow.period.granularity]}
                </p>
              </div>
              <div className="flex gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Entradas
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> Saídas
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-violet-400" /> Previsto
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="flex min-w-[640px] items-end gap-3 border-b border-slate-200 pb-2">
                {flow.series.map((item) => {
                  const creditHeight = Math.max(
                    item.credits > 0 ? 8 : 0,
                    (item.credits / maxSeriesValue) * 120
                  );
                  const debitHeight = Math.max(
                    item.debits > 0 ? 8 : 0,
                    (item.debits / maxSeriesValue) * 120
                  );
                  const forecastHeight = Math.max(
                    Math.abs(item.forecastNet) > 0 ? 8 : 0,
                    (Math.abs(item.forecastNet) / maxSeriesValue) * 120
                  );
                  return (
                    <div
                      key={item.key}
                      className="flex min-w-10 flex-1 flex-col items-center gap-1"
                      title={`${item.startDate} — realizado ${formatMoney(
                        item.net
                      )}; previsto ${formatMoney(item.forecastNet)}`}
                    >
                      <div className="flex h-32 items-end gap-0.5">
                        <div
                          className="w-2 rounded-t bg-emerald-500"
                          style={{ height: `${creditHeight}px` }}
                        />
                        <div
                          className="w-2 rounded-t bg-rose-500"
                          style={{ height: `${debitHeight}px` }}
                        />
                        <div
                          className="w-2 rounded-t bg-violet-400"
                          style={{ height: `${forecastHeight}px` }}
                        />
                      </div>
                      <span className="whitespace-nowrap text-[10px] text-slate-400">
                        {item.key.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Período</th>
                    <th className="px-3 py-2 text-right">Saldo inicial</th>
                    <th className="px-3 py-2 text-right">Entradas</th>
                    <th className="px-3 py-2 text-right">Saídas</th>
                    <th className="px-3 py-2 text-right">Saldo realizado</th>
                    <th className="px-3 py-2 text-right">Previsto líquido</th>
                    <th className="px-3 py-2 text-right">Saldo projetado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {flow.series.map((item) => (
                    <tr key={item.key}>
                      <td className="px-3 py-2 text-slate-600">
                        {formatDate(item.startDate)}
                        {item.endDate !== item.startDate
                          ? ` a ${formatDate(item.endDate)}`
                          : ""}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {formatMoney(item.opening)}
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-700">
                        {formatMoney(item.credits)}
                      </td>
                      <td className="px-3 py-2 text-right text-rose-700">
                        {formatMoney(item.debits)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">
                        {formatMoney(item.closing)}
                      </td>
                      <td className="px-3 py-2 text-right text-violet-700">
                        {formatMoney(item.forecastNet)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-violet-900">
                        {formatMoney(item.projectedClosing)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex gap-1 border-b border-slate-100 p-2">
              {(
                [
                  ["realized", "Movimentações realizadas"],
                  ["forecast", "Previsão de títulos"],
                  ["settled", "Conciliação de baixas"],
                ] as Array<[DetailTab, string]>
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDetailTab(value)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    detailTab === value
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {detailTab === "realized" &&
                (details?.realized.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Data</th>
                          <th className="px-3 py-2">Conta</th>
                          <th className="px-3 py-2">Descrição</th>
                          <th className="px-3 py-2">Categoria</th>
                          <th className="px-3 py-2">Tipo</th>
                          <th className="px-3 py-2 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {details.realized.map((item) => (
                          <tr key={`${item.id}-${item.date}`}>
                            <td className="px-3 py-2 text-slate-600">
                              {formatDate(item.date)}
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {item.bank_name} · {item.account_number}
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-900">
                              {item.description}
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {item.category || "Sem categoria"}
                            </td>
                            <td className="px-3 py-2">
                              {item.direction === "credit" ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700">
                                  <ArrowDownLeft className="h-3.5 w-3.5" /> Entrada
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-700">
                                  <ArrowUpRight className="h-3.5 w-3.5" /> Saída
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-900">
                              {formatMoney(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <DataState
                    variant="empty"
                    description="Nenhuma movimentação bancária confirmada no período."
                    compact
                  />
                ))}

              {detailTab === "forecast" &&
                (details?.forecast.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Vencimento</th>
                          <th className="px-3 py-2">Título</th>
                          <th className="px-3 py-2">Parte</th>
                          <th className="px-3 py-2">Tipo</th>
                          <th className="px-3 py-2">Situação</th>
                          <th className="px-3 py-2 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {details.forecast.map((item) => (
                          <tr key={`${item.kind}-${item.id}`}>
                            <td className="px-3 py-2 text-slate-600">
                              {formatDate(item.date)}
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {item.document || `#${item.id}`}
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-900">
                              {item.party || "—"}
                            </td>
                            <td className="px-3 py-2">
                              {item.kind === "receivable" ? "A receber" : "A pagar"}
                            </td>
                            <td className="px-3 py-2">
                              <StatusBadge
                                label={
                                  item.status === "overdue" ? "Vencido" : "Pendente"
                                }
                                tone={item.status === "overdue" ? "red" : "amber"}
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-900">
                              {formatMoney(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <DataState
                    variant="empty"
                    description="Nenhum título em aberto com vencimento no período."
                    compact
                  />
                ))}

              {detailTab === "settled" && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-800">
                        Recebimentos baixados
                      </p>
                      <p className="mt-1 text-2xl font-bold text-emerald-900">
                        {formatMoney(flow.settled.receivables.total)}
                      </p>
                      <p className="text-xs text-emerald-700">
                        {flow.settled.receivables.count} título(s)
                      </p>
                    </div>
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                      <p className="text-sm font-semibold text-rose-800">
                        Pagamentos baixados
                      </p>
                      <p className="mt-1 text-2xl font-bold text-rose-900">
                        {formatMoney(flow.settled.payables.total)}
                      </p>
                      <p className="text-xs text-rose-700">
                        {flow.settled.payables.count} título(s)
                      </p>
                    </div>
                  </div>
                  <Alert tone="amber">
                    {flow.settled.note}
                  </Alert>
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <CalendarRange className="mt-0.5 h-4 w-4 flex-none" />
                    <p>
                      Para alterar a baixa de um título, use a visão geral financeira.
                      O fluxo de caixa não reescreve títulos nem movimenta banco
                      automaticamente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {flow.categories.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                <WalletCards className="h-4 w-4" />
                Realizado por categoria
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {flow.categories.map((item) => (
                  <div
                    key={`${item.category}-${item.direction}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm"
                  >
                    <span className="text-slate-600">{item.category}</span>
                    <span
                      className={
                        item.direction === "credit"
                          ? "font-semibold text-emerald-700"
                          : "font-semibold text-rose-700"
                      }
                    >
                      {formatMoney(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
