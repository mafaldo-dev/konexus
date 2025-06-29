import React, { useState, useEffect } from "react";
import { Users, Target, TrendingUp, DollarSign, Megaphone } from "lucide-react";
import { motion } from "framer-motion";

// Importações das APIs e Interfaces
import { getLeads } from "../../../service/api/leads";
import { getAllOpportunities } from "../../../service/api/opportunities";
import { getCampaigns } from "../../../service/api/campaigns"; // Assumindo que esta função existe
import { Lead } from "../../../service/interfaces/leads";
import { Opportunity } from "../../../service/interfaces/opportunities";
import { Campaign } from "../../../service/interfaces/campaigns"; // Assumindo que esta interface existe

// Componentes de exibição (mantidos simples para foco na integração de dados)
const MetricCard = ({ title, value, icon: Icon, trend, color, isLoading }: any) => (
  <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-xl font-bold text-gray-800">
        {isLoading ? "..." : value}
      </h3>
      <p className="text-xs text-green-600">{trend}</p>
    </div>
    <div className={`p-2 rounded-full bg-${color}-100 text-${color}-600`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

const LeadChart = ({ leads, isLoading }: { leads: Lead[], isLoading: boolean }) => (
  <div className="bg-white p-4 rounded shadow">
    <h4 className="text-lg font-semibold mb-2">Gráfico de Leads</h4>
    {isLoading ? <p>Carregando...</p> : <p>{leads.length} leads exibidos no gráfico</p>}
    {/* Aqui você integraria uma biblioteca de gráficos real, como Recharts ou Chart.js */}
  </div>
);

const OpportunityPipeline = ({ opportunities, isLoading }: { opportunities: Opportunity[], isLoading: boolean }) => (
  <div className="bg-white p-4 rounded shadow">
    <h4 className="text-lg font-semibold mb-2">Pipeline de Oportunidades</h4>
    {isLoading ? <p>Carregando...</p> : (
      <ul className="list-disc pl-5">
        {opportunities.map((op) => (
          <li key={op.id}>Oportunidade #{op.id} - estágio: {op.stage}</li>
        ))}
      </ul>
    )}
  </div>
);

const CampaignChart = ({ campaigns, isLoading }: { campaigns: Campaign[], isLoading: boolean }) => (
  <div className="bg-white p-4 rounded shadow">
    <h4 className="text-lg font-semibold mb-2">Gráfico de Campanhas</h4>
    {isLoading ? <p>Carregando...</p> : <p>{campaigns.length} campanhas exibidas no gráfico</p>}
    {/* Aqui você integraria uma biblioteca de gráficos real para campanhas */}
  </div>
);

const RecentActivity = ({ leads, opportunities, campaigns, isLoading }: { leads: Lead[], opportunities: Opportunity[], campaigns: Campaign[], isLoading: boolean }) => (
  <div className="bg-white p-4 rounded shadow">
    <h4 className="text-lg font-semibold mb-2">Atividades Recentes</h4>
    {isLoading ? <p>Carregando...</p> : (
      <div className="space-y-2">
        <p>{leads.length} leads recentes</p>
        <p>{opportunities.length} oportunidades recentes</p>
        <p>{campaigns.length} campanhas recentes</p>
      </div>
    )}
  </div>
);

// Componente principal
export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [leadsData, opportunitiesData, campaignsData] = await Promise.all([
        getLeads(),
        getAllOpportunities(),
        getCampaigns(),
      ]);
      setLeads(leadsData);
      setOpportunities(opportunitiesData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setIsLoading(false);
  };

  const totalRevenue = opportunities
    .filter((opp) => opp.stage === "closed_won")
    .reduce((sum, opp) => sum + (opp.value || 0), 0);

  const convertedLeads = leads.filter((lead) => lead.status === "converted" || lead.status === "Convertido").length;
  const totalLeads = leads.length;
  const conversionRate =
    totalLeads > 0
      ? ((convertedLeads / totalLeads) * 100).toFixed(1)
      : "0";

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Visão geral do seu pipeline de vendas</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total de Leads"
            value={leads.length}
            icon={Users}
            trend="+12% este mês"
            color="blue"
            isLoading={isLoading}
          />
          <MetricCard
            title="Oportunidades Ativas"
            value={opportunities.filter((opp) => !["closed_won", "closed_lost"].includes(opp.stage)).length}
            icon={Target}
            trend="+8% este mês"
            color="green"
            isLoading={isLoading}
          />
          <MetricCard
            title="Taxa de Conversão"
            value={`${conversionRate}%`}
            icon={TrendingUp}
            trend="+2.5% este mês"
            color="purple"
            isLoading={isLoading}
          />
          <MetricCard
            title="Receita Fechada"
            value={`R$ ${totalRevenue.toLocaleString("pt-BR")}`}
            icon={DollarSign}
            trend="+15% este mês"
            color="emerald"
            isLoading={isLoading}
          />
          <MetricCard
            title="Total de Campanhas"
            value={campaigns.length}
            icon={Megaphone}
            trend="+5% este mês"
            color="orange"
            isLoading={isLoading}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <LeadChart leads={leads} isLoading={isLoading} />
            <OpportunityPipeline opportunities={opportunities} isLoading={isLoading} />
            <CampaignChart campaigns={campaigns} isLoading={isLoading} />
          </div>
          <div>
            <RecentActivity leads={leads} opportunities={opportunities} campaigns={campaigns} isLoading={isLoading} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}