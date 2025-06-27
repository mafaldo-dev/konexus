import React, { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Plus, Trash2, Package, User, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { insertOrder } from "../../../service/api/orders";
import { Order, OrderItem } from "../../../service/interfaces/orders";
import { Navigate, useNavigate } from "react-router-dom";

type FormValues = Omit<Order, "order_number" | "total_amount" | "status"> & {
  order_number: string;
  total_amount: number;
  status: "pendente" | "separando" | "separado" | "enviado"; // ajuste conforme seu enum
};

export default function OrderForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      order_date: new Date().toISOString().split("T")[0],
      delivery_date: "",
      items: [{ product_code: "", product_name: "", quantity: 1, unit_price: 0, total: 0, location: "" }],
      total_amount: 0,
      status: "pendente",
      notes: "",
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "items",
  });

  // Atualiza total e total_amount sempre que itens mudam
  const items = watch("items");

  React.useEffect(() => {
    let totalAmount = 0;
    items.forEach((item, index) => {
      const quantity = item.quantity || 0;
      const unit_price = item.unit_price || 0;
      const total = quantity * unit_price;
      totalAmount += total;
      if (total !== item.total) {
        update(index, { ...item, total });
      }
    });
    setValue("total_amount", totalAmount);
  }, [items, setValue, update]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Chama a função para inserir no banco
      const id = await insertOrder({
        ...data,
        status: "pendente",
      });
      alert(`Pedido criado com sucesso! ID: ${id}`);
      navigate("/sales/orders")
    } catch (error) {
      alert("Erro ao criar pedido. Tente novamente.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Cabeçalho */}
        <div className="bg-white shadow rounded p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-700">
            <Package className="w-5 h-5" /> Informações do Pedido
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Número do Pedido</label>
              <input {...register("order_number")} readOnly className="w-full border rounded p-2 bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data do Pedido</label>
              <input
                type="date"
                {...register("order_date", { required: "Data do pedido é obrigatória" })}
                className="w-full border rounded p-2"
              />
              {errors.order_date && <p className="text-red-600 text-sm">{errors.order_date.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Previsão de Entrega</label>
              <input type="date" {...register("delivery_date")} className="w-full border rounded p-2" />
            </div>
          </div>
        </div>

        {/* Cliente */}
        <div className="bg-white shadow rounded p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-emerald-700">
            <User className="w-5 h-5" /> Dados do Cliente
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Cliente *</label>
              <input
                {...register("customer_name", { required: "Nome do cliente é obrigatório" })}
                className="w-full border rounded p-2"
              />
              {errors.customer_name && <p className="text-red-600 text-sm">{errors.customer_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <input {...register("customer_phone")} className="w-full border rounded p-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Endereço de Entrega</label>
              <textarea {...register("customer_address")} className="w-full border rounded p-2 h-24" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vendedor *</label>
              <input
                {...register("salesperson", { required: "Vendedor é obrigatório" })}
                className="w-full border rounded p-2"
              />
              {errors.salesperson && <p className="text-red-600 text-sm">{errors.salesperson.message}</p>}
            </div>
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white shadow rounded">
          <div className="flex justify-between items-center bg-purple-700 text-white p-4 rounded-t">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Itens do Pedido
            </h2>
            <button
              type="button"
              onClick={() =>
                append({ product_code: "", product_name: "", quantity: 1, unit_price: 0, total: 0, location: "" })
              }
              className="flex items-center gap-1 text-sm bg-white text-purple-700 px-2 py-1 rounded"
            >
              <Plus className="w-4 h-4" /> Adicionar Item
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2">Código</th>
                  <th className="p-2">Produto</th>
                  <th className="p-2">Qtd</th>
                  <th className="p-2">Preço Unit.</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Localização</th>
                  <th className="p-2">Ação</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((item, index) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-2">
                      <input
                        {...register(`items.${index}.product_code` as const)}
                        className="border p-1 rounded w-full"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        {...register(`items.${index}.product_name` as const)}
                        className="border p-1 rounded w-full"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={1}
                        {...register(`items.${index}.quantity` as const, {
                          valueAsNumber: true,
                          min: 1,
                        })}
                        className="border p-1 rounded w-20"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        {...register(`items.${index}.unit_price` as const, {
                          valueAsNumber: true,
                          min: 0,
                        })}
                        className="border p-1 rounded w-24"
                      />
                    </td>
                    <td className="p-2 text-emerald-600 font-semibold">
                      R$ {items[index]?.total?.toFixed(2) || "0.00"}
                    </td>
                    <td className="p-2">
                      <input
                        {...register(`items.${index}.location` as const)}
                        className="border p-1 rounded w-full"
                      />
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="text-red-500 hover:underline"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-100 text-right text-lg font-semibold text-emerald-600">
            Total do Pedido: R$ {watch("total_amount").toFixed(2)}
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white shadow rounded p-6">
          <label className="block text-sm font-medium mb-1">Observações</label>
          <textarea {...register("notes")} className="w-full border rounded p-2 h-24" />
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              // Você pode implementar reset se quiser
            }}
            className="px-6 py-2 border rounded text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {isSubmitting ? "Criando..." : "Criar Pedido"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
