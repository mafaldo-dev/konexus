import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
} from "lucide-react";
import OrderPDF from "../../components/orders/OrderPDF";
import { Order } from "../../../service/interfaces/orders";
import Dashboard from "../../../components/dashboard";
import { handleAllOrders } from "../../../service/api/orders";
import { updateOrderStatus as updateOrderStatusInDB } from "../../../service/api/orders/index";

type OrderStatus = "pendente" | "separando" | "separado" | "enviado";

export default function OrderList() {
  const [selectedTab, setSelectedTab] = useState<OrderStatus>("pendente");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const fetchedOrders = await handleAllOrders();
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
        alert("Erro ao carregar pedidos.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId: number | string, newStatus: OrderStatus) => {
    try {
      const shouldUpdateInDB = newStatus === "separando" || newStatus === "enviado";
      if (shouldUpdateInDB) {
        await updateOrderStatusInDB(orderId, newStatus);
      }

      const updatedOrders = orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
      alert("Erro ao atualizar o status do pedido!");
    }
  };

  const handleDownloadComplete = () => {
    if (selectedOrder && selectedOrder.status === "pendente") {
      updateOrderStatus(selectedOrder.id, "separando");
    }
    setSelectedOrder(null);
  };

  const statusColors: Record<OrderStatus, string> = {
    pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
    separando: "bg-blue-100 text-blue-800 border-blue-200",
    separado: "bg-green-100 text-green-800 border-green-200",
    enviado: "bg-purple-100 text-purple-800 border-purple-200",
  };

  const statusIcons: Record<OrderStatus, React.ReactElement> = {
    pendente: <Clock className="w-4 h-4" />,
    separando: <Package className="w-4 h-4" />,
    separado: <CheckCircle className="w-4 h-4" />,
    enviado: <Truck className="w-4 h-4" />,
  };

  const getOrdersByStatus = (status: OrderStatus) =>
    orders.filter((order) => order.status === status);

  if (selectedOrder) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <button
          onClick={() => setSelectedOrder(null)}
          className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Voltar para Expedição
        </button>
        <OrderPDF order={selectedOrder} onDownloadComplete={handleDownloadComplete} />
      </div>
    );
  }

  return (
    <Dashboard>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Cabeçalho */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">
                Central de Expedição
              </h1>
            </div>
            <p className="text-slate-600">Gerencie a separação e envio dos pedidos</p>
          </motion.div>

          {/* Contadores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {(["pendente", "separando", "separado", "enviado"] as OrderStatus[]).map((status) => (
              <div
                key={status}
                className={`shadow-lg border-0 ${statusButtonClass(status)} text-white rounded p-4 text-center`}
              >
                {statusIcons[status]}
                <p className="text-2xl font-bold">{getOrdersByStatus(status).length}</p>
                <p className="text-white text-sm capitalize">{status}</p>
              </div>
            ))}
          </motion.div>

          {/* Abas e lista */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="space-y-6">
              {/* Abas */}
              <div className="grid w-full grid-cols-4 bg-white shadow-lg rounded">
                {(["pendente", "separando", "separado", "enviado"] as OrderStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedTab(status)}
                    className={`py-2 px-4 font-semibold rounded-t ${
                      selectedTab === status
                        ? statusButtonClass(status)
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}s
                    <span className="ml-2 inline-block bg-gray-300 rounded-full px-2 text-xs font-normal">
                      {getOrdersByStatus(status).length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Lista de pedidos */}
              <div className="bg-white shadow-lg rounded p-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-600 mt-2">Carregando pedidos...</p>
                  </div>
                ) : getOrdersByStatus(selectedTab).length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500">Nenhum pedido com status "{selectedTab}"</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {getOrdersByStatus(selectedTab).map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-slate-900">
                              Pedido {order.order_number}
                            </h3>
                            <p className="text-slate-600">Cliente: {order.customer_name}</p>
                            <p className="text-slate-500 text-sm">Vendedor: {order.salesperson}</p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-block rounded border px-3 py-1 text-sm font-medium ${statusColors[order.status]}`}
                            >
                              {order.status}
                            </span>
                            <p className="text-lg font-bold text-emerald-600 mt-2">
                              R$ {order.total_amount.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-sm text-slate-500">
                            {order.items?.length || 0} itens para separar
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-100 flex items-center gap-1"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="w-4 h-4" /> Ver PDF
                            </button>

                            {selectedTab === "pendente" && (
                              <button
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                                onClick={() => updateOrderStatus(order.id, "separando")}
                              >
                                Iniciar Separação
                              </button>
                            )}
                            {selectedTab === "separando" && (
                              <button
                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                                onClick={() => updateOrderStatus(order.id, "separado")}
                              >
                                Marcar como Separado
                              </button>
                            )}
                            {selectedTab === "separado" && (
                              <button
                                className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-sm"
                                onClick={() => updateOrderStatus(order.id, "enviado")}
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
  );
}

function statusButtonClass(status: OrderStatus) {
  switch (status) {
    case "pendente":
      return "bg-yellow-500";
    case "separando":
      return "bg-blue-500";
    case "separado":
      return "bg-green-500";
    case "enviado":
      return "bg-purple-500";
    default:
      return "";
  }
}
