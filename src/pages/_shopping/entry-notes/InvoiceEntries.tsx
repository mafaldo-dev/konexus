import { SubmitHandler, useForm } from 'react-hook-form';
import invoiceEntries from '../../../service/api/Administrador/invoices';
import Dashboard from '../../../components/dashboard/Dashboard';
import SupplierSearchForm from './components/SupplierSearchForm';
import { useEffect, useState } from 'react';
import { PurchaseOrder } from '../../../service/interfaces';
import { useOrderSearch } from '../../../hooks/_manager/useOrderPurchase';
import InvoiceProductTable from './components/invoiceTable';

const InvoiceEntries = () => {
    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<PurchaseOrder>();
    
    // ✅ Agora usa APENAS o formato orderItems do PurchaseOrder
    const [orderItems, setOrderItems] = useState<PurchaseOrder['orderItems']>([]);

    const formValues = watch();
    console.log("📝 VALORES ATUAIS DO FORM:", formValues);

    const { fetchedProducts } = useOrderSearch(setValue);

    // ✅ Atualiza orderItems quando buscar pedido
    useEffect(() => {
        if (fetchedProducts && fetchedProducts.length > 0) {
            setOrderItems(fetchedProducts);
        }
    }, [fetchedProducts]);

    // Função para aplicar máscara de CNPJ
    const applyCnpjMask = (value: string) => {
        return value.replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})/, '$1-$2')
            .slice(0, 18);
    };

    const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const maskedValue = applyCnpjMask(e.target.value);
        e.target.value = maskedValue;
        setValue("supplier.cnpj", maskedValue);
    };

    const onSubmit: SubmitHandler<PurchaseOrder> = async (data) => {
        try {
            if (!orderItems || orderItems.length === 0) {
                alert("Adicione pelo menos um produto antes de salvar a nota.");
                return;
            }

            // ✅ Prepara os dados EXATAMENTE no formato PurchaseOrder
            const purchaseOrderData: PurchaseOrder = {
                orderNumber: data.orderNumber,
                supplierId: data.supplierId || data.supplier?.id || "",
                orderDate: data.orderDate,
                orderStatus: 'received',
                totalCost: data.totalCost,
                currency: data.currency,
                notes: data.notes,
                orderItems: orderItems,
                supplier: data.supplier,
                createdAt: new Date().toISOString()
            };

            await invoiceEntries(purchaseOrderData);

            reset();
            setOrderItems([]);
            alert("Nota fiscal salva com sucesso!");
        } catch (Exception) {
            console.error("Erro ao gerar nota fiscal: ", Exception);
            alert("Erro ao gerar Nota fiscal!!");
        }
    };

    return (
        <Dashboard>
            <div className="max-w-6xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-10 space-y-10">
                <h2 className="text-2xl text-center font-bold mb-12 text-gray-800">
                    Entrada de Nota Fiscal Baseada em Pedido
                </h2>
                
                <SupplierSearchForm setValue={setValue} />
                
                <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 w-full'>
                    {/* ========== INFORMAÇÕES DO PEDIDO ========== */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Nº do Pedido:</label>
                            <input
                                type="text"
                                {...register("orderNumber", { required: true })}
                                placeholder="Ex: OC-01"
                                className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {errors.orderNumber && (
                                <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Data do Pedido:</label>
                            <input
                                type="date"
                                {...register("orderDate", { required: true })}
                                className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {errors.orderDate && (
                                <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Fornecedor ID:</label>
                            <input
                                type="text"
                                {...register("supplierId", { required: true })}
                                placeholder="ID do fornecedor"
                                className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {errors.supplierId && (
                                <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>
                            )}
                        </div>
                    </div>

                    {/* ========== DADOS DO FORNECEDOR ========== */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Empresa Fornecedor:</label>
                            <input
                                type="text"
                                {...register("supplier.name", { required: true })}
                                placeholder="Ex: Tractor"
                                className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {errors.supplier?.name && (
                                <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">CNPJ:</label>
                            <input
                                type="text"
                                {...register("supplier.cnpj", { required: true })}
                                placeholder="00.000.000/0000-00"
                                maxLength={18}
                                onChange={handleCnpjChange}
                                className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {errors.supplier?.cnpj && (
                                <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Valor Total:</label>
                            <input
                                type="number"
                                step="0.01"
                                {...register("totalCost", { 
                                    required: true,
                                    valueAsNumber: true 
                                })}
                                placeholder="0.00"
                                className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {errors.totalCost && (
                                <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>
                            )}
                        </div>
                    </div>

                    {/* ========== INFORMAÇÕES ADICIONAIS ========== */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Email:</label>
                            <input
                                type="email"
                                {...register("supplier.email")}
                                placeholder="email@empresa.com"
                                className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Telefone:</label>
                            <input
                                type="text"
                                {...register("supplier.phone")}
                                placeholder="(11) 99999-9999"
                                className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Moeda:</label>
                            <select
                                {...register("currency", { required: true })}
                                className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="BRL">BRL - Real Brasileiro</option>
                                <option value="USD">USD - Dólar Americano</option>
                                <option value="EUR">EUR - Euro</option>
                            </select>
                            {errors.currency && (
                                <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>
                            )}
                        </div>
                    </div>

                    {/* ========== OBSERVAÇÕES ========== */}
                    <div className="w-full">
                        <label className="block text-xs font-medium text-gray-700">Observações:</label>
                        <textarea
                            {...register("notes")}
                            placeholder="Observações adicionais"
                            className="mt-1 block w-full p-2 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                        />
                    </div>

                    {/* ========== TABELA DE PRODUTOS ========== */}
                    <InvoiceProductTable 
                        orderItems={orderItems} 
                        setOrderItems={setOrderItems} 
                    />

                    {/* ========== BOTÃO SUBMIT ========== */}
                    <div className="flex justify-end pt-6">
                        <button
                            type="submit"
                            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            Registrar Entrada no Kardex
                        </button>
                    </div>
                </form>
            </div>
        </Dashboard>
    );
};

export default InvoiceEntries;