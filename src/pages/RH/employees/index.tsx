import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { Employee, EmployeeDesignation, EmployeeFunction } from "../../../service/interfaces/employees";

import Dashboard from "../../../components/dashboard";
import { handleAllEmployee, insertEmployee } from "../../../service/api/employee";

export default function EmployeeAdministration() {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<Employee>();
    const [success, setSuccess] = useState(false);
    const [employee, setEmployee] = useState<Employee[]>([])

    const onSubmit: SubmitHandler<Employee> = async (data) => {
        const formattedData: Employee = {
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            active: true,
            address: {
                ...data.address,
                num: Number(data.address.num)
            }
        }
        await insertEmployee(formattedData)
        reset();
        const res = await handleAllEmployee()
        setSuccess(true);
        setEmployee(res)
    };

    const maskPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1')
    }

    const maskCpf = (value: string) => {
        return value
            .replace(/\D/g, '') // Remove tudo que não é dígito
            .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após os 3 primeiros dígitos
            .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após os 3 dígitos seguintes
            .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Coloca hífen antes dos últimos 2 dígitos
            .replace(/(-\d{2})\d+?$/, '$1'); // Impede digitar além do limite
    };
    const maskRg = (value: string) => {
        return value
            .replace(/\D/g, '') // Remove tudo que não é dígito
            .replace(/(\d{2})(\d)/, '$1.$2') // Coloca ponto após os 2 primeiros dígitos
            .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após os 3 dígitos seguintes
            .replace(/(\d{3})(\d{1})/, '$1-$2') // Coloca hífen antes do último dígito
            .replace(/(-\d{1})\d+?$/, '$1'); // Impede digitar além do limite
    };
    function maskSalaryBRL(value: string) {
        value = value.replace(/\D/g, ''); // remove tudo que não é dígito
        value = (parseInt(value, 10) / 100).toFixed(2) + ''; // divide por 100 e fixa 2 casas
        value = value.replace('.', ','); // troca ponto por vírgula
        value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // adiciona pontos nos milhares
        return 'R$ ' + value;
    }

    return (
        <Dashboard>
            <div className="max-w-5xl mx-auto p-8 bg-gradient-to-br from-blue-50 to-white shadow-xl rounded-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-extrabold text-gray-800 mb-2">Cadastro de Funcionário</h2>
                    <div className="w-20 h-1 bg-blue-500 mx-auto"></div>
                </div>

                {success && (
                    <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
                        <p className="font-medium text-center">Funcionário cadastrado com sucesso!</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Seção de Acesso */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center mb-4">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700">Dados de Acesso</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Usuário</label>
                                <input
                                    {...register("username", { required: true })}
                                    placeholder="Digite o nome de usuário"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                                {errors.username && <p className="mt-1 text-sm text-red-600">Usuário é obrigatório</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Senha</label>
                                <input
                                    type="password"
                                    {...register("password", { required: true })}
                                    placeholder="Digite a senha"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                                {errors.password && <p className="mt-1 text-sm text-red-600">Senha é obrigatória</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Acesso</label>
                                <select
                                    {...register("access", { required: true })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                >
                                    <option value="">Selecione o tipo de acesso</option>
                                    <option value={EmployeeDesignation.ADMIN}>Admin</option>
                                    <option value={EmployeeDesignation.EMPLOYEE}>Normal</option>
                                </select>
                                {errors.access && <p className="mt-1 text-sm text-red-600">Tipo de acesso é obrigatório</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Função</label>
                                <select
                                    {...register("designation", { required: true })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                >
                                    <option value="">Selecione a função</option>
                                    <option value={EmployeeFunction.SELLER}>Vendedor</option>
                                    <option value={EmployeeFunction.RECEIVER}>Conferente</option>
                                    <option value={EmployeeFunction.STOCKIST}>Estoquista</option>
                                    <option value={EmployeeFunction.MANAGER}>Gerente</option>
                                    <option value={EmployeeFunction.ADMIN}>Administração</option>
                                </select>
                                {errors.designation && <p className="mt-1 text-sm text-red-600">Função é obrigatória</p>}
                            </div>
                        </div>
                        <div className="mt-2">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Salario</label>
                            <input className="w-36 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="R$: x.xxx,xx"
                                type="text"
                                {...register("salary", {
                                    required: true,
                                    onChange: (e) => {
                                        e.target.value = maskSalaryBRL(e.target.value)
                                    }
                                })} />
                        </div>
                    </div>

                    {/* Seção de Dados Pessoais */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center mb-4">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700">Dados Pessoais</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Nome Completo</label>
                                <input
                                    {...register("dataEmployee.fullname", { required: true })}
                                    placeholder="Digite o nome completo"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                                {errors.dataEmployee?.fullname && <p className="mt-1 text-sm text-red-600">Nome completo é obrigatório</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Telefone</label>
                                <input
                                    {...register("dataEmployee.phone", {
                                        required: true,
                                        onChange: (e) => {
                                            e.target.value = maskPhone(e.target.value)
                                        }
                                    })}
                                    placeholder="Digite o telefone"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                                {errors.dataEmployee?.phone && <p className="mt-1 text-sm text-red-600">Telefone é obrigatório</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                                <input
                                    {...register("dataEmployee.email", { required: true })}
                                    placeholder="Digite o email"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                                {errors.dataEmployee?.email && <p className="mt-1 text-sm text-red-600">Email é obrigatório</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Data de Nascimento</label>
                                <input
                                    type="date"
                                    {...register("dataEmployee.birth_date", { required: true })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                                {errors.dataEmployee?.birth_date && <p className="mt-1 text-sm text-red-600">Data de nascimento é obrigatória</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">RG</label>
                                <input
                                    {...register("dataEmployee.RG", {
                                        required: true,
                                        onChange: (e) => {
                                            e.target.value = maskRg(e.target.value)
                                        }
                                    })}
                                    placeholder="Digite o RG"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                                {errors.dataEmployee?.RG && <p className="mt-1 text-sm text-red-600">RG é obrigatório</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">CPF</label>
                                <input
                                    {...register("dataEmployee.CPF", {
                                        required: true,
                                        onChange: (e) => {
                                            e.target.value = maskCpf(e.target.value)
                                        }
                                    })}
                                    placeholder="Digite o CPF"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                                {errors.dataEmployee?.CPF && <p className="mt-1 text-sm text-red-600">CPF é obrigatório</p>}
                            </div>
                        </div>
                    </div>

                    {/* Seção de Endereço */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center mb-4">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700">Endereço</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Cidade</label>
                                <input
                                    {...register("address.city", { required: true })}
                                    placeholder="Digite a cidade"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                                {errors.address?.city && <p className="mt-1 text-sm text-red-600">Cidade é obrigatória</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Estado</label>
                                <input
                                    {...register("address.state", { required: true })}
                                    placeholder="Digite o estado"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                                {errors.address?.state && <p className="mt-1 text-sm text-red-600">Estado é obrigatório</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Rua</label>
                                <input
                                    {...register("address.street", { required: true })}
                                    placeholder="Digite a rua"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                                {errors.address?.street && <p className="mt-1 text-sm text-red-600">Rua é obrigatória</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Número</label>
                                <input
                                    {...register("address.num", { required: true })}
                                    placeholder="Digite o número"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                                {errors.address?.num && <p className="mt-1 text-sm text-red-600">Número é obrigatório</p>}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        Cadastrar Funcionário
                    </button>
                </form>
            </div>
        </Dashboard>
    );
};
