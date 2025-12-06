import { useForm, SubmitHandler } from 'react-hook-form'
import { Customer } from '../../../service/interfaces'
import { useEffect } from 'react'
import { updateCustomer } from '../../../service/api/Administrador/customer/clients'
import Swal from 'sweetalert2'
import { MapPin, User, Mail, Phone, Hash, Map, Save, X } from 'lucide-react'
import { maskCpfCnpj, maskPhone, maskZipCode } from '../../../utils/masks'

type Props = {
    customer: Customer | null
    onClose: () => void
}

const UpdatedCustomer = ({ customer, onClose }: Props) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<Customer>()

    useEffect(() => {
        if (customer) {
            reset(customer)
        }
    }, [customer, reset])

    // Estados brasileiros
    const estados = [
        "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
        "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
        "RS", "RO", "RR", "SC", "SP", "SE", "TO"
    ];

    // Máscaras
 

    const onSubmit: SubmitHandler<Customer> = async (data) => {
        if (!customer?.id) return

        try {
            await updateCustomer(customer.id, {
                ...data,
                updatedAt: new Date()
            })
            Swal.fire('Sucesso', 'Informações atualizadas com sucesso!', 'success')
            onClose()
        } catch (error) {
            console.error("Erro ao atualizar as informações do Cliente", error)
            Swal.fire('Erro', 'Erro ao atualizar informações.', 'error')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* HEADER */}
                <div className="px-8 pt-8 pb-6 border-b  border-gray-200 bg-slate-800">
                    <div className="flex justify-between">
                        <div className="flex flex-col">
                            <h2 className="text-3xl font-bold text-white flex items-center justify-start gap-3">
                                <User size={32} className="text-white" />
                                Editar Cliente
                            </h2>
                            <p className="text-white text-start mt-2">Atualize as informações do cliente</p>
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

                <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-7xl mx-auto bg-white shadow-lg rounded-2xl border border-gray-200  overflow-y-auto">
                    {/* Dados pessoais */}
                    <div className="flex-1 px-6 py-6">
                        <div className="flex items-center gap-2 mb-4">
                            <User size={20} className="text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-800">Dados Pessoais</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Nome */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <User size={16} className="text-gray-500" />
                                    Nome Completo *
                                </label>
                                <input
                                    type="text"
                                    {...register("name", { required: "Nome obrigatório" })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Nome completo"
                                />
                                {errors.name && <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <span>⚠</span> {errors.name.message}
                                </p>}
                            </div>

                            {/* CPF/CNPJ */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Hash size={16} className="text-gray-500" />
                                    CPF/CNPJ *
                                </label>
                                <input
                                    type="text"
                                    {...register("cpf_cnpj", {
                                        required: "CPF/CNPJ obrigatório",
                                        onChange: (e) => {
                                            e.target.value = maskCpfCnpj(e.target.value)
                                        }
                                    })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                                />
                                {errors.cpf_cnpj && <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <span>⚠</span> {errors.cpf_cnpj.message}
                                </p>}
                            </div>

                            {/* Código */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Hash size={16} className="text-gray-500" />
                                    Código *
                                </label>
                                <input
                                    type="text"
                                    {...register("code", { required: "Código obrigatório" })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Ex: CLI-0001"
                                />
                                {errors.code && <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <span>⚠</span> {errors.code.message}
                                </p>}
                            </div>

                            {/* Telefone */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Phone size={16} className="text-gray-500" />
                                    Telefone *
                                </label>
                                <input
                                    {...register("phone", {
                                        required: "Telefone obrigatório",
                                        onChange: (e) => {
                                            e.target.value = maskPhone(e.target.value)
                                        }
                                    })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="(11) 99999-9999"
                                />
                                {errors.phone && <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <span>⚠</span> {errors.phone.message}
                                </p>}
                            </div>

                            {/* E-mail */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Mail size={16} className="text-gray-500" />
                                    E-mail *
                                </label>
                                <input
                                    type="email"
                                    {...register("email", {
                                        required: "E-mail obrigatório",
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: "E-mail inválido"
                                        }
                                    })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="exemplo@email.com"
                                />
                                {errors.email && <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <span>⚠</span> {errors.email.message}
                                </p>}
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Status *
                                </label>
                                <div className="flex items-center gap-6 mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value="Ativo"
                                            {...register("status", { required: "Status obrigatório" })}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">Ativo</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value="Inativo"
                                            {...register("status")}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">Inativo</span>
                                    </label>
                                </div>
                                {errors.status && <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <span>⚠</span> {errors.status.message}
                                </p>}
                            </div>
                        </div>
                    </div>

                    {/* Endereço */}
                    <div className="flex-1 px-6 py-6">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin size={20} className="text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-800">Endereço</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* CEP */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <MapPin size={16} className="text-gray-500" />
                                    CEP *
                                </label>
                                <input
                                    {...register("address.zip", {
                                        required: "CEP obrigatório",
                                        onChange: (e) => {
                                            e.target.value = maskZipCode(e.target.value)
                                        }
                                    })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="00000-000"
                                />
                                {errors.address?.zip && <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <span>⚠</span> {errors.address.zip.message}
                                </p>}
                            </div>

                            {/* Estado */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Map size={16} className="text-gray-500" />
                                    Estado *
                                </label>
                                <select
                                    {...register("address.state", { required: "Estado obrigatório" })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                                >
                                    <option value="">Selecione o estado</option>
                                    {estados.map(estado => (
                                        <option key={estado} value={estado}>{estado}</option>
                                    ))}
                                </select>
                                {errors.address?.state && <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <span>⚠</span> {errors.address.state.message}
                                </p>}
                            </div>

                            {/* Código da Cidade */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Hash size={16} className="text-gray-500" />
                                    Código IBGE *
                                </label>
                                <input
                                    type="text"
                                    {...register("address.city_code", {
                                        required: "Código IBGE obrigatório",
                                        pattern: {
                                            value: /^\d{7}$/,
                                            message: "Código IBGE deve ter 7 dígitos"
                                        }
                                    })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Ex: 3550308"
                                />
                                {errors.address?.city_code && <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <span>⚠</span> {errors.address.city_code.message}
                                </p>}
                            </div>

                            {/* Cidade */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <MapPin size={16} className="text-gray-500" />
                                    Cidade *
                                </label>
                                <input
                                    type="text"
                                    {...register("address.city", { required: "Cidade obrigatória" })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Ex: São Paulo"
                                />
                                {errors.address?.city && <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <span>⚠</span> {errors.address.city.message}
                                </p>}
                            </div>

                            {/* Rua */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <MapPin size={16} className="text-gray-500" />
                                    Logradouro *
                                </label>
                                <input
                                    type="text"
                                    {...register("address.street", { required: "Logradouro obrigatório" })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Ex: Avenida Paulista"
                                />
                                {errors.address?.street && <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <span>⚠</span> {errors.address.street.message}
                                </p>}
                            </div>

                            {/* Número */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Hash size={16} className="text-gray-500" />
                                    Número *
                                </label>
                                <input
                                    type="number"
                                    {...register("address.number", {
                                        required: "Número obrigatório",
                                        valueAsNumber: true,
                                        min: {
                                            value: 1,
                                            message: "Número deve ser maior que 0"
                                        }
                                    })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Ex: 1234"
                                />
                                {errors.address?.number && <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <span>⚠</span> {errors.address.number.message}
                                </p>}
                            </div>
                        </div>
                    </div>

                    {/* Botões */}
                    <div className="flex justify-end gap-4 px-6 py-6 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-3 bg-slate-800 hover:bg-slate-600 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Atualizando...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Atualizar Cliente
                                </>
                            )}
                        </button>
                    </div>

                    {/* Nota informativa */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800 flex items-start gap-2">
                            <span className="text-blue-600">💡</span>
                            <span>
                                <strong>Importante:</strong> Todos os campos marcados com * são obrigatórios.
                                O CPF/CNPJ e Código IBGE são necessários para emissão de notas fiscais.
                            </span>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default UpdatedCustomer