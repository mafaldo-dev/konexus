import type React from "react";

import { useState, useEffect, useMemo } from "react";
import { ContextMenuPosition, FilterState, ReportConfig } from "./movementsType";
import { handleAllProducts } from "../../../service/api/Administrador/products";
import { Products } from "../../../service/interfaces/stock/products";
import { Movement } from "../../../service/interfaces/stock/movements";
import { handlekardexMoviment } from "../../../service/api/Administrador/kardex";


import Dashboard from "../../../components/dashboard/Dashboard";
import Header from "./components/Header";
import FilterBar from "./components/FilterBar";
import ProductTable from "./components/ProductTable";
import ContextMenu from "./components/ContextMenu";
import ReportModal from "./components/ReportModal";
import ReportPreview from "./components/ReportPreview";
import KardexModal from "./components/KardexModal";

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
    const [showReportPreview, setShowReportPreview] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);

    const getProducts = async () => {
        try {
            const response = await handleAllProducts();
            setProducts(response);
        } catch (error) {
            console.error("Erro ao recuperar a lista de produtos!", error);
            throw new Error("Erro interno do servidor");
        }
    };

    const openKardexModal = async (product: Products) => {
        setLoadingKardex(true);
        console.log(product)
        try {
            const movements = await handlekardexMoviment(product.id);
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
    const isElectron = typeof (window as any).require !== 'undefined';
    
    if (isElectron) {
        const { ipcRenderer } = (window as any).require('electron');
        
        const handleShortcut = () => {
            if (selectedProduct) {
                openKardexModal(selectedProduct);
            }
        };
        
        ipcRenderer.on('shortcut:f4', handleShortcut);
        
        return () => {
            ipcRenderer.removeListener('shortcut:f4', handleShortcut);
        };
    } else {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "F4" && selectedProduct) {
                e.preventDefault();
                openKardexModal(selectedProduct);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown); 
    }
}, [selectedProduct, openKardexModal]);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            return (
                product.name.toLowerCase().includes(filters.name.toLowerCase()) &&
                product.code.toLowerCase().includes(filters.code.toLowerCase()) &&
                (product.brand?.toLowerCase() || '').includes(filters.brand.toLowerCase()) &&
                product.description.toLowerCase().includes(filters.description.toLowerCase()) &&
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
        getProducts();
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
            if (reportConfig.includeSupplier) row.Fornecedor = product.supplier_id;
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

    if (showReportPreview) {
        return <ReportPreview reportData={reportData} closePreview={() => setShowReportPreview(false)} downloadReport={downloadReport} />;
    }

    return (
        <Dashboard>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-[1300px] mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Produtos</h1>
                        <p className="text-gray-600 font-medium">
                            Clique para selecionar • Botão direito para opções • F4 para kardex
                        </p>
                    </div>
                    <Header
                        showFilters={showFilters}
                        toggleFilters={() => setShowFilters(!showFilters)}
                        clearFilters={clearFilters}
                        filteredProductsCount={filteredProducts.length}
                        totalProductsCount={products.length}
                        openReportModal={() => setShowReportModal(true)}
                        filtersApplied={Object.values(filters).some((filter) => filter !== "")}
                    />
                    {showFilters && <FilterBar filters={filters} handleFilterChange={handleFilterChange} />}
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
                    <ProductTable
                        products={filteredProducts}
                        selectedProduct={selectedProduct}
                        handleProductClick={handleProductClick}
                        handleContextMenu={handleContextMenu}
                    />
                    <ContextMenu
                        show={contextMenu.show}
                        position={contextMenu.position}
                        product={contextMenu.product}
                        handleContextMenuAction={handleContextMenuAction}
                        closeContextMenu={() => setContextMenu({ show: false, position: { x: 0, y: 0 }, product: null })}
                    />
                    <ReportModal
                        show={showReportModal}
                        closeModal={() => setShowReportModal(false)}
                        reportConfig={reportConfig}
                        handleReportConfigChange={(field, value) => setReportConfig((prev) => ({ ...prev, [field]: value }))}
                        generateReportPreview={generateReportPreview}
                        filteredProductsCount={filteredProducts.length}
                        totalProductsCount={products.length}
                        filtersApplied={Object.values(filters).some((filter) => filter !== "")}
                    />
                    <KardexModal
                        show={showKardexModal}
                        closeModal={() => setShowKardexModal(false)}
                        product={kardexProduct}
                        movements={kardexMovements}
                        loading={loadingKardex}
                    />
                </div>
            </div>
        </Dashboard>
    );
}
