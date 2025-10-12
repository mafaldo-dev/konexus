import React, { useState, useEffect, useRef } from 'react';
import { handleAllProducts } from '../../../service/api/Administrador/products';
import { Products } from '../../../service/interfaces';
import Dashboard from '../../../components/dashboard/Dashboard';
import logo from '../../../assets/image/konexuslogo.png'
import { Download, PrinterIcon} from 'lucide-react';

import {
    DndContext,
    closestCenter,
    useSensor,
    useSensors,
    PointerSensor,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    arrayMove,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ALL_FILTERS = [
    { key: 'code', label: 'Código' },
    { key: 'name', label: 'Nome' },
    { key: 'description', label: 'Descrição' },
    { key: 'brand', label: 'Marca' },
    { key: 'category', label: 'Categoria' },
    { key: 'location', label: 'Localização' },
    { key: 'stock', label: 'Estoque Atual' },
    { key: 'minimum_stock', label: 'Estoque Mínimo' },
];


const Inventory: React.FC = () => {
    const [selectedFilters, setSelectedFilters] = useState<string[]>(['code', 'name', 'location', 'stock']);
    const [searchTerm, setSearchTerm] = useState('');
    const [allProducts, setAllProducts] = useState<Products[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Products[]>([]);
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
    const sensors = useSensors(useSensor(PointerSensor));
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const allProductsInventory = async () => {
        try {
            const res = await handleAllProducts();
            setAllProducts(res);
            setFilteredProducts(res);
        } catch (error) {
            console.error('❌ Erro ao carregar produtos:', error);
        }
    };

    useEffect(() => {
        allProductsInventory();
    }, []);

    const toggleFilter = (key: string) => {
        setSelectedFilters((prev) =>
            prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
        );
    };

    useEffect(() => {
        if (selectedFilters.length === 0 || searchTerm.trim() === '') {
            setFilteredProducts(allProducts);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = allProducts.filter((product) =>
            selectedFilters.some((key) => {
                const value = product[key as keyof Products];
                return value?.toString().toLowerCase().includes(term);
            })
        );
        setFilteredProducts(filtered);
    }, [searchTerm, selectedFilters, allProducts]);

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = selectedFilters.indexOf(active.id);
            const newIndex = selectedFilters.indexOf(over.id);
            setSelectedFilters((items) => arrayMove(items, oldIndex, newIndex));
        }
    };

    const toggleCheck = (productId: number) => {
        setCheckedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const formatValue = (key: string, value: any) => {
        if (key === 'stock' || key === 'minimum_stock') {
            return `${value} un`;
        }
        return value?.toString() || '-';
    };

    const handlePrint = async () => {
    const element = printRef.current;
    if (!element) return;

    try {
        const html2pdf = (await import('html2pdf.js')).default;

        const opt = {
            margin: 10,
            filename: 'temp.pdf',
            image: { type: 'jpeg' as any, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as any }
        };

        const pdf = html2pdf().set(opt).from(element);
        // em vez de salvar, gerar blob
        const blob = await pdf.outputPdf('blob');

        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url);
        if (!printWindow) return;
        printWindow.focus();
    } catch (error) {
        console.error('Erro ao imprimir PDF:', error);
    }
};

    const handleExport = async (mode: 'print' | 'pdf') => {
        const element = printRef.current;
        if (!element) return;

        if (mode === 'print') {
            const printWindow = window.open('', '_blank');
            if (!printWindow) return;

            printWindow.document.write(`
            <html>
                <head>
                    <title>Inventário</title>
                </head>
                <body>${element.innerHTML}</body>
            </html>
        `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        } else if (mode === 'pdf') {
            try {
                const html2pdf = (await import('html2pdf.js')).default;

                const opt = {
                    margin: 10,
                    filename: `inventario_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`,
                    image: { type: 'jpeg' as any, quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as any }
                };

                await html2pdf().set(opt).from(element).save();
            } catch (error) {
                console.error('Erro ao gerar PDF:', error);
                alert('Erro ao gerar PDF. Tente usar a opção de Imprimir.');
            }
        }
    };


    return (
        <Dashboard>
            <div className="p-6 bg-white min-h-screen">
                <div className="mb-4 text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900">Konéxus Technology</h1>
                    <h2 className="text-xl font-semibold text-gray-700 mt-1">Inventário</h2>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-3 justify-center text-sm">
                    {ALL_FILTERS.map(({ key, label }) => (
                        <label key={key} className="flex items-center space-x-1 cursor-pointer">
                            <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-gray-600 cursor-pointer"
                                checked={selectedFilters.includes(key)}
                                onChange={() => toggleFilter(key)}
                            />
                            <span className="text-gray-700">{label}</span>
                        </label>
                    ))}
                </div>

                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <input
                        type="text"
                        placeholder="Buscar nos campos selecionados..."
                        className="border border-gray-300 rounded px-4 py-2 w-full sm:max-w-md text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <div className="flex gap-2">
                        <button
                            className="bg-slate-800 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition flex items-center gap-2"
                            onClick={() => setIsPreviewOpen(true)}
                        >
                            <span>📄</span> Preview
                        </button>
                    </div>
                </div>

                <div className="overflow-auto rounded-lg shadow border border-gray-300">
                    <table className="min-w-full divide-y divide-gray-300 text-sm">
                        <thead className='bg-slate-300'>
                            <tr>
                                {selectedFilters.length === 0 ? (
                                    <th colSpan={ALL_FILTERS.length + 1} className="px-6 py-3 text-center text-gray-800 font-semibold">
                                        Selecione ao menos um filtro para mostrar colunas
                                    </th>
                                ) : (
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                        <SortableContext items={selectedFilters} strategy={horizontalListSortingStrategy}>
                                            {selectedFilters.map((key) => {
                                                const label = ALL_FILTERS.find((f) => f.key === key)?.label ?? key;
                                                return <SortableHeader key={key} id={key} label={label} />;
                                            })}
                                            <th className="px-6 py-3 text-center text-gray-700 font-semibold">Conferido</th>
                                        </SortableContext>
                                    </DndContext>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={selectedFilters.length + 1} className="px-6 py-4 text-center text-gray-500 italic">
                                        {allProducts.length === 0 ? 'Carregando produtos...' : 'Nenhum produto encontrado'}
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        {selectedFilters.map((key) => (
                                            <td key={key} className="px-6 py-4 whitespace-nowrap text-gray-800">
                                                {formatValue(key, product[key as keyof Products])}
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-gray-600 cursor-pointer"
                                                checked={checkedItems.has(product.id)}
                                                onChange={() => toggleCheck(product.id)}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>

                        <tfoot className="bg-gray-100 text-sm">
                            <tr>
                                <td colSpan={selectedFilters.length + 1} className="px-6 py-4 text-gray-700">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <span>📅 Data: {new Date().toLocaleDateString('pt-BR')}</span>
                                        <div className="flex flex-col items-start">
                                            <span className="text-xs text-gray-600 mb-1">Conferido por:</span>
                                            <div className="w-48 border-t border-gray-400" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-between text-xs text-gray-600">
                                        <span>Total: {filteredProducts.length} itens</span>
                                        <span>Conferidos: {checkedItems.size} / {filteredProducts.length}</span>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Modal de Preview Melhorado */}
            {isPreviewOpen && (
                <div className="fixed inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center z-50 p-4">
                    <div className="bg-white relative shadow-2xl rounded-lg overflow-hidden flex flex-col" style={{ width: '900px', maxWidth: '95%', height: '90vh' }}>

                        {/* Header do Modal */}
                        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold">Preview de Impressão</h3>
                                <p className="text-sm text-slate-300">Visualize antes de imprimir ou baixar</p>
                            </div>
                            <button
                                onClick={() => setIsPreviewOpen(false)}
                                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full w-10 h-10 flex items-center justify-center transition"
                            >
                                <span className="text-xl">✕</span>
                            </button>
                        </div>

                        {/* Barra de Ações */}
                        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex gap-3 justify-end">
                            <button
                                onClick={handlePrint}
                                className="bg-slate-200 hover:bg-slate-700 text-white px-2 py-2 h-7 rounded-lg text-sm font-sm flex items-center transition"
                            >
                                <span><PrinterIcon className='h-3 w-3 text-black'/></span> 
                            </button>
                            <button
                                onClick={() => handleExport('pdf')}
                                className="bg-slate-200 hover:bg-blue-700 text-white px-2 py-2 h-7 rounded-lg text-sm font-sm flex items-center transition"
                            >
                                <span><Download className='h-3 w-3 text-black' /></span> 
                            </button>
                        </div>

                        {/* Conteúdo para Impressão */}
                        <div className="flex-1 overflow-auto p-6 bg-slate-50">
                            <div ref={printRef} className="bg-white shadow-lg rounded-lg p-8 max-w-4xl mx-auto">

                                {/* Cabeçalho do Documento */}
                                <div className="text-center mb-8 border-b-2 border-slate-300 pb-6">
                                    <div className='flex justify-center mb-4'>
                                        <img className='w-40 h-auto' src={logo} alt="logo Konexus" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Konéxus Technology</h1>
                                    <h2 className="text-xl text-slate-700 font-semibold mb-2">Ficha de Inventário</h2>
                                    <div className="flex justify-center gap-8 text-sm text-slate-600 mt-4">
                                        <div>
                                            <span className="font-semibold">Data de Emissão:</span> {new Date().toLocaleDateString('pt-BR')}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Hora:</span> {new Date().toLocaleTimeString('pt-BR')}
                                        </div>
                                    </div>
                                </div>

                                {/* Tabela de Produtos */}
                                <table className="min-w-full border-collapse border border-slate-300 text-sm mb-6">
                                    <thead>
                                        <tr className="bg-slate-200">
                                            {selectedFilters.map((key) => {
                                                const label = ALL_FILTERS.find((f) => f.key === key)?.label ?? key;
                                                return (
                                                    <th key={key} className="border border-slate-300 px-3 py-2 text-left text-slate-800 font-bold">
                                                        {label}
                                                    </th>
                                                );
                                            })}
                                            <th className="border border-slate-300 px-3 py-2 text-center text-slate-800 font-bold w-24">
                                                Conferido
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.map((product, index) => (
                                            <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                {selectedFilters.map((key) => (
                                                    <td key={key} className="border border-slate-300 px-3 py-2 text-slate-700">
                                                        {formatValue(key, product[key as keyof Products])}
                                                    </td>
                                                ))}
                                                <td className="border border-slate-300 px-3 py-2 text-center">
                                                    <div className="w-5 h-5 border-2 border-slate-400 rounded mx-auto" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Rodapé do Documento */}
                                <div className="border-t-2 border-slate-300 pt-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="bg-slate-50 p-3 rounded">
                                            <span className="font-semibold text-slate-700">Total de Itens:</span>
                                            <span className="ml-2 text-lg font-bold text-slate-900">{filteredProducts.length}</span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded">
                                            <span className="font-semibold text-slate-700">Itens Conferidos:</span>
                                            <span className="ml-2 text-lg font-bold text-slate-900">{checkedItems.size} / {filteredProducts.length}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mt-8">
                                        <div>
                                            <p className="text-xs text-slate-600 mb-2 font-semibold">RESPONSÁVEL PELA CONTAGEM:</p>
                                            <div className="border-b-2 border-slate-400 pb-1 mb-1"></div>
                                            <p className="text-xs text-slate-500">Nome / Assinatura</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-600 mb-2 font-semibold">SUPERVISOR / GERENTE:</p>
                                            <div className="border-b-2 border-slate-400 pb-1 mb-1"></div>
                                            <p className="text-xs text-slate-500">Nome / Assinatura</p>
                                        </div>
                                    </div>

                                    <div className="text-center text-xs text-slate-500 mt-6 pt-4 border-t border-slate-200">
                                        Documento gerado automaticamente pelo sistema Konéxus Technology
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #print-content, #print-content * {
                        visibility: visible;
                    }
                    #print-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 210mm;
                        padding: 10mm;
                        background: white;
                    }
                }
            `}</style>
        </Dashboard>
    );
};

// Header Arrastável
function SortableHeader({ id, label }: { id: string; label: string }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: 'grab',
        backgroundColor: isDragging ? '#E5E7EB' : undefined,
    };

    return (
        <th
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={style}
            className="px-6 py-3 text-left text-gray-700 font-semibold whitespace-nowrap"
        >
            {label}
        </th>
    );
}

export default Inventory;