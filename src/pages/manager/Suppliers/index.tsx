import { useState, useEffect } from 'react'
import { deleteSupplier, handleAllSuppliers } from '../../../service/api/Administrador/suppliers/supplier'
import { Supplier } from '../../../service/interfaces'

import Dashboard from '../../../components/dashboard/Dashboard'
import FormAdd from './Form-add'

import EditModal from './modal-edit'
import { DeleteIcon, Edit, Filter, CircleCheck, Search } from 'lucide-react'

import { useAuth } from '../../../AuthContext'
import Swal from 'sweetalert2'

const SearchSuppliers = () => {
    const [openEdit, setOpenEdit] = useState<boolean>(false)
    const [openRegister, setOpenRegister] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [showFilters, setShowFilters] = useState<boolean>(false)
    const [currentData, setCurrentData] = useState<Supplier | null>(null)
    const { user } = useAuth()

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
            sup.name.toLowerCase().includes(filters.name.toLowerCase())
        
        const codeMatch = !filters.code || 
            String(sup.code || "").toLowerCase().includes(filters.code.toLowerCase())
        
        return nameMatch && codeMatch
    })

    // Carregar fornecedores
    useEffect(() => {
        const loadSuppliers = async () => {
            setLoading(true)
            try {
                const data = await handleAllSuppliers()
                if (data.length === 0) {
                    Swal.fire("Alert", "Lista de fornecedores não carregada corretamente", "warning")
                }
                setSuppliers(data)
            } catch (error) {
                console.error("Erro ao carregar fornecedores:", error)
                Swal.fire("Erro", "Erro ao recuperar a lista de fornecedores!", "error")
            } finally {
                setLoading(false)
            }
        }
        loadSuppliers()
    }, [])

    const handleDeleteSupplier = async (id: string) => {
        const confirmed = await deleteSupplier(id)

        if (confirmed) {
            const reload = await handleAllSuppliers()
            setSuppliers(reload)
        }
    }

    const handleEditSupplier = (supplier: Supplier) => {
        setCurrentData(supplier)
        setOpenEdit(true)
    }

    const handleCloseEditModal = async () => {
        setOpenEdit(false)
        const reload = await handleAllSuppliers()
        setSuppliers(reload)
    }

    const hasActiveFilters = filters.name !== "" || filters.code !== ""

    return (
        <Dashboard>
            <div className="w-full flex flex-col items-center m-auto p-4">
                {loading ? (
                    <p>Carregando...</p>
                ) : (
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
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                            showFilters ? "bg-slate-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                    >
                                        <Filter className="w-4 h-4" />
                                        Filtros
                                    </button>
                                    
                                    {(user?.role === "Administrador" || user?.role === "Gestor" || user?.role === "Gerente") && (
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

                        {/* Tabela */}
                        <div className="bg-white w-[1500px] rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ height: "calc(100vh - 400px)", minHeight: "500px" }}>
                            <div className="overflow-x-auto h-full">
                                <div className='overflow-y-auto h-full'>
                                    <table className="w-full">
                                        <thead className="bg-slate-800 text-white sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Código</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Nome</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Nome fantasia</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Telefone</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">E-mail</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">CNPJ</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"></th>
                                            </tr>
                                        </thead>
                                        
                                        <tbody>
                                            {filteredSupplier.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Search className="w-8 h-8 text-gray-400" />
                                                            <p className="font-medium">Nenhum Fornecedor encontrado</p>
                                                            <p className="text-sm">Tente ajustar os filtros de busca</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredSupplier.map(supplier => (
                                                    <tr
                                                        key={supplier.id}
                                                        className="border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50"
                                                        style={{ userSelect: "none" }}
                                                    >
                                                        <td className="px-4 py-2">
                                                            <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-medium">
                                                                {supplier.code}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2 font-semibold text-sm text-gray-900">{supplier.name}</td>
                                                        <td className="px-4 py-2 text-xs text-gray-700 max-w-xs truncate">{supplier.trading_name}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-700">{supplier.phone}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-700">{supplier.email}</td>
                                                        <td className="px-4 py-2 text-xs bg-gray-100 text-gray-700 rounded font-medium">{supplier.national_register_code}</td>
                                                        <td className="px-4 py-2">
                                                            <div className="flex items-center gap-1 text-gray-600">
                                                                <CircleCheck className={`w-3 h-3 ${supplier.active? "text-white bg-green-500" : "bg-red-500 text-white"} rounded-xl text-white `}/>
                                                                <span className={`text-xs ${supplier.active ? "text-blue-500" : "text-black" }`}>{supplier.active ? "Ativo" : "Desativado"}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {user?.designation === "Administrador" && (
                                                                <div className="flex gap-2">
                                                                    <button 
                                                                        onClick={() => handleEditSupplier(supplier)}
                                                                        className="p-1 hover:scale-110 transition-transform"
                                                                    >
                                                                        <Edit className="h-4 text-green-500" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteSupplier(supplier.id)}
                                                                        className="p-1 hover:scale-110 transition-transform"
                                                                    >
                                                                        <DeleteIcon className="h-4 text-red-500" />
                                                                    </button>
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

            {/* Modal de Registro */}
            {openRegister && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg w-full max-w-[60vw] z-50 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="relative mb-6">
                                <h2 className="text-2xl font-semibold mb-2">Cadastrar Fornecedor</h2>
                                <p className="text-gray-600">Preencha os campos abaixo para cadastrar um novo fornecedor.</p>
                                <button
                                    onClick={() => setOpenRegister(false)}
                                    className="cursor-pointer absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    &times;
                                </button>
                            </div>
                            <FormAdd onSupplierAdded={async () => {
                                const updated = await handleAllSuppliers()
                                setSuppliers(updated)
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
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg w-full max-w-[90vw] z-50 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="relative mb-6">
                                <h2 className="text-2xl font-semibold mb-2">Editar Fornecedor</h2>
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