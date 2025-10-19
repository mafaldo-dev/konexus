import { SubmitHandler, useForm } from "react-hook-form";
import { Products } from "../../../service/interfaces";
import { insertProductComKardex } from "../../../service/api/Administrador/products";
import { PackagePlus, Save } from "lucide-react";

import Swal from "sweetalert2";
import { handleAllSuppliers } from "../../../service/api/Administrador/suppliers/supplier";
import { useEffect, useState } from "react";

interface FormAddedProps {
  onProductsAdded: () => void
}

const ProductRegistrationForm: React.FC<FormAddedProps> = ({ onProductsAdded }) => {
  const [supId, setSupId] = useState<any>()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<Products>()

  const onSubmit: SubmitHandler<Products> = async (data) => {
    try {
      const payload: Products = {
        ...data,
        created_at: new Date(),
      };

      await insertProductComKardex(payload);
      reset();
      onProductsAdded()
    } catch (error) {
      console.error("Erro ao cadastrar produto: ", error);
      Swal.fire('Error!', 'Erro ao adicionar o produto a base de dados...', 'error')
      throw new Error("Erro interno do servidor!");
    }
  };

  useEffect(() => {
    const handleSupplierId = async () => {
      const response = await handleAllSuppliers()
      setSupId(response)
    }
    handleSupplierId()
  }, [])

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-[900px] mx-auto p-8 bg-white shadow-lg rounded-lg space-y-6"
    >
      <h2 className="text-3xl font-bold text-gray-700 flex items-center gap-3 mb-6">
        <PackagePlus size={30} /> Cadastro de Produto
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Nome */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Nome do Produto *</label>
          <input
            type="text"
            {...register("name", { required: "Nome obrigatório" })}
            className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ex: Teclado Gamer RGB"
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
            placeholder="Ex: PRD-001"
          />
          {errors.code && <p className="text-red-600 text-sm mt-1">{errors.code.message}</p>}
        </div>

        {/* Preço */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Preço (R$) *</label>
          <input
            type="number"
            step="0.01"
            {...register("price", { required: "Preço obrigatório", valueAsNumber: true })}
            className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="100.00"
          />
          {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Custo (R$) *</label>
          <input
            type="number"
            step="0.01"
            {...register("coast", { required: "Preço obrigatório", valueAsNumber: true })}
            className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="100.00"
          />
          {errors.coast && <p className="text-red-600 text-sm mt-1">{errors.coast.message}</p>}
        </div>
        {/* Localização */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Localização *</label>
          <input
            type="text"
            {...register("location", { required: "Localização obrigatória" })}
            className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ex: Prateleira A"
          />
          {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location.message}</p>}
        </div>

        {/* Marca */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Marca *</label>
          <input
            type="text"
            {...register("brand", { required: "Marca obrigatória" })}
            className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ex: Logitech"
          />
          {errors.brand && <p className="text-red-600 text-sm mt-1">{errors.brand.message}</p>}
        </div>

        {/* Fornecedor */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            Fornecedor *
          </label>
          <select
            {...register("supplier_id", { required: "Fornecedor obrigatório" })}
            className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            defaultValue=""
          >
            <option value="" disabled>Selecione um fornecedor</option>
            {supId?.map((supplier: any) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
          {errors.supplier_id && (
            <p className="text-red-600 text-sm mt-1">
              {errors.supplier_id.message && <p className="text-red-600">Nenhum fornecedor selecionado!</p>}
            </p>
          )}
        </div>


        {/* Categoria */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Categoria *</label>
          <input
            type="text"
            {...register("category", { required: "Categoria obrigatória" })}
            className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ex: Eletrônicos"
          />
          {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>}
        </div>

        {/* Estoque mínimo */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Estoque Mínimo *</label>
          <input
            type="number"
            {...register("minimum_stock", { required: "Estoque mínimo obrigatório", valueAsNumber: true })}
            className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ex: 5"
          />
          {errors.minimum_stock && <p className="text-red-600 text-sm mt-1">{errors.minimum_stock.message}</p>}
        </div>

        {/* Quantidade */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Quantidade *</label>
          <input
            type="number"
            {...register("stock", { required: "Quantidade obrigatória", valueAsNumber: true })}
            className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ex: 20"
          />
          {errors.stock && <p className="text-red-600 text-sm mt-1">{errors.stock.message}</p>}
        </div>
      </div>

      {/* Descrição - full width */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">Descrição *</label>
        <textarea
          {...register("description", { required: "Descrição obrigatória" })}
          className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          rows={3}
          placeholder="Detalhes do produto..."
        />
        {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
      </div>

      {/* IOF (radio) 
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">Possui IOF? *</label>
        <div className="flex gap-6">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="true"
              {...register("IOF", { required: "Campo obrigatório" })}
              className="cursor-pointer"
            />
            Sim
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="false"
              {...register("IOF", { required: "Campo obrigatório" })}
              className="cursor-pointer"
            />
            Não
          </label>
        </div>
        {errors.IOF && <p className="text-red-600 text-sm mt-1">{errors.IOF.message}</p>}
      </div>
*/}
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
          <Save size={18} /> Salvar Produto
        </button>
      </div>
    </form>
  );
}

export default ProductRegistrationForm