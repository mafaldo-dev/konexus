import { useMemo, useState } from "react"
import { Search, Plus, Edit, Trash2, X, Save, Filter, Calculator, Package, AlertTriangle, Scale } from 'lucide-react'
import Dashboard from "../../../components/dashboard/Dashboard"
import { useSearchFilter } from "../../../hooks/_manager/useSearchFilter"

interface Unit {
    id: string
    name: string
    abbreviation: string
    description: string
    type: "weight" | "volume" | "length" | "area" | "quantity" | "time" | "other"
    baseUnit?: string
    conversionFactor?: number
    productsCount: number
    status: "active" | "inactive"
    createdAt: string
}

export default function Units() {
    const [units, setUnits] = useState<Unit[]>([
        {
            id: "1",
            name: "Quilograma",
            abbreviation: "kg",
            description: "Unidade de massa do Sistema Internacional",
            type: "weight",
            productsCount: 23,
            status: "active",
            createdAt: "2024-01-15",
        },
        {
            id: "2",
            name: "Grama",
            abbreviation: "g",
            description: "Unidade de massa menor",
            type: "weight",
            baseUnit: "kg",
            conversionFactor: 0.001,
            productsCount: 45,
            status: "active",
            createdAt: "2024-01-16",
        },
        {
            id: "3",
            name: "Litro",
            abbreviation: "L",
            description: "Unidade de volume",
            type: "volume",
            productsCount: 12,
            status: "active",
            createdAt: "2024-01-17",
        },
        {
            id: "4",
            name: "Metro",
            abbreviation: "m",
            description: "Unidade de comprimento",
            type: "length",
            productsCount: 8,
            status: "active",
            createdAt: "2024-01-18",
        },
        {
            id: "5",
            name: "Unidade",
            abbreviation: "un",
            description: "Unidade de quantidade",
            type: "quantity",
            productsCount: 156,
            status: "active",
            createdAt: "2024-01-19",
        },
        {
            id: "6",
            name: "Caixa",
            abbreviation: "cx",
            description: "Embalagem padrão",
            type: "quantity",
            productsCount: 34,
            status: "inactive",
            createdAt: "2024-01-20",
        },
    ])

    const [searchTerm, setSearchTerm] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
    const [showModal, setShowModal] = useState(false)
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        abbreviation: "",
        description: "",
        type: "quantity" as Unit["type"],
        baseUnit: "",
        conversionFactor: "",
        status: "active" as "active" | "inactive",
    })

    const unitTypes = [
        { value: "weight", label: "Peso" },
        { value: "volume", label: "Volume" },
        { value: "length", label: "Comprimento" },
        { value: "area", label: "Área" },
        { value: "quantity", label: "Quantidade" },
        { value: "time", label: "Tempo" },
        { value: "other", label: "Outros" },
    ]

    // Filtrar unidades
    const searchedUnits = useSearchFilter(units, searchTerm, ['name', 'abbreviation', 'description']);


    const filteredUnits = useMemo(() => {
        return searchedUnits.filter((unit) => {
            const matchesType = typeFilter === "all" || unit.type === typeFilter
            const matchesStatus = statusFilter === "all" || unit.status === statusFilter

            return matchesType && matchesStatus
        })
    }, [searchedUnits, typeFilter, statusFilter]);

    const handleAddUnit = () => {
        setEditingUnit(null)
        setFormData({
            name: "",
            abbreviation: "",
            description: "",
            type: "quantity",
            baseUnit: "",
            conversionFactor: "",
            status: "active",
        })
        setShowModal(true)
    }

    const handleEditUnit = (unit: Unit) => {
        setEditingUnit(unit)
        setFormData({
            name: unit.name,
            abbreviation: unit.abbreviation,
            description: unit.description,
            type: unit.type,
            baseUnit: unit.baseUnit || "",
            conversionFactor: unit.conversionFactor?.toString() || "",
            status: unit.status,
        })
        setShowModal(true)
    }

    const handleSaveUnit = () => {
        if (!formData.name.trim() || !formData.abbreviation.trim()) return

        if (editingUnit) {
            // Editar unidade existente
            setUnits((prev) =>
                prev.map((unit) =>
                    unit.id === editingUnit.id
                        ? {
                            ...unit,
                            name: formData.name,
                            abbreviation: formData.abbreviation,
                            description: formData.description,
                            type: formData.type,
                            baseUnit: formData.baseUnit || undefined,
                            conversionFactor: formData.conversionFactor ? parseFloat(formData.conversionFactor) : undefined,
                            status: formData.status,
                        }
                        : unit
                )
            )
        } else {
            // Adicionar nova unidade
            const newUnit: Unit = {
                id: Date.now().toString(),
                name: formData.name,
                abbreviation: formData.abbreviation,
                description: formData.description,
                type: formData.type,
                baseUnit: formData.baseUnit || undefined,
                conversionFactor: formData.conversionFactor ? parseFloat(formData.conversionFactor) : undefined,
                productsCount: 0,
                status: formData.status,
                createdAt: new Date().toISOString().split("T")[0],
            }
            setUnits((prev) => [...prev, newUnit])
        }

        setShowModal(false)
        setFormData({
            name: "",
            abbreviation: "",
            description: "",
            type: "quantity",
            baseUnit: "",
            conversionFactor: "",
            status: "active",
        })
    }

    const handleDeleteUnit = (id: string) => {
        setUnits((prev) => prev.filter((unit) => unit.id !== id))
        setShowDeleteConfirm(null)
    }

    const getTypeLabel = (type: string) => {
        return unitTypes.find((t) => t.value === type)?.label || type
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "weight":
                return <Scale className="w-4 h-4" />
            case "volume":
            case "length":
            case "area":
                return <Calculator className="w-4 h-4" />
            default:
                return <Package className="w-4 h-4" />
        }
    }

    return (
        <Dashboard>
            <div className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Calculator className="w-6 h-6 text-slate-600" />
                            <h1 className="text-2xl font-bold text-slate-900">Unidades de Medida</h1>
                        </div>
                        <p className="text-slate-600">Gerencie as unidades de medida dos seus produtos</p>
                    </div>

                    {/* Toolbar */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            <div className="flex flex-col sm:flex-row gap-3 flex-1">
                                {/* Busca */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar unidades..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
                                    />
                                </div>

                                {/* Filtro de Tipo */}
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                                    >
                                        <option value="all">Todos os tipos</option>
                                        {unitTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filtro de Status */}
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                                        className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                                    >
                                        <option value="all">Todos os status</option>
                                        <option value="active">Ativo</option>
                                        <option value="inactive">Inativo</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleAddUnit}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Nova Unidade
                            </button>
                        </div>

                        <div className="mt-3 text-sm text-slate-600">
                            Mostrando {filteredUnits.length} de {units.length} unidades
                        </div>
                    </div>

                    {/* Tabela */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Unidade
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Tipo
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Conversão
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Produtos
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Criado em
                                        </th>
                                        <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredUnits.map((unit) => (
                                        <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-slate-900">{unit.name}</span>
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                                            {unit.abbreviation}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-slate-500 mt-1">{unit.description}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {getTypeIcon(unit.type)}
                                                    <span className="text-sm text-slate-900">{getTypeLabel(unit.type)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {unit.baseUnit && unit.conversionFactor ? (
                                                    <div className="text-sm text-slate-600">
                                                        1 {unit.abbreviation} = {unit.conversionFactor} {unit.baseUnit}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-sm">Unidade base</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-900">{unit.productsCount}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${unit.status === "active"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                        }`}
                                                >
                                                    {unit.status === "active" ? "Ativo" : "Inativo"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {new Date(unit.createdAt).toLocaleDateString("pt-BR")}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditUnit(unit)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(unit.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredUnits.length === 0 && (
                            <div className="text-center py-12">
                                <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma unidade encontrada</h3>
                                <p className="text-slate-500 mb-4">Não há unidades que correspondam aos filtros aplicados.</p>
                                <button
                                    onClick={handleAddUnit}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Adicionar Primeira Unidade
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Modal de Adicionar/Editar */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        {editingUnit ? "Editar Unidade" : "Nova Unidade"}
                                    </h3>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Nome da Unidade</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ex: Quilograma"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Abreviação</label>
                                        <input
                                            type="text"
                                            value={formData.abbreviation}
                                            onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ex: kg"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Descreva a unidade de medida"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as Unit["type"] })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            {unitTypes.map((type) => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Unidade Base (opcional)</label>
                                        <input
                                            type="text"
                                            value={formData.baseUnit}
                                            onChange={(e) => setFormData({ ...formData, baseUnit: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ex: kg (para conversão)"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Fator de Conversão (opcional)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={formData.conversionFactor}
                                            onChange={(e) => setFormData({ ...formData, conversionFactor: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ex: 0.001 (1g = 0.001kg)"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="active">Ativo</option>
                                            <option value="inactive">Inativo</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-slate-700 hover:text-slate-900 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveUnit}
                                        disabled={!formData.name.trim() || !formData.abbreviation.trim()}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
                                    >
                                        <Save className="w-4 h-4" />
                                        {editingUnit ? "Salvar Alterações" : "Criar Unidade"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal de Confirmação de Exclusão */}
                    {showDeleteConfirm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                                <div className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                            <AlertTriangle className="w-6 h-6 text-red-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900">Confirmar Exclusão</h3>
                                            <p className="text-slate-600">Esta ação não pode ser desfeita.</p>
                                        </div>
                                    </div>
                                    <p className="text-slate-700 mb-6">
                                        Tem certeza que deseja excluir esta unidade? Todos os produtos associados ficarão sem unidade de medida.
                                    </p>
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            onClick={() => setShowDeleteConfirm(null)}
                                            className="px-4 py-2 text-slate-700 hover:text-slate-900 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUnit(showDeleteConfirm)}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                        >
                                            Excluir Unidade
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Dashboard>
    )
}
