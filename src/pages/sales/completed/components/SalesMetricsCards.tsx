import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Package, Users } from "lucide-react";
import { Order } from "../../../../service/interfaces/sales/orders";



interface Metric {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  textColor: string;
}

interface Props {
  orders: Order[];
}

const SalesMetricsCards: React.FC<Props> = ({ orders }) => {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const uniqueCustomers = new Set(orders.map((order) => order.customer_name)).size;

  const metrics: Metric[] = [
    {
      title: "Receita Total",
      value: `R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
    {
      title: "Vendas Realizadas",
      value: totalOrders.toString(),
      icon: Package,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      title: "Ticket Médio",
      value: `R$ ${averageOrderValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
    },
    {
      title: "Clientes Únicos",
      value: uniqueCustomers.toString(),
      icon: Users,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <div className="relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-5`} />
              <div className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{metric.title}</p>
                    <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${metric.bgColor}`}>
                    <Icon className={`w-6 h-6 ${metric.textColor}`} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SalesMetricsCards;
