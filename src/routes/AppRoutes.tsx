import { Routes, Route } from 'react-router-dom';
import AdministrationScreen from '../components/AdminScreen';
import LoginPage from '../login';
import OrdersList from '../pages/sales/orders/components/orders-list';

import PurchaseOrder from '../pages/sales/orders/purchase-order';
import NewOrderPage from '../pages/sales/orders/purchase-order/create-order';
import SearchProducts from '../pages/manager/Products';
import SearchSuppliers from '../pages/manager/Suppliers';
import EmployeeAdministration from '../pages/RH/employees';
import PositionsAndSalaries from '../pages/RH/positions&salaries';
import DesignationCheck from '../PermissionCheck';
import MovementsOnStock from '../pages/stock/movements';
import Inventory from '../pages/stock/inventory';
//import Categories from '../pages/manager/Categories';

import CompletedSales from '../pages/sales/completed';
import Commissions from '../pages/RH/commissions';
import Layout from '../pages/CRM/Layout';
import Dashboard from '../pages/CRM/Pages/Dashboard';

import Opportunities from '../pages/CRM/Pages/Opportunities';
import Campains from '../pages/CRM/Pages/Campanhas';
import NotFound from '../pages/NOT-FOUND';
import LeadsPage from '../pages/CRM/leads/LeadsPage';
import Goals from '../pages/sales/goals';
import PurchaseRequisition from '../pages/_shopping/purchase-requisition';
import PurchaseManagementScreen from '../pages/_shopping/purchase-requisition';
import InvoiceEntries from '../pages/_shopping/entry-notes/InvoiceEntries';
import SecuritySettingsPage from '../pages/configurations/security';
import NotificationPreferences from '../pages/configurations/notifications';
import UserManagementPage from '../pages/configurations/users&permissions';
import SystemStatusPage from '../pages/configurations/parametersOfSystem';
import ReportsDashboard from '../pages/sales/reports';
import CustomersContent from '../pages/manager/Customers';
import FinancialDashboard from '../pages/Financial';
import Categories from '../pages/manager/categories';
import EditOrderPage from '../pages/sales/orders/purchase-order/editOrderPage';
import OSSystem from '../pages/ServiceOrder';



