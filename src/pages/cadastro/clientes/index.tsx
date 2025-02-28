import { useState } from 'react';
import Dashboard from '../../../components/dashboard';

const CadastroClientes = () => {
  const [cliente, setCliente] = useState({
    nome: '',
    endereco: '',
    sobrenome: '',
    telefone: '',
    email: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setCliente({ ...cliente, [name]: value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    console.log('Dados do cliente:', cliente);
  };

  return (
    <Dashboard>
      <div>
        <h1>Cadastro de Cliente</h1>
        <form onSubmit={handleSubmit}>
          <div className='client-name'>
            <label className='name'>Nome:</label>
            <input
              type="text"
              name="nome"
              value={cliente.nome}
              onChange={handleChange}
              required
            />

            <label className='name-secondary'>Sobrenome:</label>
            <input
              type="text"
              name="sobrenome"
              value={cliente.sobrenome}
              onChange={handleChange}
            />
          </div>

          <div className='email-and-tel'>
            <label className='tel'>Telefone:</label>
            <input
              className='tel-input'
              type="number"
              name="telefone"
              value={cliente.telefone}
              onChange={handleChange}
            />

            <label className='email'>Email:</label>
            <input
              className='email-input'
              type="email"
              name="email"
              value={cliente.email}
              onChange={handleChange}
            />
          </div>

          <div className='rua-and-num'>
            <label className='logradouro'>Logradouro:</label>
            <input
              className='rua-input'
              type="text"
              name="logradouro"
              value={cliente.logradouro}
              onChange={handleChange}
            />

            <label className='num'>Num:</label>
            <input
              className='num-input'
              type="number"
              name="numero"
              value={cliente.email}
              onChange={handleChange}
            />
          </div>


          <div className='cidade-and-estado'>
            <label className='city'>Cidade:</label>
            <input
              className='city-input'
              type="text"
              name="cidade"
              value={cliente.cidade}
              onChange={handleChange}
            />

            <label className='state'>Estado:</label>
            <input
              className='state-input'
              type="text"
              name="estado"
              value={cliente.estado}
              onChange={handleChange}
            />
          </div>

          <div className='bairro-and-cep'>
            <label className='bairro'>Bairro:</label>
            <input
              className='bairro-input'
              type="text"
              name="bairro"
              value={cliente.bairro}
              onChange={handleChange}
            />
            <label className='cep'>Cep:</label>
            <input
              className='cep-input'
              type="number"
              name="cep"
              value={cliente.cep}
              onChange={handleChange}
            />
          </div>

          <button>
            <button type="submit">Gravar Dados</button>
            <a href='/initialpage'>Voltar </a>
          </button>
        </form>
      </div>
    </Dashboard>

  );
};

export default CadastroClientes;
