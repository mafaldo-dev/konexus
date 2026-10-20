import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  CreditCard,
  Headphones,
  Layers,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  SystemAdminDashboard,
  systemAdminService,
} from "../../services/systemAdminService";
import {
  Alert,
  Button,
  CompanyAvatar,
  EmptyState,
  PageHeader,
  ProgressBar,
  Spinner,
  StatCard,
  StatusBadge,
} from "./components";
import {
  formatCurrencyFromCents,
  formatDate,
  subscriptionStatusLabel,
  subscriptionTone,
  supportStatusLabel,
  supportTone,
} from "./utils";

interface Props {
  refreshKey: number;
  onNavigate: (tab: "companies" | "subscriptions" | "support" | "plans") => void;
  onNewCompany: () => void;
}

export default function DashboardTab({ refreshKey, onNavigate, onNewCompany }: Props) {
  const [data, setData] = useState<SystemAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await systemAdminService.getDashboard());
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar o dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const metrics = data?.metrics;
  const maxPlanTotal = Math.max(1, ...(data?.planDistribution || []).map((item) => item.total));
  const supportCounts = new Map(
    (data?.supportDistribution || []).map((item) => [item.status, item.total])
  );
  const supportTotal = (data?.supportDistribution || []).reduce(
    (total, item) => total + item.total,
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão geral"
        description="Acompanhe empresas, assinaturas e contratos de suporte da plataforma."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Atualizar
            </Button>
            <Button onClick={onNewCompany}>
              <Plus className="h-4 w-4" />
              Nova empresa
            </Button>
          </div>
        }
      />

      {error ? <Alert>{error}</Alert> : null}

      {loading && !data ? (
        <Spinner label="Carregando indicadores..." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Empresas"
              value={metrics?.companies ?? 0}
              subtitle="Cadastradas na plataforma"
              icon={Building2}
              tone="blue"
            />
            <StatCard
              title="Usuários"
              value={metrics?.users ?? 0}
              subtitle="Admins e colaboradores"
              icon={Users}
              tone="violet"
            />
            <StatCard
              title="Assinaturas ativas"
              value={metrics?.activeSubscriptions ?? 0}
              subtitle={`${metrics?.activePlans ?? 0} plano(s) ativo(s)`}
              icon={CreditCard}
              tone="emerald"
            />
            <StatCard
              title="Suporte ativo"
              value={metrics?.activeSupport ?? 0}
              subtitle="Contratos em andamento"
              icon={Headphones}
              tone="amber"
            />
            <StatCard
              title="Receita recorrente"
              value={formatCurrencyFromCents(metrics?.subscriptionRevenueCents)}
              subtitle="Soma dos planos ativos"
              icon={TrendingUp}
              tone="rose"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Distribuição por plano</h2>
                  <p className="text-xs text-slate-500">Assinaturas ativas por plano comercial</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onNavigate("plans")}>
                  Ver planos
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="mt-5 space-y-4">
                {(data?.planDistribution || []).length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum plano cadastrado.</p>
                ) : (
                  data?.planDistribution.map((plan) => (
                    <div key={plan.plan_id}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-slate-700">{plan.plan_name}</span>
                        <span className="shrink-0 text-xs font-semibold text-slate-500">
                          {plan.total} empresa(s)
                        </span>
                      </div>
                      <ProgressBar value={plan.total} max={maxPlanTotal} />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Contratos de suporte</h2>
                  <p className="text-xs text-slate-500">
                    {supportTotal} contrato(s) registrado(s)
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onNavigate("support")}>
                  Gerenciar
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(["active", "pending", "suspended", "cancelled"] as const).map((status) => (
                  <div
                    key={status}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3"
                  >
                    <StatusBadge
                      label={supportStatusLabel[status]}
                      className={supportTone(status)}
                    />
                    <span className="text-lg font-bold text-slate-900">
                      {supportCounts.get(status) || 0}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs text-blue-700">
                O suporte técnico é gerenciado separadamente da assinatura comercial da
                plataforma.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Empresas da plataforma</h2>
                <p className="text-xs text-slate-500">
                  Visão consolidada de assinatura, suporte e usuários.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onNavigate("companies")}>
                Gerenciar empresas
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {(data?.companies || []).length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={Building2}
                  title="Nenhuma empresa cadastrada"
                  description="Cadastre a primeira empresa para começar a acompanhar a operação."
                  action={
                    <Button size="sm" onClick={onNewCompany}>
                      <Plus className="h-4 w-4" />
                      Nova empresa
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3 font-semibold">Empresa</th>
                      <th className="px-5 py-3 font-semibold">Plano</th>
                      <th className="px-5 py-3 font-semibold">Assinatura</th>
                      <th className="px-5 py-3 font-semibold">Suporte</th>
                      <th className="px-5 py-3 font-semibold">Usuários</th>
                      <th className="px-5 py-3 font-semibold">Criada em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.companies.map((company) => (
                      <tr key={company.id} className="transition hover:bg-slate-50/70">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <CompanyAvatar name={company.name} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {company.name}
                              </p>
                              <p className="truncate text-xs text-slate-400">
                                {company.cnpj || "CNPJ não informado"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">
                          {company.plan_name || "Sem plano"}
                        </td>
                        <td className="px-5 py-3.5">
                          {company.subscription_status ? (
                            <StatusBadge
                              label={subscriptionStatusLabel[company.subscription_status]}
                              className={subscriptionTone(company.subscription_status)}
                            />
                          ) : (
                            <StatusBadge
                              label="Sem assinatura"
                              className="bg-slate-100 text-slate-500 ring-slate-200"
                            />
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {company.support_status ? (
                            <StatusBadge
                              label={supportStatusLabel[company.support_status]}
                              className={supportTone(company.support_status)}
                            />
                          ) : (
                            <span className="text-xs text-slate-400">Sem contrato</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm font-medium text-slate-600">
                          {company.users_count}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">
                          {formatDate(company.createdat)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => onNavigate("subscriptions")}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Assinaturas</p>
                <p className="text-xs text-slate-500">Criar e editar planos contratados</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("support")}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-amber-200 hover:bg-amber-50/40"
            >
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Suporte técnico</p>
                <p className="text-xs text-slate-500">Contratos e status de atendimento</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("plans")}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-violet-200 hover:bg-violet-50/40"
            >
              <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Planos e módulos</p>
                <p className="text-xs text-slate-500">Preços e recursos liberados</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
