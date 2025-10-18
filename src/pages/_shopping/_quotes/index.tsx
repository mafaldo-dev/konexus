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
  onPreview?: (quotation: any) => void;
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

export default function QuotationsList({ quotations = [], onPreview, onUpdate }: QuotationsListProps) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

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
    console.error('Erro ao buscar pedido:', error);
    Swal.fire({
      title: 'Erro!',
      text: 'Não foi possível carregar os detalhes do pedido.',
      icon: 'error',
      confirmButtonColor: '#1e293b',
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

    const optionsHtml = statusOptions
      .map(option =>
        `<option value="${option.value}" ${option.value === currentStatus ? 'selected' : ''} class="${option.color}">
          ${option.label}
        </option>`
      )
      .join('');

    const { value: newStatus, isConfirmed } = await Swal.fire({
      title: 'Atualizar Status',
      html: `
        <div class="text-left mb-4">
          <p class="text-sm text-gray-600 mb-2">Pedido: <strong>${order.ordernumber}</strong></p>
          <p class="text-sm text-gray-600 mb-4">Fornecedor: <strong>${order.suppliername}</strong></p>
        </div>
        <label class="block text-left text-sm font-medium text-gray-700 mb-2">
          Selecione o novo status:
        </label>
        <select id="status-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-300 outline-none">
          ${optionsHtml}
        </select>
        <div class="mt-4 text-left">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Observações (opcional):
          </label>
          <textarea 
            id="notes-input" 
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-300 outline-none resize-none"
            rows="3"
            placeholder="Adicione observações sobre a mudança de status..."
          >${order.notes || ''}</textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Atualizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1e293b',
      cancelButtonColor: '#94a3b8',
      width: '500px',
      preConfirm: () => {
        const select = document.getElementById('status-select') as HTMLSelectElement;
        const notes = (document.getElementById('notes-input') as HTMLTextAreaElement).value;
        return {
          status: select.value,
          notes: notes.trim() || null
        };
      }
    });

    if (isConfirmed && newStatus) {
      try {
        Swal.fire({
          title: 'Atualizando...',
          text: 'Por favor, aguarde',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const updatePayload: UpdateOrderStatusPayload = {
          orderStatus: newStatus.status,
          notes: newStatus.notes
        };

        await updatePurchaseOrder(Number(order.id), updatePayload);

        Swal.fire({
          title: 'Sucesso!',
          text: 'Status atualizado com sucesso!',
          icon: 'success',
          confirmButtonColor: '#1e293b',
          timer: 2000
        });

        if (onUpdate) onUpdate();
      } catch (error: any) {
        console.error('❌ Erro capturado:', error);
        Swal.fire({
          title: 'Erro!',
          text: error.message || 'Não foi possível atualizar o status.',
          icon: 'error',
          confirmButtonColor: '#1e293b'
        });
      }
    }
  };

  const handleDownload = async (order: any) => {
    setOpenMenuId(null);

    try {
      Swal.fire({
        title: 'Gerando PDF...',
        text: 'Por favor, aguarde',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const response = await getOrderById(order.id);
      const orderDetails = response || response;

      generatePDF(orderDetails);

      Swal.fire({
        title: 'Sucesso!',
        text: 'PDF gerado com sucesso!',
        icon: 'success',
        confirmButtonColor: '#1e293b',
        timer: 2000,
        timerProgressBar: true
      });

    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      Swal.fire({
        title: 'Erro!',
        text: 'Não foi possível gerar o PDF. Tente novamente.',
        icon: 'error',
        confirmButtonColor: '#1e293b'
      });
    }
  };


  const generatePDF = (order: any) => {
    // ... [mantém o conteúdo completo do PDF como no seu código acima]
  };

  return (
    <>
      <div className="bg-white p-6 rounded shadow space-y-4">
        <h2 className="text-2xl text-center font-semibold text-slate-800 mb-4">
          Solicitações de Compra
        </h2>

        {quotations.length === 0 ? (
          <p className="text-slate-500">Nenhuma solicitação registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-slate-300">
            <table className="min-w-full text-sm text-slate-700">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Nº Solicitação</th>
                  <th className="px-4 py-3 text-left font-semibold">Fornecedor</th>
                  <th className="px-4 py-3 text-left font-semibold">Data</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-center font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {quotations.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {order.ordernumber || `#${order.id}`}
                    </td>
                    <td className="px-4 py-3">{order.suppliername || '---'}</td>
                    <td className="px-4 py-3">{formatDate(order.orderdate)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-semibold">
                      R$ {order.totalcost}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs border font-medium inline-block ${getStatusColor(order.orderstatus)}`}
                      >
                        {getStatusLabel(order.orderstatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="relative inline-block">
                        <button
                          onClick={() => toggleMenu(order.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-600 hover:text-slate-800"
                          title="Mais opções"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openMenuId === order.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                              <button
                                onClick={() => handlePreview(order)}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                              >
                                <Eye size={16} className="text-blue-600" />
                                Visualizar
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(order)}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                              >
                                <RefreshCw size={16} className="text-purple-600" />
                                Atualizar Status
                              </button>
                              <button
                                onClick={() => handleDownload(order)}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                              >
                                <Download size={16} className="text-green-600" />
                                Download
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
        )}
      </div>

      {showViewer && (
        <DocumentViewer order={selectedOrder} onClose={handleCloseViewer} />
      )}
    </>
  );
}
