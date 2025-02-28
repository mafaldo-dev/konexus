import { useState, useEffect, use } from "react";

import { allProducts } from "../../service/api/products/products";
import { Produto } from "../../service/interfaces/produtos";
import Dashboard from "../dashboard";




const PainelAdmin = () => {

  const [lembretes, setLembretes] = useState(localStorage.getItem("lembretes") || "");
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [products, setProducts] = useState<Produto[]>([])





  const handleChangeRascunhos = (e: any) => {
    setLembretes(e.target.value);

  };
  const lowProducts = async () => {
    try {
      setLoading(true)
      const response = await allProducts()
      setProducts(response)
      console.log("Reponse painel admin:", response)

    } catch (exe) {
      console.error('Erro ao recuperar produtos', exe)
      setError("Erro ao recuperar dados dos produtos")

    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    lowProducts()
  }, [])

  return (
    <Dashboard className="flex h-screen bg-gray-100">
      <main>
        {/* Seção de Notificaçoes */}
        <div className="flex p-8 gap-1 justify-between">
          <div className="grid grid-cols-1 gap-4 mt-4 w-4/12">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold mb-2">Notificações</h3>
              <ul className="list-disc pl-4">
                <li><a href="#" className="text-blue-500">Mensagens</a></li>
                <li><a href="#" className="text-blue-500">Emails</a></li>
                <li><a href="#" className="text-blue-500">Transportadora</a></li>
                <li><a href="#" className="text-blue-500">Ver mais</a></li>
              </ul>
            </div>
          </div>
          {/* Seção statisticas */}
          <div className="grid grid-cols-1 gap-4 mt-4 w-4/12">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold mb-2">Statisticas</h3>
              <ul className="list-disc pl-4">
                <li><a href="#" className="text-blue-500">Vendas</a></li>
                <li><a href="#" className="text-blue-500">Mercado</a></li>
                <li><a href="#" className="text-blue-500">Produção</a></li>
                <li><a href="#" className="text-blue-500">Ver mais</a></li>
              </ul>
            </div>
          </div>

          {/* Seção de links rápidos */}
          <div className="grid grid-cols-1 gap-4 mt-4 w-4/12">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold mb-2">Links rapidos</h3>
              <ul className="list-disc pl-4">
                <li><a href="#" className="text-blue-500">Estoque</a></li>
                <li><a href="#" className="text-blue-500">Clientes</a></li>
                <li><a href="#" className="text-blue-500">Fornecedores</a></li>
                <li><a href="#" className="text-blue-500">Ver mais</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Status e Rascunhos */}
        <div className="grid grid-cols-2 gap-22 mt-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold mb-2">Status da empresa</h3>
            <div className="grid grid-cols-3 h-62 gap-4">
              <div className="bg-gray-100 flex flex-col items-center gap-6 justify-center m-auto w-full h-full">
                <span className="text-green-500 text-4xl">1</span>
                <p className="text-gray-500 text-lg">{'Funcionarios'}</p>
                <div className="w-44">
                  <button className="bg-cyan-500 text-white font-semibold p-2 w-full">Ver funcionarios</button>
                </div>
              </div>
              <div className="bg-gray-100 flex flex-col items-center gap-6 justify-center m-auto w-full h-full">
                <span className="text-blue-300 text-4xl">{'4'}</span>
                <p className="text-gray-500 text-lg">{'Departamentos'}</p>
                <div className="w-44">
                  <button className="bg-cyan-500 text-white font-semibold p-2 w-full">Ver Departamentos</button>
                </div>
              </div>
              <div className="bg-gray-100 flex flex-col items-center gap-6 justify-center m-auto w-full h-full">
                <span className="text-violet-300 text-4xl">{'4'}</span>
                <p className="text-gray-500 text-lg">{'Designações'}</p>
                <div className="w-44">
                  <button className="bg-cyan-500 text-white font-semibold p-2 w-full">Ver Designações</button>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow w-9/12">
            <h3 className="font-bold mb-2">Rascunho Rápido</h3>
            <input className="border p-2 rounded w-full mb-2" placeholder="Título" value={lembretes} onChange={handleChangeRascunhos} />
            <textarea className="border p-2 rounded w-full mb-2" placeholder="O que você está pensando?" />
            <button className="bg-cyan-500 font-semibold text-white p-2 w-full rounded hover:bg-gray-800">Salvar como rascunho</button>
          </div>
        </div>

        {/* Tabela de produtos */}
        <div className="bg-white p-6 mt-4 rounded-lg shadow overflow-x-auto">
          <h3 className="font-bold mb-2">Produtos com Baixo Estoque</h3>
          <table className="w-full border-collapse border border-gray-300 text-left">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Codigo</th>
                <th className="p-2">Nome</th>
                <th className="p-2">Quant</th>
                <th className="p-2">Descrição</th>
                <th className="p-2">Preço</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => (
                  product.quantity <= 10 && (
                    <tr key={product.id} className="border-t">
                      <td className="p-2">{product.code}</td>
                      <td className="p-2">{product.name}</td>
                      <td className="p-2">{product.quantity}</td>
                      <td className="p-2">{product.description}</td>
                      <td className="p-2">R$ {product.price}</td>
                    </tr>
                  )
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center p-2">Nenhum produto encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </Dashboard>
  );
};

export default PainelAdmin;
