import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  History,
  Landmark,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Wallet,
} from "lucide-react";
import Swal from "sweetalert2";

import { useAuth } from "../../../../AuthContext";
import { DataState } from "../../../ui/DataState";
import { Modal } from "../../../ui/Modal";
import {
  Alert,
  StatusBadge,
  formatDate,
  formatMoney,
  idempotencyKey,
  todayInput,
} from "../../../ui/StatusBadge";
import {
  BankAccount,
  BankAccountSummary,
  BankAccountType,
  BankTransaction,
  createBankAccount,
  createBankTransaction,
  getBankAccountSummary,
  listBankAccounts,
  listBankTransactions,
  reverseBankTransaction,
  updateBankAccount,
} from "../../../../services/bankAccountService";

const ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  payment: "Conta de pagamento",
  investment: "Investimento",
  cash: "Caixa",
};

interface AccountFormState {
  bankCode: string;
  bankName: string;
  agency: string;
  accountNumber: string;
  accountDigit: string;
  accountType: BankAccountType;
  holderName: string;
  holderDocument: string;
  initialBalance: string;
  initialBalanceDate: string;
  notes: string;
  status: "active" | "inactive";
}

const EMPTY_ACCOUNT: AccountFormState = {
  bankCode: "",
  bankName: "",
  agency: "",
  accountNumber: "",
  accountDigit: "",
  accountType: "checking",
  holderName: "",
  holderDocument: "",
  initialBalance: "0.00",
  initialBalanceDate: todayInput(),
  notes: "",
  status: "active",
};

interface MovementFormState {
  direction: "credit" | "debit";
  amount: string;
  transactionDate: string;
  description: string;
  category: string;
}

const EMPTY_MOVEMENT: MovementFormState = {
  direction: "credit",
  amount: "",
  transactionDate: todayInput(),
  description: "",
  category: "",
};

