import { Clock, AlertCircle, CheckCircle2, User, Package, Calendar } from "lucide-react";
import { OSCardProps, OSStatus, StatusConfig } from ".";

export const OSCard: React.FC<OSCardProps> = ({ os, currentUser, onUpdateStatus }) => {
  const statusConfig: Record<OSStatus, StatusConfig> = {
    iniciada: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Iniciada' },
    em_progresso: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: AlertCircle, label: 'Em Progresso' },
    finalizada: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2, label: 'Finalizada' }
  };

  const config = statusConfig[os.status];
  const Icon = config.icon;

  const canSeparate = os.status === 'iniciada' && currentUser.sector === 'oficina';
  const canFinalize = os.status === 'em_progresso' && os.assignedTo === currentUser.id;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">OS #{os.id}</h3>
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${config.color} border mt-1`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          os.priority === 'alta' 
            ? 'bg-red-100 text-red-700'
            : os.priority === 'media'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {os.priority === 'alta' ? 'Alta' : os.priority === 'media' ? 'Média' : 'Baixa'}
        </span>
      </div>

      {/* Itens solicitados */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1">Itens solicitados:</p>
        <div className="flex flex-wrap gap-1">
          {os.items.map((item, idx) => (
            <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Descrição */}
      {os.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{os.description}</p>
      )}

      {/* Informações */}
      <div className="space-y-2 text-xs text-gray-600 mb-3 border-t pt-3">
        <div className="flex items-center gap-2">
          <User className="w-3 h-3" />
          Criado por: {os.createdByName}
        </div>
        {os.assignedToName && (
          <div className="flex items-center gap-2">
            <Package className="w-3 h-3" />
            Responsável: {os.assignedToName}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3" />
          {new Date(os.createdAt).toLocaleString('pt-BR')}
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        {canSeparate && (
          <button
            onClick={() => onUpdateStatus(os.id, 'em_progresso')}
            className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Separar Item
          </button>
        )}
        {canFinalize && (
          <button
            onClick={() => onUpdateStatus(os.id, 'finalizada')}
            className="flex-1 bg-green-600 text-white text-sm py-2 rounded-lg hover:bg-green-700 transition"
          >
            Finalizar
          </button>
        )}
      </div>
    </div>
  );
};
