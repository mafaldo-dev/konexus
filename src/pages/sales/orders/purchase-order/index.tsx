import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";

import { Search, Plus, Eye, Package, TrendingUp, Clock, ChevronLeft, ChevronRight, MoreVertical, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

import { format, isValid } from "date-fns";

import Dashboard from "../../../../components/dashboard/Dashboard";
import { handleAllOrders, handleCancelOrder } from "../../../../service/api/Administrador/orders";
import { OrderResponse } from "../../../../service/interfaces";
import Swal from "sweetalert2";
import DocumentViewer from "../../../../utils/screenOptions";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [documentType, setDocumentType] = useState<"purchase_order" | "label_70x30" | "label_100x100" | "separation_list">("purchase_order");

  const { company } = useAuth()

  const navigate = useNavigate()

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const safeFormatDate = (dateString?: string | null): string => {
    if (!dateString) return "Data inválida";
    try {
      const date = new Date(dateString);
      return isValid(date) ? format(date, "dd/MM/yyyy") : "Data inválida";
    } catch {
      return "Data inválida";
    }
  };

  const mapStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovado",
      in_progress: "Em Andamento",
      shipped: "Enviado",
      cancelled: "Cancelado",
      delivered: "Entregue",
      backout: "Estornado"
    };
    return statusMap[status?.toLowerCase()] || status || "Pendente" || "Estornado";
  };

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const fetchedOrders = await handleAllOrders();
      console.log("log fetched",fetchedOrders)
      const mappedOrders: OrderResponse[] = fetchedOrders.map((order: any) => ({
        id: order.id,
        orderDate: order.orderDate,
        orderStatus: mapStatus(order.orderStatus),
        orderNumber: order.orderNumber || `ORD-${order.id}`,
        totalAmount: parseFloat(order.totalAmount) || 0,
        currency: order.currency || "BRL",
        salesperson: order.salesperson,
        notes: order.notes || "",
        carrier: order.carrier,
        companyCnpj: company?.cnpj ||order.companyCnpj,
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
      setCurrentPage(1);
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

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
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
      setCurrentPage(1); // Reset para primeira página ao filtrar
    } else {
      setFilteredOrders(orders);
    }
  }, [searchTerm, orders]);

  // Cálculos de paginação
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Navegação de páginas
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  // Gerar array de páginas para exibição
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const handleEditOrder = (order: OrderResponse) => {
    if (order.orderStatus === "Pendente" || order.orderStatus === "Estornado") {
      // Use navigate do react-router-dom em vez de window.location
      navigate(`/sales/orders/edit/${order.id}`);
    } else {
      alert("Este pedido não pode ser editado. Apenas pedidos com status 'Pendente' ou 'Estornado' podem ser modificados.");
    }
  };

  // Função para visualizar PDF
  const handleViewPDF = (order: OrderResponse) => {
    setSelectedOrder(order);
  };

  // Toggle menu
  const toggleMenu = (orderId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === orderId ? null : orderId);
  };


  const handleCancelOrderClick = async (order: OrderResponse) => {
    const result = await Swal.fire({
      title: `Cancelar pedido ${order.orderNumber}?`,
      text: "Essa ação irá cancelar o pedido e reverter o estoque!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sim, cancelar",
      cancelButtonText: "Não"
    });

    if (!result.isConfirmed) return;

    try {
      setIsLoading(true);
      const response = await handleCancelOrder(order.id);

      await Swal.fire({
        title: "Sucesso!",
        text: response.message || "Pedido cancelado com sucesso!",
        icon: "success",
        confirmButtonText: "OK"
      });

      await loadOrders(); // recarrega lista
    } catch (error: any) {
      await Swal.fire({
        title: "Erro!",
        text: error.message || "Erro ao cancelar o pedido!",
        icon: "error",
        confirmButtonText: "OK"
      });
    } finally {
      setIsLoading(false);
    }
  };


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

  if (selectedOrder && documentType === "separation_list") {
    return (
      <DocumentViewer
        order={selectedOrder}
        documentType="separation_list"
        onClose={() => {
          setSelectedOrder(null);
          setDocumentType("separation_list");
        }}
      />
    );
  }

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
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Lista de Pedidos</h2>
                  <div className="text-sm text-slate-300">
                    Mostrando {currentOrders.length} de {filteredOrders.length} pedidos
                  </div>
                </div>
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
                    ) : currentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-500 font-medium">
                          {searchTerm
                            ? "Nenhum pedido encontrado para sua busca"
                            : "Nenhum pedido cadastrado"}
                        </td>
                      </tr>
                    ) : (
                      currentOrders.map((order, idx) => {
                        const canEdit = order.orderStatus === "Pendente" || order.orderStatus === "Estornado";

                        return (
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
                                className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${statusColors[order.orderStatus] || "bg-gray-50 text-gray-800 border-gray-200"
                                  }`}
                              >
                                {order.orderStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                {/* Menu de Ações */}
                                <div className="relative">
                                  <button
                                    onClick={(e) => toggleMenu(order.id!, e)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    type="button"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {openMenuId === order.id && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                                      <button
                                        onClick={() => handleViewPDF(order)}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                        type="button"
                                      >
                                        <Eye className="w-4 h-4" />
                                        Ver PDF
                                      </button>

                                      {canEdit ? (
                                        <button
                                          onClick={() => handleEditOrder(order)}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                          type="button"
                                        >
                                          <Edit className="w-4 h-4" />
                                          Editar Pedido
                                        </button>
                                      ) : (
                                        <div
                                          className="w-full text-left px-4 py-2 text-sm text-gray-400 flex items-center gap-3 cursor-not-allowed"
                                          title="Apenas pedidos Pendentes ou Estornados podem ser editados"
                                        >
                                          <Edit className="w-4 h-4" />
                                          Editar Pedido
                                        </div>
                                      )}

                                      {canEdit && (
                                        <button
                                          onClick={() => handleCancelOrderClick(order)}
                                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                          type="button"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          Cancelar Pedido
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      Mostrando {startIndex + 1} a {Math.min(endIndex, filteredOrders.length)} de {filteredOrders.length} pedidos
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Botão Anterior */}
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        type="button"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Números das páginas */}
                      {getPageNumbers().map(page => (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`min-w-10 h-10 rounded-lg border font-medium transition-colors ${currentPage === page
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          type="button"
                        >
                          {page}
                        </button>
                      ))}

                      {/* Botão Próximo */}
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        type="button"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Dashboard>
  );
}