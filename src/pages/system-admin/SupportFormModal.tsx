import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Headphones, Wallet } from "lucide-react";
import {
  SystemAdminCompany,
  SystemAdminSupportContract,
  SupportStatus,
  systemAdminService,
} from "../../services/systemAdminService";
import { Alert, Button, Field, Input, Modal, Select, Textarea } from "./components";
import { toDateInputValue } from "./utils";

interface Props {
  open: boolean;
  onClose: () => void;
  contract: SystemAdminSupportContract | null;
  companies: SystemAdminCompany[];
  initialCompanyId?: number | null;
  onSaved: () => void;
}

const supportStatuses: Array<{ value: SupportStatus; label: string }> = [
  { value: "active", label: "Ativo" },
  { value: "pending", label: "Pendente" },
  { value: "suspended", label: "Suspenso" },
  { value: "cancelled", label: "Cancelado" },
];

export default function SupportFormModal({
  open,
  onClose,
  contract,
  companies,
  initialCompanyId,
  onSaved,
}: Props) {
  const isEditing = Boolean(contract?.id);
  const [companyId, setCompanyId] = useState("");
  const [status, setStatus] = useState<SupportStatus>("active");
  const [planName, setPlanName] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("0.00");
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableCompanies = useMemo(() => {
    const withContract = companies.filter((company) => company.support_id);
    const withoutContract = companies.filter((company) => !company.support_id);
    return [...withoutContract, ...withContract];
  }, [companies]);

  useEffect(() => {
    if (!open) return;
    setError(null);

    if (contract) {
      setCompanyId(String(contract.company_id));
      setStatus(contract.status || "active");
      setPlanName(contract.plan_name || "");
      setMonthlyFee(((contract.monthly_fee_cents || 0) / 100).toFixed(2));
      setStartedAt(toDateInputValue(contract.started_at));
      setEndedAt(toDateInputValue(contract.ended_at));
      setNotes(contract.notes || "");
      return;
    }

    const preferred = availableCompanies.find(
      (company) => company.id === Number(initialCompanyId)
    );
    setCompanyId(String(preferred?.id || availableCompanies[0]?.id || ""));
    setStatus("active");
    setPlanName("");
    setMonthlyFee("0.00");
    setStartedAt("");
    setEndedAt("");
    setNotes("");
  }, [open, contract, initialCompanyId, availableCompanies]);

  const selectedCompany = companies.find((company) => company.id === Number(companyId));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!companyId) {
      setError("Selecione a empresa que contratou o suporte.");
      return;
    }

    const fee = Number(monthlyFee.replace(",", "."));
    if (!Number.isFinite(fee) || fee < 0) {
      setError("Informe um valor mensal válido.");
      return;
    }
    if (startedAt && endedAt && endedAt < startedAt) {
      setError("A data final não pode ser anterior à data inicial.");
      return;
    }

    setLoading(true);
    try {
      await systemAdminService.upsertSupport(Number(companyId), {
        status,
        plan_name: planName.trim() || null,
        monthly_fee_cents: Math.round(fee * 100),
        started_at: startedAt || null,
        ended_at: endedAt || null,
        notes: notes.trim() || null,
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Não foi possível salvar o contrato de suporte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Gerenciar suporte técnico" : "Novo contrato de suporte"}
      description={
        isEditing
          ? `Atualize o contrato de suporte de ${contract?.company_name || "empresa"}.`
          : "Registre uma empresa que contratou suporte técnico para a plataforma."
      }
      size="md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="support-form" loading={loading}>
            <Headphones className="h-4 w-4" />
            {isEditing ? "Salvar contrato" : "Registrar suporte"}
          </Button>
        </>
      }
    >
      <form id="support-form" onSubmit={handleSubmit} className="space-y-5">
        {error ? <Alert>{error}</Alert> : null}

        {!isEditing && companies.length === 0 ? (
          <Alert variant="info">
            Nenhuma empresa cadastrada. Crie uma empresa antes de registrar um contrato
            de suporte.
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
                {company.support_id ? " · já possui contrato" : ""}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status do suporte" required>
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value as SupportStatus)}
            >
              {supportStatuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Plano de suporte" hint="Ex.: Essencial, Prioritário, Dedicado.">
            <Input
              value={planName}
              onChange={(event) => setPlanName(event.target.value)}
              placeholder="Nome do plano de suporte"
            />
          </Field>
        </div>

        <Field label="Valor mensal (R$)" hint="Use 0 para um contrato sem cobrança mensal.">
          <div className="relative">
            <Wallet className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="number"
              min="0"
              step="0.01"
              value={monthlyFee}
              onChange={(event) => setMonthlyFee(event.target.value)}
              className="pl-10"
            />
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Início do contrato">
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="date"
                value={startedAt}
                onChange={(event) => setStartedAt(event.target.value)}
                className="pl-10"
              />
            </div>
          </Field>

          <Field label="Fim do contrato" hint="Opcional.">
            <Input
              type="date"
              value={endedAt}
              onChange={(event) => setEndedAt(event.target.value)}
            />
          </Field>
        </div>

        <Field label="Observações">
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Escopo, canal de atendimento, SLA ou observações internas."
          />
        </Field>

        {selectedCompany?.support_id ? (
          <Alert variant="info">
            Esta empresa já possui um contrato de suporte. Salvar irá atualizar o contrato
            existente.
          </Alert>
        ) : null}
      </form>
    </Modal>
  );
}
