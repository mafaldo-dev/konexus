import { useState, useEffect } from 'react'
import {
  listSuppliers,
  getSupplierById,
  deleteSupplier,
} from '../../../services/supplierService';
import { Supplier } from '../../../types'
import Dashboard from '../../../components/dashboard/Dashboard'
import FormAdd from './Form-add'
import EditModal from './modal-edit'
import { DynamicTable } from '../../../utils/Table/DynamicTable'
import { DeleteIcon, Edit, Filter, DotIcon } from 'lucide-react'
import { useAuth } from '../../../AuthContext'

const SearchSuppliers = () => {
    const [openEdit, setOpenEdit] = useState<boolean>(false)
    const [openRegister, setOpenRegister] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [showFilters, setShowFilters] = useState<boolean>(false)
    const [currentData, setCurrentData] = useState<Supplier | null>(null)
    const { hasPermission } = useAuth()
    const canCreateSupplier = hasPermission("gestao", "create")
    const canEditSupplier = hasPermission("gestao", "edit")

    const [filters, setFilters] = useState({
        name: "",
        code: "",
    })

    const handleFilterChange = (field: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }))
    }

    const clearFilters = () => {
        setFilters({ name: "", code: "" })
    }

    const filteredSupplier = suppliers.filter(sup => {
        const nameMatch = !filters.name ||
            String(sup.name || "").toLowerCase().includes(filters.name.toLowerCase())

        const codeMatch = !filters.code ||
            String(sup.code || "").toLowerCase().includes(filters.code.toLowerCase())

        return nameMatch && codeMatch
    })

    const loadSuppliers = async () => {
        setLoading(true)
        setLoadError(null)
        try {
            const response = await listSuppliers()
            if (!response.ok || !response.data) {
                setSuppliers([])
                setLoadError(response.error || "Não foi possível carregar os fornecedores.")
                return
            }
            setSuppliers(response.data)
        } catch (error) {
            console.error("Erro ao carregar fornecedores:", error)
            setSuppliers([])
            setLoadError("Não foi possível carregar os fornecedores. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    // Carregar fornecedores
    useEffect(() => {
        loadSuppliers()
    }, [])

    const handleEditSupplier = (supplier: Supplier) => {
        setCurrentData(supplier)
        setOpenEdit(true)
    }

    const handleCloseEditModal = async () => {
        setOpenEdit(false)
        await loadSuppliers()
    }

    const hasActiveFilters = filters.name !== "" || filters.code !== ""

    // ============================================
    // DEFINIÇÃO DAS COLUNAS DA TABELA
    // ============================================
    const columns = [
        {
            key: 'code',
            header: 'Código',
            render: (supplier: Supplier) => (
                <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-medium">
                    {supplier.code}
                </span>
            ),
        },
        {
            key: 'name',
            header: 'Nome',
            className: "px-4 py-2 font-semibold text-sm text-gray-900",
        },
        {
            key: 'trading_name',
            header: 'Nome fantasia',
            className: "px-4 py-2 text-xs text-gray-700 max-w-xs truncate",
        },
        {
            key: 'phone',
            header: 'Telefone',
            className: "px-4 py-2 text-sm text-gray-700",
        },
        {
            key: 'email',
            header: 'E-mail',
            className: "px-4 py-2 text-sm text-gray-700",
        },
        {
            key: 'national_register_code',
            header: 'CNPJ',
            className: "px-4 py-2 text-xs bg-gray-100 text-gray-700 rounded font-medium",
        },
        {
            key: 'active',
            header: 'Status',
            render: (supplier: Supplier) => (
                <span className="text-sm text-gray-600 flex items-center">
                    <DotIcon
                        className={`h-10 w-10 ${supplier.active === false ? "text-red-600" : "text-green-600"
                            }`}
                    />
                    {supplier.active ? "Ativo" : "Inativo"}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Ações',
            render: (supplier: any) => (
                canEditSupplier ? (
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditSupplier(supplier);
                            }}
                            className="p-1 hover:scale-110 transition-transform"
                        >
                            <Edit className="h-4 text-green-500" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                //handleDeleteSupplier(supplier.id);
                            }}
                            className="p-1 hover:scale-110 transition-transform"
                            disabled
                            title='Desativado'
                        >
                            <DeleteIcon className="h-4 text-gray-500 hover:text-black" />
                        </button>
                    </div>
                ) : null
            ),
        },
    ]

    return (
        <Dashboard>
            <div className="w-full flex flex-col items-center m-auto p-4">
                {
                    <div className="max-w-screen mx-auto">
                        <div className="mb-8 flex justify-between items-center">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Fornecedores</h1>
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

                                    {canCreateSupplier && (
                                        <button
                                            onClick={() => setOpenRegister(true)}
                                            className="font-semibold p-2 text-2xl text-slate-900 bg-gray-100 hover:bg-gray-200 border rounded-lg w-12 h-12 flex items-center justify-center cursor-pointer transition-colors"
                                        >
                                            +
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
                                        <span className="font-medium">{filteredSupplier.length}</span> de{" "}
                                        <span className="font-medium">{suppliers.length}</span> Fornecedores
                                    </div>
                                </div>
                            </div>

                            {showFilters && (
                                <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                            Nome
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
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                            Código
                                        </label>
                                        <input
                                            type="text"
                                            value={filters.code}
                                            onChange={(e) => handleFilterChange('code', e.target.value)}
                                            placeholder="Filtrar por código..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* TABELA DINÂMICA - SUBSTITUI TODO O HTML ANTIGO */}
                        <DynamicTable
                            data={filteredSupplier}
                            columns={columns}
                            loading={loading}
                            error={loadError}
                            onRetry={loadSuppliers}
                            emptyMessage="Não há dados disponíveis."
                            emptyDescription={hasActiveFilters
                                ? "Nenhum fornecedor corresponde aos filtros informados."
                                : "Cadastre seu primeiro fornecedor para começar."}
                        />
                    </div>
                }
            </div>

            {/* Modal de Registro */}
            {openRegister && (
                <>
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2  rounded-lg shadow-sm w-full max-w-[100vw] z-50  h-[100vh] overflow-y-auto">
                        <div className="p-6">
                            <FormAdd
                                onClose={() => setOpenRegister(false)} 
                                onSupplierAdded={async () => {
                                await loadSuppliers();
                                setOpenRegister(false)
                            }} />
                        </div>
                    </div>
                </>
            )}

            {/* Modal de Edição */}
            {openEdit && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent rounded-lg shadow-lg w-full max-w-[100vw] z-50 h-full h-[100vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="relative mb-6">
                                <h2 className="text-2xl font-semibold mb-2"></h2>
                                <button
                                    onClick={handleCloseEditModal}
                                    className="cursor-pointer absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    &times;
                                </button>
                            </div>
                            <EditModal supplier={currentData} onClose={handleCloseEditModal} />
                        </div>
                    </div>
                </>
            )}
        </Dashboard>
    )
}

export default SearchSuppliers