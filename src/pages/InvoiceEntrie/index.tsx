import React, { useState } from 'react';
import Dashboard from '../../components/dashboard';
import { handleProductWithCode } from '../../service/api/products';
import { Products } from '../../service/interfaces/products';
import { SubmitHandler, useForm } from 'react-hook-form';
import invoiceEntries from '../../service/api/invoices';
import { Invoice } from '../../service/interfaces/invoiceFinish';
import { Supplier } from '../../service/interfaces/suppliers';
import { handleSupplierWithCode } from '../../service/api/suppliers/supplier';

interface ProductsProps {
    id: string | any
    name: string
    tipe: string
    quantity: number
    price: number
}

const InvoiceEntrie = () => {
    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<Invoice>()

    const [produtos, setProdutos] = useState<ProductsProps[]>([]);
    const [product, setProduct] = useState<Products | null>(null)
    const [supplierCode, setSupplierCode] = useState<string>("")
    const [productCode, setProductCode] = useState<string>("")
    const [count, setCount] = useState(0)
    const [price, setPrice] = useState(0)
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
            if (!produtos || produtos.length === 0) {
                alert("Adicione pelo menos um produto antes de salvar a nota.");
                return;
            }

            await invoiceEntries({
                ...data,
                products: produtos,
                date: new Date()
            })

            reset()
            setProdutos([])
            alert("Nota fiscal salva com sucesso!");
        } catch (Exception) {
            console.error("Erro ao gerar nota fiscal: ", Exception)
            alert("Erro ao gerar Nota fiscal!!")
        }
    }

    const handleSupplier = async () => {
  if(!supplierCode) return;

  try {
    const supplierData = await handleSupplierWithCode(supplierCode) as Supplier;

    if(supplierData) {
      setSupplier(supplierData);
      
      // Preenche os campos do formulário
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
  } catch(error) {
    console.error("Erro ao buscar fornecedor:", error);
    alert("Erro ao buscar fornecedor!");
  }
}

    const handleProduct = async () => {
        if (!productCode) return

        try {
            const productData = await handleProductWithCode(Number(productCode))

            if (productData) {
                setProduct(productData as Products)
            } else {
                setProduct(null)
                alert("Nenhum produto encontrado com o código fornecido!")
            }
        } catch (Exception) {
            console.error("Erro ao encontrar produto: ", Exception)
            alert("Erro ao buscar produto!")
        }
    }

    return (
        <Dashboard>
            <div className="max-w-6xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-10 space-y-10">
                    <h2 className="text-2xl text-center font-bold mb-12 text-gray-800">Informações da Empresa</h2>

                    {/* Busca de Fornecedor */}
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
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                        >
                            Buscar Fornecedor
                        </button>
                    </div>

                    <div className="flex gap-4 w-full m-auto">
                        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 w-full'>
                            {/* Primeira linha de campos */}
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 w-full'>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Empresa:</label>
                                    <input
                                        type="text"
                                        {...register("dataEnterprise.enterprise", { required: true })}
                                        placeholder="Ex: Tractor"
                                        className="mt-1 block w-full p-2 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {errors.dataEnterprise?.enterprise && (
                                        <span className="text-red-500 text-xs font-medium">Campo obrigatório</span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">CNPJ:</label>
                                    <input
                                        type="text"
                                        {...register("dataEnterprise.cnpj", { required: true })}
                                        placeholder="00.000.000/0000-00"
                                        maxLength={18}
                                        onChange={e => {
                                            e.target.value = maskCNPJ(e.target.value);
                                        }}
                                        className="mt-1 block w-full p-2 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {errors.dataEnterprise?.cnpj && (
                                        <span className="text-red-500 text-xs font-medium">Campo obrigatório</span>
                                    )}
                                </div>

                                <div className="w-full">
                                    <label className="block text-sm font-medium text-gray-700">UF:</label>
                                    <input
                                        type="text"
                                        {...register("dataEnterprise.address.uf", { required: true })}
                                        placeholder="SP"
                                        className="mt-1 block w-full p-2 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {errors.dataEnterprise?.address?.uf && (
                                        <span className="text-red-500 text-xs font-medium">Campo obrigatório</span>
                                    )}
                                </div>
                            </div>

                            {/* Segunda linha de campos */}
                            <div className='grid grid-cols-1 md:grid-cols-4 gap-6 w-full'>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Estado:</label>
                                    <input
                                        type="text"
                                        {...register("dataEnterprise.address.state", { required: true })}
                                        placeholder="Ex: São Paulo"
                                        className="mt-1 block w-full p-2 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {errors.dataEnterprise?.address?.state && (
                                        <span className="text-red-500 text-xs font-medium">Campo obrigatório</span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Cidade:</label>
                                    <input
                                        type="text"
                                        {...register("dataEnterprise.address.city", { required: true })}
                                        placeholder="Ex: São Paulo"
                                        className="mt-1 block w-full p-2 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {errors.dataEnterprise?.address?.city && (
                                        <span className="text-red-500 text-xs font-medium">Campo obrigatório</span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bairro:</label>
                                    <input
                                        type="text"
                                        {...register("dataEnterprise.address.neighborhood", { required: true })}
                                        placeholder="Ex: Centro"
                                        className="mt-1 block w-full p-2 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {errors.dataEnterprise?.address?.neighborhood && (
                                        <span className="text-red-500 text-xs font-medium">Campo obrigatório</span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Logradouro:</label>
                                    <input
                                        type="text"
                                        {...register("dataEnterprise.address.street", { required: true })}
                                        placeholder="Ex: Av. Paulista"
                                        className="mt-1 block w-full p-2 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {errors.dataEnterprise?.address?.street && (
                                        <span className="text-red-500 text-xs font-medium">Campo obrigatório</span>
                                    )}
                                </div>
                            </div>

                            {/* Terceira linha de campos */}
                            <div className='grid grid-cols-1 md:grid-cols-4 gap-6 w-full'>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Número:</label>
                                    <input
                                        type="number"
                                        {...register("dataEnterprise.address.number", { required: true })}
                                        placeholder="Ex: 123"
                                        className="mt-1 block w-full p-2 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {errors.dataEnterprise?.address?.number && (
                                        <span className="text-red-500 text-xs font-medium">Campo obrigatório</span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Data Entrada:</label>
                                    <input
                                        type="date"
                                        {...register("dataEnterprise.entrieDate", { required: true })}
                                        className="mt-1 block w-full p-2 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {errors.dataEnterprise?.entrieDate && (
                                        <span className="text-red-500 text-xs font-medium">Campo obrigatório</span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nº Nota Fiscal:</label>
                                    <input
                                        type="number"
                                        {...register("dataEnterprise.invoiceNum", { required: true })}
                                        placeholder="Ex: 000123456"
                                        className="mt-1 block w-full p-2 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {errors.dataEnterprise?.invoiceNum && (
                                        <span className="text-red-500 text-xs font-medium">Campo obrigatório</span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Recebedor:</label>
                                    <input
                                        type="text"
                                        {...register("dataEnterprise.receiver", { required: true })}
                                        placeholder="Ex: Roger"
                                        className="mt-1 block w-full p-2 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {errors.dataEnterprise?.receiver && (
                                        <span className="text-red-500 text-xs font-medium">Campo obrigatório</span>
                                    )}
                                </div>
                            </div>

                            <hr className="border-t border-gray-300 my-6" />

                            {/* Seção de produtos */}
                            <section>
                                <h2 className="text-2xl text-center font-bold mb-6 text-gray-800">Adicionar Produto</h2>

                                <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Código do Produto:</label>
                                        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                                            <input
                                                value={productCode}
                                                onChange={(e) => setProductCode(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleProduct()}
                                                className="w-full p-2 focus:outline-none"
                                                placeholder="Digite o código"
                                                type="number"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleProduct}
                                                className="bg-blue-500 text-white px-4 hover:bg-blue-600 transition-colors"
                                            >
                                                Buscar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {product && (
                                    <div className="mt-4 bg-gray-50 p-4 rounded-lg shadow">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Produto</p>
                                                <p className="font-semibold">{product.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Tipo</p>
                                                <p>{product.description}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Código</p>
                                                <p>{product.code}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Estoque</p>
                                                <p>{product.quantity}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade:</label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={count}
                                                    onChange={(e) => setCount(Number(e.target.value))}
                                                    className="w-full p-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Preço unitário:</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    value={price}
                                                    onChange={(e) => setPrice(Number(e.target.value))}
                                                    className="w-full p-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProdutos((prev) => [
                                                    ...prev,
                                                    {
                                                        id: product.id,
                                                        name: product.name,
                                                        quantity: count,
                                                        tipe: product.description,
                                                        price: price
                                                    }
                                                ]);
                                                setProduct(null);
                                                setProductCode('');
                                                setCount(0);
                                                setPrice(0);
                                            }}
                                            className="mt-4 w-full bg-cyan-500 text-white py-2 px-4 rounded-md hover:bg-cyan-600 transition-colors"
                                        >
                                            Incluir produto
                                        </button>
                                    </div>
                                )}

                                {/* Tabela de produtos */}
                                <div className="mt-8">
                                    {produtos.length === 0 ? (
                                        <p className="text-gray-500 text-center italic py-4">Nenhum produto adicionado.</p>
                                    ) : (
                                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Unitário</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {produtos.map((pro, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-6 py-4 whitespace-nowrap">{pro.name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">{pro.quantity}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">R$ {pro.price.toFixed(2)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">{pro.tipe}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-center">
                                    <button
                                        type="submit"
                                        className="bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-3 px-8 rounded-md transition-colors"
                                        disabled={produtos.length === 0}
                                    >
                                        Finalizar Nota Fiscal
                                    </button>
                                </div>
                            </section>
                        </form>
                    </div>
            </div>
        </Dashboard >
    );
};

export default InvoiceEntrie;
