import type React from "react"
import { useEffect, useState } from "react"

import type { Products } from "../../service/interfaces/products"
import { Customer } from "../../service/interfaces/customer"
import { Employee } from "../../service/interfaces/employees"
import { getAllProducts } from "../../service/api/products"
import { handleAllCustomer } from "../../service/api/clients/clients"
import { handleAllEmployee } from "../../service/api/employee"

import Dashboard from "../dashboard"

import TableProducts from "./components/table-products"
import TabsContent from "./components/tabs-component"

const AdministrationScreen = () => {
  const [remember, setRemembers] = useState(localStorage.getItem("remember") || "")
  const [rememberTitle, setRememberTitle] = useState(localStorage.getItem("RememberTitle") || "")
  
  const [lowProd, setLowProd] = useState<Products[]>([])
  const [products, setProducts] = useState<Products[]>([])
  const [customer, setCustomer] = useState<Customer[]>([])
  const [employee, setEmployee] = useState<Employee[]>([])

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

  const productsResponse = async () => {
    const resProducts = await getAllProducts()
    setProducts(resProducts)

  }
  const customerResponse = async () => {
    const resCustomer = await  handleAllCustomer()
    setCustomer(resCustomer)
  }

  const lowProducts = async () =>{
    const resLowProd = await getAllProducts()
    setLowProd(resLowProd)
  }

  const low = lowProd.filter((product) => product.quantity <= 10)

  const employeeResponse = async () => {
    const resEmployee = await handleAllEmployee()
    setEmployee(resEmployee)
  }

  useEffect(() => {
    productsResponse()
    employeeResponse()
    customerResponse()
    lowProducts()
  }, [])

  return (
    <Dashboard>
      <div className="flex flex-col flex-1">
        <main className="flex-1 overflow-y-auto bg-gray-100">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="py-4 space-y-6">
                {/* Cards do topo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Revenue */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-cyan-500 rounded-md p-3">
                          <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                            <dd><div className="text-lg font-medium text-gray-900">R$</div></dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Total Customers */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-cyan-500 rounded-md p-3">
                          <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                            <dd><div className="text-lg font-medium text-gray-900">{customer.length}</div></dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Active Products */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-cyan-500 rounded-md p-3">
                          <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Active Products</dt>
                            <dd><div className="text-lg font-medium text-gray-900">{products.length}</div></dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Low Stock Items */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-cyan-500 rounded-md p-3">
                          <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Items</dt>
                            <dd><div className="text-lg font-medium text-gray-900"></div>{low.length}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Tabs + Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Status da empresa</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Visualização rapida da empresa, departamentos e funcionarios</p>
                    </div>
                    <div className="border-t border-gray-200">
                      <div className="grid grid-cols-3 gap-4 p-4">
                        <div className="bg-gray-100 p-4 rounded-lg flex flex-col items-center justify-center">
                          <span className="text-green-500 text-4xl font-bold">{employee.length}</span>
                          <p className="text-gray-500 text-lg mt-2">Funcionarios</p>
                          <button className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-2 rounded w-full">Funcionarios</button>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg flex flex-col items-center justify-center">
                          <span className="text-blue-500 text-4xl font-bold">4</span>
                          <p className="text-gray-500 text-lg mt-2">Departamentos</p>
                          <button className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-2 rounded w-full">Departamentos</button>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg flex flex-col items-center justify-center">
                          <span className="text-purple-500 text-4xl font-bold">4</span>
                          <p className="text-gray-500 text-lg mt-2">Designações</p>
                          <button className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-2 rounded w-full">Designações</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <TabsContent />
                </div>
                {/* Rascunho */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Rascunho Rápido</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Salve rascunhos rápidos ou lembretes.</p>
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
                        style={{ resize: "none" }}
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
                {/* Tabela de produtos com baixo estoque */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Produtos com Baixo Estoque</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">tabela com produtos com quantidades abaixo de 10 unidades</p>
                  </div>
                  <TableProducts />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Dashboard>
  )
}
export default AdministrationScreen
