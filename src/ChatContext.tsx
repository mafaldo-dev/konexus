import { createContext, useContext, useState, ReactNode, useEffect, useReducer } from 'react';
import { useAuth } from './AuthContext';
import { handleAllEmployee } from './service/api/employee';
import { db } from "./firebaseConfig";
import { addDoc, collection, query, orderBy, where, onSnapshot, doc, getDocs, writeBatch } from "firebase/firestore";

export type UserStatus = 'Ativo' | 'Ausente' | 'Inativo';

export interface User {
  id: string;
  name: string;
  designation: string;
  sector: string;
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
  sendMessage: (msg: Omit<Message, 'id' | 'timestamp' | 'read'>) => void;
  markMessagesRead: (senderId: string, recipientId: string) => void;
  fetchUsers: () => Promise<void>;
  setUserInactive: () => void;
  setUserActive: () => void;
  unreadCounts: UnreadCountsState;
  setUnreadCounts: React.Dispatch<Action>;
}

const ChatContext = createContext<ChatContextData | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user: authUser } = useAuth();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, dispatchUnreadCounts] = useReducer(unreadCountsReducer, {});

  const fetchUsers = async () => {
    try {
      const employees = await handleAllEmployee();

      const usersFromApi: User[] = employees.map((emp: any) => ({
        id: emp.id.toString(),
        name: emp.username || 'Sem nome',
        designation: emp.designation || 'Sem cargo',
        sector: emp.sector || emp.designation || 'Sem setor',
        status: emp.status === true ? 'Ativo' : 'Inativo',
      }));

      setUsers(usersFromApi);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const setUserInactive = () => {
    if (!currentUser) return;
    setUserStatus(currentUser.id, 'Inativo');
  };

  const setUserActive = () => {
    if (!authUser?.id) return;

    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.id === authUser.id ? { ...u, status: 'Ativo' } : u
      )
    );

    setCurrentUser((prev) =>
      prev ? { ...prev, status: 'Ativo' } : null
    );
  };

  useEffect(() => {
    if (!authUser || !authUser.id) {
      setUsers((oldUsers) => oldUsers.map((u) => ({ ...u, status: 'Inativo' })));
      setCurrentUser(null);
      setMessages([]);
      return;
    }

    if (currentUser && currentUser.id !== authUser.id) {
      setUserStatus(currentUser.id, 'Inativo');
    }

    const newUser: User = {
      id: authUser.id,
      name: authUser.username,
      designation: authUser.designation,
      sector: authUser.sector || authUser.designation || 'Sem setor',
      status: 'Ativo',
    };

    setCurrentUser(newUser);
    fetchUsers();
    setUserActive();
  }, [authUser?.id]);

  const setUserStatus = (userId: string, status: UserStatus) => {
    setUsers(oldUsers =>
      oldUsers.map(u => (u.id === userId ? { ...u, status } : u))
    );

    if (currentUser?.id === userId) {
      setCurrentUser(curr => (curr ? { ...curr, status } : null));
    }
  };

  const sendMessage = async (msg: Omit<Message, 'id' | 'timestamp' | 'read'>) => {
    try {
      const newMessage = {
        ...msg,
        timestamp: new Date().toISOString(),
        read: false,
      };
      await addDoc(collection(db, "messages"), newMessage);
    } catch (error) {
      console.error("Erro ao enviar mensagem para o Firestore:", error);
    }
  };

  const markMessagesRead = async (senderId: string, recipientId: string) => {
    // Busca as mensagens que batem com os ids e que não foram lidas, e atualiza no Firestore
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("senderId", "==", senderId),
      where("recipientId", "==", recipientId),
      where("read", "==", false)
    );
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.forEach((docSnap) => {
      batch.update(doc(db, "messages", docSnap.id), { read: true });
    });

    await batch.commit();
  };

  // Marca usuário como Ausente após 5 min inativo
  useEffect(() => {
    if (!currentUser) return;
    const timer = setTimeout(() => {
      if (currentUser.id) {
        setUserStatus(currentUser.id, 'Ausente');
      }
    }, 5 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [currentUser]);

  // Ouve mensagens enviadas e recebidas no Firestore
  useEffect(() => {
    if (!authUser?.id) return;

    const messagesCollectionRef = collection(db, "messages");

    const sentQuery = query(
      messagesCollectionRef,
      where("senderId", "==", authUser.id),
      orderBy("timestamp")
    );

    const receivedQuery = query(
      messagesCollectionRef,
      where("recipientId", "==", authUser.id),
      orderBy("timestamp")
    );

    let sentMessages: Message[] = [];
    let receivedMessages: Message[] = [];

    const unsubscribeSent = onSnapshot(sentQuery, (snapshot) => {
      sentMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      const allMessages = [...sentMessages, ...receivedMessages];
      const uniqueMessages = Array.from(new Map(allMessages.map(msg => [msg.id, msg])).values());
      setMessages(uniqueMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
    });

    const unsubscribeReceived = onSnapshot(receivedQuery, (snapshot) => {
      receivedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      const allMessages = [...sentMessages, ...receivedMessages];
      const uniqueMessages = Array.from(new Map(allMessages.map(msg => [msg.id, msg])).values());
      setMessages(uniqueMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
    });

    return () => {
      unsubscribeSent();
      unsubscribeReceived();
    };
  }, [authUser?.id]);

  // Atualiza contagem de mensagens não lidas (unreadCounts)
  useEffect(() => {
    if (!authUser) return;

    const unreadMap: Record<string, number> = {};

    messages.forEach((msg) => {
      if (msg.recipientId === authUser.id && !msg.read) {
        unreadMap[msg.senderId] = (unreadMap[msg.senderId] || 0) + 1;
      }
    });

    dispatchUnreadCounts({ type: 'SET_UNREAD', unreadMap });
  }, [messages, authUser]);

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
        setUserInactive,
        setUserActive,
        unreadCounts,
        setUnreadCounts: dispatchUnreadCounts,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
}
