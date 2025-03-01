import { useState, useEffect } from 'react'

import { allProducts, deleteProduct, updateProduct } from '../../../service/api/products/products';
import { Produto } from '../../../service/interfaces/produtos';
import Dashboard from '../../../components/dashboard';

import lupa from '../../../assets/image/search.png'
import pencil from '../../../assets/image/edit.png'
import trash from '../../../assets/image/delete.png'

const SearchProdutos = () => {
  const [products, setProducts] = useState<Produto[] | any>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [viewMore, setViewMore] = useState(false)
  const [filter, setFilter] = useState({ name: '', code: '' })
  const [show, setShow] = useState(false)
  const [newInfos, setNewInfos] = useState<Produto | any>()
  const [modalOPen, setIsModalOpen] = useState(false)


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

  return (
    <Dashboard>
      <div className='w-fullflex flex-col items-center m-auto p-4'>
        <h1 className='text-3xl text-center mb-4'>Consultar produtos</h1>
        <div className='flex justify-between items-center mr-2 mb-1 '>
          <div className='flex flex-col mb-3'>
            <span>Novo produto</span>
            <button className='font-semibold text-2xl border rounded-sm w-26 cursor-pointer'>+</button>
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
                  <tr className='border-t cursor-pointer hover:bg-cyan-100'  key={produto.id}>
                    <td>{produto.code}</td>
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
                <h2 className="text-xl font-bold mb-4">Editar Vaga</h2>

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
    </Dashboard>

  );
};

export default SearchProdutos;
