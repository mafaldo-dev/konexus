import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CreditCard,
  Eye,
  Headphones,
  Plus,
  Power,
  RefreshCw,
  RotateCcw,
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
  Field,
  Modal,
  PageHeader,
  SearchInput,
  Spinner,
  StatusBadge,
  Textarea,
} from "./components";
import {
  formatCurrencyFromCents,
  formatDate,
  formatDateTime,
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

type CompanyStatusView = "active" | "inactive";

export default function CompaniesTab({
  refreshKey,
  onNewCompany,
  onManageSubscription,
  onManageSupport,
}: Props) {
  const [companies, setCompanies] = useState<SystemAdminCompany[]>([]);
  const [statusView, setStatusView] = useState<CompanyStatusView>("active");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [detailsCompanyId, setDetailsCompanyId] = useState<number | null>(null);
  const [statusCompany, setStatusCompany] = useState<SystemAdminCompany | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

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

  const activeCompanies = useMemo(
    () => companies.filter((company) => company.active !== false),
    [companies]
  );
  const inactiveCompanies = useMemo(
    () => companies.filter((company) => company.active === false),
    [companies]
  );
  const visibleCompanies =
    statusView === "active" ? activeCompanies : inactiveCompanies;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return visibleCompanies;
    return visibleCompanies.filter((company) =>
      [
        company.name,
        company.cnpj,
        company.plan_name,
        company.email,
        company.deactivation_reason,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [visibleCompanies, search]);

  const activeSubscriptions = activeCompanies.filter(
    (company) => company.subscription_status === "active"
  ).length;
  const activeSupport = activeCompanies.filter(
    (company) => company.support_status === "active"
  ).length;

  const openStatusDialog = (company: SystemAdminCompany) => {
    setStatusCompany(company);
    setStatusReason("");
    setStatusError(null);
    setNotice(null);
  };

  const closeStatusDialog = () => {
    if (statusSaving) return;
    setStatusCompany(null);
    setStatusReason("");
    setStatusError(null);
  };

  const submitStatus = async () => {
    if (!statusCompany) return;
    const company = statusCompany;
    const nextActive = company.active === false;

    setStatusSaving(true);
    setStatusError(null);
    setNotice(null);
    try {
      await systemAdminService.setCompanyActive(
        company.id,
        nextActive,
        nextActive ? null : statusReason
      );
      setStatusCompany(null);
      setStatusReason("");
      setNotice(
        nextActive
          ? `${company.name} foi reativada e voltou para a lista de empresas ativas.`
          : `${company.name} foi desativada. As sessões abertas foram encerradas e os dados foram preservados.`
      );
      await load();
    } catch (err: any) {
      setStatusError(
        err.message ||
          `Não foi possível ${nextActive ? "reativar" : "desativar"} a empresa.`
      );
    } finally {
      setStatusSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Empresas"
        description={`${activeCompanies.length} ativa(s) · ${inactiveCompanies.length} desativada(s) · ${activeSubscriptions} assinatura(s) ativa(s) · ${activeSupport} suporte(s) ativo(s).`}
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
      {notice ? <Alert variant="success">{notice}</Alert> : null}

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="space-y-3 border-b border-slate-100 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setStatusView("active");
                  setSearch("");
                  setNotice(null);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusView === "active"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Ativas ({activeCompanies.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusView("inactive");
                  setSearch("");
                  setNotice(null);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusView === "inactive"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Desativadas ({inactiveCompanies.length})
              </button>
            </div>

            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={
                statusView === "active"
                  ? "Buscar empresa ativa, CNPJ ou plano..."
                  : "Buscar empresa desativada, CNPJ ou motivo..."
              }
              className="w-full sm:max-w-md"
            />
          </div>
          <p className="text-xs text-slate-400">
            {statusView === "active"
              ? "O usuário admin de cada empresa é criado junto com o cadastro."
              : "Empresas desativadas ficam preservadas para controle interno e podem ser reativadas."}
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
            ) : search.trim() ? (
              <EmptyState
                icon={SearchX}
                title="Nenhuma empresa encontrada"
                description="Tente buscar por outro nome, CNPJ, plano ou motivo."
                action={
                  <Button size="sm" variant="outline" onClick={() => setSearch("")}>
                    Limpar busca
                  </Button>
                }
              />
            ) : statusView === "active" ? (
              <EmptyState
                icon={Building2}
                title="Nenhuma empresa ativa"
                description="Todas as empresas estão desativadas. Consulte a aba Desativadas para reativar."
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatusView("inactive")}
                  >
                    Ver desativadas
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Building2}
                title="Nenhuma empresa desativada"
                description="As empresas desativadas aparecerão aqui para controle interno."
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatusView("active")}
                  >
                    Ver ativas
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Empresa</th>
                  <th className="px-5 py-3 font-semibold">Plano</th>
                  <th className="px-5 py-3 font-semibold">Assinatura</th>
                  <th className="px-5 py-3 font-semibold">Suporte</th>
                  <th className="px-5 py-3 font-semibold">Usuários</th>
                  {statusView === "inactive" ? (
                    <th className="px-5 py-3 font-semibold">Desativada em</th>
                  ) : null}
                  <th className="px-5 py-3 font-semibold">Criada em</th>
                  <th className="px-5 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((company) => (
                  <tr
                    key={company.id}
                    className={`transition hover:bg-slate-50/70 ${
                      company.active === false ? "bg-rose-50/20" : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <CompanyAvatar name={company.name} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {company.name}
                            </p>
                            {company.active === false ? (
                              <StatusBadge
                                label="Desativada"
                                className="bg-rose-50 text-rose-700 ring-rose-200"
                              />
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-slate-400">
                            {company.cnpj || company.email || "Sem CNPJ/e-mail"}
                          </p>
                          {company.active === false && company.deactivation_reason ? (
                            <p className="truncate text-[11px] text-rose-500">
                              Motivo: {company.deactivation_reason}
                            </p>
                          ) : null}
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
                    {statusView === "inactive" ? (
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formatDateTime(company.deactivated_at)}
                      </td>
                    ) : null}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openStatusDialog(company)}
                          className={
                            company.active === false
                              ? "text-emerald-700 hover:bg-emerald-50"
                              : "text-rose-600 hover:bg-rose-50"
                          }
                          title={
                            company.active === false
                              ? "Reativar empresa"
                              : "Desativar empresa"
                          }
                          aria-label={
                            company.active === false
                              ? `Reativar ${company.name}`
                              : `Desativar ${company.name}`
                          }
                        >
                          {company.active === false ? (
                            <RotateCcw className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                          <span className="hidden xl:inline">
                            {company.active === false ? "Reativar" : "Desativar"}
                          </span>
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

      <Modal
        open={statusCompany !== null}
        onClose={closeStatusDialog}
        title={
          statusCompany?.active === false ? "Reativar empresa" : "Desativar empresa"
        }
        description={
          statusCompany?.active === false
            ? "A empresa voltará para a lista de ativas e poderá receber novos acessos."
            : "A empresa sairá da lista de ativas e ficará disponível na aba Desativadas."
        }
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={closeStatusDialog}
              disabled={statusSaving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant={statusCompany?.active === false ? "primary" : "danger"}
              loading={statusSaving}
              onClick={submitStatus}
            >
              {statusCompany?.active === false ? (
                <RotateCcw className="h-4 w-4" />
              ) : (
                <Power className="h-4 w-4" />
              )}
              {statusCompany?.active === false ? "Reativar empresa" : "Desativar empresa"}
            </Button>
          </>
        }
      >
        {statusError ? <Alert>{statusError}</Alert> : null}

        {statusCompany ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-sm font-bold text-slate-900">{statusCompany.name}</p>
              <p className="text-xs text-slate-500">
                {statusCompany.cnpj || "CNPJ não informado"} · ID #{statusCompany.id}
              </p>
            </div>

            {statusCompany.active === false ? (
              <p className="text-sm leading-relaxed text-slate-600">
                A empresa volta a aparecer em <strong>Empresas &gt; Ativas</strong>.
                Os usuários poderão entrar novamente com as credenciais existentes;
                as sessões encerradas na desativação não são restauradas.
              </p>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-slate-600">
                  As sessões abertas serão encerradas, novos logins ficarão bloqueados
                  e a empresa sairá da lista de ativas. Nenhum dado, documento ou
                  histórico será excluído.
                </p>
                <Field
                  label="Motivo (opcional)"
                  hint="Registrado na auditoria para controle interno."
                >
                  <Textarea
                    value={statusReason}
                    onChange={(event) => setStatusReason(event.target.value)}
                    rows={3}
                    maxLength={300}
                    placeholder="Ex.: solicitação comercial, encerramento de contrato, inadimplência..."
                  />
                </Field>
              </>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
