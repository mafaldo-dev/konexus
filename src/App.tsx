import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import LoginPage from './login'
import SearchProdutos from './pages/manager/Products';
import SearchClientes from './pages/manager/Clients';
import SearchFornecedores from './pages/manager/Suppliers';
import PainelAdmin from './components/AdminScreen';
import InvoiceEntries from './pages/_shopping/entry-notes';
import InvoiceDANFE from './pages/sales/orders';
import EmployeeAdministration from './pages/RH/employees';
import PositionsAndSalaries from './pages/RH/positions&salaries';
const App = () => {  
    return (         
            <Router>
                <Routes>
                    {/* AREA DE LOGIN */}
                    <Route path="/" element={<LoginPage />} />       
                    {/* PAINEL ADMIN */}
                    <Route path='/dashboard' element={<PainelAdmin />} />
                     
                    {/*CONSULTAS CLIENTES PRODUTOS E FORNECEDORES*/}
                    <Route path='/products' element={<SearchProdutos />} />
                    <Route path='/customer' element={<SearchClientes />} />
                    <Route path='/suppliers' element={<SearchFornecedores/>} />
                    <Route path='/invoice' element={<InvoiceEntries />} />
                    <Route path='/report' element={<InvoiceDANFE />} /> 
                    <Route path='/rh/employee' element={<EmployeeAdministration />} />
                    <Route path='/rh/infos' element={<PositionsAndSalaries />} />
                </Routes>
            </Router>      
    );
};

export default App
