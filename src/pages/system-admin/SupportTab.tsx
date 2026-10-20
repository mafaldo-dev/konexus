import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Headphones,
  Pencil,
  Plus,
  RefreshCw,
  SearchX,
  XCircle,
} from "lucide-react";
import {
  SystemAdminCompany,
  SystemAdminSupportContract,
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
import SupportFormModal from "./SupportFormModal";
import {
  formatCurrencyFromCents,
  formatDateOnly,
  supportStatusLabel,
  supportTone,
} from "./utils";

interface Props {
  refreshKey: number;
  initialCompanyId: number | null;
  onPresetConsumed: () => void;
  onDataChanged: () => void;
}

export default function SupportTab({
  refreshKey,
  initialCompanyId,
  onPresetConsumed,
  onDataChanged,
}: Props) {
  const [contracts, setContracts] = useState<SystemAdminSupportContract[]>([]);
  const [companies, setCompanies] = useState<SystemAdminCompany[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SystemAdminSupportContract | null>(null);
  const [modalCompanyId, setModalCompanyId] = useState<number | null>(null);
  const handledPreset = useRef<number | null>(null);

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const [contractList, companyList] = await Promise.all([
        systemAdminService.listSupportContracts(),
        systemAdminService.listCompanies(),
      ]);
      setContracts(contractList);
      setCompanies(companyList);
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar os contratos de suporte.");
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

    const contract = contracts.find((item) => item.company_id === initialCompanyId) || null;
    setEditing(contract);
    setModalCompanyId(initialCompanyId);
    setModalOpen(true);
    handledPreset.current = initialCompanyId;
    onPresetConsumed();
  }, [initialCompanyId, loading, contracts, onPresetConsumed]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return contracts;
    return contracts.filter((contract) =>
      [contract.company_name, contract.cnpj, contract.plan_name, contract.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [contracts, search]);

  const active = contracts.filter((item) => item.status === "active").length;
  const pending = contracts.filter((item) => item.status === "pending").length;
  const cancelled = contracts.filter((item) => item.status === "cancelled").length;
  const withoutContract = contracts.filter((item) => !item.id).length;

  const openNew = () => {
    const firstWithout = contracts.find((item) => !item.id) || null;
    setEditing(firstWithout);
    setModalCompanyId(firstWithout?.company_id || null);
    setModalOpen(true);
  };

  const openEdit = (contract: SystemAdminSupportContract) => {
    setEditing(contract);
    setModalCompanyId(contract.company_id);
    setModalOpen(true);
  };

  const handleSaved = async () => {
    await load(false);
    onDataChanged();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Suporte técnico"
        description="Acompanhe as empresas que contrataram suporte para a plataforma."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => load()} disabled={loading}>
              <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Atualizar
            </Button>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              Novo contrato
            </Button>
          </div>
        }
      />

      {error ? <Alert>{error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Ativos
              </p>
              <p className="text-xl font-bold text-slate-900">{active}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Pendentes
              </p>
              <p className="text-xl font-bold text-slate-900">{pending}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Cancelados
              </p>
              <p className="text-xl font-bold text-slate-900">{cancelled}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Sem contrato
              </p>
              <p className="text-xl font-bold text-slate-900">{withoutContract}</p>
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
            {active + pending + cancelled} contrato(s) registrado(s)
          </p>
        </div>

        {loading && contracts.length === 0 ? (
          <Spinner label="Carregando contratos de suporte..." />
        ) : filtered.length === 0 ? (
          <div className="p-5">
            {contracts.length === 0 ? (
              <EmptyState
                icon={Headphones}
                title="Nenhuma empresa cadastrada"
                description="Cadastre uma empresa para poder registrar um contrato de suporte."
              />
            ) : (
              <EmptyState
                icon={SearchX}
                title="Nenhum contrato encontrado"
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
            <table className="w-full min-w-[1000px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Empresa</th>
                  <th className="px-5 py-3 font-semibold">Plano de suporte</th>
                  <th className="px-5 py-3 font-semibold">Valor mensal</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Início</th>
                  <th className="px-5 py-3 font-semibold">Fim</th>
                  <th className="px-5 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((contract) => (
                  <tr
                    key={contract.company_id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <CompanyAvatar name={contract.company_name} />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {contract.company_name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {contract.cnpj || "CNPJ não informado"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {contract.plan_name || "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {contract.monthly_fee_cents !== null
                        ? formatCurrencyFromCents(contract.monthly_fee_cents)
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      {contract.status ? (
                        <StatusBadge
                          label={supportStatusLabel[contract.status]}
                          className={supportTone(contract.status)}
                        />
                      ) : (
                        <span className="text-xs text-slate-400">Sem contrato</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {formatDateOnly(contract.started_at)}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {formatDateOnly(contract.ended_at)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(contract)}
                        aria-label={
                          contract.id
                            ? `Gerenciar suporte de ${contract.company_name}`
                            : `Registrar suporte para ${contract.company_name}`
                        }
                      >
                        {contract.id ? (
                          <Pencil className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        <span className="hidden xl:inline">
                          {contract.id ? "Gerenciar" : "Registrar"}
                        </span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SupportFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          setModalCompanyId(null);
        }}
        contract={editing}
        companies={companies}
        initialCompanyId={modalCompanyId}
        onSaved={handleSaved}
      />
    </div>
  );
}
