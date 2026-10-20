import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Ban,
  FileCheck2,
  Plus,
  RefreshCw,
  SearchX,
  ShieldCheck,
} from "lucide-react";
import {
  AuthorizationStatus,
  AuthorizationType,
  ExtraModuleKey,
  SystemAdminAuthorization,
  SystemAdminCompany,
  systemAdminService,
} from "../../services/systemAdminService";
import {
  Alert,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Select,
  Spinner,
  StatusBadge,
  Textarea,
} from "./components";
import { formatDateTime } from "./utils";

const typeLabels: Record<AuthorizationType, string> = {
  extra_user: "Conta adicional",
  password_reset: "Redefinição de senha extra",
  extra_module: "Módulo extra",
};

const moduleLabels: Record<ExtraModuleKey, string> = {
  finance: "Financeiro",
  nfe: "NF-e",
  crm: "CRM",
  contabil: "Contabilidade",
};

function statusTone(status: AuthorizationStatus): string {
  if (status === "active") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "consumed") return "bg-blue-50 text-blue-700 ring-blue-200";
  if (status === "revoked") return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

const statusLabels: Record<AuthorizationStatus, string> = {
  active: "Ativa",
  consumed: "Consumida",
  revoked: "Revogada",
  expired: "Expirada",
};

interface Props {
  refreshKey: number;
  initialCompanyId: number | null;
  onPresetConsumed: () => void;
  onDataChanged: () => void;
}

export default function AuthorizationsTab({
  refreshKey,
  initialCompanyId,
  onPresetConsumed,
  onDataChanged,
}: Props) {
  const [authorizations, setAuthorizations] = useState<SystemAdminAuthorization[]>([]);
  const [companies, setCompanies] = useState<SystemAdminCompany[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | AuthorizationStatus>("");
  const [typeFilter, setTypeFilter] = useState<"" | AuthorizationType>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialCompany, setInitialCompany] = useState<number | null>(null);

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const [authorizationList, companyList] = await Promise.all([
        systemAdminService.listAuthorizations(),
        systemAdminService.listCompanies(),
      ]);
      setAuthorizations(authorizationList);
      setCompanies(companyList);
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar as autorizações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useEffect(() => {
    if (!initialCompanyId) return;
    setInitialCompany(initialCompanyId);
    setSearch(
      companies.find((company) => company.id === initialCompanyId)?.name || ""
    );
    setModalOpen(true);
    onPresetConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCompanyId, companies.length]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return authorizations.filter((item) => {
      const matchesTerm =
        !term ||
        `${item.company_name} ${item.responsible} ${item.notes || ""}`
          .toLowerCase()
          .includes(term);
      const matchesStatus = !statusFilter || item.status === statusFilter;
      const matchesType = !typeFilter || item.authorization_type === typeFilter;
      return matchesTerm && matchesStatus && matchesType;
    });
  }, [authorizations, search, statusFilter, typeFilter]);

  const activeCount = authorizations.filter((item) => item.status === "active").length;
  const availableUnits = authorizations
    .filter((item) => item.status === "active")
    .reduce((total, item) => total + Math.max(0, item.quantity - item.consumed_quantity), 0);

  const handleRevoke = async (authorization: SystemAdminAuthorization) => {
    const confirmed = window.confirm(
      `Revogar a autorização #${authorization.id} de ${authorization.company_name}? O saldo restante não poderá ser utilizado.`
    );
    if (!confirmed) return;
    try {
      await systemAdminService.revokeAuthorization(authorization.id);
      await load(false);
      onDataChanged();
    } catch (err: any) {
      setError(err.message || "Não foi possível revogar a autorização.");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Autorizações comerciais"
        description="Registre o saldo autorizado pelo suporte para contas adicionais, redefinições extras e módulos. Nenhuma cobrança automática é executada."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => load()} disabled={loading}>
              <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Atualizar
            </Button>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova autorização
            </Button>
          </div>
        }
      />

      {error ? <Alert>{error}</Alert> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <FileCheck2 className="h-4 w-4 text-blue-600" />
            Autorizações ativas
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Saldo disponível
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{availableUnits}</p>
          <p className="text-xs text-slate-500">unidades ainda não consumidas</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <BadgeDollarSign className="h-4 w-4 text-amber-600" />
            Cobrança
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900">Informativa</p>
          <p className="text-xs text-slate-500">valores registrados sem checkout</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar empresa, responsável ou observação..."
            className="min-w-[240px] flex-1"
          />
          <Select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as "" | AuthorizationType)
            }
            className="w-auto"
          >
            <option value="">Todos os tipos</option>
            <option value="extra_user">Conta adicional</option>
            <option value="password_reset">Redefinição extra</option>
            <option value="extra_module">Módulo extra</option>
          </Select>
          <Select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "" | AuthorizationStatus)
            }
            className="w-auto"
          >
            <option value="">Todos os status</option>
            <option value="active">Ativa</option>
            <option value="consumed">Consumida</option>
            <option value="revoked">Revogada</option>
            <option value="expired">Expirada</option>
          </Select>
        </div>

        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Nenhuma autorização encontrada"
            description="Registre uma autorização para liberar uma operação comercial."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Empresa</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Saldo</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Responsável</th>
                  <th className="px-4 py-3 font-semibold">Criada</th>
                  <th className="px-4 py-3 font-semibold">Validade</th>
                  <th className="px-4 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {item.company_name}
                      {item.notes ? (
                        <span className="mt-0.5 block max-w-xs truncate text-xs font-normal text-slate-500">
                          {item.notes}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {typeLabels[item.authorization_type]}
                      {item.module_key ? (
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {moduleLabels[item.module_key]}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {Math.max(0, item.quantity - item.consumed_quantity)} de {item.quantity}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={statusLabels[item.status]}
                        className={statusTone(item.status)}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.responsible}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDateTime(item.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDateTime(item.expires_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(item)}
                          disabled={item.status !== "active"}
                          title="Revogar saldo restante"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Revogar
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

      <AuthorizationFormModal
        open={modalOpen}
        companies={companies}
        initialCompanyId={initialCompany}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          await load(false);
          onDataChanged();
        }}
      />
    </div>
  );
}

