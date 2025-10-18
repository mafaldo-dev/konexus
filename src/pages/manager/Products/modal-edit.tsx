import { useForm, SubmitHandler } from 'react-hook-form';
import { Products } from '../../../service/interfaces';
import { useEffect, useCallback } from 'react';
import { updateProduct } from '../../../service/api/Administrador/products';
import Swal from 'sweetalert2';

type Props = {
  product: Products | any;
  onClose: () => void;
};

const UpdatedProduct = ({ product, onClose }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Products>({ defaultValues: product });

  // Só atualiza se o produto realmente mudar
  useEffect(() => {
    if (product) reset(product);
  }, [product?.id]);

  const showAlert = useCallback(
    async (title: string, text: string, icon: 'success' | 'error') => {
      await Swal.fire({
        title,
        text,
        icon,
        confirmButtonColor: '#1e293b',
      });
    },
    []
  );

  const onSubmit: SubmitHandler<Products> = useCallback(
    async (data) => {
      if (!product?.id) return;
      try {
        await updateProduct(product.id, { ...data, updatedAt: new Date() });
        await showAlert('Sucesso!', 'Produto atualizado com sucesso!', 'success');
        onClose();
      } catch (error) {
        console.error('Erro ao atualizar produto: ', error);
        await showAlert('Erro!', 'Erro ao atualizar o produto.', 'error');
      }
    },
    [product?.id, showAlert, onClose]
  );

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-12 overflow-y-auto max-h-[90vh] border border-slate-200">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-semibold text-slate-800 tracking-tight">
              Editar Produto
            </h2>
            <p className="text-sm text-slate-500 mt-1">Atualize as informações do produto</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-4xl leading-none transition"
            aria-label="Fechar formulário"
          >
            &times;
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 will-change-transform">
          {/* Informações Básicas */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-700 border-b border-slate-200 pb-3">
              Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Nome do Produto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Nome é obrigatório' })}
                  placeholder="Ex: Notebook Dell Inspiron"
                  className={`w-full rounded-lg border px-4 py-3 text-slate-700 bg-slate-50 
                    focus:bg-white focus:ring-2 focus:ring-slate-300 outline-none transition ${
                    errors.name ? 'border-red-500 ring-red-100' : 'border-slate-300'
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('code', { required: 'Código é obrigatório' })}
                  placeholder="Ex: PROD-001"
                  className={`w-full rounded-lg border px-4 py-3 text-slate-700 bg-slate-50 
                    focus:bg-white focus:ring-2 focus:ring-slate-300 outline-none transition ${
                    errors.code ? 'border-red-500 ring-red-100' : 'border-slate-300'
                  }`}
                />
                {errors.code && (
                  <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Descrição <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('description', { required: 'Descrição é obrigatória' })}
                  placeholder="Descreva o produto..."
                  rows={3}
                  className={`w-full rounded-lg border px-4 py-3 text-slate-700 bg-slate-50 
                    focus:bg-white focus:ring-2 focus:ring-slate-300 outline-none transition resize-none ${
                    errors.description ? 'border-red-500 ring-red-100' : 'border-slate-300'
                  }`}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Estoque e Preço */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-700 border-b border-slate-200 pb-3">
              Estoque e Preço
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Estoque Atual
                </label>
                <input
                  type="number"
                  {...register('stock', { min: { value: 0, message: 'Estoque inválido' } })}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-300 outline-none transition"
                />
                {errors.stock && (
                  <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Preço (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('price', { required: 'Preço é obrigatório' })}
                  className={`w-full rounded-lg border px-4 py-3 text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-300 outline-none transition ${
                    errors.price ? 'border-red-500 ring-red-100' : 'border-slate-300'
                  }`}
                />
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4 border-t border-slate-200 pt-8">
            <button
              type="button"
              onClick={() => reset(product)}
              className="px-6 py-2.5 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium transition"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition shadow-sm ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatedProduct;
