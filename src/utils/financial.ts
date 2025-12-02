export const RECEIVABLE_STATUS: any = {
  'pending': {
    label: 'Pendente',
    color: 'bg-yellow-50 text-yellow-800 border border-yellow-200 px-2 py-1 rounded-md text-xs font-medium'
  },
  'paid': {
    label: 'Pago',
    color: 'bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-md text-xs font-medium'
  },
  'overdue': {
    label: 'Vencido',
    color: 'bg-red-50 text-red-800 border border-red-200 px-2 py-1 rounded-md text-xs font-medium'
  },
  'due_today': {
    label: 'Vence Hoje',
    color: 'bg-orange-50 text-orange-800 border border-orange-200 px-2 py-1 rounded-md text-xs font-medium'
  },
  'cancelled': {
    label: 'Cancelado',
    color: 'bg-gray-50 text-gray-800 border border-gray-200 px-2 py-1 rounded-md text-xs font-medium'
  }
};

export const PAYMENT_STATUS: any = {
  'pago': {
    label: 'Pago',
    color: 'bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-md text-xs font-medium'
  },
  'a_vencer': {
    label: 'A Vencer',
    color: 'bg-blue-50 text-blue-800 border border-blue-200 px-2 py-1 rounded-md text-xs font-medium'
  },
  'vence_hoje': {
    label: 'Vence Hoje',
    color: 'bg-yellow-50 text-yellow-800 border border-yellow-200 px-2 py-1 rounded-md text-xs font-medium'
  },
  'atrasado': {
    label: 'Atrasado',
    color: 'bg-red-50 text-red-800 border border-red-200 px-2 py-1 rounded-md text-xs font-medium'
  },
  'parcial': {
    label: 'Parcialmente Pago',
    color: 'bg-orange-50 text-orange-800 border border-orange-200 px-2 py-1 rounded-md text-xs font-medium'
  },
  'previsto': {
    label: 'Previsto',
    color: 'bg-slate-50 text-slate-800 border border-slate-200 px-2 py-1 rounded-md text-xs font-medium'
  }
};