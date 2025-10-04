// ChatContext.tsx
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useReducer
} from 'react';
import { useAuth } from './AuthContext';
import { fetchMessages, markMessagesReadAPI, sendMessageAPI } from './service/api/chat';
import { handleAllEmployee } from './service/api/Administrador/employee';

export type UserStatus = 'online' | 'offline' | 'away';

export interface User {
  id: string;
  username: string;
  role: string;
  active: boolean;
  designation: string;
  status: UserStatus;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  sector: string;
  content: string;
  timestamp: string;
  recipientId: string;
  read: boolean;
}

type UnreadCountsState = Record<string, number>;

type Action =
  | { type: 'RESET_UNREAD'; userId: string }
  | { type: 'INCREMENT_UNREAD'; userId: string }
  | { type: 'SET_UNREAD'; unreadMap: Record<string, number> };

function unreadCountsReducer(state: UnreadCountsState, action: Action): UnreadCountsState {
  switch (action.type) {
    case 'RESET_UNREAD':
      return { ...state, [action.userId]: 0 };
    case 'INCREMENT_UNREAD':
      return { ...state, [action.userId]: (state[action.userId] || 0) + 1 };
    case 'SET_UNREAD':
      return { ...action.unreadMap };
    default:
      return state;
  }
}

interface ChatContextData {
  currentUser: User | null;
  users: User[];
  messages: Message[];
  setUserStatus: (userId: string, status: UserStatus) => void;
  sendMessage: (msg: Omit<Message, 'id' | 'timestamp' | 'read' | 'role'>) => void;
  markMessagesRead: (senderId: string, recipientId: string) => void;
  fetchUsers: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  setUserInactive: () => void;
  setUserActive: () => void;
  unreadCounts: UnreadCountsState;
  setUnreadCounts: React.Dispatch<Action>; // ✅ ADICIONADO DE VOLTA
}

const ChatContext = createContext<ChatContextData | undefined>(undefined);

// Chave para sessionStorage
const ONLINE_USERS_KEY = 'chat_online_users';

// Funções para gerenciar sessionStorage
const getOnlineUsersFromStorage = (): Record<string, UserStatus> => {
  try {
    const stored = sessionStorage.getItem(ONLINE_USERS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const setOnlineUserInStorage = (userId: string, status: UserStatus) => {
  try {
    const onlineUsers = getOnlineUsersFromStorage();
    onlineUsers[userId] = status;
    sessionStorage.setItem(ONLINE_USERS_KEY, JSON.stringify(onlineUsers));
  } catch (error) {
    console.error('Erro ao salvar no sessionStorage:', error);
  }
};

const removeOnlineUserFromStorage = (userId: string) => {
  try {
    const onlineUsers = getOnlineUsersFromStorage();
    delete onlineUsers[userId];
    sessionStorage.setItem(ONLINE_USERS_KEY, JSON.stringify(onlineUsers));
  } catch (error) {
    console.error('Erro ao remover do sessionStorage:', error);
  }
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user: authUser } = useAuth();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, dispatchUnreadCounts] = useReducer(unreadCountsReducer, {});

  // ✅ ADICIONADO: Exportar o dispatch para os componentes
  const setUnreadCounts = dispatchUnreadCounts;

  // Função para buscar mensagens
  const refreshMessages = async () => {
    if (!authUser?.id) return;

    try {
      const msgs = await fetchMessages(authUser.id);
      setMessages(msgs.sort((a: Message, b: Message) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ));
    } catch (err) {
      console.error("Erro ao buscar mensagens:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const employees = await handleAllEmployee();
      const onlineUsers = getOnlineUsersFromStorage();

      const usersFromApi: User[] = employees.map((emp: any) => ({
        id: emp.id,
        username: emp.username || emp.name || 'Sem nome',
        role: emp.role || 'Administrador',
        designation: emp.sector || "Geral",
        active: emp.active || false,
        status: onlineUsers[emp.id] || 'offline',
      }));

      setUsers(usersFromApi);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const setUserStatus = (userId: string, status: UserStatus) => {
    if (status === 'offline') {
      removeOnlineUserFromStorage(userId);
    } else {
      setOnlineUserInStorage(userId, status);
    }

    setUsers(oldUsers =>
      oldUsers.map(u =>
        u.id === userId && u.status !== status
          ? { ...u, status }
          : u
      )
    );
    setCurrentUser(curr => (curr && curr.id === userId ? { ...curr, status } : curr));
  };

  const setUserActive = () => {
    if (!authUser?.id) return;
    setUserStatus(authUser.id, 'online');
  };

  const setUserInactive = () => {
    if (!authUser?.id) return;
    setUserStatus(authUser.id, 'offline');
  };

  const sendMessage = async (msg: Omit<Message, 'id' | 'timestamp' | 'read'>) => {
    try {
      const newMsg: Omit<Message, 'id'> = {
        ...msg,
        timestamp: new Date().toISOString(),
        read: false,
      };

      await sendMessageAPI(newMsg);
      // Atualiza mensagens após enviar
      setTimeout(refreshMessages, 500);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  const markMessagesRead = async (senderId: string, recipientId: string) => {
    try {
      await markMessagesReadAPI(senderId, recipientId);
      // Atualiza mensagens após marcar como lidas
      setTimeout(refreshMessages, 500);
    } catch (error) {
      console.error("Erro ao marcar mensagens como lidas:", error);
    }
  };

  // Efeito único de inicialização
  useEffect(() => {
    let mounted = true;

    const initializeChat = async () => {
      if (!authUser || !mounted) return;

      // Aguarda um pouco para garantir que o token está disponível
      await new Promise(resolve => setTimeout(resolve, 1000));

      const onlineUsers = getOnlineUsersFromStorage();
      const userStatus = onlineUsers[authUser.id] || 'online';

      if (!onlineUsers[authUser.id]) {
        setOnlineUserInStorage(authUser.id, 'online');
      }

      if (mounted) {
        setCurrentUser({
          id: authUser.id || '',
          username: authUser.username,
          role: authUser.role,
          designation: authUser.designation,
          active: authUser.active || false,
          status: userStatus,
        });

        try {
          await fetchUsers();
          await refreshMessages();
        } catch (error) {
          console.error('Erro na inicialização:', error);
        }
      }
    };

    initializeChat();

    return () => {
      mounted = false;
      if (authUser?.id) {
        removeOnlineUserFromStorage(authUser.id);
      }
    };
  }, []); // Só depende do ID

  // Efeito para unread counts
 useEffect(() => {
  if (!authUser) return;

  const newUnreadMap: Record<string, number> = {};
  messages.forEach(msg => {
    if (msg.recipientId === authUser.id && !msg.read) {
      newUnreadMap[msg.senderId] = (newUnreadMap[msg.senderId] || 0) + 1;
    }
  });

  // Só despacha se for diferente do estado atual
  const same = JSON.stringify(unreadCounts) === JSON.stringify(newUnreadMap);
  if (!same) {
    dispatchUnreadCounts({ type: 'SET_UNREAD', unreadMap: newUnreadMap });
  }
}, [messages, authUser, unreadCounts]);


  return (
    <ChatContext.Provider
      value={{
        currentUser,
        users,
        messages,
        setUserStatus,
        sendMessage,
        markMessagesRead,
        fetchUsers,
        refreshMessages,
        setUserInactive,
        setUserActive,
        unreadCounts,
        setUnreadCounts, // ✅ ADICIONADO NO PROVIDER
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat deve ser usado dentro de um ChatProvider');
  }
  return context;
};