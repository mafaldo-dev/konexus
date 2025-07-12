import { SubmitHandler, useForm, FormProvider } from 'react-hook-form';
import { Invoice } from '../../../service/interfaces/financial/invoiceEntries';
import { ProductsProps } from '../../../service/interfaces/stock/productsProps';
import invoiceEntries from '../../../service/api/Administrador/invoices';
import ProductTable from './ProductTable';
import Dashboard from '../../../components/dashboard/Dashboard';
import { useCnpjMask } from '../../../hooks/utils/useCnpjMask';
import SupplierSearchForm from './components/SupplierSearchForm';
import { useState } from 'react';

const InvoiceEntries = () => {
    const methods = useForm<Invoice>();
    const { register, handleSubmit, formState: { errors }, reset, setValue } = methods;
    const { cnpj, handleChange: handleCnpjChange } = useCnpjMask();
    const [products, setProducts] = useState<ProductsProps[]>([]);

    const onSubmit: SubmitHandler<Invoice> = async (data) => {
        try {
            if (!products || products.length === 0) {
                alert("Adicione pelo menos um produto antes de salvar a nota.");
                return;
            }
            await invoiceEntries({
                ...data,
                products: products,
                date: new Date()
            });

            reset();
            setProducts([]);
            alert("Nota fiscal salva com sucesso!");
        } catch (Exception) {
            console.error("Erro ao gerar nota fiscal: ", Exception);
            alert("Erro ao gerar Nota fiscal!!");
        }
    };

    return (
        <Dashboard>
            <div className="max-w-6xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-10 space-y-10">
                <h2 className="text-2xl text-center font-bold mb-12 text-gray-800">Informações da Empresa</h2>
                <FormProvider {...methods}>
                    <SupplierSearchForm setValue={setValue} />
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
                                    value={cnpj}
                                    onChange={(e) => {
                                        handleCnpjChange(e);
                                        setValue("dataEnterprise.cnpj", cnpj);
                                    }}
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
                        <ProductTable product={products} setProduct={setProducts} />
                    </form>
                </FormProvider>
            </div>
        </Dashboard >
    );
};
export default InvoiceEntries
