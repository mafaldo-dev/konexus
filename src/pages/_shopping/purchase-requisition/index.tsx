import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Plus } from 'lucide-react';
import { Products } from '../../../types';

import ProductsTable from './components/TableProducts';
import SupplierFilter from './components/FilterSuppliers';
import PurchaseOrderForm from './components/SolicitationForm';
import QuotationsList from '../_quotes/index';

import Dashboard from "../../../components/dashboard/Dashboard";
import { DataState, DataStateVariant } from '../../../components/ui/DataState';
import { getResponseDataState } from '../../../api/responseState';
import { usePurchaseData } from '../../../hooks/_manager/usePurchaseData';
import { useSearchFilter } from '../../../hooks/_manager/useSearchFilter';
import ReturnsPage from '../returns';
import { listPurchaseOrders, createPurchaseOrder } from '../../../services/purchaseService';
import { useAuth } from '../../../AuthContext';
import Swal from 'sweetalert2';

export default function PurchaseManagementScreen() {
  const { hasPermission } = useAuth();
  const canCreatePurchase = hasPermission('compras', 'create');
  const canViewReturns = hasPermission('compras', 'view');
  const [activeTab, setActiveTab] = useState<'stock' | 'request' | 'quote' | 'returns'>('stock');
  const {
    products,
    suppliers,
    isLoading,
    error: purchaseDataError,
    refetch: refetchPurchaseData,
  } = usePurchaseData();
  const [selectedProducts, setSelectedProducts] = useState<Products[]>([]);
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [quotations, setQuotations] = useState<any[]>([]);
  const [quotationsError, setQuotationsError] = useState<string | null>(null);
  const [quotationsErrorVariant, setQuotationsErrorVariant] =
    useState<DataStateVariant>("error");
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false); // ✅ NOVO

  const fetchQuotations = async () => {
    try {
      setQuotationsError(null);
      setQuotationsErrorVariant("error");
      const response = await listPurchaseOrders()
      if (!response.ok || !response.data) {
        setQuotations([])
        setQuotationsError(response.error || "Não foi possível carregar as solicitações de compra.")
        setQuotationsErrorVariant(getResponseDataState(response));
        return
      }
      setQuotations(response.data)
    } catch (error) {
      console.error('❌ Erro ao buscar cotações:', error);
      setQuotations([]);
      setQuotationsError("Não foi possível carregar as solicitações de compra. Tente novamente.")
      setQuotationsErrorVariant("error");
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []); 

  const lowStockThreshold = 10;
  
  const lowStock = useMemo(() => {
    return products.filter((product) => product.stock <= lowStockThreshold);
  }, [products]);

  const filteredLowStock = useSearchFilter(lowStock, searchTerm, ['name', 'code']);

  const lowStockProducts = useMemo(() => {
    return filteredLowStock.filter(product => 
      !selectedSupplier || product.supplier_id === selectedSupplier
    );
  }, [filteredLowStock, selectedSupplier]);

  const toggleProductSelection = (product: Products, selected: boolean) => {
    setSelectedProducts((prev) =>
      selected ? [...prev, product] : prev.filter((p) => p.id !== product.id)
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSupplier('');
  };
  const handleCreateRequest = async (requestData: any): Promise<string> => {    setIsCreatingOrder(true);
    
    try {
      
      const response = await createPurchaseOrder(requestData);
      if (!response.ok || !response.data) throw new Error(response.error || "Erro ao criar pedido de compra")
      const orderId = response.data.id;

      await fetchQuotations()
      
      setSelectedProducts([]);
      setActiveTab('quote'); 
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
      
      return String(orderId);
    } catch (error: any) {
      console.error('❌ Erro ao criar pedido:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro ao criar pedido',
        text: error.message || 'Tente novamente mais tarde'
      });
      throw error;
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const goToRequestTab = () => setActiveTab('request');

  const handlePreviewQuotation = (quotation: any) => {
    console.info("Visualizar pedido:", quotation);
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
          <button onClick={() => setActiveTab('stock')} className={`pb-2 border-b-2 text-sm font-medium ${activeTab === 'stock' ? 'border-slate-600 text-slate-700' : 'border-transparent text-slate-400'}`}>
            Baixo estoque
            {lowStockProducts.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                {lowStockProducts.length}
              </span>
            )}
          </button>

          {canCreatePurchase && (
            <button onClick={() => setActiveTab('request')} className={`pb-2 border-b-2 text-sm font-medium ${activeTab === 'request' ? 'border-slate-600 text-slate-700' : 'border-transparent text-slate-400'}`}>
              Nova requisição
              {selectedProducts.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  {selectedProducts.length}
                </span>
              )}
            </button>
          )}

          <button onClick={() => setActiveTab('quote')} className={`pb-2 border-b-2 text-sm font-medium ${activeTab === 'quote' ? 'border-slate-600 text-slate-700' : 'border-transparent text-slate-400'}`}>
            Cotações
            {quotations.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                {quotations.length}
              </span>
            )}
          </button>

          {canViewReturns && (
            <button onClick={() => setActiveTab('returns')} className={`pb-2 border-b-2 text-sm font-medium ${activeTab === 'returns' ? 'border-slate-600 text-slate-700' : 'border-transparent text-slate-400'}`}>
              Devoluções
            </button>
          )}
        </div>

        {/* Tabs content */}
        {purchaseDataError ? (
          <DataState
            variant="error"
            description={purchaseDataError.message}
            onAction={refetchPurchaseData}
          />
        ) : (
          <>
        {activeTab === 'stock' && (
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
            {canCreatePurchase && selectedProducts.length > 0 && (
              <button
                onClick={goToRequestTab}
                className="fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 rounded-full bg-slate-700 text-white shadow-lg hover:bg-slate-800 transition"
                title="Criar Solicitação"
              >
                <Plus size={24} />
              </button>
            )}
          </>
        )}

        {activeTab === 'request' && canCreatePurchase && (
          <PurchaseOrderForm
            supplierData={suppliers}
            onSubmitOrder={handleCreateRequest}
            isLoading={isCreatingOrder} 
          />
        )}

        {activeTab === 'returns' && (
          <ReturnsPage  />
        )}

        {activeTab === 'quote' && (
          <QuotationsList 
            quotations={quotations} 
            onPreview={handlePreviewQuotation}
            error={quotationsError}
            errorVariant={quotationsErrorVariant}
            onRetry={fetchQuotations}
            onUpdate={fetchQuotations}
          />
        )}
          </>
        )}
      </div>

      {/* Snackbar */}
      {showSnackbar && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded shadow-lg z-50 animate-slide-in-out">
          Pedido criado com sucesso!
        </div>
      )}
    </Dashboard>
  );
}