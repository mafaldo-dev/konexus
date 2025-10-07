import React, { useEffect, useState } from "react"
import { Search, Filter, Plus, MoreHorizontal } from 'lucide-react'
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { Card, CardContent } from "../ui/Card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../ui/Table"
import { Badge } from "../ui/Badge"
import { contasReceber, contasPagar, faturas, pedidos } from "../../../../data/mockData"
import { formatCurrency, formatDate, getStatusVariant } from "../../../../utils/formatters"
import { OrderResponse } from "../../../../service/interfaces"
import handleOrderSales from "../../../../service/api/Administrador/financial"
import { updateOrderStatus } from "../../../../service/api/Administrador/orders"
import Swal from "sweetalert2"

// Status compatíveis com o backend
type OrderStatus = "pending" | "approved" | "in_progress" | "shipped" | "delivered" | "cancelled" | "backout"

export const MovimentacoesTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState("contas-receber")
  const [orders, setOrders] = useState<OrderResponse[]>([])

  const handleOrder = async () => {
    try {
      const response = await handleOrderSales()
      setOrders(response)
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error)
      Swal.fire("Erro", "Erro ao carregar pedidos!", "error")
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
      
      // Mostrar confirmação antes de atualizar
      const result = await Swal.fire({
        title: 'Confirmar atualização',
        text: `Deseja alterar o status para "${getStatusText(newStatus)}"?`,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab("contas-receber")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeSubTab === "contas-receber"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Contas a Receber
          </button>
          <button
            onClick={() => setActiveSubTab("contas-pagar")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeSubTab === "contas-pagar"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Contas a Pagar
          </button>
          <button
            onClick={() => setActiveSubTab("faturas")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeSubTab === "faturas" 
                ? "bg-white shadow-sm text-slate-900" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Faturas
          </button>
          <button
            onClick={() => setActiveSubTab("pedidos")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeSubTab === "pedidos" 
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

      {activeSubTab === "contas-receber" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">{''}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contasReceber.map((conta: any) => (
                  <TableRow key={conta.id}>
                    <TableCell>
                      <p className="font-medium text-slate-900">{conta.cliente}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-600">{conta.projeto}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-mono text-slate-600">{conta.documento}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">{formatCurrency(conta.valor)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{formatDate(conta.vencimento)}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(conta.status)} className="capitalize">
                        {conta.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeSubTab === "contas-pagar" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">{''}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contasPagar.map((conta: any) => (
                  <TableRow key={conta.id}>
                    <TableCell>
                      <p className="font-medium text-slate-900">{conta.fornecedor}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {conta.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-mono text-slate-600">{conta.documento}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">{formatCurrency(conta.valor)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{formatDate(conta.vencimento)}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(conta.status)} className="capitalize">
                        {conta.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeSubTab === "faturas" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">{''}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faturas.map((fatura: any) => (
                  <TableRow key={fatura.id}>
                    <TableCell>
                      <p className="font-mono font-medium text-slate-900">{fatura.numero}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{fatura.cliente}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-600">{fatura.projeto}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">{formatCurrency(fatura.valor)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{formatDate(fatura.emissao)}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(fatura.status)} className="capitalize">
                        {fatura.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeSubTab === "pedidos" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <p className="font-mono font-medium text-slate-900">
                        {order.orderNumber || `#${order.id}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.orderDate).toLocaleDateString('pt-BR')}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{order.customer.name}</p>
                      <p className="text-xs text-gray-500">{order.customer.code}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-600">
                        {order.orderItems?.length || 0} item(s)
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-sm">{order.salesperson}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: order.currency || 'BRL'
                        }).format(order.totalAmount || 0)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge className={`capitalize ${getStatusColor(order.orderStatus)}`}>
                        {getStatusText(order.orderStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.orderStatus === 'pending' || order.orderStatus === 'backout' ? (
                        <Button
                          onClick={() => toggleUpdateStatusOrder(order.id, order.orderStatus)}
                          variant="ghost"
                          size="sm"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      ): (
                         <Button
                          onClick={() => toggleUpdateStatusOrder(order.id, order.orderStatus)}
                          variant="ghost"
                          size="sm"
                          disabled
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Função para cores dos status
const getStatusColor = (status: string) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    approved: 'bg-green-100 text-green-800 hover:bg-green-100',
    in_progress: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    shipped: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    delivered: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    cancelled: 'bg-red-100 text-red-800 hover:bg-red-100',
    backout: "bg-orange-50 text-orange-800 hover:bg-orange-100"
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

// Função para texto dos status em português
const getStatusText = (status: string) => {
  const statusMap = {
    pending: 'Pendente',
    approved: 'Aprovado',
    in_progress: 'Em Andamento',
    shipped: 'Enviado',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
    backout: 'Estornado'
  };
  return statusMap[status as keyof typeof statusMap] || status;
};