import { useForm, SubmitHandler } from 'react-hook-form'
import { Products } from '../../../service/interfaces'
import { useEffect } from 'react'
import { updateProduct } from '../../../service/api/Administrador/products'
import Swal from 'sweetalert2'

type Props = {
  product: Products | null
  onClose: () => void
}

const UpdadtedProduct = ({ product, onClose }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<Products>()

  useEffect(() => {
    if (product) {
      reset(product) // Preenche os campos com os dados do produto
    }
  }, [product, reset])

  const onSubmit: SubmitHandler<Products> = async (data) => {
    if (!product?.id) return
    try {
      await updateProduct(product.id, {
        ...data,
        updatedAt: new Date()
      })
      Swal.fire('Sucesso', 'Produto atualizado com sucesso!', 'success')
      onClose()
    } catch (error) {
      console.error("Erro ao atualizar produto: ", error)
      Swal.fire('Erro', 'Erro ao atualizar o produto.', 'error')
    }
  }

  return (
    <div className="modal">
      <div className="flex items-center justify-center fixed inset-0 bg-black/50 z-40">
        <div className="bg-white p-6 rounded-lg shadow-lg w-[100vw] max-w-4xl max-h-[100vh] overflow-y-auto z-50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Editar Produto</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Nome</label>
                <input
                  type="text"
                  {...register("name", { required: true })}
                  className="w-full border rounded p-2"
                />
                {errors.name && <p className="text-red-500 text-xs">Campo obrigatório</p>}
              </div>

              <div>
                <label className="block text-sm font-medium">Código</label>
                <input
                  type="text"
                  {...register("code", { required: true })}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Descrição</label>
                <input
                  type="text"
                  {...register("description", { required: true })}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Marca</label>
                <input
                  type="text"
                  {...register("brand", { required: true })}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Fornecedor</label>
                <input
                  type="text"
                  {...register("supplier_id", { required: true })}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Categoria</label>
                <input
                  type="text"
                  {...register("category", { required: true })}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Localização</label>
                <input
                  type="text"
                  {...register("location", { required: true })}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Estoque</label>
                <input
                  type="number"
                  {...register("stock", { required: true })}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Estoque mínimo</label>
                <input
                  type="number"
                  {...register("minimum_stock", { required: true })}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Preço</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("price", { required: true })}
                  className="w-full border rounded p-2"
                />
              </div>
            </div>
            <div className="text-right pt-4">
              <button
                type="submit"
                className="bg-slate-800 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UpdadtedProduct
