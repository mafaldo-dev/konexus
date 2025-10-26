import { Clock, AlertCircle, CheckCircle2, User, Calendar } from "lucide-react";
import { OSStatus, StatusConfig } from ".";
import { OrderService } from "../../service/interfaces/stock/service";
import { handleAllOrderServices } from "../../service/api/Administrador/orderService/service";
import { useEffect } from "react";

export interface OSCardProps {
  os: OrderService;
  currentUser: any;
  onUpdateStatus: (osId: string | number, newStatus: OSStatus) => void;
}

export const OSCard: React.FC<OSCardProps> = ({ os, onUpdateStatus }) => {
  
  // CORREÇÃO: useEffect estava com erro - fechamento no lugar errado
  useEffect(() => {
    const handleOrderService = async () => {
      try {
        const response = await handleAllOrderServices();
        console.log('Order Services Response:', response);
      } catch (err) {
        console.error("Erro ao buscar ordens:", err);
      }
    };
    
    handleOrderService();
  }, []); // Dependências vazias para executar apenas na montagem

  const statusConfig: Record<OSStatus, StatusConfig> = {
    initialized: { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      icon: Clock, 
      label: 'initialized' 
    },
    in_progress: { 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      icon: AlertCircle, 
      label: 'Em Progresso' 
    },
    finished: { 
      color: 'bg-green-100 text-green-800 border-green-200', 
      icon: CheckCircle2, 
      label: 'Finalizada' 
    }
  };

  const config = statusConfig[os.orderStatus as OSStatus];
  const Icon = config?.icon || Clock;

  // Permissões de ações
  const canSeparate = os.orderStatus === 'initialized';
  const canFinalize = os.orderStatus === 'in_progress';

  // Função para formatar data de forma segura
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'Data não disponível';
    
    try {
      return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">
            OS #{os.orderNumber || 'N/A'}
          </h3>
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${config?.color || 'bg-gray-100 text-gray-800'} border mt-1`}>
            <Icon className="w-3 h-3" />
            {config?.label || 'Desconhecido'}
          </span>
        </div>
      </div>

      {/* Setor */}
      {os.sector && (
        <div className="mb-3 pb-2 border-b border-gray-100">
          <p className="text-xs text-gray-500">Setor:</p>
          <p className="text-sm font-medium text-gray-700">{os.sector}</p>
        </div>
      )}

      {/* Itens solicitados */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1.5">Itens solicitados:</p>
        <div className="flex flex-wrap gap-1.5">
          {Array.isArray(os.orderItems) && os.orderItems.length > 0 ? (
            os.orderItems.map((item, idx) => (
              <span 
                key={idx} 
                className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200"
              >
                {typeof item === 'object' 
                  ? `${item.productCode || 'Produto'} (${item.quantity || 0}x)` 
                  : item}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400 italic">Nenhum item cadastrado</span>
          )}
        </div>
      </div>

      {/* Mensagem */}
      {os.message && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-xs text-amber-800 font-medium mb-1">Mensagem:</p>
          <p className="text-sm text-amber-900">{os.message}</p>
        </div>
      )}

      {/* Observações */}
      {os.notes && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Observações:</p>
          <p className="text-sm text-gray-600 line-clamp-2">{os.notes}</p>
        </div>
      )}

      {/* Informações */}
      <div className="space-y-2 text-xs text-gray-600 mb-3 border-t pt-3">
        {/* Criador */}
        {os.userCreate && (
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">Criado por:</span>
            <span className="font-medium text-gray-700">{os.userCreate}</span>
          </div>
        )}

        {/* Responsável */}
        {os.userReceiv && (
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">Responsável:</span>
            <span className="font-medium text-gray-700">{os.userReceiv}</span>
          </div>
        )}

        {/* Data da ordem */}
        {os.orderDate && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">Data da OS:</span>
            <span className="font-medium text-gray-700">{formatDate(os.orderDate)}</span>
          </div>
        )}

        {/* Data de criação */}
        {os.createdAt && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">Criado em:</span>
            <span className="font-medium text-gray-700">{formatDate(os.createdAt)}</span>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        {canSeparate && (
          <button
            onClick={() => onUpdateStatus(os.id, 'in_progress')}
            className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            Iniciar OS
          </button>
        )}
        
        {canFinalize && (
          <button
            onClick={() => onUpdateStatus(os.id, 'finished')}
            className="flex-1 bg-green-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Finalizar
          </button>
        )}
        
        {/* Status quando não há ações disponíveis */}
        {!canSeparate && !canFinalize && (
          <div className="flex-1 text-center text-sm text-gray-500 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
            {os.orderStatus === 'finished' 
              ? '✓ Ordem Finalizada' 
              : '⏸ Aguardando Ação'}
          </div>
        )}
      </div>
    </div>
  );
};