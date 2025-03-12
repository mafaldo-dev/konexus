import { ReactEventHandler, useEffect, useState } from "react"
import { useForm, SubmitHandler } from 'react-hook-form'

import { allClients, registerClient } from "../../../service/api/clients/clients"
import type { Cliente } from "../../../service/interfaces/client"

import Dashboard from "../../../components/dashboard"
import EditModal from '../clientes/modal-edit'


const SearchClientes = () => {
  const { register, handleSubmit, formState: {errors}, reset } = useForm<Cliente>()
  const [filteredResults, setFilteredResults] = useState<Cliente[]>([])
  const [filtered, setFiltered] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [client, setClient] = useState<Cliente[]| any>([])
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  const [editClient, setEditClient] = useState(false)


  // Função para buscar clientes
  const renderClients = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await allClients(client)
      setClient(response)
      setFilteredResults(response)
    } catch (exe) {
      console.error("Erro ao recuperar dados dos clientes:", exe)
      setError("Erro ao buscar dados")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    renderClients()
  }, [])

  useEffect(() => {
    if (filtered) {
      const filter = client.filter((cliente: Cliente) => cliente.name.toLowerCase().includes(filtered.toLowerCase()))
      setFilteredResults(filter)
    } else {
      setFilteredResults(client)
    }
  }, [filtered, client])

  const onSubmit: SubmitHandler<Cliente> = async (data) => {

    try {
      setIsLoading(true)
      await registerClient(data)

      reset({
        name: "",
        email: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        zip_code: "",
      })
      setIsModalOpen(false)
      renderClients()

    } catch (exe) {
      console.error("Erro ao adicionar novo cliente", exe)
      setError("Erro ao cadastrar cliente")
    } finally {
      setIsLoading(false)
    }
  }

  const onClose = () => {
    setIsModalOpen(false)
  }

  return (
    <Dashboard>
      {editClient ? 
      ( 
        <div className="flex flex-col items-center gap-2">
          <EditModal />
          <button className="p-2 bg-cyan-500 text-white font-semibold text-lg w-22 rounded">Cancelar</button>

        </div>
         
      ): (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Consultar Clientes</h1>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                /> 
              </svg>
              <input
                type="text"
                placeholder="Digite o nome do cliente"
                value={filtered}
                onChange={(e) => setFiltered(e.target.value)}
                className="pl-8 w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={renderClients}
              className="px-4 py-2 bg-cyan-500 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shrink-0"
            >
              Buscar
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 p-4 rounded-md text-red-800">{error}</div>
        ) : (
          <div className="rounded-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="h-10 px-4 text-left font-medium text-gray-700">Nome</th>
                    <th className="h-10 px-4 text-left font-medium text-gray-700">E-mail</th>
                    <th className="h-10 px-4 text-left font-medium text-gray-700">Telefone</th>
                    <th className="h-10 px-4 text-left font-medium text-gray-700">Rua</th>
                    <th className="h-10 px-4 text-left font-medium text-gray-700">Cidade</th>
                    <th className="h-10 px-4 text-left font-medium text-gray-700">Estado</th>
                    <th className="h-10 px-4 text-left font-medium text-gray-700">Codigo postal</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.length > 0 ? (
                    filteredResults.map((cliente) => (
                      <tr onClick={() => setEditClient(!editClient)} key={cliente.id} className=" cursor-pointer border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-4 text-gray-900">{cliente.name}</td>
                        <td className="p-4 font-medium text-gray-900">{cliente.email}</td>
                        <td className="p-4 text-gray-700">{cliente.phone}</td>
                        <td className="p-4 text-gray-700">{cliente.street}</td>
                        <td className="p-4 text-gray-700">{cliente.city}</td>
                        <td className="p-4 text-gray-700">{cliente.state}</td>
                        <td className="p-4 text-gray-700">{cliente.zip_code}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="h-24 text-center text-gray-500">
                        Nenhum cliente encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-start gap-2">
          <a
            href="/dashboard"
            className="px-4 py-2 border border-gray-300 hover:bg-cyan-500 hover:text-white hover:font-semibold rounded-md text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Voltar
          </a>
          <button
            className="border border-gray-300 rounded-lg cursor-pointer text-gray-500 hover:bg-cyan-500 hover:text-white hover:font-semibold px-4 py-2"
            onClick={() => setIsModalOpen(true)}
          >
            Novo cliente
          </button>
        </div>
      </div>
    )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Cadastrar Novo Cliente</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Nome"
                 {...register("name", {required: true})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {errors.name && <span className="text-red">Adicione um nome ao cliente</span>}
              </div>

              <div>
                <input
                  type="email"
                  placeholder="E-mail"
                 {...register("email", {required: true})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {errors.email && <span className="text-red">Adicione um email</span>}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="(xx) 9xxxx-xxxx"
                  {...register("phone", {required: true})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              {errors.phone && <span className="text-red">Adicione um telefone</span>}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Rua"
                  {...register("street", {required: true})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              {errors.street && <span className="text-red">Adicione uma rua</span>}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Cidade"
                  {...register("city", {required: true})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {errors.city && <span className="text0-red">Adicione uma cidade</span>}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Estado"
                  {...register("state", {required: true})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {errors.state && <span className="text-red">Adicione um estado</span>}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Código postal"
                  {...register("zip_code", {required: true})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {errors.zip_code && <span className="text-red"> Adicione um CEP</span>}
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-blue-700 focus:outline-none"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        <EditModal />
        </div>
      )}
    </Dashboard>
  )
}

export default SearchClientes

