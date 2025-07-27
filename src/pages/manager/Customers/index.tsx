import { useEffect, useState } from "react"
import { deleteCustomer, handleAllCustomer } from "../../../service/api/Administrador/customer/clients"
import { Customer } from "../../../service/interfaces"

import Dashboard from "../../../components/dashboard/Dashboard"
import FormAdd from './Form-add'
import EditForm from './modal-edit'

import { Filter, Search, MapPin, Edit, DeleteIcon } from "lucide-react"

import { useAuth } from '../../../AuthContext'

const CustomersContent = () => {
  const [loading, setLoading] = useState(false)
  const [render, setRender] = useState<Customer[]>([])
  const [selectedCustomer] = useState<Customer | null>(null)
  const [currentData, setCurrentData] = useState<Customer | null>(null)
  const [allCustomers, setAllCustomers] = useState<Customer[]>([])
  const [openRegister, setOpenRegister] = useState<boolean>(false)
  const [openEditCustomer, setOpenEditCustomer] = useState<boolean>(false)

  const { user } = useAuth()

  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    name: "",
    code: ""
  });

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      name: "",
      code: ""
    });
  };

  const filteredCustomers = render.filter(customer =>
    Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      return String(customer[key as keyof Customer] || "")
        .toLowerCase()
        .includes(value.toLowerCase());
    })
  );

  useEffect(() => {
    const renderCustomers = async () => {
      try {
        setLoading(true)
        const clients = await handleAllCustomer()
        setRender(clients)
        setAllCustomers(clients)
      } catch (Exception) {
        console.error("Erro ao recuperar dados dos clientes:", Exception)
        throw new Error("Erro ao recuperar a lista de clientes!")
      } finally {
        setLoading(false)
      }
    }
    renderCustomers()
  }, [])

  const handleDeleteCustomer = async (id: string) => {
    const confirmed = await deleteCustomer(id)

    if (confirmed) {
      const reload = await handleAllCustomer()
      setRender(reload)
    }
  }

  const handleEditCustomer = (customer: Customer) => {
    setCurrentData(customer)
    setOpenEditCustomer(true)
  }

  const handleCloseEditModal = async () => {
    setOpenEditCustomer(false)
    const reload = await handleAllCustomer()
    setRender(reload)
  }

  return (
    <Dashboard>
      <div className="w-full flex flex-col items-center m-auto p-4">
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <div className="max-w-screen mx-auto">
            <div className="mb-8 flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Clientes</h1>
            </div>
            {/* Filtros */}
            <div className="bg-white rounded-lg w-full shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${showFilters ? "bg-slate-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filtros
                  </button>
                  {(user?.designation === "Administrador" || user?.designation === "Gestor" || user?.designation === "Gerente") && (
                    <div className="flex flex-col mb-3 cursor-pointer hover:zoonIn">
                      <button
                        onClick={() => setOpenRegister(true)}
                        className="font-semibold pb-1 w-24 mt-3 ml-1 text-2xl text-slate-900 bg-gray-100 hover:bg-gray-200 border rounded-lg w-26 cursor-pointer"
                      >+
                      </button>
                    </div>
                  )}
                  {Object.values(filters).some(f => f !== "") && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{filteredCustomers.length}</span> de{" "}
                    <span className="font-medium">{render.length}</span> clientes
                  </div>
                </div>
              </div>

              {showFilters && (
                <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.keys(filters).map((key) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                        {key[0].toUpperCase() + key.slice(1)}
                      </label>
                      <input
                        type="text"
                        value={filters[key as keyof typeof filters]}
                        onChange={(e) => handleFilterChange(key as keyof typeof filters, e.target.value)}
                        placeholder={`Filtrar por ${key}...`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabela */}
            <div className="bg-white w-[1500px] rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ height: "calc(100vh - 400px)", minHeight: "500px" }}>
              <div className="overflow-x-auto h-full">
                <div className="overflow-y-auto h-full">
                  <table className="w-full">
                    <thead className="bg-slate-800 text-white sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Código</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Nome</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Telefone</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">E-mail</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Adicionado Em:</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-2 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                              <Search className="w-8 h-8 text-gray-400" />
                              <p className="font-medium">Nenhum Cliente encontrado</p>
                              <p className="text-sm">Tente ajustar os filtros de busca</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map(customer => (
                          <tr
                            key={customer.id}
                            className={`border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${selectedCustomer?.id === customer.id ? "bg-slate-50 border-slate-300" : ""}`}
                            style={{ userSelect: "none" }}
                          >
                            <td className="px-4 py-2">
                              <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-medium">
                                {customer.code}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-xs text-gray-700 max-w-xs truncate">{customer.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">{customer.phone}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">{customer.email}</td>
                            <td className="px-4 py-2 text-xs text-gray-700 rounded font-medium flex gap-2 items-center">{customer.address.state} <span><MapPin className="h-4" /></span></td>
                            <td className="px-4 py-2 font-bold text-sm text-slate-800">{new Date(customer.addedAt.seconds * 1000).toLocaleDateString('pt-BR')}</td>
                            <td>
                              {user?.designation === 'Administrador' && (
                                <div className="flex">
                                  <button onClick={() => handleEditCustomer(customer)}><Edit className="h-4 text-green-500 hover:scale-110" /></button>
                                  <button onClick={() => handleDeleteCustomer(customer.id)}><DeleteIcon className="h-4 text-red-500 hover:scale-110" /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {openRegister && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg w-[full] max-w-[90vw] z-50 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="relative mb-6">
                <FormAdd onCustomerAdded={async () => {
                  const updated = await handleAllCustomer()
                  setRender(updated)
                  setOpenRegister(false)
                }} />
                <button
                  onClick={() => setOpenRegister(false)}
                  className="cursor-pointer absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {openEditCustomer && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" />
          <div className="p-6">
            <div className="relative mb-6">
              <EditForm customer={currentData} onClose={handleCloseEditModal} />
              <button
                onClick={handleCloseEditModal}
                className="cursor-pointer absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
          </div>
        </>
      )}
    </Dashboard>
  )
}

export default CustomersContent

