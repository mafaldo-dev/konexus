import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useReducer,
  useRef,
  useCallback
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { fetchMessages, markMessagesReadAPI, sendMessageAPI, fetchConversationAPI } from './service/api/chat';
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
  setUnreadCounts: React.Dispatch<Action>;
  isConnected: boolean;
  typingUsers: Set<string>;
  startTyping: (recipientId: string) => void;
  stopTyping: (recipientId: string) => void;

}

const ChatContext = createContext<ChatContextData | undefined>(undefined);

const ONLINE_USERS_KEY = 'chat_online_users';

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
  const [messages, _setMessages] = useState<Message[]>([]);
  const [unreadCounts, dispatchUnreadCounts] = useReducer(unreadCountsReducer, {});
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const messagesRef = useRef<Message[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef<boolean>(true);

  const setMessages = useCallback((updater: Message[] | ((prev: Message[]) => Message[])) => {
    _setMessages(prev => {
      const next = typeof updater === 'function' ? (updater as (p: Message[]) => Message[])(prev) : updater;
      messagesRef.current = next;
      return next;
    });
  }, []);

  const setUnreadCounts = dispatchUnreadCounts;
  const tkn = localStorage.getItem('token');

  const fetchUsers = useCallback(async () => {
    try {
      let employees = await handleAllEmployee();
      const onlineUsers = getOnlineUsersFromStorage();

      if (employees?.data && Array.isArray(employees.data)) {
        employees = employees.data;
      }

      if (Array.isArray(employees) && employees.length > 0 && Array.isArray(employees[0])) {
        employees = employees[0];
      }

      if (!Array.isArray(employees)) {
        console.warn("⚠ Formato inesperado de employees, normalizando para array vazio.");
        employees = [];
      }

      const usersFromApi: User[] = employees.map((emp: any) => ({
        id: String(emp.id),
        username: emp.username || emp.name || "Sem nome",
        role: emp.role || "Administrador",
        designation: emp.sector || "Geral",
        active: !!emp.active,
        status: onlineUsers[String(emp.id)] || "offline",
      }));

      setUsers(usersFromApi);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  }, []);

  const refreshMessages = useCallback(async () => {
    if (!authUser?.id) return;
    try {
      const msgs = await fetchMessages(authUser.id);

      const normalized = msgs.map((m: any) => ({
        ...m,
        id: String(m.id),
        senderId: String(m.senderId),
        recipientId: String(m.recipientId),
      }));
      const sorted = normalized.sort((a: Message, b: Message) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setMessages(sorted);
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
    }
  }, [authUser?.id, setMessages]);

  const setUserStatus = useCallback((userId: string, status: UserStatus) => {
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
  }, []);

  const setUserActive = useCallback(() => {
    if (!authUser?.id) return;
    setUserStatus(authUser.id, 'online');
  }, [authUser?.id, setUserStatus]);

  const setUserInactive = useCallback(() => {
    if (!authUser?.id) return;
    setUserStatus(authUser.id, 'offline');
  }, [authUser?.id, setUserStatus]);

  // ================ SOCKET.IO =====================
  useEffect(() => {
    if (!authUser?.id || !tkn) {
      return;
    }

    const socket = io(
      process.env.REACT_APP_SOCKET_URL,
      {
        auth: { token: tkn },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    );
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (authUser?.id) {
        socket.emit('user:online', { userId: authUser.id });
      }
      fetchUsers().catch(err => console.error('Erro ao carregar usuários após conexão:', err));
    });

    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', (error: any) => { console.error('❌ ERRO DE CONEXÃO SOCKET.IO!', error); setIsConnected(false); });

    socket.on('message:receive', (message: Message) => {
      const normalized = { ...message, id: String(message.id), senderId: String((message as any).senderId), recipientId: String((message as any).recipientId) };
      setMessages(prev => [...prev, normalized]);
      dispatchUnreadCounts({ type: 'INCREMENT_UNREAD', userId: normalized.senderId });

      if (Notification.permission === 'granted' && document.hidden) {
        new Notification(`Nova mensagem de ${message.senderName}`, { body: message.content, icon: '/logo.png' });
      }
    });

    socket.on('message:sent', (msg) => {
      console.log('✅ Mensagem confirmada pelo servidor:', msg);

      const normalized = {
        ...msg,
        id: String(msg.id),
        senderId: String(msg.senderId),
        recipientId: String(msg.recipientId)
      };

      setMessages(prev => {
        // Remove mensagens temporárias deste sender/recipient
        const withoutTemp = prev.filter(m =>
          !m.id.startsWith('temp-') ||
          m.senderId !== normalized.senderId ||
          m.recipientId !== normalized.recipientId
        );

        const exists = withoutTemp.some(m => m.id === normalized.id);
        if (exists) return withoutTemp;

        return [...withoutTemp, normalized].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });
    });


    socket.on('message:read-receipt', ({ messageId }: { messageId: string }) => {
      setMessages(prev =>
        prev.map(msg => msg.id === String(messageId) ? { ...msg, read: true } : msg)
      );
    });

    socket.on("message:unread-count", (payload) => {
      let map: Record<string, number> = {};

      if (Array.isArray(payload)) {
        payload.forEach((item: any) => {
          const sender = String(item.sender_id ?? item.senderId ?? item.sender);
          const count = Number(item.unread_count ?? item.count ?? 0);
          if (sender) map[sender] = count;
        });
      } else if (payload && typeof payload === 'object') {
        Object.entries(payload).forEach(([k, v]) => { map[String(k)] = Number(v); });
      }

      dispatchUnreadCounts({ type: 'SET_UNREAD', unreadMap: map });
    })

    socket.on("message:new", (msg) => {

      setMessages(prev => {
        const exists = prev.some(m => m.id === msg.id);
        if (exists) return prev;

        return [...prev, msg].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });
    });


    socket.on('users:online', (onlineUserIds: string[]) => {
      setUsers(prevUsers =>
        prevUsers.map(user => ({ ...user, status: onlineUserIds.map(String).includes(user.id) ? 'online' : 'offline' }))
      );
      onlineUserIds.forEach(userId => setOnlineUserInStorage(String(userId), 'online'));
    });

    socket.on('typing:update', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) newSet.add(String(userId)); else newSet.delete(String(userId));
        return newSet;
      });
    });

    socket.on('message:error', (error) => { console.error('❌ Erro ao enviar mensagem:', error); });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [authUser?.id, tkn, fetchUsers]);


  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    if (!authUser?.id) return;
    if (!messages || messages.length === 0) return;

    const newUnreadMap: Record<string, number> = {};
    messages.forEach(msg => {
      if (String(msg.recipientId) === String(authUser.id) && !msg.read) {
        const s = String(msg.senderId);
        newUnreadMap[s] = (newUnreadMap[s] || 0) + 1;
      }
    });

    dispatchUnreadCounts({ type: 'SET_UNREAD', unreadMap: newUnreadMap });
  }, [messages, authUser?.id]);

  const sendMessage = useCallback(async (msg: Omit<Message, 'id' | 'timestamp' | 'read'>) => {
    const tempMessage: Message = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...msg,
      timestamp: new Date().toISOString(),
      read: false
    };

    try {
      setMessages(prev => {
        const newMessages = [...prev, tempMessage];
        return newMessages.sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });

      if (socketRef.current?.connected) {
        socketRef.current.emit('message:send', {
          recipientId: msg.recipientId,
          content: msg.content,
          timestamp: tempMessage.timestamp,
        });
      } else {
        console.warn('⚠️ Socket.IO desconectado. Usando API REST...');
        await sendMessageAPI({
          ...msg,
          timestamp: tempMessage.timestamp,
          read: false
        });
      }

      dispatchUnreadCounts({
        type: 'RESET_UNREAD',
        userId: String(msg.recipientId)
      });

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);

      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    }
  }, [setMessages]);

  const markMessagesRead = useCallback(async (senderId: string, recipientId: string) => {
    try {
      // local UX update first
      setMessages(prev =>
        prev.map(msg =>
          msg.senderId === String(senderId) && msg.recipientId === String(recipientId)
            ? { ...msg, read: true }
            : msg
        )
      );

      // reset counter locally
      dispatchUnreadCounts({ type: 'RESET_UNREAD', userId: String(senderId) });

      // send to API (note: API expects /messages/:userId/read-all/:senderId where userId is the recipient)
      await markMessagesReadAPI(String(recipientId), String(senderId));

      // notify sender via socket for read receipt
      if (socketRef.current?.connected) {
        const messagesToMark = messagesRef.current.filter(
          msg => msg.senderId === String(senderId) && msg.recipientId === String(recipientId) && !msg.read
        );
        messagesToMark.forEach(msg => socketRef.current?.emit('message:read', msg.id));
      }
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  }, []);

  const startTyping = useCallback((recipientId: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('typing:start', recipientId);
  }, []);

  const stopTyping = useCallback((recipientId: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('typing:stop', recipientId);
  }, []);


  useEffect(() => {
    mountedRef.current = true;
    const initializeChat = async () => {
      if (!authUser?.id) return;
      await new Promise(r => setTimeout(r, 200));

      const onlineUsers = getOnlineUsersFromStorage();
      const userStatus = onlineUsers[String(authUser.id)] || 'online';

      if (!onlineUsers[String(authUser.id)]) setOnlineUserInStorage(String(authUser.id), 'online');

      setCurrentUser({
        id: String(authUser.id),
        username: authUser.username,
        role: authUser.role,
        designation: authUser.designation,
        active: authUser.active || false,
        status: userStatus,
      });

      setUserActive();

      try {
        await fetchUsers();
        await refreshMessages();
      } catch (error) {
        console.error('Erro na inicialização:', error);
      }
    };

    initializeChat();

    return () => {
      mountedRef.current = false;
      if (authUser?.id) removeOnlineUserFromStorage(String(authUser.id));
    };
  }, [authUser?.id, fetchUsers, refreshMessages, setUserActive]);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    };
  }, []);

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
        setUnreadCounts,
        isConnected,
        typingUsers,
        startTyping,
        stopTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat deve ser usado dentro de um ChatProvider');
  return context;
};
