import { useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  CreditCard,
  Headphones,
  Mail,
  Phone,
  Users,
} from "lucide-react";
import {
  SystemAdminCompany,
  systemAdminService,
} from "../../services/systemAdminService";
import {
  Alert,
  Button,
  CompanyAvatar,
  Modal,
  Spinner,
  StatusBadge,
} from "./components";
import {
  formatCurrencyFromCents,
  formatDate,
  formatDateOnly,
  formatDateTime,
  subscriptionStatusLabel,
  subscriptionTone,
  supportStatusLabel,
  supportTone,
} from "./utils";

interface Props {
  open: boolean;
  companyId: number | null;
  onClose: () => void;
}

export default function CompanyDetailsModal({ open, companyId, onClose }: Props) {
  const [company, setCompany] = useState<SystemAdminCompany | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !companyId) return;
    let ignore = false;
    setLoading(true);
    setError(null);
    setCompany(null);

    systemAdminService
      .getCompany(companyId)
      .then((data) => {
        if (!ignore) setCompany(data);
      })
      .catch((err) => {
        if (!ignore) setError(err.message || "Não foi possível carregar a empresa.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [open, companyId]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={company?.name || "Detalhes da empresa"}
      description="Informações cadastrais, assinatura, suporte e usuários vinculados."
      size="lg"
      footer={
        <Button type="button" variant="outline" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      {loading ? <Spinner label="Carregando empresa..." /> : null}
      {error ? <Alert>{error}</Alert> : null}

      {company ? (
        <div className="space-y-5">
          <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <CompanyAvatar name={company.name} className="h-12 w-12 text-sm" />
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-slate-900">{company.name}</p>
              <p className="text-xs text-slate-500">
                {company.cnpj || "CNPJ não informado"} · ID #{company.id}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                {company.email ? (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {company.email}
                  </span>
                ) : null}
                {company.phone ? (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {company.phone}
                  </span>
                ) : null}
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Criada em {formatDate(company.createdat)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <CreditCard className="h-4 w-4" />
                Assinatura
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {company.plan_name || "Sem plano"}
              </p>
              {company.plan_price_cents !== null ? (
                <p className="text-xs text-slate-500">
                  {formatCurrencyFromCents(
                    company.plan_price_cents,
                    company.plan_currency || "BRL"
                  )}
                </p>
              ) : null}
              <div className="mt-2">
                {company.subscription_status ? (
                  <StatusBadge
                    label={subscriptionStatusLabel[company.subscription_status]}
                    className={subscriptionTone(company.subscription_status)}
                  />
                ) : (
                  <span className="text-xs text-slate-400">Sem assinatura</span>
                )}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Início: {formatDate(company.subscription_started_at)} · Fim:{" "}
                {formatDate(company.subscription_ended_at)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Headphones className="h-4 w-4" />
                Suporte técnico
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {company.support_plan_name || "Sem contrato"}
              </p>
              {company.support_monthly_fee_cents !== null ? (
                <p className="text-xs text-slate-500">
                  {formatCurrencyFromCents(company.support_monthly_fee_cents)}/mês
                </p>
              ) : null}
              <div className="mt-2">
                {company.support_status ? (
                  <StatusBadge
                    label={supportStatusLabel[company.support_status]}
                    className={supportTone(company.support_status)}
                  />
                ) : (
                  <span className="text-xs text-slate-400">Sem contrato</span>
                )}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Início: {formatDateOnly(company.support_started_at)} · Fim:{" "}
                {formatDateOnly(company.support_ended_at)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Users className="h-4 w-4 text-slate-400" />
                Usuários vinculados
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {company.contributors?.length || 0}
              </span>
            </div>

            {!company.contributors || company.contributors.length === 0 ? (
              <p className="px-4 py-5 text-sm text-slate-500">
                Nenhum usuário vinculado a esta empresa.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-2.5 font-semibold">Usuário</th>
                      <th className="px-4 py-2.5 font-semibold">Cargo</th>
                      <th className="px-4 py-2.5 font-semibold">Setor</th>
                      <th className="px-4 py-2.5 font-semibold">Status</th>
                      <th className="px-4 py-2.5 font-semibold">Criado em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {company.contributors.map((contributor) => (
                      <tr key={contributor.id}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-700">
                          {contributor.username}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {contributor.role}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {contributor.sector}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            label={contributor.active ? "Ativo" : "Inativo"}
                            className={
                              contributor.active
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : "bg-slate-100 text-slate-500 ring-slate-200"
                            }
                          />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {formatDateTime(contributor.createdat)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <Building2 className="h-4 w-4 shrink-0" />
            Instalação vinculada: #{company.installation_id}. O administrador da empresa
            acessa o painel pelo login normal, separado do F1.
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
