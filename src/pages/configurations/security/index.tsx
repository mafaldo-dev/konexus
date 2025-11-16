import { useState } from 'react';
import { Shield, Save, Building2, Upload } from 'lucide-react';
import Dashboard from '../../../components/dashboard/Dashboard';
import { useAuth } from '../../../AuthContext';
import { updateDataCompany } from '../../../service/api/Administrador/configs';

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'company' | 'security'>('company');
  const { company } = useAuth();

  // Dados da empresa
  const [companyData, setCompanyData] = useState({
    name: company?.name || '',
    cnpj: company?.cnpj || '',
    email: company?.email || '',
    phone: company?.phone || '',
    logo: null as File | string | null | any, 
    previewLogo: company?.companyIcon || '',
  });

  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  });

  //const [ipBlockList, setIpBlockList] = useState('203.0.113.1\n198.51.100.2');
  const [isLoading, setIsLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);

  const handleCompanyChange = (field: keyof typeof companyData, value: string) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompanyData(prev => ({
      ...prev,
      logo: file, 
      previewLogo: URL.createObjectURL(file), 
    }));
  };

  const handleSave = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (!company?.id) throw new Error('ID da empresa não encontrado');

      const updatedFields: any = {};

      // Campos normais
      if (companyData.email && companyData.email.trim() !== '')
        updatedFields.email = companyData.email;

      if (companyData.phone && companyData.phone.trim() !== '')
        updatedFields.phone = companyData.phone;

      if (companyData.cnpj && companyData.cnpj.trim() !== '')
        updatedFields.cnpj = companyData.cnpj;

      if (companyData.logo !== null && companyData.logo !== undefined) {
        updatedFields.icon = companyData.logo;
      }

      if (Object.keys(updatedFields).length === 0) {
        alert('Nenhum campo preenchido para atualizar.');
        setIsLoading(false);
        return;
      }

      const result = await updateDataCompany(company.id, updatedFields);

      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);

    } catch (err) {
      console.error("Erro ao atualizar dados:", err);
      alert('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  const handlePolicyChange = (field: keyof PasswordPolicy, value: boolean | number) => {
    setPasswordPolicy(prev => ({ ...prev, [field]: value }));
  };

  const formatCNPJ = (value: string) =>
    value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);

  const formatPhone = (value: string) =>
    value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{5})$/, '$1-$2')
      .slice(0, 15);

  return (
    <Dashboard>
      <div className="p-6 bg-slate-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Building2 size={32} className="text-slate-700" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Painel Administrativo</h1>
            <p className="text-sm text-slate-500">
              Gerencie as informações da empresa e as políticas de segurança.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'company'
              ? 'border-b-2 border-slate-700 text-slate-800'
              : 'text-slate-500 hover:text-slate-700'
              }`}
            onClick={() => setActiveTab('company')}
          >
            Empresa
          </button>
          <button
            className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'security'
              ? 'border-b-2 border-slate-700 text-slate-800'
              : 'text-slate-500 hover:text-slate-700'
              }`}
            onClick={() => setActiveTab('security')}
          >
            Segurança
          </button>
        </div>

        {/* Aba Empresa */}
        {activeTab === 'company' && (
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-4">
              Informações da Empresa
            </h2>

            {/* Logo */}
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-32 h-32 border border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden">
                {companyData.previewLogo ? (
                  <img
                    src={companyData.previewLogo}
                    alt="Logo da empresa"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Upload className="text-slate-400 w-8 h-8" />
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Logo da Empresa
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="text-sm text-slate-600"
                />
                {companyData.logo && (
                  <p className="text-xs text-slate-500 mt-2">
                    {companyData.logo instanceof File 
                      ? `Arquivo: ${companyData.logo.name}` 
                      : `Referência: ${companyData.logo}`
                    }
                  </p>
                )}
              </div>
            </div>

            {/* Campos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Nome da Empresa</label>
                <input
                  type="text"
                  value={companyData.name}
                  onChange={(e) => handleCompanyChange('name', e.target.value)}
                  className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-700 focus:border-slate-700"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">CNPJ</label>
                <input
                  type="text"
                  value={companyData.cnpj}
                  onChange={(e) => handleCompanyChange('cnpj', formatCNPJ(e.target.value))}
                  className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-700 focus:border-slate-700"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">E-mail</label>
                <input
                  type="email"
                  value={companyData.email}
                  onChange={(e) => handleCompanyChange('email', e.target.value)}
                  className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-700 focus:border-slate-700"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Telefone</label>
                <input
                  type="text"
                  value={companyData.phone}
                  onChange={(e) => handleCompanyChange('phone', formatPhone(e.target.value))}
                  className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-700 focus:border-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 bg-slate-700 text-white px-6 py-2 rounded-md hover:bg-slate-800 transition disabled:opacity-50"
              >
                <Save size={18} />
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        )}

        {/* Snackbar */}
        {showSnackbar && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in-out">
            Alterações salvas com sucesso!
          </div>
        )}
      </div>
    </Dashboard>
  );
}