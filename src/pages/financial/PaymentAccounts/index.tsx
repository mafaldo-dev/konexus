import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, DollarSign, FileText, Plus, Download, ChevronDown, MoreVertical, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../../components/dashboard/Dashboard';

interface PayableAccount {
  id: string;
  supplier: string;
  documentNumber: string;
  dueDate: string;
  amount: number;
  paid: boolean;
  category: string;
  paymentDate?: string;
}

const AccountsPayable: React.FC = () => {
  const [accounts, setAccounts] = useState<PayableAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<PayableAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Simulação de busca de dados
  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      try {
        // Simulação de API
        const mockData: PayableAccount[] = [
          {
            id: '1',
            supplier: 'Fornecedor A Ltda',
            documentNumber: 'NF-2023-001',
            dueDate: '2023-06-15',
            amount: 12500.00,
            paid: false,
            category: 'Matéria-prima'
          },
          {
            id: '2',
            supplier: 'Energia Elétrica',
            documentNumber: 'FAT-2023-005',
            dueDate: '2023-06-10',
            amount: 3500.00,
            paid: true,
            category: 'Utilidades',
            paymentDate: '2023-06-05'
          },
          // ... mais dados mockados
        ];
        setAccounts(mockData);
        setFilteredAccounts(mockData);
      } catch (error) {
        console.error('Erro ao buscar contas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  // Filtros
  useEffect(() => {
    let result = accounts;

    // Filtro por status
    if (statusFilter !== 'all') {
      result = result.filter(account => account.paid === (statusFilter === 'paid'));
    }

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(account =>
        account.supplier.toLowerCase().includes(term) ||
        account.documentNumber.toLowerCase().includes(term)
      );
    }

    // Filtro por data
    result = result.filter(account => {
      const dueDate = new Date(account.dueDate);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      return dueDate >= start && dueDate <= end;
    });

    setFilteredAccounts(result);
  }, [accounts, statusFilter, searchTerm, dateRange]);

  const handlePayAccount = (id: string) => {
    // Implementar lógica de pagamento
    console.log('Pagar conta:', id);
    navigate(`/financeiro/contas-a-pagar/pagar/${id}`);
  };

  const handleAddAccount = () => {
    navigate('/financeiro/contas-a-pagar/nova');
  };

  const handleExport = () => {
    // Implementar exportação
    console.log('Exportar dados');
  };

  return (
    <Dashboard>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="text-blue-600" />
                Contas a Pagar
              </h1>
              <p className="text-gray-600">Gerencie as obrigações financeiras da sua empresa</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Download className="w-5 h-5" />
                Exportar
              </button>
              <button
                onClick={handleAddAccount}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Nova Conta
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar fornecedor ou documento"
                  className="pl-10 w-full border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'paid' | 'unpaid')}
                className="border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos os Status</option>
                <option value="paid">Pagas</option>
                <option value="unpaid">A Pagar</option>
              </select>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="text-gray-400 w-5 h-5" />
                  </div>
                  <input
                    type="date"
                    className="pl-10 w-full border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                </div>
                <span className="flex items-center">a</span>
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="text-gray-400 w-5 h-5" />
                  </div>
                  <input
                    type="date"
                    className="pl-10 w-full border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-1">Total a Pagar</h3>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  filteredAccounts
                    .filter(a => !a.paid)
                    .reduce((sum, account) => sum + account.amount, 0)
                )}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-1">Vencidas</h3>
              <p className="text-2xl font-bold text-red-600">
                {filteredAccounts.filter(a =>
                  !a.paid && new Date(a.dueDate) < new Date()
                ).length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-1">Pagas (Período)</h3>
              <p className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  filteredAccounts
                    .filter(a => a.paid)
                    .reduce((sum, account) => sum + account.amount, 0)
                )}
              </p>
            </div>
          </div>

          {/* Tabela de Contas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Nenhuma conta encontrada com os filtros aplicados
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((account) => (
                      <tr key={account.id} className={account.paid ? 'bg-gray-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{account.supplier}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {account.documentNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center ${new Date(account.dueDate) < new Date() && !account.paid ? 'text-red-600' : 'text-gray-900'}`}>
                            {new Date(account.dueDate).toLocaleDateString('pt-BR')}
                            {new Date(account.dueDate) < new Date() && !account.paid && (
                              <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Vencida</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {account.paid ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Paga
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {account.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {!account.paid && (
                            <button
                              onClick={() => handlePayAccount(account.id)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Registrar Pagamento
                            </button>
                          )}
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação (opcional) */}
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Mostrando {filteredAccounts.length} de {accounts.length} contas
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded text-gray-700 disabled:opacity-50">
                Anterior
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded bg-blue-50 text-blue-600 border-blue-200">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-gray-700">
                2
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-gray-700">
                Próximo
              </button>
            </div>
          </div>
        </div>
      </div>
    </Dashboard>
  );
};

export default AccountsPayable;