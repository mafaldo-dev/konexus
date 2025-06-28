import { Routes, Route } from 'react-router-dom';
import AdministrationScreen from '../components/AdminScreen';
import LoginPage from '../login';
import OrdersList from '../pages/sales/orders/components/orders-list';
import InvoiceEntries from '../pages/_shopping/entry-notes';
import PurchaseOrder from '../pages/sales/orders/purchase-order';
import NewOrderPage from '../pages/sales/orders/purchase-order/create-order';
import SearchClientes from '../pages/manager/Clients';
import SearchProducts from '../pages/manager/Products';
import SearchSuppliers from '../pages/manager/Suppliers';
import EmployeeAdministration from '../pages/RH/employees';
import PositionsAndSalaries from '../pages/RH/positions&salaries';
import InvoiceDANFE from '../pages/sales/orders/components/OrderForm';
import DesignationCheck from '../PermissionCheck';
import MovementsOnStock from '../pages/stock/movements';
import Categories from '../pages/manager/categories';
import Brands from '../pages/manager/brands';
import Units from '../pages/manager/units';

// seus imports...

const AppRoutes = () => {
  return (
    <Routes>
      {/* AREA DE LOGIN */}
      <Route path="/" element={<LoginPage />} />
      {/* PAINEL ADMIN */}
      <Route path="/dashboard" element={<AdministrationScreen />} />

      {/* ROTA ÚNICA PARA PEDIDOS - gerencia internamente list/create */}
      <Route path="/sales/orders" element={<PurchaseOrder />} />
      <Route path="/sales/order-list" element={<OrdersList />} />
      <Route path="/sales/newOrder" element={<NewOrderPage />} />

      {/* Private Routes */}
      <Route 
        path="/manager/products" 
        element={
          <DesignationCheck allowed={["Vendedor", "Administrador", "Conferente"]}>
            <SearchProducts />
          </DesignationCheck>
        }
      />
      <Route 
        path="/manager/customers" 
        element={
          <DesignationCheck allowed={["Administrador", "Vendedor"]}>
            <SearchClientes />
          </DesignationCheck>
        }
      />
      <Route 
        path="/manager/suppliers" 
        element={
          <DesignationCheck allowed={["Administrador", "Comprador"]}>
            <SearchSuppliers />
          </DesignationCheck>
        }
      />
      <Route 
        path="/invoice" 
        element={
          <DesignationCheck allowed={["Administrador", "Conferente", "Vendedor"]}>
            <InvoiceEntries />
          </DesignationCheck>                   
        }
      />
      <Route 
        path="/report" 
        element={
          <DesignationCheck allowed={["Administrador", "Financeiro"]}>          
            <InvoiceDANFE />
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
          </DesignationCheck>       
        }
      />
      <Route 
        path="/stock/movements" 
        element={
          <DesignationCheck allowed={["Administrador", "Conferente"]}>          
            <MovementsOnStock />
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
      <Route 
        path="/manager/brands" 
        element={
          <DesignationCheck allowed={["Administrador"]}>          
            <Brands />
          </DesignationCheck>   
        }
      />
      <Route 
        path="/manager/units" 
        element={
          <DesignationCheck allowed={["Administrador"]}>          
            <Units />
          </DesignationCheck>   
        }
      />
    </Routes>
  );
};

export default AppRoutes;
