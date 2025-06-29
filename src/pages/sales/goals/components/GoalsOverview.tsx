import { motion } from 'framer-motion';
import { Target, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { GoalsOverviewProps, StatItem } from '../../../../service/interfaces/goals';


const formatValue = (value: any, unit: any) => {
  switch (unit) {
    case 'reais':
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    case 'porcentagem':
      return `${Math.round(value)}%`;
    case 'pessoas':
      return `${value} pessoas`;
    default:
      return `${value}`;
  }
};

export default function GoalsOverview({ goals }: GoalsOverviewProps) {
  const activeGoals = goals.filter(goal => goal.status === 'ativa');
  const completedGoals = goals.filter(goal => goal.status === 'concluida');
  const atRiskGoals = goals.filter(goal => {
    const progress = (goal.current_value / goal.target_value) * 100;
    const timeLeft = new Date(goal.end_date).getTime() - new Date().getTime();
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    return progress < 50 && daysLeft < 30 && goal.status === 'ativa';
  });

  const totalProgress = activeGoals.length > 0 
    ? activeGoals.reduce((sum, goal) => sum + ((goal.current_value / goal.target_value) * 100), 0) / activeGoals.length
    : 0;

  const stats: StatItem[] = [
    {
      title: "Metas Ativas",
      value: activeGoals.length,
      unit: 'unidades',
      icon: Target,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700"
    },
    {
      title: "Metas Concluídas",
      value: completedGoals.length,
      unit: 'unidades',
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-700"
    },
    {
      title: "Em Risco",
      value: atRiskGoals.length,
      unit: 'unidades',
      icon: AlertTriangle,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      textColor: "text-red-700"
    },
    {
      title: "Progresso Médio",
      value: totalProgress,
      unit: 'porcentagem',
      icon: TrendingUp,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
        >
          <div className={`h-2 bg-gradient-to-r ${stat.color}`} />
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-slate-900">
                  {formatValue(stat.value, stat.unit)}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}