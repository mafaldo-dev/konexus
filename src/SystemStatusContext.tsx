import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect
} from 'react';

export enum StatusMessageType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export interface StatusMessage {
  id: number;
  type: StatusMessageType;
  message: string;
  details?: string;
  timestamp: Date;
}

export interface SystemStatusContextType {
  messages: StatusMessage[];
  addMessage: (type: StatusMessageType, message: string, details?: string) => void;
  clearMessages: () => void;
  removeMessage: (id: number) => void;
}

const SystemStatusContext = createContext<SystemStatusContextType | undefined>(undefined);

export const SystemStatusProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<StatusMessage[]>(() => {
    try {
      const storedMessages = localStorage.getItem('systemStatusMessages');
      return storedMessages ? JSON.parse(storedMessages) : [];
    } catch (error) {
      console.error("Failed to parse stored messages from localStorage", error);
      return [];
    }
  });

  const addMessage = (type: StatusMessageType, message: string, details?: string) => {
    const newMessage: StatusMessage = {
      id: Date.now(),
      type,
      message,
      details,
      timestamp: new Date(),
    };
    setMessages(prev => {
      const updatedMessages = [newMessage, ...prev];
      localStorage.setItem('systemStatusMessages', JSON.stringify(updatedMessages));
      return updatedMessages;
    });
  };

  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem('systemStatusMessages');
  };

  const removeMessage = (id: number) => {
    setMessages(prevMessages => {
      const updatedMessages = prevMessages.filter(msg => msg.id !== id);
      localStorage.setItem('systemStatusMessages', JSON.stringify(updatedMessages));
      return updatedMessages;
    });
  };

  // Captura erros globais (JS puro)
  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      addMessage(
        StatusMessageType.ERROR,
        `Erro global: ${event.message}`,
        `Arquivo: ${event.filename}, Linha: ${event.lineno}, Coluna: ${event.colno}`
      );
      console.log(event.message)
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
      addMessage(
        StatusMessageType.ERROR,
        `Erro não tratado em promessa`,
        reason
      );
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <SystemStatusContext.Provider value={{ messages, addMessage, clearMessages, removeMessage }}>
      {children}
    </SystemStatusContext.Provider>
  );
};

export const useSystemStatus = () => {
  const context = useContext(SystemStatusContext);
  if (context === undefined) {
    throw new Error('useSystemStatus must be used within a SystemStatusProvider');
  }
  return context;
};
