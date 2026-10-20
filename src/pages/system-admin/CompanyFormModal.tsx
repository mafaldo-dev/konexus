import { useEffect, useState } from "react";
import { Building2, Eye, EyeOff, KeyRound, UserRound } from "lucide-react";
import {
  CreateCompanyResult,
  SystemAdminPlan,
  systemAdminService,
} from "../../services/systemAdminService";
import { Alert, Button, Field, Input, Modal, Select } from "./components";
import { formatCurrencyFromCents } from "./utils";

interface Props {
  open: boolean;
  onClose: () => void;
  plans: SystemAdminPlan[];
  onCreated: (result: CreateCompanyResult) => void;
}

const emptyForm = {
  companyName: "",
  adminUsername: "",
  adminPassword: "",
  confirmPassword: "",
  planId: "",
};

export default function CompanyFormModal({ open, onClose, plans, onCreated }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setError(null);
      setShowPassword(false);
    }
  }, [open]);

  const update = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.companyName.trim() || !form.adminUsername.trim() || !form.adminPassword) {
      setError("Preencha o nome da empresa, o usuário admin e a senha.");
      return;
    }
    if (form.adminPassword.length < 6) {
      setError("A senha do admin da empresa deve ter pelo menos 6 caracteres.");
      return;
    }
    if (form.adminPassword !== form.confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const result = await systemAdminService.createCompany({
        companyName: form.companyName.trim(),
        adminUsername: form.adminUsername.trim(),
        adminPassword: form.adminPassword,
        installation_id: 1,
        planId: form.planId ? Number(form.planId) : null,
      });
      onCreated(result);
      onClose();
    } catch (err: any) {
      setError(err.message || "Não foi possível criar a empresa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova empresa"
      description="Cadastre a empresa e o usuário administrador que terá acesso ao painel dela."
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="company-form" loading={loading}>
            <Building2 className="h-4 w-4" />
            Criar empresa
          </Button>
        </>
      }
    >
      <form id="company-form" onSubmit={handleSubmit} className="space-y-5">
        {error ? <Alert>{error}</Alert> : null}

        <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-relaxed text-blue-700">
          O usuário criado aqui será o administrador da empresa e entrará pelo login
          normal do aplicativo, não pelo F1. Ele terá acesso ao painel da própria empresa.
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome da empresa" required className="sm:col-span-2">
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={form.companyName}
                onChange={(event) => update("companyName", event.target.value)}
                placeholder="Ex.: Konexus Comércio Ltda."
                className="pl-10"
                autoFocus
              />
            </div>
          </Field>

          <Field label="Usuário admin da empresa" required>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={form.adminUsername}
                onChange={(event) => update("adminUsername", event.target.value)}
                placeholder="Ex.: admin.empresa"
                className="pl-10"
                autoComplete="off"
              />
            </div>
          </Field>

          <Field label="Plano inicial" hint="Opcional. A assinatura pode ser criada depois.">
            <Select
              value={form.planId}
              onChange={(event) => update("planId", event.target.value)}
            >
              <option value="">Sem assinatura inicial</option>
              {plans
                .filter((plan) => plan.active)
                .map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} · {formatCurrencyFromCents(plan.price_cents, plan.currency)}
                  </option>
                ))}
            </Select>
          </Field>

          <Field label="Senha do admin" required>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type={showPassword ? "text" : "password"}
                value={form.adminPassword}
                onChange={(event) => update("adminPassword", event.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="pl-10 pr-11"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <Field label="Confirmar senha" required>
            <Input
              type={showPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(event) => update("confirmPassword", event.target.value)}
              placeholder="Repita a senha"
              autoComplete="new-password"
            />
          </Field>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          O plano inicial cria uma assinatura ativa para a empresa. Se nenhum plano for
          escolhido, a empresa ficará sem assinatura e você poderá vincular uma depois na
          aba <strong>Assinaturas</strong>.
        </div>
      </form>
    </Modal>
  );
}
