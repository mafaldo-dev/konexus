import React, { useState } from "react";
import { Filter } from "lucide-react";

type LeadStatus = "all" | "new" | "contacted" | "qualified" | "converted" | "lost";
type LeadSource =
  | "all"
  | "website"
  | "social_media"
  | "referral"
  | "cold_call"
  | "event"
  | "advertisement"
  | "other";

interface Filters {
  status: LeadStatus;
  source: LeadSource;
}

interface LeadFiltersProps {
  onFilterChange: (filters: Filters) => void;
}

export default function LeadFilters({ onFilterChange }: LeadFiltersProps) {
  const [filters, setFilters] = useState<Filters>({ status: "all", source: "all" });

  const handleFilterChange = (type: keyof Filters, value: string) => {
    const newFilters = { ...filters, [type]: value } as Filters;
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-lg mb-6 rounded-lg p-4 max-w-full">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Filtros:</span>
        </div>

        <select
          className="w-40 border border-slate-200 rounded px-3 py-1 text-slate-700"
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
        >
          <option value="all">Todos os Status</option>
          <option value="new">Novo</option>
          <option value="contacted">Contatado</option>
          <option value="qualified">Qualificado</option>
          <option value="converted">Convertido</option>
          <option value="lost">Perdido</option>
        </select>

        <select
          className="w-40 border border-slate-200 rounded px-3 py-1 text-slate-700"
          value={filters.source}
          onChange={(e) => handleFilterChange("source", e.target.value)}
        >
          <option value="all">Todas as Origens</option>
          <option value="website">Website</option>
          <option value="social_media">Redes Sociais</option>
          <option value="referral">Indicação</option>
          <option value="cold_call">Cold Call</option>
          <option value="event">Evento</option>
          <option value="advertisement">Propaganda</option>
          <option value="other">Outros</option>
        </select>
      </div>
    </div>
  );
}
