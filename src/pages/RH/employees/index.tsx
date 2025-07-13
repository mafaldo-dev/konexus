import { type SubmitHandler, useForm } from "react-hook-form"
import { Employee } from "../../../service/interfaces"
import { handleAllEmployee, insertEmployee } from "../../../service/api/Administrador/employee"
import { User, Lock, MapPin, Loader2, CheckCircle } from "lucide-react"
import Dashboard from "../../../components/dashboard/Dashboard"
import { useState } from "react"

export default function EmployeeAdministration() {
  const [success, setSuccess] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Employee>()
  
  const onSubmit: SubmitHandler<Employee> = async (data) => {
    setIsSubmitting(true)
    try {
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
      await handleAllEmployee()
      setSuccess(true)
    } finally {
      setIsSubmitting(false)
    }
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cadastro de Funcionário</h1>
            <p className="text-gray-600 font-medium">Preencha as informações para cadastrar um novo funcionário</p>
            <div className="w-20 h-1 bg-blue-500 mx-auto mt-4 rounded-full"></div>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <p className="font-medium text-center">Funcionário cadastrado com sucesso!</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Seção Dados de Acesso */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Dados de Acesso</h3>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usuário <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("username", { required: true })}
                    placeholder="Digite o nome de usuário"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {errors.username && <p className="mt-1 text-sm text-red-600">Usuário é obrigatório</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    {...register("password", { required: true })}
                    placeholder="Digite a senha"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {errors.password && <p className="mt-1 text-sm text-red-600">Senha é obrigatória</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Acesso <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("access", { required: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiAjdjY3Y2UxIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtY2hldnJvbi1kb3duIj48cGF0aCBkPSJtNiA5IDYgNiA2LTYiLz48L3N2Zz4=')] bg-no-repeat bg-[center_right_1rem]"
                  >
                    <option value="">Selecione o tipo de acesso</option>
                    <option value="ADMIN">Admin</option>
                    <option value="EMPLOYEE">Normal</option>
                  </select>
                  {errors.access && <p className="mt-1 text-sm text-red-600">Tipo de acesso é obrigatório</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Função <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("designation", { required: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiAjdjY3Y2UxIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtY2hldnJvbi1kb3duIj48cGF0aCBkPSJtNiA5IDYgNiA2LTYiLz48L3N2Zz4=')] bg-no-repeat bg-[center_right_1rem]"
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salário <span className="text-red-500">*</span>
                  </label>
                  <div className="relative w-64">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">R$</span>
                    <input
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="0,00"
                      type="text"
                      {...register("salary", {
                        required: true,
                        onChange: (e) => {
                          e.target.value = maskSalaryBRL(e.target.value)
                        },
                      })}
                    />
                  </div>
                  {errors.salary && <p className="mt-1 text-sm text-red-600">Salário é obrigatório</p>}
                </div>
              </div>
            </div>

            {/* Seção Dados Pessoais */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Dados Pessoais</h3>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("dataEmployee.fullname", { required: true })}
                    placeholder="Digite o nome completo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {errors.dataEmployee?.fullname && (
                    <p className="mt-1 text-sm text-red-600">Nome completo é obrigatório</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("dataEmployee.phone", {
                      required: true,
                      onChange: (e) => {
                        e.target.value = maskPhone(e.target.value)
                      },
                    })}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {errors.dataEmployee?.phone && <p className="mt-1 text-sm text-red-600">Telefone é obrigatório</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register("dataEmployee.email", { required: true })}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {errors.dataEmployee?.email && <p className="mt-1 text-sm text-red-600">Email é obrigatório</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Nascimento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("dataEmployee.birth_date", { required: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {errors.dataEmployee?.birth_date && (
                    <p className="mt-1 text-sm text-red-600">Data de nascimento é obrigatória</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RG <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("dataEmployee.RG", {
                      required: true,
                      onChange: (e) => {
                        e.target.value = maskRg(e.target.value)
                      },
                    })}
                    placeholder="00.000.000-0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {errors.dataEmployee?.RG && <p className="mt-1 text-sm text-red-600">RG é obrigatório</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("dataEmployee.CPF", {
                      required: true,
                      onChange: (e) => {
                        e.target.value = maskCpf(e.target.value)
                      },
                    })}
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {errors.dataEmployee?.CPF && <p className="mt-1 text-sm text-red-600">CPF é obrigatório</p>}
                </div>
              </div>
            </div>

            {/* Seção Endereço */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Endereço</h3>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("address.city", { required: true })}
                    placeholder="Digite a cidade"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {errors.address?.city && <p className="mt-1 text-sm text-red-600">Cidade é obrigatória</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("address.state", { required: true })}
                    placeholder="Digite o estado"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {errors.address?.state && <p className="mt-1 text-sm text-red-600">Estado é obrigatório</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rua <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("address.street", { required: true })}
                    placeholder="Digite a rua"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {errors.address?.street && <p className="mt-1 text-sm text-red-600">Rua é obrigatória</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register("address.num", { required: true })}
                    placeholder="Digite o número"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {errors.address?.num && <p className="mt-1 text-sm text-red-600">Número é obrigatório</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-slate-800 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Cadastrar Funcionário
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dashboard>
  )
}