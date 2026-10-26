import { Navigate, Routes, Route } from 'react-router-dom';
import AdministrationScreen from '../components/AdminScreen';
import LoginPage from '../login';
import OfflineWorkspace from '../offline/OfflineWorkspace';
import Dashboard from '../components/dashboard/Dashboard';
import DomainOfflineWorkspace from '../offline/DomainOfflineWorkspace';
import RecordOfflineWorkspace from '../offline/RecordOfflineWorkspace';
import ChangePasswordPage from '../pages/ChangePassword';
import SystemAdminWorkspace from '../pages/system-admin';
import OrdersList from '../pages/sales/orders/components/orders-list';
import PurchaseOrder from '../pages/sales/orders/purchase-order';
import NewOrderPage from '../pages/sales/orders/purchase-order/create-order';
import EditOrderPage from '../pages/sales/orders/purchase-order/editOrderPage';
import CompletedSales from '../pages/sales/completed';
import Goals from '../pages/sales/goals';
import ReportsDashboard from '../pages/sales/reports';
import SearchProducts from '../pages/manager/Products';
import SearchSuppliers from '../pages/manager/Suppliers';
import CustomersContent from '../pages/manager/Customers';
import Categories from '../pages/manager/categories';
import EmployeeAdministration from '../pages/RH/employees';
import EmployeesList from '../pages/RH/employees/list';
import HRDashboard from '../pages/RH/dashboard';
import PayrollPage from '../pages/RH/folha';
import TrainingPage from '../pages/RH/treinamentos';
import PositionsAndSalaries from '../pages/RH/positions&salaries';
import Commissions from '../pages/RH/commissions';
import Inventory from '../pages/stock/inventory';
import StockAlerts from '../pages/stock/alerts';
import PurchaseRequisition from '../pages/_shopping/purchase-requisition';
import PurchaseManagementScreen from '../pages/_shopping/purchase-requisition';
import InvoiceEntries from '../pages/_shopping/entry-notes/InvoiceEntries';
import FinancialDashboard from '../pages/Financial';
import NfeList from '../pages/Financial/nfe-list';
import OSSystem from '../pages/ServiceOrder';
import CRMModule from '../pages/CRM';
import AuditLogPage from '../pages/configurations/audit';
import WorkStationsPage from '../pages/configurations/stations';
import NotificationPreferences from '../pages/configurations/notifications';
import UserManagementPage from '../pages/configurations/users&permissions';
import LegalEntitiesPage from '../pages/configurations/legal-entities';
import PlanosPage from '../pages/planos';

import NotFound from '../pages/NOT-FOUND';
import DesignationCheck from '../PermissionCheck';
import PlugNotasConfigDashboard from '../pages/configurations/system/plugnotasConfig';
import AccountingDashboardPage from '../pages/Financial/accounting/Dashboard';
import ChartOfAccountsPage from '../pages/Financial/accounting/ChartOfAccounts';
import AccountingEntriesPage from '../pages/Financial/accounting/Entries';
import JournalBookPage from '../pages/Financial/accounting/Journal';
import LedgerBookPage from '../pages/Financial/accounting/Ledger';
import TrialBalancePage from '../pages/Financial/accounting/TrialBalance';
import { BalanceSheetPage, IncomeStatementPage } from '../pages/Financial/accounting/Statements';
import ReconciliationPage from '../pages/Financial/accounting/Reconciliation';
import AccountingPeriodsPage from '../pages/Financial/accounting/Periods';
import FixedAssetsPage from '../pages/Financial/accounting/FixedAssets';
import AccountingReportsPage from '../pages/Financial/accounting/Reports';
import AccountingSettingsPage from '../pages/Financial/accounting/Settings';

