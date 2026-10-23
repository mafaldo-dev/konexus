import React, { useState, useEffect } from 'react';
import { Search, Filter, Building2, ShieldAlert, ArrowLeft } from 'lucide-react';

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
import {
  getPaymentDashboard,
  OrderPaymentDashboard,
} from '../../../../services/financialService';
import { formatCurrency } from '../../../../utils/formatters';
import { useAuth } from '../../../../AuthContext';


// Interface para as colunas
interface ColumnsMap {
  [key: string]: any[];
}

export const OverviewTab: React.FC = () => {
  const { hasPermission } = useAuth();
  const canCreatePayment = hasPermission("finance", "create");
  const canApprovePayment = hasPermission("finance", "approve");
  const canReleaseOrder = hasPermission("vendas", "edit");
  const [activeSubTab, setActiveSubTab] = useState<"contas-receber" | "contas-pagar" | "pedidos">("contas-receber");
  const [modalOpen, setModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ name: string; id: number } | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [consolidated, setConsolidated] = useState(false);
  const [consolidatedSummary, setConsolidatedSummary] = useState<OrderPaymentDashboard | null>(null);
  const [consolidatedWarning, setConsolidatedWarning] = useState<string | null>(null);
  const [consolidatedError, setConsolidatedError] = useState<string | null>(null);
  const [consolidatedLoading, setConsolidatedLoading] = useState(false);

  const {
    contasReceber,
    contasPagar,
    pedidos,
    stats,
    isLoadingContasReceber,
    isLoadingContasPagar,
    error,
    errorVariant,
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

  // Visao consolidada e somente leitura e gerencial. O backend revalida o
  // perfil; nenhuma conta, saldo ou transferencia e misturada.
  useEffect(() => {
    if (!consolidated) return;
    let cancelled = false;
    (async () => {
      setConsolidatedLoading(true);
      setConsolidatedError(null);
      try {
        const response = await getPaymentDashboard(true);
        if (cancelled) return;
        if (!response.ok || !response.data) {
          throw new Error(response.error || 'Não foi possível carregar a visão consolidada.');
        }
        setConsolidatedSummary(response.data.data);
        setConsolidatedWarning(response.data.scope?.warning || null);
      } catch (error: any) {
        if (!cancelled) {
          setConsolidatedError(
            error.message || 'A visão consolidada é restrita aos perfis de gestão financeira.'
          );
          setConsolidatedSummary(null);
        }
      } finally {
        if (!cancelled) setConsolidatedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [consolidated]);

  if (consolidated) {
    const receivableCards = [
      { label: 'A receber pendente', value: consolidatedSummary?.total_pendente ?? 0, tone: 'text-amber-700' },
      { label: 'Recebíveis que vencem hoje', value: consolidatedSummary?.total_a_receber_hoje ?? 0, tone: 'text-blue-700' },
      { label: 'Recebíveis atrasados', value: consolidatedSummary?.total_atrasado ?? 0, tone: 'text-rose-700' },
      { label: 'Recebido no mês', value: consolidatedSummary?.total_recebido_mes ?? 0, tone: 'text-emerald-700' },
    ];
    const payableCards = [
      { label: 'A pagar pendente', value: consolidatedSummary?.total_a_pagar_pendente ?? 0, tone: 'text-amber-700' },
      { label: 'Pagáveis que vencem hoje', value: consolidatedSummary?.total_a_pagar_hoje ?? 0, tone: 'text-blue-700' },
      { label: 'Pagáveis atrasados', value: consolidatedSummary?.total_a_pagar_atrasado ?? 0, tone: 'text-rose-700' },
      { label: 'Pago no mês', value: consolidatedSummary?.total_pago_mes ?? 0, tone: 'text-emerald-700' },
    ];
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Building2 className="h-5 w-5 text-blue-600" />
              Visão consolidada gerencial
            </h2>
            <p className="text-sm text-slate-500">
              Soma gerencial de todos os CNPJs ativos. Não é demonstração oficial e não autoriza
              movimentar saldos entre empresas.
            </p>
          </div>
          <button
            onClick={() => setConsolidated(false)}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para visão por CNPJ
          </button>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-none" />
          <div>
            <p className="font-semibold">Leitura gerencial, sem consolidação contábil/fiscal.</p>
            <p>{consolidatedWarning || 'As contas, títulos e saldos continuam pertencendo a cada CNPJ emissor.'}</p>
          </div>
        </div>

        {consolidatedError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {consolidatedError}
          </div>
        ) : null}

        {consolidatedLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Carregando totais gerenciais...
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-emerald-700">
                Contas a receber de pedidos
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {receivableCards.map((card) => (
                  <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-sm font-medium text-slate-600">{card.label}</p>
                    <p className={`mt-1 text-2xl font-bold ${card.tone}`}>
                      {formatCurrency(card.value)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-rose-700">
                Contas a pagar
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {payableCards.map((card) => (
                  <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-sm font-medium text-slate-600">{card.label}</p>
                    <p className={`mt-1 text-2xl font-bold ${card.tone}`}>
                      {formatCurrency(card.value)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        <p className="text-xs text-slate-500">
          Para agir sobre um título, selecione o CNPJ responsável no cabeçalho e abra as abas
          Contas a receber, Contas a pagar ou Pedidos.
        </p>
      </div>
    );
  }

  // Configurar colunas com tipo correto
  const columns: ColumnsMap = {
    "contas-receber": getContasReceberColumns({
      handleMarkAsPaid,
      canMarkAsPaid: canApprovePayment,
    }),
    "contas-pagar": getContasPagarColumns(),
    "pedidos": getPedidosColumns({
      handleLoadCustomerOrders,
      pedidos,
      setPedidos,
      canCancelPayment: canApprovePayment,
      canReleaseOrder,
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
          <button
            onClick={() => setConsolidated(true)}
            className="px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium text-slate-700"
            title="Soma gerencial de todos os CNPJs, sem movimentar saldos"
          >
            <Building2 className="h-4 w-4" />
            Visao consolidada
          </button>
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
            canCreate={canCreatePayment}
          />
        </div>
      </div>

      <ActiveFilters activeFilters={activeFilters} setActiveFilters={setActiveFilters} />

      <div className="bg-white rounded-lg border border-slate-200">
        <DynamicTable
          data={getCurrentData()}
          columns={columns[activeSubTab]}
          loading={getCurrentLoading()}
          error={error}
          errorVariant={errorVariant}
          onRetry={handleLoadData}
          emptyMessage="Não há dados disponíveis."
          emptyDescription={`Nenhum registro em ${activeSubTab.replace('-', ' ')} para os filtros atuais.`}
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