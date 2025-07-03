import { useState, useMemo } from "react"
import { Search, Plus, Edit, Trash2, X, Save, Filter, MoreHorizontal, Tag, Package, AlertTriangle } from 'lucide-react'
import Dashboard from "../../../components/dashboard/Dashboard"
import { useSearchFilter } from '../../../hooks/useSearchFilter'
import { useDebounce } from '../../../hooks/useDebounce'

interface Category {
  id: string
  name: string
  description: string
  parentId?: string
  parentName?: string
  productsCount: number
  status: "active" | "inactive"
  createdAt: string
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([
    {
      id: "1",
      name: "Eletrônicos",
      description: "Produtos eletrônicos em geral",
      productsCount: 45,
      status: "active",
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "Smartphones",
      description: "Telefones celulares e acessórios",
      parentId: "1",
      parentName: "Eletrônicos",
      productsCount: 23,
      status: "active",
      createdAt: "2024-01-16",
    },
    {
      id: "3",
      name: "Roupas",
      description: "Vestuário em geral",
      productsCount: 78,
      status: "active",
      createdAt: "2024-01-17",
    },
    {
      id: "4",
      name: "Camisetas",
      description: "Camisetas masculinas e femininas",
      parentId: "3",
      parentName: "Roupas",
      productsCount: 34,
      status: "active",
      createdAt: "2024-01-18",
    },
    {
      id: "5",
      name: "Casa e Jardim",
      description: "Produtos para casa e jardim",
      productsCount: 12,
      status: "inactive",
      createdAt: "2024-01-19",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "",
    status: "active" as "active" | "inactive",
  })

  // Filtrar categorias
  const searchedCategories = useSearchFilter(categories, debouncedSearchTerm, ['name', 'description', 'parentName']);

  const filteredCategories = useMemo(() => {
    return searchedCategories.filter((category) => {
      const matchesStatus = statusFilter === "all" || category.status === statusFilter;
      return matchesStatus;
    });
  }, [searchedCategories, statusFilter]);

  const handleAddCategory = () => {
    setEditingCategory(null)
    setFormData({ name: "", description: "", parentId: "", status: "active" })
    setShowModal(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description,
      parentId: category.parentId || "",
      status: category.status,
    })
    setShowModal(true)
  }

  const handleSaveCategory = () => {
    if (!formData.name.trim()) return

    if (editingCategory) {
      // Editar categoria existente
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === editingCategory.id
            ? {
              ...cat,
              name: formData.name,
              description: formData.description,
              parentId: formData.parentId || undefined,
              parentName: formData.parentId
                ? categories.find((c) => c.id === formData.parentId)?.name
                : undefined,
              status: formData.status,
            }
            : cat
        )
      )
    } else {
      // Adicionar nova categoria
      const newCategory: Category = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        parentId: formData.parentId || undefined,
        parentName: formData.parentId
          ? categories.find((c) => c.id === formData.parentId)?.name
          : undefined,
        productsCount: 0,
        status: formData.status,
        createdAt: new Date().toISOString().split("T")[0],
      }
      setCategories((prev) => [...prev, newCategory])
    }

    setShowModal(false)
    setFormData({ name: "", description: "", parentId: "", status: "active" })
  }

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id))
    setShowDeleteConfirm(null)
  }

  // Categorias principais para o select de categoria pai
  const parentCategories = categories.filter((cat) => !cat.parentId)

  return (
    <Dashboard>
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Tag className="w-6 h-6 text-slate-600" />
              <h1 className="text-2xl font-bold text-slate-900">Categorias</h1>
            </div>
            <p className="text-slate-600">Gerencie as categorias dos seus produtos</p>
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
                    placeholder="Buscar categorias..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
                  />
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
                onClick={handleAddCategory}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nova Categoria
              </button>
            </div>

            <div className="mt-3 text-sm text-slate-600">
              Mostrando {filteredCategories.length} de {categories.length} categorias
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Categoria Pai
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
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-900">{category.name}</div>
                          <div className="text-sm text-slate-500">{category.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {category.parentName ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            {category.parentName}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">Categoria principal</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">{category.productsCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                            }`}
                        >
                          {category.status === "active" ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(category.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(category.id)}
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

            {filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma categoria encontrada</h3>
                <p className="text-slate-500 mb-4">Não há categorias que correspondam aos filtros aplicados.</p>
                <button
                  onClick={handleAddCategory}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Primeira Categoria
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
                    {editingCategory ? "Editar Categoria" : "Nova Categoria"}
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nome da Categoria</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite o nome da categoria"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descreva a categoria"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Categoria Pai</label>
                    <select
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Categoria principal</option>
                      {parentCategories
                        .filter((cat) => cat.id !== editingCategory?.id)
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                    </select>
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
                    onClick={handleSaveCategory}
                    disabled={!formData.name.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {editingCategory ? "Salvar Alterações" : "Criar Categoria"}
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
                    Tem certeza que deseja excluir esta categoria? Todos os produtos associados ficarão sem categoria.
                  </p>
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-4 py-2 text-slate-700 hover:text-slate-900 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(showDeleteConfirm)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Excluir Categoria
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

