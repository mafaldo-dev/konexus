import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';

import { DynamicTable } from '../../../../utils/Table/DynamicTable';
import { FinancialService } from '../../../../pages/Financial/service/financialService';
import { getContasPagarColumns } from '../../../../pages/Financial/components/columns/contasPagar';
import { getContasReceberColumns } from '../../../../pages/Financial/components/columns/contasReceber';
import { getPedidosColumns } from '../../../../pages/Financial/components/columns/pedidosColumn';
import { ActiveFilters } from '../../../../pages/Financial/utils/ActivateFilter';
import { CustomerOrdersModal } from '../../../../pages/Financial/utils/customerOrderModal';
import { FiltersModal } from '../../../../pages/Financial/utils/FiltersModal';
import { ReportModal } from '../../../../pages/Financial/utils/ReportModal';
import { StatsCards } from '../../../../pages/Financial/utils/StatsCards';
import { TabNavigation } from '../../../../pages/Financial/utils/TabNavigation';
import { useFinancialData } from '../../../../hooks/useFinancialData';
import { useFinancialFilters } from '../../../../hooks/useFinancialFilters';
import { CreateContaPagarModal } from '../../../../pages/Financial/paymentAccounts';
import { ActionsDropdown } from '../../../../pages/Financial/components/ActionsDropdown';


// Interface para as colunas
interface ColumnsMap {
  [key: string]: any[];
}

export const OverviewTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"contas-receber" | "contas-pagar" | "pedidos">("contas-receber");
  const [modalOpen, setModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ name: string; id: number } | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const {
    contasReceber,
    contasPagar,
    pedidos,
    stats,
    isLoadingContasReceber,
    isLoadingContasPagar,
    loadContasReceber,
    loadContasPagar,
    setPedidos
  } = useFinancialData();

  const {
    searchTerm,
    setSearchTerm,
    activeFilters,
    setActiveFilters,
    aplicarFiltros
  } = useFinancialFilters();

  // Aplicar filtros
  const contasReceberFiltradas = aplicarFiltros(contasReceber, searchTerm, activeFilters);
  const contasPagarFiltradas = aplicarFiltros(contasPagar, searchTerm, activeFilters);
  const pedidosFiltrados = aplicarFiltros(pedidos, searchTerm, activeFilters);

  const handleLoadData = async () => {
    if (activeSubTab === "contas-receber") {
      await loadContasReceber();
    } else if (activeSubTab === "contas-pagar") {
      await loadContasPagar();
    }
  };

  const handleMarkAsPaid = (id: number) => {
    FinancialService.markAsPaid(id, activeSubTab, handleLoadData);
  };

  const handleLoadCustomerOrders = async (id: number, customerName: string) => {
    await FinancialService.loadCustomerOrders(
      id,
      customerName,
      setCustomerOrders,
      setSelectedCustomer,
      setModalOpen
    );
  };

  const handleGenerateReport = async (startDate: string, endDate: string, reportType: string) => {
    await FinancialService.generateReport(startDate, endDate, reportType, setReportModalOpen);
  };

  const handleApplyFilters = (filters: any) => {
    setActiveFilters(filters);
  };

  const handleExportData = () => {
    FinancialService.exportData(activeSubTab, contasReceberFiltradas, contasPagarFiltradas, pedidosFiltrados);
  };

  // Carregar dados quando mudar de aba
  useEffect(() => {
    handleLoadData();
  }, [activeSubTab]);

  // Configurar colunas com tipo correto
  const columns: ColumnsMap = {
    "contas-receber": getContasReceberColumns({ handleMarkAsPaid }),
    "contas-pagar": getContasPagarColumns(),
    "pedidos": getPedidosColumns({ 
      handleLoadCustomerOrders, 
      pedidos, 
      setPedidos 
    })
  };
  
  const handleCreateSuccess = () => {
    // Recarregar os dados após criar uma nova conta
    if (activeSubTab === "contas-pagar") {
      loadContasPagar();
    }
  };

  const getCurrentData = () => {
    switch (activeSubTab) {
      case "contas-receber": return contasReceberFiltradas;
      case "contas-pagar": return contasPagarFiltradas;
      case "pedidos": return pedidosFiltrados;
      default: return [];
    }
  };

  const getCurrentLoading = () => {
    switch (activeSubTab) {
      case "contas-receber": return isLoadingContasReceber;
      case "contas-pagar": return isLoadingContasPagar;
      default: return false;
    }
  };

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />

      <div className="flex items-center justify-between">
        <TabNavigation activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Buscar por pedido ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botão de Filtros (fica separado) */}
          <button
            onClick={() => setFiltersModalOpen(true)}
            className="px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium text-slate-700"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {Object.values(activeFilters).some((filter: any) => filter !== '' && filter !== null) && (
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            )}
          </button>

          {/* Dropdown com as ações */}
          <ActionsDropdown
            activeSubTab={activeSubTab}
            onCreateClick={() => setCreateModalOpen(true)}
            onReportClick={() => setReportModalOpen(true)}
            onExportClick={handleExportData}
          />
        </div>
      </div>

      <ActiveFilters activeFilters={activeFilters} setActiveFilters={setActiveFilters} />

      <div className="bg-white rounded-lg border border-slate-200">
        <DynamicTable
          data={getCurrentData()}
          columns={columns[activeSubTab]}
          loading={getCurrentLoading()}
          emptyMessage={`Nenhum ${activeSubTab.replace('-', ' ')} encontrado`}
          emptyDescription={`Os ${activeSubTab.replace('-', ' ')} aparecerão aqui quando forem criados`}
        />
      </div>

      <CustomerOrdersModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        customerName={selectedCustomer?.name || ''}
        customerOrders={customerOrders}
      />

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onGenerateReport={handleGenerateReport}
      />

      <FiltersModal
        isOpen={filtersModalOpen}
        onClose={() => setFiltersModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentTab={activeSubTab}
      />
      
      <CreateContaPagarModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};