import { useEffect, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Eye, EyeOff, Info, Loader2,
  Settings, Save, RefreshCw, Building2, Key, Shield, Upload,
  Power, Globe, FileCheck, TrendingUp
} from 'lucide-react';
import Dashboard from '../../../components/dashboard/Dashboard';
import { useSystemStatus, StatusMessageType } from '../../../SystemStatusContext';
import { maskCpfCnpj } from '../../../utils/masks';
import { PlugNotasConfig } from '../../../service/interfaces/financial/plugnotas';
import { useAuth } from '../../../AuthContext';


export default function PlugNotasManagementPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showCertPassword, setShowCertPassword] = useState(false);
  const [showPrefeituraPassword, setShowPrefeituraPassword] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const { addMessage } = useSystemStatus();

  const [formData, setFormData] = useState<PlugNotasConfig>({
    company_id: 0,
    api_key: '',
    cnpj: '',
    razao_social: '',
    ambiente: 'homologacao',
    producao: false,
    ativo: true,
    regime_tributario: '1',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.REACT_APP_SOCKET_URL_LOCAL}/plugnotas/config`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

      const result = await response.json();

      if (result.success && result.configured) {
        setIsConfigured(true);
        setFormData({
          ...result.data,
          api_key: '',
          senha_certificado: '',
          senha_prefeitura: '',
        });
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar config:', error);
      addMessage(StatusMessageType.ERROR, 'Erro ao carregar configuração', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof PlugNotasConfig, value: any) => {
    if (field === 'cnpj') value = maskCpfCnpj(value);
    
    if (field === 'ambiente') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        producao: value === 'producao',
      }));
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pfx') && !file.name.endsWith('.p12')) {
      addMessage(StatusMessageType.ERROR, 'Arquivo inválido', 'Apenas arquivos .pfx ou .p12');
      return;
    }

    setCertificateFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const base64Clean = base64.split(',')[1];
      
      setFormData(prev => ({
        ...prev,
        certificado_pfx: base64Clean,
      }));
      
      addMessage(StatusMessageType.INFO, 'Certificado carregado', `Arquivo: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    // Validações básicas
    if (!formData.api_key && !isConfigured) {
      addMessage(StatusMessageType.WARNING, 'API Key é obrigatória');
      return;
    }

    if (!formData.cnpj || formData.cnpj.replace(/\D/g, '').length !== 14) {
      addMessage(StatusMessageType.WARNING, 'CNPJ inválido');
      return;
    }

    if (formData.producao && formData.certificado_pfx && !formData.senha_certificado) {
      addMessage(StatusMessageType.WARNING, 'Informe a senha do certificado');
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${process.env.REACT_APP_SOCKET_URL_LOCAL}/plugnotas/config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

      const result = await response.json();

      if (result.success) {
        addMessage(StatusMessageType.INFO, 'Configuração salva com sucesso!');
        setIsConfigured(true);
        loadConfig();
      } else {
        addMessage(StatusMessageType.ERROR, 'Erro ao salvar', result.error);
      }
    } catch (error: any) {
      addMessage(StatusMessageType.ERROR, 'Erro ao salvar configuração', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.REACT_APP_SOCKET_URL_LOCAL}/plugnotas/config/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ativo: !formData.ativo }),
      });

      const result = await response.json();

      if (result.success) {
        setFormData(prev => ({ ...prev, ativo: result.data.ativo }));
        addMessage(StatusMessageType.INFO, 
          `PlugNotas ${result.data.ativo ? 'ativado' : 'desativado'}`);
      }
    } catch (error: any) {
      addMessage(StatusMessageType.ERROR, 'Erro ao alterar status', error.message);
    }
  };

  return (
    <Dashboard>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Settings size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Gerenciar PlugNotas
              </h1>
              <p className="text-sm text-slate-500">
                Configure apenas o essencial para emitir NF-e
              </p>
            </div>
          </div>

          {isConfigured && (
            <div className="flex items-center gap-3">
              {formData.status_certificado === 'valido' && (
                <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  ✓ Certificado OK
                </div>
              )}
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                formData.ativo 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {formData.ativo ? '🟢 Ativo' : '⚫ Inativo'}
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-slate-500" size={40} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Alert Info */}
            {!isConfigured && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Cadastro via PlugNotas</p>
                  <p className="text-blue-600">
                    A empresa deve ser cadastrada primeiro no{' '}
                    <a 
                      href="https://plugnotas.com.br" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      painel do PlugNotas
                    </a>
                    . Aqui você só gerencia a chave e configurações técnicas.
                  </p>
                </div>
              </div>
            )}

            {/* Card 1: Dados Básicos */}
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Building2 size={20} />
                Dados Básicos
              </h2>

              <div className="space-y-4">
                {/* Info da Empresa (readonly) */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">
                    📋 Dados da Empresa (vêm do cadastro)
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs">CNPJ</p>
                      <p className="font-medium text-slate-800">{formData.cnpj || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Razão Social</p>
                      <p className="font-medium text-slate-800">{formData.razao_social || '-'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Key size={16} />
                    X-API-KEY do PlugNotas *
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={formData.api_key}
                      onChange={(e) => handleInputChange('api_key', e.target.value)}
                      placeholder="Chave fornecida pelo PlugNotas"
                      className="w-full px-4 py-2.5 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {isConfigured && formData.api_key_masked && (
                    <p className="text-xs text-slate-500 mt-1">Atual: {formData.api_key_masked}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <TrendingUp size={16} />
                    Regime Tributário
                  </label>
                  <select
                    value={formData.regime_tributario}
                    onChange={(e) => handleInputChange('regime_tributario', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">Simples Nacional</option>
                    <option value="2">Simples Nacional - Excesso</option>
                    <option value="3">Regime Normal</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Globe size={16} />
                    Ambiente
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleInputChange('ambiente', 'homologacao')}
                      className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                        formData.ambiente === 'homologacao'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      🧪 Homologação
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('ambiente', 'producao')}
                      className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                        formData.ambiente === 'producao'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      🚀 Produção
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Certificado Digital */}
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Shield size={20} />
                Certificado Digital (NF-e)
              </h2>

              {formData.ambiente === 'producao' && !formData.certificado_pfx && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                  <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Certificado obrigatório para emitir NF-e em produção
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Arquivo .pfx ou .p12
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept=".pfx,.p12"
                      onChange={handleCertificateUpload}
                      className="hidden"
                      id="cert-upload"
                    />
                    <label htmlFor="cert-upload" className="cursor-pointer">
                      <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600">
                        {certificateFile ? certificateFile.name : 'Clique para fazer upload'}
                      </p>
                    </label>
                  </div>
                  {formData.certificado_pfx && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 size={16} />
                      Certificado carregado
                    </div>
                  )}
                </div>

                {formData.certificado_pfx && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Senha do Certificado *
                    </label>
                    <div className="relative">
                      <input
                        type={showCertPassword ? 'text' : 'password'}
                        value={formData.senha_certificado || ''}
                        onChange={(e) => handleInputChange('senha_certificado', e.target.value)}
                        placeholder="Senha do .pfx"
                        className="w-full px-4 py-2.5 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCertPassword(!showCertPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCertPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Data de Validade
                  </label>
                  <input
                    type="date"
                    value={formData.validade_certificado || ''}
                    onChange={(e) => handleInputChange('validade_certificado', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.validade_certificado && (
                    <p className="text-xs mt-1">
                      {new Date(formData.validade_certificado) < new Date() ? (
                        <span className="text-red-600 font-medium">⚠️ Expirado</span>
                      ) : (
                        <span className="text-green-600">✓ Válido</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: NFS-e (opcional) */}
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <FileCheck size={20} />
                NFS-e (Nota Fiscal de Serviço)
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Apenas se sua cidade exigir login na prefeitura
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Usuário Portal Prefeitura
                  </label>
                  <input
                    type="text"
                    value={formData.usuario_prefeitura || ''}
                    onChange={(e) => handleInputChange('usuario_prefeitura', e.target.value)}
                    placeholder="Login portal da prefeitura"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Senha Portal Prefeitura
                  </label>
                  <div className="relative">
                    <input
                      type={showPrefeituraPassword ? 'text' : 'password'}
                      value={formData.senha_prefeitura || ''}
                      onChange={(e) => handleInputChange('senha_prefeitura', e.target.value)}
                      placeholder="Senha portal da prefeitura"
                      className="w-full px-4 py-2.5 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPrefeituraPassword(!showPrefeituraPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPrefeituraPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Controle */}
            {isConfigured && (
              <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Power size={18} className="text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">
                      Integração Ativa
                    </span>
                  </div>
                  <button
                    onClick={handleToggleActive}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      formData.ativo ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        formData.ativo ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Salvar
                  </>
                )}
              </button>

              {isConfigured && (
                <button
                  onClick={loadConfig}
                  className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 flex items-center gap-2 font-medium transition-colors"
                >
                  <RefreshCw size={18} />
                </button>
              )}
            </div>

            {/* Info Footer */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                ℹ️ Importante
              </h3>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li>• A empresa deve ser cadastrada primeiro no <strong>painel do PlugNotas</strong></li>
                <li>• Aqui você gerencia apenas configurações técnicas</li>
                <li>• Certificado obrigatório para <strong>NF-e em produção</strong></li>
                <li>• Dados da prefeitura só para <strong>NFS-e</strong> em cidades que exigem</li>
                {formData.updated_at && (
                  <li className="pt-2 border-t border-slate-200 text-slate-500 italic">
                    Última atualização: {new Date(formData.updated_at).toLocaleString('pt-BR')}
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </Dashboard>
  );
}