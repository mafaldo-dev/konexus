import React from 'react';
import { Filter, Download } from 'lucide-react';

interface HeaderProps {
    showFilters: boolean;
    toggleFilters: () => void;
    clearFilters: () => void;
    filteredProductsCount: number;
    totalProductsCount: number;
    openReportModal: () => void;
    filtersApplied: boolean;
}

const Header: React.FC<HeaderProps> = ({
    showFilters,
    toggleFilters,
    clearFilters,
    filteredProductsCount,
    totalProductsCount,
    openReportModal,
    filtersApplied,
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleFilters}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            showFilters ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <Filter className="w-4 h-4" />
                        Filtros
                    </button>
                    {filtersApplied && (
                        <button onClick={clearFilters} className="text-sm text-gray-600 hover:text-gray-800 underline">
                            Limpar filtros
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">{filteredProductsCount}</span> de{' '}
                        <span className="font-medium">{totalProductsCount}</span> produtos
                    </div>
                    <button
                        onClick={openReportModal}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Gerar Relatório
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Header;
