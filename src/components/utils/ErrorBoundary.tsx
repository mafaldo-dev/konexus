import { Component, ErrorInfo, ReactNode } from 'react';
import { StatusMessageType, useSystemStatus, StatusMessage } from '../../SystemStatusContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, RefreshCw, Layout } from 'lucide-react';

interface Props {
  children: ReactNode;
  addMessage: (type: StatusMessageType, message: string, details?: string) => void;
  messages: StatusMessage[];
  clearMessages: () => void;
  removeMessage: (id: number) => void;
  onGoToDashboard: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundaryComponent extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.addMessage(
      StatusMessageType.ERROR,
      error.message,
      errorInfo.componentStack ?? undefined
    );
  }

  // Permite tentar novamente após um erro
  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.clearMessages();
  };

  // Hot reload: volta ao dashboard e recarrega a página inteira para limpar
  // o estado de erro sem criar um novo botão.
  handleGoToDashboard = () => {
    this.props.onGoToDashboard();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex flex-col items-center justify-center p-8 gap-4 text-center'>
          <ShieldAlert className="w-12 h-12 text-rose-500" />
          <h1 className='text-xl font-bold text-rose-900'>Ocorreu um erro na aplicação.</h1>
          <p className='text-gray-600 max-w-md'>
            Um erro inesperado aconteceu. A equipe já foi notificada.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={this.handleRetry}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 sm:mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
            <button
              onClick={this.handleGoToDashboard}
              className="px-6 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition flex items-center justify-center gap-2 sm:mx-auto"
            >
              <Layout className="w-4 h-4" />
              Voltar para o dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  const { addMessage, messages, clearMessages, removeMessage } = useSystemStatus();
  const navigate = useNavigate();

  const goToDashboard = () => {
    navigate('/dashboard');
    window.location.reload();
  };

  return (
    <ErrorBoundaryComponent
      addMessage={addMessage}
      messages={messages}
      clearMessages={clearMessages}
      removeMessage={removeMessage}
      onGoToDashboard={goToDashboard}
    >
      {children}
    </ErrorBoundaryComponent>
  );
}
