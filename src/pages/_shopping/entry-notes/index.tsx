import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import { Invoice } from '../../../service/interfaces/invoiceEntries';
import { Supplier } from '../../../service/interfaces/suppliers';
import { handleSupplierWithCode } from '../../../service/api/suppliers/supplier';
import { ProductsProps } from '../../../service/interfaces/productsProps';

import invoiceEntries from '../../../service/api/invoices';

import Dashboard from '../../../components/dashboard';
import TableAddeProductInvoice from './table-add-products';


const InvoiceEntries = () => {
    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<Invoice>()

    const [products, setProducts] = useState<ProductsProps[]>([]);
    const [supplierCode, setSupplierCode] = useState<string>("")
    const [supplier, setSupplier] = useState<Supplier | null>(null)

    function maskCNPJ(value: string) {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    }

    const onSubmit: SubmitHandler<Invoice> = async (data) => {
        try {
            if (!products || products.length === 0) {
                console.log(data)
                alert("Adicione pelo menos um produto antes de salvar a nota.");
                console.log(products)
                return;
            }
            await invoiceEntries({
                ...data,
                products: products,
                date: new Date()
            })

            reset()
            setProducts([])
            alert("Nota fiscal salva com sucesso!");
        } catch (Exception) {
            console.error("Erro ao gerar nota fiscal: ", Exception)
            alert("Erro ao gerar Nota fiscal!!")
        }
    }

    const handleSupplier = async () => {
        if (!supplierCode) return;

        try {
            const supplierData = await handleSupplierWithCode(supplierCode) as Supplier;

            if (supplierData) {
                setSupplier(supplierData);
                setValue("dataEnterprise.enterprise", supplierData.name || "");
                setValue("dataEnterprise.cnpj", supplierData.cnpj || "");
                setValue("dataEnterprise.address.uf", supplierData.address.uf || "")
                setValue("dataEnterprise.address.state", supplierData.address.state || "");
                setValue("dataEnterprise.address.city", supplierData.address.city || "");
                setValue("dataEnterprise.address.neighborhood", supplierData.address.neighborhood || "");
                setValue("dataEnterprise.address.street", supplierData.address.street || "");
                setValue("dataEnterprise.address.number", supplierData.address.number || "");
            } else {
                alert("Fornecedor não encontrado!");
            }
        } catch (Exception) {
            console.error("Erro ao buscar fornecedor:", Exception);
            alert("Erro ao buscar fornecedor!");
        }
    }

    return (
        <Dashboard>
            <div className="max-w-6xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-10 space-y-10">
                <h2 className="text-2xl text-center font-bold mb-12 text-gray-800">Informações da Empresa</h2>
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
                <div className="flex gap-4 w-full m-auto">
                    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 w-full'>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Empresa:</label>
                                <input
                                    type="text"
                                    {...register("dataEnterprise.enterprise", { required: true })}
                                    placeholder="Ex: Tractor"
                                    className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.dataEnterprise?.enterprise && (
                                    <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">CNPJ:</label>
                                <input
                                    type="text"
                                    {...register("dataEnterprise.cnpj", { required: true })}
                                    placeholder="00.000.000/0000-00"
                                    maxLength={18}
                                    onChange={e => { e.target.value = maskCNPJ(e.target.value); }}
                                    className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.dataEnterprise?.cnpj && (
                                    <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">UF:</label>
                                <input
                                    type="text"
                                    {...register("dataEnterprise.address.uf", { required: true })}
                                    placeholder="SP"
                                    className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.dataEnterprise?.address?.uf && (
                                    <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full mt-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Estado:</label>
                                <input
                                    type="text"
                                    {...register("dataEnterprise.address.state", { required: true })}
                                    placeholder="Ex: São Paulo"
                                    className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.dataEnterprise?.address?.state && (
                                    <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Cidade:</label>
                                <input
                                    type="text"
                                    {...register("dataEnterprise.address.city", { required: true })}
                                    placeholder="Ex: São Paulo"
                                    className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.dataEnterprise?.address?.city && (
                                    <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Bairro:</label>
                                <input
                                    type="text"
                                    {...register("dataEnterprise.address.neighborhood", { required: true })}
                                    placeholder="Ex: Centro"
                                    className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.dataEnterprise?.address?.neighborhood && (
                                    <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Logradouro:</label>
                                <input
                                    type="text"
                                    {...register("dataEnterprise.address.street", { required: true })}
                                    placeholder="Ex: Av. Paulista"
                                    className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.dataEnterprise?.address?.street && (
                                    <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full mt-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Número:</label>
                                <input
                                    type="number"
                                    {...register("dataEnterprise.address.number", { required: true })}
                                    placeholder="Ex: 123"
                                    className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.dataEnterprise?.address?.number && (
                                    <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Data Entrada:</label>
                                <input
                                    type="date"
                                    {...register("dataEnterprise.entrieDate", { required: true })}
                                    className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.dataEnterprise?.entrieDate && (
                                    <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Nº Nota Fiscal:</label>
                                <input
                                    type="number"
                                    {...register("dataEnterprise.invoiceNum", { required: true })}
                                    placeholder="Ex: 000123456"
                                    className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.dataEnterprise?.invoiceNum && (
                                    <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Recebedor:</label>
                                <input
                                    type="text"
                                    {...register("dataEnterprise.receiver", { required: true })}
                                    placeholder="Ex: Roger"
                                    className="mt-1 block w-full p-1 h-9 text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.dataEnterprise?.receiver && (
                                    <span className="text-red-500 text-[10px] font-medium">Campo obrigatório</span>
                                )}
                            </div>
                        </div>
                        <TableAddeProductInvoice product={products} setProduct={setProducts} />
                    </form>
                </div>
            </div>
        </Dashboard >
    );
};
export default InvoiceEntries
