import React from 'react'
import { MapPin, Search } from 'lucide-react';
import { Products } from '../../../../service/interfaces/stock/products';

interface ProductTableProps {
    products: Products[];
    selectedProduct: Products | null;
    handleProductClick: (product: Products) => void;
    handleContextMenu: (e: React.MouseEvent, product: Products) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, selectedProduct, handleProductClick, handleContextMenu }) => {
    return (
        <div className="bg-white w-full items-center m-auto rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ height: "calc(100vh - 400px)", minHeight: "500px" }}>
            <div className="overflow-x-auto h-full">
                <table className="h-full w-full">
                    <thead className="bg-slate-800 text-white sticky top-0">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Código</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Nome</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Descrição</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Marca</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Fornecedor</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Categoria</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Preço</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Estoque</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Localização</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="w-8 h-8 text-gray-400" />
                                        <p className="font-medium">Nenhum produto encontrado</p>
                                        <p className="text-sm">Tente ajustar os filtros de busca</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr
                                    key={product.id}
                                    onClick={() => handleProductClick(product)}
                                    onContextMenu={(e) => handleContextMenu(e, product)}
                                    className={`border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                                        selectedProduct?.id === product.id ? 'bg-slate-50 border-slate-300' : ''
                                    }`}
                                    style={{ userSelect: 'none' }}
                                >
                                    <td className="px-4 py-2">
                                        <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-medium">
                                            {product.code}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 font-semibold text-sm text-gray-900">{product.name}</td>
                                    <td className="px-4 py-2 text-xs text-gray-700 max-w-xs truncate">{product.description}</td>
                                    <td className="px-4 py-2 text-sm text-gray-700">{product.brand}</td>
                                    <td className="px-4 py-2 text-sm text-gray-700">{product.supplier_id}</td>
                                    <td className="px-4 py-2">
                                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 font-bold text-sm text-slate-800">R$ {product.price}</td>
                                    <td className="px-4 py-2 font-semibold text-sm text-gray-900">{product.stock}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <MapPin className="w-3 h-3" />
                                            <span className="text-xs">{product.location}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductTable;
