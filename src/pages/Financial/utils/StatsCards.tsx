import React from 'react';
import {  Calendar, DollarSign, Package } from 'lucide-react';
import { Card, CardContent } from '../../../components/dashboard/components/ui/Card';
import { FinancialStats } from '../../../service/interfaces/financial/paymentAccounts';
import { formatCurrency } from '../../../utils/formatters';


interface StatsCardsProps {
  stats: FinancialStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'A Receber',
      value: formatCurrency(stats.totalReceber),
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: <DollarSign className="h-5 w-5 text-green-600" />
    },
    {
      title: 'A Pagar',
      value: formatCurrency(stats.totalPagar),
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: <DollarSign className="h-5 w-5 text-red-600" />
    },
    {
      title: 'Pedidos Pendentes',
      value: stats.pedidosPendentes.toString(),
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      icon: <Package className="h-5 w-5 text-orange-600" />
    },
    {
      title: 'Vencem Hoje',
      value: stats.payment_date!.toString(), 
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: <Calendar className="h-5 w-5 text-yellow-600" />
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>
                  {card.title === "Vencem Hoje" ? stats.payment_date : card.value}
                </p>
              </div>
              <div className={`w-10 h-10 ${card.bgColor} rounded-full flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};