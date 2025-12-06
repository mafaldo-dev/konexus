import { useState, useEffect } from "react";
import { Products } from "../../../service/interfaces";
import { handleAllProducts } from "../../../service/api/Administrador/products";
import Dashboard from "../../../components/dashboard/Dashboard";
import UpdadtedProduct from "./modal-edit";
import FormAdd from "./Form-add";
import { DynamicTable } from "../../../utils/Table/DynamicTable";
import { useAuth } from '../../../AuthContext'
import { Filter, MapPin, EyeIcon } from "lucide-react";

const SearchProducts = () => {
  const [openRegister, setOpenRegister] = useState<boolean>(false);
  const [openEdit, setOpenEdit] = useState<boolean>(false)
  const [loading, setLoading] = useState(false);
  const [items, setItem] = useState<Products[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [currentData, setCurrentData] = useState<Products | null>(null)
  const { user } = useAuth()

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
  }, []);

  const handleEditProduct = (product: Products) => {
    setCurrentData(product)
    setOpenEdit(true)
  }

  const handleCloseEditModal = async () => {
    setOpenEdit(false)
    const reload = await handleAllProducts()
    console.log("console do reload do component pai =>", reload)
    setItem(reload)
  }

  const hasActiveFilters = filters.code !== "" || filters.name !== "" || filters.brand !== "" || filters.location !== "";

  // ============================================
  // DEFINIÇÃO DAS COLUNAS DA TABELA
  // ============================================
  const columns = [
    {
      key: 'code',
      header: 'Código',
      render: (product: Products) => (
        <span className="font-mono text-[13px] bg-gray-100 text-gray-800 px-3 py-1 rounded font-medium">
          {product.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Nome',
      className: "px-4 py-2 font-semibold text-[12px] text-gray-900",
    },
    {
      key: 'description',
      header: 'Descrição',
      className: "px-4 py-2 text-xs text-gray-700 max-w-xs truncate",
    },
    {
      key: 'brand',
      header: 'Marca',
      className: "px-4 py-2 text-[12px] text-gray-700",
    },

    {
      key: 'supplier_name',
      header: 'Fornecedor',
      render: (product: any) => (
        <span className="text-[12px] text-gray-700">
          {product.supplier_name || "Fornecedor não informado"}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Categoria',
      className: "px-4 py-2 text-xs bg-gray-100 text-gray-700 rounded font-medium",
    },
    {
      key: 'price',
      header: 'Preço',
      render: (product: Products) => (
        <span className="font-bold text-[12px] text-slate-800">
          R$ {product.price}
        </span>
      ),
    },
    {
      key: 'stock',
      header: 'Estoque',
      className: "px-7 py-2 font-semibold text-[12px] text-gray-900",
    },
    {
      key: 'location',
      header: 'Localização',
      render: (product: Products) => (
        <div className="flex items-center px-3 gap-1 text-gray-600">
          <MapPin className="w-3 h-3" />
          <span className="text-xs">{product.location}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (product: any) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Previne o click da linha
              handleEditProduct(product);
            }}
            title="Ver informações"
            className="p-1 px-4 hover:scale-110 transition-transform"
          >
            <EyeIcon className="h-4 text-green-500" />
          </button>
        </div>
      ),
    },
  ];

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

            {/* TABELA DINÂMICA - SUBSTITUI TODO O HTML ANTIGO */}
            <DynamicTable
              data={filteredProducts}
              columns={columns}
              loading={loading}
              emptyMessage="Nenhum produto encontrado"
              emptyDescription="Tente ajustar os filtros de busca"
            />
          </div>
        )}
      </div>

      {/* Modal de Registro */}
      {openRegister && (
        <>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2  rounded-lg shadow-sm w-full max-w-[100vw] z-50  h-[100vh] overflow-y-auto">
            <div className="p-6">
              <button
                onClick={() => setOpenRegister(false)}
                className="cursor-pointer absolute top-5 right-72 text-white hover:text-red-500 text-2xl transition-transform duration-200 hover:scale-110"

              >
                &times;
              </button>
              <div className="relative">
                <FormAdd 
                  onClose={() => setOpenRegister(false)}
                  onProductsAdded={async () => {
                  const reload = await handleAllProducts()
                  setItem(reload)
                  setOpenRegister(false)
                }}
                />
              </div>
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