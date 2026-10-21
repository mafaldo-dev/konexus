import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  BadgeDollarSign,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  FileClock,
  Headphones,
  History,
  KeyRound,
  Loader2,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import Swal from "sweetalert2";
import Dashboard from "../../../components/dashboard/Dashboard";
import { useAuth } from "../../../AuthContext";
import {
  Collaborator,
  CommercialAuthorization,
  CompanyRole,
  ContributorEvent,
  deactivateCompanyRole,
  getCommercialOverview,
  getPermissionsCatalog,
  getCollaboratorUsage,
  listCollaboratorAuthorizations,
  listCollaborators,
  listCompanyRoles,
  listContributorEvents,
  listPasswordResetEvents,
  PasswordResetEvent,
  PermissionCatalogModule,
  removeCollaborator,
  resetCollaboratorPassword,
  CommercialOverview,
  CollaboratorUsage,
} from "../../../services/collaboratorService";
import CollaboratorFormModal from "./components/CollaboratorFormModal";
import PermissionsModal from "./components/PermissionsModal";
import RoleFormModal from "./components/RoleFormModal";
import TemporaryPasswordModal from "./components/TemporaryPasswordModal";
import EmploymentModal from "./components/EmploymentModal";

type TabKey = "collaborators" | "roles" | "usage" | "audit";

const tabs: Array<{ key: TabKey; label: string; icon: typeof Users }> = [
  { key: "collaborators", label: "Colaboradores", icon: Users },
  { key: "roles", label: "Cargos e permissões", icon: ShieldCheck },
  { key: "usage", label: "Uso e limites", icon: WalletCards },
  { key: "audit", label: "Auditoria", icon: History },
];

const actionLabels: Record<string, string> = {
  collaborator_created: "Colaborador criado",
  collaborator_updated: "Colaborador atualizado",
  collaborator_removed: "Colaborador removido",
  collaborator_role_reassigned: "Colaborador transferido de cargo",
  password_reset: "Senha redefinida pelo administrador",
  password_changed: "Senha alterada pelo próprio colaborador",
  role_created: "Cargo criado",
  role_updated: "Cargo atualizado",
  role_deactivated: "Cargo desativado",
  permissions_updated: "Permissões individuais atualizadas",
};

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR");
}

function formatCnpj(value?: string | null): string {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 14) return value || "CNPJ não informado";
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function authorizationLabel(type: string): string {
  if (type === "extra_user") return "Conta adicional";
  if (type === "password_reset") return "Redefinição de senha";
  if (type === "extra_module") return "Módulo extra";
  return type;
}

