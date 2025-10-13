import { useInvoiceProductsManagement } from '../../../hooks/_manager/useProductManagement';
import { PurchaseOrder } from '../../../service/interfaces';
import { useEffect } from 'react';

interface Props {
    orderItems: PurchaseOrder['orderItems'];
    setOrderItems: React.Dispatch<React.SetStateAction<PurchaseOrder['orderItems']>>;
}

const InvoiceProductTable: React.FC<Props> = ({ orderItems, setOrderItems }) => {
    const {
        productCode,
        setProductCode,
        selectedProduct,
        quantity,
        setQuantity,
        unitCost,
        setUnitCost,
        searchProduct,
        addProductToInvoice,
        removeItem,
        calculateTotal,
        orderItems: hookOrderItems,
        setOrderItems: setHookOrderItems
    } = useInvoiceProductsManagement();

    // ✅ Sincroniza o estado do hook com as props
    useEffect(() => {
        setHookOrderItems(orderItems);
    }, [orderItems]);

    // ✅ Sincroniza as props com o estado do hook quando adicionar produto
    useEffect(() => {
        setOrderItems(hookOrderItems);
    }, [hookOrderItems]);

    return (
        <section className="w-full">
            <h2 className="text-xl text-center font-semibold text-gray-700 border-b pb-2 mb-4">
                Produtos da Nota Fiscal
            </h2>

            <div className="overflow-x-auto rounded-md border border-gray-300 mb-6">
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="text-sm font-semibold mb-3 text-gray-700">Adicionar novo produto</h3>

                    <div className="flex flex-col md:flex-row items-end gap-4 mb-4">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">Código do Produto</label>
                            <div className="flex">
                                <input
                                    type="text"
                                    value={productCode}
                                    onChange={(e) => setProductCode(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchProduct()}
                                    className="w-full p-2 border rounded-l-md border-gray-300 text-sm"
                                    placeholder="Digite o código"
                                />
                                <button
                                    type="button"
                                    onClick={searchProduct}
                                    className="bg-slate-800 text-white px-4 cursor-pointer text-sm rounded-r-md hover:bg-slate-700"
                                >
                                    Buscar
                                </button>
                            </div>
                        </div>
                    </div>

                    {selectedProduct && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mb-4">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Produto</label>
                                    <p className="text-sm font-medium">{selectedProduct.name}</p>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Código</label>
                                    <p className="text-sm">{selectedProduct.code}</p>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Localização</label>
                                    <p className="text-sm">{selectedProduct.location || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <div className="col-span-full">
                                    <button
                                        type="button"
                                        onClick={addProductToInvoice}
                                        className="mt-2 w-full bg-slate-700 text-white py-2 rounded-md text-sm hover:bg-slate-600"
                                    >
                                        Adicionar à nota
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

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
                                            onClick={() => removeItem(item.productid)}
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

            {orderItems.length > 0 && (
                <div className="mb-6 flex justify-end">
                    <div className="bg-gray-100 px-6 py-3 rounded-md">
                        <span className="text-sm font-semibold">Total da Nota: </span>
                        <span className="text-lg font-bold text-slate-800">
                            R$ {calculateTotal().toFixed(2)}
                        </span>
                    </div>
                </div>
            )}
        </section>
    );
};

export default InvoiceProductTable;