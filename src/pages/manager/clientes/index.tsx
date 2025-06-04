import { ReactEventHandler, useEffect, useState } from "react"
import { useForm, SubmitHandler } from 'react-hook-form'

import { getAllClients, insertClient, updateClient } from "../../../service/api/clients/clients"
import type { Cliente } from "../../../service/interfaces/client"

import Dashboard from "../../../components/dashboard"
import EditModal from '../clientes/modal-edit'


const SearchClientes = () => {
  const { register, handleSubmit, formState: {errors}, reset } = useForm<Cliente>()
  const [filteredResults, setFilteredResults] = useState<Cliente[]>([])
  const [filtered, setFiltered] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [client, setClient] = useState<Cliente[]>([])
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [newInfos, setNewInfos] = useState<Cliente>()
  const [editClient, setEditClient] = useState(false)
                  // INSERT CLIENTS DATA
  const onSubmit: SubmitHandler<Cliente> = async (data) => {
    try {
      await insertClient({...data, added:  new Date()})
      reset()
      getAllClients()     
      const reload = await getAllClients() 
      setClient(reload)
      setIsModalOpen(false)
    } catch(Exception) {
      console.error("Erro ao adicionar novo cliente", Exception)
      setError("Erro ao cadastrar cliente")
    } finally {
      setIsLoading(false)
    }
  }

  // RENDER CLIENTS
  useEffect(() => {
    const renderClients = async () => {
      try {
        setIsLoading(true)
        const clients = await getAllClients()
        setClient(clients)
      } catch (Exception) {
        console.error("Erro ao recuperar dados dos clientes:", Exception)
        setError("Erro ao buscar dados")
      } finally {
        setIsLoading(false)
      }
    }
    renderClients()
  }, [getAllClients])

    // FILTER OF CLIENTS BY NAME
  useEffect(() => {
    if (filtered) {
      const filter = client.filter((cliente: Cliente) => cliente.name.toLowerCase().includes(filtered.toLowerCase()))
      setFilteredResults(filter)
    } else {
      setFilteredResults(client)
    }
  }, [filtered, client])

  const handleChange = async(e: React.ChangeEvent<HTMLInputElement>) =>{
    const { name, value } = e.target 
    setNewInfos((prev: any) => ({
      ...prev,
      [name]: value
    }))
  }

  const saveUpdate = async () => {
    if(!newInfos || !newInfos.id) {
      alert("ID do cliente nao ecnon")
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
              onClick={getAllClients}
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
                      <tr 
                        onClick={() => setEditClient(!editClient)} 
                        key={cliente.id} 
                        className=" cursor-pointer border-b border-gray-200 hover:bg-gray-50">
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
            className="px-4 py-2 text-gray-400 border border-gray-300 hover:bg-cyan-500 hover:text-white hover:font-semibold rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Voltar
          </a>
          <button
            className="border border-gray-300 rounded-lg cursor-pointer text-gray-400 hover:bg-cyan-500 hover:text-white hover:font-semibold px-4 py-2"
            onClick={() => setIsModalOpen(!isModalOpen)}
          >
            Novo cliente
          </button>
        </div>
      </div>
    )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-9/12 mx-4">
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Pessoais */}
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Informações Pessoais
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Digite o nome completo"
                  {...register("name", {
                    required: "Nome é obrigatório",
                    minLength: { value: 2, message: "Nome deve ter pelo menos 2 caracteres" },
                  })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
                {errors.name && <span className="text-red-500 text-sm mt-1 block">{errors.name.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código do Cliente *</label>
                <input
                  type="text"
                  placeholder="Ex: CLI001"
                  {...register("code", {
                    required: "Código é obrigatório",
                    minLength: { value: 3, message: "Código deve ter pelo menos 3 caracteres" },
                  })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
                {errors.code && <span className="text-red-500 text-sm mt-1 block">{errors.code.message}</span>}
              </div>
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Informações de Contato
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  placeholder="cliente@exemplo.com"
                  {...register("email", {
                    required: "Email é obrigatório",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email inválido",
                    },
                  })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
                {errors.email && <span className="text-red-500 text-sm mt-1 block">{errors.email.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  {...register("phone", {
                    required: "Telefone é obrigatório",
                    minLength: { value: 10, message: "Telefone deve ter pelo menos 10 dígitos" },
                  })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
                {errors.phone && <span className="text-red-500 text-sm mt-1 block">{errors.phone.message}</span>}
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Endereço
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP *</label>
                <input
                  type="text"
                  placeholder="00000-000"
                  {...register("zip_code", {
                    required: "CEP é obrigatório",
                    pattern: {
                      value: /^\d{5}-?\d{3}$/,
                      message: "CEP inválido",
                    },
                  })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
                {errors.zip_code && <span className="text-red-500 text-sm mt-1 block">{errors.zip_code.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                <input
                  type="text"
                  placeholder="Ex: SP"
                  {...register("state", {
                    required: "Estado é obrigatório",
                    minLength: { value: 2, message: "Estado deve ter pelo menos 2 caracteres" },
                  })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
                {errors.state && <span className="text-red-500 text-sm mt-1 block">{errors.state.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                <input
                  type="text"
                  placeholder="Ex: São Paulo"
                  {...register("city", {
                    required: "Cidade é obrigatória",
                    minLength: { value: 2, message: "Cidade deve ter pelo menos 2 caracteres" },
                  })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
                {errors.city && <span className="text-red-500 text-sm mt-1 block">{errors.city.message}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rua/Avenida *</label>
                <input
                  type="text"
                  placeholder="Digite o nome da rua"
                  {...register("street", {
                    required: "Endereço é obrigatório",
                    minLength: { value: 5, message: "Endereço deve ter pelo menos 5 caracteres" },
                  })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
                {errors.street && <span className="text-red-500 text-sm mt-1 block">{errors.street.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                <input
                  type="text"
                  placeholder="123"
                  {...register("number", {
                    required: "Número é obrigatório",
                  })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
                {errors.number && <span className="text-red-500 text-sm mt-1 block">{errors.number.message}</span>}
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 sm:flex-none sm:min-w-[200px] py-3 px-6 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
           Cadastrar
            </button>

            <button
              type="button"
              //onClick={handleReset}
              disabled={isLoading}
              className="flex-1 sm:flex-none py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Limpar
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 sm:flex-none py-3 px-6 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </form>

            {/* <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
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
            </form> */}
          </div>
        </div>
      )}
    </Dashboard>
  )
}

export default SearchClientes

