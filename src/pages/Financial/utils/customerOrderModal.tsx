import React from 'react';
import { X } from 'lucide-react';
import { RECEIVABLE_STATUS } from '../../../utils/financial';
import { formatCurrency } from '../../../utils/formatters';
import { formatPostgresDate } from '../../../utils/dateTime';
import { ORDER_STATUS } from '../../../components/utils/statusLabel';

interface CustomerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerOrders: any[];
}

export const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({
  isOpen,
  onClose,
  customerName,
  customerOrders
}) => {
  if (!isOpen) return null;

  // Detecta se é um pagamento ou um pedido
  const isPayment = (item: any) => item?.payment_type || item?.duedate;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Histórico do Cliente</h2>
            <p className="text-sm text-gray-600 mt-1">{customerName}</p>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {customerOrders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum registro encontrado</p>
          ) : (
            <div className="space-y-4">
              {customerOrders.map((item) => (
                <div key={`${item.type}-${item.id}`} className="border border-gray-200 rounded-lg p-4">

                  <div className="flex justify-between items-start">
                    {/* ESQUERDA */}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {item.type === "order" ? `Pedido ${item.title}` : `Pagamento ${item.title}`}
                      </p>

                      <p className="text-sm text-gray-600 mt-1">
                        Valor: {formatCurrency(item.amount)}
                      </p>

                      {/* Se for pagamento, mostra o número do pedido */}
                      {item.type === "payment" && (
                        <p className="text-xs text-gray-500 mt-1">
                          Pedido relacionado: #{item.orderId}
                        </p>
                      )}

                      {/* Notas do pagamento */}
                      {item.type === "payment" && item.notes && (
                        <p className="text-xs text-gray-500 italic mt-1">
                          {item.notes}
                        </p>
                      )}
                    </div>

                    {/* DIREITA */}
                    <div className="text-right space-y-1">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${ORDER_STATUS[item.status]?.color ||
                          "bg-gray-100 text-gray-800 border border-gray-200"
                          }`}
                      >
                        {ORDER_STATUS[item.status]?.label || item.status}
                      </span>

                      <p className="text-xs text-gray-500">
                        Data: {formatPostgresDate(item.date)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
