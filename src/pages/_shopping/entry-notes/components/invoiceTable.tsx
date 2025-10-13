import { useState } from 'react';
import { PurchaseOrder } from '../../../../service/interfaces';
import { handleProductWithCode } from '../../../../service/api/Administrador/products';

interface Props {
    orderItems: PurchaseOrder['orderItems'];
    setOrderItems: React.Dispatch<React.SetStateAction<PurchaseOrder['orderItems']>>;
}

interface ProductData {
    id: string;
    name: string;
    code: string;
    location?: string;
    coast?: number;
    price?: number;
}

const InvoiceProductTable: React.FC<Props> = ({ orderItems, setOrderItems }) => {
    const [productCode, setProductCode] = useState("");
    const [searchedProduct, setSearchedProduct] = useState<ProductData | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [unitCost, setUnitCost] = useState(0);

    // ✅ Função para buscar produto pela API
    const handleSearchProduct = async () => {
        if (!productCode.trim()) {
            alert('Digite um código de produto!');
            return;
        }

        try {
            const product = await handleProductWithCode(productCode);
            
            if (product) {
                setSearchedProduct(product as ProductData);
                setUnitCost(product.coast || product.price || 0);
                setQuantity(1);
            } else {
                alert('Produto não encontrado!');
                setSearchedProduct(null);
            }
        } catch (error) {
            console.error('Erro ao buscar produto:', error);
            alert('Erro ao buscar produto!');
            setSearchedProduct(null);
        }
    };

    const handleAddProduct = () => {
        if (!searchedProduct) {
            alert("Busque um produto primeiro!");
            return;
        }

        if (quantity <= 0) {
            alert('Quantidade deve ser maior que zero!');
            return;
        }

        if (unitCost <= 0) {
            alert('Custo deve ser maior que zero!');
            return;
        }

        // Verificar se produto já existe na nota
        const existingIndex = orderItems.findIndex(
            item => item.productid === searchedProduct.id
        );

        if (existingIndex >= 0) {
            // Atualizar quantidade se já existir
            setOrderItems(prev => prev.map((item, index) => 
                index === existingIndex
                    ? {
                        ...item,
                        quantity: item.quantity + quantity,
                        cost: unitCost // Atualiza o custo também
                    }
                    : item
            ));
            alert('Quantidade do produto atualizada!');
        } else {
            // Adicionar novo item
            const newItem: PurchaseOrder['orderItems'][0] = {
                productid: searchedProduct.id,
                quantity: quantity,
                cost: unitCost,
                productname: searchedProduct.name,
                productcode: searchedProduct.code,
                productlocation: searchedProduct.location || ""
            };

            setOrderItems(prev => [...prev, newItem]);
        }
        
        // Reset
        setProductCode("");
        setSearchedProduct(null);
        setQuantity(1);
        setUnitCost(0);
    };

    const handleRemoveProduct = (index: number) => {
        setOrderItems(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <section className="w-full">
            <h2 className="text-xl text-center font-semibold text-gray-700 border-b pb-2 mb-4">
                Produtos da Nota Fiscal
            </h2>

            {/* Formulário de busca e adição */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Adicionar produto</h3>

                <div className="grid grid-cols-1 gap-4">
                    {/* Busca de produto */}
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Código do Produto</label>
                        <div className="flex">
                            <input
                                type="text"
                                value={productCode}
                                onChange={(e) => setProductCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchProduct()}
                                className="w-full p-2 border rounded-l-md border-gray-300 text-sm"
                                placeholder="Digite o código"
                            />
                            <button
                                type="button"
                                onClick={handleSearchProduct}
                                className="bg-slate-800 text-white px-4 cursor-pointer text-sm rounded-r-md hover:bg-slate-700"
                            >
                                Buscar
                            </button>
                        </div>
                    </div>

                    {/* Informações do produto encontrado */}
                    {searchedProduct && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Produto</label>
                                    <p className="text-sm font-medium">{searchedProduct.name}</p>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Localização</label>
                                    <p className="text-sm">{searchedProduct.location || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Quantidade</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        className="w-full p-2 border rounded-md border-gray-300 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Custo Unitário (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={unitCost}
                                        onChange={(e) => setUnitCost(Number(e.target.value))}
                                        className="w-full p-2 border rounded-md border-gray-300 text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleAddProduct}
                                className="w-full bg-slate-700 text-white py-2 rounded-md text-sm hover:bg-slate-600"
                            >
                                Adicionar à nota
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tabela de produtos adicionados */}
            <div className="overflow-x-auto rounded-md border border-gray-300">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2">Código</th>
                            <th className="px-4 py-2">Produto</th>
                            <th className="px-4 py-2">Localização</th>
                            <th className="px-4 py-2">Quantidade</th>
                            <th className="px-4 py-2">Custo Unit.</th>
                            <th className="px-4 py-2">Total</th>
                            <th className="px-4 py-2">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orderItems.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-4 text-gray-400 italic">
                                    Nenhum produto adicionado
                                </td>
                            </tr>
                        ) : (
                            orderItems.map((item, index) => (
                                <tr key={index} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-2">{item.productcode}</td>
                                    <td className="px-4 py-2">{item.productname}</td>
                                    <td className="px-4 py-2">{item.productlocation}</td>
                                    <td className="px-4 py-2">{item.quantity}</td>
                                    <td className="px-4 py-2">R$ {item.cost.toFixed(2)}</td>
                                    <td className="px-4 py-2 font-semibold">
                                        R$ {(item.cost * item.quantity).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-2">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveProduct(index)}
                                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                                        >
                                            Remover
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Total */}
            {orderItems.length > 0 && (
                <div className="mt-4 flex justify-end">
                    <div className="bg-gray-100 px-6 py-3 rounded-md">
                        <span className="text-sm font-semibold">Total da Nota: </span>
                        <span className="text-lg font-bold text-slate-800">
                            R$ {orderItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0).toFixed(2)}
                        </span>
                    </div>
                </div>
            )}
        </section>
    );
};

export default InvoiceProductTable;