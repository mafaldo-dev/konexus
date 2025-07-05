import { useState } from 'react';
import { Shield, Save } from 'lucide-react';
import Dashboard from '../../../components/dashboard/Dashboard';

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export default function SecuritySettingsPage() {
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  });

  const [ipBlockList, setIpBlockList] = useState('203.0.113.1\n198.51.100.2');
  const [isLoading, setIsLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);

  const handlePolicyChange = (field: keyof PasswordPolicy, value: boolean | number) => {
    setPasswordPolicy(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setIsLoading(true);
    console.log("Saving Security Settings:", { passwordPolicy, ipBlockList });

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    }, 1500);
  };

  return (
    <Dashboard>
      <div className="p-6 bg-slate-50 min-h-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Shield size={32} className="text-slate-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Segurança e Acesso</h1>
            <p className="text-sm text-slate-500">Gerencie as políticas de senha e controle de acesso por IP.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna de Configurações */}
          <div className="lg:col-span-2 space-y-8">
            {/* Card de Política de Senha */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-4 mb-6">Política de Senha</h2>
              <div className="space-y-6">
                {/* Minimum Length */}
                <div className="flex items-center justify-between">
                  <label htmlFor="minLength" className="text-sm font-medium text-slate-700">Comprimento mínimo</label>
                  <input
                    id="minLength"
                    type="number"
                    value={passwordPolicy.minLength}
                    onChange={(e) => handlePolicyChange('minLength', parseInt(e.target.value, 10))}
                    className="w-20 px-3 py-1 border border-slate-300 rounded-md text-center"
                  />
                </div>

                {/* Checkbox options */}
                {/* Checkbox options */}
                {Object.entries({
                  requireUppercase: 'Exigir letra maiúscula (A-Z)',
                  requireLowercase: 'Exigir letra minúscula (a-z)',
                  requireNumbers: 'Exigir números (0-9)',
                  requireSpecialChars: 'Exigir caractere especial (!@#$...)'
                }).map(([key, label]) => {
                  const typedKey = key as keyof Omit<PasswordPolicy, 'minLength'>;
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <label htmlFor={key} className="text-sm text-slate-600">{label}</label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          id={key}
                          checked={passwordPolicy[typedKey]}
                          onChange={(e) => handlePolicyChange(typedKey, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card de Bloqueio de IP */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-4 mb-6">Lista de Bloqueio de IP</h2>
              <div>
                <label htmlFor="ipBlockList" className="block text-sm font-medium text-slate-700 mb-2">
                  Endereços de IP bloqueados
                </label>
                <textarea
                  id="ipBlockList"
                  rows={6}
                  value={ipBlockList}
                  onChange={(e) => setIpBlockList(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-700 focus:border-slate-700 transition"
                  placeholder="Digite um IP por linha..."
                />
                <p className="text-xs text-slate-500 mt-2">
                  Usuários tentando acessar de um desses IPs serão bloqueados. Separe os IPs com uma quebra de linha.
                </p>
              </div>
            </div>
          </div>

          {/* Coluna de Ações */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Ações</h3>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-slate-700 text-white font-semibold py-3 px-4 rounded-md hover:bg-slate-800 transition disabled:opacity-50"
              >
                <Save size={18} />
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>

        {/* Snackbar */}
        {showSnackbar && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in-out">
            Configurações de segurança salvas com sucesso!
          </div>
        )}
      </div>

    </Dashboard>
  );
}