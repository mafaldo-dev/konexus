import { Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import { PurchaseRequest } from '../../../service/interfaces/sales/purchaseRequest';
import { generateQuotationPdf } from '../../../utils/pdfGenerator';

interface QuotationsListProps {
  quotations: PurchaseRequest[];
  onPreview: (request: PurchaseRequest) => void;
}

export default function QuotationsList({ quotations, onPreview }: QuotationsListProps) {
  return (
    <div className="bg-white p-6 rounded shadow space-y-4">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Cotações Realizadas</h2>
      {quotations.length === 0 ? (
        <p className="text-slate-500">Nenhuma cotação registrada ainda.</p>
      ) : (
        <table className="min-w-full text-sm border border-slate-200 rounded overflow-hidden">
          <thead className="bg-slate-100 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-3">Nº Requisição</th>
              <th className="px-4 py-3">Fornecedor</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Entrega Prevista</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map((q) => (
              <tr
                key={q.requestNumber}
                className="hover:bg-slate-50 border-t border-slate-200"
              >
                <td className="px-4 py-3 font-medium text-slate-700">
                  {q.requestNumber}
                </td>
                <td className="px-4 py-3">{q.supplierName}</td>
                <td className="px-4 py-3">
                  {format(new Date(q.requestDate), 'dd/MM/yyyy')}
                </td>
                <td className="px-4 py-3">
                  {format(new Date(q.deliveryDate), 'dd/MM/yyyy')}
                </td>
                <td className="px-4 py-3 text-right text-slate-800 font-semibold">
                  R$ {q.totalAmount.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => onPreview(q)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Visualizar"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => generateQuotationPdf(q)}
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
