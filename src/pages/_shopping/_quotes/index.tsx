import { Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import { PurchaseRequest } from '../../../service/interfaces/sales/purchaseRequest';
import { generateQuotationPdf } from '../../../utils/invoicePdf/generateQuotationPdf';
import { purchaseAllOrders } from '../../../service/api/Administrador/purchaseRequests';
import { useEffect, useState } from 'react';

interface QuotationsListProps {
  quotations: PurchaseRequest[];
  onPreview?: (quotation: PurchaseRequest) => void;
}

const statusColors: Record<PurchaseRequest['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  approved: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
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
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Solicitações de Compra</h2>

      {purchases.length === 0 ? (
        <p className="text-slate-500">Nenhuma solicitação registrada ainda.</p>
      ) : (
        <table className="min-w-full text-sm border border-slate-200 rounded overflow-hidden">
          <thead className="bg-slate-100 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-3">Nº Solicitação</th>
              <th className="px-4 py-3">Empresa Solicitante</th>
              <th className="px-4 py-3">Fornecedor</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Entrega Prevista</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((q) => (
              <tr key={q.requestNumber} className="hover:bg-slate-50 border-t border-slate-200">
                <td className="px-4 py-3 font-medium text-slate-700">{q.requestNumber}</td>
                <td className="px-4 py-3">{q.companyData.company_name || '-'}</td>
                <td className="px-4 py-3">{q.companyData.company_name}</td>
                <td className="px-4 py-3">{format(new Date(q.requestDate), 'dd/MM/yyyy')}</td>
                <td className="px-4 py-3">{format(new Date(q.deliveryDate), 'dd/MM/yyyy')}</td>
                <td className="px-4 py-3 text-right text-slate-800 font-semibold">
                  R${' '}
                  {q.products
                    .reduce((acc, product) => acc + product.total_price, 0)
                    .toFixed(2)}
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
                    {/* Visualizar */}
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
                      className="text-blue-600 hover:text-blue-800"
                      title="Visualizar"
                    >
                      <Eye size={18} />
                    </button>

                    {/* Baixar */}
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
                      className="text-green-600 hover:text-green-800"
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
      )}
    </div>
  );
}
