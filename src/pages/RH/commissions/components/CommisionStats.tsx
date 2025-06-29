import { motion } from 'framer-motion';
import { DollarSign, Award, Users, TrendingUp } from 'lucide-react';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const colorMap = {
  green: { bg: 'bg-green-100', text: 'text-green-800' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-800' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-800' }
} as const;

type ColorKey = keyof typeof colorMap;

interface Metric {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  color: ColorKey;
}

interface CommissionStatsProps {
  stats: {
    totalCommission: number;
    totalBonus: number;
    topPerformer: {
      name: string | null;
      value: number;
    };
    salesWithValue: number;
  };
}

export default function CommissionStats({ stats }: CommissionStatsProps) {
  const { totalCommission, totalBonus, topPerformer, salesWithValue } = stats;

  const metrics: Metric[] = [
    { title: "Total Comissões", value: formatCurrency(totalCommission), icon: DollarSign, color: "green" },
    { title: "Total Bônus", value: formatCurrency(totalBonus), icon: Award, color: "indigo" },
    { title: "Vendas Comissionadas", value: formatCurrency(salesWithValue), icon: TrendingUp, color: "blue" },
    {
      title: "Top Vendedor",
      value: topPerformer.name || "N/A",
      subValue: topPerformer.name ? formatCurrency(topPerformer.value) : "",
      icon: Users,
      color: "amber"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-slate-500">{metric.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{metric.value}</p>
                {metric.subValue && <p className="text-sm text-slate-500">{metric.subValue}</p>}
              </div>
              <div className={`w-12 h-12 flex items-center justify-center rounded-full ${colorMap[metric.color].bg}`}>
                <metric.icon className={`w-6 h-6 ${colorMap[metric.color].text}`} />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
