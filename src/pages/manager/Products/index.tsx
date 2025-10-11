import { useState, useEffect } from "react";
import { Products } from "../../../service/interfaces";
import { deleteProduct, handleAllProducts } from "../../../service/api/Administrador/products";

import Dashboard from "../../../components/dashboard/Dashboard";
import UpdadtedProduct from "./modal-edit";
import FormAdd from "./Form-add";

import { useAuth } from '../../../AuthContext'
import { Filter, MapPin, Search, Edit, DeleteIcon } from "lucide-react";
import { handleAllSuppliers } from "../../../service/api/Administrador/suppliers/supplier";

const SearchProducts = () => {
  const [openRegister, setOpenRegister] = useState<boolean>(false);
  const [openEdit, setOpenEdit] = useState<boolean>(false)
  const [loading, setLoading] = useState(false);
  const [items, setItem] = useState<Products[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [currentData, setCurrentData] = useState<Products | null>(null)
  const { user } = useAuth()
  const [supId, setSupId] = useState<any>()

  const [filters, setFilters] = useState({
    code: "",
    name: "",
    brand: "",
    location: ""
  });

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      code: "",
      name: "",
      brand: "",
      location: ""
    });
  };

  const filteredProducts = items.filter(product => {
    const codeMatch = !filters.code ||
      String(product.code || "").toLowerCase().includes(filters.code.toLowerCase());

    const nameMatch = !filters.name ||
      product.name.toLowerCase().includes(filters.name.toLowerCase());

    const brandMatch = !filters.brand ||
      product.brand.toLowerCase().includes(filters.brand.toLowerCase());

    const locationMatch = !filters.location ||
      product.location.toLowerCase().includes(filters.location.toLowerCase());

    return codeMatch && nameMatch && brandMatch && locationMatch;
  });

  const handleSupplierId = async () => {
    const response = await handleAllSuppliers()
    setSupId(response)
  }

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await handleAllProducts();
        setItem(response)
      } catch (error) {
        console.error("Erro ao recuperar a lista de produtos.", error);
        setItem([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
    handleSupplierId()
  }, []);

  const handleDeleteProduct = async (id: string) => {
    const confirmed = await deleteProduct(id)

    if (confirmed) {
      const reload = await handleAllProducts()
      setItem(reload)
    }
  }

  const handleEditProduct = (product: Products) => {
    setCurrentData(product)
    setOpenEdit(true)
  }

  const handleCloseEditModal = async () => {
    setOpenEdit(false)
    const reload = await handleAllProducts()
    setItem(reload)
  }


  const hasActiveFilters = filters.code !== "" || filters.name !== "" || filters.brand !== "" || filters.location !== "";

  return (
    <Dashboard>
      <div className="w-full flex flex-col items-center m-auto p-4">
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <div className="max-w-screen mx-auto">
            <div className="mb-8 flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Produtos</h1>
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
                    <span className="font-medium">{filteredProducts.length}</span> de{" "}
                    <span className="font-medium">{items.length}</span> produtos
                  </div>
                </div>
              </div>

              {showFilters && (
                <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      Marca
                    </label>
                    <input
                      type="text"
                      value={filters.brand}
                      onChange={(e) => handleFilterChange('brand', e.target.value)}
                      placeholder="Filtrar por marca..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Localização
                    </label>
                    <input
                      type="text"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      placeholder="Filtrar por localização..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tabela */}
            <div className="bg-white w-[1300px] rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ height: "calc(100vh - 400px)", minHeight: "500px" }}>
              <div className="overflow-x-auto h-full">
                <div className="overflow-y-auto h-full">
                  <table className="w-full">
                    <thead className="bg-slate-800 text-white sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Código</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Nome</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Descrição</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Marca</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Fornecedor</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Categoria</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Preço</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Estoque</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Localização</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Ações</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                              <Search className="w-8 h-8 text-gray-400" />
                              <p className="font-medium">Nenhum produto encontrado</p>
                              <p className="text-sm">Tente ajustar os filtros de busca</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product: any) => {
                          const supplier = supId?.find((sup: any) => sup.id === product.supplier_id);

                          return (
                            <tr
                              key={product.id}
                              className="border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50"
                              style={{ userSelect: "none" }}
                            >
                              <td className="px-4 py-2">
                                <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-medium">
                                  {product.code}
                                </span>
                              </td>
                              <td className="px-4 py-2 font-semibold text-sm text-gray-900">{product.name}</td>
                              <td className="px-4 py-2 text-xs text-gray-700 max-w-xs truncate">{product.description}</td>
                              <td className="px-4 py-2 text-sm text-gray-700">{product.brand}</td>

                              {/* Fornecedor */}
                              <td className="px-4 py-2 text-sm text-gray-700">
                                {supplier ? supplier.name : "Fornecedor não encontrado"}
                              </td>

                              <td className="px-4 py-2 text-xs bg-gray-100 text-gray-700 rounded font-medium">{product.category}</td>
                              <td className="px-4 py-2 font-bold text-sm text-slate-800">R$ {product.price}</td>
                              <td className="px-4 py-2 font-semibold text-sm text-gray-900">{product.stock}</td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-1 text-gray-600">
                                  <MapPin className="w-3 h-3" />
                                  <span className="text-xs">{product.location}</span>
                                </div>
                              </td>
                              <td>
                                {user?.role === "Administrador" && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEditProduct(product)}
                                      className="p-1 hover:scale-110 transition-transform"
                                    >
                                      <Edit className="h-4 text-green-500" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(product.id)}
                                      className="p-1 hover:scale-110 transition-transform"
                                    >
                                      <DeleteIcon className="h-4 text-red-500" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
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
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg w-full max-w-[90vw] z-50 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="relative mb-6">
                <h2 className="text-2xl font-semibold mb-2">Cadastrar Produto</h2>
                <p className="text-gray-600">Preencha os campos abaixo para cadastrar um novo produto.</p>
                <button
                  onClick={() => setOpenRegister(false)}
                  className="cursor-pointer absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>
              <FormAdd onProductsAdded={async () => {
                const reload = await handleAllProducts()
                setItem(reload)
                setOpenRegister(false)
              }}
              />
            </div>
          </div>
        </>
      )}

      {/* Modal de Edição */}
      {openEdit && (
        <>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2  rounded-lg shadow-sm w-full max-w-[100vw] z-50  h-[100vh] overflow-y-auto">
            <UpdadtedProduct product={currentData} onClose={handleCloseEditModal} />
          </div>
        </>
      )}
    </Dashboard>
  );
};

export default SearchProducts;