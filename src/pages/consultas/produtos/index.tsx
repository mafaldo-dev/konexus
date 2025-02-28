import { useState, useEffect } from 'react'

import { allProducts } from '../../../service/api/products/products';
import { Produto } from '../../../service/interfaces/produtos';
import Dashboard from '../../../components/dashboard';

import lupa from '../../../assets/image/search.png'

const SearchProdutos = () => {
  const [products, setProducts] = useState<Produto[] | any>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [viewMore, setViewMore] = useState(false)
  const [filter, setFilter] = useState({name: '', code:''})
  const [show, setShow] = useState(false)


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

  return (
    <Dashboard>
      <div className='w-fullflex flex-col items-center m-auto p-4'>
        <h1 className='text-3xl text-center mb-4'>Consultar produtos</h1>
        <div className='flex justify-end mr-2 mb-1 gap-2'>
          <input
            type="text"
            value={filter.name}
            onChange={(e) => setFilter({...filter, name: e.target.value })}
            placeholder="Digite o nome o do produto"
            className='p-2 w-74 bg-gray-100 rounded-l h-10' 
          />
          <input
            type="text"
            value={filter.code}
            onChange={(e) => setFilter({...filter, code: e.target.value })}
            placeholder="Digite o codigo do produto "
            className='p-2 w-74 bg-gray-100 rounded-l h-10' 
          />
          <img className='bg-white rounded-r p-2 h-10 cursor-pointer' src={lupa} alt="" />
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
              </tr>
            </thead>
            <tbody className='p-6'>
              {loading ? (
                <p>Carregando...</p>
              ) : (
                <p>{error}</p>
              )}
              {displayProducts.length > 0 ? (
                displayProducts.map((produto: any) => (
                  <tr className='border-t' key={produto.id}>
                    <td>{produto.code}</td>
                    <td>{produto.name}</td>
                    <td>R$ {produto.price}</td>
                    <td>{produto.quantity}</td>
                    <td>{produto.description}</td>
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
        <div className='flex justify-center gap-2'>
            <button className='bg-green-400 :hover bg-green-100 text-white font-semibold p-2 rounded-lg cursor-pointer ' onClick={() => setViewMore(!viewMore)}>{!viewMore ? 'Ver mais': 'Ver menos'}</button>
          <a className='bg-cyan-500 text-white font-semibold p-2 rounded-lg w-24 text-center' href="/dashboard">Voltar</a>
        </div>
      </div>
    </Dashboard>

  );
};

export default SearchProdutos;
