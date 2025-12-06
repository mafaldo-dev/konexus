import { useForm, SubmitHandler } from 'react-hook-form';
import { Products } from '../../../service/interfaces';
import { useEffect, useCallback, useState } from 'react';
import { updateProduct } from '../../../service/api/Administrador/products';
import { handleAllSuppliers } from '../../../service/api/Administrador/suppliers/supplier';
import Swal from 'sweetalert2';
import { Save, X, Eye, Edit } from 'lucide-react';
import { useAuth } from '../../../AuthContext' // Ajuste o caminho conforme sua estrutura

type Props = {
  product: Products | any;
  onClose: () => void;
};

const UpdatedProduct = ({ product, onClose }: Props) => {
  const [activeTab, setActiveTab] = useState<"geral" | "fiscal">("geral");
  const [supId, setSupId] = useState<any[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Products>({ defaultValues: product });

  useEffect(() => {
    if (product) {
      reset(product);
      // Inicia sempre no modo visualização
      setIsEditing(false);
    }
  }, [product, reset]);

  const handleSearchSupplier = async () => {
    try {
      const suppliers = await handleAllSuppliers();
      const found = suppliers.find(
        (s) => s.code?.toLowerCase() === searchCode.toLowerCase()
      );

      if (found) {
        alert(`Fornecedor encontrado: ${found.name}`);
      } else {
        alert("Fornecedor não encontrado!");
      }
    } catch (err) {
      console.error("Erro ao buscar fornecedor:", err);
    }
  };


  const showAlert = useCallback(
    async (title: string, text: string, icon: 'success' | 'error') => {
      await Swal.fire({
        title,
        text,
        icon,
        confirmButtonColor: '#4f46e5',
      });
    },
    []
  );

  const onSubmit: SubmitHandler<Products> = useCallback(
    async (data) => {
      if (!product?.id) return;
      try {
        await updateProduct(product.id, { ...data, updated_at: new Date() });
        await showAlert('Sucesso!', 'Produto atualizado com sucesso!', 'success');
        setIsEditing(false);
        onClose();
      } catch (error) {
        console.error('Erro ao atualizar produto: ', error);
        await showAlert('Erro!', 'Erro ao atualizar o produto.', 'error');
      }
    },
    [product?.id, showAlert, onClose]
  );

  const supplierName = product?.supplier_name || "";
  const supplierCode = product?.supplier_code || "";

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    reset(product);
    setIsEditing(false);
  };

  const isAdmin = user?.role === 'Administrador' || user?.role === 'Gestor';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 bg-slate-800">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 ">
              <div className={`p-2 rounded-lg ${isEditing ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                {isEditing ? <Edit size={24} /> : <Eye size={24} />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {isEditing ? 'Editar Produto' : 'Visualizar Produto'}
                </h2>
                <p className="text-sm text-white mt-1">
                  {isEditing ? 'Atualize as informações do produto' : 'Visualize todas as informações do produto'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Botão de Editar/Visualizar - só aparece para admin */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${isEditing
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-white hover:bg-indigo-00 text-black'
                    }`}
                >
                  {isEditing ? (
                    <>
                      <Eye size={16} />
                      Visualizar
                    </>
                  ) : (
                    <>
                      <Edit size={16} />
                      Editar
                    </>
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Fechar"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-8 bg-white">
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

        {/* Form Content - Scrollable */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="px-8 py-6">
            {activeTab === "geral" && (
              <div className="space-y-4">
                {/* Identificação e Classificação */}
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
                        {...register('name', { required: 'Nome obrigatório' })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
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
                        {...register('code', { required: 'Código obrigatório' })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
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
                        {...register('ean')}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
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
                        {...register('codigo_barras')}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
                        placeholder="Código interno"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Marca *
                      </label>
                      <input
                        type="text"
                        {...register('brand', { required: 'Marca obrigatória' })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
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
                        {...register('category', { required: 'Categoria obrigatória' })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
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

                      {supplierName ? (
                        <input
                          type="text"
                          defaultValue={supplierName}
                          value={supplierName}
                          readOnly
                          disabled={!isEditing}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${!isEditing
                            ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                            : "focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            }`}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Digite o código do fornecedor"
                            defaultValue={supplierCode}
                            {...register("supplier_id")}
                            disabled={!isEditing}
                            className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm ${!isEditing
                              ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                              : "focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                              }`}
                          />
                          <button
                            type="button"
                            onClick={handleSearchSupplier}
                            disabled={!isEditing}
                            className={`p-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition ${!isEditing ? "cursor-not-allowed opacity-60" : ""
                              }`}
                          >
                            <i className="lucide lucide-search text-gray-600"></i>
                          </button>
                        </div>
                      )}
                    </div>



                  </div>
                </fieldset>

                {/* Estoque e Valores */}
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
                        {...register('stock', { required: 'Obrigatório', valueAsNumber: true })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
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
                        {...register('minimum_stock', { required: 'Obrigatório', valueAsNumber: true })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
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
                        {...register('location', { required: 'Obrigatório' })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
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
                        {...register('price', { required: 'Obrigatório', valueAsNumber: true })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
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
                        {...register('coast', { required: 'Obrigatório', valueAsNumber: true })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
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
                      {...register('description', { required: 'Descrição obrigatória' })}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                        }`}
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
                        {...register('cnpj_fabricante')}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
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
                        {...register('codigo_beneficio_fiscal')}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
                        placeholder="Quando aplicável"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Informações Adicionais
                      </label>
                      <textarea
                        {...register('informacoes_adicionais')}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
                        rows={2}
                        placeholder="Informações complementares..."
                      />
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {activeTab === "fiscal" && (
              <div className="space-y-4">
                {/* Classificação Fiscal Obrigatória */}
                <fieldset className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <legend className="text-base font-bold text-gray-800 px-3 bg-white">
                    Classificação Fiscal Obrigatória
                  </legend>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        NCM *
                      </label>
                      <input
                        type="text"
                        {...register('ncm', { required: 'NCM obrigatório', minLength: 8, maxLength: 8 })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
                        placeholder="84716053"
                        maxLength={8}
                      />
                      {errors.ncm && (
                        <p className="text-red-600 text-xs mt-1">{errors.ncm.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        CEST
                      </label>
                      <input
                        type="text"
                        {...register('cest')}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
                        placeholder="0100100"
                        maxLength={7}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        CFOP *
                      </label>
                      <input
                        type="text"
                        {...register('cfop', { required: 'CFOP obrigatório', minLength: 4, maxLength: 4 })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
                        placeholder="5102"
                        maxLength={4}
                      />
                      {errors.cfop && (
                        <p className="text-red-600 text-xs mt-1">{errors.cfop.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Unidade *
                      </label>
                      <select
                        {...register('unidade', { required: 'Unidade obrigatória' })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
                      >
                        <option value="">Selecione</option>
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
                        <p className="text-red-600 text-xs mt-1">{errors.unidade.message}</p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Origem *
                      </label>
                      <select
                        {...register('origem', { required: 'Origem obrigatória', valueAsNumber: true })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
                      >
                        <option value="">Selecione</option>
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
                        <p className="text-red-600 text-xs mt-1">{errors.origem.message}</p>
                      )}
                    </div>
                  </div>
                </fieldset>

                {/* CSTs Padrão */}
                <fieldset className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <legend className="text-base font-bold text-gray-800 px-3 bg-white">
                    CSTs Padrão
                  </legend>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        CST ICMS
                      </label>
                      <input
                        type="text"
                        {...register('cst_icms')}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
                        placeholder="00, 10, 20, 101"
                        maxLength={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        CST IPI
                      </label>
                      <input
                        type="text"
                        {...register('cst_ipi')}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
                        placeholder="00, 49, 99"
                        maxLength={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        CST PIS
                      </label>
                      <input
                        type="text"
                        {...register('cst_pis')}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
                        placeholder="01, 04, 49"
                        maxLength={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        CST COFINS
                      </label>
                      <input
                        type="text"
                        {...register('cst_cofins')}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
                        placeholder="01, 04, 49"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Alíquotas Padrão */}
                <fieldset className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <legend className="text-base font-bold text-gray-800 px-3 bg-white">
                    Alíquotas Padrão (%)
                  </legend>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Alíquota ICMS (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('aliquota_icms', { valueAsNumber: true })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
                        placeholder="18.00"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Alíquota IPI (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('aliquota_ipi', { valueAsNumber: true })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
                        placeholder="10.00"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Alíquota PIS (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('aliquota_pis', { valueAsNumber: true })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
                        placeholder="1.65"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Alíquota COFINS (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('aliquota_cofins', { valueAsNumber: true })}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm ${!isEditing ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                          }`}
                        placeholder="7.60"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </fieldset>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end gap-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-5 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition text-sm"
                  >
                    Cancelar Edição
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 bg-slate-800 hover:bg-slate-600 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition text-sm ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    <Save size={16} />
                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-600 text-white font-semibold rounded-lg transition text-sm"
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatedProduct;