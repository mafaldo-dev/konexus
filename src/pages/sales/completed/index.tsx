import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp } from 'lucide-react';

import SalesMetricsCards from './components/SalesMetricsCards';
import SalesFilters from './components/SalesFilters';
import SalesTable from './components/SalesTable';
import Dashboard from '../../../components/dashboard';

import { Order as OrderType } from '../../../service/interfaces/orders';
import { handleAllOrders } from '../../../service/api/orders';

export default function CompletedSales() {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  useEffect(() => {
    const fetchCompletedOrders = async () => {
      try {
        setLoading(true);
        const allOrders: OrderType[] = await handleAllOrders('-order_date');
        const completedOrders = allOrders.filter(order => order.status === "Enviado");
        setOrders(completedOrders);
      } catch (err) {
        console.error("Erro ao buscar vendas realizadas:", err);
        setError("Falha ao carregar vendas realizadas.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedOrders();
  }, []);

  const salespeople = useMemo(() => {
    const seen = new Set<string>();
    const uniqueSalespeople: string[] = [];

    orders.forEach(order => {
      if (order.salesperson && !seen.has(order.salesperson)) {
        seen.add(order.salesperson);
        uniqueSalespeople.push(order.salesperson);
      }
    });
    return uniqueSalespeople.filter(Boolean);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSalesperson !== 'all') {
      filtered = filtered.filter(order => order.salesperson === selectedSalesperson);
    }

    if (dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }

      filtered = filtered.filter(order => new Date(order.order_date) >= filterDate);
    }

    return filtered;
  }, [orders, searchTerm, selectedSalesperson, dateRange]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Erro ao carregar dados</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <Dashboard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Vendas Realizadas</h1>
                <p className="text-slate-600 flex items-center gap-2 mt-1">
                  <TrendingUp className="w-4 h-4" />
                  Acompanhe suas vendas concluídas e métricas de desempenho
                </p>
              </div>
            </div>
          </motion.div>

          {/* Métricas */}
          <SalesMetricsCards orders={filteredOrders} />

          {/* Filtros */}
          <SalesFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedSalesperson={selectedSalesperson}
            setSelectedSalesperson={setSelectedSalesperson}
            dateRange={dateRange}
            setDateRange={setDateRange}
            salespeople={salespeople}
          />

          {/* Tabela */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <SalesTable orders={filteredOrders} loading={loading} />
          </motion.div>
        </div>
      </div>
    </Dashboard>
  );
}
