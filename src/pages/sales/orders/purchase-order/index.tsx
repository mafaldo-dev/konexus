import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../AuthContext";

import { Search, Plus, Eye, Package, TrendingUp, Clock, MoreVertical, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

import { format, isValid } from "date-fns";

import Dashboard from "../../../../components/dashboard/Dashboard";
import { handleAllOrders, handleCancelOrder } from "../../../../service/api/Administrador/orders";
import { OrderResponse } from "../../../../service/interfaces";
import Swal from "sweetalert2";
import DocumentViewer from "../../../../utils/screenOptions";
import { DynamicTable } from "../../../../utils/Table/DynamicTable";
import { mapOrderStatus, getStatusLabel, getStatusColor } from "../../../../components/utils/statusLabel";

// Importar constantes centralizadas


export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [documentType, setDocumentType] = useState<"purchase_order" | "label_70x30" | "label_100x100" | "separation_list">("purchase_order");

  const { company } = useAuth();
  const navigate = useNavigate();

  const safeFormatDate = (dateString?: string | null): string => {
    if (!dateString) return "Data inválida";
    try {
      const date = new Date(dateString);
      return isValid(date) ? format(date, "dd/MM/yyyy") : "Data inválida";
    } catch {
      return "Data inválida";
    }
  };

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const fetchedOrders = await handleAllOrders();
      const mappedOrders: OrderResponse[] = fetchedOrders.map((order: any) => ({
        id: order.id,
        orderDate: order.orderDate,
        orderStatus: mapOrderStatus(order.orderStatus), // Usando função importada
        orderNumber: order.orderNumber || `ORD-${order.id}`,
        totalAmount: parseFloat(order.totalAmount) || 0,
        currency: order.currency || "BRL",
        salesperson: order.salesperson,
        notes: order.notes || "",
        carrier: order.carrier,
        companyCnpj: company?.cnpj || order.companyCnpj,
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

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

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

  const handleEditOrder = (order: OrderResponse) => {
    // Verifica status usando as constantes (pending e backout são os status key)
    if (order.orderStatus === "pending" || order.orderStatus === "backout") {
      navigate(`/sales/orders/edit/${order.id}`);
    } else {
      alert(`Este pedido não pode ser editado. Apenas pedidos com status '${getStatusLabel("pending")}' ou '${getStatusLabel("backout")}' podem ser modificados.`);
    }
  };

  const handleViewPDF = (order: OrderResponse) => {
    setSelectedOrder(order);
    setDocumentType("separation_list");
  };

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

      await loadOrders();
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

  // ============================================
  // DEFINIÇÃO DAS COLUNAS DA TABELA DINÂMICA
  // ============================================
  const columns = [
    {
      key: 'orderNumber',
      header: 'Pedido',
      render: (order: OrderResponse) => (
        <span className="font-mono text-slate-700 bg-slate-100 px-3 py-1 rounded font-medium">
          {order.orderNumber || `ORD-${order.id}`}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Cliente',
      render: (order: OrderResponse) => (
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
      ),
    },
    {
      key: 'salesperson',
      header: 'Vendedor',
      render: (order: OrderResponse) => (
        <span className="font-medium text-gray-800">
          {order.salesperson || "Não informado"}
        </span>
      ),
    },
    {
      key: 'orderDate',
      header: 'Data',
      render: (order: OrderResponse) => (
        <span className="font-medium text-gray-700">
          {safeFormatDate(order.orderDate)}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Valor',
      render: (order: OrderResponse) => (
        <span className="font-bold text-slate-700">
          R$ {(order.totalAmount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'orderStatus',
      header: 'Status',
      render: (order: OrderResponse) => (
        <span
          className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${getStatusColor(order.orderStatus)}`}
        >
          {getStatusLabel(order.orderStatus)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (order: OrderResponse) => {
        const canEdit = order.orderStatus === "pending" || order.orderStatus === "backout";

        return (
          <div className="flex items-center gap-4">
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
                      title={`Apenas pedidos ${getStatusLabel("pending")} ou ${getStatusLabel("backout")} podem ser editados`}
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
        );
      },
    },
  ];

  const totalOrders = orders.length;
  const totalValue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const pendingOrders = orders.filter((order) => order.orderStatus === "pending").length;

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

          {/* TABELA DINÂMICA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DynamicTable
              data={filteredOrders}
              columns={columns}
              loading={isLoading}
              emptyMessage="Nenhum pedido encontrado"
              emptyDescription={searchTerm ? "Tente ajustar os termos de busca" : "Nenhum pedido cadastrado no sistema"}
            />
          </motion.div>
        </div>
      </div>
    </Dashboard>
  );
}