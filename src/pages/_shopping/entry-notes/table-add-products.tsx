import { useState } from 'react';
import { handleProductWithCode } from '../../../service/api/products';
import { Products } from '../../../service/interfaces/products';
import { ProductsProps } from '../../../service/interfaces/productsProps';


interface Props {
    product: ProductsProps[];
    setProduct: React.Dispatch<React.SetStateAction<ProductsProps[]>>;
}

const TableAddeProductInvoice: React.FC<Props> = ({ product, setProduct }) => {
    const [productCode, setProductCode] = useState<string>("");
    const [addedProduct, setAddedProduct] = useState<Products | null>(null);
    const [count, setCount] = useState(0);
    const [price, setPrice] = useState(0);

    const handleProduct = async () => {
        if (!productCode) return;

        try {
            const productData = await handleProductWithCode(Number(productCode));
            if (productData) {
                setAddedProduct(productData as Products);
            } else {
                setAddedProduct(null);
                alert("Nenhum produto encontrado com o código fornecido!");
            }
        } catch (Exception) {
            console.error("Erro ao encontrar produto: ", Exception);
            alert("Erro ao buscar produto!");
        }
    };

    const handleAddProduct = () => {
        if (!addedProduct || count <= 0 || price <= 0) {
            alert("Preencha os dados corretamente para adicionar o produto.");
            return;
        }

        setProduct(prev => [
            ...prev,
            {
                id: addedProduct.id,
                name: addedProduct.name,
                quantity: count,
                tipe: addedProduct.description,
                price: price
            }
        ]);

        setAddedProduct(null);
        setProductCode('');
        setCount(0);
        setPrice(0);
    };

    return (
        <section className="w-full">
            <h2 className="text-xl text-center font-semibold text-gray-700 border-b pb-2 mb-4">Produtos da Nota</h2>

            {/* TABELA SEMPRE VISÍVEL */}
            <div className="overflow-x-auto rounded-md border border-gray-300 mb-6">
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="text-sm font-semibold mb-3 text-gray-700">Adicionar novo produto</h3>

                    <div className="flex flex-col md:flex-row items-end gap-4 mb-4">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">Código do Produto</label>
                            <div className="flex">
                                <input
                                    type="number"
                                    value={productCode}
                                    onChange={(e) => setProductCode(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleProduct()}
                                    className="w-full p-1 border rounded-l-md border-gray-300 text-sm"
                                    placeholder="Digite o código"
                                />
                                <button
                                    type="button"
                                    onClick={handleProduct}
                                    className="bg-blue-500 text-white px-3 cursor-pointer text-sm rounded-r-md hover:bg-blue-600"
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
                                <p className="text-sm">{addedProduct.quantity}</p>
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
                                    className="mt-2 w-full bg-cyan-600 text-white py-1 rounded-md text-sm hover:bg-cyan-700"
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
                            <th className="px-4 py-2">Produto</th>
                            <th className="px-4 py-2">Quantidade</th>
                            <th className="px-4 py-2">Preço Unitário</th>
                            <th className="px-4 py-2">Tipo</th>
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
                                    <td className="px-4 py-2">{p.name}</td>
                                    <td className="px-4 py-2">{p.quantity}</td>
                                    <td className="px-4 py-2">R$ {p.price.toFixed(2)}</td>
                                    <td className="px-4 py-2">{p.tipe}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex justify-center">
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-400 cursor-pointer text-white font-medium py-2 px-6 rounded-md transition-colors"
                    disabled={product.length === 0}
                >
                    Finalizar Nota Fiscal
                </button>
            </div>
        </section>
    );
};

export default TableAddeProductInvoice;