function authorizationTone(status: string): string {
  if (status === "active") return "bg-emerald-50 text-emerald-700";
  if (status === "consumed") return "bg-blue-50 text-blue-700";
  if (status === "revoked") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

function moduleStatusLabel(status: string | null): string {
  if (status === "active") return "Contratado";
  if (status === "suspended") return "Suspenso";
  if (status === "cancelled") return "Cancelado";
  if (status === "pending") return "Pendente";
  return "Não contratado";
}

export default function UserManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("collaborators");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [usage, setUsage] = useState<CollaboratorUsage | null>(null);
  const [overview, setOverview] = useState<CommercialOverview | null>(null);
  const [authorizations, setAuthorizations] = useState<CommercialAuthorization[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalogModule[]>([]);
  const [events, setEvents] = useState<ContributorEvent[]>([]);
  const [resetHistory, setResetHistory] = useState<PasswordResetEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [collaboratorModalOpen, setCollaboratorModalOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
  const [permissionsCollaborator, setPermissionsCollaborator] = useState<Collaborator | null>(null);
  const [employmentCollaborator, setEmploymentCollaborator] = useState<Collaborator | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CompanyRole | null>(null);
  const [temporary, setTemporary] = useState<{
    username: string;
    password: string;
    isFree: boolean;
    amountCents: number;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [
      collaboratorsResponse,
      rolesResponse,
      usageResponse,
      overviewResponse,
      authorizationsResponse,
      catalogResponse,
      eventsResponse,
      resetsResponse,
    ] = await Promise.all([
      listCollaborators(),
      listCompanyRoles(),
      getCollaboratorUsage(),
      getCommercialOverview(),
      listCollaboratorAuthorizations(),
      getPermissionsCatalog(),
      listContributorEvents(150),
      listPasswordResetEvents(80),
    ]);

    const firstError =
      (!collaboratorsResponse.ok && collaboratorsResponse.error) ||
      (!rolesResponse.ok && rolesResponse.error) ||
      (!usageResponse.ok && usageResponse.error) ||
      (!overviewResponse.ok && overviewResponse.error) ||
      (!catalogResponse.ok && catalogResponse.error) ||
      null;

    if (collaboratorsResponse.ok) setCollaborators(collaboratorsResponse.data || []);
    if (rolesResponse.ok) setRoles(rolesResponse.data || []);
    if (usageResponse.ok) setUsage(usageResponse.data);
    if (overviewResponse.ok) setOverview(overviewResponse.data);
    if (authorizationsResponse.ok) setAuthorizations(authorizationsResponse.data || []);
    if (catalogResponse.ok) setCatalog(catalogResponse.data || []);
    if (eventsResponse.ok) setEvents(eventsResponse.data || []);
    if (resetsResponse.ok) setResetHistory(resetsResponse.data || []);
    setError(firstError);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeCollaborators = collaborators.filter((item) => item.active);
  const adminAccounts = collaborators.filter((item) => item.is_system_admin);
  const accountQuota = usage?.accounts || overview?.usage.accounts;
  const resetQuota = usage?.passwordResets || overview?.usage.passwordResets;
  const catalogByModule = useMemo(
    () => new Map(catalog.map((module) => [module.key, module])),
    [catalog]
  );

  const openCreate = () => {
    setEditingCollaborator(null);
    setCollaboratorModalOpen(true);
  };

  const openEdit = (collaborator: Collaborator) => {
    setEditingCollaborator(collaborator);
    setCollaboratorModalOpen(true);
  };

  const handleResetPassword = async (collaborator: Collaborator) => {
    const confirmed = await Swal.fire({
      title: `Redefinir senha de ${collaborator.username}?`,
      html:
        `<div style="text-align:left;font-size:14px;line-height:1.5">` +
        `<p>A senha atual será invalidada imediatamente e as sessões abertas serão encerradas.</p>` +
        `<p>O sistema gerará uma senha temporária, exibida <strong>uma única vez</strong>.</p>` +
        `<p style="margin-top:8px;color:#64748b">Franquia mensal: ${
          resetQuota?.freeLimit ?? 3
        } gratuitas. Uso atual: ${resetQuota?.used ?? 0}. ${
          resetQuota?.freeExhausted
            ? "A próxima redefinição depende de autorização comercial do suporte."
            : "As próximas dentro da franquia são gratuitas."
        }</p></div>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Gerar senha temporária",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#2563eb",
    });

    if (!confirmed.isConfirmed) return;

    const response = await resetCollaboratorPassword(collaborator.id, "Redefinição administrativa");
    if (!response.ok || !response.data) {
      await Swal.fire({
        title: "Redefinição não realizada",
        text: response.error || "Não foi possível redefinir a senha.",
        icon: "error",
        confirmButtonText: "Entendi",
      });
      return;
    }

    setTemporary({
      username: response.data.collaborator.username,
      password: response.data.temporaryPassword,
      isFree: response.data.charge.isFree,
      amountCents: response.data.charge.amountCents,
    });
    await load();
  };

  const handleRemove = async (collaborator: Collaborator) => {
    const confirmed = await Swal.fire({
      title: `Remover ${collaborator.username}?`,
      html:
        `<div style="text-align:left;font-size:14px;line-height:1.5">` +
        `<p>O acesso e as sessões serão revogados imediatamente. O histórico será preservado.</p>` +
        `<p style="margin-top:8px;color:#92400e;background:#fffbeb;padding:8px;border-radius:8px">` +
        `A remoção tem valor informativo de <strong>R$ 5,00</strong> e não é cobrada automaticamente.</p></div>`,
      icon: "warning",
      input: "text",
      inputLabel: "Motivo da remoção (opcional)",
      inputPlaceholder: "Desligamento, troca de função...",
      showCancelButton: true,
      confirmButtonText: "Remover colaborador",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });

    if (!confirmed.isConfirmed) return;

    const response = await removeCollaborator(
      collaborator.id,
      typeof confirmed.value === "string" ? confirmed.value.trim() : undefined
    );
    if (!response.ok) {
      await Swal.fire({
        title: "Remoção não realizada",
        text: response.error || "Não foi possível remover o colaborador.",
        icon: "error",
      });
      return;
    }

    await Swal.fire({
      title: "Colaborador removido",
      text: response.data?.message || "O acesso foi revogado.",
      icon: "success",
    });
    await load();
  };

  const handleRoleDeactivate = async (role: CompanyRole) => {
    const destinations = roles.filter(
      (item) => item.active && !item.is_system_admin && item.id !== role.id
    );

    if (role.active_collaborators > 0 && destinations.length === 0) {
      await Swal.fire({
        title: "Cargo em uso",
        text: "Este cargo possui colaboradores ativos e não há outro cargo ativo para recebê-los. Crie ou reative um cargo de destino antes.",
        icon: "error",
      });
      return;
    }

    const options = destinations
      .map((item) => `<option value="${item.id}">${item.name}</option>`)
      .join("");

    const confirmed = await Swal.fire({
      title: `Desativar o cargo ${role.name}?`,
      html:
        `<div style="text-align:left;font-size:14px;line-height:1.5">` +
        `<p>O cargo não poderá ser usado em novos vínculos.</p>` +
        (role.active_collaborators > 0
          ? `<p>${role.active_collaborators} colaborador(es) ativo(s) serão transferidos para o cargo de destino:</p>` +
            `<select id="reassign-role" class="swal2-select" style="width:100%;margin-top:8px">${options}</select>`
          : "") +
        `</div>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Desativar cargo",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      preConfirm: () => {
        if (role.active_collaborators > 0) {
          const select = document.getElementById("reassign-role") as HTMLSelectElement | null;
          return select?.value || null;
        }
        return null;
      },
    });

    if (!confirmed.isConfirmed) return;

    const response = await deactivateCompanyRole(
      role.id,
      confirmed.value ? Number(confirmed.value) : undefined
    );
    if (!response.ok) {
      await Swal.fire({
        title: "Cargo não desativado",
        text: response.error || "Não foi possível desativar o cargo.",
        icon: "error",
      });
      return;
    }

    await load();
  };

  return (
    <Dashboard>
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                <LockKeyhole className="h-4 w-4" />
                Administração da empresa
              </div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Usuários e permissões
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Gerencie contas, cargos, permissões granulares e acompanhe os
                limites comerciais. Toda autorização é validada novamente no
                backend.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                {activeCollaborators.length} contas ativas
                {accountQuota ? ` / ${accountQuota.freeLimit} gratuitas` : ""}
              </span>
              <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                {resetQuota ? `${resetQuota.used} redefinições no mês` : "Franquia mensal"}
              </span>
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
          </div>

          {error ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <span className="inline-flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </span>
              <button onClick={load} className="font-semibold underline">
                Tentar novamente
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                    selected
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {loading && collaborators.length === 0 ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-20 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando dados de colaboradores...
            </div>
          ) : null}

          {activeTab === "collaborators" && !(loading && collaborators.length === 0) ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Contas da empresa</h2>
                  <p className="text-xs text-slate-500">
                    {adminAccounts.length} conta(s) administrativa(s) protegida(s).
                    O limite gratuito inclui a conta administrativa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Novo colaborador
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Colaborador</th>
                        <th className="px-4 py-3 font-semibold">Cargo</th>
                        <th className="px-4 py-3 font-semibold">Empregador / vínculo</th>
                        <th className="px-4 py-3 font-semibold">Tipo</th>
                        <th className="px-4 py-3 font-semibold">Situação</th>
                        <th className="px-4 py-3 font-semibold">Ajustes</th>
                        <th className="px-4 py-3 text-right font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {collaborators.map((collaborator) => {
                        const isSelf = String(collaborator.id) === String(user?.id);
                        const isProtectedAdmin = collaborator.is_system_admin;
                        return (
                          <tr key={collaborator.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                                  {collaborator.username.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-800">
                                    {collaborator.username}
                                    {isSelf ? (
                                      <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                                        você
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    {collaborator.sector || "Sem setor informado"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {collaborator.role_name || collaborator.role}
                            </td>
                            <td className="px-4 py-3">
                              {collaborator.employer_legal_name ? (
                                <div>
                                  <p className="font-semibold text-slate-700">
                                    {collaborator.employer_trade_name || collaborator.employer_legal_name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatCnpj(collaborator.employer_cnpj)}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {[collaborator.position_title, collaborator.department, collaborator.cost_center]
                                      .filter(Boolean)
                                      .join(" · ") || "Sem cargo/departamento"}
                                  </p>
                                </div>
                              ) : (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                  Sem vínculo ativo
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                  isProtectedAdmin
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {isProtectedAdmin ? "Administrador" : "Colaborador"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                    collaborator.active
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-rose-50 text-rose-700"
                                  }`}
                                >
                                  {collaborator.active ? "Ativo" : "Removido/inativo"}
                                </span>
                                {collaborator.passwordmustchange ? (
                                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                    Senha provisória
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {collaborator.overrides_count > 0
                                ? `${collaborator.overrides_count} individual(is)`
                                : "Cargo padrão"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEdit(collaborator)}
                                  disabled={!collaborator.active}
                                  title="Editar colaborador"
                                  aria-label="Editar colaborador"
                                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEmploymentCollaborator(collaborator)}
                                  disabled={!collaborator.active}
                                  title="Vínculo empregatício"
                                  aria-label="Vínculo empregatício"
                                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  <BriefcaseBusiness className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPermissionsCollaborator(collaborator)}
                                  disabled={!collaborator.active}
                                  title="Gerenciar permissões"
                                  aria-label="Gerenciar permissões"
                                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  <ShieldCheck className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResetPassword(collaborator)}
                                  disabled={!collaborator.active || isProtectedAdmin || isSelf}
                                  title={
                                    isProtectedAdmin || isSelf
                                      ? "Contas administrativas alteram a própria senha"
                                      : "Redefinir senha"
                                  }
                                  aria-label="Redefinir senha"
                                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  <KeyRound className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemove(collaborator)}
                                  disabled={!collaborator.active || isProtectedAdmin || isSelf}
                                  title={
                                    isProtectedAdmin || isSelf
                                      ? "A conta administrativa não pode ser removida por este fluxo"
                                      : "Remover colaborador"
                                  }
                                  aria-label="Remover colaborador"
                                  className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {collaborators.length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-500">
                    Nenhum colaborador cadastrado.
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <WalletCards className="h-4 w-4 text-blue-600" />
                    Contas ativas
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {accountQuota?.activeAccounts ?? activeCollaborators.length}
                    <span className="ml-1 text-sm font-medium text-slate-400">
                      / {accountQuota?.freeLimit ?? 5} gratuitas
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {accountQuota?.limitReached
                      ? "Limite atingido. Novas contas exigem autorização do suporte."
                      : `${accountQuota?.freeRemaining ?? 0} vaga(s) gratuita(s).`}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <KeyRound className="h-4 w-4 text-amber-600" />
                    Redefinições de senha
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {resetQuota?.used ?? 0}
                    <span className="ml-1 text-sm font-medium text-slate-400">
                      / {resetQuota?.freeLimit ?? 3} gratuitas
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {resetQuota?.freeExhausted
                      ? `Próxima redefinição: ${formatMoney(resetQuota.extraPriceCents)} com autorização.`
                      : `${resetQuota?.remaining ?? 0} redefinição(ões) gratuita(s) restante(s).`}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <BadgeDollarSign className="h-4 w-4 text-emerald-600" />
                    Remoção de conta
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatMoney(accountQuota?.removalPriceCents ?? 500)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Valor informativo por operação. Sem cobrança automática.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "roles" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Cargos personalizados</h2>
                  <p className="text-xs text-slate-500">
                    Crie cargos com conjuntos próprios de permissões. O nome do
                    cargo nunca concede acesso por si só.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRole(null);
                    setRoleModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Novo cargo
                </button>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {roles.map((role) => {
                  const permissionCount = role.permissions.reduce(
                    (total, item) => total + item.actions.length,
                    0
                  );
                  return (
                    <div
                      key={role.id}
                      className={`rounded-2xl border bg-white p-4 ${
                        role.active ? "border-slate-200" : "border-slate-200 opacity-75"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              role.is_system_admin
                                ? "bg-indigo-50 text-indigo-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {role.is_system_admin ? (
                              <ShieldCheck className="h-5 w-5" />
                            ) : (
                              <Users className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-slate-900">{role.name}</h3>
                              {role.is_system_admin ? (
                                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                  Protegido
                                </span>
                              ) : null}
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  role.active
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {role.active ? "Ativo" : "Inativo"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {role.description || "Sem descrição"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          <div className="font-semibold text-slate-700">
                            {role.active_collaborators} ativo(s)
                          </div>
                          <div>{role.total_collaborators} vínculo(s)</div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {role.permissions.length === 0 ? (
                          <span className="text-xs text-slate-400">Nenhuma permissão</span>
                        ) : (
                          role.permissions.map((group) => (
                            <span
                              key={group.moduleKey}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                            >
                              {catalogByModule.get(group.moduleKey)?.name || group.moduleKey}
                              : {group.actions.length}
                            </span>
                          ))
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-xs text-slate-400">
                          {permissionCount} ação(ões) permitida(s)
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRole(role);
                              setRoleModalOpen(true);
                            }}
                            disabled={role.is_system_admin}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRoleDeactivate(role)}
                            disabled={role.is_system_admin || !role.active}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ShieldOff className="h-3.5 w-3.5" />
                            Desativar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {activeTab === "usage" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Uso e regras comerciais</h2>
                <p className="text-xs text-slate-500">
                  A cobrança de adicionais é informativa e depende de autorização
                  registrada pelo suporte. Nenhum checkout é executado aqui.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <Users className="h-5 w-5 text-blue-600" />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Contas ativas
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {accountQuota?.activeAccounts ?? 0}
                  </p>
                  <p className="text-xs text-slate-500">
                    {accountQuota?.freeRemaining ?? 0} gratuita(s) restante(s)
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Conta adicional
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {formatMoney(accountQuota?.extraUserPriceCents ?? 500)}
                  </p>
                  <p className="text-xs text-slate-500">Sujeita a autorização do suporte</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <KeyRound className="h-5 w-5 text-amber-600" />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Redefinições no mês
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {resetQuota?.used ?? 0}
                  </p>
                  <p className="text-xs text-slate-500">
                    {resetQuota?.remaining ?? 0} gratuita(s) restante(s)
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <BadgeDollarSign className="h-5 w-5 text-rose-600" />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Redefinição adicional
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {formatMoney(resetQuota?.extraPriceCents ?? 350)}
                  </p>
                  <p className="text-xs text-slate-500">Valor informativo, sem cobrança automática</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-bold text-slate-900">Módulos padrão</h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Incluídos para todas as empresas, independentemente de plano
                    ou contratação extra.
                  </p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(overview?.standardModules || []).map((module) => (
                      <li
                        key={module.key}
                        className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        {module.name}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2">
                    <WalletCards className="h-5 w-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900">Módulos extras independentes</h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    A contratação é por módulo. A permissão individual só libera
                    o acesso quando a empresa possui contratação ativa.
                  </p>
                  <div className="mt-3 space-y-2">
                    {(overview?.extraModules || []).map((module) => (
                      <div
                        key={module.key}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{module.name}</p>
                          <p className="text-xs text-slate-500">
                            {module.available
                              ? "Contratação ativa"
                              : "Não libera acesso até a contratação"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            module.available
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {moduleStatusLabel(module.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileClock className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900">Autorizações comerciais</h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    Registradas pelo suporte global
                  </span>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Tipo</th>
                        <th className="px-3 py-2 font-semibold">Saldo</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                        <th className="px-3 py-2 font-semibold">Responsável</th>
                        <th className="px-3 py-2 font-semibold">Criada em</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {authorizations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-xs text-slate-500">
                            Nenhuma autorização registrada para esta empresa.
                          </td>
                        </tr>
                      ) : (
                        authorizations.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2 text-slate-700">
                              {authorizationLabel(item.authorization_type)}
                              {item.module_key ? ` · ${item.module_key}` : ""}
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {Math.max(0, item.quantity - item.consumed_quantity)} de {item.quantity}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${authorizationTone(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-600">{item.responsible}</td>
                            <td className="px-3 py-2 text-slate-500">{formatDate(item.created_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <Headphones className="mt-0.5 h-5 w-5 text-blue-700" />
                  <div>
                    <h3 className="font-bold text-blue-950">Como solicitar autorização</h3>
                    <p className="mt-1 text-sm text-blue-900">
                      {overview?.support.contact
                        ? `Fale com o suporte pelo canal: ${overview.support.contact}`
                        : overview?.support.message ||
                          "Fale com o administrador global do sistema."}
                    </p>
                    <p className="mt-2 text-xs text-blue-800">
                      A contratação de módulos extras e as autorizações de contas,
                      redefinições e remoções são registradas pelo suporte. O
                      sistema não realiza cobrança automática nem checkout.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "audit" ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-slate-700" />
                  <h2 className="font-bold text-slate-900">Eventos de colaboradores</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Auditoria sem senhas, tokens ou credenciais.
                </p>
                <div className="mt-3 max-h-[560px] space-y-2 overflow-y-auto pr-1">
                  {events.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-500">
                      Nenhum evento registrado.
                    </p>
                  ) : (
                    events.map((event) => (
                      <div key={event.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">
                            {actionLabels[event.action] || event.action}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock3 className="h-3 w-3" />
                            {formatDate(event.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {event.contributor_username || "Empresa"} · por{" "}
                          {event.actor_username || "sistema"}
                        </p>
                        {event.details && Object.keys(event.details).length > 0 ? (
                          <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-2 text-[10px] leading-relaxed text-slate-500">
                            {JSON.stringify(event.details, null, 2)}
                          </pre>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <FileClock className="h-5 w-5 text-slate-700" />
                  <h2 className="font-bold text-slate-900">Histórico de redefinições</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Somente redefinições concluídas entram na franquia mensal.
                </p>
                <div className="mt-3 max-h-[560px] space-y-2 overflow-y-auto pr-1">
                  {resetHistory.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-500">
                      Nenhuma redefinição registrada.
                    </p>
                  ) : (
                    resetHistory.map((event) => (
                      <div key={event.id} className="rounded-xl border border-slate-100 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">
                            {event.contributor_username}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              event.is_free
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {event.is_free ? "Gratuita" : formatMoney(event.amount_cents)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(event.completed_at || event.created_at)} ·{" "}
                          {event.requested_by_username || "sistema"}
                          {event.reason ? ` · ${event.reason}` : ""}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <CollaboratorFormModal
        open={collaboratorModalOpen}
        onClose={() => setCollaboratorModalOpen(false)}
        onSaved={load}
        roles={roles}
        collaborator={editingCollaborator}
        currentUserId={user?.id}
      />

      <EmploymentModal
        open={Boolean(employmentCollaborator)}
        onClose={() => setEmploymentCollaborator(null)}
        collaborator={employmentCollaborator}
        onSaved={load}
      />

      <PermissionsModal
        open={Boolean(permissionsCollaborator)}
        onClose={() => setPermissionsCollaborator(null)}
        collaborator={permissionsCollaborator}
        catalog={catalog}
        onSaved={load}
      />

      <RoleFormModal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        onSaved={load}
        catalog={catalog}
        role={editingRole}
      />

      <TemporaryPasswordModal
        open={Boolean(temporary)}
        onClose={() => setTemporary(null)}
        username={temporary?.username || ""}
        password={temporary?.password || ""}
        isFree={temporary?.isFree ?? true}
        amountCents={temporary?.amountCents ?? 0}
      />
    </Dashboard>
  );
}
