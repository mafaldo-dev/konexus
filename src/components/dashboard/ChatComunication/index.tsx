import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../AuthContext';
import { useChat, User } from '../../../ChatContext';


export default function FloatingChat() {
  const { user: authUser } = useAuth();
  const {
    users,
    messages,
    sendMessage,
    markMessagesRead,
    unreadCounts,
    setUnreadCounts,
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authUser) return;

    const unreadMap: Record<string, number> = {};

    messages.forEach((msg) => {
      if (msg.recipientId === authUser.id && !msg.read) {
        unreadMap[msg.senderId] = (unreadMap[msg.senderId] || 0) + 1;
      }
    });

    setUnreadCounts({ type: 'SET_UNREAD', unreadMap });
  }, [messages, authUser, setUnreadCounts]);


  const openChatWithUser = async (user: User) => {
    if (!authUser) return;

    // Espera antes de abrir o chat
    setTimeout(async () => {
      setChatOpen(true);
      setPopupUser(user);
      setPopupMessage('');
      closeContextMenu();

      await markMessagesRead(user.id, authUser.id!);

      setUnreadCounts({ type: 'RESET_UNREAD', userId: user.id });
    }, 500); // 400ms costuma ser suficiente (4 segundos é muito)
  };


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, popupUser]);

  const handleContextMenu = (e: React.MouseEvent, user: User) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, user });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, user: null });
  };


  const handleWave = () => {
    if (!contextMenu.user || !authUser) return;

    sendMessage({
      senderId: authUser.id!,
      senderName: authUser.username,
      recipientId: contextMenu.user.id,
      sector: contextMenu.user.sector,
      content: '👋',
    });

    closeContextMenu();
  };

  const handleSendPopupMessage = () => {
    if (!popupMessage.trim() || !popupUser || !authUser) return;

    sendMessage({
      senderId: authUser.id!,
      senderName: authUser.username,
      recipientId: popupUser.id,
      sector: popupUser.sector,
      content: popupMessage.trim(),
    });

    setPopupMessage('');
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && popupUser && authUser) {
      sendMessage({
        senderId: authUser.id!,
        senderName: authUser.username,
        recipientId: popupUser.id,
        sector: popupUser.sector,
        content: `📎 Enviou um arquivo: ${file.name}`,
      });
      e.target.value = '';
    }
  };

  if (!authUser) return null;

  const usersList = users.filter((u, i, self) => i === self.findIndex((other) => other.id === u.id));

  const conversationMessages = popupUser
    ? messages.filter(
      (m) =>
        (m.senderId === authUser.id && m.recipientId === popupUser.id) ||
        (m.senderId === popupUser.id && m.recipientId === authUser.id)
    )
    : [];

  const getMenuPosition = (x: number, y: number) => {
    const menuWidth = 160;
    const menuHeight = 80;
    const padding = 10;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const left = x + menuWidth + padding > vw ? vw - menuWidth - padding : x;
    const top = y + menuHeight + padding > vh ? vh - menuHeight - padding : y;

    return { left, top };
  };

  const totalUnread = Object.values(unreadCounts).reduce((acc, val) => acc + val, 0);

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setChatOpen((prev) => !prev)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center"
      >
        💬
        {totalUnread > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {totalUnread}
          </span>
        )}
      </button>

      {/* Lista de usuários */}
      {chatOpen && (
        <div className="fixed bottom-20 right-4 w-[350px] h-[600px] bg-white rounded-lg shadow-lg border border-slate-300 flex flex-col z-50">
          <div className="bg-slate-900 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">{authUser.username}</h3>
              <p className="text-sm text-gray-300">{authUser.designation}</p>
            </div>
            <button onClick={() => setChatOpen(false)} className="hover:text-red-400 font-bold text-xl">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {usersList.length === 0 && <p className="text-center text-gray-400">Nenhum usuário disponível</p>}

            {usersList.map((u) => (
              <div
                key={u.id}
                className="relative flex items-center gap-2 bg-gray-100 hover:bg-gray-200 w-full px-4 py-2 rounded cursor-pointer"
                onContextMenu={(e) => handleContextMenu(e, u)}
              >
                <span className={`w-3 h-3 rounded-full ${u.status === 'Ativo' ? 'bg-green-500' : u.status === 'Ausente' ? 'bg-yellow-400' : 'bg-gray-400'}`} />
                <span className={`text-sm font-medium ${u.id === authUser.id ? 'font-bold' : ''}`}>
                  {u.name}{u.id === authUser.id ? ' (Você)' : ''}
                </span>

                {u.id !== authUser.id && unreadCounts[u.id] > 0 && (
                  <span className="ml-auto bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCounts[u.id]}
                  </span>
                )}

                {contextMenu.visible && contextMenu.user?.id === u.id && (
                  <div
                    className="fixed z-50 bg-white border rounded shadow w-40"
                    style={getMenuPosition(contextMenu.x, contextMenu.y)}
                    onMouseLeave={closeContextMenu}
                  >
                    <button className="w-full text-left px-4 py-2 hover:bg-slate-100" onClick={() => openChatWithUser(u)}>
                      Enviar - Ver chat
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-slate-100" onClick={handleWave}>
                      👋 Acenar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popup da conversa */}
      {popupUser && (
        <div className="fixed bottom-20 right-1/2 translate-x-1/2 w-[400px] bg-white border rounded shadow-lg z-50 flex flex-col max-h-[500px]">
          <div className="bg-slate-900 text-white px-4 py-2 rounded-t flex justify-between items-center">
            <span>Conversando com {popupUser.name}</span>
            <button onClick={() => setPopupUser(null)} className="hover:text-red-400 font-bold text-xl">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm flex flex-col">
            {conversationMessages.length === 0 && (
              <p className="text-center text-gray-400">Nenhuma mensagem nesta conversa</p>
            )}

            {conversationMessages.map((m) => (
              <div
                key={m.id}
                className={`p-2 rounded max-w-[70%] ${m.senderId === authUser.id ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'}`}
              >
                <div>{m.content}</div>
                <div className="text-xs text-gray-400 mt-1">{m.timestamp}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 flex items-center gap-2 border-t border-gray-200">
            <textarea
              rows={1}
              value={popupMessage}
              onChange={(e) => setPopupMessage(e.target.value)}
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
              disabled={!popupMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2 disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
