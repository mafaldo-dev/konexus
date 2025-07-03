import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Calendar, User, CreditCard, FileText } from "lucide-react";
import { Order } from "../../../../service/interfaces";


interface SalesTableProps {
  orders: Order[];
  loading: boolean;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  selectedOrder: Order | null;
}

const SalesTable: React.FC<SalesTableProps> = ({ orders, loading }) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    selectedOrder: null
  });

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(prev => ({ ...prev, visible: false }));
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const handleContextMenu = (
    event: React.MouseEvent<HTMLTableRowElement>,
    order: Order
  ) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.pageX,
      y: event.pageY,
      selectedOrder: order
    });
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/3" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-slate-100 px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            Vendas Realizadas ({orders.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-slate-50">
              <tr className="text-slate-700">
                <th className="px-6 py-3 font-medium">Pedido</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Vendedor</th>
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Valor</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="wait">
                {orders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    onContextMenu={(e) => handleContextMenu(e, order)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-slate-50 transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Package className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-medium text-slate-900">
                          #{order.order_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-900">
                        <User className="w-4 h-4 text-slate-400" />
                        {order.customer_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{order.salesperson}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formatDate(order.order_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(order.total_amount)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {order.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Nenhuma venda encontrada
            </h3>
            <p className="text-slate-500">
              Não há vendas realizadas que correspondem aos filtros aplicados.
            </p>
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu.visible && (
        <div
          className="absolute z-50 w-40 bg-white border border-slate-200 shadow-xl rounded-md py-1 text-sm"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="w-full px-4 py-2 text-left hover:bg-slate-100 flex items-center gap-2"
            onClick={() => {
              // Aqui você pode colocar a lógica de abrir modal ou redirecionar
              alert(`Visualizar NF do pedido: ${contextMenu.selectedOrder?.order_number}`);
              setContextMenu(prev => ({ ...prev, visible: false }));
            }}
          >
            <FileText className="w-4 h-4 text-slate-500" />
            Visualizar NF
          </button>
        </div>
      )}
    </div>
  );
};

export default SalesTable;
