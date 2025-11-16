// utils/constants/orderStatus.ts

export const ORDER_STATUS: any = {
  pending: { 
    label: "Pendente", 
    color: "bg-yellow-50 text-yellow-800 border-yellow-200",
    tabColor: "bg-amber-50 text-amber-800 border-b-2 border-amber-500"
  },
  approved: { 
    label: "Aprovado", 
    color: "bg-blue-50 text-blue-800 border-blue-200",
    tabColor: "bg-cyan-50 text-blue-600 border-b-2 border-blue-500"
  },
  in_progress: { 
    label: "Em Andamento", 
    color: "bg-slate-100 text-slate-700 border-slate-300",
    tabColor: "bg-orange-50 text-orange-700 border-b-2 border-orange-500"
  },
  shipped: { 
    label: "Enviado", 
    color: "bg-indigo-50 text-indigo-800 border-indigo-200",
    tabColor: "bg-indigo-50 text-indigo-800 border-b-2 border-indigo-500"
  },
  delivered: { 
    label: "Entregue", 
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
    tabColor: "bg-emerald-50 text-emerald-800 border-b-2 border-emerald-500"
  },
  cancelled: { 
    label: "Cancelado", 
    color: "bg-red-50 text-red-800 border-red-200",
    tabColor: "bg-red-50 text-red-800 border-b-2 border-red-500"
  },
  backout: { 
    label: "Estornado", 
    color: "bg-orange-50 text-orange-800 border-orange-200",
    tabColor: "bg-orange-50 text-orange-800 border-b-2 border-orange-500"
  }
};

// Função auxiliar para mapear status do backend
export const mapOrderStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'approved': 'approved',
    'in_progress': 'in_progress',
    'shipped': 'shipped',
    'cancelled': 'cancelled',
    'delivered': 'delivered',
    'backout': 'backout'
  };
  return statusMap[status?.toLowerCase()] || status || 'approved';
};

// Função para obter label do status
export const getStatusLabel = (status: string): string => {
  return ORDER_STATUS[status]?.label || status;
};

// Função para obter cor do status
export const getStatusColor = (status: string): string => {
  return ORDER_STATUS[status]?.color || "bg-gray-50 text-gray-800 border-gray-200";
};

// Função para obter cor da aba ativa
export const getStatusTabColor = (status: string): string => {
  return ORDER_STATUS[status]?.tabColor || "bg-gray-50 text-gray-700 border-b-2 border-gray-500";
};