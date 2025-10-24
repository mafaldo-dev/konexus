import { useState, useEffect, Fragment } from "react";
import Swal from "sweetalert2";
import { Menu, Transition } from "@headlessui/react";

import { useAuth } from "../../../../AuthContext";

import { OrderResponse } from "../../../../service/interfaces";
import { handleAllOrders, updateOrderStatus } from "../../../../service/api/Administrador/orders";

import { motion } from "framer-motion";
import { Truck, AlertCircle, MoreVertical, Package } from "lucide-react";
import Dashboard from "../../../../components/dashboard/Dashboard";
import DocumentViewer from "../../../../utils/screenOptions";

type OrderStatus = "pending" | "approved" | "in_progress" | "shipped" | "cancelled" | "backout" | any;

export default function OrderList() {
  const [selectedTab, setSelectedTab] = useState<OrderStatus>("approved");
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user, company } = useAuth();

  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [documentType, setDocumentType] = useState<"purchase_order" | "label_70x30" | "label_100x100" | "separation_list">("purchase_order");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const mapStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'approved': 'approved',
      'in_progress': 'in_progress',
      'shipped': 'shipped',
      'cancelled': 'cancelled',
      'delivered': 'delivered',
      'backout': 'backout'
    };
    return statusMap[status?.toLowerCase()] || status || 'approved' || 'backout';
  };

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const fetchedOrders = await handleAllOrders();

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
        companyCnpj: company?.cnpj || order.companyCnpj,
        totalVolumes: order.totalVolumes || order.total_volume || 0,
        totalWeight: order.totalWeight || order.total_weight || 0,
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
          productBrand: item.productBrand || item.productbrand,
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

  const tkn = localStorage.getItem("token")

  useEffect(() => {
    loadOrders();
  }, []);

  const updateOrderStatusInDb = async (
    orderId: number | string,
    newStatus: OrderStatus,
    extraData?: { totalVolumes?: number; totalWeight?: number }
  ) => {
    try {
      await updateOrderStatus(orderId, newStatus, tkn as string, extraData);
      const updatedOrders = orders.map((order) =>
        order.id === orderId
          ? {
            ...order,
            orderStatus: newStatus,
            totalVolumes: extraData?.totalVolumes ?? order.totalVolumes,
            totalWeight: extraData?.totalWeight ?? order.totalWeight
          }
          : order
      );
      setOrders(updatedOrders);
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
      alert("Erro ao atualizar o status do pedido!");
    }
  };

  const confirmAndUpdateStatus = async (
    orderId: string | number,
    newStatus: OrderStatus,
    message: string
  ) => {
    const result = await Swal.fire({
      title: "Tem certeza?",
      html: message.replace(/\n/g, "<br>"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, confirmar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      const { value: motivo } = await Swal.fire({
        title: "Motivo do estorno",
        input: "textarea",
        inputPlaceholder: "Digite o motivo para o estorno...",
        inputAttributes: {
          "aria-label": "Motivo do estorno"
        },
        showCancelButton: true,
        confirmButtonText: "Enviar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#2563eb",
      });

      if (motivo) {
        try {
          await updateOrderStatusInDb(orderId, newStatus);
          await loadOrders();

          Swal.fire({
            title: "Sucesso!",
            text: `Status do pedido atualizado.\nMotivo: ${motivo}`,
            icon: "success",
            confirmButtonColor: "#16a34a",
          });
        } catch (error) {
          Swal.fire({
            title: "Erro!",
            text: "Não foi possível atualizar o pedido.",
            icon: "error",
            confirmButtonColor: "#d33",
          });
        }
      }
    }
  };

  const getOrdersByStatus = (status: OrderStatus) => orders.filter((order) => order.orderStatus === status);

  const statusColors: Record<OrderStatus, string> = {
    pending: "bg-amber-50 text-amber-800 border-amber-200",
    approved: "bg-cyan-100 text-blue-500 border-blue-200",
    in_progress: "bg-slate-50 text-slate-700 border-slate-300",
    shipped: "bg-indigo-50 text-indigo-800 border-indigo-200",
    cancelled: "bg-red-50 text-red-800 border-red-200",
    backout: "bg-orange-50 text-white border-orange-200"
  };

  const statusLabels: Record<OrderStatus, string> = {
    pending: "Pendente",
    approved: "Aprovada",
    in_progress: "Separando",
    shipped: "Enviado",
    cancelled: "Cancelado",
    backout: "Estornado"
  };

  const handleConferencia = async (order: OrderResponse) => {
    const { value: formValues } = await Swal.fire({
      title: "Realizar Conferência",
      html: `
        <div class="grid gap-2 text-left">
          <label>Pedido: <b>${order.orderNumber}</b></label>
          <label>Cliente: <b>${order.customer.name}</b></label>
          <input id="separador" class="swal2-input" placeholder="Nome do Separador">
          <input id="conferente" class="swal2-input" placeholder="Nome do Conferente">
          <input id="peso" class="swal2-input" placeholder="Peso total (kg)" type="number" step="0.01">
          <input id="volumes" class="swal2-input" placeholder="Quantidade de volumes" type="number" value="${order.orderItems.length}">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Realizar Conferência",
      width: '600px',
      preConfirm: () => {
        const separador = (document.getElementById("separador") as HTMLInputElement).value;
        const conferente = (document.getElementById("conferente") as HTMLInputElement).value;
        const peso = parseFloat((document.getElementById("peso") as HTMLInputElement).value);
        const volumes = parseInt((document.getElementById("volumes") as HTMLInputElement).value);
        if (!separador || !conferente || !peso || !volumes) Swal.showValidationMessage("Preencha todos os campos");
        return { separador, conferente, peso, volumes };
      }
    });

    if (formValues) {
      await updateOrderStatusInDb(order.id, "shipped", {
        totalVolumes: formValues.volumes,
        totalWeight: formValues.peso
      });
      Swal.fire("Sucesso!", "Conferência realizada e status atualizado para Enviado.", "success");
    }
  };

  const handleUpdateStatus = async (orderId: string | number, status: OrderStatus, extraData?: any) => {
    await updateOrderStatusInDb(orderId, status, extraData);
  };

  // Função para imprimir etiquetas 70x30 
 const handlePrintProductLabels = (order: OrderResponse) => {

  const orderWithLowercase = {
    ...order,
    orderItems: order.orderItems.map(item => ({
      productcode: item.productCode,
      productname: item.productName,
      productbrand: item.productBrand,
      productlocation: item.location,
      quantity: item.quantity,
    }))
  };
  
  setSelectedProduct(orderWithLowercase);
  setDocumentType("label_70x30");
  setShowDocumentViewer(true);
};

  const handlePrintOrderLabel = (order: OrderResponse) => {
    setSelectedProduct({
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      companyCnpj: company?.cnpj,
      shippingAddress: `${order.shipping?.street}, ${order.shipping?.number}`,
      shippingCity: order.shipping?.city,
      shippingZip: order.shipping?.zip,
      totalItems: order.orderItems.length,
      totalVolumes: order.totalVolumes || order.orderItems.length,
      totalWeight: order.totalWeight,
      orderDate: order.orderDate,
      carrier:order.carrier
    });
    setDocumentType("label_100x100");
    setShowDocumentViewer(true);
  };

  // Menu de ação
  const ActionMenu = ({ order }: { order: OrderResponse }) => {
    const options = () => {
      switch (order.orderStatus) {
        case "approved":
          return [
            { 
              label: "PDF", 
              action: () => {
                setSelectedOrder(order);
                setDocumentType("separation_list");
              } 
            },
            { label: "Iniciar Separação", action: () => handleUpdateStatus(order.id, "in_progress") },
            { label: "Estornar", action: () => confirmAndUpdateStatus(order.id, "backout", `Deseja estornar o pedido: ${order.orderNumber} ?`) }
          ];
        case "in_progress":
          return [
            { 
              label: "PDF", 
              action: () => {
                setSelectedOrder(order);
                setDocumentType("separation_list");
              } 
            },
            { label: "Imprimir Etiquetas", action: () => handlePrintProductLabels(order) },
            { label: "Realizar Conferência", action: () => handleConferencia(order) }
          ];
        case "shipped":
          return [
            { 
              label: "PDF", 
              action: () => {
                setSelectedOrder(order);
                setDocumentType("separation_list");
              } 
            },
            { label: "Gerar Etiqueta", action: () => handlePrintOrderLabel(order) }
          ];
        default:
          return [{ 
            label: "Lista de Separação", 
            action: () => {
              setSelectedOrder(order);
              setDocumentType("separation_list");
            } 
          }];
      }
    };

    return (
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
          <MoreVertical className="w-5 h-5 text-gray-700" />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none z-50">
            {options()
              .filter(
                (option) =>
                  !["Iniciar Separação", "Gerar Etiqueta", "Realizar Conferência"].includes(option.label) ||
                  (user?.role !== "Vendedor" && user?.sector !== "Comercial")
              )
              .map((option, idx) => (
                <Menu.Item key={idx}>
                  {({ active }: any) => (
                    <button
                      onClick={option.action}
                      className={`${active ? "bg-gray-100" : ""} group flex w-full items-center px-4 py-2 text-sm text-gray-700 transition`}
                    >
                      {option.label}
                    </button>
                  )}
                </Menu.Item>
              ))}
          </Menu.Items>
        </Transition>
      </Menu>
    );
  };

  // Renderiza o DocumentViewer para Lista de Separação
  if (selectedOrder && documentType === "separation_list") {
    return (
      <DocumentViewer
        order={selectedOrder}
        documentType="separation_list"
        onClose={() => {
          setSelectedOrder(null);
          setDocumentType("purchase_order");
        }}
      />
    );
  }

  // Renderiza o DocumentViewer para etiquetas
  if (showDocumentViewer) {
    return (
      <DocumentViewer
        product={selectedProduct}
        documentType={documentType}
        onClose={() => {
          setShowDocumentViewer(false);
          setSelectedProduct(null);
        }}
      />
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

          {/* Abas */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="space-y-6">
              <div className="grid w-full grid-cols-3 bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                {(["approved", "in_progress", "shipped"] as OrderStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedTab(status)}
                    className={`py-4 px-4 font-semibold text-sm transition-all ${selectedTab === status
                      ? statusActiveTabClass(status)
                      : "bg-white hover:bg-gray-50 text-gray-600 border-b-2 border-transparent"
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="uppercase tracking-wide">{statusLabels[status]}</span>
                      <span className="inline-block bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs font-medium">
                        {getOrdersByStatus(status).length}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Lista de pedidos */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
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
                  <div className="overflow-x-auto rounded-t-md">
                    <table className="w-full rounded-sm">
                      <thead className="bg-slate-900 text-white">
                        <tr>
                          <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider">Pedido</th>
                          <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider">Cliente</th>
                          <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider">Vendedor</th>
                          <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider">Itens</th>
                          {selectedTab === "shipped" && (
                            <>
                              <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider">Volumes</th>
                              <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider">Peso</th>
                            </>
                          )}
                          <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider">Status</th>
                          <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getOrdersByStatus(selectedTab).map((order) => (
                          <motion.tr
                            key={order.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-2 whitespace-nowrap">
                              <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap">
                              <span className="text-gray-700">{order.customer.name}</span>
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap">
                              <span className="text-gray-700">{order.salesperson}</span>
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap">
                              <span className="text-gray-700 font-medium">{order.orderItems.length}</span>
                            </td>
                            {selectedTab === "shipped" && (
                              <>
                                <td className="px-6 py-2 whitespace-nowrap">
                                  <span className="text-gray-700 font-medium">{order.totalVolumes || order.orderItems.length}</span>
                                </td>
                                <td className="px-6 py-2 whitespace-nowrap">
                                  <span className="text-gray-700">
                                    {order.totalWeight ? `${order.totalWeight} kg` : 'Não informado'}
                                  </span>
                                </td>
                              </>
                            )}
                            <td className="px-6 py-2 whitespace-nowrap">
                              <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[order.orderStatus]}`}>
                                {statusLabels[order.orderStatus]}
                              </span>
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap">
                              <ActionMenu order={order} />
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
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
    case "cancelled":
      return "bg-red-50 text-red-800 border-b-2 border-red-500"
    case "backout":
      return "bg-orange-50 text-white border-orange-200"
    default:
      return "bg-gray-50 text-gray-700 border-b-2 border-gray-500"
  }
}