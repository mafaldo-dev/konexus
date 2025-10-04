import { useEffect, useMemo, useState } from "react"
import { Products } from "../../../service/interfaces/stock/products"
import { handleAllProducts } from "../../../service/api/Administrador/products"
import { Search, X, ChevronDown, BarChart2, Layers, Clock, CheckCircle, XCircle } from "lucide-react"
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


//const filteredCategories = [0, 1]
//const filteredProducts = [0, 1]
  return (
    <Dashboard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gerencie todas as categorias de produtos do seu catálogo
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Adicionar Categoria
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                placeholder="Buscar categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {searchTerm.length > 0 && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <X
                    className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-500"
                    onClick={() => setSearchTerm("")}
                  />
                </div>
              )}
            </div>

            <div className="relative w-full md:w-auto">
              <select
                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                value={statusFilter}
                className="appearance-none block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400">
                <Layers className="w-full h-full" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhuma categoria encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? "Tente ajustar sua busca" : "Adicione uma nova categoria para começar"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 truncate">{category.id}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category}`}>
                        
                      </span>
                    </div>

                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <BarChart2 className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      <span>{category.status} produto{category.name}</span>
                    </div>

                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      <span>Criada em {new Date(category.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-5 py-3 flex justify-end space-x-3 border-t border-gray-200">
                    <button 
                      onClick={()=> void("")}
                      className="text-sm font-medium text-gray-600 hover:text-gray-500"
                    >
                      Ver produtos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para exibir produtos */}
      {isModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Produtos da categoria: {selectedCategory.name}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="min-w-full divide-y divide-gray-200">
                <div className="bg-gray-50">
                  <div className="grid grid-cols-4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div>Nome</div>
                    <div>Valor</div>
                    <div>Fornecedor</div>
                    <div>Quantidade</div>
                  </div>
                </div>
                <div className="bg-white divide-y divide-gray-200">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <div key={product.id} className="grid grid-cols-4 px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(product.price)}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {product.supplier_id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.quantity}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-4 text-center text-sm text-gray-500">
                      Nenhum produto encontrado nesta categoria
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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