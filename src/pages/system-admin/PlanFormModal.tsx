import { useEffect, useState } from "react";
import { Check, Layers, Wallet } from "lucide-react";
import {
  PlanType,
  SystemAdminModule,
  SystemAdminPlan,
  systemAdminService,
} from "../../services/systemAdminService";
import { Alert, Button, Field, Input, Modal, Select, Textarea } from "./components";
import { cn, formatCurrencyFromCents } from "./utils";

interface Props {
  open: boolean;
  onClose: () => void;
  plan: SystemAdminPlan | null;
  modules: SystemAdminModule[];
  onSaved: () => void;
}

export default function PlanFormModal({ open, onClose, plan, modules, onSaved }: Props) {
  const isEditing = Boolean(plan);
  const [name, setName] = useState("");
  const [type, setType] = useState<PlanType>("monthly");
  const [price, setPrice] = useState("0.00");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(plan?.name || "");
    setType(plan?.type || "monthly");
    setPrice(((plan?.price_cents || 0) / 100).toFixed(2));
    setDescription(plan?.description || "");
    setActive(plan?.active ?? true);
    setSelectedModules([]);

    if (!plan) return;

    let ignore = false;
    setLoadingModules(true);
    systemAdminService
      .listPlanModules(plan.id)
      .then((keys) => {
        if (!ignore) setSelectedModules(keys);
      })
      .catch((err) => {
        if (!ignore) setError(err.message || "Não foi possível carregar os módulos do plano.");
      })
      .finally(() => {
        if (!ignore) setLoadingModules(false);
      });

    return () => {
      ignore = true;
    };
  }, [open, plan]);

  const toggleModule = (key: string) => {
    setSelectedModules((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (loadingModules) {
      setError("Aguarde o carregamento dos módulos do plano.");
      return;
    }
    if (!name.trim()) {
      setError("Informe o nome do plano.");
      return;
    }

    const priceValue = Number(price.replace(",", "."));
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setError("Informe um preço válido.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        price_cents: Math.round(priceValue * 100),
        currency: "BRL",
        description: description.trim() || null,
      };

      let savedPlan: SystemAdminPlan;
      if (plan) {
        savedPlan = await systemAdminService.updatePlan(plan.id, { ...payload, active });
      } else {
        savedPlan = await systemAdminService.createPlan(payload);
        if (!active) {
          savedPlan = await systemAdminService.updatePlan(savedPlan.id, { active: false });
        }
      }

      const currentKeys = await systemAdminService.listPlanModules(savedPlan.id);
      for (const key of selectedModules) {
        if (!currentKeys.includes(key)) {
          await systemAdminService.addPlanModule(savedPlan.id, key);
        }
      }
      for (const key of currentKeys) {
        if (!selectedModules.includes(key)) {
          await systemAdminService.removePlanModule(savedPlan.id, key);
        }
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Não foi possível salvar o plano.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar plano" : "Novo plano"}
      description="Defina o preço e os módulos liberados pelo plano comercial."
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="plan-form" loading={loading} disabled={loadingModules}>
            <Layers className="h-4 w-4" />
            {isEditing ? "Salvar plano" : "Criar plano"}
          </Button>
        </>
      }
    >
      <form id="plan-form" onSubmit={handleSubmit} className="space-y-5">
        {error ? <Alert>{error}</Alert> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome do plano" required className="sm:col-span-2">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Plano Profissional"
              autoFocus
            />
          </Field>

          <Field label="Cobrança" required>
            <Select value={type} onChange={(event) => setType(event.target.value as PlanType)}>
              <option value="monthly">Mensal</option>
              <option value="yearly">Anual</option>
            </Select>
          </Field>

          <Field label="Preço (R$)" required>
            <div className="relative">
              <Wallet className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="pl-10"
              />
            </div>
          </Field>
        </div>

        <Field label="Descrição">
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Resumo comercial do plano."
          />
        </Field>

        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Plano ativo</p>
            <p className="text-xs text-slate-500">
              Planos inativos não devem ser usados em novas assinaturas.
            </p>
          </div>
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Módulos inclusos
              </p>
              <p className="text-xs text-slate-400">
                Selecione os módulos que este plano libera para as empresas.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {selectedModules.length} selecionado(s)
            </span>
          </div>

          {loadingModules ? (
            <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Carregando módulos do plano...
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((module) => {
                const checked = selectedModules.includes(module.module_key);
                return (
                  <button
                    type="button"
                    key={module.module_key}
                    onClick={() => toggleModule(module.module_key)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition",
                      checked
                        ? "border-blue-300 bg-blue-50/70 ring-1 ring-blue-200"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        checked
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {checked ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                        {module.name}
                        {module.is_paid ? (
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                            Pago
                          </span>
                        ) : null}
                      </span>
                      {module.description ? (
                        <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                          {module.description}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {plan ? (
          <p className="text-xs text-slate-400">
            Plano atual: {plan.name} · {formatCurrencyFromCents(plan.price_cents, plan.currency)}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
