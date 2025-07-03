import { useState, FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { OpportunityData } from "../../../service/interfaces";

type Stage = "prospecting" | "qualification" | "proposal" | "negotiation";

interface Lead {
  name: string;
  email: string;
  company?: string;
  estimated_value?: number;
}

interface ConvertModalProps {
  lead: Lead | null;
  onConvert: (data: OpportunityData) => void;
  onCancel: () => void;
}

const stages: { value: Stage; label: string }[] = [
  { value: "prospecting", label: "Prospecção" },
  { value: "qualification", label: "Qualificação" },
  { value: "proposal", label: "Proposta" },
  { value: "negotiation", label: "Negociação" },
];

export default function ConvertModal({ lead, onConvert, onCancel }: ConvertModalProps) {
  const [opportunityData, setOpportunityData] = useState<OpportunityData>({
    title: lead ? `Oportunidade - ${lead.name}` : "",
    value: lead?.estimated_value ?? "",
    stage: "prospecting",
    probability: 10,
    expected_close_date: "",
    description: "",
    notes: "",
  });

  if (!lead) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onConvert(opportunityData);
  };

  const handleChange = (field: keyof OpportunityData, value: string | number) => {
    setOpportunityData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-2 mb-4">
          <ArrowRight className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold">Converter Lead em Oportunidade</h2>
          <button
            onClick={onCancel}
            aria-label="Fechar"
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium text-gray-900 mb-1">Informações do Lead</h3>
            <p className="text-sm text-gray-600">{lead.name} • {lead.email}</p>
            {lead.company && <p className="text-sm text-gray-600">{lead.company}</p>}
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="title" className="font-medium text-gray-700">Título da Oportunidade *</label>
              <input
                id="title"
                type="text"
                required
                value={opportunityData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="value" className="font-medium text-gray-700">Valor (R$) *</label>
              <input
                id="value"
                type="number"
                required
                value={opportunityData.value}
                onChange={(e) => handleChange("value", e.target.value === "" ? "" : parseFloat(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="stage" className="font-medium text-gray-700">Estágio</label>
              <select
                id="stage"
                value={opportunityData.stage}
                onChange={(e) => handleChange("stage", e.target.value as Stage)}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {stages.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="probability" className="font-medium text-gray-700">Probabilidade (%)</label>
              <input
                id="probability"
                type="number"
                min={0}
                max={100}
                value={opportunityData.probability}
                onChange={(e) => handleChange("probability", parseInt(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex flex-col space-y-1 md:col-span-2">
              <label htmlFor="expected_close_date" className="font-medium text-gray-700">Data Esperada de Fechamento</label>
              <input
                id="expected_close_date"
                type="date"
                value={opportunityData.expected_close_date}
                onChange={(e) => handleChange("expected_close_date", e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label htmlFor="description" className="font-medium text-gray-700">Descrição</label>
            <textarea
              id="description"
              value={opportunityData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Converter em Oportunidade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
