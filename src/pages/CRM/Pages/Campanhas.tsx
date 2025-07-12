import React from "react";
import { Plus, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCampaigns } from "../../../hooks/_crm/useCampaigns";
import CampaignForm from "../components/CampaignForm";
import CampaignCard from "../components/CampaignCard";

export default function Campains() {
  const {
    campaigns,
    isLoading,
    showForm,
    editingCampaign,
    handleSubmit,
    handleEdit,
    handleCancel,
    handleFilterChange,
    setShowForm,
  } = useCampaigns();

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
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

        <AnimatePresence>
          {showForm && (
            <CampaignForm
              campaign={editingCampaign}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          )}
        </AnimatePresence>

        <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-lg mb-6 p-4 rounded-lg flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filtros:</span>
          </div>
          <select
            onChange={(e) => handleFilterChange({ status: e.target.value })}
            className="w-44 border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="Planejada">Planejada</option>
            <option value="Ativa">Ativa</option>
            <option value="Concluída">Concluída</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>

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
        ) : campaigns.length === 0 ? (
          <p className="text-center text-slate-500">Nenhuma campanha encontrada.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} onEdit={handleEdit} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
