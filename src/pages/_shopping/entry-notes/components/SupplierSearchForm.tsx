import { useSupplierSearch } from '../../../../hooks/useSupplierSearch';
import { UseFormSetValue } from 'react-hook-form';

interface SupplierSearchFormProps {
    setValue: UseFormSetValue<any>;
}

export default function SupplierSearchForm({ setValue }: SupplierSearchFormProps) {
    const { supplierCode, setSupplierCode, handleSupplier } = useSupplierSearch(setValue);

    return (
        <div className="flex items-center gap-2 mb-6">
            <input
                type="text"
                value={supplierCode}
                onChange={(e) => setSupplierCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSupplier()}
                placeholder='Código do fornecedor'
                className="flex-1 p-2 border border-gray-300 rounded-lg"
            />
            <button
                type="button"
                onClick={handleSupplier}
                className="bg-blue-500 text-white px-4 py-2 cursor-pointer rounded-lg hover:bg-blue-600"
            >
                Buscar Fornecedor
            </button>
        </div>
    );
}