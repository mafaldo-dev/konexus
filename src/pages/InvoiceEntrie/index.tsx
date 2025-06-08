import React, { useState } from 'react';
import Dashboard from '../../components/dashboard';
import { InvoiceEntries } from '../../service/interfaces/invoices';
import { handleProductWithCode } from '../../service/api/products';
import { Products } from '../../service/interfaces/products';


interface RegisterProduct {
    name: string
    quantity: number
    tipe: string
}


const InvoiceEntrie: React.FC = () => {
    const [produtoNome, setProdutoNome] = useState('');
    const [produtoQtd, setProdutoQtd] = useState<number>(1);
    const [produtos, setProdutos] = useState<RegisterProduct[]>([]);
    const [product, setProduct] = useState<Products | null>(null)
    const [code, setCode] = useState<string>("")
    const [count, setCount] = useState(0)

    const [form, setForm] = useState<InvoiceEntries>({
        enterprise: '',
        cnpj: '',
        street: '',
        number: 0,
        neighborhood: '',
        city: '',
        uf: '',
        entrieDate: "dd/mm/aa",
        invoice: 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        setForm((prevForm: any) => ({
            ...prevForm,
            [name]: name === "number" || name === "invoice" ? Number(value) : value
        }))

    };


    // PROCURA NO DB SI O PRODUTO JA TEM CADASTRO 
    const handleProduct = async () => {
        if (!code) return

        try {
            const product = await handleProductWithCode(Number(code))
            console.log(product)

            if (product) {
                setProduct(product as Products)
                console.log("Produto encontrado: ", product)
            } else {
                setProduct(null)
                alert("Erro ao recuperar produto")
            }
        } catch (Exception) {
            console.error("Erro ao encontrar produto: ", Exception)
            alert("Nenhum produto encontrado com o codigo fornecido!")
        }
    }

    // SAVE INVOICE TEST
    const saveNf = () => {
        if (!produtos || produtos.length === 0) {
            alert("Adicione pelo menos um produto antes de salvar a nota.");
            return;
        }

        const notaSalva = {
            dataEnterprise: form,
            products: produtos,
            data: new Date().toISOString(),
        };

        const existingData = JSON.parse(localStorage.getItem("notasalva") || "[]");
        existingData.push(notaSalva);
        localStorage.setItem("notasalva", JSON.stringify(existingData));
        alert("Nota fiscal salva com sucesso!");
    };

    // ADD PRODUCT SEM CADASTRO
    const addProduct = () => {
        if (!produtoNome.trim() || produtoQtd <= 0) return;

        setProdutos((prev): any => [
            ...prev,
            { name: produtoNome, quantity: produtoQtd }]);
        setProdutoNome('');
        setProdutoQtd(1);
    };

    return (
        <Dashboard>
            <div className="max-w-6xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-10 space-y-10">
                {/* Seção: Dados da Empresa */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Informações da Empresa</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { label: 'Empresa', name: 'enterprise', placeholder: 'Nome da empresa' },
                            { label: 'CNPJ', name: 'cnpj', placeholder: '00.000.000/0000-00' },
                            { label: 'Rua', name: 'street', placeholder: 'Ex: Av. Paulista' },
                            { label: 'Número', name: 'number', placeholder: '123' },
                            { label: 'Bairro', name: 'neighborhood', placeholder: 'Centro' },
                            { label: 'Cidade', name: 'city', placeholder: 'São Paulo' },
                            { label: 'UF', name: 'uf', placeholder: 'SP' },
                            { label: 'Data de Entrada', name: 'entrieDate', type: 'date' },
                            { label: 'Nº Nota Fiscal', name: 'invoice', placeholder: '000123456' },
                        ]
                            .map(({ label, name, placeholder, type = 'text' }) => (
                                <div key={name}>
                                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                                    <input
                                        type={type}
                                        name={name}
                                        value={form[name as keyof typeof form]}
                                        onChange={handleChange}
                                        placeholder={placeholder}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            ))}
                    </div>
                </section>

                <hr className="border-t border-gray-300" />

                {/* Seção: Adicionar Produtos */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Adicionar Produto</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome do Produto</label>
                            <input
                                type="text"
                                value={produtoNome}
                                onChange={e => setProdutoNome(e.target.value)}
                                placeholder="Ex: Monitor"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                            <input
                                type="number"
                                min={1}
                                value={produtoQtd}
                                onChange={e => setProdutoQtd(Number(e.target.value))}
                                className="mt-1 block w-22 p-2 rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <button className='bg-red-500 p-2 cursor-pointer' onClick={addProduct}> adicionar produto</button>
                        </div>
                        <div className='flex w-66 justify-between px-2 border border-gray-300 rounded-lg'>
                            <input
                                onChange={(e) => setCode(e.target.value)}
                                className='w-full p-2'
                                placeholder='Codigo Produto'
                                type="number"
                                value={code}
                            />
                            <button onClick={handleProduct}> Buscar</button>
                        </div>

                    </div>
                    {product && (
                        <div className="mt-4 bg-gray-100 p-4 rounded shadow">
                            <p className="font-semibold text-gray-800">Produto: {product.name}</p>
                            <p>Tipo: {product.name}</p>
                            <p>Código: {product.code}</p>
                            <p>Qtd em estoque: {product.quantity}</p>
                            <p>Quantidade a adicionar</p>
                            <input
                                type="number"
                                min={1}
                                value={count}
                                onChange={(e) => setCount(Number(e.target.value))}
                                className="bg-blue-200"
                            />

                            <button
                                onClick={() => {
                                    setProdutos((prev) => [
                                        ...prev,
                                        {
                                            name: product.name,
                                            quantity: count,
                                            tipe: product.description,
                                        }
                                    ]);
                                    setProduct(null);
                                    setCode('');
                                }}
                                className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            >
                                Inlcuir produto
                            </button>
                        </div>
                    )}

                    {/* Tabela de produtos */}
                    <div className="mt-6 overflow-x-auto">
                        {produtos.length === 0 ? (
                            <p className="text-gray-500 italic">Nenhum produto adicionado.</p>
                        ) : (
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                                <thead className="bg-gray-100 text-gray-700">
                                    <tr>
                                        <th className="py-2 px-4 text-left border-b text-black">Produto</th>
                                        <th className="py-2 px-4 text-left border-b">Quantidade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {produtos.map((produto, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition">
                                            <td className="py-2 px-4 border-b">{produto.name}</td>
                                            <td className="py-2 px-4 border-b">{produto.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <div className='flex mt-2'>
                            <button
                                onClick={saveNf}
                                type='submit'
                                className='bg-cyan-500 text-white font-bold rounded-lg m-auto w-38 h-12'>

                                Finalizar Nota fiscal
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </Dashboard>
    );
};

export default InvoiceEntrie;
