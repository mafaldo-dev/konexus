import { useState, useEffect, useCallback } from "react";
import { Movement, Products } from "../../../types";
import {
  listProducts,
  getProductById,
  deleteProduct,
} from "../../../services/productService";
import { getKardexByProduct } from "../../../services/kardexService";
import Dashboard from "../../../components/dashboard/Dashboard";
import UpdadtedProduct from "./modal-edit";
import FormAdd from "./Form-add";
import { DynamicTable } from "../../../utils/Table/DynamicTable";
import { useAuth } from "../../../AuthContext";
import { Filter, MapPin, MoreVertical } from "lucide-react";
import KardexModal from "../../stock/movements/components/KardexModal";
import { ContextMenuPosition } from "../../stock/movements/movementsType";
import ContextMenu from "../../stock/movements/components/ContextMenu";
import LocationModal from "../../stock/movements/components/LocationModal";

const SearchProducts = () => {
  const [openRegister, setOpenRegister] = useState<boolean>(false);
  const [openEdit, setOpenEdit] = useState<boolean>(false)
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [items, setItem] = useState<Products[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [currentData, setCurrentData] = useState<Products | null>(null)

  const [kardexProduct, setKardexProduct] = useState<Products | null>(null);
  const [kardexMovements, setKardexMovements] = useState<Movement[]>([]);
  const [showKardexModal, setShowKardexModal] = useState(false);
  const [loadingKardex, setLoadingKardex] = useState(false);
  const [kardexError, setKardexError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Products | null>(null);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationProduct, setLocationProduct] = useState<Products | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    position: ContextMenuPosition;
    product: Products | null;
  }>({
    show: false,
    position: { x: 0, y: 0 },
    product: null,
  });

  const { hasPermission } = useAuth()

  // Cada ação do menu usa a permissão que o backend exige. O backend continua
  // sendo a autoridade final; aqui evitamos expor ações que serão negadas.
  const canEditProduct = hasPermission("gestao", "edit");
  const canViewKardex = hasPermission("estoque", "view");
  const canCreateProduct = hasPermission("gestao", "create");
  const hasMenuPermission = canEditProduct || canViewKardex;

  const openKardexModal = useCallback(async (product: Products) => {
    setLoadingKardex(true);
    setKardexError(null);
    try {
      const response = await getKardexByProduct(product.id);
      setKardexProduct(product);
      if (!response.ok || !response.data) {
        setKardexMovements([]);
        setKardexError(
          response.error || "Não foi possível carregar as movimentações do produto."
        );
      } else {
        const movements: Movement[] = (response.data.movements || []).map((m) => ({
          id: m.id,
          movementtype: m.movementtype,
          quantity: m.quantity,
          unitprice: String(m.unitprice ?? ''),
          movementdate: m.movementdate,
          orderid: m.orderid ?? 0,
          invoicenumber: m.invoicenumber ?? '',
          ordernumber: m.ordernumber ?? '',
          productname: m.productname ?? '',
          productcode: m.productcode ?? '',
          movement: m.quantity,
          stockAfter: m.stockafter ?? 0,
          stockBefore: m.stockbefore ?? 0,
        }));
        setKardexMovements(movements);
      }
      setShowKardexModal(true);
    } catch (error) {
      console.error("Erro ao buscar Kardex", error);
      setKardexMovements([]);
      setKardexError(
        "Não foi possível carregar as movimentações do produto. Tente novamente."
      );
      setShowKardexModal(true);
    } finally {
      setLoadingKardex(false);
    }
  }, []);

  const handleContextMenu = (e: React.MouseEvent, product: Products) => {
    e.preventDefault();
    
    if (!hasMenuPermission) return;

    setSelectedProduct(product);

    setContextMenu({
      show: true,
      position: { x: e.clientX, y: e.clientY },
      product,
    });
  };

  const handleProductClick = (product: Products) => {
    setSelectedProduct(product);
    setContextMenu({ show: false, position: { x: 0, y: 0 }, product: null });
  };

  const handleContextMenuAction = (action: string) => {
    const product = contextMenu.product;
    if (!product) return;

    switch (action) {
      case "edit":
        if (!canEditProduct) break;
        handleEditProduct(product);
        break;
      case "kardex":
        if (!canViewKardex) break;
        openKardexModal(product);
        break;
      case "photo":
        alert(`Visualizar foto de: ${product.name}`);
        break;
      case "address":
        setLocationProduct(product);
        setShowLocationModal(true);
        break;
      case "report":
        alert(`Gerando relatório para: ${product.name}`);
        break;
    }
    setContextMenu({ show: false, position: { x: 0, y: 0 }, product: null });
  };

  useEffect(() => {
    const isElectron = Boolean(window.ipcRenderer);

    if (isElectron) {
      const ipcRenderer = window.ipcRenderer!;

      const handleF4Shortcut = () => {
        if (selectedProduct && canViewKardex) {
          openKardexModal(selectedProduct);
        }
      };

      ipcRenderer.on('global-shortcut-f4', handleF4Shortcut);

      return () => {
        ipcRenderer.removeListener('global-shortcut-f4', handleF4Shortcut);
      };
    } else {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "F4" && selectedProduct && canViewKardex) {
          e.preventDefault();
          openKardexModal(selectedProduct);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [selectedProduct, openKardexModal, canViewKardex]);

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
      String(product.name || "").toLowerCase().includes(filters.name.toLowerCase());

    const brandMatch = !filters.brand ||
      String(product.brand || "").toLowerCase().includes(filters.brand.toLowerCase());

    const locationMatch = !filters.location ||
      String(product.location || "").toLowerCase().includes(filters.location.toLowerCase());

    return codeMatch && nameMatch && brandMatch && locationMatch;
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await listProducts();
      if (!response.ok || !response.data) {
        setItem([]);
        setLoadError(response.error || "Não foi possível carregar os produtos.");
        return;
      }
      setItem(response.data);
    } catch (error) {
      console.error("Erro ao recuperar a lista de produtos.", error);
      setItem([]);
      setLoadError("Não foi possível carregar os produtos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleEditProduct = (product: Products) => {
    setCurrentData(product)
    setOpenEdit(true)
  }

  const handleCloseEditModal = async () => {
    setOpenEdit(false)
    await fetchProducts()
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
          {hasMenuPermission && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e, product);
              }}
              title="Menu de opções"
              className="p-2  hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-gray-600" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Dashboard>
      <div className="w-full flex flex-col items-center m-auto p-4">
        {
          <div className="max-w-screen mx-auto">
            <div className="mb-8 flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Produtos</h1>
              {/* Indicador de produto selecionado */}
              {selectedProduct && hasMenuPermission && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                  <p className="text-xs text-blue-600 font-medium">
                    Selecionado: <span className="font-bold">{selectedProduct.name}</span>
                    <span className="text-blue-400 ml-2">(Pressione F4 para Kardex)</span>
                  </p>
                </div>
              )}
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

                  {canCreateProduct && (
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
            <DynamicTable
              data={filteredProducts}
              columns={columns}
              loading={loading}
              error={loadError}
              onRetry={fetchProducts}
              handleProductClick={handleProductClick}
              handleContextMenu={handleContextMenu}
              emptyMessage="Não há dados disponíveis."
              emptyDescription={hasActiveFilters
                ? "Nenhum produto corresponde aos filtros informados."
                : "Cadastre seu primeiro produto para começar."}
              selectedProduct={selectedProduct}
            />
          </div>
        }
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
                    await fetchProducts()
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

      {/* Context Menu - Só renderiza se tiver permissão */}     
        {hasMenuPermission && (
          <ContextMenu
            show={contextMenu.show}
            position={contextMenu.position}
            product={contextMenu.product}
            handleContextMenuAction={handleContextMenuAction}
            closeContextMenu={() => setContextMenu({ show: false, position: { x: 0, y: 0 }, product: null })}
            canEdit={canEditProduct}
            canViewKardex={canViewKardex}
            canEditAddress={canEditProduct}
          />
        )}
      {/* Kardex Modal */}
      <KardexModal
        show={showKardexModal}
        closeModal={() => setShowKardexModal(false)}
        product={kardexProduct}
        movements={kardexMovements}
        loading={loadingKardex}
        error={kardexError}
        onRetry={
          kardexProduct
            ? () => {
                void openKardexModal(kardexProduct);
              }
            : undefined
        }
      />

      {/* Location Modal */}
      <LocationModal
        show={showLocationModal}
        product={locationProduct}
        onClose={() => {
          setShowLocationModal(false);
          setLocationProduct(null);
        }}
      />
    </Dashboard>
  );
};

export default SearchProducts;
