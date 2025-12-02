import React from 'react';
import { Filter } from 'lucide-react';
import { format } from 'date-fns';
import { FilterState } from '../../../service/interfaces/financial/paymentAccounts';
import { formatCurrency } from '../../../utils/formatters';


interface ActiveFiltersProps {
  activeFilters: FilterState;
  setActiveFilters: (filters: FilterState) => void;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({ 
  activeFilters, 
  setActiveFilters 
}) => {
  const hasActiveFilters = Object.values(activeFilters).some(
    (filter: any) => filter !== '' && filter !== null
  );

  if (!hasActiveFilters) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Filtros Ativos:</span>
          <div className="flex gap-2">
            {activeFilters.status && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                Status: {activeFilters.status}
              </span>
            )}
            {activeFilters.startDate && activeFilters.endDate && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                Período: {format(new Date(activeFilters.startDate), 'dd/MM/yyyy')} - {format(new Date(activeFilters.endDate), 'dd/MM/yyyy')}
              </span>
            )}
            {activeFilters.minValue && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                Valor mínimo: {formatCurrency(parseFloat(activeFilters.minValue))}
              </span>
            )}
            {activeFilters.maxValue && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                Valor máximo: {formatCurrency(parseFloat(activeFilters.maxValue))}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setActiveFilters({
            status: '',
            startDate: '',
            endDate: '',
            minValue: '',
            maxValue: ''
          })}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};