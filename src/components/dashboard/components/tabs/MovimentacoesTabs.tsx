import React, { useEffect, useState } from "react"
import { Search, Filter, Plus, MoreHorizontal } from 'lucide-react'
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { Badge } from "../ui/Badge"
import { contasReceber, contasPagar, faturas } from "../../../../data/mockData"
import { formatCurrency, formatDate, getStatusVariant } from "../../../../utils/formatters"
import { OrderResponse } from "../../../../service/interfaces"
import handleOrderSales from "../../../../service/api/Administrador/financial"
import { updateOrderStatus } from "../../../../service/api/Administrador/orders"
import Swal from "sweetalert2"
import { DynamicTable } from "../../../../utils/Table/DynamicTable"
import { mapOrderStatus, getStatusLabel, ORDER_STATUS } from "../../../utils/statusLabel"


// Status compatíveis com o backend
type OrderStatus = "pending" | "approved" | "in_progress" | "shipped" | "delivered" | "cancelled" | "backout" | any

export const MovimentacoesTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState("contas-receber")
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleOrder = async () => {
    try {
      setIsLoading(true)
      const response = await handleOrderSales()
      // Mapear os status ao carregar os pedidos
      const mappedOrders = response.map((order: any) => ({
        ...order,
        orderStatus: mapOrderStatus(order.orderStatus)
      }))
      setOrders(mappedOrders)
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error)
      Swal.fire("Erro", "Erro ao carregar pedidos!", "error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    handleOrder()
  }, [])

  const toggleUpdateStatusOrder = async (orderId: string | number, currentStatus: string) => {
    try {
      const nextStatusMap: Record<string, OrderStatus> = {
        'pending': 'approved',
        'approved': 'in_progress',
        'in_progress': 'shipped',
        'shipped': 'delivered',
        'delivered': 'delivered',
        'cancelled': 'cancelled',
        'backout': 'backout'
      }

      const newStatus = currentStatus === 'backout'
        ? 'approved'
        : (nextStatusMap[currentStatus] || 'approved');

      // Mostrar confirmação antes de atualizar usando getStatusLabel
      const result = await Swal.fire({
        title: 'Confirmar atualização',
        text: `Deseja alterar o status para "${getStatusLabel(newStatus)}"?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sim, atualizar',
        cancelButtonText: 'Cancelar'
      })

      if (result.isConfirmed) {
        await updateOrderStatus(orderId, newStatus)

        // Atualizar estado local
        const updatedOrders = orders.map((order) =>
          order.id === orderId ? { ...order, orderStatus: newStatus } : order
        )
        setOrders(updatedOrders)

        Swal.fire("Sucesso", "Status atualizado com sucesso!", "success")
      }
    } catch (error) {
      console.error("Erro ao atualizar o status do Pedido: ", error)
      Swal.fire("Erro", "Erro ao atualizar status do pedido!", "error")
    }
  }

  // ============================================
  // DEFINIÇÃO DAS COLUNAS - CONTAS A RECEBER
  // ============================================
  const contasReceberColumns = [
    {
      key: 'cliente',
      header: 'Cliente',
      render: (conta: any) => (
        <p className="font-medium text-slate-900">{conta.cliente}</p>
      ),
    },
    {
      key: 'projeto',
      header: 'Projeto',
      render: (conta: any) => (
        <p className="text-sm text-slate-600">{conta.projeto}</p>
      ),
    },
    {
      key: 'documento',
      header: 'Documento',
      render: (conta: any) => (
        <p className="text-sm font-mono text-slate-600">{conta.documento}</p>
      ),
    },
    {
      key: 'valor',
      header: 'Valor',
      render: (conta: any) => (
        <p className="font-semibold">{formatCurrency(conta.valor)}</p>
      ),
    },
    {
      key: 'vencimento',
      header: 'Vencimento',
      render: (conta: any) => (
        <p className="text-sm">{formatDate(conta.vencimento)}</p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (conta: any) => (
        <Badge variant={getStatusVariant(conta.status)} className="capitalize">
          {conta.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: () => (
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  // ============================================
  // DEFINIÇÃO DAS COLUNAS - CONTAS A PAGAR
  // ============================================
  const contasPagarColumns = [
    {
      key: 'fornecedor',
      header: 'Fornecedor',
      render: (conta: any) => (
        <p className="font-medium text-slate-900">{conta.fornecedor}</p>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoria',
      render: (conta: any) => (
        <Badge variant="outline" className="text-xs">
          {conta.categoria}
        </Badge>
      ),
    },
    {
      key: 'documento',
      header: 'Documento',
      render: (conta: any) => (
        <p className="text-sm font-mono text-slate-600">{conta.documento}</p>
      ),
    },
    {
      key: 'valor',
      header: 'Valor',
      render: (conta: any) => (
        <p className="font-semibold">{formatCurrency(conta.valor)}</p>
      ),
    },
    {
      key: 'vencimento',
      header: 'Vencimento',
      render: (conta: any) => (
        <p className="text-sm">{formatDate(conta.vencimento)}</p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (conta: any) => (
        <Badge variant={getStatusVariant(conta.status)} className="capitalize">
          {conta.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: () => (
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  // ============================================
  // DEFINIÇÃO DAS COLUNAS - FATURAS
  // ============================================
  const faturasColumns = [
    {
      key: 'numero',
      header: 'Número',
      render: (fatura: any) => (
        <p className="font-mono font-medium text-slate-900">{fatura.numero}</p>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (fatura: any) => (
        <p className="font-medium">{fatura.cliente}</p>
      ),
    },
    {
      key: 'projeto',
      header: 'Projeto',
      render: (fatura: any) => (
        <p className="text-sm text-slate-600">{fatura.projeto}</p>
      ),
    },
    {
      key: 'valor',
      header: 'Valor',
      render: (fatura: any) => (
        <p className="font-semibold">{formatCurrency(fatura.valor)}</p>
      ),
    },
    {
      key: 'emissao',
      header: 'Emissão',
      render: (fatura: any) => (
        <p className="text-sm">{formatDate(fatura.emissao)}</p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (fatura: any) => (
        <Badge variant={getStatusVariant(fatura.status)} className="capitalize">
          {fatura.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: () => (
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  // ============================================
  // DEFINIÇÃO DAS COLUNAS - PEDIDOS
  // ============================================
  const pedidosColumns = [
    {
      key: 'orderNumber',
      header: 'Número',
      render: (order: OrderResponse) => (
        <div>
          <p className="font-mono font-medium text-slate-900">
            {order.orderNumber || `#${order.id}`}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(order.orderDate).toLocaleDateString('pt-BR')}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Cliente',
      render: (order: OrderResponse) => (
        <div>
          <p className="font-medium">{order.customer.name}</p>
          <p className="text-xs text-gray-500">{order.customer.code}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Itens',
      render: (order: OrderResponse) => (
        <p className="text-sm text-slate-600">
          {order.orderItems?.length || 0} item(s)
        </p>
      ),
    },
    {
      key: 'salesperson',
      header: 'Vendedor',
      render: (order: OrderResponse) => (
        <p className="font-semibold text-sm">{order.salesperson}</p>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total',
      render: (order: OrderResponse) => (
        <p className="font-semibold">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: order.currency || 'BRL'
          }).format(order.totalAmount || 0)}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order: OrderResponse) => {
        const statusInfo = ORDER_STATUS[order.orderStatus] || {
          label: order.orderStatus,
          color: "bg-gray-50 text-gray-800 border-gray-200"
        };
        return (
          <Badge className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (order: OrderResponse) => {
        const canUpdate = order.orderStatus === 'pending' || order.orderStatus === 'backout';
        return (
          <Button
            onClick={() => toggleUpdateStatusOrder(order.id, order.orderStatus)}
            variant="ghost"
            size="sm"
            disabled={!canUpdate}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab("contas-receber")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeSubTab === "contas-receber"
              ? "bg-white shadow-sm text-slate-900"
              : "text-slate-600 hover:text-slate-900"
              }`}
          >
            Contas a Receber
          </button>
          <button
            onClick={() => setActiveSubTab("contas-pagar")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeSubTab === "contas-pagar"
              ? "bg-white shadow-sm text-slate-900"
              : "text-slate-600 hover:text-slate-900"
              }`}
          >
            Contas a Pagar
          </button>
          <button
            onClick={() => setActiveSubTab("faturas")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeSubTab === "faturas"
              ? "bg-white shadow-sm text-slate-900"
              : "text-slate-600 hover:text-slate-900"
              }`}
          >
            Faturas
          </button>
          <button
            onClick={() => setActiveSubTab("pedidos")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeSubTab === "pedidos"
              ? "bg-white shadow-sm text-slate-900"
              : "text-slate-600 hover:text-slate-900"
              }`}
          >
            Pedidos
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Buscar transações..." className="pl-10 w-64" />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* CONTAS A RECEBER - TABELA DINÂMICA */}
      {activeSubTab === "contas-receber" && (
        <DynamicTable
          data={contasReceber}
          columns={contasReceberColumns}
          loading={false}
          emptyMessage="Nenhuma conta a receber encontrada"
          emptyDescription="As contas aparecerão aqui quando houver"
        />
      )}

      {/* CONTAS A PAGAR - TABELA DINÂMICA */}
      {activeSubTab === "contas-pagar" && (
        <DynamicTable
          data={contasPagar}
          columns={contasPagarColumns}
          loading={false}
          emptyMessage="Nenhuma conta a pagar encontrada"
          emptyDescription="As contas aparecerão aqui quando houver"
        />
      )}

      {/* FATURAS - TABELA DINÂMICA */}
      {activeSubTab === "faturas" && (
        <DynamicTable
          data={faturas}
          columns={faturasColumns}
          loading={false}
          emptyMessage="Nenhuma fatura encontrada"
          emptyDescription="As faturas aparecerão aqui quando houver"
        />
      )}

      {/* PEDIDOS - TABELA DINÂMICA */}
      {activeSubTab === "pedidos" && (
        <DynamicTable
          data={orders}
          columns={pedidosColumns}
          loading={isLoading}
          emptyMessage="Nenhum pedido encontrado"
          emptyDescription="Os pedidos aparecerão aqui quando houver"
        />
      )}
    </div>
  )
}