import { UseFormSetValue } from 'react-hook-form';
import { PurchaseOrder } from '../../../../service/interfaces';

interface SupplierSearchFormProps {
    setValue: UseFormSetValue<any>;
    orderByCode: string;
    setOrderByCode: (value: string) => void;
    handleOrderByCode: () => void;
    isLoading: boolean;
    order?: PurchaseOrder | null;
}

export default function SupplierSearchForm({ 
    setValue, 
    orderByCode, 
    setOrderByCode, 
    handleOrderByCode,
    isLoading,
    order 
}: SupplierSearchFormProps) {
    
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
                Buscar Pedido de Compra Existente
            </h3>
            
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={orderByCode}
                    onChange={(e) => setOrderByCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleOrderByCode()}
                    placeholder='Número do pedido (ex: OC-07)'
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                />
                <button
                    type="button"
                    onClick={handleOrderByCode}
                    disabled={isLoading || !orderByCode.trim()}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                            Buscando...
                        </>
                    ) : (
                        'Buscar pedido'
                    )}
                </button>
            </div>

            {/* Status de sucesso */}
            {order && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                    <div className="bg-green-100 text-green-800 px-3 py-2 rounded-md flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        <span className="font-medium">Pedido {order.orderNumber} carregado</span>
                    </div>
                    <div className="text-gray-600">
                        <span className="font-semibold">Fornecedor:</span> {order.supplier?.name || 'N/A'}
                    </div>
                    <div className="text-gray-600">
                        <span className="font-semibold">Produtos:</span> {order.orderItems?.length || 0}
                    </div>
                </div>
            )}
        </div>
    );
}