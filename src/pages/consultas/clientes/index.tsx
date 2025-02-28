import { useEffect, useState } from "react";

import { handleAllClientes } from "../../../service/api/clients/clients";
import { Cliente } from "../../../service/interfaces/client";
import Dashboard from "../../../components/dashboard";


const SearchClientes = () => {
  const [filteredResults, setFilteredResults] = useState<Cliente[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);


  // Função para buscar clientes ou produtos com base no tipo de busca
  const fetchClientes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await handleAllClientes(searchTerm);
      setClientes(res);
      setFilteredResults(res);
    } catch (err) {
      setError("Erro ao buscar dados")
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = clientes.filter((cliente) =>
        cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) // Aplica o filtro pelo nome do cliente
      );
      setFilteredResults(filtered);
    } else {
      setFilteredResults(clientes); // Se o termo de busca estiver vazio, mostra todos os clientes
    }
  }, [searchTerm, clientes]);
  return (
    <Dashboard>
      <div>
        <table>
          <h1>Consultar Clientes</h1>
          <div>
            <input
              type="text"
              placeholder="Digite o nome do cliente"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} // Atualiza o termo de busca
            />
            <button onClick={fetchClientes}>Buscar</button>
          </div>

          {isLoading ? (
            <p>Carregando...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <table>
              <thead>
                <th>
                  <td>ID</td>
                  <td>Nome</td>
                  <td>Telefone</td>
                  <td>Email</td>
                  <td>Cidade</td>
                  <td>Cep</td>
                </th>
              </thead>
              <tbody>
                {filteredResults.length > 0 ? (
                  filteredResults.map((cliente) => (
                    <tr key={cliente.id}>
                      <td>{cliente.id}</td>
                      <td>{cliente.nome}</td>
                      <td>{cliente.telefone}</td>
                      <td>{cliente.email}</td>
                      <td>{cliente.cidade}</td>
                      <td>{cliente.cep}</td>

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
          <a href="/initialpage">Voltar</a>
        </table>
      </div>
    </Dashboard>

  )
}

export default SearchClientes