import React, { useEffect, useState } from 'react';
import { handleAllOrders } from '../../../service/api/orders';
import { Order } from '../../../service/interfaces/orders';
import Dashboard from '../../../components/dashboard';

const CompletedSales: React.FC = () => {
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompletedOrders = async () => {
      try {
        setLoading(true);
        const allOrders = await handleAllOrders();
        const filteredOrders = allOrders.filter(order => order.status === "Enviado");
        setCompletedOrders(filteredOrders);
      } catch (err) {
        console.error("Error fetching completed orders:", err);
        setError("Failed to load completed sales.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedOrders();
  }, []);

  return (
    <Dashboard>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Vendas Realizadas</h1>

        {loading && <p>Carregando vendas realizadas...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && completedOrders.length === 0 && (
          <p>Nenhuma venda realizada encontrada.</p>
        )}

        {!loading && !error && completedOrders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Número do Pedido</th>
                  <th className="py-2 px-4 border-b">Cliente</th>
                  <th className="py-2 px-4 border-b">Vendedor</th>
                  <th className="py-2 px-4 border-b">Data do Pedido</th>
                  <th className="py-2 px-4 border-b">Valor Total</th>
                  <th className="py-2 px-4 border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {completedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b text-center">{order.order_number}</td>
                    <td className="py-2 px-4 border-b text-center">{order.customer_name}</td>
                    <td className="py-2 px-4 border-b text-center">{order.salesperson}</td>
                    <td className="py-2 px-4 border-b text-center">{new Date(order.order_date).toLocaleDateString()}</td>
                    <td className="py-2 px-4 border-b text-center">R$ {order.total_amount.toFixed(2)}</td>
                    <td className="py-2 px-4 border-b text-center">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Dashboard>
  );
};

export default CompletedSales;
