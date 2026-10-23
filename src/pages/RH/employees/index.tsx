import { type SubmitHandler, useForm } from "react-hook-form"
import {
  createCollaborator,
  listCompanyRoles,
  CompanyRole,
} from "../../../services/collaboratorService"
import { Lock, Loader2, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react"
import Dashboard from "../../../components/dashboard/Dashboard"
import { DataState } from "../../../components/ui/DataState"
import { useAuth } from "../../../AuthContext"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

interface EmployeeForm {
  username: string
  password: string
  roleId: string
  sector: string
}

export default function EmployeeAdministration() {
  const { isCompanyAdmin } = useAuth()
  const [success, setSuccess] = useState<boolean>(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [roles, setRoles] = useState<CompanyRole[]>([])
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [loadingRoles, setLoadingRoles] = useState<boolean>(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmployeeForm>()

  useEffect(() => {
    const loadRoles = async () => {
      if (!isCompanyAdmin) {
        setLoadingRoles(false)
        return
      }
      setLoadingRoles(true)
      setRolesError(null)
      try {
        const response = await listCompanyRoles()
        if (!response.ok || !response.data) {
          setRoles([])
          setRolesError(response.error || "Não foi possível carregar os cargos.")
          return
        }
        setRoles(response.data.filter((role) => role.active && !role.is_system_admin))
      } catch (error) {
        console.error("Erro ao carregar cargos:", error)
        setRoles([])
        setRolesError("Não foi possível carregar os cargos. Tente novamente.")
      } finally {
        setLoadingRoles(false)
      }
    }
    loadRoles()
  }, [isCompanyAdmin])

  const onSubmit: SubmitHandler<EmployeeForm> = async (data) => {
    setIsSubmitting(true)
    setFormError(null)
    setSuccess(false)
    try {
      const response = await createCollaborator({
        username: data.username,
        password: data.password,
        roleId: Number(data.roleId),
        sector: data.sector || undefined,
        forcePasswordChange: true,
      })
      if (!response.ok) {
        throw new Error(response.error || "Erro ao criar funcionário")
      }
      reset()
      setSuccess(true)
    } catch (error) {
      console.error("Erro ao cadastrar colaborador:", error)
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o colaborador."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isCompanyAdmin) {
    return (
      <Dashboard>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <DataState
              variant="forbidden"
              description="Somente o administrador da empresa pode criar contas de acesso. A permissão de RH não concede credenciais administrativas."
            />
            <Link
              to="/rh/employees"
              className="mt-2 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Voltar para colaboradores
            </Link>
          </div>
        </div>
      </Dashboard>
    )
  }

  return (
    <Dashboard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-4">
            <Link
              to="/rh/employees"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para colaboradores
            </Link>
          </div>
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

          {formError && (
            <div
              role="alert"
              className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium text-center">{formError}</p>
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
                    Setor de atuação <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("sector", { required: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiAjdjY3Y2UxIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtY2hldnJvbi1kb3duIj48cGF0aCBkPSJtNiA5IDYgNiA2LTYiLz48L3N2Zz4=')] bg-no-repeat bg-[center_right_1rem]"
                  >
                    <option value="">Selecione o tipo de acesso</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Estoque">Estoque</option>
                    <option value="Gerencia">Gerencia</option>
                    <option value="Escritorio">Escritorio</option>
                  </select>
                  {errors.sector && <p className="mt-1 text-sm text-red-600">Tipo de acesso é obrigatório</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("roleId", { required: true })}
                    disabled={loadingRoles}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white disabled:bg-gray-100"
                  >
                    <option value="">
                      {loadingRoles ? "Carregando cargos..." : "Selecione o cargo"}
                    </option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  {errors.roleId && <p className="mt-1 text-sm text-red-600">Cargo é obrigatório</p>}
                  {rolesError && <p className="mt-1 text-sm text-red-600">{rolesError}</p>}
                  {!loadingRoles && !rolesError && roles.length === 0 && (
                    <p className="mt-1 text-sm text-amber-700">
                      Nenhum cargo personalizado ativo. Cadastre um cargo em{" "}
                      <Link to="/config/users-permissions" className="underline">
                        Usuários e Permissões
                      </Link>
                      .
                    </p>
                  )}
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