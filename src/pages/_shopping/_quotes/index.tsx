import { Eye, Download, MoreVertical, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import Swal from 'sweetalert2';
import {
  updatePurchaseOrder,
  UpdateOrderStatusPayload,
  getOrderById
} from '../../../service/api/Administrador/purchaseRequests';
import DocumentViewer from '../../../utils/screenOptions';

interface QuotationsListProps {
  quotations: any[];
  onPreview?: (quotation: any[]) => void;
  onUpdate?: () => void;
}

type OrderStatus = 'pending' | 'approved' | 'in_progress' | 'canceled' | 'received';

const statusColors: Record<OrderStatus | string, string> = {
  pending: 'bg-yellow-200 text-yellow-800 border-yellow-400',
  approved: 'bg-blue-200 text-blue-800 border-blue-400',
  in_progress: 'bg-purple-200 text-purple-800 border-purple-400',
  received: 'bg-green-200 text-green-800 border-green-400',
  canceled: 'bg-red-200 text-red-800 border-red-400'
};

const statusLabels: Record<OrderStatus | string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  in_progress: 'Em Andamento',
  received: 'Recebido',
  canceled: 'Cancelado'
};

const statusOptions: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pendente', color: 'text-yellow-600' },
  { value: 'approved', label: 'Aprovado', color: 'text-blue-600' },
  { value: 'in_progress', label: 'Em Andamento', color: 'text-purple-600' },
  { value: 'received', label: 'Recebido', color: 'text-green-600' },
  { value: 'canceled', label: 'Cancelado', color: 'text-red-600' }
];

const getStatusColor = (status: string): string => {
  return statusColors[status as OrderStatus] || 'bg-gray-200 text-gray-800 border-gray-400';
};

const getStatusLabel = (status: string): string => {
  return statusLabels[status as OrderStatus] || status || 'Desconhecido';
};

