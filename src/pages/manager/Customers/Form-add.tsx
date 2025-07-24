import { SubmitHandler, useForm } from "react-hook-form";
import { Customer } from "../../../service/interfaces";
import { PackagePlus, Save } from "lucide-react";
import { insertCustomer } from "../../../service/api/Administrador/customer/clients";

interface FormAddedProps {
    onCustomerAdded: () => void
}

const CustomerRegistrationForm: React.FC<FormAddedProps> = ({ onCustomerAdded }) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<Customer>()

    const onSubmit: SubmitHandler<Customer> = async (data) => {
        try {
            const payload: Customer = {
                ...data,
                addedAt: new Date(),
            };
            await insertCustomer(payload);
            reset();
            onCustomerAdded()
        } catch (error) {
            console.error("Erro ao adicionar novo cliente: ", error);
            throw new Error("Erro interno do servidor!");
        }
    };

    const maskPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1')
    }
    const maskZipCode = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1')
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-[900px] mx-auto p-8 bg-white shadow-lg rounded-lg space-y-6"
        >
            <h2 className="text-3xl font-bold text-gray-700 flex items-center gap-3 mb-6">
                <PackagePlus size={30} /> Cadastro de Clientes
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Nome */}
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Nome do Cliente *</label>
                    <input
                        type="text"
                        {...register("name", { required: "Nome obrigatório" })}
                        className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ex: Roger macedo"
                    />
                    {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
                </div>

                {/* Código */}
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Código *</label>
                    <input
                        type="text"
                        {...register("code", { required: "Código obrigatório" })}
                        className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ex: CLI-000"
                    />
                    {errors.code && <p className="text-red-600 text-sm mt-1">{errors.code.message}</p>}
                </div>

                {/* Telefone */}
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Telefone *</label>
                    <input
                        {...register("phone",
                            {
                                required: "Adicione um telefone",
                                onChange: (e) => {
                                    e.target.value = maskPhone(e.target.value)
                                }
                            })}
                        className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="(XX) XXXX-XXXX"
                    />
                    {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
                </div>
                {/* E-mail */}
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">E-mail *</label>
                    <input
                        type="text"
                        {...register("email", { required: "Adicione um email ao cliente" })}
                        className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ex: email@gmail.com"
                    />
                    {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
                </div>

                {/* Estado */}
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Estado *</label>
                    <input
                        type="text"
                        {...register("address.state", { required: "Adicione um estado ao cliente" })}
                        className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ex: São paulo"
                    />
                    {errors.address?.state && <p className="text-red-600 text-sm mt-1">{errors.address?.state.message}</p>}
                </div>

                {/* Cidade */}
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Cidade *</label>
                    <input
                        type="text"
                        {...register("address.city", { required: "Adicione uma cidade ao cliente" })}
                        className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ex: Sorocaba"
                    />
                    {errors.address?.city && <p className="text-red-600 text-sm mt-1">{errors.address?.city.message}</p>}
                </div>

                {/* Rua */}
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Rua *</label>
                    <input
                        type="text"
                        {...register("address.street", { required: "Adicione uma rua ao cliente" })}
                        className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ex: Av. Celso garcia"
                    />
                    {errors.address?.street && <p className="text-red-600 text-sm mt-1">{errors.address?.street.message}</p>}
                </div>

                {/* Numero */}
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Numero *</label>
                    <input
                        type="number"
                        {...register("address.number", { required: "Estoque mínimo obrigatório", valueAsNumber: true })}
                        className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ex: 1245"
                    />
                    {errors.address?.number && <p className="text-red-600 text-sm mt-1">{errors.address?.number.message}</p>}
                </div>

                {/* CEP */}
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">CEP *</label>
                    <input
                        {...register("address.zip_code",
                            {
                                required: "Adicione um CEP ao cliente",
                                onChange: (e) => {
                                    e.target.value = maskZipCode(e.target.value)
                                }
                            })}
                        className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ex: XXXXX-XXX"
                    />
                    {errors.address?.zip_code && <p className="text-red-600 text-sm mt-1">{errors.address?.zip_code.message}</p>}
                </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-4 mt-8">
                <button
                    type="button"
                    onClick={() => reset()}
                    className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
                >
                    Limpar
                </button>

                <button
                    type="submit"
                    className="flex items-center gap-2 bg-slate-800 hover:bg-indigo-700 text-white px-6 py-2 rounded shadow-md transition"
                >
                    <Save size={18} /> Adicionar
                </button>
            </div>
        </form>
    );
}

export default CustomerRegistrationForm