import { Eye, Download } from 'lucide-react';
import { format } from 'date-fns';

interface QuotationsListProps {
  quotations: any[];
  onPreview?: (quotation: any) => void;
}

type OrderStatus = 'pending' | 'approved' | 'in_progress' | 'canceled' | 'received';

const statusColors: Record<OrderStatus | string, string> = {
  pending: 'bg-yellow-200 text-yellow-800 border-yellow-400',
  approved: 'bg-blue-200 text-blue-800 border-blue-400',
  in_progress: 'bg-emerald-200 text-emerald-800 border-emerald-400',
  canceled: 'bg-red-200 text-red-800 border-red-400',
  received: 'bg-green-200 text-green-800 border-green-400'
};

const statusLabels: Record<OrderStatus | string, string> = {
  pending: 'Pendente',
  approved: 'Aprovada',
  in_progress: 'Em Andamento',
  canceled: 'Cancelada',
  received: 'Recebida'
};

const getStatusColor = (status: string): string => {
  return statusColors[status as OrderStatus] || 'bg-gray-200 text-gray-800 border-gray-400';
};

const getStatusLabel = (status: string): string => {
  return statusLabels[status as OrderStatus] || status || 'Desconhecido';
};

export default function QuotationsList({ quotations = [], onPreview }: QuotationsListProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow space-y-4">
      <h2 className="text-2xl text-center font-semibold text-slate-800 mb-4">Solicitações de Compra</h2>

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
                  <td className="px-4 py-3">
                    {order.suppliername || '---'}
                  </td>
                  <td className="px-4 py-3">
                    {formatDate(order.orderdate)}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-700 font-semibold">
                    R$ {(order.totalcost || 0)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs border font-medium inline-block ${getStatusColor(order.orderstatus)}`}>
                      {getStatusLabel(order.orderstatus)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => onPreview?.(order)}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Visualizar"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-800 transition"
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}