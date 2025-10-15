import { SubmitHandler, useForm } from 'react-hook-form';
import invoiceEntries from '../../../service/api/Administrador/invoices';
import Dashboard from '../../../components/dashboard/Dashboard';
import SupplierSearchForm from './components/SupplierSearchForm';
import { useEffect, useState } from 'react';
import { InvoiceDataEntries, PurchaseOrder } from '../../../service/interfaces';
import { useOrderSearch } from '../../../hooks/_manager/useOrderPurchase';
import InvoiceProductTable from './components/invoiceTable';
import Swal from 'sweetalert2';


const InvoiceEntries = () => {
    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<PurchaseOrder>();
    const { fetchedProducts, isLoading, orderByCode, setOrderByCode, handleOrderByCode, order } = useOrderSearch(setValue);

    const [orderItems, setOrderItems] = useState<PurchaseOrder['orderItems']>([]);

    useEffect(() => {
        if (fetchedProducts && fetchedProducts.length > 0) {
            setOrderItems(fetchedProducts);
        } else {
            console.warn("⚠️ [INVOICE] fetchedProducts está vazio ou null");
        }
    }, [fetchedProducts]);

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
            if (!data.orderNumber) {
                Swal.fire("Info", "Número da ordem é obrigatório.", "info");
                return;
            }
            if (!order || !order.id) {
                Swal.fire("Erro", "ID do pedido não encontrado. Busque o pedido primeiro.", "error");
                return;
            }
            console.log("console log do data aqui =>", data)

            const invoiceData: InvoiceDataEntries = {
                order_id: order?.id,
                invoice_number: data.invoiceNumber || `NF-${data.orderNumber}`,
                issue_date: new Date(),
                total_value: data.totalCost,
                xml_path: null,
                status: 'Pendente'
            };

            await invoiceEntries(invoiceData);
            console.log(invoiceData)

            Swal.fire("Sucesso!", "Nota fiscal salva com sucesso!", "success");
            reset()
        } catch (error) {
            console.error("Erro ao gerar nota fiscal:", error);
            Swal.fire("Erro", "Erro ao gerar Nota fiscal!", "error");
        }
    };

    return (
        <Dashboard>
            <div className="max-w-6xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-10 space-y-10">
                <h2 className="text-2xl text-center font-bold mb-12 text-gray-800">
                    Entrada de Nota Fiscal Baseada em Pedido
                </h2>
                <SupplierSearchForm
                    setValue={setValue}
                    orderByCode={orderByCode}
                    setOrderByCode={setOrderByCode}
                    handleOrderByCode={handleOrderByCode}
                    isLoading={isLoading}
                />

                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                    {/* Fornecedor ID */}
                    <div className="flex flex-col">
                        <label className="block text-xs font-medium text-gray-700">Identificador:</label>
                        <input
                            type="text"
                            {...register("supplierId", { required: true })}
                            placeholder="ID Fornecedor"
                            className="mt-1 block w-full p-2 h-10 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.supplierId && <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>}
                    </div>

                    {/* Empresa Fornecedor */}
                    <div className="flex flex-col">
                        <label className="block text-xs font-medium text-gray-700">Empresa Fornecedor:</label>
                        <input
                            type="text"
                            {...register("supplier.name", { required: true })}
                            placeholder="Ex: Tractor"
                            className="mt-1 block w-full p-2 h-10 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.supplier?.name && <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>}
                    </div>

                    {/* Email */}
                    <div className="flex flex-col">
                        <label className="block text-xs font-medium text-gray-700">Email:</label>
                        <input
                            type="email"
                            {...register("supplier.email")}
                            placeholder="email@empresa.com"
                            className="mt-1 block w-full p-2 h-10 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Telefone */}
                    <div className="flex flex-col">
                        <label className="block text-xs font-medium text-gray-700">Telefone:</label>
                        <input
                            type="text"
                            {...register("supplier.phone")}
                            placeholder="(11) 99999-9999"
                            className="mt-1 block w-full p-2 h-10 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Moeda */}
                    <div className="flex flex-col">
                        <label className="block text-xs font-medium text-gray-700">Moeda:</label>
                        <select
                            {...register("currency", { required: true })}
                            className="mt-1 block w-full p-2 h-10 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="BRL">BRL - Real Brasileiro</option>
                            <option value="USD">USD - Dólar Americano</option>
                            <option value="EUR">EUR - Euro</option>
                        </select>
                        {errors.currency && <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>}
                    </div>

                    {/* Nº do Pedido */}
                    <div className="flex flex-col">
                        <label className="block text-xs font-medium text-gray-700">Nº do Pedido:</label>
                        <input
                            type="text"
                            {...register("orderNumber", { required: true })}
                            placeholder="Ex: OC-01"
                            className="mt-1 block w-full p-2 h-10 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.orderNumber && <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>}
                    </div>

                    {/* Data do Pedido */}
                    <div className="flex flex-col">
                        <label className="block text-xs font-medium text-gray-700">Data do Pedido:</label>
                        <input
                            type="date"
                            {...register("orderDate", { required: true })}
                            className="mt-1 block w-full p-2 h-10 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.orderDate && <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>}
                    </div>

                    {/* Número da Nota Fiscal */}
                    <div className="flex flex-col">
                        <label className="block text-xs font-medium text-gray-700">Número da Nota Fiscal</label>
                        <input
                            type="text"
                            {...register("invoiceNumber", { required: true })}
                            placeholder="Ex: NF-0001"
                            className="mt-1 block w-full p-2 h-10 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.invoiceNumber && <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>}
                    </div>

                    {/* Valor Total */}
                    <div className="flex flex-col">
                        <label className="block text-xs font-medium text-gray-700">Valor Total:</label>
                        <input
                            type="number"
                            step="0.01"
                            {...register("totalCost", { required: true, valueAsNumber: true })}
                            placeholder="0.00"
                            className="mt-1 block w-full p-2 h-10 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.totalCost && <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>}
                    </div>

                    {/* Observações */}
                    <div className="flex flex-col col-span-1 md:col-span-2 lg:col-span-4">
                        <label className="block text-xs font-medium text-gray-700">Observações:</label>
                        <textarea
                            {...register("notes")}
                            placeholder="Observações adicionais"
                            className="mt-1 block resize-none w-full p-2 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                        />
                    </div>

                    {/* Tabela de Produtos */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-4">
                        <InvoiceProductTable
                            orderItems={orderItems}
                            setOrderItems={setOrderItems}
                        />
                    </div>

                    {/* Botão de Finalizar */}
                    <div className="flex justify-end col-span-1 md:col-span-2 lg:col-span-4 pt-4">
                        <button
                            type="submit"
                            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            Finalizar
                        </button>
                    </div>
                </form>

            </div>
        </Dashboard>
    );
};

export default InvoiceEntries;