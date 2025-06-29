import React, { useState } from "react";
import { Filter } from "lucide-react";

type Stage =
  | "all"
  | "prospecting"
  | "qualification"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

interface OpportunityFiltersProps {
  onFilterChange: (filters: { stage: Stage }) => void;
}

export default function OpportunityFilters({ onFilterChange }: OpportunityFiltersProps) {
  const [filters, setFilters] = useState<{ stage: Stage }>({ stage: "all" });

  const handleFilterChange = (type: keyof typeof filters, value: Stage) => {
    const newFilters = { ...filters, [type]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-lg mb-6 rounded-md p-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Filtros:</span>
        </div>

        <select
          value={filters.stage}
          onChange={(e) => handleFilterChange("stage", e.target.value as Stage)}
          className="w-44 border border-slate-200 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos os Estágios</option>
          <option value="prospecting">Prospecção</option>
          <option value="qualification">Qualificação</option>
          <option value="proposal">Proposta</option>
          <option value="negotiation">Negociação</option>
          <option value="closed_won">Fechado - Ganho</option>
          <option value="closed_lost">Fechado - Perdido</option>
        </select>
      </div>
    </div>
  );
}
