import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CreditCard,
  Pencil,
  Plus,
  RefreshCw,
  SearchX,
  Wallet,
} from "lucide-react";
import {
  SystemAdminCompany,
  SystemAdminPlan,
  SystemAdminSubscription,
  systemAdminService,
} from "../../services/systemAdminService";
import {
  Alert,
  Button,
  CompanyAvatar,
  EmptyState,
  PageHeader,
  SearchInput,
  Spinner,
  StatusBadge,
} from "./components";
import SubscriptionFormModal from "./SubscriptionFormModal";
import {
  formatCurrencyFromCents,
  formatDate,
  subscriptionStatusLabel,
  subscriptionTone,
} from "./utils";

interface Props {
  refreshKey: number;
  initialCompanyId: number | null;
  onPresetConsumed: () => void;
  onDataChanged: () => void;
}

export default function SubscriptionsTab({
  refreshKey,
  initialCompanyId,
  onPresetConsumed,
  onDataChanged,
}: Props) {
  const [subscriptions, setSubscriptions] = useState<SystemAdminSubscription[]>([]);
  const [companies, setCompanies] = useState<SystemAdminCompany[]>([]);
  const [plans, setPlans] = useState<SystemAdminPlan[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SystemAdminSubscription | null>(null);
  const [modalCompanyId, setModalCompanyId] = useState<number | null>(null);
  const handledPreset = useRef<number | null>(null);

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const [subscriptionList, companyList, planList] = await Promise.all([
        systemAdminService.listSubscriptions(),
        systemAdminService.listCompanies(),
        systemAdminService.listPlans(),
      ]);
      setSubscriptions(subscriptionList);
      setCompanies(companyList);
      setPlans(planList);
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar as assinaturas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useEffect(() => {
    if (!initialCompanyId) {
      handledPreset.current = null;
      return;
    }
    if (loading || handledPreset.current === initialCompanyId) return;

    const existing = subscriptions.find(
      (subscription) => subscription.company_id === initialCompanyId
    );
    setEditing(existing || null);
    setModalCompanyId(initialCompanyId);
    setModalOpen(true);
    handledPreset.current = initialCompanyId;
    onPresetConsumed();
  }, [initialCompanyId, loading, subscriptions, onPresetConsumed]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return subscriptions;
    return subscriptions.filter((subscription) =>
      [subscription.company_name, subscription.plan_name, subscription.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [subscriptions, search]);

  const active = subscriptions.filter((item) => item.status === "active");
  const mrr = active.reduce((total, item) => total + (item.price_cents || 0), 0);
  const withoutSubscription = companies.filter((company) => !company.subscription_id).length;

  const openNew = () => {
    setEditing(null);
    setModalCompanyId(null);
    setModalOpen(true);
  };

  const openEdit = (subscription: SystemAdminSubscription) => {
    setEditing(subscription);
    setModalCompanyId(subscription.company_id);
    setModalOpen(true);
  };

  const handleSaved = async () => {
    await load(false);
    onDataChanged();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assinaturas"
        description="Gerencie os planos comerciais contratados por cada empresa."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => load()} disabled={loading}>
              <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Atualizar
            </Button>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              Nova assinatura
            </Button>
          </div>
        }
      />

      {error ? <Alert>{error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Assinaturas ativas
              </p>
              <p className="text-xl font-bold text-slate-900">{active.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Receita recorrente
              </p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrencyFromCents(mrr)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Empresas sem assinatura
              </p>
              <p className="text-xl font-bold text-slate-900">{withoutSubscription}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por empresa, plano ou status..."
            className="w-full sm:max-w-md"
          />
          <p className="text-xs text-slate-400">
            {subscriptions.length} assinatura(s) · {withoutSubscription} empresa(s) sem plano
          </p>
        </div>

        {loading && subscriptions.length === 0 ? (
          <Spinner label="Carregando assinaturas..." />
        ) : filtered.length === 0 ? (
          <div className="p-5">
            {subscriptions.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="Nenhuma assinatura cadastrada"
                description="Crie uma assinatura para vincular uma empresa a um plano comercial."
                action={
                  <Button size="sm" onClick={openNew}>
                    <Plus className="h-4 w-4" />
                    Nova assinatura
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={SearchX}
                title="Nenhuma assinatura encontrada"
                description="Tente buscar por outro termo."
                action={
                  <Button size="sm" variant="outline" onClick={() => setSearch("")}>
                    Limpar busca
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Empresa</th>
                  <th className="px-5 py-3 font-semibold">Plano</th>
                  <th className="px-5 py-3 font-semibold">Valor</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Início</th>
                  <th className="px-5 py-3 font-semibold">Fim</th>
                  <th className="px-5 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((subscription) => (
                  <tr
                    key={subscription.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <CompanyAvatar name={subscription.company_name} />
                        <p className="text-sm font-semibold text-slate-800">
                          {subscription.company_name}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-700">
                        {subscription.plan_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {subscription.plan_type === "yearly" ? "Anual" : "Mensal"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-600">
                      {formatCurrencyFromCents(
                        subscription.price_cents,
                        subscription.currency
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        label={subscriptionStatusLabel[subscription.status]}
                        className={subscriptionTone(subscription.status)}
                      />
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {formatDate(subscription.started_at)}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {formatDate(subscription.ended_at)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(subscription)}
                        aria-label={`Editar assinatura de ${subscription.company_name}`}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="hidden xl:inline">Editar</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SubscriptionFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          setModalCompanyId(null);
        }}
        subscription={editing}
        companies={companies}
        plans={plans}
        initialCompanyId={modalCompanyId}
        onSaved={handleSaved}
      />
    </div>
  );
}
