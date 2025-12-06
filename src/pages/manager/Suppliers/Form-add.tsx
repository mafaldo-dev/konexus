import { useForm, SubmitHandler } from "react-hook-form"

import { Supplier } from "../../../service/interfaces"
import { insertSupplier } from "../../../service/api/Administrador/suppliers/supplier"
import Swal from "sweetalert2"
import { maskCpfCnpj, maskPhone } from "../../../utils/masks"
import { User2Icon, UserIcon, X } from "lucide-react"

interface FormAddProps {
    onSupplierAdded: () => void
    onClose: () => void
}

const FormRegisterSupplier: React.FC<FormAddProps> = ({ onSupplierAdded, onClose }: FormAddProps) => {
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

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="px-8 pt-8 pb-6 border-b  border-gray-200 bg-slate-800">
                    <div className="flex justify-between">
                        <div className="flex flex-col">
                            <h2 className="text-3xl font-bold text-white flex items-center justify-start gap-3">
                                <UserIcon size={32} className="text-white" />
                                Cadastro de Fornecedor
                            </h2>
                            <p className="text-white text-start mt-2">Preencha todos os campos obrigatórios (*)</p>
                        </div>

                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition -mt-20 -mr-4"
                            aria-label="Fechar"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="w-full max-w-6xl mt-4  mx-auto bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden"
                >
                    <div className="px-6 py-6 space-y-8" style={{ minHeight: "700px"}}>
                        {/* Seção 1: Dados Básicos */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-700 border-l-4 border-blue-500 pl-3">Dados Básicos</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Código*
                                        <span className="text-gray-400 text-xs ml-1">(Identificador único)</span>
                                    </label>
                                    <input
                                        {...register("code", {
                                            required: "Código é obrigatório",
                                            minLength: {
                                                value: 2,
                                                message: "Mínimo 2 caracteres"
                                            }
                                        })}
                                        placeholder="Ex: FOR001"
                                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                    />
                                    {errors.code && (
                                        <span className="text-red-500 text-xs font-medium">
                                            {errors.code.message}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">CNPJ*</label>
                                    <input
                                        {...register("national_register_code", {
                                            required: "CNPJ é obrigatório",
                                            onChange: (e) => {
                                                e.target.value = maskCpfCnpj(e.target.value)
                                            }
                                        })}
                                        placeholder="00.000.000/0000-00"
                                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                    />
                                    {errors.national_register_code && (
                                        <span className="text-red-500 text-xs font-medium">
                                            {errors.national_register_code.message}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2 lg:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Nome/Razão Social*</label>
                                    <input
                                        {...register("name", {
                                            required: "Nome é obrigatório",
                                            minLength: {
                                                value: 3,
                                                message: "Mínimo 3 caracteres"
                                            }
                                        })}
                                        placeholder="Nome completo ou razão social"
                                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                    />
                                    {errors.name && (
                                        <span className="text-red-500 text-xs font-medium">
                                            {errors.name.message}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
                                <input
                                    {...register("trading_name")}
                                    placeholder="Nome fantasia da empresa (opcional)"
                                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                />
                            </div>
                        </div>

                        {/* Seção 2: Contato */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-700 border-l-4 border-blue-500 pl-3">Contato</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">E-mail*</label>
                                    <input
                                        type="email"
                                        {...register("email", {
                                            required: "E-mail é obrigatório",
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: "E-mail inválido"
                                            }
                                        })}
                                        placeholder="fornecedor@empresa.com"
                                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                    />
                                    {errors.email && (
                                        <span className="text-red-500 text-xs font-medium">
                                            {errors.email.message}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Telefone*</label>
                                    <input
                                        {...register("phone", {
                                            required: "Telefone é obrigatório",
                                            onChange: (e) => {
                                                e.target.value = maskPhone(e.target.value)
                                            }
                                        })}
                                        placeholder="(11) 99999-9999"
                                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                    />
                                    {errors.phone && (
                                        <span className="text-red-500 text-xs font-medium">
                                            {errors.phone.message}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Seção 3: Endereço (comentado) */}
                        {/*
        <div className="space-y-6 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-700 border-l-4 border-blue-500 pl-3">Endereço</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Logradouro*</label>
                    <input
                        {...register("address.street", { required: "Logradouro é obrigatório" })}
                        placeholder="Rua, Avenida, etc."
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    />
                    {errors.address?.street && (
                        <span className="text-red-500 text-xs font-medium">
                            {errors.address.street.message}
                        </span>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Número*</label>
                    <input
                        {...register("address.number", { required: "Número é obrigatório" })}
                        placeholder="123"
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    />
                    {errors.address?.number && (
                        <span className="text-red-500 text-xs font-medium">
                            {errors.address.number.message}
                        </span>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Complemento</label>
                    <input
                        {...register("address.complement")}
                        placeholder="Sala, Apartamento, etc."
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Bairro*</label>
                    <input
                        {...register("address.neighborhood", { required: "Bairro é obrigatório" })}
                        placeholder="Nome do bairro"
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    />
                    {errors.address?.neighborhood && (
                        <span className="text-red-500 text-xs font-medium">
                            {errors.address.neighborhood.message}
                        </span>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">CEP*</label>
                    <input
                        {...register("address.zipCode", {
                            required: "CEP é obrigatório",
                            onChange: (e) => {
                                e.target.value = maskZipCode(e.target.value)
                            }
                        })}
                        placeholder="00000-000"
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    />
                    {errors.address?.zipCode && (
                        <span className="text-red-500 text-xs font-medium">
                            {errors.address.zipCode.message}
                        </span>
                    )}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Cidade*</label>
                    <input
                        {...register("address.city", { required: "Cidade é obrigatória" })}
                        placeholder="Nome da cidade"
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    />
                    {errors.address?.city && (
                        <span className="text-red-500 text-xs font-medium">
                            {errors.address.city.message}
                        </span>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Estado*</label>
                    <input
                        {...register("address.state", { required: "Estado é obrigatório" })}
                        placeholder="Nome do estado"
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    />
                    {errors.address?.state && (
                        <span className="text-red-500 text-xs font-medium">
                            {errors.address.state.message}
                        </span>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">UF*</label>
                    <input
                        {...register("address.uf", { 
                            required: "UF é obrigatória",
                            maxLength: {
                                value: 2,
                                message: "Máximo 2 caracteres"
                            }
                        })}
                        placeholder="SP"
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    />
                    {errors.address?.uf && (
                        <span className="text-red-500 text-xs font-medium">
                            {errors.address.uf.message}
                        </span>
                    )}
                </div>
            </div>
        </div>
        */}

                        {/* Botões de ação */}
                        <div className="flex justify-end  space-x-4 pt-32 border-t">
                            <button
                                type="button"
                                onClick={() => reset()}
                                className="px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition duration-200"
                            >
                                Limpar Formulário
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-800 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 transform hover:-translate-y-0.5"
                            >
                                Salvar Fornecedor
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default FormRegisterSupplier
