import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { Employee } from "../../../service/interfaces"

import { handleAllEmployee, insertEmployee } from "../../../service/api/Administrador/employee"

import { User, Lock, MapPin } from "lucide-react"

import Dashboard from "../../../components/dashboard/Dashboard"

export default function EmployeeAdministration() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Employee>()
  const [success, setSuccess] = useState(false)
  const [employee, setEmployee] = useState<Employee[]>([])

  const onSubmit: SubmitHandler<Employee> = async (data) => {
    const formattedData: Employee = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: true,
      address: {
        ...data.address,
        num: Number(data.address.num),
      },
    }

    await insertEmployee(formattedData)
    reset()
    const res = await handleAllEmployee()
    setSuccess(true)
    setEmployee(res)
  }

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1")
  }

  const maskCpf = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1")
  }

  const maskRg = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1})/, "$1-$2")
      .replace(/(-\d{1})\d+?$/, "$1")
  }

  function maskSalaryBRL(value: string) {
    value = value.replace(/\D/g, "")
    value = (Number.parseInt(value, 10) / 100).toFixed(2) + ""
    value = value.replace(".", ",")
    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    return "R$ " + value
  }

  return (
    <Dashboard>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cadastro de Funcionário</h1>
            <p className="text-gray-600 font-medium">Preencha as informações para cadastrar um novo funcionário</p>
            <div className="w-20 h-1 bg-slate-600 mx-auto mt-4"></div>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg">
              <p className="font-medium text-center">Funcionário cadastrado com sucesso!</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mr-3">
                  <Lock className="w-4 h-4 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Dados de Acesso</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Usuário
                  </label>
                  <input
                    {...register("username", { required: true })}
                    placeholder="Digite o nome de usuário"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                  {errors.username && <p className="mt-1 text-sm text-red-600">Usuário é obrigatório</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Senha
                  </label>
                  <input
                    type="password"
                    {...register("password", { required: true })}
                    placeholder="Digite a senha"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                  {errors.password && <p className="mt-1 text-sm text-red-600">Senha é obrigatória</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Tipo de Acesso
                  </label>
                  <select
                    {...register("access", { required: true })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  >
                    <option value="">Selecione o tipo de acesso</option>
                    <option value="ADMIN">Admin</option>
                    <option value="EMPLOYEE">Normal</option>
                  </select>
                  {errors.access && <p className="mt-1 text-sm text-red-600">Tipo de acesso é obrigatório</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Função
                  </label>
                  <select
                    {...register("designation", { required: true })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  >
                    <option value="">Selecione a função</option>
                    <option value="Vendedor">Vendedor</option>
                    <option value="Conferente">Conferente</option>
                    <option value="Estoquista">Estoquista</option>
                    <option value="Gerente">Gerente</option>
                    <option value="Administrador">Administração</option>
                  </select>
                  {errors.designation && <p className="mt-1 text-sm text-red-600">Função é obrigatória</p>}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Salário
                </label>
                <input
                  className="w-48 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  placeholder="R$: x.xxx,xx"
                  type="text"
                  {...register("salary", {
                    required: true,
                    onChange: (e) => {
                      e.target.value = maskSalaryBRL(e.target.value)
                    },
                  })}
                />
                {errors.salary && <p className="mt-1 text-sm text-red-600">Salário é obrigatório</p>}
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mr-3">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Dados Pessoais</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Nome Completo
                  </label>
                  <input
                    {...register("dataEmployee.fullname", { required: true })}
                    placeholder="Digite o nome completo"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                  {errors.dataEmployee?.fullname && (
                    <p className="mt-1 text-sm text-red-600">Nome completo é obrigatório</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Telefone
                  </label>
                  <input
                    {...register("dataEmployee.phone", {
                      required: true,
                      onChange: (e) => {
                        e.target.value = maskPhone(e.target.value)
                      },
                    })}
                    placeholder="Digite o telefone"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                  {errors.dataEmployee?.phone && <p className="mt-1 text-sm text-red-600">Telefone é obrigatório</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register("dataEmployee.email", { required: true })}
                    placeholder="Digite o email"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                  {errors.dataEmployee?.email && <p className="mt-1 text-sm text-red-600">Email é obrigatório</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    {...register("dataEmployee.birth_date", { required: true })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                  {errors.dataEmployee?.birth_date && (
                    <p className="mt-1 text-sm text-red-600">Data de nascimento é obrigatória</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">RG</label>
                  <input
                    {...register("dataEmployee.RG", {
                      required: true,
                      onChange: (e) => {
                        e.target.value = maskRg(e.target.value)
                      },
                    })}
                    placeholder="Digite o RG"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                  {errors.dataEmployee?.RG && <p className="mt-1 text-sm text-red-600">RG é obrigatório</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">CPF</label>
                  <input
                    {...register("dataEmployee.CPF", {
                      required: true,
                      onChange: (e) => {
                        e.target.value = maskCpf(e.target.value)
                      },
                    })}
                    placeholder="Digite o CPF"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                  {errors.dataEmployee?.CPF && <p className="mt-1 text-sm text-red-600">CPF é obrigatório</p>}
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mr-3">
                  <MapPin className="w-4 h-4 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Endereço</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Cidade
                  </label>
                  <input
                    {...register("address.city", { required: true })}
                    placeholder="Digite a cidade"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                  {errors.address?.city && <p className="mt-1 text-sm text-red-600">Cidade é obrigatória</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Estado
                  </label>
                  <input
                    {...register("address.state", { required: true })}
                    placeholder="Digite o estado"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                  {errors.address?.state && <p className="mt-1 text-sm text-red-600">Estado é obrigatório</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Rua</label>
                  <input
                    {...register("address.street", { required: true })}
                    placeholder="Digite a rua"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                  {errors.address?.street && <p className="mt-1 text-sm text-red-600">Rua é obrigatória</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Número
                  </label>
                  <input
                    type="number"
                    {...register("address.num", { required: true })}
                    placeholder="Digite o número"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                  {errors.address?.num && <p className="mt-1 text-sm text-red-600">Número é obrigatório</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end pb-8">
              <button
                type="submit"
                className="px-8 py-4 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 transition-colors shadow-sm hover:shadow-md"
              >
                Cadastrar Funcionário
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dashboard>
  )
}

