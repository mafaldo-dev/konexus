import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";

import {
  getAccountingSettings,
  listAccountingAccounts,
  listAccountingMappings,
  listCostCenters,
  saveAccountingMapping,
  saveAccountingSettings,
} from "../../../services/accountingService";
import {
  ActionButton,
  AccountingPage,
  Card,
  DataTable,
  ErrorState,
  Field,
  LoadingState,
  StatusBadge,
  inputClass,
} from "./components";

const EVENT_TYPES = [
  { value: "payable_recognized", label: "Reconhecimento de conta a pagar" },
  { value: "payable_settled", label: "Liquidação de conta a pagar" },
  { value: "receivable_recognized", label: "Reconhecimento de conta a receber" },
  { value: "receivable_received", label: "Recebimento de título" },
  { value: "bank_fee", label: "Tarifa bancária" },
  { value: "sale_recognized", label: "Reconhecimento de venda" },
  { value: "purchase_recognized", label: "Reconhecimento de compra" },
];

/**
 * Configurações contábeis e mapeamento entre eventos financeiros e contas.
 *
 * Sem mapeamento configurado, a integração financeira recusa o evento com
 * mensagem clara (não gera lançamento incompleto).
 */
export default function AccountingSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [mappings, setMappings] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    requireCostCenter: false,
    allowManualPosting: true,
    depreciationMethod: "linear",
    notes: "",
  });
  const [mappingForm, setMappingForm] = useState({
    eventType: "payable_recognized",
    debitAccountId: "",
    creditAccountId: "",
    costCenterId: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [settingsResponse, mappingsResponse] = await Promise.all([
      getAccountingSettings(),
      listAccountingMappings(),
    ]);
    if (settingsResponse.ok && settingsResponse.data) {
      setSettings(settingsResponse.data);
      setForm({
        requireCostCenter: Boolean(settingsResponse.data.require_cost_center),
        allowManualPosting: Boolean(settingsResponse.data.allow_manual_posting),
        depreciationMethod: settingsResponse.data.depreciation_method || "linear",
        notes: settingsResponse.data.notes || "",
      });
    }
    if (mappingsResponse.ok) {
      setMappings(mappingsResponse.data || []);
    }
    setError(settingsResponse.error || mappingsResponse.error || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    listAccountingAccounts().then((response) => setAccounts(response.data || []));
    listCostCenters().then((response) => setCostCenters(response.data || []));
  }, [load]);

  const handleSaveSettings = async () => {
    setSaving(true);
    setError(null);
    const response = await saveAccountingSettings(form);
    if (response.ok) {
      await load();
    } else {
      setError(response.error || "Não foi possível salvar as configurações.");
    }
    setSaving(false);
  };

  const handleSaveMapping = async () => {
    setSaving(true);
    setError(null);
    const response = await saveAccountingMapping({
      eventType: mappingForm.eventType,
      debitAccountId: Number(mappingForm.debitAccountId),
      creditAccountId: Number(mappingForm.creditAccountId),
      costCenterId: mappingForm.costCenterId
        ? Number(mappingForm.costCenterId)
        : null,
    });
    if (response.ok) {
      await load();
    } else {
      setError(response.error || "Não foi possível salvar o mapeamento.");
    }
    setSaving(false);
  };

  return (
    <AccountingPage
      title="Configurações contábeis"
      description="Parâmetros do módulo e mapeamento entre eventos financeiros e contas contábeis."
    >
      <ErrorState message={error} />

      {loading ? (
        <LoadingState label="Carregando as configurações..." />
      ) : (
        <div className="space-y-4">
          <Card title="Parâmetros do módulo">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.requireCostCenter}
                  onChange={(event) =>
                    setForm({ ...form, requireCostCenter: event.target.checked })
                  }
                />
                Exigir centro de custo em todos os itens
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.allowManualPosting}
                  onChange={(event) =>
                    setForm({ ...form, allowManualPosting: event.target.checked })
                  }
                />
                Permitir lançamento manual
              </label>
              <Field label="Método de depreciação">
                <select
                  value={form.depreciationMethod}
                  onChange={(event) =>
                    setForm({ ...form, depreciationMethod: event.target.value })
                  }
                  className={inputClass}
                >
                  <option value="linear">Linear (demonstrativo)</option>
                </select>
              </Field>
              <Field label="Observações">
                <input
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="mt-3 flex justify-end">
              <ActionButton variant="primary" onClick={handleSaveSettings} disabled={saving}>
                <Save className="h-4 w-4" />
                Salvar configurações
              </ActionButton>
            </div>
            {settings ? (
              <p className="mt-2 text-[11px] text-slate-400">
                Última atualização: {new Date(settings.updated_at).toLocaleString("pt-BR")}
              </p>
            ) : null}
          </Card>

          <Card title="Mapeamento evento financeiro → contas">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Evento financeiro">
                <select
                  value={mappingForm.eventType}
                  onChange={(event) =>
                    setMappingForm({ ...mappingForm, eventType: event.target.value })
                  }
                  className={inputClass}
                >
                  {EVENT_TYPES.map((event) => (
                    <option key={event.value} value={event.value}>
                      {event.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Conta de débito">
                <select
                  value={mappingForm.debitAccountId}
                  onChange={(event) =>
                    setMappingForm({ ...mappingForm, debitAccountId: event.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">Selecione</option>
                  {accounts
                    .filter((account) => account.allows_entries)
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Conta de crédito">
                <select
                  value={mappingForm.creditAccountId}
                  onChange={(event) =>
                    setMappingForm({
                      ...mappingForm,
                      creditAccountId: event.target.value,
                    })
                  }
                  className={inputClass}
                >
                  <option value="">Selecione</option>
                  {accounts
                    .filter((account) => account.allows_entries)
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Centro de custo">
                <select
                  value={mappingForm.costCenterId}
                  onChange={(event) =>
                    setMappingForm({ ...mappingForm, costCenterId: event.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">—</option>
                  {costCenters.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.code} - {center.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-3 flex justify-end">
              <ActionButton variant="primary" onClick={handleSaveMapping} disabled={saving}>
                <Save className="h-4 w-4" />
                Salvar mapeamento
              </ActionButton>
            </div>
          </Card>

          <Card title="Mapeamentos configurados">
            <DataTable
              rows={mappings}
              rowKey={(row) => row.id}
              emptyMessage="Nenhum mapeamento configurado: a integração financeira ficará bloqueada até a configuração."
              columns={[
                {
                  key: "event",
                  header: "Evento",
                  render: (row) =>
                    EVENT_TYPES.find((event) => event.value === row.event_type)?.label ||
                    row.event_type,
                },
                {
                  key: "debit",
                  header: "Débito",
                  render: (row) => `${row.debit_code} - ${row.debit_name}`,
                },
                {
                  key: "credit",
                  header: "Crédito",
                  render: (row) => `${row.credit_code} - ${row.credit_name}`,
                },
                {
                  key: "cost",
                  header: "Centro de custo",
                  render: (row) => row.cost_center_code || "—",
                },
                {
                  key: "status",
                  header: "Situação",
                  render: (row) => (
                    <StatusBadge
                      status={row.active ? "active" : "inactive"}
                      labels={{
                        active: {
                          text: "Ativo",
                          className: "border-emerald-200 bg-emerald-50 text-emerald-700",
                        },
                        inactive: {
                          text: "Inativo",
                          className: "border-slate-200 bg-slate-50 text-slate-600",
                        },
                      }}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </div>
      )}
    </AccountingPage>
  );
}
