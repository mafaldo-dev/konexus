import { useSystemStatus, StatusMessage, StatusMessageType } from '../../../SystemStatusContext';
import Dashboard from '../../../components/dashboard/Dashboard';

const getStatusColor = (type: StatusMessageType) => {
  switch (type) {
    case StatusMessageType.ERROR:
      return 'bg-red-100 text-red-800';
    case StatusMessageType.WARNING:
      return 'bg-yellow-100 text-yellow-800';
    case StatusMessageType.INFO:
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

const StatusCard = ({ msg }: { msg: StatusMessage }) => (
  <div className={`rounded-lg p-4 mb-4 shadow-md ${getStatusColor(msg.type)}`}>
    <div className="flex justify-between items-center">
      <span className="font-bold text-lg">{msg.type}</span>
      <span className="text-sm">{new Date(msg.timestamp).toLocaleString()}</span>
    </div>
    <p className="mt-2 font-semibold">{msg.message}</p>
    {msg.details && (
      <pre className="mt-2 p-2 bg-gray-200 text-gray-700 rounded-md text-sm whitespace-pre-wrap">
        {msg.details}
      </pre>
    )}
  </div>
);

export default function SystemStatusPage() {
  const { messages, clearMessages } = useSystemStatus();

  return (
    <Dashboard>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Status do Sistema</h1>
          <p className="text-sm text-slate-500">Logs de eventos, erros e avisos da aplicação.</p>
        </div>
        <button
          onClick={clearMessages}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition disabled:bg-red-300"
          disabled={messages.length === 0}
        >
          Limpar Logs
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <p className="text-lg">Nenhum evento de sistema registrado.</p>
            <p className="text-sm">Todos os sistemas estão operando normalmente.</p>
          </div>
        ) : (
          messages.map(msg => <StatusCard key={msg.id} msg={msg} />)
        )}
      </div>
    </Dashboard>
  );
}
