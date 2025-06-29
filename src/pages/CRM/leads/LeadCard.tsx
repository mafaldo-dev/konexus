import React from "react";
import { Building, Mail, Phone, Star, Edit, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Lead } from "../../../service/interfaces/leads";

// Apenas valores válidos para status do Lead
type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

const statusColors: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  contacted: "bg-purple-100 text-purple-800 border-purple-200",
  qualified: "bg-green-100 text-green-800 border-green-200",
  converted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  lost: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels: Record<LeadStatus, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  converted: "Convertido",
  lost: "Não Qualificado",
};

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
}

export default function LeadCard({ lead, onEdit, onConvert }: LeadCardProps) {
  const currentStatus = lead.status as LeadStatus;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg p-4">
        <header className="pb-3 flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">{lead.name}</h3>
            <div className="flex items-center gap-1 text-slate-600 text-sm mt-1">
              <Mail className="w-3 h-3" />
              {lead.email}
            </div>
          </div>
          <span
            className={`border rounded px-2 py-0.5 text-xs font-medium ${statusColors[currentStatus]}`}
          >
            {statusLabels[currentStatus]}
          </span>
        </header>

        <div className="space-y-3">
          {lead.company && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Building className="w-4 h-4" />
              <span>{lead.company}</span>
              {lead.position && <span className="text-slate-400">• {lead.position}</span>}
            </div>
          )}

          {lead.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-4 h-4" />
              <span>{lead.phone}</span>
            </div>
          )}

          {lead.score !== undefined && lead.score > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-slate-600">Pontuação: {lead.score}/100</span>
            </div>
          )}

          {lead.estimated_value !== undefined && lead.estimated_value !== "" && (
            <div className="text-sm font-medium text-green-600">
              Valor Est.: R$ {Number(lead.estimated_value).toLocaleString("pt-BR")}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => onEdit(lead)}
              className="flex-1 border border-gray-300 rounded px-3 py-1 text-sm hover:bg-blue-50 hover:border-blue-300 flex items-center justify-center gap-1"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>

            {(currentStatus !== "converted" && currentStatus !== "lost") && (
              <button
                type="button"
                onClick={() => onConvert(lead)}
                className="flex-1 bg-green-600 text-white rounded px-3 py-1 text-sm hover:bg-green-700 flex items-center justify-center gap-1"
              >
                <ArrowRight className="w-4 h-4" />
                Converter
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
