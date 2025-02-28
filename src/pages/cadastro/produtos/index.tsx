import React, { useState } from 'react';

import { submitProduct } from '../../../service/api/products/products';
import Dashboard from '../../../components/dashboard';


const CadastrarProduto = () => {

  const [cadProduto, setCadProduto] = useState({
    name: '',
    price: 0,
    description: '',
    quantity: 0,
    code: 0
  });

  const handleChange = (e: any) => {
    e.preventDefault();
    setCadProduto({
      ...cadProduto,
      [e.target.name]: e.target.value
    })
    console.log(cadProduto);
    // Aqui você pode fazer uma chamada à API para enviar o produto cadastrado
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const resultado = await submitProduct(cadProduto);
    if (resultado === 200) {
      alert("Produto cadastrado com sucesso!");
    } else {
      alert("Erro ao cadastrar produto");
    }
  };

  return (
    <Dashboard>
      <div>
        <h1>Cadastro de Produtos</h1>
        <form onSubmit={handleSubmit}>
          f  <div>
            <label>
              Nome do Produto:
              <input
                type="text"
                name='nome'
                onChange={handleChange}
                required
                style={{ width: '120%', padding: '8px', marginBottom: '10px' }}
              />
            </label>
          </div>
          <div>
            <label className='sku'>
              Código (id):
            </label>
            <input
              type="number"
              onChange={handleChange}
              style={{ width: '80%', padding: '8px', marginBottom: '10px', marginLeft: '60px' }}
            />
          </div>
          <div>
            <label className='precoVenda'>
              Preço de Venda:
            </label>
            <input
              type="number"
              name='preco'
              onChange={handleChange}
              style={{ width: '80%', padding: '8px', marginBottom: '10px', marginLeft: '20px' }}
            />
          </div>
          <div className='group-unit'>
            <div>
              <label>
                Quantidade:
              </label>
              <input
                type="text"
                name='quantidade'
                onChange={handleChange}
                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
              />
            </div>
            <div>
              <label className='formato'>
                Formato:
              </label>
              <select name='formato' onChange={handleChange} style={{ width: '100%', padding: '8px', marginBottom: '10px', marginLeft: '26px', marginTop: '4px' }}>
                <option value="Simples ou com variação">Simples ou com variação</option>
                <option value="Simples">Simples</option>
                <option value="Com variação">Com variação</option>
              </select>
            </div>
            <div>
              <label className='tipo'>
                Tipo:
              </label>
              <select name='tipo' onChange={handleChange} style={{ width: '100%', padding: '8px', marginBottom: '10px', marginLeft: '34px', marginTop: '4px' }}>
                <option value="Produto">Produto</option>
                <option value="Serviço">Serviço</option>
              </select>
            </div>
            <div>
              <label className='condicao'>
                Condição:
              </label>
              <select name='condicao' onChange={handleChange} style={{ width: '80%', padding: '8px', marginBottom: '10px', marginLeft: '42px', marginTop: '4px' }}>
                <option value="Não Especificado">Não Especificado</option>
                <option value="Novo">Novo</option>
                <option value="Usado">Usado</option>
              </select>
            </div>
          </div>
          <div>
            <label>
              Descrição do Produto:
              <textarea
                name='descricao'
                onChange={handleChange}
                style={{ width: '100%', padding: '8px', marginBottom: '10px', height: '100px' }}
              />
            </label>
          </div>
          <div>
            <label>
              Categoria:
              <select name='categoria' onChange={handleChange} style={{ width: '100%', padding: '8px', marginBottom: '10px' }}>
                <option value="Sem categoria">Sem categoria</option>
                <option value="Categoria 1">Categoria 1</option>
                <option value="Categoria 2">Categoria 2</option>
              </select>
            </label>
          </div>
          <button>
            Avançar
          </button>
          <a style={{ textDecoration: 'none', marginTop: '10px', color: '#000', fontWeight: 'bold' }} href="/initialpage">Voltar</a>
        </form>
      </div>
    </Dashboard>

  );
};
export default CadastrarProduto




