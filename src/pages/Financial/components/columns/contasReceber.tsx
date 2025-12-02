import React from 'react';
import { CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../../utils/formatters';

import { OrderResponse } from '../../../../service/interfaces';
import { safeFormatDate } from '../../../../utils/dateTime';

interface ContasReceberColumnsProps {
  handleMarkAsPaid: (id: number) => void;
}

export const getContasReceberColumns = ({ handleMarkAsPaid }: ContasReceberColumnsProps) => [
  {
    key: 'orderNumber',
    header: 'Pedido',
    render: (payment: OrderResponse) => (
      <div>
        <p className="font-mono font-medium text-slate-900">
          {payment.orderNumber || `#${payment.id}`}
        </p>
        {payment.orderDate && (
          <p className="text-xs text-gray-500">
            {safeFormatDate(payment.orderDate)}
          </p>
        )}
      </div>
    ),
  },
  {
    key: 'customer',
    header: 'Cliente',
    render: (pedido: OrderResponse) => (
      <div>
        <p className="font-medium text-slate-900">{pedido.customer.name || 'N/A'}</p>
        {pedido.customer.code && (
          <p className="text-xs text-gray-500">{pedido.customer.code}</p>
        )}
      </div>
    ),
  },
  {
    key: 'amount',
    header: 'Valor',
    render: (pedido: OrderResponse) => (
      <p className="font-semibold">
        {formatCurrency(pedido.totalAmount || 0)}
      </p>
    ),
  },
  {
    key: 'due_date',
    header: 'Vencimento',
    render: (pedido: OrderResponse) => (
      <div>
        <p className="text-sm">{formatDate(pedido.orderDate || "")}</p>
        {pedido.payment?.date && (
          <p className="text-xs text-green-600">
            Pago em: {safeFormatDate(pedido.payment?.date).toString()}
          </p>
        )}
      </div>
    ),
  },
  {
    key: 'actions',
    header: 'Status de pagamento',
    render: (pedido: OrderResponse) => (
      pedido.payment?.status !== 'paid' ? (
        <button
          onClick={() => handleMarkAsPaid(pedido.id)}
          className="p-2 flex gap-2 px-16 hover:bg-green-50 rounded-md transition-colors text-green-600"
          title="Marcar como pago"
        >
          <CheckCircle className="h-4 w-4" />
        </button>
      ) : (
        <span className="text-xs text-gray-400 px-16">Pago</span>
      )
    ),
  },
];