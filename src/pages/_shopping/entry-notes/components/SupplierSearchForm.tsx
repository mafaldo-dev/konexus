import { useOrderSearch } from '../../../../hooks/_manager/useOrderPurchase';
import { UseFormSetValue } from 'react-hook-form';

interface SupplierSearchFormProps {
  setValue: UseFormSetValue<any>;
}

export default function SupplierSearchForm({ setValue }: SupplierSearchFormProps) {
  const { orderByCode, setOrderByCode, handleOrderByCode, order } = useOrderSearch(setValue);
    return (
        <div className="flex items-center gap-2 mb-6">
            <input
                type="text"
                value={orderByCode}
                onChange={(e) => setOrderByCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleOrderByCode()}
                placeholder='Numero do pedido (ex: OC-07)'
                className="flex-1 p-2 border border-gray-300 rounded-lg"
            />
            <button
                type="button"
                onClick={handleOrderByCode}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 cursor-pointer rounded-lg transition-colors"
            >
                Buscar pedido
            </button>
            
            {/* Debug: mostrar que encontrou o pedido */}
            {order && (
                <div className="text-sm text-green-600 ml-4">
                    ✓ Pedido {order.orderNumber} carregado
                </div>
            )}
        </div>
    );
}