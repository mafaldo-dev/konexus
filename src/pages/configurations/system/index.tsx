import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import Dashboard from '../../../components/dashboard/Dashboard';
import { useSystemStatus, StatusMessageType } from '../../../SystemStatusContext';

const statusColors = {
  ok: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
};

const statusIcons = {
  ok: <CheckCircle size={20} className={statusColors.ok} />,
  warning: <AlertTriangle size={20} className={statusColors.warning} />,
  error: <AlertTriangle size={20} className={statusColors.error} />,
};

export default function SystemStatusDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const { messages, removeMessage } = useSystemStatus();



  useEffect(() => {
    // Simula carregamento do painel
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const groupedMessages = {
    [StatusMessageType.ERROR]: messages.filter(m => m.type === StatusMessageType.ERROR),
    [StatusMessageType.WARNING]: messages.filter(m => m.type === StatusMessageType.WARNING),
    [StatusMessageType.INFO]: messages.filter(m => m.type === StatusMessageType.INFO),
  };

  const renderMessages = (type: StatusMessageType, icon: React.JSX.Element, colorClass: string) => {
    const list = groupedMessages[type];
    console.log(messages)
    if (list.length === 0) return null;

    return (
      <div className="mt-6">
        <h2 className={`text-lg font-semibold mb-2 ${colorClass}`}>
          {type === 'ERROR' && 'Erros Críticos'}
          {type === 'WARNING' && 'Avisos'}
          {type === 'INFO' && 'Informações'}
        </h2>
        <div className="space-y-2">
          {list.map(msg => (
            <div
              key={msg.id}
              className={`border-l-4 p-2 bg-white rounded-md shadow-sm flex items-center justify-between gap-3`}
              style={{ maxWidth: '400px', minHeight: '3rem', width: '100%' }}
            >
              <div className="flex gap-3 overflow-hidden" style={{ flexShrink: 1, flexGrow: 0, flexBasis: 'auto', minWidth: 0 }}>
                {type === 'ERROR' ? (
                  <XCircle size={20} className="text-red-600 flex-shrink-0" />
                ) : type === 'WARNING' ? (
                  <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0" />
                ) : (
                  <Info size={20} className="text-blue-600 flex-shrink-0" />
                )}
                <div className="overflow-hidden" style={{ minWidth: 0 }}>
                  <p className="text-xs font-medium text-slate-800 truncate">{msg.message}</p>
                  {msg.details && (
                    <p
                      className="text-[10px] text-slate-500 mt-1 whitespace-pre-line overflow-hidden text-ellipsis"
                      style={{ maxHeight: '3rem' }}
                    >
                      {msg.details}
                    </p>
                  )}
                  <p className="text-[9px] text-slate-400 mt-1 italic">{new Date(msg.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={() => removeMessage(msg.id)}
                className="text-red-500 hover:text-red-700 text-sm font-bold flex-shrink-0"
                title="Remover erro"
                aria-label="Remover erro"
                style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}
              >
                ×
              </button>
            </div>
          ))}

        </div>
      </div>
    );
  };

  return (
    <Dashboard>
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
            <ShieldCheck size={24} className="text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Status Geral da Plataforma</h1>
            <p className="text-sm text-slate-500">
              Visualize rapidamente quais sistemas estão operacionais e quais precisam de atenção.
            </p>
          </div>
        </div>

        {/* Carregamento */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-slate-500" size={32} />
          </div>
        ) : (
          <>
            {/* Mensagens de Erro/Aviso/Info */}
            {renderMessages(StatusMessageType.ERROR, <XCircle />, 'text-red-700')}
            {renderMessages(StatusMessageType.WARNING, <AlertTriangle />, 'text-yellow-700')}
            {renderMessages(StatusMessageType.INFO, <Info />, 'text-blue-700')}

            {/* Alerta se algum erro crítico estiver ativo */}
            {groupedMessages[StatusMessageType.ERROR].length > 0 && (
              <div className="mt-6 bg-red-100 text-red-800 border border-red-300 px-4 py-3 rounded-lg">
                Um ou mais erros críticos foram registrados no sistema. Verifique imediatamente.
              </div>
            )}
          </>
        )}
      </div>
    </Dashboard>
  );
}
