import { useState, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { doc, deleteDoc } from "firebase/firestore"
import { db } from "../../../firebaseConfig"

import { Supplier } from '../../../service/interfaces/suppliers'
import { getAllSuppliers, insertSupplier, updateSupplier } from '../../../service/api/suppliers/supplier'
import Dashboard from '../../../components/dashboard'

import lupa from "../../../assets/image/search.png"
import pencil from "../../../assets/image/edit.png"
import trash from "../../../assets/image/delete.png"


const SearchSuppliers = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<Supplier>()

    const [modalOpen, setModalOpen] = useState<boolean>(false)
    const [openRegister, setOpenRegister] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<Boolean>(false)
    const [render, setRender] = useState<Supplier[]>([])
    const [error, setError] = useState<string | null>(null)
    const [newInfos, setNewInfos] = useState<Supplier>()
    const [supplier, setSupplier] = useState<Supplier[]>([])
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [filter, setFilter] = useState<Supplier[]>([])


    const onSubmit: SubmitHandler<Supplier> = async (data) => {
        try {
            await insertSupplier({ ...data, added: new Date() })
            reset()
            const reload = await getAllSuppliers()
            alert("Fornecedor cadastrado com sucesso!")
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
                phone: newInfos.phone,
                state: newInfos.state,
                city: newInfos.city,
                street: newInfos.address,
                number: newInfos.number,
                cnpj: newInfos.socialName,
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
    const editSupplier = (supplier: Supplier) => {
        setNewInfos(supplier)
        setModalOpen(true)
    }
    async function deleteSupplier(id: string | any) {
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
                <h1 className="text-3xl text-center mb-4">Consultar Fornecedores</h1>
                <div className="flex justify-between items-center mr-2 mb-1 w-full">
                    <div className="flex flex-col mb-3 cursor-pointer hover:zoonIn">
                        <span className="ml-1">Novo Fornecedores</span>
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
                                            <th className="h-10 px-4 text-left font-medium text-gray-700">E-mail</th>
                                            <th className="h-10 px-4 text-left font-medium text-gray-700">Telefone</th>
                                            <th className='h-10 px-4 text-left font-medium text-gray-700'>Estado</th>
                                            <th className='h-10 px-4 text-left font-medium text-gray-700'>Cidade</th>
                                            <th className="h-10 px-4 text-left font-medium text-gray-700"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Corpo da Tabela com Scroll */}
                                        {filter.length > 0 ? (
                                            filter.map((sup) => (
                                                <tr className="border-b cursor-pointer border-gray-200 hover:bg-gray-50" key={sup.id}>
                                                    <td className="p-4 text-gray-900">{sup.code}</td>
                                                    <td className="p-4 text-gray-900 ">{sup.name}</td>
                                                    <td className="p-4 text-gray-900 ">{sup.email}</td>
                                                    <td className="p-4 text-gray-900">{sup.phone}</td>
                                                    <td className="p-4 text-gray-900">{sup.state}</td>
                                                    <td className="p-4 text-gray-900">{sup.city}</td>
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
                <a className="bg-white hover:bg-cyan-500 hover:text-white font-semibold text-gray-500 border border-gray-400 font-semibold p-2 rounded-lg w-24 text-center" href="/dashboard">
                    Voltar
                </a>
            </div>
            {modalOpen && newInfos && (
                <>
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        {/* Overlay com blur */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>

                        {/* Modal */}
                        <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto relative z-10">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-5 rounded-t-xl">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-white">Editar Fornecedor</h2>
                                    <button
                                        onClick={() => setModalOpen(false)}
                                        className="text-white/80 hover:text-white transition-colors rounded-full w-8 h-8 flex items-center justify-center"
                                    >
                                        <span className="sr-only">Fechar</span>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                <form>
                                    {/* Informações Pessoais */}
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                            Informações Pessoais
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nome
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={newInfos.name}
                                                    onChange={handleChange}
                                                    placeholder="Nome completo"
                                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                                        E-mail
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={newInfos.email}
                                                        onChange={handleChange}
                                                        placeholder="exemplo@email.com"
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                                    />
                                                </div>

                                                <div>
                                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Telefone
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="phone"
                                                        value={newInfos.phone}
                                                        onChange={handleChange}
                                                        placeholder="(00) 00000-0000"
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Código
                                                </label>
                                                <input
                                                    type="text"
                                                    name="code"
                                                    value={newInfos.code}
                                                    onChange={handleChange}
                                                    placeholder="Código do fornecedor"
                                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Endereço */}
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Endereço</h3>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Estado
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="state"
                                                        value={newInfos.state}
                                                        onChange={handleChange}
                                                        placeholder="Estado"
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                                    />
                                                </div>

                                                <div>
                                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Cidade
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="city"
                                                        value={newInfos.city}
                                                        onChange={handleChange}
                                                        placeholder="Cidade"
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="md:col-span-2">
                                                    <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Logradouro
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="address"
                                                        value={newInfos.address}
                                                        onChange={handleChange}
                                                        placeholder="Rua, Avenida, etc."
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                                    />
                                                </div>

                                                <div>
                                                    <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Número
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="number"
                                                        value={newInfos.number}
                                                        onChange={handleChange}
                                                        placeholder="Nº"
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label htmlFor="socialName" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Razao Social
                                                </label>
                                                <input
                                                    type="text"
                                                    name="socialName"
                                                    value={newInfos.socialName}
                                                    onChange={handleChange}
                                                    placeholder="00000-000"
                                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botões */}
                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setModalOpen(false)}
                                            className="px-5 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={saveUpdate}
                                            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                            Salvar Alterações
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}
            {openRegister ? (
                <>
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-[650px] max-w-[90vw] z-50 max-h-[90vh] overflow-y-auto">
                        <div className="p-8">
                            <div className="relative mb-8 border-b pb-4">
                                <h2 className="text-2xl font-bold text-gray-800">Cadastrar Fornecedor</h2>
                                <p className="text-gray-500 mt-1">Preencha os campos abaixo para cadastrar um novo Fornecedor.</p>
                                <button
                                    onClick={() => setOpenRegister(false)}
                                    className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                                    aria-label="Fechar"
                                >
                                    <span className="text-xl">&times;</span>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                {/* Informações Pessoais */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Informações Pessoais</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label htmlFor="name" className="text-sm font-medium text-gray-700">
                                                Nome Completo
                                            </label>
                                            <input
                                                id="name"
                                                type="text"
                                                {...register("name", { required: true })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="Digite o nome completo"
                                            />
                                            {errors.name && <span className="text-red-500 text-xs font-medium">O campo nome é obrigatório</span>}
                                        </div>

                                        <div className="space-y-1">
                                            <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                                E-mail
                                            </label>
                                            <input
                                                id="email"
                                                type="email"
                                                {...register("email", { required: true })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="exemplo@email.com"
                                            />
                                            {errors.email && <span className="text-red-500 text-xs font-medium">E-mail é obrigatório</span>}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                                            Telefone
                                        </label>
                                        <input
                                            id="phone"
                                            type="tel"
                                            {...register("phone", { required: true })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="(00) 00000-0000"
                                        />
                                        {errors.phone && <span className="text-red-500 text-xs font-medium">Telefone é obrigatório</span>}
                                    </div>
                                </div>

                                {/* Endereço */}
                                <div className="space-y-4 pt-2">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Endereço</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label htmlFor="state" className="text-sm font-medium text-gray-700">
                                                Estado
                                            </label>
                                            <input
                                                id="state"
                                                type="text"
                                                {...register("state", { required: true })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="Digite o estado"
                                            />
                                            {errors.state && <span className="text-red-500 text-xs font-medium">Estado é obrigatório</span>}
                                        </div>

                                        <div className="space-y-1">
                                            <label htmlFor="city" className="text-sm font-medium text-gray-700">
                                                Cidade
                                            </label>
                                            <input
                                                id="city"
                                                type="text"
                                                {...register("city", { required: true })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="Digite a cidade"
                                            />
                                            {errors.city && <span className="text-red-500 text-xs font-medium">Cidade é obrigatória</span>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1 md:col-span-2">
                                            <label htmlFor="street" className="text-sm font-medium text-gray-700">
                                                Logradouro
                                            </label>
                                            <input
                                                id="street"
                                                type="text"
                                                {...register("address", { required: true })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="Rua, Avenida, etc."
                                            />
                                            {errors.address && <span className="text-red-500 text-xs font-medium">Logradouro é obrigatório</span>}
                                        </div>

                                        <div className="space-y-1">
                                            <label htmlFor="number" className="text-sm font-medium text-gray-700">
                                                Número
                                            </label>
                                            <input
                                                id="number"
                                                type="number"
                                                {...register("number", { required: true })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="Nº"
                                            />
                                            {errors.number && <span className="text-red-500 text-xs font-medium">Número é obrigatório</span>}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label htmlFor="socialName" className="text-sm font-medium text-gray-700">
                                            Razão social
                                        </label>
                                        <input
                                            id="socialName"
                                            type="text"
                                            {...register("socialName", { required: true })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="00.000 000/0000.00"
                                        />
                                        {errors.socialName && <span className="text-red-500 text-xs font-medium">CEP é obrigatório</span>}
                                    </div>
                                </div>

                                {/* Informações Adicionais */}
                                <div className="space-y-4 pt-2">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Informações Adicionais</h3>

                                    <div className="space-y-1">
                                        <label htmlFor="code" className="text-sm font-medium text-gray-700">
                                            Código do fornecedor
                                        </label>
                                        <input
                                            id="code"
                                            type="number"
                                            {...register("code", { required: true })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="Digite o código do fornecedor"
                                        />
                                        {errors.code && <span className="text-red-500 text-xs font-medium">Código é obrigatório</span>}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        onClick={() => setOpenRegister(false)}
                                        type="button"
                                        className="px-5 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                                    >
                                        Salvar Fornecedor
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            ) : ""}
        </Dashboard>

    )
}

export default SearchSuppliers