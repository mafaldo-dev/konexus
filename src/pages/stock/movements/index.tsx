import type React from "react";
import { useState, useEffect, useRef, useMemo } from "react";
import {
    Eye,
    MapPin,
    FileText,
    X,
    TrendingUp,
    TrendingDown,
    Clock,
    Warehouse,
    Search,
    Filter,
    Download,
    Settings,
} from "lucide-react";
import Dashboard from "../../../components/dashboard/Dashboard";
import { ContextMenuPosition, FilterState, KardexEntry, Product, ReportConfig } from "./movementsType";
import { Movement, Products } from "../../../service/interfaces";
import { getAllProducts } from "../../../service/api/Administrador/products";
import { getKardexMovements } from "../../../service/api/Administrador/kardex";

export default function ProfessionalProductList() {
    const [selectedProduct, setSelectedProduct] = useState<Products | null>(null);
    const [products, setProducts] = useState<Products[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        name: "",
        code: "",
        brand: "",
        description: "",
        supplier: "",
        category: "",
    });
    const [reportConfig, setReportConfig] = useState<ReportConfig>({
        includeCode: true,
        includeName: true,
        includeDescription: true,
        includeBrand: true,
        includeSupplier: true,
        includeCategory: true,
        includePrice: true,
        includeStock: true,
        includeLocation: true,
    });
    const [contextMenu, setContextMenu] = useState<{
        show: boolean;
        position: ContextMenuPosition;
        product: Products | null;
    }>({
        show: false,
        position: { x: 0, y: 0 },
        product: null,
    });
    const [kardexProduct, setKardexProduct] = useState<Products | null>(null);
    const [kardexMovements, setKardexMovements] = useState<Movement[]>([]);
    const [showKardexModal, setShowKardexModal] = useState(false);
    const [loadingKardex, setLoadingKardex] = useState(false);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const [showReportPreview, setShowReportPreview] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);

    const getProducts = async () => {
        try {
            const response = await getAllProducts();
            console.log("Produtos recebidos:", response);
            setProducts(response);
        } catch (error) {
            console.error("Erro ao recuperar a lista de produtos!", error);
            throw new Error("Erro interno do servidor");
        }
    };

    const openKardexModal = async (product: Products) => {
        setLoadingKardex(true);
        try {
            const movements = await getKardexMovements(product.id);
            console.log(movements)
            setKardexProduct(product);
            setKardexMovements(movements);
            setShowKardexModal(true);
        } catch (error) {
            console.error("Erro ao buscar Kardex", error);
        } finally {
            setLoadingKardex(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "F4" && selectedProduct) {
                openKardexModal(selectedProduct);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedProduct]);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            return (
                product.name.toLowerCase().includes(filters.name.toLowerCase()) &&
                product.code.toLowerCase().includes(filters.code.toLowerCase()) &&
                (product.brand?.toLowerCase() || '').includes(filters.brand.toLowerCase()) &&
                product.description.toLowerCase().includes(filters.description.toLowerCase()) &&
                product.supplier.toLowerCase().includes(filters.supplier.toLowerCase()) &&
                (product.category?.toLowerCase() || '').includes(filters.category.toLowerCase())
            );
        });
    }, [products, filters]);

    const handleFilterChange = (field: keyof FilterState, value: string) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const clearFilters = () => {
        setFilters({
            name: "",
            code: "",
            brand: "",
            description: "",
            supplier: "",
            category: "",
        });
    };

    const handleContextMenu = (e: React.MouseEvent, product: Products) => {
        e.preventDefault();
        setContextMenu({
            show: true,
            position: { x: e.clientX, y: e.clientY },
            product,
        });
    };

    const handleProductClick = (product: Products) => {
        setSelectedProduct(product);
        setContextMenu({ show: false, position: { x: 0, y: 0 }, product: null });
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                setContextMenu({ show: false, position: { x: 0, y: 0 }, product: null });
            }
        };
        getProducts();
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleContextMenuAction = (action: string) => {
        const product = contextMenu.product;
        if (!product) return;

        switch (action) {
            case "photo":
                alert(`Visualizar foto de: ${product.name}`);
                break;
            case "kardex":
                openKardexModal(product);
                break;
            case "address":
                alert(`Endereço atual: ${product.location}\nFuncionalidade de alteração em desenvolvimento`);
                break;
            case "report":
                alert(`Gerando relatório para: ${product.name}`);
                break;
        }
        setContextMenu({ show: false, position: { x: 0, y: 0 }, product: null });
    };

    const generateReportPreview = () => {
        const data = filteredProducts.map((product) => {
            const row: any = {};
            if (reportConfig.includeCode) row.Código = product.code;
            if (reportConfig.includeName) row.Nome = product.name;
            if (reportConfig.includeDescription) row.Descrição = product.description;
            if (reportConfig.includeBrand) row.Marca = product.brand;
            if (reportConfig.includeSupplier) row.Fornecedor = product.supplier;
            if (reportConfig.includeCategory) row.Categoria = product.category;
            if (reportConfig.includePrice) row.Preço = `R$ ${product.price}`;
            if (reportConfig.includeStock) row.Estoque = product.minimum_stock;
            if (reportConfig.includeLocation) row.Localização = product.location;
            return row;
        });

        setReportData(data);
        setShowReportModal(false);
        setShowReportPreview(true);
    };

    const downloadReport = () => {
        const headers = Object.keys(reportData[0] || {});
        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório de Produtos</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1e293b; text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
            th { background-color: #1e293b; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .info { text-align: center; margin-bottom: 20px; color: #64748b; }
          </style>
        </head>
        <body>
          <h1>Relatório de Produtos</h1>
          <div class="info">
            <p>Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
            <p>Total de produtos: ${reportData.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                ${headers.map((header) => `<th>${header}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${reportData
                .map(
                    (row) => `
                <tr>
                  ${headers.map((header) => `<td>${row[header] || ""}</td>`).join("")}
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    const getKardexIcon = (type: Movement["type"]) => {
        switch (type) {
            case "entrada":
                return <TrendingUp className="w-4 h-4 text-emerald-600" />;
            case "saida":
                return <TrendingDown className="w-4 h-4 text-red-600" />;
            case "previsao":
                return <Clock className="w-4 h-4 text-amber-600" />;
        }
    };

    const getKardexTypeColor = (type: Movement["type"]) => {
        switch (type) {
            case "entrada":
                return "bg-emerald-50 text-emerald-800 border-emerald-200";
            case "saida":
                return "bg-red-50 text-red-800 border-red-200";
            case "previsao":
                return "bg-amber-50 text-amber-800 border-amber-200";
        }
    };

    if (showReportPreview) {
        const headers = Object.keys(reportData[0] || {});
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <button
                                onClick={() => setShowReportPreview(false)}
                                className="text-slate-700 hover:text-slate-900 mb-4 font-medium transition-colors flex items-center gap-2"
                            >
                                ← Voltar para Lista de Produtos
                            </button>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Prévia do Relatório</h1>
                            <p className="text-gray-600 font-medium">Visualize o relatório antes de fazer o download</p>
                        </div>
                        <button
                            onClick={downloadReport}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium shadow-sm"
                        >
                            <Download className="w-5 h-5" />
                            Baixar Relatório
                        </button>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 font-medium uppercase tracking-wide mb-1">Data de Geração</p>
                                <p className="text-lg font-bold text-slate-800">
                                    {new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600 font-medium uppercase tracking-wide mb-1">Total de Produtos</p>
                                <p className="text-lg font-bold text-slate-800">{reportData.length}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600 font-medium uppercase tracking-wide mb-1">Colunas Incluídas</p>
                                <p className="text-lg font-bold text-slate-800">{headers.length}</p>
                            </div>
                        </div>
                    </div>
                    <div
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                        style={{ height: "calc(100vh - 350px)", minHeight: "400px" }}
                    >
                        <div className="bg-slate-800 text-white p-4">
                            <h2 className="text-xl font-semibold">Relatório de Produtos</h2>
                        </div>
                        <div className="overflow-x-auto h-full">
                            <table className="w-full h-full">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        {headers.map((header) => (
                                            <th
                                                key={header}
                                                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, index) => (
                                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                            {headers.map((header) => (
                                                <td key={header} className="px-4 py-2 text-xs text-gray-700">
                                                    {row[header] || ""}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-between items-center">
                        <button
                            onClick={() => setShowReportPreview(false)}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        >
                            Voltar para Lista
                        </button>
                        <button
                            onClick={downloadReport}
                            className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium"
                        >
                            <Download className="w-4 h-4" />
                            Baixar Relatório
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Dashboard>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Produtos</h1>
                        <p className="text-gray-600 font-medium">
                            Clique para selecionar • Botão direito para opções • F4 para kardex
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${showFilters ? "bg-slate-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    <Filter className="w-4 h-4" />
                                    Filtros
                                </button>
                                {Object.values(filters).some((filter) => filter !== "") && (
                                    <button onClick={clearFilters} className="text-sm text-gray-600 hover:text-gray-800 underline">
                                        Limpar filtros
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium">{filteredProducts.length}</span> de{" "}
                                    <span className="font-medium">{products.length}</span> produtos
                                </div>
                                <button
                                    onClick={() => setShowReportModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium"
                                >
                                    <Download className="w-4 h-4" />
                                    Gerar Relatório
                                </button>
                            </div>
                        </div>
                        {showFilters && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                            Nome do Produto
                                        </label>
                                        <input
                                            type="text"
                                            value={filters.name}
                                            onChange={(e) => handleFilterChange("name", e.target.value)}
                                            placeholder="Filtrar por nome..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                            Código
                                        </label>
                                        <input
                                            type="text"
                                            value={filters.code}
                                            onChange={(e) => handleFilterChange("code", e.target.value)}
                                            placeholder="Filtrar por código..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                            Marca
                                        </label>
                                        <input
                                            type="text"
                                            value={filters.brand}
                                            onChange={(e) => handleFilterChange("brand", e.target.value)}
                                            placeholder="Filtrar por marca..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                            Descrição
                                        </label>
                                        <input
                                            type="text"
                                            value={filters.description}
                                            onChange={(e) => handleFilterChange("description", e.target.value)}
                                            placeholder="Filtrar por descrição..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                            Fornecedor
                                        </label>
                                        <input
                                            type="text"
                                            value={filters.supplier}
                                            onChange={(e) => handleFilterChange("supplier", e.target.value)}
                                            placeholder="Filtrar por fornecedor..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                            Categoria
                                        </label>
                                        <input
                                            type="text"
                                            value={filters.category}
                                            onChange={(e) => handleFilterChange("category", e.target.value)}
                                            placeholder="Filtrar por categoria..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {selectedProduct && (
                        <div className="mb-6 p-4 bg-slate-100 rounded-lg border border-slate-300">
                            <p className="text-sm font-medium text-slate-700">
                                Produto selecionado:{" "}
                                <span className="font-bold">
                                    {selectedProduct.code} - {selectedProduct.name}
                                </span>
                            </p>
                        </div>
                    )}
                    <div
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                        style={{ height: "calc(100vh - 400px)", minHeight: "500px" }}
                    >
                        <div className="overflow-x-auto h-full">
                            <table className="w-full h-full">
                                <thead className="bg-slate-800 text-white sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Código</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Nome</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Descrição</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Marca</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Fornecedor</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Categoria</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Preço</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Estoque</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Localização</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Search className="w-8 h-8 text-gray-400" />
                                                    <p className="font-medium">Nenhum produto encontrado</p>
                                                    <p className="text-sm">Tente ajustar os filtros de busca</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProducts.map((product) => (
                                            <tr
                                                key={product.id}
                                                onClick={() => handleProductClick(product)}
                                                onContextMenu={(e) => handleContextMenu(e, product)}
                                                className={`border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${selectedProduct?.id === product.id ? "bg-slate-50 border-slate-300" : ""
                                                    }`}
                                                style={{ userSelect: "none" }}
                                            >
                                                <td className="px-4 py-2">
                                                    <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-medium">
                                                        {product.code}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 font-semibold text-sm text-gray-900">{product.name}</td>
                                                <td className="px-4 py-2 text-xs text-gray-700 max-w-xs truncate">{product.description}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700">{product.brand}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700">{product.supplier}</td>
                                                <td className="px-4 py-2">
                                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                                                        {product.category}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 font-bold text-sm text-slate-800">R$ {product.price}</td>
                                                <td className="px-4 py-2 font-semibold text-sm text-gray-900">{product.quantity}</td>
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center gap-1 text-gray-600">
                                                        <MapPin className="w-3 h-3" />
                                                        <span className="text-xs">{product.location}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {contextMenu.show && (
                        <div
                            ref={contextMenuRef}
                            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
                            style={{
                                left: contextMenu.position.x,
                                top: contextMenu.position.y,
                                minWidth: "200px",
                            }}
                        >
                            <button
                                onClick={() => handleContextMenuAction("photo")}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                Visualizar Foto
                            </button>
                            <button
                                onClick={() => handleContextMenuAction("kardex")}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Warehouse className="w-4 h-4" />
                                Visualizar Kardex
                            </button>
                            <button
                                onClick={() => handleContextMenuAction("address")}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <MapPin className="w-4 h-4" />
                                Visualizar/Alterar Endereço
                            </button>
                            <button
                                onClick={() => handleContextMenuAction("report")}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <FileText className="w-4 h-4" />
                                Gerar Relatório
                            </button>
                            <hr className="my-1 border-gray-200" />
                            <button
                                onClick={() => setContextMenu({ show: false, position: { x: 0, y: 0 }, product: null })}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Fechar
                            </button>
                        </div>
                    )}
                    {showReportModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                                <div className="bg-slate-800 text-white p-6 flex items-center justify-between rounded-t-lg">
                                    <div className="flex items-center gap-3">
                                        <Settings className="w-6 h-6" />
                                        <h2 className="text-xl font-semibold">Configurar Relatório</h2>
                                    </div>
                                    <button
                                        onClick={() => setShowReportModal(false)}
                                        className="text-slate-300 hover:text-white transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Configurar Relatório</h3>
                                        <p className="text-gray-600">
                                            Selecione as informações que deseja incluir no relatório e clique em "Baixar Relatório" para gerar o
                                            PDF.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        {Object.entries(reportConfig).map(([key, value]) => {
                                            const labels: Record<string, string> = {
                                                includeCode: "Código",
                                                includeName: "Nome",
                                                includeDescription: "Descrição",
                                                includeBrand: "Marca",
                                                includeSupplier: "Fornecedor",
                                                includeCategory: "Categoria",
                                                includePrice: "Preço",
                                                includeStock: "Estoque",
                                                includeLocation: "Localização",
                                            };

                                            return (
                                                <label key={key} className="flex items-center gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={value}
                                                        onChange={(e) => setReportConfig((prev) => ({ ...prev, [key]: e.target.checked }))}
                                                        className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
                                                    />
                                                    <span className="text-gray-700 font-medium">{labels[key]}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                        <p className="text-sm text-gray-600">
                                            <strong>Produtos selecionados:</strong> {filteredProducts.length} de {products.length}
                                        </p>
                                        {Object.values(filters).some((filter) => filter !== "") && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                <strong>Filtros ativos:</strong> Os filtros aplicados serão considerados no relatório
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-4">
                                        <button
                                            onClick={() => setShowReportModal(false)}
                                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={generateReportPreview}
                                            disabled={!Object.values(reportConfig).some((v) => v)}
                                            className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Gerar Relatório
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {showKardexModal && kardexProduct && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                                <div className="bg-slate-800 text-white p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Warehouse className="w-6 h-6" />
                                        <div>
                                            <h2 className="text-xl font-semibold">Kardex do Produto</h2>
                                            <p className="text-slate-300 text-sm">{kardexProduct.code}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowKardexModal(false)}
                                        className="text-slate-300 hover:text-white transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Nome</label>
                                                <p className="text-gray-900 font-medium">{kardexProduct.name}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Descrição</label>
                                                <p className="text-gray-700">{kardexProduct.description}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Marca</label>
                                                <p className="text-gray-900 font-medium">{kardexProduct.brand}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Saldo Atual</label>
                                                <p className="text-2xl font-bold text-slate-800">{kardexProduct.quantity} unidades</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Entradas</label>
                                                    <p className="text-lg font-semibold text-emerald-600">
                                                        {kardexMovements
                                                            .filter((entry) => entry.type === "entrada")
                                                            .reduce((sum, entry) => sum + entry.quantity, 0)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Saídas</label>
                                                    <p className="text-lg font-semibold text-red-600">
                                                        {kardexMovements
                                                            .filter((entry) => entry.type === "saida")
                                                            .reduce((sum, entry) => sum + entry.quantity, 0)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Previsões</label>
                                                <p className="text-lg font-semibold text-amber-600">
                                                    {kardexMovements
                                                        .filter((entry) => entry.type === "previsao")
                                                        .reduce((sum, entry) => sum + entry.quantity, 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Movimentações</h3>
                                        {loadingKardex ? (
                                            <div className="flex justify-center items-center h-32">
                                                <p>Carregando movimentações...</p>
                                            </div>
                                        ) : kardexMovements.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">Data</th>
                                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">Tipo</th>
                                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">Quantidade</th>
                                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">NF</th>
                                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">Saldo</th>
                                                            <th></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {kardexMovements.map((entry, index) => (
                                                            <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                                                                <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                                                                    {new Date(entry.date).toLocaleDateString("pt-BR")}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        {getKardexIcon(entry.type)}
                                                                        <span className={`text-xs px-2 py-1 rounded-full border font-semibold uppercase ${getKardexTypeColor(entry.type)}`}>
                                                                            {entry.type}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{entry.quantity}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-700">{entry.nfNumber}</td>
                                                                <td className="px-4 py-3 text-sm font-bold text-slate-800">{entry.quantity}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-gray-600">Nenhuma movimentação encontrada.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setShowKardexModal(false)}
                                            className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium"
                                        >
                                            Fechar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Dashboard>
    );
}