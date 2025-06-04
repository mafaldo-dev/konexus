import { useState, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { doc, deleteDoc } from "firebase/firestore"
import { db } from "../../../firebaseConfig"

import { Fornecedor } from '../../../service/interfaces/fornecedor'
import { getAllSuppliers, insertSupplier, updateSupplier } from '../../../service/api/suppliers/supplier'
import Dashboard from '../../../components/dashboard'

import lupa from "../../../assets/image/search.png"
import pencil from "../../../assets/image/edit.png"
import trash from "../../../assets/image/delete.png"


const SearchFornecedores = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<Fornecedor>()

    const [modalOpen, setModalOpen] = useState<boolean>(false)
    const [openRegister, setOpenRegister] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<Boolean>(false)
    const [render, setRender] = useState<Fornecedor[]>([])
    const [error, setError] = useState<string | any>(null)
    const [newInfos, setNewInfos] = useState<Fornecedor>()
    const [supplier, setSupplier] = useState<Fornecedor[]>([])
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [filter, setFilter] = useState<Fornecedor[]>([])


    const onSubmit: SubmitHandler<Fornecedor> = async (data) => {
        try {
            await insertSupplier({ ...data, added: new Date() })
            reset()
            const reload = await getAllSuppliers()
            setRender(reload)
            setOpenRegister(false)
        } catch (Exception) {
            console.error("Erro ao cadastrar fornecedor", Exception)
            setError("Erro ao cadastrar fornecedor")
            throw new Error
        }
    }
    useEffect(() => {
        const getSupplier = async () => {
            try {
                setIsLoading(true)
                const suppliers = await getAllSuppliers()
                setRender(suppliers)
            } catch (Exception) {
                console.error("Erro ao recuperar lista de fornecedores: ", Exception)
                setError("Erro ao recupera lista de fornecedores")
                throw new Error
            } finally {
                setIsLoading(false)
            }
        }
        getSupplier()
    }, [])

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setNewInfos((prev: any) => ({
            ...prev,
            [name]: value
        }))
    }
    const saveUpdate = async () => {
        if (!newInfos || !newInfos.id) {
            alert("ID do FORNECEDOR não encontrado!")
            return
        }
        try {
            await updateSupplier(newInfos.id, {
                name: newInfos.name,
                email: newInfos.email,
                phone: newInfos.telefone,
                state: newInfos.estado,
                city: newInfos.cidade,
                street: newInfos.endereco,
                number: newInfos.numero,
                cnpj: newInfos.razaoSocial,
                date: new Date()

            })
            alert("Dados do fornecedor atualizado com sucesso!")
            setModalOpen(false)
            const reload = await getAllSuppliers()
            setFilter(reload)
        } catch (Exception) {
            console.error("Erro ao atualizar os dados do Fornecedor", Exception)
            alert("Erro ao atualizar os dados do Fornecedor!")
            throw new Error
        }
    }
    // ABRE O MODAL PARA EDIÇÃO DE PRODUTOS
    const editSupplier = (supplier: Fornecedor) => {
        setNewInfos(supplier)
        setModalOpen(true)
    }
    async function deleteSupplier(id: any) {
        try {
            await deleteDoc(doc(db, "Suppliers", id))
            setSupplier(supplier.filter(s => s.id !== id));
            alert("Produto deletado com sucesso!");
            const reload = await getAllSuppliers()
            setRender(reload)
        } catch (Exception) {
            console.error("Erro ao deletar produto: ", Exception);
            alert("Erro ao deletar produto, tente novamente.");
            throw new Error
        }
    }
    // FILTRO COMEÇA AQUI
    useEffect(() => {
        if (searchTerm) {
            const filtered = supplier.filter((s) =>
                s.name.toLowerCase().includes(searchTerm.toLowerCase()))
            setFilter(filtered)
        } else {
            setFilter(supplier)
        }
    }, [searchTerm, supplier])

    const handleSupplier = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const res = await getAllSuppliers(searchTerm)
            setSupplier(res)
            setFilter(res)

        } catch (Exception) {
            console.error("Erro ao buscar Fornecedor:", Exception)
            alert("Erro ao recuperar informações do FORNECEDOR!")
            throw new Error
        }
    }
    useEffect(() => {
        handleSupplier()
    }, [])
    return (
        <Dashboard>
            <div className="w-full flex flex-col items-center m-auto p-4">
                <h1 className="text-3xl text-center mb-4">Consultar produtos</h1>
                <div className="flex justify-between items-center mr-2 mb-1 w-full">
                    <div className="flex flex-col mb-3 cursor-pointer hover:zoonIn">
                        <span className="ml-1">Novo produto</span>
                        <button
                            onClick={() => setOpenRegister(true)}
                            className="font-semibold pb-1 ml-1 text-2xl border-gray-400 border text-gray-400 rounded-sm w-26 cursor-pointer"
                        > + </button>
                    </div>
                    <div className="flex">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Digite o nome o do produto"
                            className="p-2 w-74 bg-gray-100 border-gray-400 rounded h-10 border mr-1"
                        />
                        <img
                            className="bg-gray-100 border-gray-400 rounded-r p-1 -ml-2 h-10 cursor-pointer border"
                            src={lupa || "/placeholder.svg"}
                            alt=""
                        />
                    </div>
                </div>
                {isLoading ? (<p>Carregando...</p>) : error ? (<p>{error}</p>)
                    : (
                        <div className="w-full border border-gray-300 rounded">
                            {/* Cabeçalho da Tabela */}
                            <div className="overflow-x-auto">
                                <table className="w-full table-fixed">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-gray-200">
                                            <th className="h-10 px-4 text-left font-medium text-gray-700">Código</th>
                                            <th className="h-10 px-4 text-left font-medium text-gray-700">Nome</th>
                                            <th className="h-10 px-4 text-left font-medium text-gray-700">Preço</th>
                                            <th className="h-10 px-4 text-left font-medium text-gray-700">Quantidade</th>
                                            <th className="h-10 px-4 text-left font-medium text-gray-700">Fornecedor</th>
                                            <th className="h-10 px-4 text-left font-medium text-gray-700"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Corpo da Tabela com Scroll */}
                                        {filter.length > 0 ? (
                                            filter.map((sup) => (
                                                <tr className="border-b cursor-pointer border-gray-200 hover:bg-gray-50" key={sup.id}>
                                                    <td className="p-4 text-gray-900">{sup.name}</td>
                                                    <td className="p-4 text-gray-900 ">{sup.email}</td>
                                                    <td className="p-4 text-gray-900">{sup.telefone}</td>
                                                    <td className="p-4 text-gray-900">{sup.razaoSocial}</td>
                                                    <td className="p-4 text-gray-900">{sup.added}</td>
                                                    <td className="p-1">
                                                        <div className="flex gap-1 ml-12">
                                                            <button>
                                                                <img
                                                                    src={pencil || "/placeholder.svg"}
                                                                    alt="Ícone de pincel"
                                                                    className="h-6 bg-green-400 rounded-sm cursor-pointer"
                                                                    onClick={() => editSupplier(sup)}
                                                                />
                                                            </button>
                                                            <button>
                                                                <img
                                                                    src={trash || "/placeholder.svg"}
                                                                    alt="Ícone de lata de lixo"
                                                                    className="h-6 bg-red-400 rounded-sm cursor-pointer"
                                                                    onClick={() => deleteSupplier(sup.id)}
                                                                />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="text-center py-4">
                                                    Nenhum fornecedor encontrado
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
                <a
                    className="bg-white hover:bg-cyan-500 hover:text-white font-semibold text-gray-500 border border-gray-400 font-semibold p-2 rounded-lg w-24 text-center" href="/dashboard">
                    Voltar </a>
            </div>
            {modalOpen && newInfos && (
                <>
                    <div className="modal">
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                                <h2 className="text-xl font-bold mb-4">Editar Fornecedor</h2>
                                <input
                                    type="text"
                                    name="name"
                                    value={newInfos.name}
                                    onChange={handleChange}
                                    placeholder="Nome"
                                    className="w-full border p-2 mb-2 rounded"
                                />
                                <input
                                    type="text"
                                    name="email"
                                    value={newInfos.email}
                                    onChange={handleChange}
                                    placeholder="E-mail"
                                    className="w-full border p-2 mb-2 rounded"
                                />
                                <input
                                    type="text"
                                    name="phone"
                                    value={newInfos.telefone}
                                    onChange={handleChange}
                                    placeholder="Telefone"
                                    className="w-full border p-2 mb-2 rounded"
                                />
                                <input
                                    name="address"
                                    value={newInfos.endereco}
                                    onChange={handleChange}
                                    placeholder="Logradouro"
                                    className="w-full border p-2 mb-2 rounded h-20"
                                />
                                <input
                                    name="state"
                                    value={newInfos.estado}
                                    onChange={handleChange}
                                    placeholder="Estado"
                                    className="w-full border p-2 mb-2 rounded h-20"
                                />
                                <input
                                    name="city"
                                    value={newInfos.cidade}
                                    onChange={handleChange}
                                    placeholder="Cidade"
                                    className="w-full border p-2 mb-2 rounded h-20"
                                />
                                <input
                                    name="cnpj"
                                    value={newInfos.razaoSocial}
                                    onChange={handleChange}
                                    placeholder="Razão social"
                                    className="w-full border p-2 mb-2 rounded h-20"
                                />
                                <div className="flex justify-between">
                                    <button
                                        className="bg-gray-400 text-white px-4 py-2 rounded cursor-pointer"
                                        onClick={() => setModalOpen(false)}>
                                        Cancelar</button>
                                    <button
                                        onClick={saveUpdate}
                                        className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer">
                                        Salvar</button>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setModalOpen(false)}>Fechar</button>
                    </div>
                </>
            )}
            {openRegister ? (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40"></div>
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg w-[600px] max-w-[90vw] z-50 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="relative mb-6">
                                <h2 className="text-2xl font-semibold mb-2">Cadastrar Fornecedor</h2>
                                <p className="text-gray-600">Preencha os campos abaixo para cadastrar um novo Fornecedor.</p>
                                <button
                                    onClick={() => setOpenRegister(false)}
                                    className="cursor-pointer absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl"
                                >&times; </button>
                            </div>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="space-y-4 mb-6">
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="name" className="font-medium">Nome</label>
                                        <input
                                            type="text"
                                            {...register("name", { required: true })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                        />
                                        {errors.name && <span className="text-red">O campo nome e obrigatorio</span>}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="email" className="font-medium">E-mail</label>
                                        <input
                                            type='text'
                                            {...register("email", { required: true })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[80px] resize-y"
                                        />
                                        {errors.email && <span className="text-red">Adicione um E-mail requerido</span>}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="phone" className="font-medium">Telefone:</label>
                                        <input
                                            type="number"
                                            {...register("telefone", { required: true })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                        />
                                        {errors.telefone && <span className="color-red-500">O campo Telefone e requerido</span>}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="state" className="font-medium">Estado</label>
                                        <input
                                            type="text"
                                            {...register("estado", { required: true })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                        />
                                        {errors.estado && <span className="color-red-500">O campo estado e obrigatorio</span>}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="city" className="font-medium">Cidade</label>
                                        <input
                                            type="text"
                                            {...register("cidade", { required: true })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                            required
                                        />
                                        {errors.cidade && <span className="color-red-500">Insira a cidade requerido</span>}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="endereco" className="font-medium">Logradouro</label>
                                        <input
                                            type="text"
                                            {...register("endereco", { required: true })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                            required
                                        />
                                        {errors.endereco && <span className="color-red-500">Vincule uma rua requerido</span>}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="numero" className="font-medium">numero</label>
                                        <input
                                            type="number"
                                            {...register("numero", { required: true })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                            required
                                        />
                                        {errors.numero && <span className="color-red-500">Numero requerido</span>}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="cnpj" className="font-medium">Razão social</label>
                                        <input
                                            type="text"
                                            {...register("razaoSocial", { required: true })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                            required
                                        />
                                        {errors.razaoSocial && <span className="color-red-500">Vincule uma cnpj requerido</span>}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setOpenRegister(false)}
                                        type="button"
                                        className="px-4 py-2 border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition-colors"
                                    > Cancelar</button>
                                    <button
                                        type="submit"
                                        className="bg-gray-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
                                    > Salvar</button>
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

export default SearchFornecedores