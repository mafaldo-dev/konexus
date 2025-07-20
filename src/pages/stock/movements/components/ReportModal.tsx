import React from 'react';
import { Settings, X } from 'lucide-react';
import { ReportConfig } from '../movementsType';

interface ReportModalProps {
    show: boolean;
    closeModal: () => void;
    reportConfig: ReportConfig;
    handleReportConfigChange: (field: keyof ReportConfig, value: boolean) => void;
    generateReportPreview: () => void;
    filteredProductsCount: number;
    totalProductsCount: number;
    filtersApplied: boolean;
}

const ReportModal: React.FC<ReportModalProps> = ({
    show,
    closeModal,
    reportConfig,
    handleReportConfigChange,
    generateReportPreview,
    filteredProductsCount,
    totalProductsCount,
    filtersApplied,
}) => {
    if (!show) return null;

    const labels: Record<string, string> = {
        includeCode: 'Código',
        includeName: 'Nome',
        includeDescription: 'Descrição',
        includeBrand: 'Marca',
        includeSupplier: 'Fornecedor',
        includeCategory: 'Categoria',
        includePrice: 'Preço',
        includeStock: 'Estoque',
        includeLocation: 'Localização',
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div className="bg-slate-800 text-white p-6 flex items-center justify-between rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <Settings className="w-6 h-6" />
                        <h2 className="text-xl font-semibold">Configurar Relatório</h2>
                    </div>
                    <button onClick={closeModal} className="text-slate-300 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Configurar Relatório</h3>
                        <p className="text-gray-600">
                            Selecione as informações que deseja incluir no relatório e clique em "Gerar Relatório" para gerar o PDF.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {Object.entries(reportConfig).map(([key, value]) => (
                            <label key={key} className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={value}
                                    onChange={(e) => handleReportConfigChange(key as keyof ReportConfig, e.target.checked)}
                                    className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
                                />
                                <span className="text-gray-700 font-medium">{labels[key]}</span>
                            </label>
                        ))}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <p className="text-sm text-gray-600">
                            <strong>Produtos selecionados:</strong> {filteredProductsCount} de {totalProductsCount}
                        </p>
                        {filtersApplied && (
                            <p className="text-sm text-gray-600 mt-1">
                                <strong>Filtros ativos:</strong> Os filtros aplicados serão considerados no relatório
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end gap-4">
                        <button
                            onClick={closeModal}
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
    );
};

export default ReportModal;
