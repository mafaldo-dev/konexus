import { useState, useEffect } from "react"
import { useForm, SubmitHandler } from 'react-hook-form'

import type { Produto } from "../../../service/interfaces/produtos"
import Dashboard from "../../../components/dashboard"
import { insertProduct, updateProduct } from "../../../service/api/products"
import { getAllProducts } from "../../../service/api/products/index"

import lupa from "../../../assets/image/search.png"
import pencil from "../../../assets/image/edit.png"
import trash from "../../../assets/image/delete.png"

import { doc, deleteDoc } from "firebase/firestore"
import { db } from "../../../firebaseConfig"


const SearchProdutos = () => {
  const {register, handleSubmit, formState: {errors}, reset} = useForm<Produto>()

  const [modalOpen, setIsModalOpen] = useState(false)
  const [openRegister, setOpenRegister] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)
  const [render, setRender] = useState<Produto[]>([])
  const [error, setError] = useState("")
  const [newInfos, setNewInfos] = useState<Produto>()
  const [item, setItem] = useState<Produto[]>([])

             // REGISTER ITENS IN DATABASE
const onSubmit: SubmitHandler<Produto> = async (data) => {
    try {
      await insertProduct({...data, added: new Date() })
      reset()
      setOpenRegister(false)
      return getAllProducts()
  }catch(Exception){
    console.error("Erro ao adicionar Item", Exception)
  }
}

              // RENDER ITENS REGISTERED IN DATABASE
useEffect(() => {
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const produtos = await getAllProducts();
      setRender(produtos); // Aqui 'render' deve ser o estado com os produtos
    } catch (err) {
      setError("Erro ao buscar produtos");
    } finally {
      setLoading(false);
    }
  };
  fetchProducts();
}, [getAllProducts]);

              // PERMITE ATUALIZAR OS DADOS PARCIALMENTE
const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name,  value } = e.target
  setNewInfos((prev: any) => ({
    ...prev,
    [name]: value
  })) 
}
                // FUNÇAO PRA SALVAR OS NOVOS DADOS DO PRODUTO
const saveUpdate = async () => {
  if(!newInfos || !newInfos.id) {
    alert("ID do produto não encontrado!")
    return
  }

  try {
    await updateProduct(newInfos.id, {
      name: newInfos.name,
      description: newInfos.description,
      quantity: newInfos.quantity,
      price: newInfos.price,
      code: newInfos.code,
      fornecedor: newInfos.fornecedor
    })
    alert("Produto atualizado com sucesso!")
    setIsModalOpen(false)
    return getAllProducts
  } catch(Exception) {
    console.error("Erro ao atualizar os dados do Produto")
    alert("Erro ao atualizar os dados do Produto!")
  }
}
                       // ABRE O MODAL PARA EDIÇÃO DE PRODUTOS
const editProduct = (product: Produto) => {
  setNewInfos(product)
  setIsModalOpen(true)
}

async function deleteProduct(id: any) {
  try {
    await deleteDoc(doc(db, "Estoque", id));
    setItem(item.filter(product => product.id !== id));
    alert("Produto deletado com sucesso!");
  
  } catch (error) {
    console.error("Erro ao deletar produto: ", error);
    alert("Erro ao deletar produto, tente novamente.");
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
          {/* <div className="flex">
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
          </div> */}
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
                    render.map((item) => (
                      <tr className="border-t cursor-pointer hover:bg-cyan-100" key={item.id}>
                        <td className="p-1">{item.code}</td>
                        <td className="p-1 text-left  font-normal w-3/15">{item.name}</td>
                        <td className="p-1 text-left">R$ {item.price}</td>
                        <td className="p-1 text-center">{item.quantity}</td>
                        <td className="p-1 text-left w-3/10 font-normal">{item.description}</td>
                        <td className="p-1">
                          <div className="flex gap-1 ml-12">
                            <button>
                              <img
                                src={pencil || "/placeholder.svg"}
                                alt="Ícone de pincel"
                                className="h-6 bg-green-400 rounded-sm cursor-pointer"
                                onClick={() => editProduct(item)}
                              />
                            </button>
                            <button>
                              <img
                                src={trash || "/placeholder.svg"}
                                alt="Ícone de lata de lixo"
                                className="h-6 bg-red-400 rounded-sm cursor-pointer"
                                onClick={() => deleteProduct(item.id)}
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
                  placeholder="Codigo"
                  className="w-full border p-2 mb-2 rounded h-20"
                />
                <input
                  name="fornecedor"
                  value={newInfos.fornecedor}
                  onChange={handleChange}
                  placeholder="Fornecedor"
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

