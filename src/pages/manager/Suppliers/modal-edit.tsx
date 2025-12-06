import { SubmitHandler, useForm } from "react-hook-form"
import { Supplier } from "../../../service/interfaces"
import { useEffect } from "react"
import { updateSupplier } from "../../../service/api/Administrador/suppliers/supplier"
import Swal from "sweetalert2"
import { maskCpfCnpj, maskPhone } from "../../../utils/masks"
import { UserIcon, X } from "lucide-react"

type Props = {
  supplier: Supplier | null
  onClose: () => void
}

const UpdatedSupplierForm = ({ supplier, onClose }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<Supplier>()

  useEffect(() => {
    if (supplier) {
      reset(supplier)
    }
  }, [supplier, reset])

  const onSubmit: SubmitHandler<Supplier> = async (data) => {
    if (!supplier?.id) return
    try {
      await updateSupplier(supplier.id, {
        ...data,
        active: data.active === "Ativo",
        updatedAt: new Date()
      })
      Swal.fire("Sucesso", "Fornecedor atualizado com sucesso!", "success")
      onClose()
    } catch (error) {
      console.error("Erro ao atualizar fornecedor:", error)
      Swal.fire("Erro", "Erro ao atualizar fornecedor.", "error")
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
                Editar Fornecedor
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
        {/* Formulário */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-7xl mx-auto bg-white shadow-lg rounded-2xl border border-gray-200  overflow-y-auto"
        >
          <div className="flex-1 px-4 py-4" style={{ minHeight: "600px" }}>
            {/* Dados Básicos */}
            <div className="space-y-8">
              <h3 className="text-lg font-semibold text-slate-700 border-b border-slate-200 pb-3">
                Dados Básicos
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Código <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("code", { required: "Código é obrigatório" })}
                    placeholder="00001"
                    className={`w-full rounded-lg border px-4 py-3 text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-300 outline-none transition ${errors.code ? "border-red-500 ring-red-100" : "border-slate-300"
                      }`}
                  />
                  {errors.code && (
                    <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Razão Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("name", { required: "Razão Social é obrigatória" })}
                    placeholder="XPTO Distribuidora S.A."
                    className={`w-full rounded-lg border px-4 py-3 text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-300 outline-none transition ${errors.name ? "border-red-500 ring-red-100" : "border-slate-300"
                      }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    {...register("trading_name")}
                    placeholder="XPTO"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-300 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    CNPJ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("national_register_code", {
                      required: "CNPJ é obrigatório",
                      pattern: {
                        value: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
                        message: "CNPJ inválido"
                      }
                    })}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    onChange={(e) => {
                      e.target.value = maskCpfCnpj(e.target.value);
                    }}
                    className={`w-full rounded-lg border px-4 py-3 text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-300 outline-none transition ${errors.national_register_code ? "border-red-500 ring-red-100" : "border-slate-300"
                      }`}
                  />
                  {errors.national_register_code && (
                    <p className="text-red-500 text-xs mt-1">{errors.national_register_code.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Dados de Contato */}
            <div className="space-y-8">
              <h3 className="text-lg font-semibold text-slate-700 border-b border-slate-200 pb-3">
                Dados de Contato
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register("email", {
                      required: "E-mail é obrigatório",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "E-mail inválido"
                      }
                    })}
                    placeholder="contato@fornecedor.com"
                    className={`w-full rounded-lg border px-4 py-3 text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-300 outline-none transition ${errors.email ? "border-red-500 ring-red-100" : "border-slate-300"
                      }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Telefone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("phone", { required: "Telefone é obrigatório" })}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    onChange={(e) => {
                      e.target.value = maskPhone(e.target.value);
                    }}
                    className={`w-full rounded-lg border px-4 py-3 text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-300 outline-none transition ${errors.phone ? "border-red-500 ring-red-100" : "border-slate-300"
                      }`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-700 border-b border-slate-200 pb-3">
                Status
              </h3>
              <div>
                <div>
                  <label>
                    <input
                      {...register("active")}
                      className="accent-blue-600 mr-2"
                      type="radio"
                      value="Ativo"
                    />
                    Ativo
                  </label>
                </div>

                <div>
                  <label>
                    <input
                      {...register("active")}
                      className="accent-blue-600 mr-2"
                      type="radio"
                      value="Inativo"
                    />
                    Inativo
                  </label>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-4 border-t border-slate-200 pt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                className="px-8 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition shadow-sm"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdatedSupplierForm