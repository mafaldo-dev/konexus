import { useState } from 'react';

import logo from '../../assets/image/logo1.png'
import { useDataHora } from "../../utils/data-hora"

export default function Dashboard({ children }: any) {
    const username = localStorage.getItem("userlogged");
    const getNowHour = useDataHora();
    const [toggleGestao, setToggleGestao] = useState(false);
    const [toggleFinanceiro, setToggleFinanceiro] = useState(false);
    const [toggleEstoque, setToggleEstoque] = useState(false);
    const [toggleVendas, setToggleVendas] = useState(false);
    const [toggleCompras, setToggleCompras] = useState(false);
    const [toggleRH, setToggleRH] = useState(false);
    const [toggleConfig, setToggleConfig] = useState(false);

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-black text-white p-6 fixed h-full">
                <img src={logo} alt="Logo keppler" className="mb-6" />
                <h1 className="text-xl font-bold mb-6">Painel Admin</h1>
                <nav className="flex flex-col gap-4">

                    {/* DASHBOARD */}
                    <a href="/dashboard" className="p-2 hover:bg-gray-700 rounded">Dashboard</a>

                    {/* GESTÃO */}
                    <div className='flex flex-col mb-2' onClick={() => setToggleGestao(!toggleGestao)}>
                        {toggleGestao ? (
                            <>
                                <p className='cursor-pointer hover:bg-gray-700 p-2 rounded -mt-6'>Gestão</p>
                                <a href="/products" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Produtos</a>
                                <a href="/customer" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Clientes</a>
                                <a href="/suppliers" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Fornecedores</a>
                            </>
                        ) : <p className='ml-2 cursor-pointer -mt-3'>Gestão</p>}
                    </div>

                    {/* FINANCEIRO */}
                    <div className='flex flex-col mb-2' onClick={() => setToggleFinanceiro(!toggleFinanceiro)}>
                        {toggleFinanceiro ? (
                            <>
                                <p className='cursor-pointer hover:bg-gray-700 p-2 rounded -mt-6'>Financeiro</p>
                                <a href="/financeiro/pagar" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Contas a pagar</a>
                                <a href="/financeiro/receber" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Contas a receber</a>
                                <a href="/financeiro/fluxo" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Fluxo de caixa</a>
                                <a href="/financeiro/bancos" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Bancos e contas</a>
                                <a href="/financeiro/faturas" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Faturas</a>
                            </>
                        ) : <p className='ml-2 cursor-pointer -mt-3'>Financeiro</p>}
                    </div>

                    {/* ESTOQUE */}
                    <div className='flex flex-col mb-2' onClick={() => setToggleEstoque(!toggleEstoque)}>
                        {toggleEstoque ? (
                            <>
                                <p className='cursor-pointer hover:bg-gray-700 p-2 rounded -mt-6'>Estoque</p>
                                <a href="/estoque/inventario" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Inventário</a>
                                <a href="/estoque/movimentacoes" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Movimentações</a>
                                <a href="/estoque/ajustes" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Ajustes</a>
                                <a href="/estoque/alertas" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Alertas de estoque</a>
                            </>
                        ) : <p className='ml-2 cursor-pointer -mt-3'>Estoque</p>}
                    </div>

                    {/* VENDAS */}
                    <div className='flex flex-col mb-2' onClick={() => setToggleVendas(!toggleVendas)}>
                        {toggleVendas ? (
                            <>
                                <p className='cursor-pointer hover:bg-gray-700 p-2 rounded -mt-6'>Vendas</p>
                                <a href="/vendas/pedidos" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Pedidos</a>
                                <a href="/vendas/orcamentos" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Orçamentos</a>
                                <a href="/vendas/comissoes" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Comissões</a>
                                <a href="/report" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Relatórios</a>
                            </>
                        ) : <p className='ml-2 cursor-pointer -mt-3'>Vendas</p>}
                    </div>

                    {/* COMPRAS */}
                    <div className='flex flex-col mb-2' onClick={() => setToggleCompras(!toggleCompras)}>
                        {toggleCompras ? (
                            <>
                                <p className='cursor-pointer hover:bg-gray-700 p-2 rounded -mt-6'>Compras</p>
                                <a href="/compras/pedidos" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Pedidos de compra</a>
                                <a href="/compras/cotacoes" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Cotações</a>
                                 <a href="/invoice" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Notas de Entrada</a>
                            </>
                        ) : <p className='ml-2 cursor-pointer -mt-3'>Compras</p>}
                    </div>

                    {/* RH */}
                    <div className='flex flex-col mb-2' onClick={() => setToggleRH(!toggleRH)}>
                        {toggleRH ? (
                            <>
                                <p className='cursor-pointer hover:bg-gray-700 p-2 rounded -mt-6'>RH</p>
                                <a href="/rh/funcionarios" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Funcionários</a>
                                <a href="/rh/cargos" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Cargos e salários</a>
                                <a href="/rh/folha" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Folha de pagamento</a>
                                <a href="/rh/ponto" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Ponto eletrônico</a>
                            </>
                        ) : <p className='ml-2 cursor-pointer -mt-3'>RH</p>}
                    </div>

                    {/* CONFIGURAÇÕES */}
                    <div className='flex flex-col' onClick={() => setToggleConfig(!toggleConfig)}>
                        {toggleConfig ? (
                            <>
                                <p className='cursor-pointer hover:bg-gray-700 p-2 rounded -mt-6'>Configurações</p>
                                <a href="/config/usuarios" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Usuários e permissões</a>
                                <a href="/config/sistema" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Parâmetros do sistema</a>
                                <a href="/config/email" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Notificações</a>
                                <a href="/config/seguranca" className="p-2 hover:bg-gray-700 rounded ml-4">{">"} Segurança</a>
                            </>
                        ) : <p className='ml-2 cursor-pointer -mt-3'>Configurações</p>}
                    </div>

                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 ml-64 p-6 overflow-auto">
                {/* Header */}
                <header className="flex justify-between items-center bg-white p-4 shadow rounded-lg mb-6">
                    <h2 className="text-xl font-bold">Bem-vindo(a), de volta {username}!</h2>
                    <div className='flex items-center'>
                        <nav>
                            <ul className='flex gap-4 items-center'>
                                <li className='font-semibold'>Central</li>
                                <li className='font-bold'>{username}</li>
                                <li className='text-blue-400'>{getNowHour}</li>
                                <a href='/' className='bg-cyan-500 text-center text-white p-1 font-bold rounded-lg w-22 font-sans'>Logout</a>
                            </ul>
                        </nav>
                    </div>
                </header>
                {/* Main Body */}
                <section className="main-body">
                    {children}
                </section>
            </div>
        </div>
    );
}
