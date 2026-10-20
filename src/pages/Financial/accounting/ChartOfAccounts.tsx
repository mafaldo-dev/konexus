import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import {
  createAccountingAccount,
  deleteAccountingAccount,
  listAccountingAccounts,
  updateAccountingAccount,
  AccountingAccount,
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
  StatusBadge,
  formatMoney,
  inputClass,
} from "./components";

const GROUPS = [
  { value: "", label: "Todos os grupos" },
  { value: "ativo", label: "Ativo" },
  { value: "passivo", label: "Passivo" },
  { value: "patrimonio_liquido", label: "Patrimônio Líquido" },
  { value: "receita", label: "Receitas" },
  { value: "custo", label: "Custos" },
  { value: "despesa", label: "Despesas" },
  { value: "resultado", label: "Resultado e Encerramento" },
];

const CLASSIFICATIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "passivo", label: "Passivo" },
  { value: "patrimonio_liquido", label: "Patrimônio Líquido" },
  { value: "receita", label: "Receita" },
  { value: "custo", label: "Custo" },
  { value: "despesa", label: "Despesa" },
  { value: "resultado", label: "Resultado" },
];

const STATUS_LABELS: Record<string, { text: string; className: string }> = {
  true: { text: "Ativa", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  false: { text: "Inativa", className: "border-slate-200 bg-slate-50 text-slate-600" },
};

const EMPTY_FORM = {
  code: "",
  name: "",
  description: "",
  parentId: "",
  classification: "ativo",
  groupKey: "ativo",
  nature: "devedora",
  accountType: "patrimonial",
  isSynthetic: true,
  allowsEntries: false,
  active: true,
};

/**
 * Plano de contas: hierarquia, busca por codigo/nome e situacao.
 * Contas com movimentacao nao podem ser excluidas (a API recusa e orienta a
 * desativacao).
 */
export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [groupKey, setGroupKey] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AccountingAccount | null>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Contas do modelo de demonstracao (carregado pelo seed de demonstracao).
  const demoAccounts = useMemo(
    () =>
      accounts.filter((account) =>
        /demonstracao/i.test(account.description || "")
      ),
    [accounts]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await listAccountingAccounts({
      search: search || undefined,
      groupKey: groupKey || undefined,
    });
    if (response.ok) {
      setAccounts(response.data || []);
    } else {
      setAccounts([]);
      setError(response.error || "Não foi possível carregar o plano de contas.");
    }
    setLoading(false);
  }, [search, groupKey]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (account: AccountingAccount) => {
    setEditing(account);
    setForm({
      code: account.code,
      name: account.name,
      description: account.description || "",
      parentId: account.parent_id ? String(account.parent_id) : "",
      classification: account.classification,
      groupKey: account.group_key,
      nature: account.nature,
      accountType: account.account_type,
      isSynthetic: account.is_synthetic,
      allowsEntries: account.allows_entries,
      active: account.active,
    });
    setModalOpen(true);
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      code: form.code,
      name: form.name,
      description: form.description || null,
      parentId: form.parentId ? Number(form.parentId) : null,
      classification: form.classification,
      groupKey: form.groupKey,
      nature: form.nature,
      accountType: form.accountType,
      isSynthetic: form.isSynthetic,
      allowsEntries: form.allowsEntries,
      active: form.active,
    };

    const response = editing
      ? await updateAccountingAccount(editing.id, payload)
      : await createAccountingAccount(payload);

    if (response.ok) {
      setModalOpen(false);
      await load();
    } else {
      setError(response.error || "Não foi possível salvar a conta.");
    }
    setSaving(false);
  };

  const handleDeactivate = async (account: AccountingAccount) => {
    setError(null);
    const response = account.active
      ? await updateAccountingAccount(account.id, { active: false })
      : await updateAccountingAccount(account.id, { active: true });
    if (response.ok) {
      await load();
    } else {
      setError(response.error || "Não foi possível alterar a situação da conta.");
    }
  };

  const handleDelete = async (account: AccountingAccount) => {
    setError(null);
    const response = await deleteAccountingAccount(account.id);
    if (response.ok) {
      await load();
    } else {
      setError(
        response.error ||
          "Conta com movimentações não pode ser excluída: desative-a para preservar o histórico."
      );
    }
  };

  return (
    <AccountingPage
      title="Plano de contas"
      description="Plano de contas da sua empresa, mantido pelo seu contador responsável. Contas sintéticas organizam o plano; apenas as analíticas recebem lançamentos."
      actions={
        <ActionButton variant="primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova conta
        </ActionButton>
      }
    >
      <ErrorState message={error} />

      {demoAccounts.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-semibold">Plano de demonstração</p>
          <p className="mt-1">
            {demoAccounts.length} conta(s) pertencem ao modelo de demonstração
            carregado para teste. O contador responsável deve desativá-las e
            cadastrar o plano de contas real da empresa — cada empresa tem o
            seu próprio plano, isolado por empresa.
          </p>
        </div>
      ) : null}

      <Card>
        <div className="mb-3 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por código ou nome"
              className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-2 text-sm"
            />
          </div>
          <select
            value={groupKey}
            onChange={(event) => setGroupKey(event.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            {GROUPS.map((group) => (
              <option key={group.value} value={group.value}>
                {group.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <LoadingState label="Carregando o plano de contas..." />
        ) : (
          <DataTable
            rows={accounts}
            rowKey={(row) => row.id}
            emptyMessage="Nenhuma conta encontrada."
            columns={[
              {
                key: "code",
                header: "Código",
                render: (row) => (
                  <span className="font-mono text-xs text-slate-600">
                    {" ".repeat(Math.max(0, (row.level || 1) - 1))}
                    {row.code}
                  </span>
                ),
              },
              { key: "name", header: "Nome", render: (row) => row.name },
              {
                key: "group",
                header: "Grupo",
                render: (row) =>
                  GROUPS.find((group) => group.value === row.group_key)?.label ||
                  row.group_key,
              },
              {
                key: "type",
                header: "Tipo",
                render: (row) => (
                  <span className="text-xs text-slate-600">
                    {row.is_synthetic ? "Sintética" : "Analítica"}
                    {row.allows_entries ? " · aceita lançamentos" : ""}
                  </span>
                ),
              },
              {
                key: "nature",
                header: "Natureza",
                render: (row) =>
                  row.nature === "devedora" ? "Devedora" : "Credora",
              },
              {
                key: "status",
                header: "Situação",
                render: (row) => (
                  <StatusBadge
                    status={String(row.active)}
                    labels={STATUS_LABELS}
                  />
                ),
              },
              {
                key: "actions",
                header: "Ações",
                render: (row) => (
                  <div className="flex justify-end gap-1">
                    <ActionButton onClick={() => openEdit(row)}>Editar</ActionButton>
                    <ActionButton
                      onClick={() => handleDeactivate(row)}
                      title={
                        row.active
                          ? "Desativar (mantém o histórico)"
                          : "Reativar"
                      }
                    >
                      {row.active ? "Desativar" : "Reativar"}
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      onClick={() => handleDelete(row)}
                      title="Excluir (somente contas sem movimentação)"
                    >
                      Excluir
                    </ActionButton>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? `Editar conta ${editing.code}` : "Nova conta contábil"}
        onClose={() => setModalOpen(false)}
        wide
        footer={
          <ActionButton variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </ActionButton>
        }
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Código">
              <input
                value={form.code}
                onChange={(event) =>
                  setForm({ ...form, code: event.target.value })
                }
                className={inputClass}
                disabled={Boolean(editing)}
              />
            </Field>
            <Field label="Nome">
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Classificação">
              <select
                value={form.classification}
                onChange={(event) =>
                  setForm({ ...form, classification: event.target.value })
                }
                className={inputClass}
              >
                {CLASSIFICATIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Grupo">
              <select
                value={form.groupKey}
                onChange={(event) =>
                  setForm({ ...form, groupKey: event.target.value })
                }
                className={inputClass}
              >
                {GROUPS.filter((group) => group.value).map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Natureza">
              <select
                value={form.nature}
                onChange={(event) =>
                  setForm({ ...form, nature: event.target.value })
                }
                className={inputClass}
              >
                <option value="devedora">Devedora</option>
                <option value="credora">Credora</option>
              </select>
            </Field>
            <Field label="Conta superior">
              <select
                value={form.parentId}
                onChange={(event) =>
                  setForm({ ...form, parentId: event.target.value })
                }
                className={inputClass}
              >
                <option value="">Sem conta superior</option>
                {accounts
                  .filter((account) => account.id !== editing?.id)
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
              </select>
            </Field>
          </div>

          <Field label="Descrição">
            <input
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              className={inputClass}
            />
          </Field>

          <div className="flex flex-wrap gap-4 text-xs text-slate-600">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isSynthetic}
                onChange={(event) =>
                  setForm({ ...form, isSynthetic: event.target.checked })
                }
              />
              Conta sintética
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.allowsEntries}
                onChange={(event) =>
                  setForm({ ...form, allowsEntries: event.target.checked })
                }
              />
              Aceita lançamentos
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  setForm({ ...form, active: event.target.checked })
                }
              />
              Ativa
            </label>
          </div>

          {editing ? (
            <p className="text-[11px] text-slate-500">
              O código da conta não pode ser alterado após o cadastro, para
              preservar a integridade do histórico ({formatMoney(0)} contábil).
            </p>
          ) : null}
        </form>
      </Modal>
    </AccountingPage>
  );
}
