import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import LoginPage from './login'
import SearchProdutos from './pages/manager/Products';
import SearchClientes from './pages/manager/Clients';
import SearchFornecedores from './pages/manager/Suppliers';
import PainelAdmin from './components/AdminScreen';
import InvoiceEntrie from './pages/InvoiceEntrie';
import InvoiceExit from './pages/invoiceExit';
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
                    <Route path='/sales' element={<InvoiceEntrie />} />
                    <Route path='/report' element={<InvoiceExit />} /> 
                </Routes>
            </Router>      
    );
};

export default App
