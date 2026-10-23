import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileWarning,
  PackageCheck,
  Plus,
  ReceiptText,
  RefreshCw,
  ShieldAlert,
  Undo2,
  XCircle,
} from "lucide-react";
import Swal from "sweetalert2";

import { useAuth } from "../../../AuthContext";
import { DataState } from "../../../components/ui/DataState";
import { Modal } from "../../../components/ui/Modal";
import {
  Alert,
  StatusBadge,
  formatDate,
  formatDateTime,
  formatMoney,
  idempotencyKey,
} from "../../../components/ui/StatusBadge";
import {
  EligibleOrderDetail,
  EligiblePurchaseOrder,
  PurchaseReturn,
  PurchaseReturnStatus,
  PurchaseReturnSummary,
  approvePurchaseReturn,
  cancelPurchaseReturn,
  createPurchaseReturn,
  getEligiblePurchaseOrder,
  getPurchaseReturn,
  getPurchaseReturnSummary,
  listEligiblePurchaseOrders,
  listPurchaseReturns,
  receivePurchaseReturn,
  registerPurchaseReturnCredit,
  rejectPurchaseReturn,
  submitPurchaseReturn,
} from "../../../services/purchaseReturnService";

const STATUS: Record<
  PurchaseReturnStatus,
  { label: string; tone: "slate" | "amber" | "blue" | "green" | "red" }
> = {
  draft: { label: "Rascunho", tone: "slate" },
  pending_approval: { label: "Aguardando aprovação", tone: "amber" },
  approved: { label: "Aprovada", tone: "blue" },
  rejected: { label: "Rejeitada", tone: "red" },
  received: { label: "Recebida", tone: "green" },
  cancelled: { label: "Cancelada", tone: "slate" },
};

