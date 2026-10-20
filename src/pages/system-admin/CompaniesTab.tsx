import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CreditCard,
  Eye,
  Headphones,
  Plus,
  RefreshCw,
  SearchX,
} from "lucide-react";
import {
  SystemAdminCompany,
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
import {
  formatCurrencyFromCents,
  formatDate,
  subscriptionStatusLabel,
  subscriptionTone,
  supportStatusLabel,
  supportTone,
} from "./utils";
import CompanyDetailsModal from "./CompanyDetailsModal";

interface Props {
  refreshKey: number;
  onNewCompany: () => void;
  onManageSubscription: (companyId: number) => void;
  onManageSupport: (companyId: number) => void;
}

export default function CompaniesTab({
  refreshKey,
  onNewCompany,
  onManageSubscription,
  onManageSupport,
}: Props) {
  const [companies, setCompanies] = useState<SystemAdminCompany[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsCompanyId, setDetailsCompanyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setCompanies(await systemAdminService.listCompanies());
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar as empresas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter((company) =>
      [company.name, company.cnpj, company.plan_name, company.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [companies, search]);

  const activeSubscriptions = companies.filter(
    (company) => company.subscription_status === "active"
  ).length;
  const activeSupport = companies.filter(
    (company) => company.support_status === "active"
  ).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Empresas"
        description={`${companies.length} empresa(s) cadastrada(s) · ${activeSubscriptions} assinatura(s) ativa(s) · ${activeSupport} suporte(s) ativo(s).`}
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

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por empresa, CNPJ ou plano..."
            className="w-full sm:max-w-md"
          />
          <p className="text-xs text-slate-400">
            O usuário admin de cada empresa é criado junto com o cadastro.
          </p>
        </div>

        {loading && companies.length === 0 ? (
          <Spinner label="Carregando empresas..." />
        ) : filtered.length === 0 ? (
          <div className="p-5">
            {companies.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="Nenhuma empresa cadastrada"
                description="Cadastre a primeira empresa e o usuário administrador dela."
                action={
                  <Button size="sm" onClick={onNewCompany}>
                    <Plus className="h-4 w-4" />
                    Nova empresa
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={SearchX}
                title="Nenhuma empresa encontrada"
                description="Tente buscar por outro nome, CNPJ ou plano."
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
            <table className="w-full min-w-[1080px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Empresa</th>
                  <th className="px-5 py-3 font-semibold">Plano</th>
                  <th className="px-5 py-3 font-semibold">Assinatura</th>
                  <th className="px-5 py-3 font-semibold">Suporte</th>
                  <th className="px-5 py-3 font-semibold">Usuários</th>
                  <th className="px-5 py-3 font-semibold">Criada em</th>
                  <th className="px-5 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((company) => (
                  <tr key={company.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <CompanyAvatar name={company.name} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {company.name}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {company.cnpj || company.email || "Sem CNPJ/e-mail"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-700">
                        {company.plan_name || "Sem plano"}
                      </p>
                      {company.plan_price_cents !== null ? (
                        <p className="text-xs text-slate-400">
                          {formatCurrencyFromCents(
                            company.plan_price_cents,
                            company.plan_currency || "BRL"
                          )}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      {company.subscription_status ? (
                        <StatusBadge
                          label={subscriptionStatusLabel[company.subscription_status]}
                          className={subscriptionTone(company.subscription_status)}
                        />
                      ) : (
                        <span className="text-xs text-slate-400">Sem assinatura</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {company.support_status ? (
                        <StatusBadge
                          label={supportStatusLabel[company.support_status]}
                          className={supportTone(company.support_status)}
                        />
                      ) : (
                        <span className="text-xs text-slate-400">Sem contrato</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-600">
                      {company.users_count}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {formatDate(company.createdat)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailsCompanyId(company.id)}
                          title="Ver detalhes"
                          aria-label={`Ver detalhes de ${company.name}`}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden xl:inline">Detalhes</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onManageSubscription(company.id)}
                          title={
                            company.subscription_id
                              ? "Gerenciar assinatura"
                              : "Criar assinatura"
                          }
                          aria-label={
                            company.subscription_id
                              ? `Gerenciar assinatura de ${company.name}`
                              : `Criar assinatura para ${company.name}`
                          }
                        >
                          <CreditCard className="h-4 w-4" />
                          <span className="hidden xl:inline">Assinatura</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onManageSupport(company.id)}
                          title={company.support_id ? "Gerenciar suporte" : "Registrar suporte"}
                          aria-label={
                            company.support_id
                              ? `Gerenciar suporte de ${company.name}`
                              : `Registrar suporte para ${company.name}`
                          }
                        >
                          <Headphones className="h-4 w-4" />
                          <span className="hidden xl:inline">Suporte</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CompanyDetailsModal
        open={detailsCompanyId !== null}
        companyId={detailsCompanyId}
        onClose={() => setDetailsCompanyId(null)}
      />
    </div>
  );
}
