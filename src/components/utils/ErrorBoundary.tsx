import  { Component, ErrorInfo, ReactNode } from 'react';
import { StatusMessageType, useSystemStatus, StatusMessage } from '../../SystemStatusContext';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  addMessage: (type: StatusMessageType, message: string, details?: string) => void;
  messages: StatusMessage[];
  clearMessages: () => void;
  removeMessage: (id: number) => void;
}

interface State {
  hasError: boolean;
}

class ErrorBoundaryComponent extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.addMessage(
      StatusMessageType.ERROR,
      error.message,
      errorInfo.componentStack ?? undefined // evita null
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex flex-col items-center justify-center p-8 gap-4 text-center'>
          <h1 className='text-xl font-bold'>Ocorreu um erro na aplicação.</h1>
          <p>Um erro inesperado aconteceu. A equipe já foi notificada.</p>
          <Link
            to="/dashboard"
            className="text-blue-600 hover:underline"
          >
            Voltar para o dashboard
          </Link>
        </div>

      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  const { addMessage, messages, clearMessages, removeMessage } = useSystemStatus();
  return (
    <ErrorBoundaryComponent
      addMessage={addMessage}
      messages={messages}
      clearMessages={clearMessages}
      removeMessage={removeMessage}
    >
      {children}
    </ErrorBoundaryComponent>
  );
}