function AuthorizationFormModal({
  open,
  companies,
  initialCompanyId,
  onClose,
  onSaved,
}: {
  open: boolean;
  companies: SystemAdminCompany[];
  initialCompanyId: number | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [companyId, setCompanyId] = useState("");
  const [authorizationType, setAuthorizationType] =
    useState<AuthorizationType>("extra_user");
  const [moduleKey, setModuleKey] = useState<ExtraModuleKey>("finance");
  const [quantity, setQuantity] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCompanyId(String(initialCompanyId || companies[0]?.id || ""));
    setAuthorizationType("extra_user");
    setModuleKey("finance");
    setQuantity("1");
    setExpiresAt("");
    setNotes("");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialCompanyId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!companyId) {
      setError("Selecione a empresa.");
      return;
    }
    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 1000) {
      setError("Informe uma quantidade entre 1 e 1000.");
      return;
    }

    setSaving(true);
    try {
      await systemAdminService.createAuthorization({
        companyId: Number(companyId),
        authorizationType,
        moduleKey: authorizationType === "extra_module" ? moduleKey : null,
        quantity: parsedQuantity,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        notes: notes.trim() || null,
      });
      await onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Não foi possível registrar a autorização.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova autorização comercial"
      description="A autorização libera o saldo, mas não executa cobrança. O consumo ocorre quando a operação é concluída."
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="authorization-form" loading={saving}>
            <ShieldCheck className="h-4 w-4" />
            Registrar autorização
          </Button>
        </>
      }
    >
      <form id="authorization-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <Alert>{error}</Alert> : null}

        <Field label="Empresa" required>
          <Select
            value={companyId}
            onChange={(event) => setCompanyId(event.target.value)}
          >
            <option value="">Selecione uma empresa</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
                {company.cnpj ? ` · ${company.cnpj}` : ""}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo de autorização" required>
            <Select
              value={authorizationType}
              onChange={(event) =>
                setAuthorizationType(event.target.value as AuthorizationType)
              }
            >
              <option value="extra_user">Conta adicional</option>
              <option value="password_reset">Redefinição de senha extra</option>
              <option value="extra_module">Módulo extra</option>
            </Select>
          </Field>
          <Field label="Quantidade" required>
            <Input
              type="number"
              min={1}
              max={1000}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </Field>
        </div>

        {authorizationType === "extra_module" ? (
          <Field label="Módulo extra" required>
            <Select
              value={moduleKey}
              onChange={(event) => setModuleKey(event.target.value as ExtraModuleKey)}
            >
              <option value="finance">Financeiro</option>
              <option value="nfe">NF-e</option>
            </Select>
          </Field>
        ) : null}

        <Field
          label="Validade"
          hint="Opcional. Sem validade, o saldo permanece disponível até ser consumido ou revogado."
        >
          <Input
            type="datetime-local"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
        </Field>

        <Field label="Observação">
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Referência do atendimento, solicitação do cliente..."
          />
        </Field>

        <Alert variant="info">
          Esta autorização não altera módulos extra. Para liberar Financeiro ou
          NF-e, registre também o estado do módulo na aba Módulos extras.
        </Alert>
      </form>
    </Modal>
  );
}
