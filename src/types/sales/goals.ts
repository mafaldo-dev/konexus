import { LucideIcon } from "lucide-react";

export interface GoalsData {
  id: string | any
  title: string;
  description: string;
  current_value: number;
  target_value: number;
  status: 'ativa' | 'concluida' | 'cancelada' | 'pausada';
  unit: 'reais' | 'porcentagem' | 'pessoas' | string;
  start_date: string;
  end_date: string;
  department?: string | any
  priority: string | any
  responsible: string
}

export interface GoalsOverviewProps {
  goals: GoalsData[];
}

export interface StatItem {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  textColor: string;
  unit: string
}