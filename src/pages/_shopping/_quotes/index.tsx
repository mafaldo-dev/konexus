import { Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

import { PurchaseRequest } from '../../../service/interfaces/sales/purchaseRequest';
import { generateQuotationPdf } from '../../../utils/invoicePdf/generateQuotationPdf';
import { purchaseAllOrders } from '../../../service/api/Administrador/purchaseRequests';

interface QuotationsListProps {
  quotations: PurchaseRequest[];
  onPreview?: (quotation: PurchaseRequest) => void;
}

const statusColors: Record<PurchaseRequest['status'], string> = {
  pending: 'bg-yellow-200 text-yellow-800 border-yellow-400',
  approved: 'bg-blue-200 text-blue-800 border-blue-400',
  completed: 'bg-emerald-200 text-emerald-800 border-emerald-400',
};

export default function QuotationsList({ quotations, onPreview }: QuotationsListProps) {
  const [purchases, setPurchases] = useState<PurchaseRequest[]>([]);

  const handleAllPurchaseOrder = async () => {
    try {
      const response = await purchaseAllOrders();
      setPurchases(response);
    } catch (err) {
      console.error('Erro ao recuperar Solicitações de compra: ', err);
      alert('Erro ao recuperar a lista de Solicitações!');
    }
  };

  useEffect(() => {
    handleAllPurchaseOrder();
  }, []);

  return (
    <div className="bg-white p-6 rounded shadow space-y-4">
      <h2 className="text-2xl font-semibold text-slate-800 mb-4">Solicitações de Compra</h2>

      {purchases.length === 0 ? (
        <p className="text-slate-500">Nenhuma solicitação registrada ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-300">
          <table className="min-w-full text-sm text-slate-700">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Nº Solicitação</th>
                <th className="px-4 py-3 text-left font-semibold">Empresa Solicitante</th>
                <th className="px-4 py-3 text-left font-semibold">Fornecedor</th>
                <th className="px-4 py-3 text-left font-semibold">Data</th>
                <th className="px-4 py-3 text-left font-semibold">Entrega Prevista</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {purchases.map((q, idx) => (
                <tr
                  key={q.requestNumber}
                  className={`transition ${
                    idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                  } hover:bg-slate-100`}
                >
                  <td className="px-4 py-3 font-medium text-slate-800">{q.requestNumber}</td>
                  <td className="px-4 py-3">{q.companyData.company_name || '-'}</td>
                  <td className="px-4 py-3">{q.enterprise_name}</td>
                  <td className="px-4 py-3">{format(new Date(q.requestDate), 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-3">{format(new Date(q.deliveryDate), 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-3 text-right text-emerald-700 font-semibold">
                    R$ {q.products.reduce((acc, p) => acc + (p.total_price || 0), 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs border font-medium inline-block ${statusColors[q.status]}`}
                    >
                      {q.status === 'pending'
                        ? 'Pendente'
                        : q.status === 'approved'
                        ? 'Aprovada'
                        : 'Concluída'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={async () => {
                          if (onPreview) {
                            onPreview(q);
                          } else {
                            const blob = await generateQuotationPdf(q);
                            const url = URL.createObjectURL(blob);
                            window.open(url, '_blank');
                            URL.revokeObjectURL(url);
                          }
                        }}
                        className="bg-slate-800 hover:text-white transition"
                        title="Visualizar"
                      >
                        <Eye size={18} />
                      </button>

                      <button
                        onClick={async () => {
                          const blob = await generateQuotationPdf(q);
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `cotacao-${q.requestNumber}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                        }}
                        className="text-emerald-600 hover:text-emerald-800 transition"
                        title="Baixar PDF"
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
