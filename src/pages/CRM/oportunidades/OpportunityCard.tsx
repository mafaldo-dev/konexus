import  { useState, useRef, useEffect } from "react";
import { Building, Mail, Calendar, Edit, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const stages = [
  { value: "prospecting", label: "Prospecção" },
  { value: "qualification", label: "Qualificação" },
  { value: "proposal", label: "Proposta" },
  { value: "negotiation", label: "Negociação" },
  { value: "closed_won", label: "Fechado - Ganho" },
  { value: "closed_lost", label: "Fechado - Perdido" },
];

export default function OpportunityCard({ opportunity, onEdit, onStageChange }: any) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }} className="bg-white border border-slate-200 shadow-sm hover:shadow-md rounded-md transition-all duration-200 p-4">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-slate-900 text-sm leading-tight">{opportunity.title}</h4>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Menu de opções"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-10">
              <button
                onClick={() => {
                  onEdit(opportunity);
                  setDropdownOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              >
                Editar
              </button>
              <div className="border-t border-gray-200" />
              {stages.map((stage) => (
                <button
                  key={stage.value}
                  onClick={() => {
                    onStageChange(opportunity.id, stage.value);
                    setDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Mover para {stage.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 text-xs text-slate-600 mt-3">
        <div className="flex items-center gap-1">
          <Mail className="w-3 h-3" />
          <span>{opportunity.contact_name}</span>
        </div>

        {opportunity.company && (
          <div className="flex items-center gap-1">
            <Building className="w-3 h-3" />
            <span>{opportunity.company}</span>
          </div>
        )}

        {opportunity.expected_close_date && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(opportunity.expected_close_date), "dd/MM/yyyy")}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="font-semibold text-slate-900">
          R$ {(opportunity.value || 0).toLocaleString("pt-BR")}
        </div>
        <div className="flex items-center gap-1 border border-green-600 text-green-600 text-xs px-2 py-1 rounded">
          <TrendingUp className="w-3 h-3" />
          {opportunity.probability}%
        </div>
      </div>
    </motion.div>
  );
}