const AppRoutes = () => {
  return (
    <Routes>
      {/* ==================== ÁREA DE LOGIN ==================== */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/offline" element={<Dashboard><OfflineWorkspace /></Dashboard>} />
      <Route path="/offline/domains" element={<Dashboard><DomainOfflineWorkspace /></Dashboard>} />
      <Route path="/offline/records" element={<Dashboard><RecordOfflineWorkspace /></Dashboard>} />

      {/* ==================== PAINEL ADMINISTRATIVO GLOBAL (F1) ==================== */}
      <Route path="/system-admin" element={<SystemAdminWorkspace />} />

      {/* ==================== TROCA DE SENHA ==================== */}
      <Route path="/change-password" element={<ChangePasswordPage />} />

      {/* ==================== ÁREA DE VENDAS ==================== */}
      <Route
        path="/sales/orders"
        element={
          <DesignationCheck allowed={['Administrador', 'Vendedor', 'Gerente']}>
            <PurchaseOrder />
          </DesignationCheck>
        }
      />

      <Route
        path="/sales/order-list"
        element={
          <DesignationCheck allowed={['Administrador', 'Vendedor', 'Gerente', 'Conferente']}>
            <OrdersList />
          </DesignationCheck>
        }
      />

      <Route
        path="/sales/newOrder"
        element={
          <DesignationCheck allowed={['Administrador', 'Vendedor', 'Gerente']}>
            <NewOrderPage />
          </DesignationCheck>
        }
      />

      <Route
        path="/sales/orders/edit/:id"
        element={
          <DesignationCheck allowed={['Administrador', 'Vendedor', 'Gerente']}>
            <EditOrderPage />
          </DesignationCheck>
        }
      />

      <Route
        path="/sales/completed"
        element={
          <DesignationCheck allowed={['Administrador', 'Vendedor', 'Gerente', 'Financeiro']}>
            <CompletedSales />
          </DesignationCheck>
        }
      />

      <Route
        path="/sales/goals"
        element={
          <DesignationCheck allowed={['Administrador', 'Financeiro', 'Gerente']}>
            <Goals />
          </DesignationCheck>
        }
      />

      <Route
        path="/sales/comissions"
        element={
          <DesignationCheck allowed={['Administrador', 'Financeiro']}>
            <Commissions />
          </DesignationCheck>
        }
      />

      <Route
        path="/sales/reports"
        element={
          <DesignationCheck allowed={['Administrador', 'Financeiro', 'Gerente']}>
            <ReportsDashboard />
          </DesignationCheck>
        }
      />

      {/* ==================== ÁREA DE GERENCIAMENTO ==================== */}
      <Route
        path="/manager/products"
        element={
          <DesignationCheck allowed={['Administrador', 'Vendedor', 'Conferente', 'Estoquista', 'Gestor', 'Gerente']}>
            <SearchProducts />
          </DesignationCheck>
        }
      />

      <Route
        path="/manager/customer"
        element={
          <DesignationCheck allowed={['Administrador', 'Vendedor', 'Gerente']}>
            <CustomersContent />
          </DesignationCheck>
        }
      />

      <Route
        path="/manager/suppliers"
        element={
          <DesignationCheck allowed={['Administrador', 'Compras', 'Gerente']}>
            <SearchSuppliers />
          </DesignationCheck>
        }
      />

      <Route
        path="/manager/categories"
        element={
          <DesignationCheck allowed={['Administrador', 'Gerente']}>
            <Categories />
          </DesignationCheck>
        }
      />

      <Route
        path="/manager/services"
        element={
          <DesignationCheck allowed={['Administrador', 'Vendedor', 'Gerente']}>
            <OSSystem />
          </DesignationCheck>
        }
      />

      {/* ==================== ÁREA DE COMPRAS ==================== */}
      <Route
        path="/shopping/purchase-order"
        element={
          <DesignationCheck allowed={['Administrador', 'Financeiro', 'Compras']}>
            <PurchaseManagementScreen />
          </DesignationCheck>
        }
      />

      <Route
        path="/shopping/purchase-requisition"
        element={
          <DesignationCheck allowed={['Administrador', 'Compras', 'Gerente']}>
            <PurchaseRequisition />
          </DesignationCheck>
        }
      />

      <Route
        path="/shopping/invoice-entry"
        element={
          <DesignationCheck allowed={['Administrador', 'Conferente', 'Compras', 'Financeiro']}>
            <InvoiceEntries />
          </DesignationCheck>
        }
      />

      {/* ==================== ÁREA FINANCEIRA ==================== */}
      <Route
        path="/financer/financial"
        element={
          <DesignationCheck allowed={['Administrador', 'Financeiro', 'Gerente']}>
            <FinancialDashboard />
          </DesignationCheck>
        }
      />

      <Route
        path="/financial/order-nfe"
        element={
          <DesignationCheck allowed={['Administrador', 'Financeiro', 'Gerente']}>
            <NfeList />
          </DesignationCheck>
        }
      />

      {/* ==================== ÁREA DE RH ==================== */}
      <Route
        path="/rh"
        element={
          <DesignationCheck allowed={['Administrador', 'Financeiro', 'Gestor', 'Gerente', 'Encarregado']}>
            <HRDashboard />
          </DesignationCheck>
        }
      />

      <Route
        path="/rh/employees"
        element={
          <DesignationCheck allowed={['Administrador', 'Financeiro', 'Gestor', 'Gerente', 'Encarregado']}>
            <EmployeesList />
          </DesignationCheck>
        }
      />

      <Route
        path="/rh/employees/new"
        element={
          <DesignationCheck allowed={['Administrador']}>
            <EmployeeAdministration />
          </DesignationCheck>
        }
      />

      <Route
        path="/rh/employee"
        element={<Navigate to="/rh/employees" replace />}
      />

      <Route
        path="/rh/infos"
        element={
          <DesignationCheck allowed={['Administrador', 'Financeiro', 'Gestor', 'Gerente']}>
            <PositionsAndSalaries />
          </DesignationCheck>
        }
      />

      <Route
        path="/rh/folha"
        element={
          <DesignationCheck allowed={['Administrador', 'Financeiro', 'Gestor', 'Gerente', 'Encarregado']}>
            <PayrollPage />
          </DesignationCheck>
        }
      />

      <Route
        path="/rh/treinamentos"
        element={
          <DesignationCheck allowed={['Administrador', 'Financeiro', 'Gestor', 'Gerente', 'Encarregado']}>
            <TrainingPage />
          </DesignationCheck>
        }
      />

      {/* ==================== ÁREA DE ESTOQUE ==================== */}

      <Route
        path="/stock/inventory"
        element={
          <DesignationCheck allowed={['Administrador', 'Conferente', 'Estoquista', 'Gerente']}>
            <Inventory />
          </DesignationCheck>
        }
      />

      <Route
        path="/stock/alerts"
        element={
          <DesignationCheck allowed={['Administrador', 'Conferente', 'Estoquista', 'Gestor', 'Compras', 'Gerente', 'Encarregado']}>
            <StockAlerts />
          </DesignationCheck>
        }
      />

      {/* ==================== ÁREA DE DASHBOARD ==================== */}
      <Route
        path="/dashboard"
        element={
          <DesignationCheck allowed={['Administrador', 'Financeiro', 'Conferente', 'Estoquista', 'Vendedor', 'Encarregado', 'Compras', 'Gestor', 'Gerente']}>
            <AdministrationScreen />
          </DesignationCheck>
        }
      />

      {/* ==================== ÁREA DE CRM ==================== */}
      <Route path="/crm"
        element={
          <DesignationCheck allowed={['Administrador']}>
            <CRMModule />
          </DesignationCheck>
        }>

      </Route>

      {/* ==================== ÁREA DE CONFIGURAÇÕES ==================== */}
      <Route
        path="/config/users-permissions"
        element={
          <DesignationCheck allowed={['Administrador']}>
            <UserManagementPage />
          </DesignationCheck>
        }
      />

      {/* ==================== CONTABILIDADE (extra do Financeiro) ==================== */}
      <Route path="/financer/contabilidade/conexao-fiscal" element={
        <DesignationCheck allowed={['Administrador', 'Contador', 'Financeiro']}>
          <PlugNotasConfigDashboard />
        </DesignationCheck>
      } />
      <Route
        path="/financer/contabilidade/painel"
        element={
          <DesignationCheck allowed={['Administrador', 'Gestor', 'Gerente', 'Financeiro']}>
            <AccountingDashboardPage />
          </DesignationCheck>
        }
      />
      <Route
        path="/financer/contabilidade/plano-de-contas"
        element={
          <DesignationCheck allowed={['Administrador', 'Gestor', 'Gerente', 'Financeiro']}>
            <ChartOfAccountsPage />
          </DesignationCheck>
        }
      />
      <Route
        path="/financer/contabilidade/lancamentos"
        element={
          <DesignationCheck allowed={['Administrador', 'Gestor', 'Gerente', 'Financeiro']}>
            <AccountingEntriesPage />
          </DesignationCheck>
        }
      />
      <Route
        path="/financer/contabilidade/livro-diario"
        element={
          <DesignationCheck allowed={['Administrador', 'Gestor', 'Gerente', 'Financeiro']}>
            <JournalBookPage />
          </DesignationCheck>
        }
      />
      <Route
        path="/financer/contabilidade/livro-razao"
        element={
          <DesignationCheck allowed={['Administrador', 'Gestor', 'Gerente', 'Financeiro']}>
            <LedgerBookPage />
          </DesignationCheck>
        }
      />
      <Route
        path="/financer/contabilidade/balancete"
        element={
          <DesignationCheck allowed={['Administrador', 'Gestor', 'Gerente', 'Financeiro']}>
            <TrialBalancePage />
          </DesignationCheck>
        }
      />
      <Route
        path="/financer/contabilidade/balanco-patrimonial"
        element={
          <DesignationCheck allowed={['Administrador', 'Gestor', 'Gerente', 'Financeiro']}>
            <BalanceSheetPage />
          </DesignationCheck>
        }
      />
      <Route
        path="/financer/contabilidade/demonstracao-resultado"
        element={
          <DesignationCheck allowed={['Administrador', 'Gestor', 'Gerente', 'Financeiro']}>
            <IncomeStatementPage />
          </DesignationCheck>
        }
      />
      <Route
        path="/financer/contabilidade/conciliacao"
        element={
          <DesignationCheck allowed={['Administrador', 'Gestor', 'Gerente', 'Financeiro']}>
            <ReconciliationPage />
          </DesignationCheck>
        }
      />
      <Route
        path="/financer/contabilidade/exercicios"
        element={
          <DesignationCheck allowed={['Administrador', 'Gestor', 'Gerente', 'Financeiro']}>
            <AccountingPeriodsPage />
          </DesignationCheck>
        }
      />
      <Route
        path="/financer/contabilidade/ativos"
        element={
          <DesignationCheck allowed={['Administrador', 'Gestor', 'Gerente', 'Financeiro']}>
            <FixedAssetsPage />
          </DesignationCheck>
        }
      />
      <Route
        path="/financer/contabilidade/relatorios"
        element={
          <DesignationCheck allowed={['Administrador', 'Gestor', 'Gerente', 'Financeiro']}>
            <AccountingReportsPage />
          </DesignationCheck>
        }
      />
      <Route
        path="/financer/contabilidade/configuracoes"
        element={
          <DesignationCheck allowed={['Administrador', 'Gestor', 'Gerente', 'Financeiro']}>
            <AccountingSettingsPage />
          </DesignationCheck>
        }
      />

      {/* Rotas antigas: preservadas como redirecionamento para os cadastros
          atuais, sem manter telas duplicadas ou configurações sem backend. */}
      <Route path="/config/security-area" element={<Navigate to="/config/legal-entities" replace />} />
      <Route path="/config/companies" element={<Navigate to="/config/legal-entities" replace />} />

      <Route
        path="/config/audit-log"
        element={
          <DesignationCheck allowed={['Administrador']}>
            <AuditLogPage />
          </DesignationCheck>
        }
      />

      <Route
        path="/config/stations"
        element={
          <DesignationCheck allowed={['Administrador']}>
            <WorkStationsPage />
          </DesignationCheck>
        }
      />

      <Route
        path="/config/notifications"
        element={
          <DesignationCheck allowed={['Administrador']}>
            <NotificationPreferences />
          </DesignationCheck>
        }
      />

      <Route
        path="/config/system"
        element={
          <DesignationCheck allowed={['Administrador']}>
            <PlugNotasConfigDashboard />
          </DesignationCheck>
        }
      />

      <Route
        path="/config/legal-entities"
        element={
          <DesignationCheck allowed={['Administrador']}>
            <LegalEntitiesPage />
          </DesignationCheck>
        }
      />

      <Route
        path="/planos"
        element={
          <DesignationCheck allowed={['Administrador', 'Financeiro', 'Conferente', 'Estoquista', 'Vendedor', 'Encarregado', 'Compras', 'Gestor', 'Gerente']}>
            <PlanosPage />
          </DesignationCheck>
        }
      />

      {/* ==================== PÁGINA NÃO ENCONTRADA ==================== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
