import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  SearchX,
  Wallet,
} from "lucide-react";
import {
  SystemAdminModule,
  SystemAdminPlan,
  systemAdminService,
} from "../../services/systemAdminService";
import {
  Alert,
  Button,
  EmptyState,
  PageHeader,
  SearchInput,
  Spinner,
  StatusBadge,
} from "./components";
import PlanFormModal from "./PlanFormModal";
import {
  formatCurrencyFromCents,
  formatDate,
  planTypeLabel,
} from "./utils";

type PlanWithModules = SystemAdminPlan & { moduleKeys: string[] };

interface Props {
  refreshKey: number;
  onDataChanged: () => void;
}

export default function PlansTab({ refreshKey, onDataChanged }: Props) {
  const [plans, setPlans] = useState<PlanWithModules[]>([]);
  const [modules, setModules] = useState<SystemAdminModule[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SystemAdminPlan | null>(null);

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const [planList, moduleList] = await Promise.all([
        systemAdminService.listPlans(),
        systemAdminService.listModules(),
      ]);
      const withModules = await Promise.all(
        planList.map(async (plan) => ({
          ...plan,
          moduleKeys: await systemAdminService.listPlanModules(plan.id).catch(() => []),
        }))
      );
      setPlans(withModules);
      setModules(moduleList);
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar os planos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const moduleNames = useMemo(
    () => new Map(modules.map((module) => [module.module_key, module.name])),
    [modules]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return plans;
    return plans.filter((plan) =>
      [plan.name, plan.description, plan.type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [plans, search]);

  const activePlans = plans.filter((plan) => plan.active).length;
  const monthlyPlans = plans.filter((plan) => plan.type === "monthly").length;
  const yearlyPlans = plans.filter((plan) => plan.type === "yearly").length;

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (plan: SystemAdminPlan) => {
    setEditing(plan);
    setModalOpen(true);
  };

  const handleSaved = async () => {
    await load(false);
    onDataChanged();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Planos e módulos"
        description="Configure os planos comerciais e os módulos liberados para as empresas."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => load()} disabled={loading}>
              <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Atualizar
            </Button>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              Novo plano
            </Button>
          </div>
        }
      />

      {error ? <Alert>{error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Planos ativos
              </p>
              <p className="text-xl font-bold text-slate-900">{activePlans}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Planos mensais
              </p>
              <p className="text-xl font-bold text-slate-900">{monthlyPlans}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Planos anuais
              </p>
              <p className="text-xl font-bold text-slate-900">{yearlyPlans}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nome, descrição ou tipo..."
            className="w-full sm:max-w-md"
          />
          <p className="text-xs text-slate-400">
            {plans.length} plano(s) · {modules.length} módulo(s) disponíveis
          </p>
        </div>

        {loading && plans.length === 0 ? (
          <Spinner label="Carregando planos..." />
        ) : filtered.length === 0 ? (
          <div className="p-5">
            {plans.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="Nenhum plano cadastrado"
                description="Crie um plano para poder vincular assinaturas às empresas."
                action={
                  <Button size="sm" onClick={openNew}>
                    <Plus className="h-4 w-4" />
                    Novo plano
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={SearchX}
                title="Nenhum plano encontrado"
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
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Plano</th>
                  <th className="px-5 py-3 font-semibold">Tipo</th>
                  <th className="px-5 py-3 font-semibold">Preço</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Módulos</th>
                  <th className="px-5 py-3 font-semibold">Criado em</th>
                  <th className="px-5 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((plan) => (
                  <tr key={plan.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">{plan.name}</p>
                      <p className="max-w-xs truncate text-xs text-slate-400">
                        {plan.description || "Sem descrição"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {planTypeLabel[plan.type]}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-600">
                      {formatCurrencyFromCents(plan.price_cents, plan.currency)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        label={plan.active ? "Ativo" : "Inativo"}
                        className={
                          plan.active
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-slate-100 text-slate-500 ring-slate-200"
                        }
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {plan.moduleKeys.length === 0 ? (
                          <span className="text-xs text-slate-400">Nenhum módulo</span>
                        ) : (
                          <>
                            {plan.moduleKeys.slice(0, 4).map((key) => (
                              <span
                                key={key}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                              >
                                {moduleNames.get(key) || key}
                              </span>
                            ))}
                            {plan.moduleKeys.length > 4 ? (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                +{plan.moduleKeys.length - 4}
                              </span>
                            ) : null}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {formatDate(plan.created_at)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(plan)}
                        aria-label={`Editar plano ${plan.name}`}
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

      <PlanFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        plan={editing}
        modules={modules}
        onSaved={handleSaved}
      />
    </div>
  );
}
