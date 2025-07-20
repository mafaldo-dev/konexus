import React from 'react';
import { FilterState } from '../movementsType';

interface FilterBarProps {
    filters: FilterState;
    handleFilterChange: (field: keyof FilterState, value: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, handleFilterChange }) => {
    return (
        <div className="mt-6 mb-6 w-full pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                        Nome do Produto
                    </label>
                    <input
                        type="text"
                        value={filters.name}
                        onChange={(e) => handleFilterChange('name', e.target.value)}
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
                        onChange={(e) => handleFilterChange('code', e.target.value)}
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
                        onChange={(e) => handleFilterChange('brand', e.target.value)}
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
                        onChange={(e) => handleFilterChange('description', e.target.value)}
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
                        onChange={(e) => handleFilterChange('supplier', e.target.value)}
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
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        placeholder="Filtrar por categoria..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    />
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
