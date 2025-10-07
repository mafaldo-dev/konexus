import { useProductManagement } from '../../../hooks/_manager/useProductManagement';
import { ProductsProps } from '../../../service/interfaces';

interface Props {
    product: ProductsProps[];
    setProduct: React.Dispatch<React.SetStateAction<ProductsProps[]>>;
}

const ProductTable: React.FC<Props> = ({ product, setProduct }) => {
    const {
        productCode,
        setProductCode,
        addedProduct,
        count,
        setCount,
        price,
        setPrice,
        handleProduct,
        handleAddProduct
    } = useProductManagement(setProduct);

    return (
        <section className="w-full">
            <h2 className="text-xl text-center font-semibold text-gray-700 border-b pb-2 mb-4">Produtos da Nota</h2>

            <div className="overflow-x-auto rounded-md border border-gray-300 mb-6">
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="text-sm font-semibold mb-3 text-gray-700">Adicionar novo produto</h3>

                    <div className="flex flex-col md:flex-row items-end gap-4 mb-4">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">Código do Produto</label>
                            <div className="flex">
                                <input
                                    type="text"
                                    defaultValue={productCode}
                                    onChange={(e) => setProductCode(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleProduct()}
                                    className="w-full p-1 border rounded-l-md border-gray-300 text-sm"
                                    placeholder="Digite o código"
                                />
                                <button
                                    type="button"
                                    onClick={handleProduct}
                                    className="bg-slate-800 text-white px-3 cursor-pointer text-sm rounded-r-md hover:bg-blue-600"
                                >
                                    Buscar
                                </button>
                            </div>
                        </div>
                    </div>

                    {addedProduct && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mb-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Produto</label>
                                <p className="text-sm">{addedProduct.name}</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Tipo</label>
                                <p className="text-sm">{addedProduct.description}</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Estoque</label>
                                <p className="text-sm">{addedProduct.stock}</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Valor</label>
                                <p className="text-sm">{addedProduct.price}</p>
                            </div>
                        </div>
                    )}

                    {addedProduct && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Quantidade</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={count}
                                    onChange={(e) => setCount(Number(e.target.value))}
                                    className="w-full p-1 border rounded-md border-gray-300 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Preço unitário</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    className="w-full p-1 border rounded-md border-gray-300 text-sm"
                                />
                            </div>
                            <div className="col-span-full">
                                <button
                                    type="button"
                                    onClick={handleAddProduct}
                                    className="mt-2 w-full bg-slate-700 text-white py-1 rounded-md text-sm hover:bg-cyan-700"
                                >
                                    Incluir produto
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2">Codigo</th>
                            <th className="px-4 py-2">Produto</th>
                            <th className="px-4 py-2">Endereço</th>
                            <th className="px-4 py-2">Preço Unitário</th>
                            <th className="px-4 py-2">Quantidade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {product.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-4 text-gray-400 italic">Nenhum produto adicionado.</td>
                            </tr>
                        ) : (
                            product.map((p, index) => (
                                <tr key={index} className="border-t">
                                    <td className="px-4 py-2">{p.code}</td>
                                    <td className="px-4 py-2">{p.product_name}</td>
                                    <td className="px-4 py-2">{p.location}</td>
                                    <td className="px-4 py-2">R$ {p.price}</td>
                                    <td className="px-4 py-2">{p.quantity}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex justify-center">
                <button
                    type="submit"
                    className="bg-slate-800 hover:bg-slate-400 cursor-pointer text-white font-medium py-2 px-6 rounded-md transition-colors"
                    disabled={product.length === 0}
                >
                    Finalizar Nota Fiscal
                </button>
            </div>
        </section>
    );
};

export default ProductTable;
