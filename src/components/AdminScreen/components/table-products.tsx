import { useEffect, useState } from 'react';

import { getAllProducts } from '../../../service/api/products';
import { Products } from '../../../service/interfaces';

const LoadingSpinner = () => (
    <div className="px-4 py-5 sm:p-6 text-center">
        <svg
            className="animate-spin h-8 w-8 mx-auto text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"      
                strokeWidth="4"
            ></circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
        <p className="mt-2 text-sm text-gray-500">Loading products...</p>
    </div>
);

const ErrorMessage = ({ error }: { error: string }) => (
    <div className="px-4 py-5 sm:p-6">
        <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg
                        className="h-5 w-5 text-red-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
            </div>
        </div>
    </div>
);

const ProductRow = ({ product }: { product: Products }) => (
    <tr key={product.id}>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {product.code}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {product.name}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.quantity <= 5
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                }`}
            >
                {product.quantity}
            </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
            {product.description}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            R$ {product.price}
        </td>
    </tr>
);

const NoProductsRow = () => (
    <tr>
        <td
            colSpan={6}
            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
        >
            Nenhum produto encontrado
        </td>
    </tr>
);


export default function TableProducts() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [products, setProducts] = useState<Products[]>([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await getAllProducts();
                setProducts(response);
            } catch (err) {
                setError('Erro ao recuperar produtos.');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const productsWithLowStock = products.filter((product) => product.quantity <= 10);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage error={error} />;

    return (
        <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Codigo</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quant</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {productsWithLowStock.length > 0 ? (
                            productsWithLowStock.map((product) => (
                                <ProductRow key={product.id} product={product} />
                            ))
                        ) : (
                            <NoProductsRow />
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}