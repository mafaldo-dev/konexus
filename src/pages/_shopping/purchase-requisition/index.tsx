import { useState, useEffect } from 'react';
import { ShoppingCart, Plus } from 'lucide-react';

import ProductsTable from './components/TableProducts';
import SupplierFilter from './components/FilterSuppliers';
import PurchaseRequestForm from './components/SolicitationForm';

import { getAllProducts } from '../../../service/api/products';
import { getAllSuppliers } from '../../../service/api/suppliers/supplier';

import { Products } from '../../../service/interfaces/products';
import { Supplier } from '../../../service/interfaces/suppliers';
import Dashboard from '../../../components/dashboard';
import QuotationsList, { PurchaseRequest } from '../_quotes';

export default function PurchaseManagementScreen() {
  const [activeTab, setActiveTab] = useState<'stock' | 'request' | 'quote'>('stock');
  const [products, setProducts] = useState<Products[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedProducts, setSelectedProducts] = useState<Products[]>([]);
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');

    const [quotations] = useState<PurchaseRequest[]>([
    {
      requestNumber: 'REQ-1001',
      supplierName: 'Fornecedor ABC',
      deliveryDate: '2025-07-10',
      requestDate: '2025-07-01',
      totalAmount: 1234.56,
      status: 'pending',
      products: [
        { productName: 'Produto A', quantity: 2, price: 100.0, totalPrice: 200.0 },
        { productName: 'Produto B', quantity: 1, price: 1034.56, totalPrice: 1034.56 },
      ],
      notes: 'Urgente, entregar até o dia 10.',
    },
    {
      requestNumber: 'REQ-1002',
      supplierName: 'Fornecedor XYZ',
      deliveryDate: '2025-07-15',
      requestDate: '2025-07-05',
      totalAmount: 500.0,
      status: 'approved',
      products: [
        { productName: 'Produto C', quantity: 5, price: 100, totalPrice: 500 },
      ],
      notes: '',
    },
  ]);

  const handlePreview = (quotation: PurchaseRequest) => {
    alert(`Visualizando cotação: ${quotation.requestNumber}\nFornecedor: ${quotation.supplierName}`);
  };


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const productsData = await getAllProducts();
      const suppliersData = await getAllSuppliers();
      setProducts(productsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtra os produtos com estoque baixo (quantidade <= 10 por exemplo)
  const lowStockThreshold = 10;
  const lowStockProducts = products.filter((product) => {
    const isLowStock = product.quantity <= lowStockThreshold;

    const matchesSearch =
      !searchTerm ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSupplier =
      !selectedSupplier || product.supplier === selectedSupplier;

    return isLowStock && matchesSearch && matchesSupplier;
  });

  const toggleProductSelection = (product: Products, selected: boolean) => {
    setSelectedProducts((prev) =>
      selected ? [...prev, product] : prev.filter((p) => p.id !== product.id)
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSupplier('');
  };

  const handleCreateRequest = async (requestData: any) => {
    setIsLoading(true);
    try {
      setSelectedProducts([]);
      setActiveTab('stock');
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    } catch (error) {
      console.error('Error creating request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Funções para mudar as abas
  const goToRequestTab = () => setActiveTab('request');
  const goToQuoteTab = () => setActiveTab('quote');

  // Funções para os botões da tabela de cotações
  const handlePreviewQuotation = (id: string) => {
    alert(`Visualizar cotação ${id} (implemente modal ou página)`);
  };

  const handleDownloadQuotation = (id: string) => {
    alert(`Baixar cotação ${id} (implemente exportação PDF)`);
  };



  return (
    <Dashboard>
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-100 px-6 py-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Compra - Solicitações</h1>
          <p className="text-sm text-slate-500">Controle de quantidade e Solicitações de compra</p>
        </div>
        <ShoppingCart size={32} className="text-slate-600" />
      </div>

      <div className="px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('stock')}
            className={`pb-2 border-b-2 text-sm font-medium ${activeTab === 'stock'
                ? 'border-slate-600 text-slate-700'
                : 'border-transparent text-slate-400'
              }`}
          >
            Baixo estoque
            {lowStockProducts.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                {lowStockProducts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('request')}
            className={`pb-2 border-b-2 text-sm font-medium ${activeTab === 'request'
                ? 'border-slate-600 text-slate-700'
                : 'border-transparent text-slate-400'
              }`}
          >
            Nova requisição
            {selectedProducts.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {selectedProducts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('quote')}
            className={`pb-2 border-b-2 text-sm font-medium ${activeTab === 'quote'
                ? 'border-slate-600 text-slate-700'
                : 'border-transparent text-slate-400'
              }`}
          >
            Cotações
            {quotations.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                {quotations.length}
              </span>
            )}
          </button>
        </div>

        {/* Tabs content */}
        {activeTab === 'stock' ? (
          <>
            <SupplierFilter
              suppliers={suppliers}
              selectedSupplier={selectedSupplier}
              onChangeSupplier={setSelectedSupplier}
              searchTerm={searchTerm}
              onChangeSearch={setSearchTerm}
              onClearFilters={clearFilters}
            />
            <ProductsTable
              products={lowStockProducts}
              selectedProducts={selectedProducts}
              onToggleProduct={toggleProductSelection}
              isLoading={isLoading}
            />
            {selectedProducts.length > 0 && (
              <button
                onClick={goToRequestTab}
                className="fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 rounded-full bg-slate-700 text-white shadow-lg hover:bg-slate-800 transition"
                title="Criar Solicitação"
              >
                <Plus size={24} />
              </button>
            )}
          </>
        ) : activeTab === 'request' ? (
          <PurchaseRequestForm
            suppliers={suppliers}
            predefinedProducts={selectedProducts.map((p) => ({
              ...p,
              id: p.id ?? '',
              name: p.name,
              price: p.price ?? 0,
              minimum_stock: p.minimum_stock,
              quantity: p.quantity,
            }))}
            onSubmit={handleCreateRequest}
            isLoading={isLoading}
          />
        ) : (
          // Aba Cotações
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">Lista de Cotações</h2>
            <QuotationsList
              quotations={quotations}
              onPreview={(cotacao) => console.log('Abrir modal para:', cotacao)}
            />
          </div>
        )}
      </div>

      {/* Snackbar */}
      {showSnackbar && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded shadow-lg z-50 animate-slide-in-out">
          Solicitação de compra finalizada
        </div>
      )}
    </Dashboard>
  );
}
