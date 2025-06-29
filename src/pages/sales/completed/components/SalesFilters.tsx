import React from "react";
import { Search } from "lucide-react";

interface Props {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedSalesperson: string;
  setSelectedSalesperson: (value: string) => void;
  dateRange: string;
  setDateRange: (value: string) => void;
  salespeople: string[];
}

const SalesFilters: React.FC<Props> = ({
  searchTerm,
  setSearchTerm,
  selectedSalesperson,
  setSelectedSalesperson,
  dateRange,
  setDateRange,
  salespeople,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 shadow-lg mb-6 bg-white p-6">
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        {/* Input de busca */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por cliente, número do pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-3 flex-wrap w-full lg:w-auto">
          {/* Vendedores */}
          <select
            value={selectedSalesperson}
            onChange={(e) => setSelectedSalesperson(e.target.value)}
            className="w-48 px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          >
            <option value="all">Todos os vendedores</option>
            {salespeople.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {/* Intervalo de datas */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-40 px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          >
            <option value="all">Todo período</option>
            <option value="today">Hoje</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
            <option value="quarter">Este trimestre</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SalesFilters;
