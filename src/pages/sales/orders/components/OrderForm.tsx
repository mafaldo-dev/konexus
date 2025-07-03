import React, { useState } from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { Plus, Trash2, Package, User, Calendar } from "lucide-react"
import { motion } from "framer-motion"

import { useNavigate } from "react-router-dom"
import { insertOrder } from "../../../../service/api/orders"
import { Order } from "../../../../service/interfaces/sales/orders"

type FormValues = Omit<Order, "order_number" | "total_amount" | "status"> & {
  order_number: string
  total_amount: number
  status: "Pendente" | "Separando" | "Finalizado" | "Enviado"
}

export default function OrderForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      order_number: `PED-${Date.now().toString().slice(-6)}`,
      customer_name: "",
      customer_phone: "",
      customer_address: "",
      salesperson: "",
      order_date: "",
      delivery_date: "",
      items: [{ product_code: "", product_name: "", quantity: 1, unit_price: 0, total: 0, location: "" }],
      total_amount: 0,
      status: "Pendente",
      notes: "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  })

  // Atualiza total e total_amount sempre que itens mudam
  const items = useWatch({ control, name: "items" })

  React.useEffect(() => {
    let totalAmount = 0
    items.forEach((item, index) => {
      const quantity = item.quantity || 0
      const unit_price = item.unit_price || 0
      const total = quantity * unit_price
      totalAmount += total

      if (total !== item.total) {
        setValue(`items.${index}.total`, total)
      }
    })

    setValue("total_amount", totalAmount)
  }, [items, setValue])

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      // Chama a função para inserir no banco
      const id = await insertOrder({
        ...data,
        delivery_date: data.delivery_date || "",
        order_date: new Date().getFullYear(),
        status: "Pendente",
      })

      console.log(data)
      alert(`Pedido criado com sucesso! ID: ${id}`)
      navigate("/sales/orders")
    } catch (error) {
      alert("Erro ao criar pedido. Tente novamente.")
      console.error(error)
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Cabeçalho */}
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-900">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-slate-600" />
                </div>
                Informações do Pedido
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Número do Pedido
                  </label>
                  <input
                    {...register("order_number")}
                    readOnly
                    className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Data do Pedido
                  </label>
                  <input
                    type="date"
                    {...register("order_date", { required: "Data do pedido é obrigatória" })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                  {/* {errors.order_date && <p className="text-red-600 text-sm mt-1">{errors.order_date.message}</p>} */}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Previsão de Entrega
                  </label>
                  <input
                    type="date"
                    {...register("delivery_date", { required: "Data de entrega é obrigatória" })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                  {errors.delivery_date && <p className="text-red-600 text-sm mt-1">{errors.delivery_date.message}</p>}
                </div>
              </div>
            </div>

            {/* Cliente */}
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-900">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
                Dados do Cliente
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Nome do Cliente *
                  </label>
                  <input
                    {...register("customer_name", { required: "Nome do cliente é obrigatório" })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                  {errors.customer_name && <p className="text-red-600 text-sm mt-1">{errors.customer_name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Telefone
                  </label>
                  <input
                    {...register("customer_phone", {
                      required: "Telefone é obrigatório",
                      onChange: (e) => {
                        e.target.value = maskPhone(e.target.value)
                      },
                    })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                  {errors.customer_phone && (
                    <p className="text-red-600 text-sm mt-1">{errors.customer_phone.message}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Endereço de Entrega
                  </label>
                  <textarea
                    {...register("customer_address")}
                    className="w-full border border-gray-300 rounded-lg p-3 h-24 resize-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    placeholder="Ex: Rua comendador ermelino, N: 1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Vendedor *
                  </label>
                  <input
                    {...register("salesperson", { required: "Vendedor é obrigatório" })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                  />
                  {errors.salesperson && <p className="text-red-600 text-sm mt-1">{errors.salesperson.message}</p>}
                </div>
              </div>
            </div>

            {/* Itens */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex justify-between items-center bg-slate-800 text-white p-6">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <Calendar className="w-5 h-5" /> Itens do Pedido
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    append({ product_code: "", product_name: "", quantity: 1, unit_price: 0, total: 0, location: "" })
                  }
                  className="flex items-center gap-2 text-sm bg-white text-slate-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Adicionar Item
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left font-semibold text-gray-700 uppercase tracking-wide">Código</th>
                      <th className="p-4 text-left font-semibold text-gray-700 uppercase tracking-wide">Produto</th>
                      <th className="p-4 text-left font-semibold text-gray-700 uppercase tracking-wide">Qtd</th>
                      <th className="p-4 text-left font-semibold text-gray-700 uppercase tracking-wide">Preço Unit.</th>
                      <th className="p-4 text-left font-semibold text-gray-700 uppercase tracking-wide">Total</th>
                      <th className="p-4 text-left font-semibold text-gray-700 uppercase tracking-wide">Localização</th>
                      <th className="p-4 text-left font-semibold text-gray-700 uppercase tracking-wide">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((item, index) => (
                      <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <input
                            {...register(`items.${index}.product_code` as const)}
                            className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                          />
                        </td>
                        <td className="p-4">
                          <input
                            {...register(`items.${index}.product_name` as const)}
                            className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                          />
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            min={1}
                            {...register(`items.${index}.quantity` as const, {
                              valueAsNumber: true,
                              min: 1,
                            })}
                            className="border border-gray-300 p-2 rounded-lg w-20 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                          />
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            {...register(`items.${index}.unit_price`, {
                              valueAsNumber: true,
                              min: 0,
                            })}
                            className="border border-gray-300 p-2 rounded-lg w-28 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                          />
                        </td>
                        <td className="p-4 text-slate-700 font-bold">R$ {items[index]?.total?.toFixed(2) || "0.00"}</td>
                        <td className="p-4">
                          <input
                            {...register(`items.${index}.location` as const)}
                            className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                          />
                        </td>
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                            className="text-red-600 hover:text-red-800 disabled:text-gray-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <div className="text-right">
                  <p className="text-sm text-gray-600 font-medium uppercase tracking-wide mb-1">Total do Pedido</p>
                  <p className="text-2xl font-bold text-slate-800">R$ {watch("total_amount").toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Observações
              </label>
              <textarea
                {...register("notes")}
                className="w-full border border-gray-300 rounded-lg p-3 h-24 resize-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                placeholder="Adicione observações sobre o pedido..."
              />
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-4 pb-8">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => navigate("/sales/orders")}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Criando..." : "Criar Pedido"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
