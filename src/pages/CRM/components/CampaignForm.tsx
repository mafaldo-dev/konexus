import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { format } from 'date-fns';
import { Campaign } from '../../../service/interfaces';

interface CampaignFormProps {
  campaign: Campaign | null;
  onSubmit: (data: Campaign) => void;
  onCancel: () => void;
}

const CampaignForm: React.FC<CampaignFormProps> = ({ campaign, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Campaign>>({});

  useEffect(() => {
    setFormData(
      campaign || {
        name: "",
        type: "Email",
        startDate: new Date(),
        endDate: new Date(),
        status: "Planejada",
        targetAudience: "",
        budget: 0,
        description: "",
      }
    );
  }, [campaign]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === "budget" ? parseFloat(value) : value }));
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: new Date(value) }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as Campaign);
  };

  const campaignTypes = ["Email", "SMS", "Telefone", "Rede Social", "Outro"];
  const campaignStatuses = ["Planejada", "Ativa", "Concluída", "Cancelada"];

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-8">
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl rounded-lg">
        <header className="flex justify-between items-center border-b border-slate-200/60 p-4">
          <h2 className="text-slate-900 font-semibold">{campaign ? "Editar Campanha" : "Nova Campanha"}</h2>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-slate-200 transition"
            aria-label="Fechar formulário"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </header>
        <section className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Nome da Campanha *
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="type" className="block text-sm font-medium text-slate-700">
                  Tipo *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={(e) => handleSelectChange("type", e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {campaignTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">
                  Data de Início *
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate ? format(new Date(formData.startDate), "yyyy-MM-dd") : ""}
                  onChange={(e) => handleDateChange("startDate", e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">
                  Data de Término *
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate ? format(new Date(formData.endDate), "yyyy-MM-dd") : ""}
                  onChange={(e) => handleDateChange("endDate", e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="status" className="block text-sm font-medium text-slate-700">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={(e) => handleSelectChange("status", e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {campaignStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="targetAudience" className="block text-sm font-medium text-slate-700">
                  Público Alvo
                </label>
                <input
                  id="targetAudience"
                  name="targetAudience"
                  value={formData.targetAudience || ""}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="budget" className="block text-sm font-medium text-slate-700">
                  Orçamento (R$)
                </label>
                <input
                  id="budget"
                  name="budget"
                  type="number"
                  value={formData.budget || 0}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                Descrição
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                className="w-full h-24 border border-slate-300 rounded px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="border border-slate-400 px-4 py-2 rounded hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {campaign ? "Atualizar" : "Criar"} Campanha
              </button>
            </div>
          </form>
        </section>
      </div>
    </motion.div>
  );
};

export default CampaignForm;
