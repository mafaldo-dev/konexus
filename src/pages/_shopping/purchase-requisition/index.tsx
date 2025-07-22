import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Plus } from 'lucide-react';
import { Products, PurchaseRequest } from '../../../service/interfaces';

import ProductsTable from './components/TableProducts';
import SupplierFilter from './components/FilterSuppliers';
import PurchaseRequestForm from './components/SolicitationForm';

import Dashboard from "../../../components/dashboard/Dashboard";

import { usePurchaseData } from '../../../hooks/_manager/usePurchaseData';

import { useSearchFilter } from '../../../hooks/_manager/useSearchFilter';

import DanfeTemplate from '../../../utils/invoicePdf/pdfGenerator';
import { mapPurchaseRequestToNota } from '../../../utils/invoicePdf/generateQuotationPdf';
import { renderToStaticMarkup } from 'react-dom/server';
import { purchaseAllOrders } from '../../../service/api/Administrador/purchaseRequests';
import ReturnsPage from '../returns';


export default function PurchaseManagementScreen() {
  const [activeTab, setActiveTab] = useState<'stock' | 'request' | 'quote' | 'returns'>('stock');
  const { products, suppliers, isLoading } = usePurchaseData();
  const [selectedProducts, setSelectedProducts] = useState<Products[]>([]);
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');

  const [quotations, setQuotations] = useState<PurchaseRequest[]>([]);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const data = await purchaseAllOrders();
        setQuotations(data);
      } catch (error) {
        console.error('Error fetching quotations:', error);
      }
    };
    fetchQuotations();
  }, []);

  // const handlePreview = (quotation: PurchaseRequest) => {
  //   setSelectedQuotation(quotation);
  //   setShowPreviewModal(true);
  // };


  // Filtra os produtos com estoque baixo (quantidade <= 10 por exemplo)
  const lowStockThreshold = 10;

  // Primeiro, filtra os produtos com baixo estoque
  const lowStock = useMemo(() => {
    return products.filter((product) => product.quantity <= lowStockThreshold);
  }, [products]);

  // Depois, aplica o hook de filtro de busca corretamente no topo
  const filteredLowStock = useSearchFilter(lowStock, searchTerm, ['name', 'code']);

  // Agora, aplica o filtro por fornecedor com useMemo
  const lowStockProducts = useMemo(() => {
    return filteredLowStock.filter(product => !selectedSupplier || product.supplier === selectedSupplier);
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

  const handleCreateRequest = async (requestData: any) => {
    try {
      setSelectedProducts([]);
      setActiveTab('stock');
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

   const goToRequestTab = () => setActiveTab('request');

  const renderPdfToNewWindow = (quotation: PurchaseRequest) => {
    const nota = mapPurchaseRequestToNota(quotation);
    const htmlContent = renderToStaticMarkup(<DanfeTemplate nota={nota} 
      onDownloadComplete={() => {}} />);

    const newWindow = window.open();
    if (newWindow) {
      // Copy stylesheets from the main window to the new window
      const stylesheets = Array.from(document.styleSheets)
        .map((styleSheet) => {
          try {
            // Ensure the href is accessible and construct the link tag
            return styleSheet.href ? `<link rel="stylesheet" href="${styleSheet.href}">` : '';
          } catch (e) {
            // Catch potential security errors when accessing cross-origin stylesheets
            console.warn('Could not read stylesheet href:', e);
            return '';
          }
        })
        .join('\n');

      newWindow.document.write(`
        <html>
          <head>
            <title>Visualização de Cotação</title>
            ${stylesheets}
            <style>
              /* Additional styles for printing and layout */
              body { margin: 0; background-color: #f0f2f5; }
              .danfe-container {
                width: 210mm;
                min-height: 297mm;
                margin: 20px auto; /* Center the content */
                background-color: white;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
              @media print {
                /* Styles for when the user prints the page */
                body { background-color: white; }
                .danfe-container { margin: 0; box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <div class="danfe-container">
              ${htmlContent}
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
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

          <button
            onClick={() => setActiveTab('returns')}
            className={`pb-2 border-b-2 text-sm font-medium ${activeTab === 'returns'
              ? 'border-slate-600 text-slate-700'
              : 'border-transparent text-slate-400'
              }`}
          >
            Devoluções
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
        ) : activeTab === 'returns' ? (
          <ReturnsPage />
        ) : (
          // Aba Cotações
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Cotações Realizadas</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white text-sm border border-slate-200 rounded">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="text-left py-3 px-4">Nº Requisição</th>
                    <th className="text-left py-3 px-4">Solicitante</th>
                    <th className="text-left py-3 px-4">Fornecedor</th>
                    <th className="text-left py-3 px-4">Data</th>
                    <th className="text-left py-3 px-4">Entrega Prevista</th>
                    <th className="text-right py-3 px-4">Valor Total</th>
                    <th className="text-center py-3 px-4">Status</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q) => (
                    <tr key={q.requestNumber} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">{q.requestNumber}</td>
                      <td className="py-3 px-4">{q.companyData.company_name || '---'}</td>
                      <td className="py-3 px-4">{q.companyData?.company_name || '---'}</td>
                      <td className="py-3 px-4">{new Date(q.requestDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{new Date(q.deliveryDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        R${q.products.reduce((total, item) => total + item.total_price, 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${q.status === 'pending'
                              ? 'bg-yellow-50 text-yellow-700'
                              : q.status === 'approved'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-green-50 text-green-700'
                            }`}
                        >
                          {q.status === 'pending'
                            ? 'Pendente'
                            : q.status === 'approved'
                              ? 'Aprovada'
                              : 'Concluída'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => renderPdfToNewWindow(q)}
                          className="bg-slate-800 text-white text-xs px-3 py-1 rounded hover:bg-blue-700 transition"
                        >
                          Visualizar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
