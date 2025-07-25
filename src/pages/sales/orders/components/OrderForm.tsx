import { useState } from "react";
import { useForm } from "react-hook-form";
import { Trash2, Package, User, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { format, addDays } from "date-fns";

import { useNavigate } from "react-router-dom";
import { insertOrder } from "../../../../service/api/Administrador/orders";
import { Order } from "../../../../service/interfaces/sales/orders";

import { ProductsProps } from "../../../../service/interfaces";
import { useProductManagement } from "../../../../hooks/_manager/useProductManagement";

type FormValues = Omit<Order, "items" | "userId" | "total_amount" | "order_number"> & {
  total_amount?: number;
};

export default function OrderForm() {
  const [products, setProducts] = useState<ProductsProps[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Gera o número do pedido uma única vez ao montar o componente
  const [orderNumber] = useState(() => `PED-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);

  const {
    productCode,
    setProductCode,
    addedProduct,
    count,
    setCount,
    price,
    setPrice,
    handleProduct,
    handleAddProduct,
  } = useProductManagement(setProducts);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      customer_address: "",
      salesperson: "",
      order_date: format(new Date(), "yyyy-MM-dd"),
      delivery_date: format(addDays(new Date(), 7), "yyyy-MM-dd"),
      status: "Pendente",
      notes: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (products.length === 0) {
      alert("Adicione pelo menos um produto ao pedido!");
      return;
    }

    setIsSubmitting(true);
    try {
      const total_amount = products.reduce((acc, p) => acc + p.quantity * p.price, 0);

      const orderData: Order = {
        ...data,
        order_number: orderNumber,
        userId: "admin",
        total_amount,
        items: products.map((p) => ({
          product_code: p.code || "",
          product_name: p.product_name,
          quantity: p.quantity,
          unit_price: p.price,
          total: p.quantity * p.price,
          location: p.location || "",
          productId: p.id,
        })),
      };

      await insertOrder(orderData);
      navigate("/sales/orders");
    } catch (err) {
      console.error("Erro ao criar pedido:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

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
                    value={orderNumber}
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
                        e.target.value = maskPhone(e.target.value);
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

            {/* Pesquisa e Adição de Produtos */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-3 text-gray-900">
                <Calendar className="w-5 h-5" /> Adicionar Produto pelo Código
              </h2>
              <div className="flex gap-3 flex-wrap items-center">
                <input
                  type="text"
                  placeholder="Código do produto"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  className="border border-gray-300 p-2 rounded-lg w-48"
                />
                <button
                  type="button"
                  onClick={handleProduct}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-900 transition-colors"
                >
                  Buscar Produto
                </button>
                {addedProduct && (
                  <>
                    <div className="flex gap-2 items-center ml-4">
                      <span className="font-semibold">{addedProduct.name}</span>
                      <input
                        type="number"
                        min={1}
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        className="border border-gray-300 p-1 rounded-lg w-20"
                        placeholder="Qtd"
                      />
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="border border-gray-300 p-1 rounded-lg w-28"
                        placeholder="Preço"
                      />
                      <button
                        type="button"
                        onClick={handleAddProduct}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Itens do Pedido */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex justify-between items-center bg-slate-800 text-white p-6">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <Calendar className="w-5 h-5" /> Itens do Pedido
                </h2>
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
                    {products.map((item, index) => (
                      <tr key={`${item.id}-${index}`} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-4">{item.code || ""}</td>
                        <td className="p-4">{item.product_name}</td>
                        <td className="p-4">{item.quantity}</td>
                        <td className="p-4">R$ {item.price.toFixed(2)}</td>
                        <td className="p-4">R$ {(item.quantity * item.price).toFixed(2)}</td>
                        <td className="p-4">{item.location || ""}</td>
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => setProducts(products.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-800 transition-colors"
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
                  <p className="text-2xl font-bold text-slate-800">R$ {products.reduce((acc, p) => acc + p.quantity * p.price, 0).toFixed(2)}</p>
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
  );
}
