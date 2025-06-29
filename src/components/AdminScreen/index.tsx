import React, { useEffect, useState, useMemo } from "react"

import type { Products } from "../../service/interfaces/products"
import { Customer } from "../../service/interfaces/customer"
import { Employee } from "../../service/interfaces/employees"
import { getAllProducts } from "../../service/api/products"
import { handleAllCustomer } from "../../service/api/clients/clients"
import { handleAllEmployee, handleDesignations } from "../../service/api/employee"

import Dashboard from "../dashboard"

import TableProducts from "./components/table-products"
import TabsContent from "./components/tabs-component"

const AdministrationScreen = () => {
  const [remember, setRemembers] = useState(localStorage.getItem("remember") || "")
  const [rememberTitle, setRememberTitle] = useState(localStorage.getItem("RememberTitle") || "")

  const [products, setProducts] = useState<Products[]>([])
  const [customer, setCustomer] = useState<Customer[]>([])
  const [employee, setEmployee] = useState<Employee[]>([])
  const [role, setRole] = useState<Employee[] | any>([])

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

  const LOW_STOCK_THRESHOLD = 10;

  const low = useMemo(() => {
    return products.filter((product) => product.quantity <= LOW_STOCK_THRESHOLD);
  }, [products]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resProducts, resCustomer, resEmployee, employees] = await Promise.all([
          getAllProducts(),
          handleAllCustomer(),
          handleAllEmployee(),
          handleDesignations()
        ]);

        setProducts(resProducts);
        setCustomer(resCustomer);
        setEmployee(resEmployee);

        // Agrupa por `designation`
        const groupedByDesignation = employees.reduce((acc, emp) => {
          const key = emp.designation || "Sem função";
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(emp);
          return acc;
        }, {} as Record<string, Employee[]>);

        const apenasArrays = Object.values(groupedByDesignation);
        setRole(apenasArrays);

      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Dashboard>
      <div className="flex flex-col flex-1">
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-700">Dashboard</h1>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="py-4 space-y-6">
                {/* Cards do topo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Revenue */}
                  <div className="bg-green-100 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-200 rounded-md p-3">
                          <svg className="h-6 w-6 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-green-600 truncate">Total Revenue</dt>
                            <dd><div className="text-lg font-semibold text-green-800">R$</div></dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Total Customers */}
                  <div className="bg-blue-100 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-blue-200 rounded-md p-3">
                          <svg className="h-6 w-6 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-blue-600 truncate">Total Customers</dt>
                            <dd><div className="text-lg font-semibold text-blue-800">{customer.length}</div></dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Active Products */}
                  <div className="bg-yellow-100 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-yellow-200 rounded-md p-3">
                          <svg className="h-6 w-6 text-yellow-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-yellow-600 truncate">Active Products</dt>
                            <dd><div className="text-lg font-semibold text-yellow-800">{products.length}</div></dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Low Stock Items */}
                  <div className="bg-red-100 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-red-200 rounded-md p-3">
                          <svg className="h-6 w-6 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-red-600 truncate">Low Stock Items</dt>
                            <dd><div className="text-lg font-semibold text-red-800">{low.length}</div></dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Tabs + Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-700">Status da empresa</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Visualização rápida da empresa, departamentos e funcionários</p>
                    </div>
                    <div className="border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 p-4">
                        <div className="bg-green-50 p-4 rounded-lg flex flex-col items-center justify-center">
                          <span className="text-green-700 text-4xl font-bold">{employee.length}</span>
                          <p className="text-green-600 text-lg mt-2">Funcionários</p>
                          <button className="mt-4 bg-green-200 hover:bg-green-300 text-green-700 font-semibold py-2 px-2 rounded w-full transition">
                            Funcionários
                          </button>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-lg flex flex-col items-center justify-center">
                          <span className="text-indigo-700 text-4xl font-bold">{role.length}</span>
                          <p className="text-indigo-600 text-lg mt-2">Departamentos</p>
                          <button className="mt-4 bg-indigo-200 hover:bg-indigo-300 text-indigo-700 font-semibold py-2 px-2 rounded w-full transition">
                            Departamentos
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <TabsContent />
                </div>
                {/* Rascunho */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-700">Rascunho Rápido</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Salve rascunhos rápidos ou lembretes.</p>
                  </div>
                  <div className="border-t border-gray-200 p-4">
                    <div className="space-y-4">
                      <input
                        type="text"
                        className="shadow-sm focus:ring-green-300 focus:border-green-300 p-2 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Título"
                        value={rememberTitle}
                        onChange={handleChangeRemembers}
                      />
                      <textarea
                        rows={4}
                        style={{ resize: "none" }}
                        className="shadow-sm focus:ring-green-300 focus:border-green-300 p-2 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="O que você está pensando?"
                        value={remember}
                        onChange={handleChangeTextarea}
                      />
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-700 cursor-pointer hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300 transition"
                        onClick={handleSaveRemember}
                      >
                        Salvar rascunho
                      </button>
                    </div>
                  </div>
                </div>
                {/* Tabela de produtos com baixo estoque */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-700">Produtos com Baixo Estoque</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Tabela com produtos com quantidades abaixo de 10 unidades</p>
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
