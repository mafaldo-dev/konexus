import { SubmitHandler, useForm } from "react-hook-form";
import { Products } from "../../../service/interfaces";
import { insertProductComKardex } from "../../../service/api/Administrador/products";
import { PackagePlus, Save, X } from "lucide-react";
import Swal from "sweetalert2";
import { handleAllSuppliers } from "../../../service/api/Administrador/suppliers/supplier";
import { useEffect, useState } from "react";

interface FormAddedProps {
  onProductsAdded: () => void;
  onClose: () => void
}

const ProductRegistrationForm: React.FC<FormAddedProps> = ({ onProductsAdded, onClose }: FormAddedProps) => {
  const [supId, setSupId] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"geral" | "fiscal">("geral");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Products>();

  const onSubmit: SubmitHandler<Products> = async (data) => {
    try {
      const payload: Products = { ...data, created_at: new Date() };
      await insertProductComKardex(payload);
      reset();
      onProductsAdded();
      Swal.fire("Sucesso!", "Produto cadastrado com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao cadastrar produto: ", error);
      Swal.fire("Erro!", "Falha ao adicionar o produto à base de dados.", "error");
    }
  };

  useEffect(() => {
    const fetchSuppliers = async () => {
      const response = await handleAllSuppliers();
      setSupId(response);
    };
    fetchSuppliers();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b  border-gray-200 bg-slate-800">
          <div className="flex justify-between">
            <div className="flex flex-col">
              <h2 className="text-3xl font-bold text-white flex items-center justify-start gap-3">
                <PackagePlus size={32} className="text-white" />
                Cadastro de Produto
              </h2>
              <p className="text-white text-start mt-2">Preencha todos os campos obrigatórios (*) para emissão de NF-e</p>
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

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-8">
          <button
            type="button"
            className={`px-6 py-3 font-semibold transition relative ${activeTab === "geral"
              ? "text-indigo-600"
              : "text-gray-600 hover:text-indigo-600"
              }`}
            onClick={() => setActiveTab("geral")}
          >
            Dados Gerais
            {activeTab === "geral" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
            )}
          </button>
          <button
            type="button"
            className={`px-6 py-3 font-semibold transition relative ${activeTab === "fiscal"
              ? "text-indigo-600"
              : "text-gray-600 hover:text-indigo-600"
              }`}
            onClick={() => setActiveTab("fiscal")}
          >
            Dados Fiscais
            {activeTab === "fiscal" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
            )}
          </button>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-7xl mx-auto bg-white shadow-lg rounded-2xl border border-gray-200  overflow-y-auto"
        >
          {/* Form Content - Fixed Height */}
          <div className="flex-1 px-4 py-4" style={{ minHeight: "600px" }}>
            {activeTab === "geral" && (
              <div className="space-y-4">
                {/* Identificação e Classificação Combinadas */}
                <fieldset className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <legend className="text-base font-bold text-gray-800 px-3 bg-white">
                    Identificação e Classificação
                  </legend>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="col-span-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Nome do Produto *
                      </label>
                      <input
                        type="text"
                        {...register("name", { required: "Nome obrigatório" })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        placeholder="Ex: Teclado Mecânico RGB"
                      />
                      {errors.name && (
                        <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Código Interno *
                      </label>
                      <input
                        type="text"
                        {...register("code", { required: "Código obrigatório" })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        placeholder="PROD-001"
                      />
                      {errors.code && (
                        <p className="text-red-600 text-xs mt-1">{errors.code.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        EAN/GTIN
                      </label>
                      <input
                        type="text"
                        {...register("ean")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        placeholder="7891234567890"
                        maxLength={13}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Cód. Barras Interno
                      </label>
                      <input
                        type="text"
                        {...register("codigo_barras")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        placeholder="Código interno"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Marca *
                      </label>
                      <input
                        type="text"
                        {...register("brand", { required: "Marca obrigatória" })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        placeholder="Ex: Logitech"
                      />
                      {errors.brand && (
                        <p className="text-red-600 text-xs mt-1">{errors.brand.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Categoria *
                      </label>
                      <input
                        type="text"
                        {...register("category", { required: "Categoria obrigatória" })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        placeholder="Periféricos"
                      />
                      {errors.category && (
                        <p className="text-red-600 text-xs mt-1">{errors.category.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Fornecedor *
                      </label>
                      <select
                        {...register("supplier_id", { required: "Fornecedor obrigatório" })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        defaultValue=""
                      >
                        <option value="" disabled>Selecione</option>
                        {supId.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </fieldset>

                {/* Estoque e Valores Combinados */}
                <fieldset className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <legend className="text-base font-bold text-gray-800 px-3 bg-white">
                    Estoque e Valores
                  </legend>
                  <div className="grid grid-cols-5 gap-3 mt-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Estoque Atual *
                      </label>
                      <input
                        type="number"
                        {...register("stock", { required: "Obrigatório", valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        placeholder="50"
                      />
                      {errors.stock && (
                        <p className="text-red-600 text-xs mt-1">{errors.stock.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Est. Mínimo *
                      </label>
                      <input
                        type="number"
                        {...register("minimum_stock", { required: "Obrigatório", valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        placeholder="5"
                      />
                      {errors.minimum_stock && (
                        <p className="text-red-600 text-xs mt-1">{errors.minimum_stock.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Localização *
                      </label>
                      <input
                        type="text"
                        {...register("location", { required: "Obrigatório" })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        placeholder="A-03"
                      />
                      {errors.location && (
                        <p className="text-red-600 text-xs mt-1">{errors.location.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Preço Venda (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("price", { required: "Obrigatório", valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        placeholder="249.90"
                      />
                      {errors.price && (
                        <p className="text-red-600 text-xs mt-1">{errors.price.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Custo (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("coast", { required: "Obrigatório", valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        placeholder="180.00"
                      />
                      {errors.coast && (
                        <p className="text-red-600 text-xs mt-1">{errors.coast.message}</p>
                      )}
                    </div>
                  </div>
                </fieldset>

                {/* Descrição */}
                <fieldset className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <legend className="text-base font-bold text-gray-800 px-3 bg-white">
                    Descrição
                  </legend>
                  <div className="mt-3">
                    <textarea
                      {...register("description", { required: "Descrição obrigatória" })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none text-sm"
                      rows={2}
                      placeholder="Detalhes e observações sobre o produto..."
                    />
                    {errors.description && (
                      <p className="text-red-600 text-xs mt-1">{errors.description.message}</p>
                    )}
                  </div>
                </fieldset>

                {/* Informações Complementares */}
                <fieldset className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <legend className="text-base font-bold text-gray-800 px-3 bg-white">
                    Informações Complementares
                  </legend>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        CNPJ do Fabricante
                      </label>
                      <input
                        type="text"
                        {...register("cnpj_fabricante")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        placeholder="12.345.678/0001-90"
                        maxLength={18}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Código Benefício Fiscal
                      </label>
                      <input
                        type="text"
                        {...register("codigo_beneficio_fiscal")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        placeholder="Quando aplicável"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Informações Adicionais
                      </label>
                      <textarea
                        {...register("informacoes_adicionais")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none text-sm"
                        rows={2}
                        placeholder="Informações complementares..."
                      />
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {activeTab === "fiscal" && (
              <div className="space-y-6">
                {/* Classificação Fiscal Obrigatória */}
                <fieldset className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <legend className="text-lg font-bold text-gray-800 px-3 bg-white">
                    Classificação Fiscal Obrigatória
                  </legend>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        NCM (Nomenclatura Comum do Mercosul) *
                      </label>
                      <input
                        type="text"
                        {...register("ncm", { required: "NCM obrigatório", minLength: 8, maxLength: 8 })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Ex: 84716053"
                        maxLength={8}
                      />
                      {errors.ncm && (
                        <p className="text-red-600 text-sm mt-1">{errors.ncm.message}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">8 dígitos obrigatórios</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        CFOP (Código Fiscal de Operações) *
                      </label>
                      <input
                        type="text"
                        {...register("cfop", { required: "CFOP obrigatório", minLength: 4, maxLength: 4 })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Ex: 5102"
                        maxLength={4}
                      />
                      {errors.cfop && (
                        <p className="text-red-600 text-sm mt-1">{errors.cfop.message}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">CFOP padrão do produto</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Unidade Comercial *
                      </label>
                      <select
                        {...register("unidade", { required: "Unidade obrigatória" })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        defaultValue=""
                      >
                        <option value="" disabled>Selecione a unidade</option>
                        <option value="UN">UN - Unidade</option>
                        <option value="CX">CX - Caixa</option>
                        <option value="KG">KG - Quilograma</option>
                        <option value="MT">MT - Metro</option>
                        <option value="LT">LT - Litro</option>
                        <option value="PC">PC - Peça</option>
                        <option value="PAR">PAR - Par</option>
                        <option value="DUZIA">DUZIA - Dúzia</option>
                      </select>
                      {errors.unidade && (
                        <p className="text-red-600 text-sm mt-1">{errors.unidade.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Origem da Mercadoria *
                      </label>
                      <select
                        {...register("origem", { required: "Origem obrigatória", valueAsNumber: true })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        defaultValue=""
                      >
                        <option value="" disabled>Selecione a origem</option>
                        <option value={0}>0 - Nacional</option>
                        <option value={1}>1 - Estrangeira - Importação direta</option>
                        <option value={2}>2 - Estrangeira - Mercado interno</option>
                        <option value={3}>3 - Nacional c/ Conteúdo Importação 40%</option>
                        <option value={4}>4 - Nacional - Processos Básicos</option>
                        <option value={5}>5 - Nacional c/ Conteúdo Importação 40% ou -</option>
                        <option value={6}>6 - Estrangeira - Importação direta s/ similar</option>
                        <option value={7}>7 - Estrangeira - Mercado interno s/ similar</option>
                        <option value={8}>8 - Nacional - Conteúdo Importação 70%</option>
                      </select>
                      {errors.origem && (
                        <p className="text-red-600 text-sm mt-1">{errors.origem.message}</p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        CEST (Código Especificador ST)
                      </label>
                      <input
                        type="text"
                        {...register("cest")}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Ex: 0100100"
                        maxLength={7}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        7 dígitos - Obrigatório para produtos com Substituição Tributária
                      </p>
                    </div>
                  </div>
                </fieldset>

                {/* CSTs Padrão */}
                <fieldset className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <legend className="text-lg font-bold text-gray-800 px-3 bg-white">
                    Códigos de Situação Tributária (CST) Padrão
                  </legend>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        CST PIS
                      </label>
                      <input
                        type="text"
                        {...register("cst_pis")}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Ex: 01, 04, 49"
                        maxLength={2}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Código Situação Tributária PIS
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        CST COFINS
                      </label>
                      <input
                        type="text"
                        {...register("cst_cofins")}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Ex: 01, 04, 49"
                        maxLength={2}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Código Situação Tributária COFINS
                      </p>
                    </div>
                  </div>
                </fieldset>

                {/* Alíquotas Padrão */}
                <fieldset className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <legend className="text-lg font-bold text-gray-800 px-3 bg-white">
                    Alíquotas Padrão (%)
                  </legend>
                  <p className="text-sm text-gray-600 mb-4">
                    Estas são as alíquotas padrão do produto. Podem ser ajustadas na operação conforme estado/operação.
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Alíquota ICMS (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("aliquota_icms", { valueAsNumber: true })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Ex: 18.00"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Alíquota IPI (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("aliquota_ipi", { valueAsNumber: true })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Ex: 10.00"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Alíquota PIS (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("aliquota_pis", { valueAsNumber: true })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Ex: 1.65"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Alíquota COFINS (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("aliquota_cofins", { valueAsNumber: true })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Ex: 7.60"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Resumo Fiscal */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Informações Importantes</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Os campos marcados com (*) são obrigatórios para emissão de NF-e</li>
                    <li>CSTs e alíquotas podem ser ajustados na hora da venda conforme a operação</li>
                    <li>CFOP padrão pode ser alterado na NF-e (ex: venda dentro/fora do estado)</li>
                    <li>NCM deve ter exatamente 8 dígitos numéricos</li>
                    <li>Consulte seu contador para definir CSTs corretos</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => reset()}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition"
              >
                Limpar Formulário
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-600 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md transition"
              >
                <Save size={18} />
                Salvar Produto
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductRegistrationForm