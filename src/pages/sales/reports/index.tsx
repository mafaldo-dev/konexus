import React, { useEffect, useState } from 'react';
import DynamicReportPanel from './components/DynamicReportPanel';
import TopProductsList from './components/TopProductsList';
import TopCustomersPanel from './components/TopCustomersPanel';
import {
  getSalesReports,
  getPurchaseReports,
  getTopProducts,
  getTopCustomers,
  getCustomerRank
} from '../../../service/api/Administrador/reports';
import {
  SalesReport,
  PurchaseReport,
  TopCustomer,
  CustomerRank
} from '../../../service/interfaces/reports';
import Dashboard from '../../../components/dashboard/Dashboard';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

export type TopProduct = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price?: number;
  category?: string;
};

const ReportsDashboard: React.FC = () => {
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [purchaseReport, setPurchaseReport] = useState<PurchaseReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [customerRank, setCustomerRank] = useState<CustomerRank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const giftThreshold = 10000;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [
        salesData, 
        purchaseData, 
        productsData, 
        customersData, 
        rankData
      ] = await Promise.all([
        getSalesReports(),
        getPurchaseReports(),
        getTopProducts(),
        getTopCustomers(),
        getCustomerRank()
      ]);

      setSalesReport(salesData);
      setPurchaseReport(purchaseData);
      setTopProducts(productsData);
      setTopCustomers(customersData);
      setCustomerRank(rankData);
      
      setLastUpdated(new Date().toLocaleTimeString('pt-BR'));
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Falha ao carregar os dados. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dashboard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard de Relatórios</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Visão geral das métricas de vendas, compras e desempenho
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center gap-3">
                {lastUpdated && (
                  <span className="text-sm text-gray-500">
                    Atualizado às {lastUpdated}
                  </span>
                )}
                <button
                  onClick={fetchData}
                  disabled={isLoading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Atualizar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {error ? (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <button
                      onClick={fetchData}
                      className="font-medium text-red-700 hover:text-red-600 underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cards de métricas */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {salesReport && (
                  <DynamicReportPanel
                    title="Vendas"
                    icon="sales"
                    data={{
                      "Total de Vendas": formatCurrency(salesReport.totalSales),
                      "Número de Pedidos": salesReport.numberOfOrders.toString(),
                      "Ticket Médio": formatCurrency(salesReport.averageOrderValue),
                    }}
                  />
                )}
                
                {purchaseReport && (
                  <DynamicReportPanel
                    title="Compras"
                    icon="purchases"
                    data={{
                      "Total de Compras": formatCurrency(purchaseReport.totalPurchases),
                      "Notas Fiscais": purchaseReport.numberOfInvoices.toString(),
                      "Valor Médio": formatCurrency(purchaseReport.averageInvoiceValue),
                    }}
                  />
                )}
              </div>

              {/* Listas de produtos e clientes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopProductsList 
                  products={topProducts} 
                  onProductClick={(product) => console.log('Product clicked:', product)}
                />
                
                <TopCustomersPanel 
                  customers={topCustomers} 
                  customerRank={customerRank} 
                  giftThreshold={giftThreshold}
                  onCustomerClick={(customer) => console.log('Customer clicked:', customer)}
                />
              </div>

              {/* Seção adicional para insights */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Insights e Análises</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800">Produto mais vendido</h4>
                    <p className="mt-1 text-lg font-semibold text-blue-900">
                      {topProducts[0]?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-blue-700">
                      {topProducts[0]?.quantity || 0} unidades
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800">Melhor cliente</h4>
                    <p className="mt-1 text-lg font-semibold text-green-900">
                      {topCustomers[0]?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-green-700">
                      {topCustomers[0]?.totalSpent ? formatCurrency(topCustomers[0].totalSpent) : 'R$ 0,00'}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-purple-800">Taxa de conversão</h4>
                    <p className="mt-1 text-lg font-semibold text-purple-900">
                      {salesReport && customerRank.length > 0 
                        ? `${Math.round((salesReport.numberOfOrders / customerRank.length) * 100)}%` 
                        : '0%'}
                    </p>
                    <p className="text-sm text-purple-700">
                      {salesReport?.numberOfOrders || 0} pedidos / {customerRank.length} clientes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dashboard>
  );
};

export default ReportsDashboard;