"use client"

import { useState } from "react"
import { Search, Plus, Edit, Trash2, X, Save, Filter, Award, Package, AlertTriangle, Globe, Mail, Phone } from 'lucide-react'
import Dashboard from "../../../components/dashboard"

interface Brand {
  id: string
  name: string
  description: string
  website?: string
  email?: string
  phone?: string
  productsCount: number
  status: "active" | "inactive"
  createdAt: string
}

export default function Brands() {
  const [brands, setBrands] = useState<Brand[]>([
    {
      id: "1",
      name: "Samsung",
      description: "Tecnologia e inovação em eletrônicos",
      website: "https://samsung.com",
      email: "contato@samsung.com",
      phone: "(11) 99999-9999",
      productsCount: 34,
      status: "active",
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "Apple",
      description: "Design e tecnologia premium",
      website: "https://apple.com",
      email: "suporte@apple.com",
      productsCount: 28,
      status: "active",
      createdAt: "2024-01-16",
    },
    {
      id: "3",
      name: "Nike",
      description: "Artigos esportivos e lifestyle",
      website: "https://nike.com",
      email: "contato@nike.com",
      phone: "(11) 88888-8888",
      productsCount: 45,
      status: "active",
      createdAt: "2024-01-17",
    },
    {
      id: "4",
      name: "Adidas",
      description: "Equipamentos esportivos",
      website: "https://adidas.com",
      productsCount: 23,
      status: "inactive",
      createdAt: "2024-01-18",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [showModal, setShowModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    email: "",
    phone: "",
    status: "active" as "active" | "inactive",
  })

  // Filtrar marcas
  const filteredBrands = brands.filter((brand) => {
    const matchesSearch =
      brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || brand.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleAddBrand = () => {
    setEditingBrand(null)
    setFormData({ name: "", description: "", website: "", email: "", phone: "", status: "active" })
    setShowModal(true)
  }

  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand)
    setFormData({
      name: brand.name,
      description: brand.description,
      website: brand.website || "",
      email: brand.email || "",
      phone: brand.phone || "",
      status: brand.status,
    })
    setShowModal(true)
  }

  const handleSaveBrand = () => {
    if (!formData.name.trim()) return

    if (editingBrand) {
      // Editar marca existente
      setBrands((prev) =>
        prev.map((brand) =>
          brand.id === editingBrand.id
            ? {
                ...brand,
                name: formData.name,
                description: formData.description,
                website: formData.website || undefined,
                email: formData.email || undefined,
                phone: formData.phone || undefined,
                status: formData.status,
              }
            : brand
        )
      )
    } else {
      // Adicionar nova marca
      const newBrand: Brand = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        website: formData.website || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        productsCount: 0,
        status: formData.status,
        createdAt: new Date().toISOString().split("T")[0],
      }
      setBrands((prev) => [...prev, newBrand])
    }

    setShowModal(false)
    setFormData({ name: "", description: "", website: "", email: "", phone: "", status: "active" })
  }

  const handleDeleteBrand = (id: string) => {
    setBrands((prev) => prev.filter((brand) => brand.id !== id))
    setShowDeleteConfirm(null)
  }

  return (
    <Dashboard>
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-6 h-6 text-slate-600" />
            <h1 className="text-2xl font-bold text-slate-900">Marcas</h1>
          </div>
          <p className="text-slate-600">Gerencie as marcas dos seus produtos</p>
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
                  placeholder="Buscar marcas..."
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
              onClick={handleAddBrand}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Marca
            </button>
          </div>

          <div className="mt-3 text-sm text-slate-600">
            Mostrando {filteredBrands.length} de {brands.length} marcas
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Marca
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Contato
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
                {filteredBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">{brand.name}</div>
                        <div className="text-sm text-slate-500">{brand.description}</div>
                        {brand.website && (
                          <div className="flex items-center gap-1 mt-1">
                            <Globe className="w-3 h-3 text-slate-400" />
                            <a
                              href={brand.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              {brand.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {brand.email && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{brand.email}</span>
                          </div>
                        )}
                        {brand.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{brand.phone}</span>
                          </div>
                        )}
                        {!brand.email && !brand.phone && (
                          <span className="text-slate-400 text-sm">Sem contato</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">{brand.productsCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          brand.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {brand.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(brand.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditBrand(brand)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(brand.id)}
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

          {filteredBrands.length === 0 && (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma marca encontrada</h3>
              <p className="text-slate-500 mb-4">Não há marcas que correspondam aos filtros aplicados.</p>
              <button
                onClick={handleAddBrand}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar Primeira Marca
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
                  {editingBrand ? "Editar Marca" : "Nova Marca"}
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nome da Marca</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite o nome da marca"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descreva a marca"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="contato@marca.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Telefone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(11) 99999-9999"
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
                  onClick={handleSaveBrand}
                  disabled={!formData.name.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingBrand ? "Salvar Alterações" : "Criar Marca"}
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
                  Tem certeza que deseja excluir esta marca? Todos os produtos associados ficarão sem marca.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDeleteBrand(showDeleteConfirm)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Excluir Marca
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
