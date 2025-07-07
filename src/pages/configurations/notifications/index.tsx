// NotificationPreferences.tsx
import { useState, useEffect } from 'react';
import { Inbox, Mail, Bell, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import Dashboard from '../../../components/dashboard/Dashboard';

const initialNotificationSettings = [
  {
    id: 'new_lead',
    category: 'CRM',
    description: 'Quando um novo lead é atribuído a você',
    email: true,
    push: true,
    sms: false,
  },
  {
    id: 'stock_alert',
    category: 'Estoque',
    description: 'Quando um produto atinge o estoque mínimo',
    email: true,
    push: false,
    sms: true,
  },
  {
    id: 'sale_completed',
    category: 'Vendas',
    description: 'Quando uma venda é finalizada com sucesso',
    email: true,
    push: true,
    sms: false,
  },
  {
    id: 'invoice_due',
    category: 'Financeiro',
    description: 'Lembrete de fatura prestes a vencer',
    email: true,
    push: false,
    sms: true,
  },
];

interface NotificationSetting {
  id: string;
  category: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

interface Message {
  id: string;
  sector: string;
  sender: string;
  message: string;
  timestamp: string;
}

export default function NotificationPreferences() {
  const [settings, setSettings] = useState<NotificationSetting[]>(initialNotificationSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('todos');

  useEffect(() => {
    const storedSettings = localStorage.getItem('notification_settings');
    const storedMessages = localStorage.getItem('sector_messages');

    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }

    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  }, []);

  const handleSettingChange = (id: string, channel: 'email' | 'push' | 'sms', value: boolean) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [channel]: value } : s))
    );
  };

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('notification_settings', JSON.stringify(settings));
    setTimeout(() => {
      setIsSaving(false);
    }, 1500);
  };

  const groupedSettings = settings.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, NotificationSetting[]>);

  const filteredMessages = selectedSector === 'todos'
    ? messages
    : messages.filter((msg) => msg.sector === selectedSector);

  const sectors = ['todos', ...Array.from(new Set(messages.map((m) => m.sector)))];

  return (
    <Dashboard>
      <div className="min-h-screen p-6 space-y-10">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-3xl font-bold">Central de Notificações</h1>
          <p className="text-slate-500 mt-1">
            Gerencie preferências e visualize alertas enviados por setores da empresa.
          </p>
        </div>

        {/* Preferências modernizadas */}
        <div className="grid gap-6">
          {Object.entries(groupedSettings).map(([category, list]) => (
            <div key={category} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">
                {category}
              </h2>
              <div className="grid gap-4">
                {list.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 p-4 hover:bg-slate-100 transition"
                  >
                    <span className="text-slate-700 font-medium w-2/3">{setting.description}</span>
                    <div className="flex gap-4">
                      {(['email', 'push', 'sms'] as const).map((channel) => (
                        <label
                          key={channel}
                          className="flex items-center gap-1 text-sm text-slate-600"
                        >
                          <input
                            type="checkbox"
                            checked={setting[channel]}
                            onChange={(e) =>
                              handleSettingChange(setting.id, channel, e.target.checked)
                            }
                            className="accent-slate-600 w-4 h-4"
                          />
                          {channel === 'email' ? <Mail size={16} /> : null}
                          {channel === 'push' ? <Bell size={16} /> : null}
                          {channel === 'sms' ? <MessageSquare size={16} /> : null}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Caixa de Mensagens */}
        <div className="bg-white rounded shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Inbox size={20} /> Caixa de Entrada
            </h2>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector === 'todos' ? 'Todos os Setores' : sector}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-l-4 pl-4 py-2 rounded bg-slate-50 shadow"
                  style={{
                    borderColor:
                      msg.sector === 'Expedição'
                        ? '#38bdf8'
                        : msg.sector === 'Financeiro'
                        ? '#a78bfa'
                        : '#22c55e',
                  }}
                >
                  <div className="text-sm">
                    <strong>{msg.sender}</strong> ({msg.sector})
                  </div>
                  <div className="text-sm text-slate-600">{msg.message}</div>
                  <div className="text-xs text-slate-400 mt-1">{msg.timestamp}</div>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Nenhuma mensagem encontrada.</p>
            )}
          </div>
        </div>

        {/* Botão de salvar */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : '✔️ Salvar alterações'}
          </button>
        </div>
      </div>
    </Dashboard>
  );
}