import { SubmitHandler, useForm } from "react-hook-form";
import { Products } from "../../../service/interfaces";
import { insertProductComKardex } from "../../../service/api/Administrador/products";
import { PackagePlus, Save } from "lucide-react";
import clsx from "clsx";
import Swal from "sweetalert2";

interface FormAddedProps {
  onProductsAdded: () => void
}

const ProductRegistrationForm: React.FC<FormAddedProps> = ({ onProductsAdded }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<Omit<Products, "id"> & { IOF: string }>({
    defaultValues: {
      IOF: "false",
      statesWithTax: [],
    },
  })

  const onSubmit: SubmitHandler<Products> = async (data) => {
    try {
      const payload: Products = {
        ...data,
        IOF: data.IOF === "true",
        addedAt: new Date(),
      };

      // Remove campos que não devem ir para o Firebase se IOF for false
      if (data.IOF === "true") {
        payload.valueOfIof = Number(data.valueOfIof);
        payload.statesWithTax = data.statesWithTax;
      } else {
        delete payload.valueOfIof;
        delete payload.statesWithTax;
      }
      await insertProductComKardex(payload);
      reset();
      onProductsAdded()
    } catch (error) {
      console.error("Erro ao cadastrar produto: ", error);
      Swal.fire('Error!', 'Erro ao adicionar o produto a base de dados...', 'error')
      throw new Error("Erro interno do servidor!");
    }
  };

  const watchIOF = watch("IOF");
  const selectedStates: string[] = watch("statesWithTax") || [];

  const toggleState = (state: string) => {
    let newStates: string[];
    if (selectedStates.includes(state)) {
      newStates = selectedStates.filter((s) => s !== state);
    } else {
      newStates = [...selectedStates, state];
    }
    setValue("statesWithTax", newStates, { shouldValidate: true });
  };


  const brazilianStates = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
    "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
    "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

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
          <label className="block text-sm font-semibold text-gray-600 mb-1">Fornecedor *</label>
          <input
            type="text"
            {...register("supplier", { required: "Fornecedor obrigatório" })}
            className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ex: Amazon"
          />
          {errors.supplier && <p className="text-red-600 text-sm mt-1">{errors.supplier.message}</p>}
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
            {...register("quantity", { required: "Quantidade obrigatória", valueAsNumber: true })}
            className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ex: 20"
          />
          {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>}
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

      {/* IOF (radio) */}
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

      {/* Se IOF for true, mostra valor do IOF e estados */}
      {watchIOF === "true" && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Valor do IOF (%) *</label>
            <input
              type="number"
              step="0.01"
              {...register("valueOfIof", { required: "Campo obrigatório", valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: 3.5"
            />
            {errors.valueOfIof && <p className="text-red-600 text-sm mt-1">{errors.valueOfIof.message}</p>}
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-600 mb-2">Estados com IOF *</label>
            <div className="flex flex-wrap gap-2">
              {brazilianStates.map((state) => {
                const selected = selectedStates.includes(state);
                return (
                  <button
                    type="button"
                    key={state}
                    onClick={() => toggleState(state)}
                    className={clsx(
                      "px-4 py-1 rounded-full border transition-colors duration-200",
                      selected
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    )}
                  >
                    {state}
                  </button>
                );
              })}
            </div>
            {errors.statesWithTax && (
              <p className="text-red-600 text-sm mt-1">{errors.statesWithTax.message || "Selecione ao menos um estado"}</p>
            )}

            {/* Tags dos estados selecionados */}
            {selectedStates.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedStates.map((state) => (
                  <span
                    key={state}
                    className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full select-none"
                  >
                    {state}
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}

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