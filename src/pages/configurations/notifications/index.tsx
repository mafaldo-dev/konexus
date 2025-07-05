import { useState } from 'react';
import { Mail, Bell, MessageSquare, Save } from 'lucide-react';
import Dashboard from '../../../components/dashboard/Dashboard';

// Mock data for notification events
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

type NotificationSetting = typeof initialNotificationSettings[0];

export default function NotificationPreferences() {
  const [settings, setSettings] = useState(initialNotificationSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSettingChange = (id: string, channel: 'email' | 'push' | 'sms', value: boolean) => {
    setSettings((prevSettings) =>
      prevSettings.map((setting) =>
        setting.id === id ? { ...setting, [channel]: value } : setting
      )
    );
  };

  const handleSave = () => {
    setIsSaving(true);
    console.log('Saving notification settings:', settings);
    // Mock API call
    setTimeout(() => {
      setIsSaving(false);
      // Here you would show a success snackbar/toast
    }, 1500);
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    const category = setting.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(setting);
    return acc;
  }, {} as Record<string, NotificationSetting[]>);

  return (
    <Dashboard>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notificações</h1>
          <p className="text-slate-500 mt-1">
            Gerencie como e quando você é notificado.
          </p>
        </div>

        {/* Tabela de Preferências */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Preferências de Eventos</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-600">
                <tr>
                  <th className="p-3 font-medium">Evento</th>
                  <th className="p-3 font-medium text-center w-24">
                    <div className="flex items-center justify-center gap-2">
                      <Mail size={16} /> Email
                    </div>
                  </th>
                  <th className="p-3 font-medium text-center w-24">
                    <div className="flex items-center justify-center gap-2">
                      <Bell size={16} /> Push
                    </div>
                  </th>
                  <th className="p-3 font-medium text-center w-24">
                    <div className="flex items-center justify-center gap-2">
                      <MessageSquare size={16} /> SMS
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedSettings).map(([category, settingsInCategory]) => (
                  <>
                    <tr key={category}>
                      <td colSpan={4} className="pt-6 pb-2">
                        <h3 className="text-base font-semibold text-slate-700">{category}</h3>
                      </td>
                    </tr>
                    {settingsInCategory.map((setting) => (
                      <tr key={setting.id} className="border-b border-slate-100 last:border-none">
                        <td className="p-3 text-slate-600">{setting.description}</td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-slate-300 text-slate-600 focus:ring-slate-500 cursor-pointer"
                            checked={setting.email}
                            onChange={(e) => handleSettingChange(setting.id, 'email', e.target.checked)}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-slate-300 text-slate-600 focus:ring-slate-500 cursor-pointer"
                            checked={setting.push}
                            onChange={(e) => handleSettingChange(setting.id, 'push', e.target.checked)}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-slate-300 text-slate-600 focus:ring-slate-500 cursor-pointer"
                            checked={setting.sms}
                            onChange={(e) => handleSettingChange(setting.id, 'sms', e.target.checked)}
                          />
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ação de Salvar */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </Dashboard>
  );
}
