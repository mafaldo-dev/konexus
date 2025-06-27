import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Plus, Eye, Package, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import OrderPDF from "../../components/orders/OrderPDF";
import { Order } from "../../../service/interfaces/orders";
import Dashboard from "../../../components/dashboard";
import { handleAllOrders } from "../../../service/api/orders";

// Importe sua interface Order de onde estiver
// import { Order } from "@/interfaces/Order";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Aqui você vai criar sua função para carregar as orders (fetch, db, etc)
  const loadOrders = async () => {
    try{
      setIsLoading(true);
      const fetchedOrders = await handleAllOrders()
      setOrders(fetchedOrders);
      console.log(fetchedOrders)
       setFilteredOrders(fetchedOrders);
    }catch(Exception) {
      console.error("Erro ao recuperar orders", Exception)
      alert("Erro ao recuperar os pedidos de venda!")
    } finally{
    setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() !== "") {
      const filtered = orders.filter(
        (order) =>
          order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.salesperson.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchTerm, orders]);

  const statusColors: Record<string, string> = {
    pendente: "bg-yellow-100 text-yellow-800 border-yellow-300",
    separando: "bg-blue-100 text-blue-800 border-blue-300",
    separado: "bg-green-100 text-green-800 border-green-300",
    enviado: "bg-purple-100 text-purple-800 border-purple-300",
  };

  const totalOrders = orders.length;
  const totalValue = orders.reduce(
    (sum, order) => sum + (order.total_amount || 0),
    0
  );
  const pendingOrders = orders.filter(
    (order) => order.status === "pendente"
  ).length;

  if (selectedOrder) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <button
          onClick={() => setSelectedOrder(null)}
          className="text-blue-600 hover:underline mb-4"
          type="button"
        >
          ← Voltar para Lista
        </button>
        <OrderPDF
          order={selectedOrder}
          onDownloadComplete={() => {
            console.log("Download finalizado!");
            // Aqui você pode executar alguma lógica, tipo fechar modal, resetar estado, etc.
          }}
        />
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
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Pedidos de Venda</h1>
              <p className="text-slate-600 mt-1">Gerencie todos os pedidos do sistema</p>
            </div>
            <Link to="/sales/newOrder">
              <button
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded shadow"
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
                icon: <Package className="w-10 h-10 text-blue-200" />,
                bg: "from-blue-500 to-blue-600",
                text: "text-blue-100",
              },
              {
                title: "Valor Total",
                value: `R$ ${totalValue.toFixed(2)}`,
                icon: <TrendingUp className="w-10 h-10 text-emerald-200" />,
                bg: "from-emerald-500 to-emerald-600",
                text: "text-emerald-100",
              },
              {
                title: "Pendentes",
                value: pendingOrders,
                icon: <Package className="w-10 h-10 text-yellow-200" />,
                bg: "from-yellow-500 to-yellow-600",
                text: "text-yellow-100",
              },
            ].map((card, i) => (
              <div
                key={i}
                className={`bg-gradient-to-br ${card.bg} text-white rounded-lg shadow-lg p-6`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${card.text} text-sm`}>{card.title}</p>
                    <p className="text-3xl font-bold">{card.value}</p>
                  </div>
                  {card.icon}
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
            <div className="bg-white rounded-lg shadow p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por cliente, número do pedido ou vendedor..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md text-slate-700"
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
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-slate-900 text-white px-6 py-4 text-xl font-medium">
                Lista de Pedidos
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-700">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3">Pedido</th>
                      <th className="px-6 py-3">Cliente</th>
                      <th className="px-6 py-3">Vendedor</th>
                      <th className="px-6 py-3">Data</th>
                      <th className="px-6 py-3">Valor</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-slate-600">Carregando pedidos...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-500">
                          {searchTerm
                            ? "Nenhum pedido encontrado para sua busca"
                            : "Nenhum pedido cadastrado"}
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-mono text-blue-600">{order.order_number}</td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium">{order.customer_name}</p>
                              {order.customer_phone && (
                                <p className="text-sm text-slate-500">{order.customer_phone}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">{order.salesperson}</td>
                          <td className="px-6 py-4">
                            {format(new Date(order.order_date), "dd/MM/yyyy")}
                          </td>
                          <td className="px-6 py-4 font-semibold text-emerald-600">
                            R$ {order.total_amount?.toFixed(2) || "0.00"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-xs px-2 py-1 rounded-full border ${statusColors[order.status]}`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="flex items-center text-sm text-blue-600 hover:underline"
                              type="button"
                            >
                              <Eye className="w-4 h-4 mr-1" />
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
