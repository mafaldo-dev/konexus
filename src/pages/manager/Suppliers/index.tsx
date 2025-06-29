import { useState, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { doc, deleteDoc } from "firebase/firestore"
import { db } from "../../../firebaseConfig"

import Dashboard from '../../../components/dashboard'

import { Supplier } from '../../../service/interfaces/suppliers'
import { getAllSuppliers, insertSupplier, updateSupplier } from '../../../service/api/suppliers/supplier'

import Swal from 'sweetalert2';

const SearchSuppliers = () => {
    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<Supplier>()
    const [modalOpen, setModalOpen] = useState<boolean>(false)
    const [openRegister, setOpenRegister] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
    const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null)

    // Máscaras de formatação
    const maskCNPJ = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1')
    }

    const maskPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1')
    }

    const maskZipCode = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1')
    }

    // Carregar fornecedores
    useEffect(() => {
        const loadSuppliers = async () => {
            setIsLoading(true)
            try {
                const data = await getAllSuppliers()
                setSuppliers(data)
                setFilteredSuppliers(data)
            } catch (error) {
                console.error("Erro ao carregar fornecedores:", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadSuppliers()
    }, [])

    // Filtrar fornecedores
    // useEffect(() => {
    //     if (searchTerm) {
    //         const filtered = suppliers.filter(supplier =>
    //             supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //             supplier.cnpj.includes(searchTerm) ||
    //             supplier.code.toLowerCase().includes(searchTerm.toLowerCase())
    //         setFilteredSuppliers(filtered)
    // )} else {
    //         setFilteredSuppliers(suppliers)
    //     }
    // }, [searchTerm, suppliers])

    // Cadastrar novo fornecedor
    const onSubmit: SubmitHandler<Supplier> = async (data) => {
        try {
            const supplierData: Supplier = {
                ...data,
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                address: {
                    ...data.address,
                    number: data.address.number.toString()
                }
            }

            await insertSupplier(supplierData)
            reset()
            const updatedSuppliers = await getAllSuppliers()
            setSuppliers(updatedSuppliers)
            setOpenRegister(false)
            alert("Fornecedor cadastrado com sucesso!")
        } catch (error) {
            console.error("Erro ao cadastrar fornecedor:", error)
            alert("Erro ao cadastrar fornecedor")
        }
    }

    // Editar fornecedor
    const handleEdit = (supplier: Supplier) => {
        setCurrentSupplier(supplier)
        setModalOpen(true)
    }

    const handleUpdate = async () => {
        if (!currentSupplier?.id) return

        try {
            await updateSupplier(currentSupplier.id, {
                ...currentSupplier,
                updatedAt: new Date()
            })

            const updatedSuppliers = await getAllSuppliers()
            setSuppliers(updatedSuppliers)
            setModalOpen(false)
            alert("Fornecedor atualizado com sucesso!")
        } catch (Exception) {
            console.error("Erro ao atualizar fornecedor:", Exception)
            alert("Erro ao atualizar fornecedor")
        }
    }

    // Deletar fornecedor
    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: 'Deseja excluir este fornecedor?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar',
        });

        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, "Suppliers", id));
                setSuppliers(suppliers.filter(s => s.id !== id));
                Swal.fire('Excluído!', 'Fornecedor excluído com sucesso.', 'success');
            } catch (error) {
                console.error("Erro ao excluir fornecedor:", error);
                Swal.fire('Erro!', 'Erro ao excluir fornecedor.', 'error');
            }
        }
    };
    return (
        <Dashboard>
            <div className="container mx-auto p-4">
                <h1 className="text-2xl text-center font-bold mb-12">Gerenciar Fornecedores</h1>
                <div className="flex justify-between items-center mr-2 mb-1 w-full">
                    <div className="flex flex-col mb-3 cursor-pointer hover:zoonIn">
                        <span className="ml-1 text-sm">Novo Fornecedor</span>
                        <button
                            onClick={() => setOpenRegister(true)}
                            className="font-semibold pb-1 ml-1 text-2xl border-gray-400 border text-gray-400 rounded-sm w-26 cursor-pointer"
                        > + </button>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            // placeholder="Pesquisar fornecedor..."
                            placeholder='Desativado'
                            className="pl-10 pr-4 py-2 border rounded-lg w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute left-3 top-2.5">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Tabela de fornecedores */}
                {isLoading ? (
                    <p>Carregando...</p>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cidade/UF</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredSuppliers.map((supplier) => (
                                    <tr key={supplier.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">{supplier.code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{supplier.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{supplier.cnpj}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{supplier.phone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{supplier.address.city}/{supplier.address.state}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${supplier.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {supplier.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(supplier)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(supplier.id!)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal de cadastro */}
                {openRegister && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                            <div className="p-6">
                                <div className="flex justify-between items-center border-b pb-4">
                                    <h2 className="text-xl font-bold">Cadastrar Novo Fornecedor</h2>
                                    <button
                                        onClick={() => setOpenRegister(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Código*</label>
                                            <input
                                                {...register("code", { required: true })}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            {errors.code && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">CNPJ*</label>
                                            <input
                                                {...register("cnpj", {
                                                    required: true,
                                                    onChange: (e) => {
                                                        e.target.value = maskCNPJ(e.target.value)
                                                    }
                                                })}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            {errors.cnpj && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Razão Social*</label>
                                        <input
                                            {...register("name", { required: true })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        {errors.name && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
                                        <input
                                            {...register("tradingName")}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">E-mail*</label>
                                            <input
                                                type="email"
                                                {...register("email", { required: true })}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            {errors.email && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Telefone*</label>
                                            <input
                                                {...register("phone", {
                                                    required: true,
                                                    onChange: (e) => {
                                                        e.target.value = maskPhone(e.target.value)
                                                    }
                                                })}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            {errors.phone && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <h3 className="text-lg font-medium">Endereço</h3>
                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700">Logradouro*</label>
                                                <input
                                                    {...register("address.street", { required: true })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                {errors.address?.street && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Número*</label>
                                                <input
                                                    {...register("address.number", { required: true })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                {errors.address?.number && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Complemento</label>
                                                <input
                                                    {...register("address.complement")}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Bairro*</label>
                                                <input
                                                    {...register("address.neighborhood", { required: true })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                {errors.address?.neighborhood && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">CEP*</label>
                                                <input
                                                    {...register("address.zipCode", {
                                                        required: true,
                                                        onChange: (e) => {
                                                            e.target.value = maskZipCode(e.target.value)
                                                        }
                                                    })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                {errors.address?.zipCode && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Cidade*</label>
                                                <input
                                                    {...register("address.city", { required: true })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                {errors.address?.city && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Estado*</label>
                                                <input
                                                    {...register("address.state", { required: true })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                {errors.address?.state && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">UF*</label>
                                                <input
                                                    {...register("address.uf", { required: true })}
                                                    className="mt-1 block w-22 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                {errors.address?.uf && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setOpenRegister(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Salvar Fornecedor
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de edição */}
                {modalOpen && currentSupplier && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                            <div className="p-6">
                                <div className="flex justify-between items-center border-b pb-4">
                                    <h2 className="text-xl font-bold">Editar Fornecedor</h2>
                                    <button
                                        onClick={() => setModalOpen(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="mt-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Código</label>
                                            <input
                                                value={currentSupplier.code}
                                                onChange={(e) => setCurrentSupplier({ ...currentSupplier, code: e.target.value })}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                                            <input
                                                value={currentSupplier.cnpj}
                                                onChange={(e) => {
                                                    e.target.value = maskCNPJ(e.target.value)
                                                    setCurrentSupplier({ ...currentSupplier, cnpj: e.target.value })
                                                }}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Razão Social</label>
                                        <input
                                            value={currentSupplier.name}
                                            onChange={(e) => setCurrentSupplier({ ...currentSupplier, name: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
                                        <input
                                            value={currentSupplier.tradingName || ''}
                                            onChange={(e) => setCurrentSupplier({ ...currentSupplier, tradingName: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">E-mail</label>
                                            <input
                                                type="email"
                                                value={currentSupplier.email}
                                                onChange={(e) => setCurrentSupplier({ ...currentSupplier, email: e.target.value })}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Telefone</label>
                                            <input
                                                value={currentSupplier.phone}
                                                onChange={(e) => {
                                                    e.target.value = maskPhone(e.target.value)
                                                    setCurrentSupplier({ ...currentSupplier, phone: e.target.value })
                                                }}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <h3 className="text-lg font-medium">Endereço</h3>
                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700">Logradouro</label>
                                                <input
                                                    value={currentSupplier.address.street}
                                                    onChange={(e) => setCurrentSupplier({
                                                        ...currentSupplier,
                                                        address: { ...currentSupplier.address, street: e.target.value }
                                                    })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Número</label>
                                                <input
                                                    value={currentSupplier.address.number}
                                                    onChange={(e) => setCurrentSupplier({
                                                        ...currentSupplier,
                                                        address: { ...currentSupplier.address, number: e.target.value }
                                                    })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Complemento</label>
                                                <input
                                                    value={currentSupplier.address.complement || ''}
                                                    onChange={(e) => setCurrentSupplier({
                                                        ...currentSupplier,
                                                        address: { ...currentSupplier.address, complement: e.target.value }
                                                    })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Bairro</label>
                                                <input
                                                    value={currentSupplier.address.neighborhood}
                                                    onChange={(e) => setCurrentSupplier({
                                                        ...currentSupplier,
                                                        address: { ...currentSupplier.address, neighborhood: e.target.value }
                                                    })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">CEP</label>
                                                <input
                                                    value={currentSupplier.address.zipCode}
                                                    onChange={(e) => {
                                                        e.target.value = maskZipCode(e.target.value)
                                                        setCurrentSupplier({
                                                            ...currentSupplier,
                                                            address: { ...currentSupplier.address, zipCode: e.target.value }
                                                        })
                                                    }}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Cidade</label>
                                                <input
                                                    value={currentSupplier.address.city}
                                                    onChange={(e) => setCurrentSupplier({
                                                        ...currentSupplier,
                                                        address: { ...currentSupplier.address, city: e.target.value }
                                                    })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Estado</label>
                                                <input
                                                    value={currentSupplier.address.state}
                                                    onChange={(e) => setCurrentSupplier({
                                                        ...currentSupplier,
                                                        address: { ...currentSupplier.address, state: e.target.value }
                                                    })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">UF</label>
                                                <input
                                                    value={currentSupplier.address.uf}
                                                    onChange={(e) => setCurrentSupplier({
                                                        ...currentSupplier,
                                                        address: { ...currentSupplier.address, uf: e.target.value }
                                                    })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                                <select
                                                    value={currentSupplier.active ? 'active' : 'inactive'}
                                                    onChange={(e) => setCurrentSupplier({
                                                        ...currentSupplier,
                                                        active: e.target.value === 'active'
                                                    })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="active">Ativo</option>
                                                    <option value="inactive">Inativo</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setModalOpen(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleUpdate}
                                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Salvar Alterações
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Dashboard >
    )
}

export default SearchSuppliers