// --- COMPONENTE COM PAGINAÇÃO ---
export default function QuotationsList({ quotations = [], onUpdate }: QuotationsListProps) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [documentType, setDocumentType] =
    useState<"purchase_order" | "label_70x30" | "label_100x100" | "separation_list">("purchase_order");

  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // PAGINAÇÃO
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(quotations.length / itemsPerPage);

  const paginatedData = quotations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  const toggleMenu = (orderId: number) => {
    setOpenMenuId(openMenuId === orderId ? null : orderId);
  };

  const handlePreview = async (order: any) => {
    try {
      setOpenMenuId(null);
      Swal.fire({
        title: 'Carregando...',
        text: 'Buscando informações completas do pedido',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const fullOrder = await getOrderById(order.ordernumber);
      if (!fullOrder) throw new Error('Pedido não encontrado');

      const normalizedOrder = {
        id: fullOrder.id,
        ordernumber: fullOrder.orderNumber,
        suppliername: fullOrder.supplier?.name || '---',
        supplierid: fullOrder.supplierId,
        orderdate: fullOrder.orderDate,
        orderstatus: fullOrder.orderStatus,
        totalcost: fullOrder.totalCost,
        currency: fullOrder.currency || 'BRL',
        notes: fullOrder.notes || 'Nenhuma observação',
        companyid: fullOrder.companyId,
        createdat: fullOrder.createdAt,
        items: fullOrder.orderItems?.map((item: any) => ({
          productid: item.productid,
          productname: item.productname,
          productcode: item.productcode,
          productbrand: item.productbrand,
          productlocation: item.productlocation,
          quantity: item.quantity,
          cost: item.cost,
          subtotal: item.quantity * item.cost
        })) || [],
        orderitems: fullOrder.orderItems || [],
        supplier: {
          id: fullOrder.supplier?.id,
          name: fullOrder.supplier?.name || '---',
          email: fullOrder.supplier?.email || '---',
          phone: fullOrder.supplier?.phone || '---'
        },
        company: {
          id: fullOrder.requestingCompany?.id,
          name: fullOrder.requestingCompany?.name || '---',
          buyer: fullOrder.requestingCompany?.buyer || '---'
        },
        requestingCompany: fullOrder.requestingCompany
      };

      setSelectedOrder(normalizedOrder);
      setShowViewer(true);

      Swal.close();
    } catch (error: any) {
      Swal.fire({
        title: 'Erro!',
        text: 'Não foi possível carregar os detalhes do pedido.',
        icon: 'error'
      });
    }
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setSelectedOrder(null);
  };

  const handleUpdateStatus = async (order: any) => {
    setOpenMenuId(null);
    const currentStatus = order.orderstatus;

    const optionsHtml = statusOptions.map(option =>
      `<option value="${option.value}" ${option.value === currentStatus ? 'selected' : ''}>${option.label}</option>`
    ).join('');

    const { value: newStatus, isConfirmed } = await Swal.fire({
      title: 'Atualizar Status',
      html: `
        <select id="status-select" class="w-full border p-2 rounded">
          ${optionsHtml}
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Atualizar',
      preConfirm: () => {
        const select = document.getElementById('status-select') as HTMLSelectElement;
        return select.value;
      }
    });

    if (isConfirmed) {
      try {
        const payload: UpdateOrderStatusPayload = {
          orderStatus: newStatus,
          notes: order.notes
        };
        await updatePurchaseOrder(Number(order.id), payload);
        if (onUpdate) onUpdate();
      } catch (err) {
        console.error(err);
      }
    }
  };

const handlePrintProductLabels = async (order: any) => {
  try {
    Swal.fire({ 
      title: 'Carregando...', 
      didOpen: () => Swal.showLoading() 
    });

    const fullOrder = await getOrderById(order.orderNumber || order.ordernumber);
    
    if (!fullOrder || !Array.isArray(fullOrder.orderItems)) {
      throw new Error('Pedido inválido');
    }

    const orderWithLowercase = {
      ...fullOrder,
      orderItems: fullOrder.orderItems.map((item: any) => ({
        productcode: item.productcode,
        productname: item.productname,
        productbrand: item.productbrand,
        productlocation: item.productlocation,
        quantity: item.quantity
      }))
    };

    Swal.close();

    await new Promise(resolve => setTimeout(resolve, 100));

    setSelectedProduct(orderWithLowercase);
    setDocumentType("label_70x30");
    setShowDocumentViewer(true);

  } catch (error) {
    Swal.close();
    Swal.fire('Erro', 'Não foi possível carregar os itens.', 'error');
  }
};

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

  // 👉 RENDERIZA TUDO NORMAL (COM PAGINAÇÃO)
  return (
    <>
      <div className="bg-white p-6 rounded shadow space-y-4">
        <h2 className="text-2xl text-center font-semibold text-slate-800 mb-4">
          Solicitações de Compra
        </h2>

        {quotations.length === 0 ? (
          <p className="text-slate-500">Nenhuma solicitação registrada ainda.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded border border-slate-300">
              <table className="min-w-full text-sm text-slate-700">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Nº Solicitação</th>
                    <th className="px-4 py-3 text-left">Fornecedor</th>
                    <th className="px-4 py-3 text-left">Data</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {paginatedData.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{order.ordernumber}</td>
                      <td className="px-4 py-3">{order.suppliername}</td>
                      <td className="px-4 py-3">{formatDate(order.orderdate)}</td>
                      <td className="px-4 py-3 text-right">R$ {order.totalcost}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(order.orderstatus)}`}>
                          {getStatusLabel(order.orderstatus)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="relative">
                          <button onClick={() => toggleMenu(order.id)} className="p-1.5 rounded-lg">
                            <MoreVertical size={18} />
                          </button>

                          {openMenuId === order.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />

                              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg border rounded py-1 z-20">
                                <button onClick={() => handlePreview(order)} className="w-full px-4 py-2 text-left flex gap-2">
                                  <Eye size={16} />
                                  Visualizar
                                </button>

                                <button onClick={() => handleUpdateStatus(order)} className="w-full px-4 py-2 text-left flex gap-2">
                                  <RefreshCw size={16} />
                                  Atualizar Status
                                </button>

                                <button onClick={() => handlePrintProductLabels(order)} className="w-full px-4 py-2 text-left flex gap-2">
                                  <Download size={16} />
                                  Etiquetas
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINAÇÃO */}
            <div className="flex justify-between items-center mt-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
              >
                Anterior
              </button>

              <span className="text-sm text-slate-700">
                Página {currentPage} de {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </>
        )}
      </div>

      {showViewer && (
        <DocumentViewer order={selectedOrder} onClose={handleCloseViewer} />
      )}
    </>
  );
}
