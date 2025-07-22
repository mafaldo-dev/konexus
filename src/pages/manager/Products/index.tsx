import { useState, useEffect } from "react";
import { Products } from "../../../service/interfaces";
import { deleteProduct, getAllProducts, updateProduct } from "../../../service/api/Administrador/products";

import Dashboard from "../../../components/dashboard/Dashboard";
import UpdadtedProduct from "./modal-edit";
import FormAdd from "./Form-add";

import { Filter, MapPin, Search, Edit, DeleteIcon } from "lucide-react";

const SearchProducts = () => {
  const [openRegister, setOpenRegister] = useState(false);
  const [openEdit, setOpenEdit] = useState(false)
  const [loading, setLoading] = useState(false);
  const [items, setItem] = useState<Products[]>([]);
  const [filter, setFilter] = useState<Products[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Products | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentData, setCurrentData] = useState<Products | null>(null)

  const [filters, setFilters] = useState({
    name: "",
    code: "",
    brand: "",
    supplier: "",
    description: "",
    category: ""
  });

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      name: "",
      code: "",
      brand: "",
      supplier: "",
      description: "",
      category: ""
    });
  };

  const filteredProducts = items.filter(product =>
    Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      return String(product[key as keyof Products] || "")
        .toLowerCase()
        .includes(value.toLowerCase());
    })
  );

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getAllProducts();
        setItem(data);
        setFilter(data);
      } catch (error) {
        console.error("Erro ao recuperar a lista de produtos.", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleDeleteProduct = async (id: string) => {
    const confirmed = await deleteProduct(id)

    if (confirmed) {
      const reload = await getAllProducts()
      setItem(reload)
    }
  }

  const handleEditProduct = async (product: Products) => {
    setCurrentData(product)
    setOpenEdit(true)
  }

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
                  <div className="flex flex-col mb-3 cursor-pointer hover:zoonIn">
                    <button
                      onClick={() => setOpenRegister(true)}
                      className="font-semibold pb-1 w-24 mt-3 ml-1 text-2xl text-slate-900 bg-gray-100 hover:bg-gray-200 border rounded-lg w-26 cursor-pointer"
                    >+
                    </button>
                  </div>
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
                    <span className="font-medium">{filteredProducts.length}</span> de{" "}
                    <span className="font-medium">{items.length}</span> produtos
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ height: "calc(100vh - 400px)", minHeight: "500px" }}>
              <div className="overflow-x-auto h-full">
                <table className="w-full h-full">
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
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 text-gray-400" />
                            <p className="font-medium">Nenhum produto encontrado</p>
                            <p className="text-sm">Tente ajustar os filtros de busca</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(product => (
                        <tr
                          key={product.id}
                          className={`border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${selectedProduct?.id === product.id ? "bg-slate-50 border-slate-300" : ""}`}
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
                          <td className="px-4 py-2 text-sm text-gray-700">{product.supplier}</td>
                          <td className="px-4 py-2 text-xs bg-gray-100 text-gray-700 rounded font-medium">{product.category}</td>
                          <td className="px-4 py-2 font-bold text-sm text-slate-800">R$ {product.price}</td>
                          <td className="px-4 py-2 font-semibold text-sm text-gray-900">{product.quantity}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1 text-gray-600">
                              <MapPin className="w-3 h-3" />
                              <span className="text-xs">{product.location}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex">
                              <button onClick={() => handleEditProduct(product)}><Edit className="h-4 text-green-500 hover:scale-110" /></button>
                              <button onClick={() => handleDeleteProduct(product.id)}><DeleteIcon className="h-4 text-red-500 hover:scale-110" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
                <h2 className="text-2xl font-semibold mb-2">Cadastrar Produto</h2>
                <p className="text-gray-600">Preencha os campos abaixo para cadastrar um novo produto.</p>
                <button
                  onClick={() => setOpenRegister(false)}
                  className="cursor-pointer absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>
              <FormAdd />
            </div>
          </div>
        </>
      )}
      {openEdit && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" />
          <div className="p-6">
            <div className="relative mb-6">
              <button
                onClick={() => setOpenRegister(false)}
                className="cursor-pointer absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            <UpdadtedProduct product={currentData} onClose={() => setOpenEdit(false)} />
          </div>
        </>
      )}
    </Dashboard>
  );
};

export default SearchProducts;
