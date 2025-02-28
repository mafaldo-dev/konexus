import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './login'

import CadColaboradores from './pages/cadastro/colaborador';
import CadastroDeClients from './pages/cadastro/clientes';
import CadastrarProdutos from './pages/cadastro/produtos';

import SearchProdutos from './pages/consultas/produtos';
import SearchClientes from './pages/consultas/clientes';
import CadastroFornecedores from './pages/cadastro/fornecedor';
import SearchFornecedores from './pages/consultas/fornecedores';
import PaginaDeRegistroDeVendas from './pages/vendas';
import PainelAdmin from './components/painelAdmin';

const App = () => {  
    return (
        <>           
            <Router>
                <Routes>
                    {/* AREA DE LOGIN */}
                    <Route path="/" element={<LoginPage />} />       
                    {/* PAINEL ADMIN */}
                    <Route path='/dashboard' element={<PainelAdmin />} />
                    {/*  CADASTROS PRODUTOS/ CLIENTES  E ETC.*/}
                    <Route path='/colaboradores' element={<CadColaboradores />} />
                    <Route path='/cadastrarFornecedor' element={<CadastroFornecedores/>} />
                    <Route path='/cadastrarCliente' element={<CadastroDeClients />} />
                    <Route path='/cadastrarProdutos' element={<CadastrarProdutos />} />   
                    {/*CONSULTAS CLIENTES PRODUTOS E FORNECEDORES*/}
                    <Route path='/consultarProdutos' element={<SearchProdutos />} />
                    <Route path='/buscarClientes' element={<SearchClientes />} />
                    <Route path='/buscarFornecedor' element={<SearchFornecedores/>} />
                    <Route path='/vendas' element={<PaginaDeRegistroDeVendas />} /> 
                </Routes>
            </Router>   
        </>
    );
};
export default App;
