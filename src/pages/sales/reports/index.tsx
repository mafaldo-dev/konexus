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
} from '../../../service/api/reports';
import {
  SalesReport,
  PurchaseReport,
  TopProduct,
  TopCustomer,
  CustomerRank
} from '../../../service/interfaces/reports';
import Dashboard from '../../../components/dashboard/Dashboard';

const ReportsDashboard: React.FC = () => {
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [purchaseReport, setPurchaseReport] = useState<PurchaseReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [customerRank, setCustomerRank] = useState<CustomerRank[]>([]);

  const giftThreshold = 10000;

  useEffect(() => {
    getSalesReports().then(setSalesReport);
    getPurchaseReports().then(setPurchaseReport);
    getTopProducts().then(setTopProducts);
    getTopCustomers().then(setTopCustomers);
    getCustomerRank().then(setCustomerRank);
  }, []);

  return (
    <Dashboard>
      <div className="bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Conteúdo principal */}
        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard de Relatórios</h1>

          <div className="flex flex-col gap-6">
            {salesReport && (
              <DynamicReportPanel
                title="Relatório de Vendas"
                data={{
                  "Total de Vendas": salesReport.totalSales,
                  "Número de Pedidos": salesReport.numberOfOrders,
                  "Valor Médio do Pedido": salesReport.averageOrderValue,
                }}
              />
            )}
            {purchaseReport && (
              <DynamicReportPanel
                title="Relatório de Compras"
                data={{
                  "Total de Compras": purchaseReport.totalPurchases,
                  "Número de Notas Fiscais": purchaseReport.numberOfInvoices,
                  "Valor Médio da Nota Fiscal": purchaseReport.averageInvoiceValue,
                }}
              />
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopProductsList products={topProducts} />
              <TopCustomersPanel customers={topCustomers} customerRank={customerRank} giftThreshold={giftThreshold} />
            </div>
          </div>
        </div>
      </div>
    </Dashboard>
  );
};

export default ReportsDashboard;
