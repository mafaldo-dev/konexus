import { useEffect, useState, useMemo } from "react"
import { handleAllCustomers } from "../../../service/api/Administrador/customer/clients"
import { Customer } from "../../../service/interfaces"
import Dashboard from "../../../components/dashboard/Dashboard"
import FormAdd from './Form-add'
import EditForm from './modal-edit'
import { DynamicTable } from '../../../utils/Table/DynamicTable'
import { Filter, MapPin, Edit, DeleteIcon, Plus, X, DotIcon } from "lucide-react"
import { useAuth } from '../../../AuthContext'

interface Filters {
  name: string;
  code: string;
  email: string;
  city: string;
}

const CustomersContent = () => {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null)
  const [openRegister, setOpenRegister] = useState<boolean>(false)
  const [openEditCustomer, setOpenEditCustomer] = useState<boolean>(false)
  const [showFilters, setShowFilters] = useState(false)

  const { user } = useAuth()

  const [filters, setFilters] = useState<Filters>({
    name: "",
    code: "",
    email: "",
    city: "",
  })

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesName = !filters.name ||
        customer.name?.toLowerCase().includes(filters.name.toLowerCase())

      const matchesCode = !filters.code ||
        customer.code?.toLowerCase().includes(filters.code.toLowerCase())

      const matchesEmail = !filters.email ||
        customer.email?.toLowerCase().includes(filters.email.toLowerCase())

      const matchesCity = !filters.city ||
        customer.address?.city?.toLowerCase().includes(filters.city.toLowerCase())

      return matchesName && matchesCode && matchesEmail && matchesCity
    })
  }, [customers, filters])

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const clearFilters = () => {
    setFilters({
      name: "",
      code: "",
      email: "",
      city: ""
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== "")

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const clients = await handleAllCustomers()
      setCustomers(clients)
    } catch (error) {
      console.error("Erro ao recuperar dados dos clientes:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  {/*
  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        await deleteCustomer(id)
        await loadCustomers() // Recarregar a lista
      } catch (error) {
        console.error("Erro ao excluir cliente:", error)
      }
    }
  }
*/}
  const handleEditCustomer = (customer: Customer) => {
    setCurrentCustomer(customer)
    setOpenEditCustomer(true)
  }

  const handleCloseEditModal = () => {
    setOpenEditCustomer(false)
    setCurrentCustomer(null)
    loadCustomers() // Recarregar após edição
  }

  const handleCloseAddModal = () => {
    setOpenRegister(false)
    loadCustomers() // Recarregar após adição
  }

  // ============================================
  // DEFINIÇÃO DAS COLUNAS DA TABELA
  // ============================================
  const columns = [
    {
      key: 'code',
      header: 'Código',
      render: (customer: Customer) => (
        <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-medium">
          {customer.code || "N/A"}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Nome',
      className: "px-4 py-3 text-sm text-gray-900 font-medium",
    },
    {
      key: 'phone',
      header: 'Telefone',
      className: "px-4 py-3 text-sm text-gray-700",
    },
    {
      key: 'email',
      header: 'E-mail',
      className: "px-4 py-3 text-sm text-gray-700",
    },
    {
      key: 'city',
      header: 'Cidade',
      render: (customer: Customer) => (
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">{customer.address?.city || "N/A"}</span>
        </div>
      ),
    },
    {
      key: 'street',
      header: 'Logradouro',
      render: (customer: Customer) => (
        <span className="text-sm text-gray-700">{customer.address?.street || "N/A"}</span>
      ),
    },
    {
      key: 'number',
      header: 'Numero',
      render: (customer: Customer) => (
        <span className="text-sm text-gray-700">{customer.address?.number || "N/A"}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Adicionado Em',
      render: (customer: Customer) => (
        <span className="text-sm text-gray-600">
          {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (customer: Customer) => (
        <span className="text-sm text-gray-600 flex items-center gap-1">
          <DotIcon
            className={`h-10 w-10 ${customer.status === "Inativo" ? "text-red-600" : "text-green-600"
              }`}
          />
          {customer.status}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (customer: Customer) => (
        (user?.role === "Administrador" || user?.role === "Gestor") ? (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditCustomer(customer);
              }}
              className="p-1 text-green-600 hover:text-green-800 transition-colors"
              title="Editar cliente"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                //handleDeleteCustomer(customer.id);
              }}
              className="p-1 text-gray-800 hover:text-black transition-colors"
              title="Desativado"
              disabled
            >
              <DeleteIcon className="w-4 h-4" />
            </button>
          </div>
        ) : null
      ),
    },
  ]

  return (
    <Dashboard>
      <div className="w-full h-full flex flex-col items-center m-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-600">Carregando clientes...</p>
          </div>
        ) : (
          <div className="max-w-screen mx-auto">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Clientes</h1>
                <p className="text-gray-600">Gerencie seus clientes e informações de contato</p>
              </div>
            </div>

            {/* Filtros e Ações */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${showFilters ? "bg-slate-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filtros {hasActiveFilters && "•"}
                  </button>

                  {(user?.role === "Administrador" || user?.role === "Gestor" || user?.role === "Gerente") && (
                    <button
                      onClick={() => setOpenRegister(true)}
                      className="flex items-center h-10 gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-800 rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}

                  {hasActiveFilters && (
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
                    <span className="font-medium">{customers.length}</span> clientes
                  </div>
                </div>
              </div>

              {/* Filtros Expandidos */}
              {showFilters && (
                <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nome*
                    </label>
                    <input
                      type="text"
                      value={filters.name}
                      onChange={(e) => handleFilterChange('name', e.target.value)}
                      placeholder="Filtrar por nome..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Código*
                    </label>
                    <input
                      type="text"
                      value={filters.code}
                      onChange={(e) => handleFilterChange('code', e.target.value)}
                      placeholder="Filtrar por código..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      E-mail*
                    </label>
                    <input
                      type="text"
                      value={filters.email}
                      onChange={(e) => handleFilterChange('email', e.target.value)}
                      placeholder="Filtrar por e-mail..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cidade*
                    </label>
                    <input
                      type="text"
                      value={filters.city}
                      onChange={(e) => handleFilterChange('city', e.target.value)}
                      placeholder="Filtrar por cidade..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* TABELA DINÂMICA - SUBSTITUI TODO O HTML ANTIGO */}
            <DynamicTable
              data={filteredCustomers}
              columns={columns}
              loading={loading}
              emptyMessage="Nenhum cliente encontrado"
              emptyDescription="Tente ajustar os filtros de busca"
            />
          </div>
        )}

        {/* Modal Adicionar Cliente */}
        {openRegister && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={() => setOpenRegister(false)} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Adicionar Novo Cliente</h2>
                <button
                  onClick={() => setOpenRegister(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <FormAdd onCustomerAdded={handleCloseAddModal} />
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Cliente */}
        {openEditCustomer && currentCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={handleCloseEditModal} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Editar Cliente</h2>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <EditForm customer={currentCustomer} onClose={handleCloseEditModal} />
              </div>
            </div>
          </div>
        )}
      </div>
    </Dashboard>
  )
}

export default CustomersContent