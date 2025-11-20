import { useState, useEffect } from 'react';
import { MessageSquare, User } from 'lucide-react';
import { useAuth } from '../../../AuthContext';
import { menuItems } from '../menu';
import MenuItem from './MenuItem';
import logo from '../../../assets/image/konexuslogo.png';

import { useChat } from '../../../ChatContext';
import FloatingChat from '../ChatComunication';
import ReportProblemChat from './ChatReport';
import { version } from '../../../version';

export default function Sidebar({ sidebarCollapsed }: any) {
  const { user } = useAuth();
  const designation = user?.role || "";
  const username = user?.username || "Usuário";
  const userSector = designation;

  const { currentUser, setUserActive } = useChat();
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (user && currentUser) {
      setUserActive();
    }
  }, []);

  function canAccess(allowed: string[]) {
    const result = allowed.includes(designation);
    return result;
  }
  
  // Salvar mensagens no localStorage
  const handleSendMessage = (msg: any) => {
    const stored = localStorage.getItem('sector_messages');
    const messages = stored ? JSON.parse(stored) : [];
    messages.push(msg);
    localStorage.setItem('sector_messages', JSON.stringify(messages));
  };

  return (
    <>
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-72'} bg-slate-900 text-slate-100 transition-all duration-300 fixed h-full z-50 shadow-xl flex flex-col justify-between`}>
        <div>
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <img src={logo || "/placeholder.svg"} alt="Logo Konexus" className="w-8 h-8" />
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-lg font-bold text-white">Konéxus</h1>
                  <p className="text-xs text-slate-400">Sistema Integrado</p>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-3 space-y-1">
              {menuItems.map((item) => (
                <MenuItem key={item.key} item={item} sidebarCollapsed={sidebarCollapsed} canAccess={canAccess} />
              ))}
            </div>
          </nav>
        </div>

        {/* Rodapé */}
        <div>
          {!sidebarCollapsed && (
            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{username}</p>
                  <p className="text-xs text-slate-400 truncate">{designation}</p>
                </div>
              </div>
              <div className="mt-4 text-center text-xs text-slate-500">
                Versão: {version}
              </div>
            </div>
          )}

          {/* Botão de abrir chat de problema */}
          <button
            onClick={() => setChatOpen(true)}
            className="w-full p-3 text-sm bg-slate-800 hover:bg-slate-700 transition-colors text-white font-semibold flex items-center justify-center"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Reportar Problema
          </button>
        </div>
      </aside>

      {/* Chat de Reporte */}
      <ReportProblemChat
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onSendMessage={handleSendMessage}
        userSector={userSector}
        username={username}
      />

      {/* Chat global entre setores */}
      <FloatingChat />
    </>
  );
}