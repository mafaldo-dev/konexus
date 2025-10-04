import React, { useState, useEffect } from 'react';
import { handleAllProducts } from '../../../service/api/Administrador/products';
import { Products } from '../../../service/interfaces';
import Dashboard from '../../../components/dashboard/Dashboard';
import logo from '../../../assets/image/guiman.png'

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

const handleGeneratePDF = () => alert('Função gerar PDF ainda não implementada');
const handleDownloadFile = () => alert('Função de download ainda não implementada');

const ALL_FILTERS = [
    { key: 'name', label: 'Nome' },
    { key: 'code', label: 'Código' },
    { key: 'brand', label: 'Marca' },
    { key: 'location', label: 'Localização' },
    { key: 'quantity', label: 'Quantidade' },
    { key: 'supplier', label: 'Fornecedor' },
    { key: 'entryDate', label: 'Data de Entrada' },
];

const Inventory: React.FC = () => {
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [allProducts, setAllProducts] = useState<Products[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Products[]>([]);
    const sensors = useSensors(useSensor(PointerSensor));
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const allProductsInventory = async () => {
        const res = await handleAllProducts();
        setAllProducts(res);
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

    return (
        <Dashboard>
            <div className="p-6 bg-white min-h-screen">
                <div className="mb-4 text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900">GUIMAN Technology</h1>
                    <h2 className="text-xl font-semibold text-gray-700 mt-1">Inventário</h2>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-3 justify-center text-sm">
                    {ALL_FILTERS.map(({ key, label }) => (
                        <label key={key} className="flex items-center space-x-1">
                            <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-gray-600"
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
                        placeholder="Buscar..."
                        className="border border-gray-300 rounded px-4 py-2 w-full sm:max-w-md text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <div className="flex gap-2">
                        <button
                            className="bg-gray-700 text-white px-4 py-2 rounded text-sm hover:bg-gray-800 transition"
                            onClick={() => setIsPreviewOpen(true)}
                        >
                            🔍 Preview
                        </button>

                        <button
                            className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 transition"
                            onClick={handleGeneratePDF}
                        >
                            🧾 Gerar PDF
                        </button>

                        <button
                            className="bg-gray-400 text-white px-4 py-2 rounded text-sm hover:bg-gray-500 transition"
                            onClick={handleDownloadFile}
                        >
                            ⬇️ Baixar Arquivo
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
                                        <SortableContext  items={selectedFilters} strategy={horizontalListSortingStrategy}>
                                            {selectedFilters.map((key) => {
                                                const label = ALL_FILTERS.find((f) => f.key === key)?.label ?? key;
                                                return <SortableHeader  key={key} id={key} label={label} />;
                                            })}
                                            <th className="px-6 py-3 text-center text-gray-700 font-semibold">Conferido</th>
                                        </SortableContext>
                                    </DndContext>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100 min-h-[100px]">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={selectedFilters.length + 1} className="px-6 py-4 text-center text-gray-500 italic">
                                        Nenhum dado disponível
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id}>
                                        {selectedFilters.map((key) => (
                                            <td key={key} className="px-6 py-4 whitespace-nowrap text-gray-800">
                                                {product[key as keyof Products]?.toString() || '-'}
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 text-center">
                                            <input type="checkbox" className="h-4 w-4 text-gray-600" />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>

                        <tfoot className="bg-gray-100 text-sm">
                            <tr>
                                <td colSpan={selectedFilters.length + 1} className="px-6 py-4 text-gray-700">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <span>📅 Data da impressão: {new Date().toLocaleDateString()}</span>
                                        <div className="flex flex-col items-start">
                                            <span className="text-xs text-gray-600 mb-1">Conferido por:</span>
                                            <div className="w-48 border-t border-gray-400" />
                                        </div>
                                    </div>
                                    <div className="mt-4 text-right text-xs text-gray-500">
                                        Total: {filteredProducts.length} itens
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            {isPreviewOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div
                        className="bg-white relative shadow-xl overflow-auto flex flex-col"
                        style={{
                            width: '793px',
                            height: '964px',
                            fontSize: '11px',
                        }}
                    >
                        <button
                            onClick={() => setIsPreviewOpen(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-sm"
                        >
                            ✖
                        </button>

                        <div className="text-center mb-4 mt-4 flex-shrink-0">
                        <div className='flex justify-left ml-20'>
                            <img className='w-35 h-25 rounded -mb-20' src={logo} alt="logo Guiman" />
                        </div>
                            <h1 className="text-xl font-bold text-gray-900">GUIMAN Technology</h1>
                            <h2 className="text-sm text-gray-700 mt-1">Preview de Inventário</h2>
                            <p className="text-xs text-gray-500 mt-1">Data: {new Date().toLocaleDateString()}</p>
                        </div>

                        <div style={{ flex: '1 1 auto', overflowY: 'auto', paddingBottom: '80px' }}>
                            <table className="min-w-full border border-gray-300 text-xs">
                                <thead className="bg-gray-200">
                                    <tr>
                                        {selectedFilters.map((key) => {
                                            const label = ALL_FILTERS.find((f) => f.key === key)?.label ?? key;
                                            return (
                                                <th
                                                    key={key}
                                                    className="px-2 py-1 text-left text-gray-700 font-semibold whitespace-nowrap"
                                                >
                                                    {label}
                                                </th>
                                            );
                                        })}
                                        <th className="px-2 py-1 text-center text-gray-700 font-semibold">Conferido</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredProducts.map((product) => (
                                        <tr key={product.id}>
                                            {selectedFilters.map((key) => (
                                                <td
                                                    key={key}
                                                    className="px-2 py-1 text-gray-800 break-words max-w-[120px]"
                                                >
                                                    {product[key as keyof Products]?.toString() || '-'}
                                                </td>
                                            ))}
                                            <td className="px-2 py-1 text-center">
                                                <input type="checkbox" className="h-3.5 w-3.5" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Rodapé fixo */}
                        <div
                            className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-300 px-4 py-3 flex justify-between items-center text-xs text-gray-700"
                            style={{ height: '70px' }}
                        >
                            <span>📅 Data da impressão: {new Date().toLocaleDateString()}</span>
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] mb-1">Conferido por:</span>
                                <div className="w-40 border-t border-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
