import { useForm, SubmitHandler } from "react-hook-form"

import { Supplier } from "../../../service/interfaces"
import { insertSupplier } from "../../../service/api/Administrador/suppliers/supplier"
import Swal from "sweetalert2"

interface FormAddProps {
    onSupplierAdded: () => void
}

const FormRegisterSupplier: React.FC<FormAddProps> = ({ onSupplierAdded }) => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<Supplier>()

    const onSubmit: SubmitHandler<Supplier> = async (data) => {
        try {
            const supplierData: Supplier = {
                ...data,
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            await insertSupplier(supplierData)
            reset()
           onSupplierAdded()
            Swal.fire('Sucesso!', 'Fornecedor adicionado com sucesso!', 'success')
        } catch (error) {
            console.error("Erro ao cadastrar fornecedor:", error)
            Swal.fire('Error!', 'Erro ao adicionar Fornecedor a base de dados!', 'error')
        }
    }

    const maskCNPJ = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1')
    }

    const maskPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1')
    }

   // const maskZipCode = (value: string) => {
     //   return value
       //     .replace(/\D/g, '')
         //   .replace(/(\d{5})(\d)/, '$1-$2')
           // .replace(/(-\d{3})\d+?$/, '$1')
    //}
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Código*</label>
                    <input
                        {...register("code", { required: true })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.code && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">CNPJ*</label>
                    <input
                        {...register("cnpj", {
                            required: true,
                            onChange: (e) => {
                                e.target.value = maskCNPJ(e.target.value)
                            }
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.cnpj && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Nome*</label>
                <input
                    {...register("name", { required: true })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.name && <span className="text-red-500 text-xs">Campo obrigatório</span>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
                <input
                    {...register("trading_name")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">E-mail*</label>
                    <input
                        type="email"
                        {...register("email", { required: true })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.email && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Telefone*</label>
                    <input
                        {...register("phone", {
                            required: true,
                            onChange: (e) => {
                                e.target.value = maskPhone(e.target.value)
                            }
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.phone && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                </div>
            </div>
                        {/*
            <div className="border-t pt-4">
                <h3 className="text-lg font-medium">Endereço</h3>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Logradouro*</label>
                        <input
                            {...register("address.street", { required: true })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.address?.street && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Número*</label>
                        <input
                            {...register("address.number", { required: true })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.address?.number && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Complemento</label>
                        <input
                            {...register("address.complement")}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Bairro*</label>
                        <input
                            {...register("address.neighborhood", { required: true })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.address?.neighborhood && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">CEP*</label>
                        <input
                            {...register("address.zipCode", {
                                required: true,
                                onChange: (e) => {
                                    e.target.value = maskZipCode(e.target.value)
                                }
                            })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.address?.zipCode && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cidade*</label>
                        <input
                            {...register("address.city", { required: true })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.address?.city && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Estado*</label>
                        <input
                            {...register("address.state", { required: true })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.address?.state && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">UF*</label>
                        <input
                            {...register("address.uf", { required: true })}
                            className="mt-1 block w-22 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.address?.uf && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                    </div>
                </div>
            </div>
            */}

            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={() => reset()}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Limpar
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Salvar Fornecedor
                </button>
            </div>
        </form>
    )
}

export default FormRegisterSupplier