const AppRoutes = () => {
  return (
    <Routes>
      {/* AREA DE LOGIN */}
      <Route path="/" element={<LoginPage />} />


      {/* PAINEL ADMIN */}

      {/* ROTA ÚNICA PARA PEDIDOS - gerencia internamente list/create */}
      <Route path="/sales/orders" element={<PurchaseOrder />} />
      <Route path="/sales/order-list" element={<OrdersList />} />
      <Route path="/sales/newOrder" element={<NewOrderPage />} />
      <Route path="/sales/completed" element={<CompletedSales />} />
      <Route path='/manager/services' element={<OSSystem />} />


      {/* Private Routes */}

      <Route
        path='/shopping/purchase-order'
        element={
          <DesignationCheck allowed={['Administrador', 'Financeiro', 'Buyer']}>
            <PurchaseManagementScreen />
          </DesignationCheck>
        }
      />

      <Route
        path="/dashboard"
        element={
          <DesignationCheck allowed={['Administrador', 'Financeiro']}>
            <AdministrationScreen />
          </DesignationCheck>
        } />

      <Route
        path="/sales/orders/edit/:id"
        element={
          <DesignationCheck allowed={['Administrador', 'Vendedor', 'Gerente']}>
            <EditOrderPage />
          </DesignationCheck>
        }
      />

      <Route
        path='/sales/goals'
        element={
          <DesignationCheck allowed={['Administrador', 'Financeiro']}>
            <Goals />
          </DesignationCheck>
        }
      />
      <Route
        path='/sales/comissions'
        element={
          <DesignationCheck allowed={["Administrador", "Financeiro"]}>
            <Commissions />
          </DesignationCheck>
        }

      />
      <Route
        path="/manager/products"
        element={
          <DesignationCheck allowed={["Vendedor", "Administrador", "Conferente", "Estoquista", "Gestor", "Gerente"]}>
            <SearchProducts />
          </DesignationCheck>
        }
      />
      <Route
        path="/manager/customer"
        element={
          <DesignationCheck allowed={["Administrador", "Vendedor"]}>
            <CustomersContent />
          </DesignationCheck>
        }
      />
      <Route
        path="/manager/suppliers"
        element={
          <DesignationCheck allowed={["Administrador", "Comprador"]}>
            <SearchSuppliers />
            /</DesignationCheck>
        }
      />
      <Route
        path="/shopping/purchase-requisition"
        element={
          <DesignationCheck allowed={["Administrador", "Comprador"]}>
            <PurchaseRequisition />
          </DesignationCheck>
        }
      />
      <Route
        path="/shopping/invoice-entry"
        element={
          <DesignationCheck allowed={["Administrador", "Conferente", "Buyer", "Financeiro"]}>
            <InvoiceEntries />
          </DesignationCheck>
        }
      />
      <Route
        path="/sales/reports"
        element={
          // <DesignationCheck allowed={["Administrador", "Financeiro", "Gerente"]}>
          <ReportsDashboard />
          // </DesignationCheck>
        }
      />
      <Route
        path='/financer/financial'
        element={
          <DesignationCheck allowed={['Administrador', 'Financeiro', 'Gerente']}>
            <FinancialDashboard />
          </DesignationCheck>
        }
      />
      <Route
        path="/rh/employee"
        element={
          <DesignationCheck allowed={["Administrador", "Financeiro"]}>
            <EmployeeAdministration />
          </DesignationCheck>
        }
      />
      <Route
        path="/rh/infos"
        element={
          <DesignationCheck allowed={["Administrador", "Financeiro"]}>
            <PositionsAndSalaries />
            /</DesignationCheck>
        }
      />
      <Route
        path="/stock/movements"
        element={
          <DesignationCheck allowed={["Administrador", "Conferente", "Estoquista"]}>
            <MovementsOnStock />
            /</DesignationCheck>
        }
      />
      <Route
        path="/stock/inventory"
        element={
          <DesignationCheck allowed={["Administrador", "Conferente", "Estoquista"]}>
            <Inventory />
          </DesignationCheck>
        }
      />

      <Route
        path="/manager/categories"
        element={
          <DesignationCheck allowed={["Administrador"]}>
            <Categories />
          </DesignationCheck>
        }
      />

      <Route path='not-found' element={<NotFound />} />
      {/* AREA DE CONFIGURAÇÕES */}
      <Route path="/config">
        <Route
          path="/config/users-permissions"
          element={
            <DesignationCheck allowed={["Administrador"]}>
              <UserManagementPage />
            </DesignationCheck>
          }
        />
        <Route
          path="/config/security-area"
          element={
            <DesignationCheck allowed={['Administrador']}>
              <SecuritySettingsPage />
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
              <SystemStatusPage />
            </DesignationCheck>
          }
        />
      </Route>
      {/*AREA OF CRM*/}
      <Route path="/crm" element={<Layout />}>
        <Route
          path="/crm/dashboard"
          element={
            <DesignationCheck allowed={["Administrador"]}>
              <Dashboard />
            </DesignationCheck>
          } />
        <Route
          path="/crm/campains"
          element={
            <DesignationCheck allowed={["Administrador"]}>
              <Campains />
            </DesignationCheck>
          } />
        <Route
          path='/crm/leads'
          element={
            <DesignationCheck allowed={["Administrador"]}>
              <LeadsPage />
            </DesignationCheck>
          } />
        <Route
          path="/crm/opportunities"
          element={
            <DesignationCheck allowed={["Administrador"]}>
              <Opportunities />
            </DesignationCheck>
          } />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
