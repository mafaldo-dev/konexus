import type React from "react"
import { useState, useEffect } from "react"

import { getAllProducts } from "../../service/api/products/index"
import type { Produto } from "../../service/interfaces/products"
import Dashboard from "../dashboard"


const PainelAdmin = () => {
  const [remember, setRemembers] = useState(localStorage.getItem("remember") || "")
  const [rememberTitle, setRememberTitle] = useState(localStorage.getItem("RememberTitle") || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [products, setProducts] = useState<Produto[]>([])
  const [activeTab, setActiveTab] = useState("notifications")

  const handleChangeRemembers = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRememberTitle(e.target.value)
  }

  const handleChangeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRemembers(e.target.value)
  }

  const handleSaveRemember = () => {
    localStorage.setItem("remember", remember)
    localStorage.setItem("RememberTitle", rememberTitle)
  }

  const lowProducts = async () => {
    try {
      setLoading(true)
      const response = await getAllProducts()
      setProducts(response)

    } catch (exe) {
      console.error("Erro ao recuperar produtos", exe)
      setError("Erro ao recuperar dados dos produtos")
      throw new Error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    lowProducts()
  }, [])

  const lowStockProducts = products.filter((product) => product.quantity <= 10)

  return (
    <Dashboard>
      <div className="flex flex-col flex-1">   
        <main className="flex-1 overflow-y-auto bg-gray-100">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Dashboard Content */}
              <div className="py-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-cyan-500 rounded-md p-3">
                          <svg
                            className="h-6 w-6 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">R$ {}</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-cyan-500 rounded-md p-3">
                          <svg
                            className="h-6 w-6 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">{}</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-cyan-500 rounded-md p-3">
                          <svg
                            className="h-6 w-6 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                            />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Active Products</dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">{products.length}</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-cyan-500 rounded-md p-3">
                          <svg
                            className="h-6 w-6 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Items</dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">{lowStockProducts.length}</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="mt-6">
                  <div className="sm:hidden">
                    <label htmlFor="tabs" className="sr-only">
                      Select a tab
                    </label>
                    <select
                      id="tabs"
                      name="tabs"
                      className="block w-full focus:ring-cyan-500 focus:border-cyan-500 border-gray-300 rounded-md"
                      value={activeTab}
                      onChange={(e) => setActiveTab(e.target.value)}
                    >
                      <option value="notifications">Notificações</option>
                      <option value="statistics">Statisticas</option>
                      <option value="quicklinks">Links rapidos</option>
                    </select>
                  </div>
                  <div className="hidden sm:block">
                    <div className="border-b border-gray-200">
                      <nav className="-mb-px flex" aria-label="Tabs">
                        <button
                          onClick={() => setActiveTab("notificacoes")}
                          className={`${
                            activeTab === "notificacoes"
                              ? "border-cyan-500 text-cyan-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                        >
                          Notificações
                        </button>
                        <button
                          onClick={() => setActiveTab("statisticas")}
                          className={`${
                            activeTab === "statisticas"
                              ? "border-cyan-500 text-cyan-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                        >
                          Statisticas
                        </button>
                        <button
                          onClick={() => setActiveTab("linksrapidos")}
                          className={`${
                            activeTab === "linksrapidos"
                              ? "border-cyan-500 text-cyan-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                        >
                          Links rapidos
                        </button>
                      </nav>
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="mt-6">
                    {activeTab === "notificacoes" && (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                          <li>
                            <a href="#" className="block hover:bg-gray-50">
                              <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-cyan-600 truncate">Mensagens</p>
                                  <div className="ml-2 flex-shrink-0 flex">
                                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                      New
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                  <div className="sm:flex">
                                    <p className="flex items-center text-sm text-gray-500">
                                      Você tem {} novas mensagens.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </a>
                          </li>
                          <li>
                            <a href="#" className="block hover:bg-gray-50">
                              <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-cyan-600 truncate">E-mails</p>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                  <div className="sm:flex">
                                    <p className="flex items-center text-sm text-gray-500">
                                      Check sua caixa de entrada para atualizações de E-mails
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </a>
                          </li>
                          <li>
                            <a href="#" className="block hover:bg-gray-50">
                              <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-cyan-600 truncate">Transportadoras</p>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                  <div className="sm:flex">
                                    <p className="flex items-center text-sm text-gray-500">
                                      Verifique as atualizações de envio
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </a>
                          </li>
                        </ul>
                      </div>
                    )}

                    {activeTab === "statisticas" && (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                          <li>
                            <a href="#" className="block hover:bg-gray-50">
                              <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-cyan-600 truncate">Vendas</p>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                  <div className="sm:flex">
                                    <p className="flex items-center text-sm text-gray-500">
                                      Veja as metricas de perfomace do mês
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </a>
                          </li>
                          <li>
                            <a href="#" className="block hover:bg-gray-50">
                              <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-cyan-600 truncate">Mercado</p>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                  <div className="sm:flex">
                                    <p className="flex items-center text-sm text-gray-500">
                                      O que tem de novidade no mercado
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </a>
                          </li>
                          <li>
                            <a href="#" className="block hover:bg-gray-50">
                              <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-cyan-600 truncate">Produção</p>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                  <div className="sm:flex">
                                    <p className="flex items-center text-sm text-gray-500">
                                      Metricas de produção deste mês
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </a>
                          </li>
                        </ul>
                      </div>
                    )}

                    {activeTab === "linksrapidos" && (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                          <li>
                            <a href="#" className="block hover:bg-gray-50">
                              <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-cyan-600 truncate">Estoque</p>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                  <div className="sm:flex">
                                    <p className="flex items-center text-sm text-gray-500">
                                      Gerencie inventario e as quantidades em estoques
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </a>
                          </li>
                          <li>
                            <a href="#" className="block hover:bg-gray-50">
                              <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-cyan-600 truncate">Clientes</p>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                  <div className="sm:flex">
                                    <p className="flex items-center text-sm text-gray-500">
                                      Gerencie clientes e CRM
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </a>
                          </li>
                          <li>
                            <a href="#" className="block hover:bg-gray-50">
                              <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-cyan-600 truncate">Fornecedores</p>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                  <div className="sm:flex">
                                    <p className="flex items-center text-sm text-gray-500">
                                      Relações com fornecedores e solicitações
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </a>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Company Status and Notes */}
                  <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {/* Company Status */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Status da empresa</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          Visualização rapida da empresa, departamentos e funcionarios
                        </p>
                      </div>
                      <div className="border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-4 p-4">
                          <div className="bg-gray-100 p-4 rounded-lg flex flex-col items-center justify-center">
                            <span className="text-green-500 text-4xl font-bold">1</span>
                            <p className="text-gray-500 text-lg mt-2">Funcionarios</p>
                            <button className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-2 rounded w-full">
                              Funcionarios
                            </button>
                          </div>
                          <div className="bg-gray-100 p-4 rounded-lg flex flex-col items-center justify-center">
                            <span className="text-blue-500 text-4xl font-bold">4</span>
                            <p className="text-gray-500 text-lg mt-2">Departamentos</p>
                            <button className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-2 rounded w-full">
                              Departamentos
                            </button>
                          </div>
                          <div className="bg-gray-100 p-4 rounded-lg flex flex-col items-center justify-center">
                            <span className="text-purple-500 text-4xl font-bold">4</span>
                            <p className="text-gray-500 text-lg mt-2">Designações</p>
                            <button className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-2 rounded w-full">
                              Designações
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Rascunho Rápido</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Salve rascunhos rapidos ou lembretes.</p>
                      </div>
                      <div className="border-t border-gray-200 p-4">
                        <div className="space-y-4">
                          <input
                            type="text"
                            className="shadow-sm focus:ring-cyan-500 p-2 focus:border-cyan-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="Título"
                            value={rememberTitle}
                            onChange={handleChangeRemembers}
                          />
                          <textarea
                            rows={4}
                            style={{resize: "none"}}
                            className="shadow-sm focus:ring-cyan-500 p-2 focus:border-cyan-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="O que você está pensando?"
                            value={remember}
                            onChange={handleChangeTextarea}
                          />
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cyan-500 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                            onClick={handleSaveRemember}
                          >
                            Salvar rascunho
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Low Stock Products Table */}
                  <div className="mt-6">
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Produtos com Baixo Estoque</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          tabela com produtos com quantidades abaixo de 10 unidades
                        </p>
                      </div>
                      <div className="border-t border-gray-200">
                        {loading ? (
                          <div className="px-4 py-5 sm:p-6 text-center">
                            <svg
                              className="animate-spin h-8 w-8 mx-auto text-cyan-500"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            <p className="mt-2 text-sm text-gray-500">Loading products...</p>
                          </div>
                        ) : error ? (
                          <div className="px-4 py-5 sm:p-6">
                            <div className="rounded-md bg-red-50 p-4">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <svg
                                    className="h-5 w-5 text-red-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <div className="ml-3">
                                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Codigo
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Nome
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Quant
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Descrição
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Preço
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {lowStockProducts.length > 0 ? (
                                  lowStockProducts.map((product) => (
                                    <tr key={product.id}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {product.code}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {product.name}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            product.quantity <= 5
                                              ? "bg-red-100 text-red-800"
                                              : "bg-yellow-100 text-yellow-800"
                                          }`}
                                        >
                                          {product.quantity}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                                        {product.description}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        R$ {product.price}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={6}
                                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                                    >
                                      Nenhum produto encontrado
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Dashboard>
  )
}

export default PainelAdmin

