import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CreditCard } from "lucide-react";
import {
  SystemAdminCompany,
  SystemAdminPlan,
  SystemAdminSubscription,
  systemAdminService,
} from "../../services/systemAdminService";
import { Alert, Button, Field, Input, Modal, Select } from "./components";
import { formatCurrencyFromCents, toDateInputValue } from "./utils";

interface Props {
  open: boolean;
  onClose: () => void;
  subscription: SystemAdminSubscription | null;
  companies: SystemAdminCompany[];
  plans: SystemAdminPlan[];
  initialCompanyId?: number | null;
  onSaved: () => void;
}

const validStatuses = ["active", "pending", "cancelled", "expired"] as const;

export default function SubscriptionFormModal({
  open,
  onClose,
  subscription,
  companies,
  plans,
  initialCompanyId,
  onSaved,
}: Props) {
  const isEditing = Boolean(subscription);
  const [companyId, setCompanyId] = useState("");
  const [planId, setPlanId] = useState("");
  const [status, setStatus] = useState<(typeof validStatuses)[number]>("active");
  const [endedAt, setEndedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableCompanies = useMemo(
    () => companies.filter((company) => isEditing || !company.subscription_id),
    [companies, isEditing]
  );

  useEffect(() => {
    if (!open) return;
    setError(null);

    if (subscription) {
      setCompanyId(String(subscription.company_id));
      setPlanId(String(subscription.plan_id));
      setStatus(subscription.status);
      setEndedAt(toDateInputValue(subscription.ended_at));
      return;
    }

    const preferred = availableCompanies.find(
      (company) => company.id === Number(initialCompanyId)
    );
    setCompanyId(String(preferred?.id || availableCompanies[0]?.id || ""));
    const firstPlan = plans.find((plan) => plan.active) || plans[0];
    setPlanId(String(firstPlan?.id || ""));
    setStatus("active");
    setEndedAt("");
  }, [open, subscription, initialCompanyId, availableCompanies, plans]);

  const selectedCompany = companies.find((company) => company.id === Number(companyId));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!companyId || !planId) {
      setError("Selecione a empresa e o plano da assinatura.");
      return;
    }

    setLoading(true);
    try {
      if (subscription) {
        await systemAdminService.updateSubscription(subscription.id, {
          plan_id: Number(planId),
          status,
          ended_at: endedAt || null,
        });
      } else {
        await systemAdminService.createSubscription({
          companyId: Number(companyId),
          planId: Number(planId),
          status,
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Não foi possível salvar a assinatura.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar assinatura" : "Nova assinatura"}
      description={
        isEditing
          ? `Gerencie o plano e o status da assinatura de ${selectedCompany?.name || "empresa"}.`
          : "Vincule um plano comercial a uma empresa que ainda não possui assinatura."
      }
      size="md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="subscription-form" loading={loading}>
            <CreditCard className="h-4 w-4" />
            {isEditing ? "Salvar alterações" : "Criar assinatura"}
          </Button>
        </>
      }
    >
      <form id="subscription-form" onSubmit={handleSubmit} className="space-y-5">
        {error ? <Alert>{error}</Alert> : null}

        {!isEditing && availableCompanies.length === 0 ? (
          <Alert variant="info">
            Todas as empresas cadastradas já possuem uma assinatura. Edite a assinatura
            existente ou crie uma nova empresa.
          </Alert>
        ) : null}

        <Field label="Empresa" required>
          <Select
            value={companyId}
            onChange={(event) => setCompanyId(event.target.value)}
            disabled={isEditing}
          >
            <option value="">Selecione uma empresa</option>
            {availableCompanies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
                {company.cnpj ? ` · ${company.cnpj}` : ""}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Plano" required>
            <Select value={planId} onChange={(event) => setPlanId(event.target.value)}>
              <option value="">Selecione um plano</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} · {formatCurrencyFromCents(plan.price_cents, plan.currency)}
                  {!plan.active ? " (inativo)" : ""}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Status" required>
            <Select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as (typeof validStatuses)[number])
              }
            >
              <option value="active">Ativa</option>
              <option value="pending">Pendente</option>
              <option value="cancelled">Cancelada</option>
              <option value="expired">Expirada</option>
            </Select>
          </Field>
        </div>

        <Field
          label="Data de encerramento"
          hint="Opcional. Deixe em branco para uma assinatura sem data final."
        >
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="date"
              value={endedAt}
              onChange={(event) => setEndedAt(event.target.value)}
              className="pl-10"
            />
          </div>
        </Field>

        {selectedCompany ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Empresa selecionada: <strong className="text-slate-700">{selectedCompany.name}</strong>
            {selectedCompany.plan_name ? (
              <>
                {" "}· assinatura atual: <strong className="text-slate-700">{selectedCompany.plan_name}</strong>
              </>
            ) : null}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
