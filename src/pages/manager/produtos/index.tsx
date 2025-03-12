import { useState, useEffect } from "react"

import { useForm, SubmitHandler } from 'react-hook-form'

import { allProducts, deleteProduct, submitProduct, updateProduct } from "../../../service/api/products/products"
import type { Produto } from "../../../service/interfaces/produtos"
import Dashboard from "../../../components/dashboard"

import lupa from "../../../assets/image/search.png"
import pencil from "../../../assets/image/edit.png"
import trash from "../../../assets/image/delete.png"

const SearchProdutos = () => {
  const {register, handleSubmit, formState: {errors}, reset} = useForm<Produto>()

  const [products, setProducts] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState({ name: "", code: "" })
  const [show, setShow] = useState(false)
  const [newInfos, setNewInfos] = useState<Produto | any>()
  const [modalOpen, setIsModalOpen] = useState(false)
  const [openRegister, setOpenRegister] = useState<boolean>(false)



  const renderProducts = async () => {
    try {
      setLoading(true)
      const response = await allProducts()
      setProducts(response)
    } catch (exe) {
      console.error("Erro ao recuperar produtos disponiveis.", exe)
      setError("Erro ao recuperar produtos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    renderProducts()
  }, [])

  const handleFilter = () => {
    const normalizeString = (str: any) =>
      typeof str === "string"
        ? str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
        : String(str).toLowerCase() // Converte números para string

    const filteredProducts = products.filter((product: any) => {
      const matchName = filter.name ? normalizeString(product.name).includes(normalizeString(filter.name)) : true

      const matchCode = filter.code.toString() ? normalizeString(product.code).includes(normalizeString(filter.code)) : true

      return matchName && matchCode
    })

    return show ? filteredProducts : filteredProducts
  }

  const render = handleFilter()

  const editProduct = (product: Produto) => {
    setNewInfos(product)
    setIsModalOpen(true)
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setNewInfos({ ...newInfos, [name]: value })
  }

  const saveUpdate = async (e: any) => {
    e.preventDefault()
    try {
      await updateProduct(newInfos.id, newInfos)
      setIsModalOpen(false)
      renderProducts()
    } catch (exe) {
      console.error("Erro ao salvar produto:", exe)
    }
  }

  const deleteProduct = async (product: Produto | any) => {
    if (!product) {
      console.error("Produto deletado")
      return
    }

    try {
      console.log("Deletando produto:", product.id)
      await deleteProduct(product.id)
      renderProducts() // Recarrega as vagas
    } catch (exe) {
      console.error("Erro ao deletar produto", exe)
    }
  }

  const onSubmit: SubmitHandler<Produto> = async (data) => {
    try {
      setLoading(true)
      await submitProduct(data)
      setIsModalOpen(false)

      reset({
        name:'',
        description:'',
        quantity:0,
        price:0,
        code:0
      })
      renderProducts()
    } catch (exe) {
      console.error("Erro ao adicionar novo produto:", exe)
      setError("Erro ao cadastrar produto no estoque.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dashboard>
      <div className="w-full flex flex-col items-center m-auto p-4">
        <h1 className="text-3xl text-center mb-4">Consultar produtos</h1>
        <div className="flex justify-between items-center mr-2 mb-1 w-full">
          <div className="flex flex-col mb-3 cursor-pointer hover:zoonIn">
            <span>Novo produto</span>
            <button
              onClick={() => setOpenRegister(true)}
              className="font-semibold text-2xl border rounded-sm w-26 cursor-pointer"
            >
              +
            </button>
          </div>
          <div className="flex">
            <input
              type="text"
              value={filter.name}
              onChange={(e) => setFilter({ ...filter, name: e.target.value })}
              placeholder="Digite o nome o do produto"
              className="p-2 w-74 bg-gray-100 rounded h-10 border mr-1"
            />
            <input
              type="text"
              value={filter.code}
              onChange={(e) => setFilter({ ...filter, code: e.target.value })}
              placeholder="Digite o codigo do produto "
              className="p-2 w-74 bg-gray-100 rounded-l h-10 border-l border-b border-t"
            />
            <img
              className="bg-white rounded-r p-2 h-10 cursor-pointer border"
              src={lupa || "/placeholder.svg"}
              alt=""
            />
          </div>
        </div>
        {loading ? (
          <p>Carregando...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <div className="w-full border border-gray-300 rounded">
            {/* Cabeçalho da Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-left">
                <thead className="bg-gray-200 sticky top-0">
                  <tr>
                    <th className="p-2 border-b">Código</th>
                    <th className="p-2 border-b">Nome</th>
                    <th className="p-2 border-b">Preço</th>
                    <th className="p-2 border-b">Quantidade</th>
                    <th className="p-2 border-b">Descrição</th>
                    <th className="p-2 border-b"></th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* Corpo da Tabela com Scroll */}
            <div className="max-h-[600px] w-full overflow-y-auto">
              <table className="w-full p-2 table-fixed border-collapse">
                <tbody>
                  {render.length > 0 ? (
                    render.map((produto: any) => (
                      <tr className="border-t cursor-pointer hover:bg-cyan-100" key={produto.id}>
                        <td className="p-1">{produto.code}</td>
                        <td className="p-1 text-left  font-normal w-3/15">{produto.name}</td>
                        <td className="p-1 text-left">R$ {produto.price}</td>
                        <td className="p-1 text-center">{produto.quantity}</td>
                        <td className="p-1 text-left w-3/10 font-normal">{produto.description}</td>
                        <td className="p-1">
                          <div className="flex gap-1 ml-12">
                            <button>
                              <img
                                src={pencil || "/placeholder.svg"}
                                alt="Ícone de pincel"
                                className="h-6 bg-green-400 rounded-sm cursor-pointer"
                                onClick={() => editProduct(produto)}
                              />
                            </button>
                            <button>
                              <img
                                src={trash || "/placeholder.svg"}
                                alt="Ícone de lata de lixo"
                                className="h-6 bg-red-400 rounded-sm cursor-pointer"
                                onClick={() => deleteProduct(produto)}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        Nenhum produto encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-start ml-4 gap-2">
        <a className="bg-white hover:bg-cyan-500 hover:text-white font-semibold text-gray-500 border border-gray-400 font-semibold p-2 rounded-lg w-24 text-center" href="/dashboard">
          Voltar
        </a>
      </div>
      {modalOpen && newInfos && (
        <>
          <div className="modal">
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-xl font-bold mb-4">Editar Produto</h2>

                <input
                  type="text"
                  name="name"
                  value={newInfos.name}
                  onChange={handleChange}
                  placeholder="Nome do produto"
                  className="w-full border p-2 mb-2 rounded"
                />
                <input
                  type="text"
                  name="description"
                  value={newInfos.description}
                  onChange={handleChange}
                  placeholder="description"
                  className="w-full border p-2 mb-2 rounded"
                />
                <input
                  type="text"
                  name="quantity"
                  value={newInfos.quantity}
                  onChange={handleChange}
                  placeholder="Quantidade"
                  className="w-full border p-2 mb-2 rounded"
                />

                <input
                  name="price"
                  value={newInfos.price}
                  onChange={handleChange}
                  placeholder="Descrição da vaga"
                  className="w-full border p-2 mb-2 rounded h-20"
                />
                <input
                  name="code"
                  value={newInfos.code}
                  onChange={handleChange}
                  placeholder="Requisitos"
                  className="w-full border p-2 mb-2 rounded h-20"
                />
                <div className="flex justify-between">
                  <button
                    className="bg-gray-400 text-white px-4 py-2 rounded cursor-pointer"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </button>

                  <button onClick={saveUpdate} className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer">
                    Salvar
                  </button>
                </div>
              </div>
            </div>
            <button onClick={() => setIsModalOpen(false)}>Fechar</button>
          </div>
        </>
      )}
      {openRegister ? (
        <>
          <div className="fixed inset-0 bg-black/50 z-40"></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg w-[600px] max-w-[90vw] z-50 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="relative mb-6">
                <h2 className="text-2xl font-semibold mb-2">Cadastrar Produto</h2>
                <p className="text-gray-600">Preencha os campos abaixo para cadastrar um novo produto.</p>
                <button
                  onClick={() => setOpenRegister(false)}
                  className="cursor-pointer absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4 mb-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="font-medium">
                      Nome
                    </label>
                    <input
                      type="text"
                      {...register("name", {required: true})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                    {errors.name && <span className="text-red">O campo nome e obrigatorio</span>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="description" className="font-medium">
                      Descrição
                    </label>
                    <textarea
                     {...register("description", {required: true})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[80px] resize-y"
                      rows={3}
                    />
                    {errors.description && <span className="text-red">Adicione uma descrição ao produto requerido</span>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="quantity" className="font-medium">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      {...register("quantity", {required: true})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                    {errors.quantity && <span className="color-red-500">O campo quantidade e requerido</span>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="price" className="font-medium">
                      Preço
                    </label>
                    <input
                      type="number"
                      {...register("price", {required: true})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                    {errors.price && <span className="color-red-500">O campo preço e obrigatorio</span>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="code" className="font-medium">
                      Código
                    </label>
                    <input
                      type="number"
                      {...register("code", {required:true})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      required
                    />
                    {errors.code && <span className="color-red-500">Insira um codigo ao produto requerido</span>}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setOpenRegister(false)}
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-gray-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      ) : (
        ""
      )}
    </Dashboard>
  )
}

export default SearchProdutos

