import { motion } from 'framer-motion';
import { Edit, Trash2, Calendar, User, AlertTriangle } from 'lucide-react';
import { GoalsData } from '../../../../service/interfaces';


type Unit = 'reais' | 'porcentagem' | 'pessoas' | 'unidades' | string

type Priority = 'baixa' | 'media' | 'alta' | 'critica';
type Status = 'ativa' | 'pausada' | 'concluida' | 'cancelada';
type Department = 'vendas' | 'marketing' | 'operacoes' | 'financeiro' | 'rh' | string;



interface GoalCardProps {
  goal: GoalsData;
  onEdit: (goal: GoalsData) => void;
  onDelete: (id: string | any) => void;
  isDeleting?: boolean
  deleteId?: string
  index: number
}

const formatValue = (value: number, unit: Unit): string => {
  switch (unit) {
    case 'reais':
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    case 'porcentagem':
      return `${value}%`;
    case 'pessoas':
      return `${value} pessoas`;
    default:
      return `${value} unidades`;
  }
};

const getPriorityColor = (priority: Priority): string => {
  switch (priority) {
    case 'baixa': return 'bg-green-100 text-green-800';
    case 'media': return 'bg-yellow-100 text-yellow-800';
    case 'alta': return 'bg-orange-100 text-orange-800';
    case 'critica': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: Status): string => {
  switch (status) {
    case 'ativa': return 'bg-blue-100 text-blue-800';
    case 'pausada': return 'bg-gray-100 text-gray-800';
    case 'concluida': return 'bg-green-100 text-green-800';
    case 'cancelada': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getDepartmentColor = (department: Department): string => {
  switch (department) {
    case 'vendas': return 'bg-blue-50 text-blue-700';
    case 'marketing': return 'bg-purple-50 text-purple-700';
    case 'operacoes': return 'bg-green-50 text-green-700';
    case 'financeiro': return 'bg-yellow-50 text-yellow-700';
    case 'rh': return 'bg-pink-50 text-pink-700';
    default: return 'bg-gray-50 text-gray-700';
  }
};

export default function GoalCard({ goal, onEdit, onDelete, index }: GoalCardProps) {
  const progress = (goal.current_value / goal.target_value) * 100;
  const isAtRisk = progress < 50 && goal.status === 'ativa';
  const daysLeft = Math.ceil((new Date(goal.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-slate-900">{goal.title}</h3>
              {isAtRisk && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-medium">Em Risco</span>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-600 mb-3">{goal.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                {goal.priority}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                {goal.status}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDepartmentColor(goal.department)}`}>
                {goal.department}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(goal)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              aria-label="Editar meta"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              aria-label="Excluir meta"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">Progresso</span>
              <span className="text-sm font-bold text-slate-900">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  progress >= 100 ? 'bg-green-500' : 
                  progress >= 75 ? 'bg-blue-500' : 
                  progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Atual:</span>
              <p className="font-bold text-slate-900">{formatValue(goal.current_value, goal.unit)}</p>
            </div>
            <div>
              <span className="text-slate-500">Meta:</span>
              <p className="font-bold text-slate-900">{formatValue(goal.target_value, goal.unit)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <User className="w-4 h-4" />
              <span>{goal.responsible}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>{daysLeft > 0 ? `${daysLeft} dias` : 'Vencida'}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
