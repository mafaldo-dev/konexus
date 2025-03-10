import { useState, useEffect, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { allProducts, deleteProduct, submitProduct, updateProduct } from '../../../service/api/products/products';
import { Produto } from '../../../service/interfaces/produtos';
import Dashboard from '../../../components/dashboard';

import lupa from '../../../assets/image/search.png'
import pencil from '../../../assets/image/edit.png'
import trash from '../../../assets/image/delete.png'


const SearchProdutos = () => {
  const navigate = useNavigate()

  const [products, setProducts] = useState<Produto[] | any>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [viewMore, setViewMore] = useState(false)
  const [filter, setFilter] = useState({ name: '', code: '' })
  const [show, setShow] = useState(false)
  const [newInfos, setNewInfos] = useState<Produto | any>()
  const [modalOPen, setIsModalOpen] = useState(false)
  const [openRegister, setOpenRegister] = useState<boolean>(false)
  const [product, setProduct] = useState<Produto>({
    name:"",
    description:"",
    quantity:0,
    price:0,
    code:0
  })


  const render = viewMore ? products : products.slice(0, 20)


  const renderProducts = async () => {
    try {
      setLoading(true)
      const response = await allProducts()
      setProducts(response)

    } catch (exe) {
      console.error('Erro ao recuperar produtos disponiveis.', exe)
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
        ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        : String(str).toLowerCase(); // Converte números para string

    const filteredProducts = render.filter((product: any) => {
      const matchName = filter.name
        ? normalizeString(product.name).includes(normalizeString(filter.name))
        : true;

      const matchCode = filter.code
        ? normalizeString(product.code).includes(normalizeString(filter.code))
        : true;

      return matchName && matchCode;
    });

    return show ? filteredProducts : filteredProducts.slice(0, 20);
  };


  const displayProducts = handleFilter()

  // abre a modal pra edição de produto
  const handleEdit = (product: Produto) => {
    setNewInfos(product)
    setIsModalOpen(true)
  }

  // captura os valores dos inputs de alteração
  const handleChange = (e: any) => {
    const { name, value } = e.target
    setNewInfos({ ...newInfos, [name]: value })

  }

  // altera e salva os dados
  const handleSave = async (e: any) => {
    e.preventDefault()
    try {
      await updateProduct(newInfos.id, newInfos)
      setIsModalOpen(false)
      renderProducts()
    } catch (exe) {
      console.error('Erro ao salvar vaga:', exe)
    }
  };

  // deleta um produto
  const handleDelete = async (product: Produto | any) => {
    if (!product) {
      console.error("Vaga nao encotrada");
      return;
    }

    try {
      console.log("Deletando vaga com ID:", product.id);  // Verifica o ID
      await deleteProduct(product.id);
      renderProducts();  // Recarrega as vagas
    } catch (exe) {
      console.error("Erro ao deletar vaga", exe);
    }
  };

  const handleSubmitProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
     const response = await submitProduct(product)
     if(response) {
       setProduct({
          name:'',
          description:'',
          quantity:0,
          price:0,
          code:0
        })

     }
      console.log(response)
    } catch (exe) {
      console.error("Erro ao adicionar novo produto:", exe)
      setError("Erro ao cadastrar produto no estoque.")

    } finally {
      setLoading(false)
    }
  }

  return (
    <Dashboard>
      <div className='w-fullflex flex-col items-center m-auto p-4'>
        <h1 className='text-3xl text-center mb-4'>Consultar produtos</h1>
        <div className='flex justify-between items-center mr-2 mb-1 '>
          <div className='flex flex-col mb-3 cursor-pointer'>
            <span>Novo produto</span>
            <button
              onClick={() => setOpenRegister(true)}
              className='font-semibold text-2xl border rounded-sm w-26 cursor-pointer'>+</button>
          </div>
          <div className='flex'>
            <input
              type="text"
              value={filter.name}
              onChange={(e) => setFilter({ ...filter, name: e.target.value })}
              placeholder="Digite o nome o do produto"
              className='p-2 w-74 bg-gray-100 rounded h-10 border mr-1'
            />
            <input
              type="text"
              value={filter.code}
              onChange={(e) => setFilter({ ...filter, code: e.target.value })}
              placeholder="Digite o codigo do produto "
              className='p-2 w-74 bg-gray-100 rounded-l h-10 border-l border-b border-t'
            />
            <img className='bg-white rounded-r p-2 h-10 cursor-pointer border' src={lupa} alt="" />
          </div>
        </div>
        {loading ? (
          <p>Carregando...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300 text-left mb-3">
            <thead>
              <tr className='bg-gray-200'>
                <th className='p-2'>Codigo</th>
                <th className='p-2'>Nome</th>
                <th className='p-2'>Preço</th>
                <th className='p-2'>Quantidade</th>
                <th className='p-2'>Descrição</th>
                <th className='p-2'></th>
              </tr>
            </thead>
            <tbody className='p-6'>
              {displayProducts.length > 0 ? (
                displayProducts.map((produto: any) => (
                  <tr className='border-t cursor-pointer hover:bg-cyan-100' key={produto.id}>
                    <td className='p-1'>{produto.code}</td>
                    <td>{produto.name}</td>
                    <td>R$ {produto.price}</td>
                    <td>{produto.quantity}</td>
                    <td>{produto.description}</td>
                    <td className='flex p-1 gap-1'>
                      <button >
                        <img
                          src={pencil}
                          alt="Icone de pincel"
                          className='h-6 bg-green-400 rounded-sm cursor-pointer'
                          onClick={() => handleEdit(produto)}
                        />
                      </button>
                      <button>
                        <img
                          src={trash}
                          alt="Icone de lata de lixo"
                          className='h-6 bg-red-400 rounded-sm cursor-pointer'
                          onClick={() => handleDelete(produto)}
                        />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9}>Nenhum produto encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <div className='flex justify-center gap-2'>
        <button className='bg-green-400 :hover bg-green-100 text-white font-semibold p-2 rounded-lg cursor-pointer ' onClick={() => setViewMore(!viewMore)}>{!viewMore ? 'Ver mais' : 'Ver menos'}</button>
        <a className='bg-cyan-500 text-white font-semibold p-2 rounded-lg w-24 text-center' href="/dashboard">Voltar</a>
      </div>
      {modalOPen && newInfos && (
        <>
          <div className="modal">
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-xl font-bold mb-4">Editar Produto</h2>

                <input type="text" name="name" value={newInfos.name} onChange={handleChange} placeholder="Título da vaga" className="w-full border p-2 mb-2 rounded" />
                <input type="text" name="description" value={newInfos.description} onChange={handleChange} placeholder="Salary" className="w-full border p-2 mb-2 rounded" />
                <input type="text" name="quantity" value={newInfos.quantity} onChange={handleChange} placeholder="Localização" className="w-full border p-2 mb-2 rounded" />

                <input name="price" value={newInfos.price} onChange={handleChange} placeholder="Descrição da vaga" className="w-full border p-2 mb-2 rounded h-20" />
                <input name="code" value={newInfos.code} onChange={handleChange} placeholder="Requisitos" className="w-full border p-2 mb-2 rounded h-20" />
                <div className="flex justify-between">
                  <button className="bg-gray-400 text-white px-4 py-2 rounded cursor-pointer" onClick={() => setIsModalOpen(false)}>Cancelar</button>

                  <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer">Salvar</button>

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
                <button onClick={() => setOpenRegister(false)} className="cursor-pointer absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl" >
                  &times;
                </button>
              </div>
              <form onSubmit={handleSubmitProduct}>
                <div className="space-y-4 mb-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="font-medium">
                      Nome
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={product.name}
                      onChange={(e) => setProduct({...product, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="description" className="font-medium">
                      Descrição
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={product.description}
                      onChange={(e) => setProduct({...product, description:e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[80px] resize-y"
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="quantity" className="font-medium">
                      Quantidade
                    </label>
                    <input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="0"
                      value={product.quantity}
                      onChange={(e) => setProduct({...product, quantity:e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="price" className="font-medium">
                      Preço
                    </label>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={product.price}
                      onChange={(e) => setProduct({...product, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="code" className="font-medium">
                      Código
                    </label>
                    <input
                      id="code"
                      name="code"
                      type='number'
                      value={product.code}
                      onChange={(e) => setProduct({...product, code:e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      required
                    />
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

      ) : ("")}
    </Dashboard>

  );
};

export default SearchProdutos;
