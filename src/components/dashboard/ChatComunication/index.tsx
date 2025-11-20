import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../AuthContext';
import { useChat, User } from '../../../ChatContext';
import { fetchConversationAPI } from '../../../service/api/chat';

export default function FloatingChat() {
  const { user: authUser } = useAuth();
  const {
    users,
    messages,
    sendMessage,
    markMessagesRead,
    unreadCounts,
    setUnreadCounts,
    isConnected,
    typingUsers,
    startTyping,
    stopTyping,
  } = useChat();

  const [chatOpen, setChatOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; user: User | null }>({
    visible: false,
    x: 0,
    y: 0,
    user: null,
  });
  const [popupUser, setPopupUser] = useState<User | null>(null);
  const [popupMessage, setPopupMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [activeConversationMessages, setActiveConversationMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openChatWithUser = async (user: User) => {
    if (!authUser) return;

    setChatOpen(true);
    setPopupUser(user);
    setPopupMessage('');
    closeContextMenu();
    setIsLoading(true);

    try {
      const conv = await fetchConversationAPI(String(authUser.id), String(user.id));

      const normalized = conv.map((m: any) => ({
        id: String(m.id),
        senderId: String(m.sender_id),
        senderName: m.sender_name,
        recipientId: String(m.recipient_id),
        content: m.content,
        timestamp: m.timestamp,
        read: !!m.read,
        sector: "Geral"
      }));

      const sorted = normalized.sort((a: any, b: any) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setActiveConversationMessages(sorted);
      setIsLoading(false);

      await markMessagesRead(user.id, authUser.id!);
      setUnreadCounts({ type: 'RESET_UNREAD', userId: user.id });

    } catch (error) {
      console.error('Erro ao abrir conversa:', error);
      setIsLoading(false);

      const filtered = messages.filter(m =>
        (String(m.senderId) === String(authUser.id) && String(m.recipientId) === String(user.id)) ||
        (String(m.senderId) === String(user.id) && String(m.recipientId) === String(authUser.id))
      );
      const sorted = filtered.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setActiveConversationMessages(sorted);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversationMessages, popupUser]);

  useEffect(() => {
    if (!popupUser || !authUser || messages.length === 0) return;

    const relevantMessages = messages.filter(m =>
      (String(m.senderId) === String(authUser.id) && String(m.recipientId) === String(popupUser.id)) ||
      (String(m.senderId) === String(popupUser.id) && String(m.recipientId) === String(authUser.id))
    );

    if (relevantMessages.length === 0) return;

    const allMessages = [...activeConversationMessages, ...relevantMessages];

    const uniqueMessages = allMessages.filter((msg, index, self) =>
      index === self.findIndex(m => m.id === msg.id)
    );

    const sorted = uniqueMessages.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    setActiveConversationMessages(sorted);

  }, [messages]); 


  const handleContextMenu = (e: React.MouseEvent, user: User) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, user });
  };

  const closeContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0, user: null });

  const handleWave = () => {
    if (!contextMenu.user || !authUser) return;
    sendMessage({
      senderId: authUser.id!,
      senderName: authUser.username,
      sector: authUser.designation || "Geral",
      recipientId: contextMenu.user.id,
      content: '👋',
    });
    closeContextMenu();
  };

  const handleSendPopupMessage = () => {
    if (!popupMessage.trim() || !popupUser || !authUser) return;
  
    sendMessage({
      senderId: authUser.id!,
      senderName: authUser.username,
      sector: authUser.designation || "Geral",
      recipientId: popupUser.id,
      content: popupMessage.trim(),
    });
    setPopupMessage('');
    setIsTyping(false);
  };

  const handleMessageChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPopupMessage(value);
    if (!popupUser) return;

    if (value.trim() && !isTyping) {
      setIsTyping(true);
      startTyping(popupUser.id);
    }
    if (!value.trim() && isTyping) {
      setIsTyping(false);
      stopTyping(popupUser.id);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { setIsTyping(false); stopTyping(popupUser.id); }, 3000);
  };

  const handleFileClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && popupUser && authUser) {
      sendMessage({
        senderId: authUser.id!,
        senderName: authUser.username,
        sector: authUser.designation || "Geral",
        recipientId: popupUser.id,
        content: `📎 Enviou um arquivo: ${file.name}`,
      });
      e.target.value = '';
    }
  };

  if (!authUser) return null;

  const usersList = users.filter((u, i, self) => i === self.findIndex((other) => other.id === u.id));
  const conversationMessages = activeConversationMessages;
  const totalUnread = Object.values(unreadCounts).reduce((acc, val) => acc + (Number(val) || 0), 0);
  const isUserTyping = popupUser ? typingUsers.has(popupUser.id) : false;

  return (
    <>
      <button onClick={() => setChatOpen(prev => !prev)} style={{ position: 'fixed', bottom: '90px', right: '55px', zIndex: 9999 }}
        className={`${isConnected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-500'} text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center relative`}
        title={isConnected ? 'Chat Online' : 'Reconectando...'}>
        💬
        {!isConnected && <span className="absolute top-0 left-0 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />}
        {totalUnread > 0 && <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{totalUnread}</span>}
      </button>

      {chatOpen && (
        <div className="fixed bottom-20 right-4 w-[350px] h-[600px] bg-white rounded-lg shadow-lg border border-slate-300 flex flex-col z-50">
          <div className="bg-slate-900 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
            <div><h3 className="font-semibold text-lg">{authUser.username}</h3><p className="text-sm text-gray-300">{authUser.role}{!isConnected && <span className="ml-2 text-yellow-400">⚠️ Reconectando...</span>}</p></div>
            <button onClick={() => setChatOpen(false)} className="hover:text-red-400 font-bold text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {usersList.length === 0 && <p className="text-center text-gray-400">Nenhum usuário disponível</p>}
            {usersList.map((u) => (
              <div key={u.id} className="relative flex items-center gap-2 bg-gray-100 hover:bg-gray-200 w-full px-4 py-2 rounded cursor-pointer"
                onContextMenu={(e) => handleContextMenu(e, u)} onClick={() => openChatWithUser(u)}>
                <div className="relative">
                  <span className={`w-3 h-3 rounded-full ${u.status === 'online' ? 'bg-green-500' : u.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'}`} />
                  {u.status === 'online' && <span className="absolute top-0 left-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75" />}
                </div>
                <div className="flex-1">
                  <span className={`text-sm font-medium ${u.id === authUser.id ? 'font-bold' : ''}`}>{u.username}{u.id === authUser.id ? ' (Você)' : ''}</span>
                  {typingUsers.has(u.id) && u.id !== authUser.id && <div className="text-xs text-blue-500 italic">digitando...</div>}
                </div>
                {u.id !== authUser.id && (Number(unreadCounts[u.id]) || 0) > 0 && (
                  <span className="ml-auto bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{unreadCounts[u.id]}</span>
                )}

                {contextMenu.visible && contextMenu.user?.id === u.id && (
                  <div className="fixed z-50 bg-white border rounded shadow w-40" style={{ left: contextMenu.x, top: contextMenu.y }} onMouseLeave={closeContextMenu}>
                    <button className="w-full text-left px-4 py-2 hover:bg-slate-100" onClick={() => openChatWithUser(u)}>Enviar - Ver chat</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-slate-100" onClick={handleWave}>👋 Acenar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {popupUser && (
        <div className="fixed bottom-20 right-1/2 translate-x-1/2 w-[400px] bg-white border rounded shadow-lg z-50 flex flex-col max-h-[500px]">
          <div className="bg-slate-900 text-white px-4 py-2 rounded-t flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span>Conversando com {popupUser.username}</span>
              <span className={`w-2 h-2 rounded-full ${popupUser.status === 'online' ? 'bg-green-400' : 'bg-gray-400'}`} />
              {isLoading && <span className="text-yellow-400 text-sm">Carregando...</span>}
            </div>
            <button onClick={() => setPopupUser(null)} className="hover:text-red-400 font-bold text-xl">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm flex flex-col">
            {isLoading ? (
              <p className="text-center text-gray-400">Carregando mensagens...</p>
            ) : conversationMessages.length === 0 ? (
              <p className="text-center text-gray-400">Nenhuma mensagem nesta conversa</p>
            ) : (
              conversationMessages.map((m: any) => {
                const isMyMessage = String(m.senderId) === String(authUser.id);

                return (
                  <div
                    key={m.id}
                    className={`p-2 rounded max-w-[70%] ${isMyMessage
                        ? 'bg-blue-500 text-white self-end'
                        : 'bg-gray-200 text-gray-800 self-start'
                      }`}
                  >
                    <div className="font-medium text-xs mb-1">
                      {!isMyMessage && `${m.senderName}:`}
                    </div>
                    <div>{m.content}</div>
                    <div className={`text-xs mt-1 flex items-center gap-1 ${isMyMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                      {new Date(m.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {isMyMessage && (
                        <span className={m.read ? 'text-green-300' : 'text-blue-200'}>
                          {m.read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {isUserTyping && (
              <div className="self-start bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-1">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                </div>
                <span className="text-xs text-gray-500 ml-1">digitando...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 flex items-center gap-2 border-t border-gray-200">
            <textarea
              rows={1}
              value={popupMessage}
              onChange={handleMessageChange}
              className="flex-1 border border-slate-300 rounded px-3 py-2 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite sua mensagem..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendPopupMessage();
                }
              }}
            />
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
            <button onClick={handleFileClick} className="text-xl px-2 hover:bg-gray-200 rounded">➕</button>
            <button
              onClick={handleSendPopupMessage}
              disabled={!popupMessage.trim() || !isConnected}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!isConnected ? 'Aguardando conexão...' : 'Enviar mensagem'}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
}