import type React from "react"
import { useState, useEffect } from "react"

import { Order } from "../../../../service/interfaces"
import { handleAllOrders, updateOrderStatus } from "../../../../service/api/Administrador/orders"

import { motion } from "framer-motion"
import { Truck, Package, CheckCircle, Clock, AlertCircle, Eye, Check } from "lucide-react"
import Dashboard from "../../../../components/dashboard/Dashboard"

import OrderPDF from "../conferency/OrderPDF"



type OrderStatus = "Pendente" | "Liberado" |"Separando" | "Finalizado" | "Enviado"

export default function OrderList() {
  const [selectedTab, setSelectedTab] = useState<OrderStatus>("Pendente")
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)



  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        const fetchedOrders = await handleAllOrders()
        setOrders(fetchedOrders)
      } catch (error) {
        console.error("Erro ao carregar pedidos:", error)
        alert("Erro ao carregar pedidos.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const updateOrderStatusInDb = async (orderId: number | string, newStatus: OrderStatus) => {
    try {
      const shouldUpdateInDB = newStatus === "Separando" || newStatus === "Enviado"
      if (shouldUpdateInDB) {
        await updateOrderStatus(orderId, newStatus)
      }

      const updatedOrders = orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      setOrders(updatedOrders)
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error)
      alert("Erro ao atualizar o status do pedido!")
    }
  }

  const handleDownloadComplete = () => {
    if (selectedOrder && selectedOrder.status === "Liberado") {
      updateOrderStatus(selectedOrder.id, "Separando")
    }
    setSelectedOrder(null)
  }

  const statusColors: Record<OrderStatus, string> = {
    Pendente: "bg-amber-50 text-amber-800 border-amber-200",
    Separando: "bg-slate-50 text-slate-700 border-slate-300",
    Finalizado: "bg-emerald-50 text-emerald-800 border-emerald-200",
    Enviado: "bg-indigo-50 text-indigo-800 border-indigo-200",
    Liberado: "bg-cyan-100 text-blue-500 border-blue-200"
  }

  const statusIcons: Record<OrderStatus, React.ReactElement> = {
    Pendente: <Clock className="w-4 h-4" />,
    Separando: <Package className="w-4 h-4" />,
    Finalizado: <CheckCircle className="w-4 h-4" />,
    Enviado: <Truck className="w-4 h-4" />,
    Liberado: <Check className="w-4 h-4" />
  }

  const getOrdersByStatus = (status: OrderStatus) => orders.filter((order) => order.status === status)

  if (selectedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <button
          onClick={() => setSelectedOrder(null)}
          className="mb-4 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 shadow-sm"
        >
          ← Voltar para Expedição
        </button>
        <OrderPDF order={selectedOrder} onDownloadComplete={handleDownloadComplete} />
      </div>
    )
  }

  return (
    <Dashboard>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Cabeçalho */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-slate-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Central de Expedição</h1>
            </div>
            <p className="text-gray-600 font-medium">Gerencie a separação e envio dos pedidos</p>
          </motion.div>

          {/* Contadores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {(["Liberado", "Separando", "Finalizado", "Enviado"] as OrderStatus[]).map((status) => (
              <div
                key={status}
                className={`shadow-sm border ${statusButtonClass(status)} rounded-lg p-6 text-center transition-all hover:shadow-md`}
              >
                <div className="flex justify-center mb-3">{statusIcons[status]}</div>
                <p className="text-2xl font-bold mb-1">{getOrdersByStatus(status).length}</p>
                <p className="text-sm font-medium uppercase tracking-wide">{status}</p>
              </div>
            ))}
          </motion.div>

          {/* Abas e lista */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="space-y-6">
              {/* Abas */}
              <div className="grid w-full grid-cols-4 bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                {(["Liberado", "Separando", "Finalizado", "Enviado"] as OrderStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedTab(status)}
                    className={`py-4 px-4 font-semibold text-sm transition-all ${
                      selectedTab === status
                        ? statusActiveTabClass(status)
                        : "bg-white hover:bg-gray-50 text-gray-600 border-b-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="uppercase tracking-wide">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                      <span className="inline-block bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs font-medium">
                        {getOrdersByStatus(status).length}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Lista de pedidos */}
              <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4 font-medium">Carregando pedidos...</p>
                  </div>
                ) : getOrdersByStatus(selectedTab).length === 0 ? (
                  <div className="text-center py-16">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Nenhum pedido com status "{selectedTab}"</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {getOrdersByStatus(selectedTab).map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all hover:border-gray-300"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 mb-1">Pedido {order.order_number}</h3>
                            <p className="text-gray-700 font-medium">Cliente: {order.customer_name}</p>
                            <p className="text-gray-500 text-sm font-medium">Vendedor: {order.salesperson}</p>
                          </div>

                          <div className="text-right">
                            <span
                              className={`inline-block rounded-full border px-3 py-1.5 text-sm font-semibold ${statusColors[order.status]}`}
                            >
                              {order.status.toUpperCase()}
                            </span>
                            <p className="text-lg font-bold text-slate-700 mt-2">R$ {order.total_amount.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-600 font-medium">
                            {order.items?.length || 0} itens para separar
                          </div>

                          <div className="flex gap-3">
                            <button
                              className="border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 font-medium text-gray-700 transition-colors"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="w-4 h-4" /> Ver PDF
                            </button>

                            {selectedTab === "Liberado" && (
                              <button
                                className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors"
                                onClick={() => updateOrderStatusInDb(order.id, "Separando")}
                              >
                                Iniciar Separação
                              </button>
                            )}

                            {selectedTab === "Separando" && (
                              <button
                                className="bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 text-sm font-medium transition-colors"
                                onClick={() => updateOrderStatusInDb(order.id, "Finalizado")}
                              >
                                Marcar como Separado
                              </button>
                            )}

                            {selectedTab === "Finalizado" && (
                              <button
                                className="bg-indigo-700 text-white px-4 py-2 rounded-lg hover:bg-indigo-800 text-sm font-medium transition-colors"
                                onClick={() => updateOrderStatusInDb(order.id, "Enviado")}
                              >
                                Marcar como Enviado
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Dashboard>
  )
}

function statusButtonClass(status: OrderStatus) {
  switch (status) {
    case "Pendente":
      return "bg-amber-50 text-amber-800 border-amber-200"
    case "Separando":
      return "bg-slate-50 text-slate-700 border-slate-300"
    case "Finalizado":
      return "bg-emerald-50 text-emerald-800 border-emerald-200"
    case "Enviado":
      return "bg-indigo-50 text-indigo-800 border-indigo-200"
    case "Liberado":
      return "bg-cyan-50 text-blue-600 border-blue-200"
    default:
      return "bg-gray-50 text-gray-700 border-gray-200"
  }
}

function statusActiveTabClass(status: OrderStatus) {
  switch (status) {
    case "Pendente":
      return "bg-amber-50 text-amber-800 border-b-2 border-amber-500"
    case "Separando":
      return "bg-slate-50 text-slate-700 border-b-2 border-slate-500"
    case "Finalizado":
      return "bg-emerald-50 text-emerald-800 border-b-2 border-emerald-500"
    case "Enviado":
      return "bg-indigo-50 text-indigo-800 border-b-2 border-indigo-500"
    case "Liberado":
      return "bg-cyan-50 text-blue-600 border-blue-200"
    default:
      return "bg-gray-50 text-gray-700 border-b-2 border-gray-500"
  }
}
