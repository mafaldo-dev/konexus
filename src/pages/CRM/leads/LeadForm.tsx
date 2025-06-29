import React, { useState, ChangeEvent, FormEvent } from "react";
import { X, Save } from "lucide-react";
import { motion } from "framer-motion";
import { Lead } from "../../../service/interfaces/leads";

type LeadSource =
  | "website"
  | "social_media"
  | "referral"
  | "cold_call"
  | "event"
  | "advertisement"
  | "other";

interface LeadFormProps {
  lead?: Lead;
  onSubmit: (data: Lead) => void;
  onCancel: () => void;
}

const sources: { value: LeadSource; label: string }[] = [
  { value: "website", label: "Website" },
  { value: "social_media", label: "Redes Sociais" },
  { value: "referral", label: "Indicação" },
  { value: "cold_call", label: "Cold Call" },
  { value: "event", label: "Evento" },
  { value: "advertisement", label: "Propaganda" },
  { value: "other", label: "Outros" }
];

const statuses: { value: string; label: string }[] = [
  { value: "new", label: "Novo" },
  { value: "contacted", label: "Contatado" },
  { value: "qualified", label: "Qualificado" },
  { value: "converted", label: "Convertido" },
  { value: "lost", label: "Perdido" }
];

export default function LeadForm({ lead, onSubmit, onCancel }: LeadFormProps) {
  const [formData, setFormData] = useState<Lead>(
    lead || {
      name: "",
      email: "",
      phone: "",
      company: "",
      position: "",
      source: "website" as LeadSource,
      status: "new",
      score: 0,
      notes: "",
      estimated_value: "",
      last_contact: ""
    }
  );

  const handleChange = (
    field: keyof Lead,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value, type } = e.target;
    let val: string | number = value;

    if (type === "number") {
      val = value === "" ? "" : Number(value);
    }

    handleChange(id as keyof Lead, val);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8"
    >
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl rounded-lg max-w-4xl mx-auto">
        <header className="flex justify-between items-center p-6 border-b border-slate-200/60">
          <h2 className="text-slate-900 text-xl font-semibold">
            {lead ? "Editar Lead" : "Novo Lead"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-600 hover:text-slate-900"
            aria-label="Cancelar"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                Nome *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Telefone */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="phone" className="text-sm font-medium text-slate-700">
                Telefone
              </label>
              <input
                id="phone"
                type="text"
                value={formData.phone}
                onChange={handleInputChange}
                className="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Empresa */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="company" className="text-sm font-medium text-slate-700">
                Empresa
              </label>
              <input
                id="company"
                type="text"
                value={formData.company}
                onChange={handleInputChange}
                className="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Cargo */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="position" className="text-sm font-medium text-slate-700">
                Cargo
              </label>
              <input
                id="position"
                type="text"
                value={formData.position}
                onChange={handleInputChange}
                className="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Origem */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="source" className="text-sm font-medium text-slate-700">
                Origem
              </label>
              <select
                id="source"
                value={formData.source}
                onChange={handleInputChange}
                className="border border-slate-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sources.map((source) => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="status" className="text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={handleInputChange}
                className="border border-slate-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Pontuação */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="score" className="text-sm font-medium text-slate-700">
                Pontuação (0-100)
              </label>
              <input
                id="score"
                type="number"
                min={0}
                max={100}
                value={formData.score}
                onChange={handleInputChange}
                className="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Valor Estimado */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="estimated_value" className="text-sm font-medium text-slate-700">
                Valor Estimado
              </label>
              <input
                id="estimated_value"
                type="number"
                value={formData.estimated_value || ""}
                onChange={handleInputChange}
                className="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Último Contato */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="last_contact" className="text-sm font-medium text-slate-700">
                Último Contato
              </label>
              <input
                id="last_contact"
                type="date"
                value={formData.last_contact || ""}
                onChange={handleInputChange}
                className="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="flex flex-col space-y-1">
            <label htmlFor="notes" className="text-sm font-medium text-slate-700">
              Anotações
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="border border-slate-300 rounded px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="border border-slate-300 px-4 py-2 rounded hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {lead ? "Atualizar" : "Criar"} Lead
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
