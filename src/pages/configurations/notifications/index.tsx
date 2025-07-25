import { useState, useEffect } from 'react';
import { Inbox, Mail, Bell, Save, MessageSquare, Settings, Filter, ChevronDown, ChevronUp, X, Check, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from '../../../components/dashboard/Dashboard';

const initialNotificationSettings = [
  {
    id: 'new_lead',
    category: 'CRM',
    description: 'Quando um novo lead é atribuído a você',
    email: true,
    push: true,
    sms: false,
    icon: '👤',
  },
  {
    id: 'stock_alert',
    category: 'Estoque',
    description: 'Quando um produto atinge o estoque mínimo',
    email: true,
    push: false,
    sms: true,
    icon: '📦',
  },
  {
    id: 'sale_completed',
    category: 'Vendas',
    description: 'Quando uma venda é finalizada com sucesso',
    email: true,
    push: true,
    sms: false,
    icon: '💰',
  },
  {
    id: 'invoice_due',
    category: 'Financeiro',
    description: 'Lembrete de fatura prestes a vencer',
    email: true,
    push: false,
    sms: true,
    icon: '🧾',
  },
];

interface NotificationSetting {
  id: string;
  category: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  icon: string;
}

interface Message {
  id: string;
  sector: string;
  sender: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

const sectorColors: Record<string, string> = {
  'CRM': 'bg-blue-100 text-blue-800',
  'Estoque': 'bg-amber-100 text-amber-800',
  'Vendas': 'bg-green-100 text-green-800',
  'Financeiro': 'bg-purple-100 text-purple-800',
  'Expedição': 'bg-sky-100 text-sky-800',
  'default': 'bg-gray-100 text-gray-800'
};

const priorityColors = {
  'low': 'bg-gray-100 text-gray-800',
  'medium': 'bg-yellow-100 text-yellow-800',
  'high': 'bg-red-100 text-red-800'
};

export default function NotificationPreferences() {
  const [settings, setSettings] = useState<NotificationSetting[]>(initialNotificationSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('todos');
  const [showSettings, setShowSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [notificationSound, setNotificationSound] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [unreadCount] = useState(
    messages.filter((msg) => !msg.read).length
  );

  useEffect(() => {
    // Simulando dados de mensagens mais realistas

    const storedSettings = localStorage.getItem('notification_settings');
    const storedMessages = localStorage.getItem('sector_messages') || 'Nenhuma Notificação de sistema';
    const storedPrefs = JSON.parse(localStorage.getItem('notification_prefs') || '{}');

    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
    setMessages(JSON.parse(storedMessages));
    setNotificationSound(storedPrefs.sound ?? true);
    setDarkMode(storedPrefs.darkMode ?? false);
  }, []);

  const handleSettingChange = (id: string, channel: 'email' | 'push' | 'sms', value: boolean) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, [channel]: value } : s));
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    localStorage.setItem('notification_settings', JSON.stringify(settings));
    localStorage.setItem('notification_prefs', JSON.stringify({
      sound: notificationSound,
      darkMode: darkMode
    }));

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const handleMarkAsRead = (id: string) => {
    const updatedMessages = messages.map(msg =>
      msg.id === id ? { ...msg, read: true } : msg
    );

    setMessages(updatedMessages);

    // Atualiza o localStorage apenas com as mensagens não lidas restantes
    const unreadMessages = updatedMessages.filter(msg => !msg.read);

    if (unreadMessages.length === 0) {
      localStorage.removeItem('sector_messages');
    } else {
      localStorage.setItem('sector_messages', JSON.stringify(unreadMessages));
    }
  };


  const handleDeleteMessage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const toggleMessageExpand = (id: string) => {
    setExpandedMessage(expandedMessage === id ? null : id);
  };

  const groupedSettings = settings.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, NotificationSetting[]>);

  const filteredMessages = selectedSector === 'todos'
    ? messages
    : messages.filter(msg => msg.sector === selectedSector);

  const sectors = ['todos', ...Array.from(new Set(messages.map(m => m.sector)))];

  return (
    <Dashboard>
      <div className={`min-h-screen p-4 md:p-8 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50'}`}>
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Inbox className="text-blue-600" size={28} />
            Caixa de Entrada Corporativa
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Centralize e gerencie todas as notificações importantes da empresa
          </p>
        </div>

        {/* Barra de Controle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-64">
            <Filter size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <select
              value={selectedSector}
              onChange={e => setSelectedSector(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300'
                }`}
            >
              {sectors.map(sector => (
                <option key={sector} value={sector}>
                  {sector === 'todos' ? 'Todos os setores' : sector}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {unreadCount > 0 && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                }`}>
                {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
              </span>
            )}

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${showSettings
                ? 'bg-blue-600 text-white'
                : darkMode
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-white hover:bg-gray-100'
                } shadow-sm`}
            >
              <Sliders size={16} />
              <span>Configurações</span>
            </button>
          </div>
        </div>

        {/* Painel de Configurações */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`mb-6 rounded-xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                } border`}
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Settings size={20} className="text-blue-600" />
                  Configurações de Notificação
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Configurações Gerais */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Preferências Gerais</h3>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="flex-1">Som de notificação</span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={notificationSound}
                            onChange={() => setNotificationSound(!notificationSound)}
                            className="sr-only"
                          />
                          <div className={`block w-12 h-6 rounded-full transition-colors ${notificationSound ? 'bg-blue-500' : 'bg-gray-300'
                            }`}></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${notificationSound ? 'transform translate-x-6' : ''
                            }`}></div>
                        </div>
                      </label>

                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="flex-1">Modo Escuro</span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={darkMode}
                            onChange={() => setDarkMode(!darkMode)}
                            className="sr-only"
                          />
                          <div className={`block w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-blue-500' : 'bg-gray-300'
                            }`}></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${darkMode ? 'transform translate-x-6' : ''
                            }`}></div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Configurações por Canal */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Canais de Notificação</h3>
                    <div className="space-y-2">
                      {(['email', 'push', 'sms'] as const).map(channel => (
                        <div key={channel} className={`p-3 rounded-lg flex items-center gap-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
                          }`}>
                          {channel === 'email' && <Mail size={18} className="text-red-500" />}
                          {channel === 'push' && <Bell size={18} className="text-blue-500" />}
                          {channel === 'sms' && <MessageSquare size={18} className="text-green-500" />}
                          <span className="flex-1 capitalize">{channel}</span>
                          <span className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}>
                            {settings.some(s => s[channel]) ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Configurações Detalhadas por Categoria */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Configurações por Categoria</h3>
                  <div className="space-y-4">
                    {Object.entries(groupedSettings).map(([category, list]) => (
                      <div key={category} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <span className={`inline-block w-3 h-3 rounded-full ${sectorColors[category]?.replace('bg-', 'bg-opacity-100 ') || 'bg-gray-300'
                            }`}></span>
                          {category}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {list.map(setting => (
                            <div key={setting.id} className="text-sm">
                              <p className="font-medium">{setting.description}</p>
                              <div className="flex gap-4 mt-1">
                                {(['email', 'push', 'sms'] as const).map(channel => (
                                  <label key={channel} className="flex items-center gap-1 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={setting[channel]}
                                      onChange={e => handleSettingChange(setting.id, channel, e.target.checked)}
                                      className={`rounded ${darkMode
                                        ? 'bg-gray-600 border-gray-500 text-blue-500'
                                        : 'border-gray-300 text-blue-600'
                                        }`}
                                    />
                                    {channel.charAt(0).toUpperCase() + channel.slice(1)}
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-end items-center gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {saveSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-green-500 text-sm flex items-center gap-1"
                    >
                      <Check size={16} />
                      <span>Configurações salvas!</span>
                    </motion.div>
                  )}
                  <button
                    onClick={() => setShowSettings(false)}
                    className={`px-4 py-2 rounded-lg font-medium ${darkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-70 transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Salvar alterações
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de Mensagens */}
        <div className={`rounded-xl shadow-sm overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border`}>
          {filteredMessages.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMessages.map(msg => (
                <motion.li
                  key={msg.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`transition-colors ${!msg.read ? (
                    darkMode ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-50'
                  ) : ''}`}
                >
                  <div
                    className={`p-4 cursor-pointer hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                    onClick={() => {
                      handleMarkAsRead(msg.id);
                      toggleMessageExpand(msg.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${sectorColors[msg.sector] || sectorColors.default
                        }`}>
                        {msg.sector.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={`text-sm font-medium truncate ${!msg.read ? (darkMode ? 'text-white' : 'text-gray-900') : (darkMode ? 'text-gray-300' : 'text-gray-600')
                            }`}>
                            {msg.sender}
                          </h3>

                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[msg.priority]
                              }`}>
                              {msg.priority === 'high' ? 'Alta' : msg.priority === 'medium' ? 'Média' : 'Baixa'}
                            </span>

                            <span className={`text-xs whitespace-nowrap ${darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                              {msg.timestamp}
                            </span>

                            <button
                              onClick={(e) => handleDeleteMessage(msg.id, e)}
                              className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                                }`}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>

                        <p className={`text-sm mt-1 ${!msg.read ? (darkMode ? 'text-gray-100' : 'text-gray-800') : (darkMode ? 'text-gray-400' : 'text-gray-600')
                          }`}>
                          {msg.message.split('.').shift()}...
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${sectorColors[msg.sector] || sectorColors.default
                            }`}>
                            {msg.sector}
                          </span>

                          {!msg.read && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'
                              }`}>
                              Não lida
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMessageExpand(msg.id);
                        }}
                        className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                          }`}
                      >
                        {expandedMessage === msg.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>

                    <AnimatePresence>
                      {expandedMessage === msg.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`mt-3 pl-3 border-l-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'
                            }`}
                        >
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            {msg.message}
                          </p>
                          <div className="flex gap-3 mt-3">
                            <button className={`text-xs px-3 py-1 rounded ${darkMode
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                              }`}>
                              Marcar como lida
                            </button>
                            <button className={`text-xs px-3 py-1 rounded ${darkMode
                              ? 'bg-gray-700 hover:bg-gray-600 text-white'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                              }`}>
                              Arquivar
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.li>
              ))}
            </ul>
          ) : (
            <div className={`p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <Inbox size={48} className={`mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'
                }`} />
              <h3 className={`text-lg font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Nenhuma mensagem encontrada
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                {selectedSector === 'todos'
                  ? 'Sua caixa de entrada está vazia'
                  : `Nenhuma mensagem do setor ${selectedSector}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </Dashboard>
  );
}