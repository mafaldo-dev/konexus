import { useEffect, useMemo, useState } from "react"
import { Products } from "../../../service/interfaces/stock/products"
import { handleAllProducts } from "../../../service/api/Administrador/products"
import { DynamicTable } from "../../../utils/Table/DynamicTable"
import { Search, X, ChevronDown, BarChart2, Layers, Clock, Package, TrendingUp, ShoppingBag } from "lucide-react"
import Dashboard from "../../../components/dashboard/Dashboard"

type Category = {
  id: string
  name: string
  description?: string
  parentId?: string
  parentName?: string
  status: "active" | "inactive"
  createdAt: string
  productsCount: number
}

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [allProducts, setAllProducts] = useState<Products[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const fetchProductsAndBuildCategories = async () => {
      try {
        setIsLoading(true)
        const products: Products[] = await handleAllProducts()
        setAllProducts(products)

        const categoryMap = new Map<string, Category>()

        products.forEach((product) => {
          const existing = categoryMap.get(product.category)

          if (existing) {
            existing.productsCount += 1
          } else {
            categoryMap.set(product.category, {
              id: product.category,
              name: product.category,
              description: "",
              parentId: undefined,
              parentName: undefined,
              status: "active",
              createdAt: new Date().toISOString(),
              productsCount: 1,
            })
          }
        })

        setCategories(Array.from(categoryMap.values()))
      } catch (error) {
        console.error("Erro ao buscar produtos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProductsAndBuildCategories()
  }, [])

  const filteredCategories = useMemo(() => {
    return categories
      .filter((category) => {
        const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || category.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => b.productsCount - a.productsCount)
  }, [categories, searchTerm, statusFilter])

  const handleViewProducts = (category: Category) => {
    setSelectedCategory(category)
    setIsModalOpen(true)
  }

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return []
    return allProducts.filter(product => product.category === selectedCategory.name)
  }, [selectedCategory, allProducts])

  // Estatísticas gerais
  const totalProducts = allProducts.length
  const totalCategories = categories.length
  const avgProductsPerCategory = totalCategories > 0 ? Math.round(totalProducts / totalCategories) : 0

  // Colunas da tabela de produtos no modal
  const productColumns = [
    {
      key: 'name',
      header: 'Nome',
      className: "px-4 py-3 text-sm font-medium text-gray-900",
    },
    {
      key: 'price',
      header: 'Valor',
      render: (product: Products) => (
        <span className="text-sm text-gray-900 font-semibold">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(product.price)}
        </span>
      ),
    },
    {
      key: 'brand',
      header: 'Marca',
      className: "px-4 py-3 text-sm text-gray-700",
    },
    {
      key: 'stock',
      header: 'Estoque',
      render: (product: Products) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          product.stock > 10 ? 'bg-green-100 text-green-800' : 
          product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 
          'bg-red-100 text-red-800'
        }`}>
          {product.stock} un.
        </span>
      ),
    },
  ]

  return (
    <Dashboard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-200 to-purple-100 rounded-xl">
                  <Layers className="w-7 h-7 text-black" />
                </div>
                Categorias de Produtos
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Gerencie e visualize todas as categorias do seu catálogo
              </p>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">Total de Categorias</p>
                  <p className="text-3xl font-bold text-blue-900">{totalCategories}</p>
                </div>
                <div className="p-3 bg-blue-500 rounded-xl">
                  <Layers className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Total de Produtos</p>
                  <p className="text-3xl font-bold text-purple-900">{totalProducts}</p>
                </div>
                <div className="p-3 bg-purple-500 rounded-xl">
                  <Package className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Média por Categoria</p>
                  <p className="text-3xl font-bold text-green-900">{avgProductsPerCategory}</p>
                </div>
                <div className="p-3 bg-green-500 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                placeholder="Buscar categoria por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors sm:text-sm"
              />
              {searchTerm.length > 0 && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-4"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                </button>
              )}
            </div>

            <div className="relative w-full md:w-64">
              <select
                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                value={statusFilter}
                className="appearance-none block w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors sm:text-sm"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {searchTerm && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{filteredCategories.length}</span> 
              {filteredCategories.length === 1 ? 'categoria encontrada' : 'categorias encontradas'}
            </div>
          )}
        </div>

        {/* Grid de Categorias */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 font-medium">Carregando categorias...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
                <Layers className="w-full h-full" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma categoria encontrada</h3>
              <p className="text-sm text-gray-500 mb-6">
                {searchTerm ? "Tente ajustar sua busca ou limpar os filtros" : "Adicione uma nova categoria para começar"}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="p-6">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-200 to-purple-200 rounded-lg group-hover:scale-110 transition-transform">
                          <ShoppingBag className="w-5 h-5 text-black" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{category.name}</h3>
                      </div>
                    </div>

                    {/* Informações */}
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <BarChart2 className="flex-shrink-0 mr-2 h-5 w-5 text-blue-500" />
                        <span className="font-semibold text-gray-900">{category.productsCount}</span>
                        <span className="ml-1">
                          {category.productsCount === 1 ? 'produto' : 'produtos'}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="flex-shrink-0 mr-gradient-to-br from-blue-50 to-blue-1002 h-5 w-5 text-slate-500" />
                        <span>Criada em {new Date(category.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>

                    {/* Badge de Status */}
                    <div className="mt-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        category.status === "active" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {category.status === "active" ? "✓ Ativo" : "✕ Inativo"}
                      </span>
                    </div>
                  </div>

                  {/* Footer do Card */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200 group-hover:from-blue-50 group-hover:to-purple-50 transition-colors">
                    <button 
                      onClick={() => handleViewProducts(category)}
                      className="w-full text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 group-hover:scale-105 transition-transform"
                    >
                      <Package className="w-4 h-4" />
                      Ver produtos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Produtos */}
      {isModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header do Modal */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-purple-600 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedCategory.name}
                  </h3>
                  <p className="text-sm text-blue-100 mt-1">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'} nesta categoria
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Tabela de Produtos */}
            <div className="flex-1 overflow-hidden p-6">
              <DynamicTable
                data={filteredProducts}
                columns={productColumns}
                emptyMessage="Nenhum produto encontrado"
                emptyDescription="Esta categoria não possui produtos cadastrados"
                containerHeight="100%"
                minHeight="300px"
              />
            </div>

            {/* Footer do Modal */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </Dashboard>
  )
}

export default Categories