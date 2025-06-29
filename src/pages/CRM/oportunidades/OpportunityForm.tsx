import React, { useState, ChangeEvent, FormEvent } from "react";
import { X, Save } from "lucide-react";
import { motion } from "framer-motion";

type Stage =
  | "prospecting"
  | "qualification"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

interface Opportunity {
  id?: string | number;
  title: string;
  contact_name: string;
  contact_email: string;
  company?: string;
  value: number | "";
  stage: Stage;
  probability: number;
  expected_close_date?: string;
  description?: string;
  notes?: string;
}

interface OpportunityFormProps {
  opportunity?: Opportunity;
  onSubmit: (data: Opportunity) => void;
  onCancel: () => void;
}

const stages = [
  { value: "prospecting", label: "Prospecção" },
  { value: "qualification", label: "Qualificação" },
  { value: "proposal", label: "Proposta" },
  { value: "negotiation", label: "Negociação" },
  { value: "closed_won", label: "Fechado - Ganho" },
  { value: "closed_lost", label: "Fechado - Perdido" },
];

export default function OpportunityForm({
  opportunity,
  onSubmit,
  onCancel,
}: OpportunityFormProps) {
  const [formData, setFormData] = useState<Opportunity>({
    title: opportunity?.title || "",
    contact_name: opportunity?.contact_name || "",
    contact_email: opportunity?.contact_email || "",
    company: opportunity?.company || "",
    value: opportunity?.value ?? "",
    stage: opportunity?.stage || "prospecting",
    probability: opportunity?.probability || 10,
    expected_close_date: opportunity?.expected_close_date || "",
    description: opportunity?.description || "",
    notes: opportunity?.notes || "",
  });

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    let val: any = value;

    if (type === "number") {
      val = value === "" ? "" : Number(value);
    }
    setFormData((prev) => ({ ...prev, [name]: val }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(formData);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8"
    >
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl rounded-md">
        <header className="border-b border-slate-200/60 p-4 flex justify-between items-center">
          <h2 className="text-slate-900 text-lg font-semibold">
            {opportunity ? "Editar Oportunidade" : "Nova Oportunidade"}
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
            <div className="flex flex-col">
              <label htmlFor="title" className="mb-1 font-medium text-slate-700">
                Título *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="value" className="mb-1 font-medium text-slate-700">
                Valor (R$) *
              </label>
              <input
                type="number"
                id="value"
                name="value"
                value={formData.value}
                onChange={handleChange}
                required
                className="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={0}
                step="0.01"
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="contact_name"
                className="mb-1 font-medium text-slate-700"
              >
                Nome do Contato *
              </label>
              <input
                type="text"
                id="contact_name"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                required
                className="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="contact_email"
                className="mb-1 font-medium text-slate-700"
              >
                Email do Contato *
              </label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                required
                className="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="company" className="mb-1 font-medium text-slate-700">
                Empresa
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="stage" className="mb-1 font-medium text-slate-700">
                Estágio
              </label>
              <select
                id="stage"
                name="stage"
                value={formData.stage}
                onChange={handleChange}
                className="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {stages.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="probability"
                className="mb-1 font-medium text-slate-700"
              >
                Probabilidade (%)
              </label>
              <input
                type="number"
                id="probability"
                name="probability"
                min={0}
                max={100}
                value={formData.probability}
                onChange={handleChange}
                className="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="expected_close_date"
                className="mb-1 font-medium text-slate-700"
              >
                Data Esperada de Fechamento
              </label>
              <input
                type="date"
                id="expected_close_date"
                name="expected_close_date"
                value={formData.expected_close_date}
                onChange={handleChange}
                className="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label htmlFor="description" className="mb-1 font-medium text-slate-700">
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              className="border border-slate-300 rounded px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="notes" className="mb-1 font-medium text-slate-700">
              Anotações
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={6}
              className="border border-slate-300 rounded px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-300 rounded hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              <Save className="w-4 h-4 mr-2" />
              {opportunity ? "Atualizar" : "Criar"} Oportunidade
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
