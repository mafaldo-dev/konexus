import React, { useState, useEffect } from 'react';
import { Search, Check, X, PackageCheck, PackageX, ChevronDown, Filter } from 'lucide-react';

interface ReturnItem {
  id: string;
  productId: string;
  name: string;
  originalQuantity: number;
  returnQuantity: number;
  selected: boolean;
  reason?: string;
}

interface OriginalInvoice {
  id: string;
  number: string;
  supplier: string;
  date: string;
  items: ReturnItem[];
}

const ReturnsPage: React.FC = () => {
  const [originalInvoice, setOriginalInvoice] = useState<OriginalInvoice | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOriginalInvoice = async (invoiceNumber: string) => {
    try {
      setIsLoading(true);
      setError(null);
      // Mock API call - replace with actual implementation
      const mockResponse: OriginalInvoice = {
        id: 'inv-123',
        number: invoiceNumber,
        supplier: 'Fornecedor Exemplo Ltda',
        date: '2023-05-15',
        items: [
          { id: 'item-1', productId: 'prod-001', name: 'Notebook Dell XPS 15', originalQuantity: 5, returnQuantity: 5, selected: true },
          { id: 'item-2', productId: 'prod-002', name: 'Mouse Sem Fio Logitech', originalQuantity: 10, returnQuantity: 3, selected: true },
          { id: 'item-3', productId: 'prod-003', name: 'Teclado Mecânico RGB', originalQuantity: 8, returnQuantity: 0, selected: false },
        ],
      };
      
      setOriginalInvoice(mockResponse);
      setReturnItems(mockResponse.items);
    } catch (err) {
      setError('Erro ao buscar nota fiscal');
      console.error('Failed to fetch invoice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchOriginalInvoice(searchQuery);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setReturnItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const updateReturnQuantity = (itemId: string, quantity: number) => {
    setReturnItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, returnQuantity: Math.min(Math.max(0, quantity), item.originalQuantity) }
          : item
      )
    );
  };

  const handleReturnSubmit = () => {
    const selectedReturns = returnItems.filter(item => item.selected && item.returnQuantity > 0);
    
    if (selectedReturns.length === 0) {
      setError('Selecione pelo menos um item para devolução');
      return;
    }

    // Process return logic here
    console.log('Processing return:', selectedReturns);
    alert(`Devolução registrada para ${selectedReturns.length} itens`);
  };

  const calculateTotalReturns = () => {
    return returnItems
      .filter(item => item.selected)
      .reduce((sum, item) => sum + item.returnQuantity, 0);
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PackageX className="text-red-500" />
            Gestão de Devoluções
          </h1>
        </div>

        {/* Search Section */}
        <div className="mb-8 p-4 border border-blue-100 rounded-lg bg-blue-50">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <label className="block font-medium flex items-center gap-2">
              <Search className="text-blue-600" />
              Buscar Nota Fiscal para Devolução
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Digite o número da NF ou chave de acesso"
                className="flex-1 border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-600 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Return Items Section */}
        {originalInvoice && (
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold">
                Nota Fiscal: {originalInvoice.number}
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                <span>Fornecedor: {originalInvoice.supplier}</span>
                <span>
                  Data: {new Date(originalInvoice.date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={returnItems.every(item => item.selected)}
                        onChange={() => {
                          const allSelected = returnItems.every(item => item.selected);
                          setReturnItems(prevItems =>
                            prevItems.map(item => ({ ...item, selected: !allSelected }))
        )}}
                        className="h-4 w-4 text-slate-900 rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantidade Original
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantidade Devolvida
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motivo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {returnItems.map((item) => (
                    <tr key={item.id} className={!item.selected ? 'opacity-50' : ''}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleItemSelection(item.id)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">Cód: {item.productId}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {item.originalQuantity}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          max={item.originalQuantity}
                          value={item.returnQuantity}
                          onChange={(e) =>
                            updateReturnQuantity(item.id, parseInt(e.target.value) || 0)
                          }
                          disabled={!item.selected}
                          className="w-20 border rounded px-2 py-1 disabled:bg-gray-100"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <select
                          disabled={!item.selected}
                          className="border rounded px-2 py-1 disabled:bg-gray-100"
                        >
                          <option>Produto avariado</option>
                          <option>Produto errado</option>
                          <option>Excesso de quantidade</option>
                          <option>Outro</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                Total de itens selecionados: {calculateTotalReturns()}
              </div>
              <div className="space-x-3  flex">
                <button
                  onClick={() => {
                    setOriginalInvoice(null);
                    setReturnItems([]);
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReturnSubmit}
                  className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-600"
                >
                  <PackageCheck className="w-5 h-5" />
                  Confirmar Devolução
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnsPage;