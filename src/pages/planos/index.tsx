/**
 * Planos e módulos do Konexus ERP.
 *
 * A tela consulta a configuração real da empresa. Não existe checkout nem
 * cobrança automática: contratações e autorizações são registradas pelo
 * suporte global.
 */

import { useEffect, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Headphones,
  KeyRound,
  Loader2,
  LockKeyhole,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import Swal from "sweetalert2";
import Dashboard from "../../components/dashboard/Dashboard";
import { useAuth } from "../../AuthContext";
import {
  CommercialModule,
  CommercialOverview,
  getCommercialOverview,
} from "../../services/collaboratorService";

function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function statusLabel(module: CommercialModule): string {
  if (!module.isExtra) return "Incluído";
  if (module.status === "active") return "Contratado";
  if (module.status === "suspended") return "Suspenso";
  if (module.status === "cancelled") return "Cancelado";
  if (module.status === "pending") return "Pendente";
  return "Não contratado";
}

function statusTone(module: CommercialModule): string {
  if (!module.isExtra) return "bg-emerald-50 text-emerald-700";
  if (module.available) return "bg-emerald-50 text-emerald-700";
  if (module.status === "suspended") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function moduleIcon(moduleKey: string) {
  if (moduleKey === "finance") return CreditCard;
  if (moduleKey === "nfe") return Package;
  if (moduleKey === "rh") return Users;
  if (moduleKey === "dashboard") return Sparkles;
  if (moduleKey === "crm") return BadgeCheck;
  if (moduleKey === "estoque") return WalletCards;
  return ShieldCheck;
}

export default function PlanosPage() {
  const { isCompanyAdmin } = useAuth();
  const [overview, setOverview] = useState<CommercialOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const response = await getCommercialOverview();
    if (response.ok) setOverview(response.data);
    else setError(response.error || "Não foi possível carregar os módulos.");
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openSupportInstructions = (moduleName: string) => {
    const support = overview?.support;
    const contact = support?.contact;
    const lines = [
      `A contratação do módulo ${moduleName} é registrada pelo suporte global.`,
      "Não existe cobrança automática nem checkout nesta tela.",
    ];
    if (contact) lines.push(`Canal de atendimento: ${contact}`);
    else lines.push(support?.message || "Fale com o administrador global do sistema.");

    Swal.fire({
      title: `Solicitar ${moduleName}`,
      html: lines.map((line) => `<p style="margin:6px 0;text-align:left">${line}</p>`).join(""),
      icon: "info",
      confirmButtonText: "Entendi",
    });
  };

  return (
    <Dashboard>
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                <WalletCards className="h-4 w-4" />
                Comercial
              </div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Planos, módulos e limites
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Módulos padrão estão incluídos para todas as empresas. CRM,
                Financeiro e NF-e são extras independentes, contratados
                separadamente.
              </p>
            </div>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Atualizar
            </button>
          </div>

          {error ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <span className="inline-flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </span>
              <button onClick={load} className="font-semibold underline">
                Tentar novamente
              </button>
            </div>
          ) : null}

          {loading && !overview ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-20 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando módulos e limites...
            </div>
          ) : null}

          {overview ? (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Users className="h-4 w-4 text-blue-600" />
                    Contas ativas
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {overview.usage.accounts.activeAccounts}
                    <span className="ml-1 text-sm font-medium text-slate-400">
                      / {overview.usage.accounts.freeLimit} gratuitas
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {overview.usage.accounts.limitReached
                      ? `Conta adicional: ${formatMoney(overview.rules.accounts.extraUserPriceCents)} com autorização.`
                      : `${overview.usage.accounts.freeRemaining} vaga(s) gratuita(s).`}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <KeyRound className="h-4 w-4 text-amber-600" />
                    Redefinições de senha
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {overview.usage.passwordResets.used}
                    <span className="ml-1 text-sm font-medium text-slate-400">
                      / {overview.usage.passwordResets.freeLimit} gratuitas
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {overview.usage.passwordResets.freeExhausted
                      ? `Próxima: ${formatMoney(overview.rules.passwordReset.extraPriceCents)} com autorização.`
                      : `${overview.usage.passwordResets.remaining} gratuita(s) restante(s) neste mês.`}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    Período de referência
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {new Date(`${overview.period.referenceMonth}T12:00:00`).toLocaleDateString(
                      "pt-BR",
                      { month: "long", year: "numeric" }
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Calendário oficial: {overview.period.timezone}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                  <div>
                    <h2 className="font-bold text-emerald-950">
                      Módulos padrão incluídos
                    </h2>
                    <p className="mt-1 text-sm text-emerald-900">
                      Estes módulos não dependem de plano nem de contratação
                      adicional. O acesso de cada colaborador continua sujeito às
                      permissões definidas pelo administrador da empresa.
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {overview.standardModules.map((module) => {
                        const Icon = moduleIcon(module.key);
                        return (
                          <div
                            key={module.key}
                            className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-sm font-medium text-emerald-950"
                          >
                            <Icon className="h-4 w-4 text-emerald-700" />
                            {module.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Módulos extras independentes
                </h2>
                <p className="text-xs text-slate-500">
                  Contratados separadamente. A permissão individual do
                  colaborador só libera o acesso quando a contratação está ativa.
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {overview.extraModules.map((module) => {
                    const Icon = moduleIcon(module.key);
                    return (
                      <div
                        key={module.key}
                        className="rounded-2xl border border-slate-200 bg-white p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900">{module.name}</h3>
                              <p className="text-xs text-slate-500">
                                {module.description ||
                                  "Módulo extra contratado de forma independente."}
                              </p>
                            </div>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusTone(module)}`}>
                            {statusLabel(module)}
                          </span>
                        </div>

                        <div className="mt-4 space-y-1 text-xs text-slate-500">
                          <p>
                            {module.startedAt
                              ? `Início: ${new Date(module.startedAt).toLocaleDateString("pt-BR")}`
                              : "Sem contratação registrada."}
                          </p>
                          {module.endedAt ? (
                            <p>Encerramento: {new Date(module.endedAt).toLocaleDateString("pt-BR")}</p>
                          ) : null}
                          {module.notes ? <p>Observação: {module.notes}</p> : null}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openSupportInstructions(module.name)}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                          >
                            <Headphones className="h-3.5 w-3.5" />
                            {module.available ? "Falar com o suporte" : "Solicitar contratação"}
                          </button>
                          {isCompanyAdmin ? (
                            <a
                              href="#/config/users-permissions"
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              <LockKeyhole className="h-3.5 w-3.5" />
                              Gerenciar permissões
                            </a>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-blue-700" />
                  <h2 className="font-bold text-slate-900">Canal de suporte</h2>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  {overview.support.contact ||
                    overview.support.message ||
                    "Fale com o administrador global do sistema."}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  As autorizações de conta adicional, redefinição extra e remoção
                  são registradas pelo suporte. Os valores exibidos são
                  informativos e não geram cobrança automática.
                </p>
                {isCompanyAdmin ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href="#/config/users-permissions"
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Gerenciar usuários e permissões
                    </a>
                    <a
                      href="#/config/system"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Configuração de NF-e
                    </a>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </Dashboard>
  );
}
