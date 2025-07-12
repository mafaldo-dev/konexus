import { Users, Target, TrendingUp, DollarSign, Megaphone } from "lucide-react";
import { motion } from "framer-motion";
import { useCrmData } from "../../../hooks/_crm/useCrmData";
import MetricCard from "../dashboard/MetricCard";
import LeadChart from "../dashboard/LeadChart";
import OpportunityPipeline from "../dashboard/Opportunity";




export default function Dashboard() {
  const { leads, opportunities, campaigns, isLoading } = useCrmData();


  

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
            value={`%`}
            icon={TrendingUp}
            trend="+2.5% este mês"
            color="purple"
            isLoading={isLoading}
          />
          <MetricCard
            title="Receita Fechada"
            value={`R$`}
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
            
          </div>
          <div>
            
          </div>
        </div>
      </motion.div>
    </div>
  );
}