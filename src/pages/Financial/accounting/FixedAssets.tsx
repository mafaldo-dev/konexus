import { FormEvent, useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";

import {
  createFixedAsset,
  listAccountingAccounts,
  listCostCenters,
  listDepreciations,
  listFixedAssets,
  AccountingFixedAsset,
} from "../../../services/accountingService";
import {
  ActionButton,
  AccountingPage,
  Card,
  DataTable,
  ErrorState,
  Field,
  LoadingState,
  Modal,
  formatDate,
  formatMoney,
  inputClass,
} from "./components";

/**
 * Ativos imobilizados e depreciação.
 *
 * O cálculo é demonstrativo (método linear sobre o prazo útil) e deve ser
 * revisado pelo responsável contábil da empresa.
 */
export default function FixedAssetsPage() {
  const [assets, setAssets] = useState<AccountingFixedAsset[]>([]);
  const [depreciations, setDepreciations] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    code: "",
    description: "",
    category: "",
    acquisitionDate: new Date().toISOString().slice(0, 10),
    acquisitionAmount: "",
    residualAmount: "0",
    usefulLifeMonths: "60",
    accountId: "",
    depreciationAccountId: "",
    costCenterId: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [assetsResponse, depreciationResponse] = await Promise.all([
      listFixedAssets(),
      listDepreciations(),
    ]);
    if (assetsResponse.ok) {
      setAssets(assetsResponse.data || []);
    } else {
      setAssets([]);
      setError(assetsResponse.error || "Não foi possível carregar os ativos.");
    }
    setDepreciations(depreciationResponse.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    listAccountingAccounts().then((response) => setAccounts(response.data || []));
    listCostCenters().then((response) => setCostCenters(response.data || []));
  }, [load]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await createFixedAsset({
      code: form.code,
      description: form.description,
      category: form.category || undefined,
      acquisitionDate: form.acquisitionDate,
      acquisitionAmount: Number(form.acquisitionAmount),
      residualAmount: Number(form.residualAmount || 0),
      usefulLifeMonths: Number(form.usefulLifeMonths),
      accountId: form.accountId ? Number(form.accountId) : null,
      depreciationAccountId: form.depreciationAccountId
        ? Number(form.depreciationAccountId)
        : null,
      costCenterId: form.costCenterId ? Number(form.costCenterId) : null,
    });

    if (response.ok) {
      setModalOpen(false);
      await load();
    } else {
      setError(response.error || "Não foi possível cadastrar o ativo.");
    }
    setSaving(false);
  };

  return (
    <AccountingPage
      title="Ativos imobilizados"
      description="Cadastro de bens, depreciação acumulada e valor contábil líquido. Critério de cálculo demonstrativo (método linear)."
      actions={
        <ActionButton
          variant="primary"
          onClick={() => {
            setForm({
              code: "",
              description: "",
              category: "",
              acquisitionDate: new Date().toISOString().slice(0, 10),
              acquisitionAmount: "",
              residualAmount: "0",
              usefulLifeMonths: "60",
              accountId: "",
              depreciationAccountId: "",
              costCenterId: "",
            });
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo ativo
        </ActionButton>
      }
    >
      <ErrorState message={error} />

      <Card title="Bens">
        {loading ? (
          <LoadingState label="Carregando os ativos..." />
        ) : (
          <DataTable
            rows={assets}
            rowKey={(row) => row.id}
            emptyMessage="Nenhum ativo imobilizado cadastrado."
            columns={[
              { key: "code", header: "Código", render: (row) => row.code },
              {
                key: "description",
                header: "Descrição",
                render: (row) => row.description,
              },
              {
                key: "acquisition",
                header: "Aquisição",
                render: (row) => `${formatDate(row.acquisition_date)} · ${formatMoney(row.acquisition_amount)}`,
              },
              {
                key: "life",
                header: "Vida útil",
                render: (row) => `${row.useful_life_months} meses`,
              },
              {
                key: "residual",
                header: "Valor residual",
                render: (row) => formatMoney(row.residual_amount),
              },
              {
                key: "accumulated",
                header: "Depreciação acumulada",
                render: (row) => formatMoney(row.accumulated_depreciation),
              },
              {
                key: "net",
                header: "Valor líquido",
                render: (row) => (
                  <strong>
                    {formatMoney(
                      Number(row.acquisition_amount) -
                        Number(row.accumulated_depreciation || 0)
                    )}
                  </strong>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Card title="Histórico de depreciação">
        <DataTable
          rows={depreciations}
          rowKey={(row) => row.id}
          emptyMessage="Nenhuma depreciação registrada."
          columns={[
            { key: "asset", header: "Ativo", render: (row) => row.asset_code },
            { key: "period", header: "Período", render: (row) => row.period_name },
            {
              key: "amount",
              header: "Depreciação",
              render: (row) => formatMoney(row.amount),
            },
            {
              key: "accumulated",
              header: "Acumulado",
              render: (row) => formatMoney(row.accumulated),
            },
            {
              key: "net",
              header: "Valor líquido",
              render: (row) => formatMoney(row.net_book_value),
            },
          ]}
        />
      </Card>

      <Modal
        open={modalOpen}
        title="Novo ativo imobilizado"
        onClose={() => setModalOpen(false)}
        wide
        footer={
          <ActionButton variant="primary" onClick={handleCreate} disabled={saving}>
            {saving ? "Salvando..." : "Cadastrar"}
          </ActionButton>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Código patrimonial">
              <input
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Categoria">
              <input
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Descrição" >
              <input
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Data de aquisição">
              <input
                type="date"
                value={form.acquisitionDate}
                onChange={(event) =>
                  setForm({ ...form, acquisitionDate: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Valor de aquisição">
              <input
                type="number"
                step="0.01"
                value={form.acquisitionAmount}
                onChange={(event) =>
                  setForm({ ...form, acquisitionAmount: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Valor residual">
              <input
                type="number"
                step="0.01"
                value={form.residualAmount}
                onChange={(event) =>
                  setForm({ ...form, residualAmount: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Vida útil (meses)">
              <input
                type="number"
                value={form.usefulLifeMonths}
                onChange={(event) =>
                  setForm({ ...form, usefulLifeMonths: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Centro de custo">
              <select
                value={form.costCenterId}
                onChange={(event) =>
                  setForm({ ...form, costCenterId: event.target.value })
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
            <Field label="Conta do bem (ativo)">
              <select
                value={form.accountId}
                onChange={(event) =>
                  setForm({ ...form, accountId: event.target.value })
                }
                className={inputClass}
              >
                <option value="">—</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Conta da depreciação (despesa)">
              <select
                value={form.depreciationAccountId}
                onChange={(event) =>
                  setForm({ ...form, depreciationAccountId: event.target.value })
                }
                className={inputClass}
              >
                <option value="">—</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </form>
      </Modal>
    </AccountingPage>
  );
}
