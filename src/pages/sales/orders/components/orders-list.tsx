import type React from "react"
import { useState, useEffect } from "react"
import Swal from "sweetalert2"

import { OrderResponse } from "../../../../service/interfaces"
import { handleAllOrders, updateOrderStatus } from "../../../../service/api/Administrador/orders"

import { motion } from "framer-motion"
import { Truck, Package, CheckCircle, Clock, AlertCircle, Eye, Check } from "lucide-react"
import Dashboard from "../../../../components/dashboard/Dashboard"
import OrderPDF from "../conferency/OrderPDF"

type OrderStatus = "pending" | "approved" | "in_progress" | "shipped" | "delivered" | "cancelled" | any

export default function OrderList() {
  const [selectedTab, setSelectedTab] = useState<OrderStatus>("approved")
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Função para mapear os status
  const mapStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'approved': 'approved',
      'in_progress': 'in_progress',
      'shipped': 'shipped',
      'cancelled': 'cancelled',
      'delivered': 'delivered'
    };
    return statusMap[status?.toLowerCase()] || status || 'approved';
  };

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const fetchedOrders = await handleAllOrders();

      console.log("📦 Dados ORIGINAIS da API:", fetchedOrders[0]?.shipping);

      // Mapeia diretamente para OrderResponse
      const mappedOrders: OrderResponse[] = fetchedOrders.map((order: any) => ({
        id: order.id,
        orderDate: order.orderDate,
        orderStatus: mapStatus(order.orderStatus),
        orderNumber: order.orderNumber || `ORD-${order.id}`,
        totalAmount: parseFloat(order.totalAmount) || 0,
        currency: order.currency || "BRL",
        salesperson: order.salesperson,
        notes: order.notes || "",
        customer: {
          id: order.customer?.id || 0,
          name: order.customer?.name || "",
          code: order.customer?.code || "",
          phone: order.customer?.phone || "",
          email: order.customer?.email || "",
        },
        shipping: order.shipping ? {
          id: 0,
          street: order.shipping.street || "",
          number: order.shipping.number || 0,
          city: order.shipping.city || "",
          zip: order.shipping.zip || ""
        } : {
          id: 0,
          street: "",
          number: 0,
          city: "",
          zip: ""
        },
        billing: order.billing ? {
          id: 0,
          street: order.billing.street || "",
          number: order.billing.number || 0,
          city: order.billing.city || "",
          zip: order.billing.zip || ""
        } : {
          id: 0,
          street: "",
          number: 0,
          city: "",
          zip: ""
        },
        orderItems: order.orderItems?.map((item: any) => ({
          productId: item.productId || item.productid,
          productName: item.productName || item.productname,
          productCode: item.productCode || item.productcode,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice || item.unitprice),
          location: item.location,
          subtotal: parseFloat(item.subtotal || item.subTotal),
        })) || [],
      }));

      setOrders(mappedOrders);
    } catch (error) {
      console.error("Erro ao recuperar orders", error);
      alert("Erro ao recuperar os pedidos de venda!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateOrderStatusInDb = async (orderId: number | string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus)
      const updatedOrders = orders.map((order) =>
        order.id === orderId ? { ...order, orderStatus: newStatus } : order
      )
      setOrders(updatedOrders)
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error)
      alert("Erro ao atualizar o status do pedido!")
    }
  }

  const confirmAndUpdateStatus = async (orderId: string | number, newStatus: OrderStatus, message: string) => {
    Swal.fire({
      title: "Tem certeza?",
      text: message,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, confirmar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await updateOrderStatusInDb(orderId, newStatus)
          await loadOrders()

          Swal.fire({
            title: "Sucesso!",
            text: "Status do pedido atualizado.",
            icon: "success",
            confirmButtonColor: "#16a34a",
          })
        } catch (error) {
          Swal.fire({
            title: "Erro!",
            text: "Não foi possível atualizar o pedido.",
            icon: "error",
            confirmButtonColor: "#d33",
          })
        }
      }
    })
  }

  const handleDownloadComplete = () => {
    if (selectedOrder && selectedOrder.orderStatus === "approved") {
      updateOrderStatus(selectedOrder.id, "in_progress")
    }
    setSelectedOrder(null)
  }

  const statusColors: Record<OrderStatus, string> = {
    pending: "bg-amber-50 text-amber-800 border-amber-200",
    approved: "bg-cyan-100 text-blue-500 border-blue-200",
    in_progress: "bg-slate-50 text-slate-700 border-slate-300",
    shipped: "bg-indigo-50 text-indigo-800 border-indigo-200",
    delivered: "bg-emerald-50 text-emerald-800 border-emerald-200",
    cancelled: "bg-red-50 text-red-800 border-red-200"
  }

  const statusLabels: Record<OrderStatus, string> = {
    pending: "Pendente",
    approved: "Aprovada",
    in_progress: "Separando",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado"
  }

  const statusIcons: Record<OrderStatus, React.ReactElement> = {
    pending: <Clock className="w-4 h-4" />,
    approved: <Check className="w-4 h-4" />,
    in_progress: <Package className="w-4 h-4" />,
    shipped: <Truck className="w-4 h-4" />,
    delivered: <CheckCircle className="w-4 h-4" />,
    cancelled: <AlertCircle className="w-4 h-4" />
  }

  const getOrdersByStatus = (status: OrderStatus) =>
    orders.filter((order) => order.orderStatus === status)

  if (selectedOrder) {
    console.log("📄 Order enviado para PDF:", selectedOrder);
    console.log("📄 Shipping no PDF:", selectedOrder.shipping);
    console.log("📄 Billing no PDF:", selectedOrder.billing);
    
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <button
          onClick={() => setSelectedOrder(null)}
          className="text-slate-700 hover:text-slate-900 mb-4 font-medium transition-colors"
          type="button"
        >
          ← Voltar para Expedição
        </button>
        <OrderPDF order={selectedOrder} onDownloadComplete={handleDownloadComplete} />
      </div>
    );
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
            {(["approved", "in_progress", "shipped", "delivered"] as OrderStatus[]).map((status) => (
              <div
                key={status}
                className={`shadow-sm border ${statusButtonClass(status)} rounded-lg p-6 text-center transition-all hover:shadow-md`}
              >
                <div className="flex justify-center mb-3">{statusIcons[status]}</div>
                <p className="text-2xl font-bold mb-1">{getOrdersByStatus(status).length}</p>
                <p className="text-sm font-medium uppercase tracking-wide">{statusLabels[status]}</p>
              </div>
            ))}
          </motion.div>

          {/* Abas e lista */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="space-y-6">
              {/* Abas */}
              <div className="grid w-full grid-cols-4 bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                {(["approved", "in_progress", "shipped", "delivered"] as OrderStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedTab(status)}
                    className={`py-4 px-4 font-semibold text-sm transition-all ${selectedTab === status
                      ? statusActiveTabClass(status)
                      : "bg-white hover:bg-gray-50 text-gray-600 border-b-2 border-transparent"
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="uppercase tracking-wide">
                        {statusLabels[status]}
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
                    <p className="text-gray-500 font-medium">Nenhum pedido com status "{statusLabels[selectedTab]}"</p>
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
                            <h3 className="font-bold text-lg text-gray-900 mb-1">Pedido {order.orderNumber}</h3>
                            <p className="text-gray-700 font-medium">Cliente: {order.customer.name}</p>
                            <p className="text-gray-500 text-sm font-medium">Vendedor: {order.salesperson}</p>
                          </div>

                          <div className="text-right">
                            <span
                              className={`inline-block rounded-full border px-3 py-1.5 text-sm font-semibold ${statusColors[order.orderStatus]}`}
                            >
                              {statusLabels[order.orderStatus]?.toUpperCase()}
                            </span>
                            <p className="text-lg font-bold text-slate-700 mt-2">
                              R$ {order.totalAmount?.toFixed(2) || "0.00"}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-600 font-medium">
                            {order.orderItems?.length || 0} itens para separar
                          </div>

                          <div className="flex gap-3">
                            <button
                              className="border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 font-medium text-gray-700 transition-colors"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="w-4 h-4" /> Ver PDF
                            </button>

                            {selectedTab === "approved" && (
                              <button
                                className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors"
                                onClick={() => {
                                  // Carregar pedido completo no estado
                                  setSelectedOrder(order);

                                  // Perguntar confirmação e atualizar status
                                  confirmAndUpdateStatus(order.id, "in_progress", "Você deseja iniciar a conferência deste pedido?");
                                }}
                              >
                                Iniciar Separação
                              </button>
                            )}

                            {selectedTab === "in_progress" && (
                              <button
                                className="bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 text-sm font-medium transition-colors"
                                onClick={() => confirmAndUpdateStatus(order.id, "shipped", "Você deseja marcar este pedido como enviado?")}
                              >
                                Marcar como Enviado
                              </button>
                            )}

                            {selectedTab === "shipped" && (
                              <button
                                className="bg-indigo-700 text-white px-4 py-2 rounded-lg hover:bg-indigo-800 text-sm font-medium transition-colors"
                                onClick={() => confirmAndUpdateStatus(order.id, "delivered", "Você deseja marcar este pedido como entregue?")}
                              >
                                Marcar como Entregue
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
    case "pending":
      return "bg-amber-50 text-amber-800 border-amber-200"
    case "approved":
      return "bg-cyan-50 text-blue-600 border-blue-200"
    case "in_progress":
      return "bg-slate-50 text-slate-700 border-slate-300"
    case "shipped":
      return "bg-indigo-50 text-indigo-800 border-indigo-200"
    case "delivered":
      return "bg-emerald-50 text-emerald-800 border-emerald-200"
    case "cancelled":
      return "bg-red-50 text-red-800 border-red-200"
    default:
      return "bg-gray-50 text-gray-700 border-gray-200"
  }
}

function statusActiveTabClass(status: OrderStatus) {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-800 border-b-2 border-amber-500"
    case "approved":
      return "bg-cyan-50 text-blue-600 border-b-2 border-blue-500"
    case "in_progress":
      return "bg-slate-50 text-slate-700 border-b-2 border-slate-500"
    case "shipped":
      return "bg-indigo-50 text-indigo-800 border-b-2 border-indigo-500"
    case "delivered":
      return "bg-emerald-50 text-emerald-800 border-b-2 border-emerald-500"
    case "cancelled":
      return "bg-red-50 text-red-800 border-b-2 border-red-500"
    default:
      return "bg-gray-50 text-gray-700 border-b-2 border-gray-500"
  }
}