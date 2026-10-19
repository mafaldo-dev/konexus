import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../../AuthContext';
import Dashboard from '../../../components/dashboard/Dashboard';
import { createCompany, getCompany, updateCompany, uploadCompanyLogo } from '../../../services/companyService';
import { Company, CompanyData } from '../../../services/companyService';

interface CompanyManagementProps {}

export default function CompanyManagement() {
  const navigate = useNavigate();
  const { user, company } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Dados para criação/edição
  const [formData, setFormData] = useState<Partial<CompanyData>>({
    companyName: '',
    adminUsername: '',
    adminPassword: '',
    installation_id: 1,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    if (!user || user.role !== 'Administrador') return;
    try {
      setIsLoading(true);
      // Se houver empresa do usuário, carrega seus dados
      if (company?.id) {
        const response = await getCompany(company.id);
        if (response.ok && response.data) {
          setCompanies([response.data as Company]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.adminUsername || !formData.adminPassword) {
      Swal.fire('Atenção', 'Preencha todos os campos obrigatórios!', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const data: CompanyData = {
        companyName: formData.companyName!,
        adminUsername: formData.adminUsername!,
        adminPassword: formData.adminPassword!,
        installation_id: formData.installation_id ?? 1,
        icon: undefined,
      };

      const response = await createCompany(data);
      if (response.ok && response.data) {
        Swal.fire('Sucesso', 'Empresa criada com sucesso!', 'success');
        setShowCreateModal(false);
        setFormData({ companyName: '', adminUsername: '', adminPassword: '', installation_id: 1 });
        await loadCompanies();
      } else {
        throw new Error(response.error || 'Erro ao criar empresa');
      }
    } catch (error: any) {
      console.error('Erro ao criar empresa:', error);
      Swal.fire('Erro', error.message || 'Erro ao criar empresa!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCompany = async () => {
    if (!editingCompany?.id) return;

    setIsLoading(true);
    try {
      const updatedFields: Record<string, any> = {};
      if (formData.companyName) updatedFields.name = formData.companyName;
      if (formData.adminUsername) updatedFields.username = formData.adminUsername;

      const response = await updateCompany(editingCompany.id, updatedFields);
      if (response.ok) {
        Swal.fire('Sucesso', 'Empresa atualizada com sucesso!', 'success');
        setEditingCompany(null);
        await loadCompanies();
      } else {
        throw new Error(response.error || 'Erro ao atualizar empresa');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar empresa:', error);
      Swal.fire('Erro', error.message || 'Erro ao atualizar empresa!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoFile(e.target.files?.[0] ?? null);
  };

  const handleUploadLogo = async () => {
    if (!editingCompany?.id || !logoFile) return;

    const formDataLogo = new FormData();
    formDataLogo.append('logo', logoFile);
    formDataLogo.append('companyId', String(editingCompany.id));

    setIsLoading(true);
    try {
      const response = await uploadCompanyLogo(formDataLogo);
      if (response.ok) {
        Swal.fire('Sucesso', 'Logo enviado com sucesso!', 'success');
        await loadCompanies();
      } else {
        throw new Error(response.error || 'Erro ao enviar logo');
      }
    } catch (error: any) {
      console.error('Erro ao enviar logo:', error);
      Swal.fire('Erro', error.message || 'Erro ao enviar logo!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const canManageCompanies = user?.role === 'Administrador';

  return (
    <Dashboard>
      <div className="min-h-screen bg-slate-50 p-6">
        {!canManageCompanies ? (
          <div className="max-w-7xl mx-auto text-center py-20">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Acesso Restrito</h1>
            <p className="text-gray-600 mb-8">Apenas administradores do sistema podem gerenciar empresas.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Voltar ao Dashboard
            </button>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Empresas</h1>
                <p className="text-gray-600 mt-1">Cadastre e gerencie as empresas do sistema Konexus ERP.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <span>+</span> Nova Empresa
              </button>
            </div>

            {isLoading && (
              <div className="text-center py-10">
                <p className="text-gray-600">Carregando empresas...</p>
              </div>
            )}

            {!isLoading && companies.length === 0 && (
              <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">Nenhuma empresa cadastrada.</p>
              </div>
            )}

            {!isLoading && companies.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {companies.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900">{c.name}</td>
                        <td className="px-6 py-4 text-gray-600">{c.cnpj || '-'}</td>
                        <td className="px-6 py-4 text-gray-600">{c.email || '-'}</td>
                        <td className="px-6 py-4 text-gray-600">{c.phone || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setFormData({
                                companyName: c.name || '',
                                adminUsername: '',
                                adminPassword: '',
                              });
                              setEditingCompany(c);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal de Edição de Empresa */}
            {editingCompany && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="px-8 pt-8 pb-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Editar Empresa</h2>
                    <p className="text-gray-500 text-sm">{editingCompany.name}</p>
                  </div>
                  <div className="p-8 space-y-4 overflow-y-auto max-h-[60vh]">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                      <input
                        type="text"
                        value={formData.companyName || ''}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      {logoFile && <p className="text-xs text-gray-500 mt-1">{logoFile.name}</p>}
                    </div>
                  </div>
                  <div className="p-8 border-t border-gray-200 flex justify-end gap-3">
                    <button
                      onClick={() => { setEditingCompany(null); setLogoFile(null); }}
                      className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleUploadLogo}
                      disabled={isLoading || !logoFile}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Enviar Logo
                    </button>
                    <button
                      onClick={handleUpdateCompany}
                      disabled={isLoading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Criação de Empresa */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="px-8 pt-8 pb-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Criar Nova Empresa</h2>
                    <p className="text-gray-500 text-sm">Preencha os dados para cadastrar uma nova empresa no sistema.</p>
                  </div>
                  <form onSubmit={handleCreateCompany} className="p-8 space-y-4 overflow-y-auto max-h-[60vh]">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa *</label>
                      <input
                        type="text"
                        value={formData.companyName || ''}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Digite o nome da empresa"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Usuário Admin *</label>
                      <input
                        type="text"
                        value={formData.adminUsername || ''}
                        onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                        placeholder="Digite o usuário administrador"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Senha Admin *</label>
                      <input
                        type="password"
                        value={formData.adminPassword || ''}
                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                        placeholder="Digite a senha do administrador"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plano de Instalação</label>
                      <select
                        value={String(formData.installation_id || 1)}
                        onChange={(e) => setFormData({ ...formData, installation_id: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="1">Starter</option>
                        <option value="2">Premium</option>
                        <option value="3">Plus</option>
                      </select>
                    </div>
                  </form>
                  <div className="p-8 border-t border-gray-200 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Criar Empresa
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Dashboard>
  );
}
