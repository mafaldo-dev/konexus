import React, { useState, useEffect } from 'react';
import { handleAllProducts } from '../../../service/api/Administrador/products';
import { handleAllOrders } from '../../../service/api/Administrador/orders'; // Adicione esta importação
import { Products } from '../../../service/interfaces';
import Dashboard from '../../../components/dashboard/Dashboard';
import { Settings, X, Check, Calendar, Package, Filter, FileText } from 'lucide-react';

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
import DocumentViewer from '../../../utils/screenOptions';

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
    // States existentes
    const [selectedFilters, setSelectedFilters] = useState<string[]>(['code', 'name', 'location', 'stock']);
    const [searchTerm, setSearchTerm] = useState('');
    const [allProducts, setAllProducts] = useState<Products[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Products[]>([]);
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
    const sensors = useSensors(useSensor(PointerSensor));

    // States do DocumentViewer
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [showViewer, setShowViewer] = useState(false);
    const [documentType, setDocumentType] = useState<"purchase_order" | "label_70x30" | "label_100x100" | "separation_list" | "relatorio_expedicao" | "relatorio_inventario">("relatorio_inventario");

    // Novos states para configuração de relatórios
    const [showSettings, setShowSettings] = useState(false);
    const [reportType, setReportType] = useState<'inventory' | 'shipped' | null>(null);
    const [tempDate, setTempDate] = useState('');
    const [confirmedDate, setConfirmedDate] = useState('');
    const [displayData, setDisplayData] = useState<any[]>([]);
    const [allOrders, setAllOrders] = useState<any[]>([]);

    // Inicializa a data de hoje
    useEffect(() => {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        setTempDate(formattedDate);
    }, []);

    // Carrega produtos
    const allProductsInventory = async () => {
        try {
            const res = await handleAllProducts();
            setAllProducts(res);
        } catch (error) {
            console.error('❌ Erro ao carregar produtos:', error);
        }
    };

    // Carrega pedidos
    const loadAllOrders = async () => {
        try {
            const res = await handleAllOrders();
            setAllOrders(res);
        } catch (error) {
            console.error('❌ Erro ao carregar pedidos:', error);
        }
    };

    useEffect(() => {
        allProductsInventory();
        loadAllOrders();
    }, []);

    // Atualiza displayData baseado no tipo de relatório
    useEffect(() => {
        if (reportType === 'inventory') {
            setDisplayData(allProducts);
        } else if (reportType === 'shipped' && confirmedDate) {
            
            // Filtra pedidos pela data
            const ordersOnDate = allOrders.filter(order => {
                const orderDate = new Date(order.orderDate).toISOString().split('T')[0];
                return orderDate === confirmedDate;
            });


            // Extrai todos os itens dos pedidos filtrados
            const shippedItems: any[] = [];
            ordersOnDate.forEach(order => {
                
                if (order.orderItems && Array.isArray(order.orderItems)) {
                    order.orderItems.forEach((item: any) => {
                        // Busca informações completas do produto
                        const product = allProducts.find(p => 
                            p.id === item.productid || 
                            p.code === item.productcode
                        );
                        
                        if (product) {
                            shippedItems.push({
                                ...product,
                                quantity: item.quantity,
                                orderNumber: order.orderNumber,
                                shippedDate: order.orderDate
                            });
                        } else {
                            // Se não encontrou o produto na lista, usa os dados do pedido
                            shippedItems.push({
                                id: item.productid,
                                code: item.productcode,
                                name: item.productname,
                                brand: item.productbrand,
                                location: item.location,
                                quantity: item.quantity,
                                orderNumber: order.orderNumber,
                                shippedDate: order.orderDate,
                                description: '-',
                                category: '-',
                                stock: 0,
                                minimum_stock: 0
                            });
                        }
                    });
                }
            });

            setDisplayData(shippedItems);
        }
    }, [reportType, confirmedDate, allProducts, allOrders]);

    // Filtra displayData por termo de busca
    useEffect(() => {
        if (displayData.length === 0) {
            setFilteredProducts([]);
            return;
        }

        if (selectedFilters.length === 0 || searchTerm.trim() === '') {
            setFilteredProducts(displayData);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = displayData.filter((product) =>
            selectedFilters.some((key) => {
                const value = product[key as keyof Products];
                return value?.toString().toLowerCase().includes(term);
            })
        );
        setFilteredProducts(filtered);
    }, [searchTerm, selectedFilters, displayData]);

    const toggleFilter = (key: string) => {
        setSelectedFilters((prev) =>
            prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
        );
    };

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
        if (key === 'stock' || key === 'minimum_stock' || key === 'quantity') {
            return `${value || 0} un`;
        }
        return value?.toString() || '-';
    };

    const handleSelectReportType = (type: 'inventory' | 'shipped') => {
        setReportType(type);
        setShowSettings(false);
        setConfirmedDate('');
        setDisplayData([]);
        
        // Reset filtros
        if (type === 'shipped') {
            setSelectedFilters(['code', 'name', 'location', 'quantity', 'orderNumber']);
        } else {
            setSelectedFilters(['code', 'name', 'location', 'stock']);
        }
    };

    const handleConfirmDate = () => {
        setConfirmedDate(tempDate);
    };

    const formatDateToBR = (dateString: string) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const handleGenerateReport = () => {
        const report = {
            reportType,
            selectedDate: reportType === 'shipped' ? confirmedDate : new Date().toISOString(),
            selectedFilters,
            allFilters: ALL_FILTERS,
            reportitems: filteredProducts.map((product: any) => ({
                code: product.code,
                name: product.name,
                description: product.description,
                brand: product.brand,
                category: product.category,
                location: product.location,
                stock: product.stock,
                minimum_stock: product.minimum_stock,
                // Campos específicos de expedição (só existem quando reportType === 'shipped')
                ...(reportType === 'shipped' && {
                    quantity: product.quantity,
                    orderNumber: product.orderNumber,
                })
               
            }))
        };
         console.log("report logs ->",report)

        setSelectedReport(report);
        setDocumentType(reportType === 'inventory' ? 'relatorio_inventario' : 'relatorio_expedicao');
        setShowViewer(true);
    };

    // Calcula datas sugeridas
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

    const showFilterSection = reportType === 'inventory' || (reportType === 'shipped' && confirmedDate);

    if (showViewer) {
        return (
            <DocumentViewer
                report={selectedReport}
                documentType={documentType}
                onClose={() => {
                    setShowViewer(false);
                }}
            />
        );
    }

    return (
        <Dashboard>
            <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    {/* Cabeçalho */}
                    <div className="mb-6 text-center">
                        <h1 className="text-3xl font-extrabold text-slate-900">Konéxus</h1>
                        <h2 className="text-xl font-semibold text-slate-700 mt-1">Sistema de Relatórios</h2>
                    </div>

                    {/* Botão de Configurações */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowSettings(true)}
                                className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 shadow-md"
                            >
                                <Settings className="w-5 h-5" />
                                Configurar Relatório
                            </button>
                            
                            {reportType && (
                                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                                    <span className="text-sm text-slate-600">Tipo: </span>
                                    <span className="font-semibold text-slate-900">
                                        {reportType === 'inventory' ? '📦 Inventário Completo' : '📅 Expedição por Data'}
                                    </span>
                                    {reportType === 'shipped' && confirmedDate && (
                                        <span className="ml-2 text-sm text-slate-600">
                                            ({formatDateToBR(confirmedDate)})
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modal de Configurações */}
                    {showSettings && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
                                <div className="sticky top-0 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                                    <div className="flex items-center gap-3">
                                        <Settings className="w-6 h-6" />
                                        <h3 className="text-xl font-bold">Configurar Relatório</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowSettings(false)}
                                        className="hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <p className="text-slate-600 mb-6">Escolha o tipo de relatório que deseja gerar:</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handleSelectReportType('inventory')}
                                            className="group p-6 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="bg-blue-100 group-hover:bg-blue-200 p-3 rounded-lg transition">
                                                    <Package className="w-8 h-8 text-blue-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-lg text-slate-900 mb-1">
                                                        Inventário Completo
                                                    </h4>
                                                    <p className="text-sm text-slate-600">
                                                        Todos os produtos em estoque com suas informações atualizadas
                                                    </p>
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => handleSelectReportType('shipped')}
                                            className="group p-6 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="bg-emerald-100 group-hover:bg-emerald-200 p-3 rounded-lg transition">
                                                    <Calendar className="w-8 h-8 text-emerald-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-lg text-slate-900 mb-1">
                                                        Expedição por Data
                                                    </h4>
                                                    <p className="text-sm text-slate-600">
                                                        Itens expedidos em uma data específica com detalhes dos pedidos
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Seletor de Data (apenas quando tipo 'shipped' foi selecionado e data não confirmada) */}
                    {reportType === 'shipped' && !confirmedDate && (
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-emerald-200">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="w-5 h-5 text-emerald-600" />
                                <h3 className="text-lg font-semibold text-slate-900">Selecione a Data de Expedição</h3>
                            </div>
                            
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-wrap items-end gap-3">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Data:
                                        </label>
                                        <input
                                            type="date"
                                            value={tempDate}
                                            onChange={(e) => setTempDate(e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                    
                                    <button
                                        onClick={handleConfirmDate}
                                        disabled={!tempDate}
                                        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                                    >
                                        <Check className="w-4 h-4" />
                                        Confirmar Data
                                    </button>
                                </div>

                                {tempDate && (
                                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                                        <p className="text-sm text-slate-700">
                                            Data selecionada: <span className="font-bold text-emerald-700">{formatDateToBR(tempDate)}</span>
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    <span className="text-sm text-slate-600">Atalhos:</span>
                                    <button
                                        onClick={() => setTempDate(today.toISOString().split('T')[0])}
                                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium transition"
                                    >
                                        Hoje
                                    </button>
                                    <button
                                        onClick={() => setTempDate(yesterday.toISOString().split('T')[0])}
                                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium transition"
                                    >
                                        Ontem
                                    </button>
                                    <button
                                        onClick={() => setTempDate(dayBeforeYesterday.toISOString().split('T')[0])}
                                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium transition"
                                    >
                                        Anteontem
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filtros de Colunas */}
                    {showFilterSection && (
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Filter className="w-5 h-5 text-slate-700" />
                                <h3 className="text-lg font-semibold text-slate-900">Selecione os Campos do Relatório</h3>
                            </div>
                            
                            <div className="flex flex-wrap gap-3">
                                {ALL_FILTERS.map(({ key, label }) => (
                                    <label key={key} className="flex items-center space-x-2 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg transition">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-4 w-4 text-blue-600 rounded cursor-pointer"
                                            checked={selectedFilters.includes(key)}
                                            onChange={() => toggleFilter(key)}
                                        />
                                        <span className="text-sm text-slate-700 font-medium">{label}</span>
                                    </label>
                                ))}
                                
                                {reportType === 'shipped' && (
                                    <>
                                        <label className="flex items-center space-x-2 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg transition">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-4 w-4 text-emerald-600 rounded cursor-pointer"
                                                checked={selectedFilters.includes('quantity')}
                                                onChange={() => toggleFilter('quantity')}
                                            />
                                            <span className="text-sm text-slate-700 font-medium">Quantidade</span>
                                        </label>
                                        
                                        <label className="flex items-center space-x-2 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg transition">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-4 w-4 text-emerald-600 rounded cursor-pointer"
                                                checked={selectedFilters.includes('orderNumber')}
                                                onChange={() => toggleFilter('orderNumber')}
                                            />
                                            <span className="text-sm text-slate-700 font-medium">Nº Pedido</span>
                                        </label>
                                    </>
                                )}
                            </div>

                            <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <p className="text-sm text-slate-700">
                                    <span className="font-semibold">{selectedFilters.length}</span> campos selecionados para o relatório
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Busca e Ações */}
                    {showFilterSection && (
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                <input
                                    type="text"
                                    placeholder="Buscar nos campos selecionados..."
                                    className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />

                                <button
                                    onClick={handleGenerateReport}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 shadow-md"
                                >
                                    <FileText className="w-4 h-4" />
                                    Gerar Relatório
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tabela */}
                    {showFilterSection && (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="overflow-auto">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="bg-slate-200">
                                            <tr>
                                                <SortableContext items={selectedFilters} strategy={horizontalListSortingStrategy}>
                                                    {selectedFilters.map((key) => {
                                                        const filter = ALL_FILTERS.find((f) => f.key === key);
                                                        const label = filter?.label || 
                                                            (key === 'quantity' ? 'Quantidade' : key === 'orderNumber' ? 'Nº Pedido' : key);
                                                        return <SortableHeader key={key} id={key} label={label} />;
                                                    })}
                                                </SortableContext>
                                                <th className="px-4 py-3 text-center text-slate-800 font-semibold">Conferido</th>
                                            </tr>
                                        </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {filteredProducts.length === 0 ? (
                                            <tr>
                                                <td colSpan={selectedFilters.length + 1} className="px-6 py-8 text-center text-slate-500 italic">
                                                    {reportType === 'shipped' 
                                                        ? 'Nenhum item expedido nesta data' 
                                                        : 'Nenhum produto encontrado'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredProducts.map((product: any, index) => (
                                                <tr key={product.id || index} className="hover:bg-slate-50 transition">
                                                    {selectedFilters.map((key) => (
                                                        <td key={key} className="px-4 py-3 whitespace-nowrap text-slate-800">
                                                            {key === 'code' ? (
                                                                <span className="font-mono">{formatValue(key, product[key as keyof Products])}</span>
                                                            ) : key === 'stock' || key === 'quantity' ? (
                                                                <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                                                                    {formatValue(key, product[key as any])}
                                                                </span>
                                                            ) : key === 'location' ? (
                                                                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                                                    product[key] && product[key] !== 'Não definido'
                                                                        ? 'bg-emerald-100 text-emerald-800'
                                                                        : 'bg-amber-100 text-amber-800'
                                                                }`}>
                                                                    {product[key] || '—'}
                                                                </span>
                                                            ) : (
                                                                formatValue(key, product[key as any])
                                                            )}
                                                        </td>
                                                    ))}
                                                    <td className="px-4 py-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 text-blue-600 cursor-pointer rounded"
                                                            checked={checkedItems.has(product.id)}
                                                            onChange={() => toggleCheck(product.id)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot className="bg-slate-100">
                                        <tr>
                                            <td colSpan={selectedFilters.length + 1} className="px-6 py-4">
                                                <div className="flex justify-between items-center text-sm text-slate-700">
                                                    <span>
                                                        <span className="font-semibold">Total:</span> {filteredProducts.length} itens
                                                    </span>
                                                    <span>
                                                        <span className="font-semibold">Conferidos:</span> {checkedItems.size} / {filteredProducts.length}
                                                    </span>
                                                    <span className="text-slate-500">
                                                        📅 {reportType === 'shipped' && confirmedDate
                                                            ? formatDateToBR(confirmedDate)
                                                            : new Date().toLocaleDateString('pt-BR')}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </DndContext>
                        </div>
                    </div>
                )}

                    {/* Mensagem inicial */}
                    {!reportType && (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <Settings className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhum relatório configurado</h3>
                            <p className="text-slate-500 mb-6">Clique no botão "Configurar Relatório" para começar</p>
                        </div>
                    )}
                </div>
            </div>
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
            className="px-4 py-3 text-left text-slate-800 font-semibold whitespace-nowrap"
        >
            {label}
        </th>
    );
}

export default Inventory;