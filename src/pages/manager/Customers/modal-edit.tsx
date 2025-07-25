import { useForm, SubmitHandler } from 'react-hook-form'
import { Customer } from '../../../service/interfaces'
import { useEffect } from 'react'
import { updateCustomer } from '../../../service/api/Administrador/customer/clients'
import Swal from 'sweetalert2'

type Props = {
    customer: Customer | null
    onClose: () => void
}

const UpdatedCustomer = ({ customer, onClose }: Props) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<Customer>()

    useEffect(() => {
        if (customer) {
            reset(customer)
        }
    }, [customer, reset])

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
            console.error("Erro ao atualizar as informações do Cliente")
            Swal.fire('Erro', 'Erro ao atualizar informações.', 'error')
            throw new Error("Erro interno do servidor")
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-2xl p-8 overflow-y-auto max-h-[90vh] animate-fadeIn">
                {/* Cabeçalho */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">Editar Cliente</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-red-600 text-3xl leading-none"
                        aria-label="Fechar"
                    >
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Dados pessoais */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Informações Pessoais</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome</label>
                                <input
                                    type="text"
                                    {...register("name", { required: true })}
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nome completo"
                                />
                                {errors.name && <p className="text-sm text-red-500 mt-1">Nome é obrigatório</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">E-mail</label>
                                <input
                                    type="email"
                                    {...register("email", { required: true })}
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="E-mail"
                                />
                                {errors.email && <p className="text-sm text-red-500 mt-1">E-mail é obrigatório</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                                <input
                                    type="text"
                                    {...register("phone", { required: true })}
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="(xx) xxxxx-xxxx"
                                />
                                {errors.phone && <p className="text-sm text-red-500 mt-1">Telefone é obrigatório</p>}
                            </div>
                        </div>
                    </div>

                    {/* Endereço */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Endereço</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Rua</label>
                                <input
                                    type="text"
                                    {...register("address.street", { required: true })}
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Rua"
                                />
                                {errors.address?.street && <p className="text-sm text-red-500 mt-1">Rua é obrigatória</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Número</label>
                                <input
                                    type="text"
                                    {...register("address.number", { required: true })}
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Número"
                                />
                                {errors.address?.number && <p className="text-sm text-red-500 mt-1">Número é obrigatório</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cidade</label>
                                <input
                                    type="text"
                                    {...register("address.city", { required: true })}
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Cidade"
                                />
                                {errors.address?.city && <p className="text-sm text-red-500 mt-1">Cidade é obrigatória</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Estado</label>
                                <input
                                    type="text"
                                    {...register("address.state", { required: true })}
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Estado"
                                />
                                {errors.address?.state && <p className="text-sm text-red-500 mt-1">Estado é obrigatório</p>}
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">CEP</label>
                                <input
                                    type="text"
                                    {...register("address.zip_code", { required: true })}
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="00000-000"
                                />
                                {errors.address?.zip_code && <p className="text-sm text-red-500 mt-1">CEP é obrigatório</p>}
                            </div>
                        </div>
                    </div>

                    {/* Botões */}
                    <div className="flex justify-end pt-4 gap-4 border-t mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                        >
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )

}

export default UpdatedCustomer