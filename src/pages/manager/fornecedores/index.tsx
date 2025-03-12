import { useState, useEffect } from 'react'

import { Fornecedor } from '../../../service/interfaces/fornecedor'
import { handleAllFornecedores } from '../../../service/api/suppliers/supplier'
import Dashboard from '../../../components/dashboard'


const SearchFornecedores = () => {
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [isLoading, setIsLoading] = useState<Boolean>(false)
    const [error, setError] = useState<string | any>(null)
    const [filter, setFilter] = useState<Fornecedor[]>([])
    const [fornecedores, setFornecedor] = useState<Fornecedor[]>([])

    // função pra buscar a lista de fornecedores na API
    const handleFornecedor = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await handleAllFornecedores(searchTerm)
            setFornecedor(response)
            setFilter(response)
        } catch (error) {
            setError("Erro ao buscar os Fornecedores")
        } finally {
            setIsLoading(false)
        }
    }
    // chama funçao pra buscar os fornecedores ao montar o componente
    useEffect(() => {
        handleFornecedor()
    }, [])


    useEffect(() => {
        if (searchTerm) {
            const filtered = fornecedores.filter((fornecedor) =>
                fornecedor.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            setFilter(filtered)
        } else {
            setFilter(fornecedores)
        }
    }, [searchTerm, fornecedores])
    return (
        <Dashboard>
            <section>
                <table>
                    <h1>Pesquisar Fornecedores</h1>
                    <div>
                        <input
                            type="text"
                            placeholder="Digite o nome do Desejado"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)} // Atualiza o termo de busca
                        />
                        <button onClick={handleFornecedor}>Buscar</button>
                    </div>

                    {isLoading ? (
                        <p>Carregando...</p>
                    ) : error ? (
                        <p>{error}</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nome</th>
                                    <th>Telefone</th>
                                    <th>Email</th>
                                    <th>Cidade</th>
                                    <th>Cep</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filter.length > 0 ? (
                                    filter.map((fornecedor) => (
                                        <tr key={fornecedor.id}>
                                            <td>{fornecedor.id}</td>
                                            <td>{fornecedor.name}</td>
                                            <td>{fornecedor.telefone}</td>
                                            <td>{fornecedor.email}</td>
                                            <td>{fornecedor.cidade}</td>
                                            <td>{fornecedor.numero}</td>

                                        </tr>
                                    ))
                                ) : (
                                    <td>
                                        <td colSpan={9}>Nenhum fornecedor encontrado</td>
                                    </td>
                                )}
                            </tbody>
                        </table>
                    )}
                    <a href="/initialpage">Voltar</a>
                </table>
            </section>
        </Dashboard>

    )
}

export default SearchFornecedores