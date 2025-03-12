import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import LoginPage from './login'
import SearchProdutos from './pages/manager/produtos';
import SearchClientes from './pages/manager/clientes';
import SearchFornecedores from './pages/manager/fornecedores';
import PaginaDeRegistroDeVendas from './pages/vendas';
import PainelAdmin from './components/painelAdmin';


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
                    <Route path='/sales' element={<PaginaDeRegistroDeVendas />} /> 
                </Routes>
            </Router>      
    );
};
export default App;