const ReturnsPage: React.FC = () => {
  const { activeLegalEntity, hasPermission } = useAuth();
  const canView = hasPermission("compras", "view");
  const canCreate = hasPermission("compras", "create");
  const canEdit = hasPermission("compras", "edit");
  const canMoveStock = hasPermission("estoque", "move");
  const canCredit = hasPermission("finance", "create");

  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [summary, setSummary] = useState<PurchaseReturnSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [orders, setOrders] = useState<EligiblePurchaseOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderDetail, setOrderDetail] = useState<EligibleOrderDetail | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [requiresNfe, setRequiresNfe] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [createKey, setCreateKey] = useState("");
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState<PurchaseReturn | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const legalEntityId = activeLegalEntity?.id;

  const load = useCallback(async () => {
    if (!legalEntityId) {
      setReturns([]);
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const [listResponse, summaryResponse] = await Promise.all([
      listPurchaseReturns({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      }),
      getPurchaseReturnSummary(),
    ]);
    if (!listResponse.ok || !listResponse.data) {
      setError(
        listResponse.error || "Não foi possível carregar as devoluções de compra."
      );
      setReturns([]);
      setSummary(null);
    } else {
      setReturns(listResponse.data);
      setSummary(summaryResponse.ok ? summaryResponse.data : null);
    }
    setLoading(false);
  }, [legalEntityId, search, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = async () => {
    setCreateOpen(true);
    setOrdersLoading(true);
    setOrderId("");
    setOrderDetail(null);
    setReason("");
    setNotes("");
    setRequiresNfe(false);
    setQuantities({});
    setCreateKey(idempotencyKey("purchase-return"));
    setError(null);
    const response = await listEligiblePurchaseOrders();
    if (!response.ok || !response.data) {
      setOrders([]);
      setError(
        response.error || "Não foi possível carregar os pedidos elegíveis."
      );
    } else {
      setOrders(response.data);
    }
    setOrdersLoading(false);
  };

  const selectOrder = async (value: string) => {
    setOrderId(value);
    setOrderDetail(null);
    setQuantities({});
    if (!value) return;
    setOrderLoading(true);
    const response = await getEligiblePurchaseOrder(value);
    if (!response.ok || !response.data) {
      setError(
        response.error || "Não foi possível carregar os itens do pedido."
      );
      setOrderLoading(false);
      return;
    }
    setOrderDetail(response.data);
    setQuantities(
      Object.fromEntries(
        response.data.items.map((item) => [
          String(item.id),
          item.eligible_quantity > 0 ? "0" : "0",
        ])
      )
    );
    setOrderLoading(false);
  };

  const selectedItems = useMemo(() => {
    if (!orderDetail) return [];
    return orderDetail.items
      .map((item) => ({
        ...item,
        returnQuantity: Number(quantities[String(item.id)] || 0),
      }))
      .filter((item) => item.returnQuantity > 0);
  }, [orderDetail, quantities]);

  const projectedTotal = useMemo(
    () =>
      selectedItems.reduce(
        (total, item) => total + item.returnQuantity * Number(item.coast),
        0
      ),
    [selectedItems]
  );

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!orderDetail) {
      setError("Selecione um pedido de compra entregue e informe os itens.");
      return;
    }
    if (selectedItems.length === 0) {
      setError("Informe ao menos um item com quantidade maior que zero.");
      return;
    }
    const invalid = selectedItems.find(
      (item) =>
        item.returnQuantity < 0 ||
        item.returnQuantity > Number(item.eligible_quantity)
    );
    if (invalid) {
      setError(
        `A quantidade de ${invalid.product_name} deve ficar entre 1 e ${invalid.eligible_quantity}.`
      );
      return;
    }
    setSaving(true);
    setError(null);
    const response = await createPurchaseReturn({
      purchaseOrderId: orderDetail.id,
      reason: reason.trim(),
      notes: notes.trim() || undefined,
      requiresNfe,
      idempotencyKey: createKey,
      items: selectedItems.map((item) => ({
        purchaseOrderItemId: item.id,
        quantity: item.returnQuantity,
      })),
    });
    setSaving(false);
    if (!response.ok || !response.data) {
      setError(response.error || "Não foi possível criar a devolução.");
      return;
    }
    setCreateOpen(false);
    setDetail(response.data);
    setSuccess(
      "Rascunho criado. O estoque só será ajustado após aprovação e confirmação do recebimento físico."
    );
    await load();
  };

  const openDetail = async (item: PurchaseReturn) => {
    setDetail(item);
    setDetailLoading(true);
    setError(null);
    const response = await getPurchaseReturn(item.id);
    if (!response.ok || !response.data) {
      setError(response.error || "Não foi possível carregar a devolução.");
    } else {
      setDetail(response.data);
    }
    setDetailLoading(false);
  };

  const refreshDetail = async (id: number) => {
    const response = await getPurchaseReturn(id);
    if (response.ok && response.data) setDetail(response.data);
    await load();
  };

  const action = async (
    label: string,
    callback: () => Promise<{ ok: boolean; error?: string | null }>,
    successMessage: string
  ) => {
    setActionLoading(true);
    setError(null);
    const response = await callback();
    setActionLoading(false);
    if (!response.ok) {
      setError(response.error || `Não foi possível ${label}.`);
      return false;
    }
    setSuccess(successMessage);
    return true;
  };

  const submit = async (item: PurchaseReturn) => {
    const confirmed = await Swal.fire({
      icon: "question",
      title: "Enviar para aprovação?",
      text: "As quantidades voltam a ser conferidas contra outras devoluções do mesmo pedido.",
      showCancelButton: true,
      confirmButtonText: "Enviar",
      cancelButtonText: "Cancelar",
    });
    if (!confirmed.isConfirmed) return;
    const ok = await action(
      "enviar",
      () => submitPurchaseReturn(item.id),
      "Devolução enviada para aprovação."
    );
    if (ok) await refreshDetail(item.id);
  };

  const approve = async (item: PurchaseReturn) => {
    const confirmed = await Swal.fire({
      icon: "question",
      title: "Aprovar devolução?",
      text: "A aprovação reserva as quantidades, mas ainda não baixa o estoque.",
      showCancelButton: true,
      confirmButtonText: "Aprovar",
      cancelButtonText: "Cancelar",
    });
    if (!confirmed.isConfirmed) return;
    const ok = await action(
      "aprovar",
      () => approvePurchaseReturn(item.id),
      "Devolução aprovada. O estoque permanece intacto até o recebimento."
    );
    if (ok) await refreshDetail(item.id);
  };

  const reject = async (item: PurchaseReturn) => {
    const prompt = await Swal.fire({
      icon: "warning",
      title: "Rejeitar devolução",
      input: "textarea",
      inputLabel: "Motivo da rejeição",
      showCancelButton: true,
      confirmButtonText: "Rejeitar",
      cancelButtonText: "Voltar",
      inputValidator: (value) =>
        !value || value.trim().length < 5 ? "Informe o motivo." : null,
    });
    if (!prompt.isConfirmed) return;
    const ok = await action(
      "rejeitar",
      () => rejectPurchaseReturn(item.id, prompt.value.trim()),
      "Devolução rejeitada com motivo auditado."
    );
    if (ok) await refreshDetail(item.id);
  };

  const cancel = async (item: PurchaseReturn) => {
    const prompt = await Swal.fire({
      icon: "warning",
      title: "Cancelar devolução?",
      text: "O cancelamento encerra o processo e libera as quantidades reservadas.",
      input: "textarea",
      inputLabel: "Motivo (opcional)",
      showCancelButton: true,
      confirmButtonText: "Cancelar devolução",
      cancelButtonText: "Voltar",
    });
    if (!prompt.isConfirmed) return;
    const ok = await action(
      "cancelar",
      () => cancelPurchaseReturn(item.id, prompt.value?.trim() || undefined),
      "Devolução cancelada sem alterar o estoque."
    );
    if (ok) await refreshDetail(item.id);
  };

  const receive = async (item: PurchaseReturn) => {
    const confirmed = await Swal.fire({
      icon: "warning",
      title: "Confirmar saída física?",
      text: "Esta ação reduz o estoque do CNPJ e gera o Kardex. Não há estorno automático.",
      showCancelButton: true,
      confirmButtonText: "Confirmar recebimento",
      cancelButtonText: "Voltar",
    });
    if (!confirmed.isConfirmed) return;
    const ok = await action(
      "receber",
      () => receivePurchaseReturn(item.id),
      "Saída confirmada e estoque ajustado no Kardex."
    );
    if (ok) await refreshDetail(item.id);
  };

  const credit = async (item: PurchaseReturn) => {
    const prompt = await Swal.fire({
      icon: "info",
      title: "Registrar crédito ao fornecedor",
      text: "O crédito é registrado separadamente. O título a pagar original não é alterado automaticamente.",
      input: "textarea",
      inputLabel: "Fonte/observação do crédito",
      inputValidator: (value) =>
        !value || value.trim().length < 5 ? "Informe a origem do crédito." : null,
      showCancelButton: true,
      confirmButtonText: "Registrar crédito",
      cancelButtonText: "Voltar",
    });
    if (!prompt.isConfirmed) return;
    const ok = await action(
      "registrar o crédito",
      () => registerPurchaseReturnCredit(item.id, prompt.value.trim()),
      "Crédito ao fornecedor registrado para conciliação."
    );
    if (ok) await refreshDetail(item.id);
  };

  if (!canView) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <DataState variant="forbidden" />
      </div>
    );
  }

  if (!activeLegalEntity) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <DataState
          variant="company-required"
          description="Selecione o CNPJ do comprador no cabeçalho. Devoluções, estoque e crédito são isolados por CNPJ."
        />
      </div>
    );
  }

  const selectedOrder = orderDetail;
  const detailStatus = detail ? STATUS[detail.status] : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Undo2 className="h-5 w-5 text-blue-600" />
            Devoluções de compra
          </h2>
          <p className="text-sm text-slate-500">
            Fluxo por etapas, devolução parcial e rastreabilidade. A nota fiscal de
            devolução não é emitida nem simulada por esta tela.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
              onClick={() => void openCreate()}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Nova devolução
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
              className="text-xs font-semibold underline"
              onClick={() => setSuccess(null)}
            >
              fechar
            </button>
          </div>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Rascunhos</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {summary?.drafts ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-700">Em aprovação</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">
            {summary?.pendingApproval ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-700">Aprovadas</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">
            {summary?.approved ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Recebidas</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">
            {summary?.received ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Valor recebido
          </p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {formatMoney(summary?.totalValue)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Número, pedido, fornecedor ou motivo"
          className="min-w-64 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:max-w-md"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Todas as situações</option>
          {Object.entries(STATUS).map(([value, config]) => (
            <option key={value} value={value}>
              {config.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <DataState variant="loading" />
        </div>
      ) : returns.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <DataState
            variant="empty"
            description="Nenhuma devolução registrada neste CNPJ. Só pedidos de compra entregues ou recebidos podem ser devolvidos."
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Devolução</th>
                  <th className="px-4 py-3">Pedido / fornecedor</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3">Situação</th>
                  <th className="px-4 py-3">Criada em</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returns.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {item.return_number}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{item.ordernumber}</p>
                      <p className="text-xs text-slate-500">{item.supplier_name}</p>
                    </td>
                    <td className="max-w-64 px-4 py-3 text-slate-600">
                      <p className="truncate" title={item.reason}>
                        {item.reason}
                      </p>
                      {(item.requires_nfe || item.fiscal_status !== "not_required") && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700">
                          <FileWarning className="h-3.5 w-3.5" />
                          NF-e de devolução pendente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatMoney(item.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={STATUS[item.status]?.label || item.status}
                        tone={STATUS[item.status]?.tone || "slate"}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void openDetail(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
        <ShieldAlert className="mt-0.5 h-4 w-4 flex-none" />
        <p>
          A baixa de estoque ocorre somente em “Confirmar recebimento”. O crédito ao
          fornecedor é um registro separado e não altera automaticamente contas a
          pagar. Nenhuma NF-e é transmitida por esta tela.
        </p>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nova devolução de compra"
        description="Selecione um pedido entregue. As quantidades já devolvidas em outros processos são descontadas."
        wide
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="purchase-return-form"
              disabled={saving || !orderDetail || selectedItems.length === 0}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar rascunho"}
            </button>
          </>
        }
      >
        <form
          id="purchase-return-form"
          onSubmit={submitCreate}
          className="space-y-4"
        >
          {ordersLoading ? (
            <DataState variant="loading" compact />
          ) : orders.length === 0 ? (
            <Alert tone="amber">
              Não há pedidos de compra entregues/recebidos com saldo devolvível.
              Conclua o recebimento da compra antes de devolver.
            </Alert>
          ) : (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Pedido de compra
              </span>
              <select
                value={orderId}
                onChange={(event) => void selectOrder(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Selecione...</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.ordernumber} · {order.supplier_name} ·{" "}
                    {formatDate(order.orderdate)}
                  </option>
                ))}
              </select>
            </label>
          )}

          {orderLoading && <DataState variant="loading" compact />}

          {selectedOrder && (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="flex flex-wrap justify-between gap-2 bg-slate-50 px-3 py-2 text-sm">
                <span className="font-semibold text-slate-800">
                  {selectedOrder.ordernumber}
                </span>
                <span className="text-slate-600">{selectedOrder.supplier_name}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Produto</th>
                      <th className="px-3 py-2 text-right">Comprado</th>
                      <th className="px-3 py-2 text-right">Já devolvido</th>
                      <th className="px-3 py-2 text-right">Elegível</th>
                      <th className="px-3 py-2 text-right">Custo unit.</th>
                      <th className="px-3 py-2 text-right">Devolver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-900">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-slate-400">{item.product_code}</p>
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600">
                          {item.consumed_quantity}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">
                          {item.eligible_quantity}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600">
                          {formatMoney(item.coast)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            max={item.eligible_quantity}
                            step={1}
                            disabled={item.eligible_quantity <= 0}
                            value={quantities[String(item.id)] || "0"}
                            onChange={(event) =>
                              setQuantities({
                                ...quantities,
                                [String(item.id)]: event.target.value,
                              })
                            }
                            className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-right"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end border-t border-slate-200 px-3 py-2 text-sm">
                Total projetado:&nbsp;
                <strong>{formatMoney(projectedTotal)}</strong>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">Motivo</span>
              <input
                required
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Produto avariado, divergência de quantidade..."
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">
                Observações internas
              </span>
              <textarea
                rows={2}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="flex items-start gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={requiresNfe}
                onChange={(event) => setRequiresNfe(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                Exige NF-e de devolução
                <span className="block text-xs text-slate-500">
                  Fica registrado como pendência fiscal. A emissão não é simulada
                  nesta entrega.
                </span>
              </span>
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `Devolução ${detail.return_number}` : "Devolução"}
        description={
          detail
            ? `${detail.ordernumber} · ${detail.supplier_name} · ${
                detailStatus?.label || detail.status
              }`
            : undefined
        }
        wide
        footer={
          <>
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Fechar
            </button>
            {detail && canEdit && detail.status === "draft" && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void submit(detail)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <ClipboardCheck className="h-4 w-4" />
                Enviar para aprovação
              </button>
            )}
            {detail && canEdit && detail.status === "pending_approval" && (
              <>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void reject(detail)}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Rejeitar
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void approve(detail)}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Aprovar
                </button>
              </>
            )}
            {detail && canEdit && detail.status === "approved" && (
              <button
                type="button"
                disabled={actionLoading || !canMoveStock}
                title={!canMoveStock ? "Requer permissão de movimentar estoque." : undefined}
                onClick={() => void receive(detail)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
              >
                <PackageCheck className="h-4 w-4" />
                Confirmar recebimento
              </button>
            )}
            {detail &&
              canEdit &&
              detail.status === "received" &&
              !detail.credit && (
                <button
                  type="button"
                  disabled={actionLoading || !canCredit}
                  title={
                    !canCredit
                      ? "Requer permissão financeira para criar lançamentos."
                      : undefined
                  }
                  onClick={() => void credit(detail)}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-50"
                >
                  <ReceiptText className="h-4 w-4" />
                  Registrar crédito
                </button>
              )}
            {detail &&
              canEdit &&
              ["draft", "pending_approval", "approved"].includes(detail.status) && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void cancel(detail)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Ban className="h-4 w-4" />
                  Cancelar
                </button>
              )}
          </>
        }
      >
        {detailLoading ? (
          <DataState variant="loading" compact />
        ) : detail ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase text-slate-500">Valor</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {formatMoney(detail.total_amount)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase text-slate-500">Criada</p>
                <p className="mt-1 text-sm text-slate-800">
                  {formatDateTime(detail.created_at)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase text-slate-500">Aprovação</p>
                <p className="mt-1 text-sm text-slate-800">
                  {formatDateTime(detail.approved_at)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase text-slate-500">Recebimento</p>
                <p className="mt-1 text-sm text-slate-800">
                  {formatDateTime(detail.received_at)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-semibold text-slate-900">Motivo</h4>
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                {detail.reason}
              </p>
              {detail.notes && (
                <p className="mt-2 text-sm text-slate-500">{detail.notes}</p>
              )}
            </div>

            {detail.requires_nfe && (
              <Alert tone="amber">
                <span className="flex items-start gap-2">
                  <FileWarning className="mt-0.5 h-4 w-4 flex-none" />
                  NF-e de devolução registrada como pendente. Nenhum documento fiscal
                  foi transmitido ou autorizado por esta tela.
                </span>
              </Alert>
            )}

            <div>
              <h4 className="mb-2 font-semibold text-slate-900">Itens</h4>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Produto</th>
                      <th className="px-3 py-2 text-right">Quantidade</th>
                      <th className="px-3 py-2 text-right">Custo unit.</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(detail.items || []).map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-900">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-slate-400">{item.product_code}</p>
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-700">
                          {formatMoney(item.unit_cost)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">
                          {formatMoney(item.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {detail.credit && (
              <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900">
                <p className="font-semibold">
                  Crédito ao fornecedor: {formatMoney(detail.credit.amount)}
                </p>
                <p className="text-xs">
                  {detail.credit.source_note || "Sem observação"} ·{" "}
                  {formatDateTime(detail.credit.created_at)}
                </p>
                <p className="mt-1 text-xs">
                  O título a pagar não foi alterado automaticamente.
                </p>
              </div>
            )}

            <div>
              <h4 className="mb-2 font-semibold text-slate-900">Histórico</h4>
              {(detail.events || []).length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum evento registrado.</p>
              ) : (
                <ol className="space-y-2 border-l border-slate-200 pl-4">
                  {(detail.events || []).map((event) => (
                    <li key={event.id} className="text-sm">
                      <p className="font-medium text-slate-800">
                        {event.event_type}
                        {event.to_status ? ` → ${event.to_status}` : ""}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(event.created_at)} ·{" "}
                        {event.actor_username || "sistema"}
                        {event.notes ? ` · ${event.notes}` : ""}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        ) : (
          <DataState variant="empty" compact />
        )}
      </Modal>
    </div>
  );
};

export default ReturnsPage;