export const BancosTab: React.FC = () => {
  const { activeLegalEntity, hasPermission } = useAuth();
  const canCreate = hasPermission("finance", "create");
  const canEdit = hasPermission("finance", "edit");

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [summary, setSummary] = useState<BankAccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [accountForm, setAccountForm] = useState<AccountFormState>(EMPTY_ACCOUNT);
  const [savingAccount, setSavingAccount] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementForm, setMovementForm] =
    useState<MovementFormState>(EMPTY_MOVEMENT);
  const [movementKey, setMovementKey] = useState("");
  const [savingMovement, setSavingMovement] = useState(false);

  const legalEntityId = activeLegalEntity?.id;

  const load = useCallback(async () => {
    if (!legalEntityId) {
      setAccounts([]);
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const [accountResponse, summaryResponse] = await Promise.all([
      listBankAccounts(),
      getBankAccountSummary(),
    ]);
    if (!accountResponse.ok || !accountResponse.data) {
      setError(accountResponse.error || "Não foi possível carregar as contas.");
      setAccounts([]);
      setSummary(null);
      setLoading(false);
      return;
    }
    setAccounts(accountResponse.data);
    setSummary(summaryResponse.ok ? summaryResponse.data : null);
    setSelectedAccount((current) => {
      if (!current) return null;
      return (
        accountResponse.data?.find((account) => account.id === current.id) || null
      );
    });
    setLoading(false);
  }, [legalEntityId]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadTransactions = useCallback(async (account: BankAccount) => {
    setTransactionsLoading(true);
    setTransactionError(null);
    const response = await listBankTransactions(account.id);
    if (!response.ok || !response.data) {
      setTransactions([]);
      setTransactionError(
        response.error || "Não foi possível carregar as movimentações."
      );
    } else {
      setTransactions(response.data);
    }
    setTransactionsLoading(false);
  }, []);

  useEffect(() => {
    if (selectedAccount) void loadTransactions(selectedAccount);
    else setTransactions([]);
  }, [selectedAccount, loadTransactions]);

  const openNewAccount = () => {
    setEditingAccount(null);
    setAccountForm(EMPTY_ACCOUNT);
    setAccountModalOpen(true);
    setError(null);
  };

  const openEditAccount = (account: BankAccount) => {
    setEditingAccount(account);
    setAccountForm({
      bankCode: account.bank_code,
      bankName: account.bank_name,
      agency: account.agency,
      accountNumber: account.account_number,
      accountDigit: account.account_digit || "",
      accountType: account.account_type,
      holderName: account.holder_name,
      holderDocument: account.holder_document || "",
      initialBalance: Number(account.initial_balance).toFixed(2),
      initialBalanceDate: account.initial_balance_date?.slice(0, 10) || todayInput(),
      notes: account.notes || "",
      status: account.status,
    });
    setAccountModalOpen(true);
    setError(null);
  };

  const submitAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingAccount(true);
    setError(null);
    const payload = {
      bankCode: accountForm.bankCode.trim(),
      bankName: accountForm.bankName.trim(),
      agency: accountForm.agency.trim(),
      accountNumber: accountForm.accountNumber.trim(),
      accountDigit: accountForm.accountDigit.trim() || undefined,
      accountType: accountForm.accountType,
      holderName: accountForm.holderName.trim(),
      holderDocument: accountForm.holderDocument.trim() || undefined,
      initialBalance: accountForm.initialBalance,
      initialBalanceDate: accountForm.initialBalanceDate,
      notes: accountForm.notes.trim() || undefined,
      status: accountForm.status,
    };
    const response = editingAccount
      ? await updateBankAccount(editingAccount.id, payload)
      : await createBankAccount(payload);
    setSavingAccount(false);
    if (!response.ok || !response.data) {
      setError(response.error || "Não foi possível salvar a conta bancária.");
      return;
    }
    setAccountModalOpen(false);
    setSuccess(
      editingAccount
        ? "Conta bancária atualizada com auditoria."
        : "Conta bancária criada com saldo inicial persistido."
    );
    await load();
  };

  const openMovement = () => {
    if (!selectedAccount) return;
    setMovementForm(EMPTY_MOVEMENT);
    setMovementKey(idempotencyKey("bank-tx"));
    setMovementModalOpen(true);
    setTransactionError(null);
  };

  const submitMovement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAccount) return;
    setSavingMovement(true);
    setTransactionError(null);
    const response = await createBankTransaction(selectedAccount.id, {
      direction: movementForm.direction,
      amount: movementForm.amount,
      transactionDate: movementForm.transactionDate,
      description: movementForm.description.trim(),
      category: movementForm.category.trim() || undefined,
      idempotencyKey: movementKey,
    });
    setSavingMovement(false);
    if (!response.ok || !response.data) {
      setTransactionError(
        response.error || "Não foi possível registrar a movimentação."
      );
      return;
    }
    setMovementModalOpen(false);
    setSuccess(
      response.data.replayed
        ? "Movimentação já registrada; nenhum lançamento duplicado foi criado."
        : "Movimentação bancária registrada."
    );
    await load();
    const refreshed = accounts.find((item) => item.id === selectedAccount.id);
    if (refreshed) setSelectedAccount(refreshed);
    await loadTransactions(selectedAccount);
  };

  const reverseTransaction = async (transaction: BankTransaction) => {
    if (!selectedAccount) return;
    const prompt = await Swal.fire({
      title: "Estornar movimentação?",
      text: "O lançamento original permanece no histórico e deixa de compor o saldo.",
      input: "textarea",
      inputLabel: "Motivo do estorno",
      inputPlaceholder: "Informe o motivo auditável do estorno",
      showCancelButton: true,
      confirmButtonText: "Estornar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) =>
        !value || value.trim().length < 3 ? "Informe o motivo." : null,
    });
    if (!prompt.isConfirmed) return;
    const response = await reverseBankTransaction(
      selectedAccount.id,
      transaction.id,
      prompt.value.trim()
    );
    if (!response.ok) {
      setTransactionError(response.error || "Não foi possível estornar.");
      return;
    }
    setSuccess("Movimentação estornada; saldo recalculado.");
    await load();
    await loadTransactions(selectedAccount);
  };

  const totals = useMemo(
    () => ({
      accounts: summary?.accounts ?? accounts.length,
      active:
        summary?.activeAccounts ??
        accounts.filter((account) => account.status === "active").length,
      balance:
        summary?.totalBalance ??
        accounts.reduce((sum, account) => sum + Number(account.current_balance), 0),
    }),
    [accounts, summary]
  );

  if (!activeLegalEntity) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <DataState
          variant="company-required"
          description="Selecione o CNPJ no cabeçalho para consultar as contas bancárias. O saldo nunca é compartilhado entre CNPJs."
        />
      </div>
    );
  }

  if (!hasPermission("finance", "view")) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <DataState variant="forbidden" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Landmark className="h-5 w-5 text-blue-600" />
            Contas bancárias de {activeLegalEntity.tradeName || activeLegalEntity.legalName}
          </h2>
          <p className="text-sm text-slate-500">
            Saldos derivados exclusivamente de saldo inicial e movimentações persistidas
            neste CNPJ.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={openNewAccount}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Nova conta
            </button>
          )}
        </div>
      </div>

      {error && <Alert>{error}</Alert>}
      {success && (
        <Alert tone="green">
          <div className="flex items-center justify-between gap-3">
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="text-xs font-semibold underline"
            >
              fechar
            </button>
          </div>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Contas cadastradas</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totals.accounts}</p>
          <p className="text-xs text-slate-500">{totals.active} ativa(s)</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Saldo consolidado do CNPJ</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {formatMoney(totals.balance)}
          </p>
          <p className="text-xs text-slate-500">Sem compensação entre CNPJs</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-semibold">Saldo não editável</p>
          <p className="mt-1 text-xs">
            Depois de existir movimentação, o saldo inicial fica bloqueado. Ajustes
            exigem um lançamento de crédito ou débito auditado.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <DataState variant="loading" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <DataState
            variant="empty"
            description="Cadastre a primeira conta bancária para registrar saldo e movimentações reais."
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Banco / conta</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Saldo inicial</th>
                  <th className="px-4 py-3">Saldo atual</th>
                  <th className="px-4 py-3">Movimentos</th>
                  <th className="px-4 py-3">Situação</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        {account.bank_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Ag. {account.agency} · Conta {account.account_number}
                        {account.account_digit ? `-${account.account_digit}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {ACCOUNT_TYPE_LABELS[account.account_type]}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatMoney(account.initial_balance)}
                      <p className="text-xs text-slate-400">
                        {formatDate(account.initial_balance_date)}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatMoney(account.current_balance)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {account.transaction_count}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={account.status === "active" ? "Ativa" : "Inativa"}
                        tone={account.status === "active" ? "green" : "slate"}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedAccount(account)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <History className="h-3.5 w-3.5" />
                          Extrato
                        </button>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => openEditAccount(account)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                            aria-label="Editar conta"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        title={editingAccount ? "Editar conta bancária" : "Nova conta bancária"}
        description="Os dados e o saldo inicial são gravados no CNPJ selecionado."
        footer={
          <>
            <button
              type="button"
              onClick={() => setAccountModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="bank-account-form"
              disabled={savingAccount}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {savingAccount ? "Salvando..." : "Salvar conta"}
            </button>
          </>
        }
      >
        <form
          id="bank-account-form"
          onSubmit={submitAccount}
          className="grid gap-4 sm:grid-cols-2"
        >
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Código do banco</span>
            <input
              required
              value={accountForm.bankCode}
              onChange={(event) =>
                setAccountForm({ ...accountForm, bankCode: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="001"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Nome do banco</span>
            <input
              required
              value={accountForm.bankName}
              onChange={(event) =>
                setAccountForm({ ...accountForm, bankName: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Agência</span>
            <input
              required
              value={accountForm.agency}
              onChange={(event) =>
                setAccountForm({ ...accountForm, agency: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <div className="grid grid-cols-[1fr_90px] gap-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Conta</span>
              <input
                required
                value={accountForm.accountNumber}
                onChange={(event) =>
                  setAccountForm({ ...accountForm, accountNumber: event.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Dígito</span>
              <input
                value={accountForm.accountDigit}
                onChange={(event) =>
                  setAccountForm({ ...accountForm, accountDigit: event.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Tipo</span>
            <select
              value={accountForm.accountType}
              onChange={(event) =>
                setAccountForm({
                  ...accountForm,
                  accountType: event.target.value as BankAccountType,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Titular</span>
            <input
              required
              value={accountForm.holderName}
              onChange={(event) =>
                setAccountForm({ ...accountForm, holderName: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Documento do titular
            </span>
            <input
              value={accountForm.holderDocument}
              onChange={(event) =>
                setAccountForm({ ...accountForm, holderDocument: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Saldo inicial</span>
            <input
              type="number"
              step="0.01"
              required
              value={accountForm.initialBalance}
              onChange={(event) =>
                setAccountForm({ ...accountForm, initialBalance: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              disabled={
                Boolean(editingAccount) && Number(editingAccount?.transaction_count) > 0
              }
            />
            {Boolean(editingAccount?.transaction_count) && (
              <span className="mt-1 block text-xs text-amber-700">
                Bloqueado: já existem movimentações. Use um ajuste.
              </span>
            )}
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Data do saldo inicial
            </span>
            <input
              type="date"
              value={accountForm.initialBalanceDate}
              onChange={(event) =>
                setAccountForm({
                  ...accountForm,
                  initialBalanceDate: event.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Situação</span>
            <select
              value={accountForm.status}
              onChange={(event) =>
                setAccountForm({
                  ...accountForm,
                  status: event.target.value as "active" | "inactive",
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="active">Ativa</option>
              <option value="inactive">Inativa</option>
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">Observações</span>
            <textarea
              rows={2}
              value={accountForm.notes}
              onChange={(event) =>
                setAccountForm({ ...accountForm, notes: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(selectedAccount)}
        onClose={() => setSelectedAccount(null)}
        wide
        title={`Extrato — ${selectedAccount?.bank_name || ""}`}
        description={
          selectedAccount
            ? `Ag. ${selectedAccount.agency} · Conta ${selectedAccount.account_number}${
                selectedAccount.account_digit ? `-${selectedAccount.account_digit}` : ""
              } · Saldo atual ${formatMoney(selectedAccount.current_balance)}`
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelectedAccount(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Fechar
            </button>
            {canCreate && selectedAccount?.status === "active" && (
              <button
                type="button"
                onClick={openMovement}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Nova movimentação
              </button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          {transactionError && <Alert>{transactionError}</Alert>}
          {transactionsLoading ? (
            <DataState variant="loading" compact />
          ) : transactions.length === 0 ? (
            <DataState
              variant="empty"
              description="Nenhuma movimentação registrada. O saldo atual é o saldo inicial."
              compact
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Descrição</th>
                    <th className="px-3 py-2">Categoria</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2 text-right">Valor</th>
                    <th className="px-3 py-2">Situação</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-3 py-2 text-slate-600">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-900">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-slate-400">
                          {transaction.created_by_username || "sistema"}
                        </p>
                        {transaction.status === "reversed" &&
                          transaction.reversal_reason && (
                            <p className="text-xs text-rose-600">
                              Estorno: {transaction.reversal_reason}
                            </p>
                          )}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {transaction.category || "—"}
                      </td>
                      <td className="px-3 py-2">
                        {transaction.direction === "credit" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <ArrowDownLeft className="h-4 w-4" /> Crédito
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700">
                            <ArrowUpRight className="h-4 w-4" /> Débito
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-semibold ${
                          transaction.direction === "credit"
                            ? "text-emerald-700"
                            : "text-rose-700"
                        }`}
                      >
                        {transaction.direction === "credit" ? "+" : "−"}
                        {formatMoney(transaction.amount)}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          label={
                            transaction.status === "posted"
                              ? "Confirmado"
                              : "Estornado"
                          }
                          tone={
                            transaction.status === "posted" ? "green" : "red"
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {canEdit && transaction.status === "posted" && (
                          <button
                            type="button"
                            onClick={() => void reverseTransaction(transaction)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                            title="Estornar"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Estornar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={movementModalOpen}
        onClose={() => setMovementModalOpen(false)}
        title="Nova movimentação bancária"
        description="A movimentação é imutável; correções são feitas por estorno auditado."
        footer={
          <>
            <button
              type="button"
              onClick={() => setMovementModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="bank-movement-form"
              disabled={savingMovement}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {savingMovement ? "Registrando..." : "Registrar"}
            </button>
          </>
        }
      >
        <form
          id="bank-movement-form"
          onSubmit={submitMovement}
          className="grid gap-4 sm:grid-cols-2"
        >
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Tipo</span>
            <select
              value={movementForm.direction}
              onChange={(event) =>
                setMovementForm({
                  ...movementForm,
                  direction: event.target.value as "credit" | "debit",
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="credit">Crédito (entrada)</option>
              <option value="debit">Débito (saída)</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Valor</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={movementForm.amount}
              onChange={(event) =>
                setMovementForm({ ...movementForm, amount: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Data</span>
            <input
              type="date"
              required
              max={todayInput()}
              value={movementForm.transactionDate}
              onChange={(event) =>
                setMovementForm({
                  ...movementForm,
                  transactionDate: event.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Categoria</span>
            <input
              value={movementForm.category}
              onChange={(event) =>
                setMovementForm({ ...movementForm, category: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Vendas, fornecedores, tarifas..."
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">Descrição</span>
            <input
              required
              value={movementForm.description}
              onChange={(event) =>
                setMovementForm({ ...movementForm, description: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </form>
      </Modal>

      <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-500">
        <Wallet className="mt-0.5 h-4 w-4 flex-none text-slate-400" />
        <p>
          O fluxo de caixa realizado usa somente movimentações bancárias confirmadas.
          Contas a pagar e a receber aparecem como previsão/conciliação, sem somar
          novamente o mesmo dinheiro.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Building2 className="h-3.5 w-3.5" />
        Histórico preservado por CNPJ, mesmo após inativação da conta.
      </div>
    </div>
  );
};
