import React from 'react';
import { MoreVertical } from 'lucide-react';
import { FinancialService } from '../../service/financialService';
import { OrderResponse } from '../../../../service/interfaces';
import { RECEIVABLE_STATUS } from '../../../../utils/financial';
import { formatCurrency, formatDate } from '../../../../utils/formatters';
import { ORDER_STATUS } from '../../../../components/utils/statusLabel';

interface PedidosColumnsProps {
  handleLoadCustomerOrders: (customerId: number, customerName: string) => void;
  pedidos: OrderResponse[];
  setPedidos: (pedidos: OrderResponse[]) => void;
}

export const getPedidosColumns = ({
  handleLoadCustomerOrders,
  pedidos,
  setPedidos
}: PedidosColumnsProps) => [
    {
      key: 'orderNumber',
      header: 'Pedido',
      render: (pedido: OrderResponse) => (
        <div>
          <p className="font-mono font-medium text-slate-900">
            {pedido.orderNumber || `#${pedido.id}`}
          </p>
          {pedido.orderDate && (
            <p className="text-xs text-gray-500">
              {formatDate(pedido.orderDate)}
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
      key: 'orderDate',
      header: 'Data',
      render: (pedido: OrderResponse) => (
        <p className="text-sm text-gray-600">
          {formatDate(pedido.orderDate)}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (pedido: OrderResponse) => {
        const statusInfo = ORDER_STATUS[pedido.orderStatus] || {
          label: pedido.orderStatus,
          color: "bg-gray-50 text-gray-800 border border-gray-200 px-2 py-1 rounded-md text-xs font-medium"
        };
        return (
          <span className={statusInfo.color}>
            {statusInfo.label}
          </span>
        );
      },
    },
    {
      key: 'payment_status',
      header: 'Status de pagamento',
      render: (pedido: OrderResponse) => {
        const paymentStatus = pedido.payment?.status === 'paid' ? "Liberado" : "Aguardando pagamento";
        const statusInfo = RECEIVABLE_STATUS[paymentStatus] || {
          label: paymentStatus,
          color: "bg-gray-50 text-gray-800 border border-gray-200 px-2 py-1 rounded-md text-xs font-medium"
        };
        return (
          <span className={statusInfo.color}>
            {statusInfo.label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (pedido: OrderResponse) => (
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button
              className="p-2 hover:bg-gray-50 rounded-md transition-colors text-gray-600"
              title="Mais opções"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="py-1">
                <button
                  onClick={() => handleLoadCustomerOrders(
                    pedido.customer?.id ?? pedido.customer.id,
                    pedido.customer?.name ?? pedido.customer.name
                  )}

                  className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:text-blue-500 hover:bg-gray-100"
                >
                  Ver Pedidos do Cliente
                </button>
                
                {pedido.payment?.status === 'paid' && (
                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => FinancialService.cancelPayment(pedido.id)}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:text-red-600 hover:bg-red-50"
                    >
                      Cancelar Pagamento
                    </button>
                  </div>
                )}

                <div className="border-t border-gray-100">
                  <button
                    onClick={() => FinancialService.updateOrderStatus(
                      pedido.id,
                      pedido.orderStatus,
                      pedidos,
                      setPedidos
                    )}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:text-blue-500 hover:bg-blue-50"
                  >
                    Liberar Pedido
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];