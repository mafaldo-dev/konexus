import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { Search, Plus, Eye, Package, TrendingUp, Clock } from "lucide-react";
import { motion } from "framer-motion";
import OrderPDF from "../conferency/OrderPDF";
import { format, isValid } from "date-fns";

import Dashboard from "../../../../components/dashboard/Dashboard";
import { handleAllOrders } from "../../../../service/api/Administrador/orders";
import { OrderResponse } from "../../../../service/interfaces";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Formatação segura de data
  const safeFormatDate = (dateString?: string | null): string => {
    if (!dateString) return "Data inválida";
    try {
      const date = new Date(dateString);
      return isValid(date) ? format(date, "dd/MM/yyyy") : "Data inválida";
    } catch {
      return "Data inválida";
    }
  };

  // Mapear status da API para legível
  const mapStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovado",
      in_progress: "Em Andamento",
      shipped: "Enviado",
      cancelled: "Cancelado",
      delivered: "Entregue",
    };
    return statusMap[status?.toLowerCase()] || status || "Pendente";
  };

  // Carregar pedidos da API
  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const fetchedOrders = await handleAllOrders();

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
      setFilteredOrders(mappedOrders);
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

  // Filtrar pedidos
  useEffect(() => {
    if (searchTerm.trim() !== "") {
      const filtered = orders.filter(
        (order) =>
          (order.customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.salesperson?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchTerm, orders]);

  // Cores dos status
  const statusColors: Record<string, string> = {
    Pendente: "bg-amber-50 text-amber-800 border-amber-200",
    Aprovado: "bg-blue-50 text-blue-800 border-blue-200",
    "Em Andamento": "bg-slate-50 text-slate-700 border-slate-300",
    Enviado: "bg-indigo-50 text-indigo-800 border-indigo-200",
    Entregue: "bg-emerald-50 text-emerald-800 border-emerald-200",
    Cancelado: "bg-red-50 text-red-800 border-red-200",
  };

  const totalOrders = orders.length;
  const totalValue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const pendingOrders = orders.filter((order) => order.orderStatus === "Pendente").length;

  // Renderiza PDF
  if (selectedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <button
          onClick={() => setSelectedOrder(null)}
          className="text-slate-700 hover:text-slate-900 mb-4 font-medium transition-colors"
          type="button"
        >
          ← Voltar para Lista
        </button>
        <OrderPDF order={selectedOrder} onDownloadComplete={() => {}} />
      </div>
    );
  }

  // Renderiza lista de pedidos
  return (
    <Dashboard>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Cabeçalho */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pedidos de Venda</h1>
              <p className="text-gray-600 mt-1 font-medium">
                Gerencie todos os pedidos do sistema
              </p>
            </div>
            <Link to="/sales/newOrder">
              <button
                className="flex items-center bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 px-6 rounded-lg shadow-sm transition-colors"
                type="button"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Pedido
              </button>
            </Link>
          </motion.div>

          {/* Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                title: "Total de Pedidos",
                value: totalOrders,
                icon: <Package className="w-8 h-8 text-slate-600" />,
                bg: "bg-white border-slate-200",
                text: "text-gray-600",
                valueColor: "text-slate-800",
              },
              {
                title: "Valor Total",
                value: `R$ ${totalValue.toFixed(2)}`,
                icon: <TrendingUp className="w-8 h-8 text-slate-600" />,
                bg: "bg-white border-slate-200",
                text: "text-gray-600",
                valueColor: "text-slate-800",
              },
              {
                title: "Pendentes",
                value: pendingOrders,
                icon: <Clock className="w-8 h-8 text-slate-600" />,
                bg: "bg-white border-slate-200",
                text: "text-gray-600",
                valueColor: "text-slate-800",
              },
            ].map((card, i) => (
              <div
                key={i}
                className={`${card.bg} border rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${card.text} text-sm font-medium uppercase tracking-wide mb-2`}>
                      {card.title}
                    </p>
                    <p className={`text-3xl font-bold ${card.valueColor}`}>{card.value}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">{card.icon}</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Busca */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por cliente, número do pedido ou vendedor..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                />
              </div>
            </div>
          </motion.div>

          {/* Tabela */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="bg-slate-800 text-white px-6 py-4">
                <h2 className="text-xl font-semibold">Lista de Pedidos</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold tracking-wide">
                    <tr>
                      <th className="px-6 py-4">Pedido</th>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Vendedor</th>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4">Valor</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
                            <span className="ml-3 text-gray-600 font-medium">
                              Carregando pedidos...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-500 font-medium">
                          {searchTerm
                            ? "Nenhum pedido encontrado para sua busca"
                            : "Nenhum pedido cadastrado"}
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order, idx) => (
                        <tr
                          key={order.id || idx}
                          className="hover:bg-gray-50 transition-colors border-b border-gray-100"
                        >
                          <td className="px-6 py-4">
                            <span className="font-mono text-slate-700 bg-slate-100 px-3 py-1 rounded font-medium">
                              {order.orderNumber || `ORD-${order.id}`}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {order.customer.name || "Cliente não informado"}
                              </p>
                              {order.customer.code && (
                                <p className="text-sm text-gray-500 font-medium">
                                  {order.customer.code}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-800">
                            {order.salesperson || "Não informado"}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-700">
                            {safeFormatDate(order.orderDate)}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-700">
                            R$ {(order.totalAmount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${
                                statusColors[order.orderStatus] || "bg-gray-50 text-gray-800 border-gray-200"
                              }`}
                            >
                              {order.orderStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="flex items-center text-sm text-slate-700 hover:text-slate-900 font-medium transition-colors"
                              type="button"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver PDF
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Dashboard>
  );
}