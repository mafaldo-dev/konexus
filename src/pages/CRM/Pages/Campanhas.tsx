import React, { useState, useEffect } from "react";
import { Plus, X, Save, Edit, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

import { addCampaign, getCampaigns } from "../../../service/api/campaigns";
import { Campaign } from "../../../service/interfaces";

const CampaignForm: React.FC<{ campaign: Campaign | null; onSubmit: (data: Campaign) => void; onCancel: () => void }> = ({
  campaign: initialCampaign,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<Campaign>>(
    initialCampaign || {
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

  useEffect(() => {
    setFormData(
      initialCampaign || {
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
  }, [initialCampaign]);

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
          <h2 className="text-slate-900 font-semibold">{initialCampaign ? "Editar Campanha" : "Nova Campanha"}</h2>
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
              {/* Nome */}
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
              {/* Tipo */}
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
              {/* Data de Início */}
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
              {/* Data de Término */}
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
              {/* Status */}
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
              {/* Público Alvo */}
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
              {/* Orçamento */}
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
            {/* Descrição */}
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
            {/* Botões */}
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
                {initialCampaign ? "Atualizar" : "Criar"} Campanha
              </button>
            </div>
          </form>
        </section>
      </div>
    </motion.div>
  );
};

// Main Campaigns Component
export default function Campains() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [filters, setFilters] = useState<{ status: string }>({ status: "all" });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const data: Campaign[] = await getCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error("Erro ao carregar campanhas:", error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (campaignData: Campaign): Promise<void> => {
    try {
      if (editingCampaign) {
        // Implement updateCampaign later
        console.log("Update functionality for campaigns not yet implemented.");
      } else {
        await addCampaign({ ...campaignData, createdAt: new Date() });
      }
      setShowForm(false);
      setEditingCampaign(null);
      loadCampaigns();
    } catch (error) {
      console.error("Erro ao salvar campanha:", error);
    }
  };

  const handleEdit = (campaign: Campaign): void => {
    setEditingCampaign(campaign);
    setShowForm(true);
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    return filters.status === "all" || campaign.status === filters.status;
  });

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Campanhas</h1>
            <p className="text-slate-600">Gerencie suas campanhas de marketing e vendas</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition"
          >
            <Plus className="w-5 h-5" />
            Nova Campanha
          </button>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <CampaignForm
              campaign={editingCampaign}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingCampaign(null);
              }}
            />
          )}
        </AnimatePresence>

        {/* Filter */}
        <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-lg mb-6 p-4 rounded-lg flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filtros:</span>
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
            className="w-44 border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="Planejada">Planejada</option>
            <option value="Ativa">Ativa</option>
            <option value="Concluída">Concluída</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-lg p-4 rounded-lg animate-pulse"
                  style={{ minHeight: "140px" }}
                >
                  <div className="h-6 w-3/4 mb-4 bg-gray-300 rounded" />
                  <div className="h-4 w-1/2 mb-2 bg-gray-300 rounded" />
                  <div className="h-4 w-full bg-gray-300 rounded" />
                </div>
              ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <p className="text-center text-slate-500">Nenhuma campanha encontrada.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCampaigns.map((campaign) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg"
              >
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-slate-900 text-sm leading-tight">{campaign.name}</h4>
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() => handleEdit(campaign)}
                        className="p-1 rounded hover:bg-slate-200 transition"
                        aria-label={`Editar campanha ${campaign.name}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {/* Dropdown menu can be implemented here if needed */}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <p>Tipo: {campaign.type}</p>
                    <p>Público Alvo: {campaign.targetAudience}</p>
                    <p>Início: {format(new Date(campaign.startDate), "dd/MM/yyyy")}</p>
                    <p>Término: {format(new Date(campaign.endDate), "dd/MM/yyyy")}</p>
                    <p>Orçamento: R$ {campaign.budget?.toFixed(2)}</p>
                  </div>

                  <span className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {campaign.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
