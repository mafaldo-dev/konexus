import React, { useEffect, useState } from "react"

import { Search, Filter, Plus, MoreHorizontal } from 'lucide-react'
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { Card, CardContent } from "../ui/Card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../ui/Table"
import { Badge } from "../ui/Badge"

import { contasReceber, contasPagar, faturas, pedidos } from "../../../../data/mockData"
import { formatCurrency, formatDate, getStatusVariant } from "../../../../utils/formatters"
import { Order } from "../../../../service/interfaces"
import handleOrderSales from "../../../../service/api/Administrador/financial"
import { updateOrderStatus } from "../../../../service/api/Administrador/orders"
import Swal from "sweetalert2"

type OrderStatus = "Pendente" | "Liberado" | "Separando" | "Finalizado" | "Enviado"

export const MovimentacoesTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState("contas-receber")
  const [orders, setOrders] = useState<Order[]>([])

  const handleOrder = async () => {
    const response = await handleOrderSales()
    setOrders(response)
    console.log(response)
  }

  useEffect(() => {
    handleOrder()
  }, [])

  const toggleUpdateStatusOrder = async (orderId: string | number, newStatus: OrderStatus) => {
    try {
      const shouldUpdateStatus = newStatus === "Liberado" || newStatus === "Enviado"
      if (shouldUpdateStatus) {
        await updateOrderStatus(orderId, newStatus)
      }
      const updatedOrders = orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      setOrders(updatedOrders)
    } catch (error) {
      console.error("Erro ao atualizar o status do Pedido: ", error)
      Swal.fire("Erro", "Erro ao atualizar status do pedido!", "error")
    }
  }

  const statusColors: Record<OrderStatus, string> = {
    Pendente: "bg-amber-50 text-amber-800 border-amber-200",
    Separando: "bg-slate-50 text-slate-700 border-slate-300",
    Finalizado: "bg-emerald-50 text-emerald-800 border-emerald-200",
    Enviado: "bg-indigo-50 text-indigo-800 border-indigo-200",
    Liberado: "bg-cyan-100 text-blue-700 border-blue-200"
  }

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
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeSubTab === "faturas" ? "bg-white shadow-sm text-slate-900" : "text-slate-600 hover:text-slate-900"
              }`}
          >
            Faturas
          </button>
          <button
            onClick={() => setActiveSubTab("pedidos")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeSubTab === "pedidos" ? "bg-white shadow-sm text-slate-900" : "text-slate-600 hover:text-slate-900"
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
                  <TableHead className="w-20">{''}
                  </TableHead>
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
                  <TableHead>Produto/Serviço</TableHead>
                  <TableHead>Forma de pagamento</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">{''}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <p className="font-mono font-medium text-slate-900">{order.order_number}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{order.customer_name}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-600">{order.items.length}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">{order.payment_methods}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{order.total_amount}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={`capitalize ${statusColors[order.status]}`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button onClick={() => toggleUpdateStatusOrder(order.id, "Liberado")} variant="ghost" size="sm">
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
    </div>
  )
}
