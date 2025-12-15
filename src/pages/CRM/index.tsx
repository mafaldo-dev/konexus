import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, Plus, X, Edit2, Trash2, Phone, Mail,
    DollarSign, MoreVertical, TrendingUp, Target, Users, BarChart3,
    CheckCircle, AlertCircle, Clock,
    MapPin, FileText, Hash,
    RefreshCw, Building, Calendar, Filter, ChevronDown, ChevronRight,
    Star, Upload, Download, Eye
} from 'lucide-react';

import { handleAllCustomers } from '../../service/api/Administrador/customer/clients';
import { Customer, Deal, Stats } from '../../service/interfaces';
import Dashboard from '../../components/dashboard/Dashboard';
import { maskCpfCnpj } from '../../utils/masks';

const CRMModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'customers' | 'deals' | 'pipeline' | 'analytics'>('customers');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'customer' | 'deal'>('customer');
    const [editingItem, setEditingItem] = useState<Customer | Deal | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalCustomer: 0,
        totalDeals: 0,
        pipelineValue: 0,
        winRate: 0,
        activeCustomers: 0
    });

    // Form states
    const [formData, setFormData] = useState<Partial<Customer & Deal>>({
        address: {
            id: '',
            city: '',
            number: 0,
            street: '',
            zip: '',
            state: '',
            city_code: '',
            neighborhood: '',
            type: 'billing'
        }
    });

    const statusConfig = {
        active: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Ativo' },
        inactive: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle, label: 'Inativo' },
        lead: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock, label: 'Lead' },
        prospect: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Target, label: 'Prospect' }
    };

    const stageConfig: any = {
        prospecting: { color: 'bg-blue-100 text-blue-800', width: '15%', label: 'Prospecção' },
        qualification: { color: 'bg-cyan-100 text-cyan-800', width: '30%', label: 'Qualificação' },
        proposal: { color: 'bg-yellow-100 text-yellow-800', width: '50%', label: 'Proposta' },
        negotiation: { color: 'bg-orange-100 text-orange-800', width: '70%', label: 'Negociação' },
        'closed-won': { color: 'bg-green-100 text-green-800', width: '100%', label: 'Ganho' },
        'closed-lost': { color: 'bg-red-100 text-red-800', width: '100%', label: 'Perdido' }
    };

    const priorityConfig = {
        high: { color: 'bg-red-100 text-red-800', label: 'Alta' },
        medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Média' },
        low: { color: 'bg-blue-100 text-blue-800', label: 'Baixa' }
    };

    // Função para criar um objeto address com valores padrão
    const getDefaultAddress = () => ({
        id: '',
        city: '',
        number: 0,
        street: '',
        zip: '',
        state: '',
        city_code: '',
        neighborhood: '',
        type: 'billing' as const
    });

    // Função para garantir que o address tenha todas as propriedades necessárias
    const ensureAddress = (address?: Customer['address']): Customer['address'] => {
        if (!address) return getDefaultAddress();

        return {
            id: address.id || '',
            city: address.city || '',
            number: address.number || 0,
            street: address.street || '',
            zip: address.zip || '',
            state: address.state || '',
            city_code: address.city_code || '',
            neighborhood: address.neighborhood || '',
            type: address.type || 'billing'
        };
    };

    // Fetch customers from API
    const loadAllCustomers = async () => {
        try {
            setLoading(true);
            setError(null);

            // Call your API endpoint
            const response = await handleAllCustomers();

            // Transform API data to match our structure
            const formattedCustomers = response.map((customer: Customer) => ({
                ...customer,
                status: customer.status || 'active',
                createdAt: customer.createdAt || new Date().toISOString().split('T')[0],
                address: ensureAddress(customer.address)
            }));

            setCustomers(formattedCustomers);

        } catch (err) {
            console.error('Error fetching customers:', err);
            setError('Erro ao carregar clientes. Tente novamente mais tarde.');

            // Fallback to mock data if API fails
            const mockCustomers: Customer[] = [
                {
                    id: 1,
                    name: 'João Silva',
                    phone: '(11) 98765-4321',
                    email: 'joao@empresa.com',
                    code: 'CLI001',
                    status: 'active',
                    cpf_cnpj: '123.456.789-00',
                    address: getDefaultAddress(),
                    createdAt: '2024-01-15'
                },
                {
                    id: 2,
                    name: 'Maria Santos',
                    phone: '(21) 97654-3210',
                    email: 'maria@startup.com',
                    code: 'CLI002',
                    status: 'prospect',
                    cpf_cnpj: '987.654.321-00',
                    address: getDefaultAddress(),
                    createdAt: '2024-11-20'
                }
            ];
            mockCustomers[0].address = {
                id: '1',
                city: 'São Paulo',
                number: 123,
                street: 'Rua das Flores',
                zip: '01234-567',
                state: 'SP',
                city_code: '3550308',
                neighborhood: 'Centro',
                type: 'billing'
            };
            mockCustomers[1].address = {
                id: '2',
                city: 'Rio de Janeiro',
                number: 456,
                street: 'Avenida Brasil',
                zip: '20000-000',
                state: 'RJ',
                city_code: '3304557',
                neighborhood: 'Copacabana',
                type: 'billing'
            };

            setCustomers(mockCustomers);
        } finally {
            setLoading(false);
        }
    };

    // Load initial data
    useEffect(() => {
        loadAllCustomers();

        // Mock deals data (you can create a similar API function for deals)
        const mockDeals: Deal[] = [
            {
                id: '1',
                contactId: '1',
                title: 'Expansão de Licenças',
                value: 50000,
                stage: 'negotiation',
                probability: 75,
                expectedCloseDate: '2024-12-20',
                notes: 'Negociação final de termos',
                priority: 'high'
            },
            {
                id: '2',
                contactId: '2',
                title: 'Implementação Sistema',
                value: 85000,
                stage: 'proposal',
                probability: 50,
                expectedCloseDate: '2025-01-15',
                notes: 'Proposta enviada, aguardando retorno',
                priority: 'medium'
            },
            {
                id: '3',
                contactId: '1',
                title: 'Manutenção Mensal',
                value: 15000,
                stage: 'closed-won',
                probability: 100,
                expectedCloseDate: '2024-12-01',
                notes: 'Contrato assinado',
                priority: 'low'
            }
        ];
        setDeals(mockDeals);
    }, []);

    // Calculate stats
    useEffect(() => {
        const totalCustomer = customers.length;
        const totalDeals = deals.length;
        const pipelineValue = deals.reduce((sum, deal) => sum + deal.value, 0);
        const wonDeals = deals.filter(d => d.stage === 'closed-won').length;
        const totalActiveDeals = deals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage)).length;
        const winRate = totalActiveDeals > 0 ? Math.round((wonDeals / totalActiveDeals) * 100) : 0;
        const activeCustomers = customers.filter(c => c.status === 'active').length;

        setStats({
            totalCustomer,
            totalDeals,
            pipelineValue,
            winRate,
            activeCustomers
        });
    }, [customers, deals]);

    const filteredCustomers = useMemo(() => {
        return customers.filter(customer => {
            const matchesSearch =
                customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.cpf_cnpj.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesFilter = filterStatus === 'all' || customer.status === filterStatus;

            return matchesSearch && matchesFilter;
        });
    }, [customers, searchTerm, filterStatus]);

    const toggleCustomerSelection = (id: string) => {
        setSelectedCustomers(prev =>
            prev.includes(id) ? prev.filter(customerId => customerId !== id) : [...prev, id]
        );
    };

    const selectAllCustomers = () => {
        if (selectedCustomers.length === filteredCustomers.length) {
            setSelectedCustomers([]);
        } else {
            setSelectedCustomers(filteredCustomers.map(c => c.id?.toString() || ''));
        }
    };

    const openModal = (type: 'customer' | 'deal', item?: Customer | Deal) => {
        setModalType(type);
        setEditingItem(item || null);

        if (type === 'customer' && item) {
            const customerItem = item as Customer;
            setFormData({
                ...customerItem,
                address: ensureAddress(customerItem.address)
            });
        } else {
            setFormData(item || {
                address: getDefaultAddress()
            });
        }

        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormData({
            address: getDefaultAddress()
        });
    };

    const handleSave = async () => {
        try {
            if (modalType === 'customer') {
                const customerData: Customer = {
                    id: editingItem?.id || Date.now(),
                    name: formData.name || '',
                    phone: formData.phone || '',
                    email: formData.email || '',
                    code: formData.code || '',
                    status: formData.status || 'active',
                    cpf_cnpj: formData.cpf_cnpj || '',
                    address: ensureAddress(formData.address),
                    createdAt: editingItem?.createdAt || new Date().toISOString().split('T')[0]
                };

                if (editingItem) {
                    // Update existing customer
                    // TODO: Implement API call for updating customer
                    setCustomers(customers.map(c =>
                        c.id === editingItem.id ? customerData : c
                    ));
                } else {
                    // Create new customer
                    // TODO: Implement API call for creating customer
                    setCustomers([...customers, customerData]);
                }
            } else {
                // Handle deal save (using mock for now)
                if (editingItem) {
                    setDeals(deals.map(d => d.id === editingItem.id ? { ...d, ...formData } as Deal : d));
                } else {
                    const newDeal: Deal = {
                        id: Date.now().toString(),
                        contactId: formData.contactId?.toString() || '',
                        title: formData.title || '',
                        value: formData.value || 0,
                        stage: (formData.stage as Deal['stage']) || 'prospecting',
                        probability: formData.probability || 0,
                        expectedCloseDate: formData.expectedCloseDate || '',
                        notes: formData.notes || '',
                        priority: (formData.priority as Deal['priority']) || 'medium'
                    };
                    setDeals([...deals, newDeal]);
                }
            }
            closeModal();
        } catch (err) {
            console.error('Error saving:', err);
            alert('Erro ao salvar. Verifique os dados e tente novamente.');
        }
    };

    const handleDelete = async (id: string, type: 'customer' | 'deal') => {
        if (window.confirm(`Tem certeza que deseja excluir este ${type === 'customer' ? 'cliente' : 'negociação'}?`)) {
            try {
                if (type === 'customer') {
                    // TODO: Implement API call for deleting customer
                    setCustomers(customers.filter(c => c.id?.toString() !== id));
                } else {
                    setDeals(deals.filter(d => d.id !== id));
                }
            } catch (err) {
                console.error('Error deleting:', err);
                alert('Erro ao excluir. Tente novamente.');
            }
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const getCustomerById = (id: string) => customers.find(c => c.id?.toString() === id);

    const pipelineStages = [
        { key: 'prospecting', label: 'Prospecção', count: deals.filter(d => d.stage === 'prospecting').length },
        { key: 'qualification', label: 'Qualificação', count: deals.filter(d => d.stage === 'qualification').length },
        { key: 'proposal', label: 'Proposta', count: deals.filter(d => d.stage === 'proposal').length },
        { key: 'negotiation', label: 'Negociação', count: deals.filter(d => d.stage === 'negotiation').length },
        { key: 'closed-won', label: 'Ganho', count: deals.filter(d => d.stage === 'closed-won').length },
        { key: 'closed-lost', label: 'Perdido', count: deals.filter(d => d.stage === 'closed-lost').length }
    ];

    const dealsByStage = useMemo(() => {
        return pipelineStages.reduce((acc, stage) => {
            acc[stage.key] = deals.filter(d => d.stage === stage.key);
            return acc;
        }, {} as Record<string, Deal[]>);
    }, [deals]);

    const renderCustomerAvatar = (customer: Customer) => (
        <div className="bg-gradient-to-br from-slate-500 to-blue-700 w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold">
            {customer.name.charAt(0)}
        </div>
    );


    if (loading && customers.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando clientes...</p>
                </div>
            </div>
        );
    }

    return (
        <Dashboard>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-600 to-blue-900 rounded-2xl shadow-xl p-6 mb-8 text-white">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold mb-2">CRM Dashboard</h1>
                                <p className="text-blue-100">Gerencie seus clientes e negociações de forma eficiente</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={loadAllCustomers}
                                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl transition-all duration-200"
                                >
                                    <RefreshCw size={18} />
                                    Atualizar
                                </button>
                                <button
                                    onClick={() => openModal(activeTab === 'pipeline' || activeTab === 'analytics' ? 'deal' : activeTab === 'deals' ? 'deal' : 'customer')}
                                    className="flex items-center gap-2 bg-white text-blue-700 hover:bg-gray-100 px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    <Plus size={20} />
                                    {activeTab === 'customers' ? 'Novo Cliente' : 'Nova Negociação'}
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-blue-100">Total de Clientes</p>
                                        <p className="text-2xl font-bold">{stats.totalCustomer}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-blue-100">Clientes Ativos</p>
                                        <p className="text-2xl font-bold">{stats.activeCustomers}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <DollarSign size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-blue-100">Valor do Pipeline</p>
                                        <p className="text-2xl font-bold">{formatCurrency(stats.pipelineValue)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <TrendingUp size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-blue-100">Taxa de Sucesso</p>
                                        <p className="text-2xl font-bold">{stats.winRate}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 bg-white/10 backdrop-blur-sm rounded-xl p-1">
                            {[
                                { id: 'customers', label: 'Clientes', icon: Users },
                                { id: 'deals', label: 'Negociações', icon: Target },
                                { id: 'pipeline', label: 'Pipeline', icon: BarChart3 },
                                { id: 'analytics', label: 'Analytics', icon: TrendingUp }
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 flex-1 justify-center ${activeTab === tab.id
                                            ? 'bg-white text-blue-700 shadow-lg'
                                            : 'text-blue-100 hover:bg-white/10'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="text-red-600" size={20} />
                                <p className="text-red-800">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Filters and Search */}
                    {activeTab !== 'pipeline' && activeTab !== 'analytics' && (
                        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
                            <div className="flex flex-col md:flex-row gap-4 items-center">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder={activeTab === 'customers' ? 'Buscar clientes por nome, email, código ou CPF/CNPJ...' : 'Buscar negociações...'}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                {activeTab === 'customers' && (
                                    <div className="flex gap-3 items-center">
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        >
                                            <option value="all">Todos os Status</option>
                                            <option value="active">Ativo</option>
                                            <option value="inactive">Inativo</option>
                                            <option value="lead">Lead</option>
                                            <option value="prospect">Prospect</option>
                                        </select>
                                        <button
                                            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                                            className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                                        >
                                            {viewMode === 'list' ? 'Grid' : 'Lista'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Content - Customers */}
                    {activeTab === 'customers' && (
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            {selectedCustomers.length > 0 && (
                                <div className="bg-blue-50 border-b border-blue-100 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-blue-700 font-medium">
                                            {selectedCustomers.length} cliente(s) selecionado(s)
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                            Exportar Selecionados
                                        </button>
                                        <button
                                            onClick={() => setSelectedCustomers([])}
                                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                        >
                                            Limpar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {filteredCustomers.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <Users className="text-gray-400" size={40} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum cliente encontrado</h3>
                                    <p className="text-gray-600 mb-6">Tente ajustar seus filtros ou adicionar um novo cliente.</p>
                                    <button
                                        onClick={() => openModal('customer')}
                                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                    >
                                        <Plus size={20} />
                                        Adicionar Cliente
                                    </button>
                                </div>
                            ) : (
                                <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6' : 'divide-y divide-gray-100'}`}>
                                    {filteredCustomers.map(customer => (
                                        <div key={customer.id} className={`
                    ${viewMode === 'list' ? 'p-6 hover:bg-gray-50 transition-all duration-200' : 'bg-gray-50 rounded-xl p-5 hover:shadow-md transition-all duration-200'}
                    ${selectedCustomers.includes(customer.id?.toString() || '') ? 'bg-blue-50 border border-blue-200' : ''}
                  `}>
                                            <div className="flex items-start gap-4">
                                                <div className="flex items-center gap-3">
                                                    {viewMode === 'list' && (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCustomers.includes(customer.id?.toString() || '')}
                                                            onChange={() => toggleCustomerSelection(customer.id?.toString() || '')}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                    )}
                                                    {renderCustomerAvatar(customer)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                                                                <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig[customer.status as keyof typeof statusConfig]?.color || statusConfig.active.color}`}>
                                                                    {statusConfig[customer.status as keyof typeof statusConfig]?.label || 'Ativo'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                                <Hash size={14} />
                                                                <span className="font-mono">{customer.code}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative">
                                                                <button className="p-1 hover:bg-gray-100 rounded-lg">
                                                                    <MoreVertical size={18} className="text-gray-500" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <Mail size={16} className="text-gray-400" />
                                                            <span className="text-sm truncate">{customer.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <Phone size={16} className="text-gray-400" />
                                                            <span className="text-sm">{customer.phone}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <FileText size={16} className="text-gray-400" />
                                                            <span className="text-sm">{maskCpfCnpj(customer.cpf_cnpj || "")}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <MapPin size={16} className="text-gray-400" />
                                                            <span className="text-sm truncate">{customer.address.city} - {customer.address.state}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="text-xs text-gray-500">
                                                            Cadastrado em: {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => openModal('customer', customer)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                                title="Editar"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(customer.id?.toString() || '', 'customer')}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                                title="Excluir"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Content - Deals */}
                    {activeTab === 'deals' && (
                        <div className="space-y-4">
                            {deals.map(deal => {
                                const customer = getCustomerById(deal.contactId);
                                const StageIcon = statusConfig[deal.stage === 'closed-won' ? 'active' : deal.stage === 'closed-lost' ? 'inactive' : 'lead'].icon;

                                return (
                                    <div key={deal.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all duration-200">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`p-2 rounded-lg ${stageConfig[deal.stage].color}`}>
                                                        <StageIcon size={20} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h3 className="text-xl font-semibold text-gray-900">{deal.title}</h3>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityConfig[deal.priority].color}`}>
                                                                {priorityConfig[deal.priority].label}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                                            <div className="flex items-center gap-1">
                                                                <Users size={14} />
                                                                <span>{customer?.name || 'Cliente não encontrado'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Hash size={14} />
                                                                <span>{customer?.code || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-gray-500">Valor</p>
                                                        <p className="text-lg font-semibold text-gray-900">{formatCurrency(deal.value)}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-gray-500">Probabilidade</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                                                    style={{ width: `${deal.probability}%` }}
                                                                />
                                                            </div>
                                                            <span className="font-medium text-gray-900">{deal.probability}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-gray-500">Fechamento</p>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {new Date(deal.expectedCloseDate).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-gray-500">Estágio</p>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${stageConfig[deal.stage].color}`}>
                                                            {stageConfig[deal.stage].label}
                                                        </span>
                                                    </div>
                                                </div>

                                                {deal.notes && (
                                                    <div className="p-4 bg-gray-50 rounded-xl mb-4">
                                                        <p className="text-sm text-gray-600">{deal.notes}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => openModal('deal', deal)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(deal.id, 'deal')}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Content - Pipeline */}
                    {activeTab === 'pipeline' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Pipeline de Vendas</h2>
                                    <div className="text-lg font-semibold text-blue-600">
                                        Total: {formatCurrency(stats.pipelineValue)}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                                    {pipelineStages.map(stage => (
                                        <div key={stage.key} className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        {dealsByStage[stage.key]?.length || 0} negociações
                                                    </p>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${stageConfig[stage.key].color}`}>
                                                    {stage.count}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {dealsByStage[stage.key]?.map(deal => {
                                                    const customer = getCustomerById(deal.contactId);
                                                    return (
                                                        <div
                                                            key={deal.id}
                                                            className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                                                            onClick={() => openModal('deal', deal)}
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="font-medium text-gray-900 truncate text-sm">{deal.title}</h4>
                                                                <span className={`px-2 py-1 rounded text-xs font-medium ${priorityConfig[deal.priority].color}`}>
                                                                    {priorityConfig[deal.priority].label}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-600 truncate mb-2">{customer?.name}</p>
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-medium text-green-600 text-xs">
                                                                    {formatCurrency(deal.value)}
                                                                </span>
                                                                <span className="text-xs text-gray-500">{deal.probability}%</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content - Analytics */}
                    {activeTab === 'analytics' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status dos Clientes</h3>
                                <div className="space-y-4">
                                    {Object.entries(statusConfig).map(([key, config]) => {
                                        const count = customers.filter(c => c.status === key).length;
                                        const percentage = customers.length > 0 ? (count / customers.length) * 100 : 0;
                                        const Icon = config.icon;

                                        return (
                                            <div key={key} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${config.color}`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 capitalize">{config.label}</p>
                                                        <p className="text-sm text-gray-500">{count} clientes</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">{percentage.toFixed(1)}%</p>
                                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${config.color.split(' ')[0]}`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Negociações por Estágio</h3>
                                <div className="space-y-4">
                                    {pipelineStages.map(stage => {
                                        const stageDeals = dealsByStage[stage.key] || [];
                                        const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

                                        return (
                                            <div key={stage.key} className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium text-gray-900">{stage.label}</span>
                                                    <span className="text-gray-600">
                                                        {stageDeals.length} negociações • {formatCurrency(totalValue)}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${stageConfig[stage.key].color}`}
                                                        style={{ width: stageConfig[stage.key].width }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="p-6 border-b flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {editingItem ? 'Editar' : 'Novo'} {modalType === 'customer' ? 'Cliente' : 'Negociação'}
                                        </h2>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {editingItem ? 'Atualize as informações' : 'Preencha os dados abaixo'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={closeModal}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6">
                                    {modalType === 'customer' ? (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Nome <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.name || ''}
                                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                            placeholder="Digite o nome completo"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Email <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="email"
                                                            value={formData.email || ''}
                                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                            placeholder="email@empresa.com"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Telefone <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            value={formData.phone || ''}
                                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                            placeholder="(00) 00000-0000"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Código <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.code || ''}
                                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                            placeholder="CLI001"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            CPF/CNPJ <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.cpf_cnpj || ''}
                                                            onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                            placeholder="000.000.000-00"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                                        <select
                                                            value={formData.status || 'active'}
                                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                        >
                                                            <option value="active">Ativo</option>
                                                            <option value="inactive">Inativo</option>
                                                            <option value="lead">Lead</option>
                                                            <option value="prospect">Prospect</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t pt-6">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Rua</label>
                                                            <input
                                                                type="text"
                                                                value={formData.address?.street || ''}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    address: { ...ensureAddress(formData.address), street: e.target.value }
                                                                })}
                                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                                placeholder="Nome da rua"
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                                                                <input
                                                                    type="number"
                                                                    value={formData.address?.number || ''}
                                                                    onChange={(e) => setFormData({
                                                                        ...formData,
                                                                        address: { ...ensureAddress(formData.address), number: parseInt(e.target.value) || 0 }
                                                                    })}
                                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                                    placeholder="123"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                                                                <input
                                                                    type="text"
                                                                    value={formData.address?.zip || ''}
                                                                    onChange={(e) => setFormData({
                                                                        ...formData,
                                                                        address: { ...ensureAddress(formData.address), zip: e.target.value }
                                                                    })}
                                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                                    placeholder="00000-000"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                                                            <input
                                                                type="text"
                                                                value={formData.address?.neighborhood || ''}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    address: { ...ensureAddress(formData.address), neighborhood: e.target.value }
                                                                })}
                                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                                placeholder="Nome do bairro"
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                                                                <input
                                                                    type="text"
                                                                    value={formData.address?.city || ''}
                                                                    onChange={(e) => setFormData({
                                                                        ...formData,
                                                                        address: { ...ensureAddress(formData.address), city: e.target.value }
                                                                    })}
                                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                                    placeholder="Nome da cidade"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                                                                <input
                                                                    type="text"
                                                                    value={formData.address?.state || ''}
                                                                    onChange={(e) => setFormData({
                                                                        ...formData,
                                                                        address: { ...ensureAddress(formData.address), state: e.target.value }
                                                                    })}
                                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                                    placeholder="UF"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Título <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.title || ''}
                                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                        placeholder="Título da negociação"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Cliente <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={formData.contactId || ''}
                                                        onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                    >
                                                        <option value="">Selecione um cliente</option>
                                                        {customers.map(customer => (
                                                            <option key={customer.id} value={customer.id}>
                                                                {customer.name} • {customer.code}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
                                                    <select
                                                        value={formData.priority || 'medium'}
                                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as Deal['priority'] })}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                    >
                                                        <option value="low">Baixa</option>
                                                        <option value="medium">Média</option>
                                                        <option value="high">Alta</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Valor (R$) <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={formData.value || ''}
                                                        onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                        placeholder="0,00"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Estágio</label>
                                                    <select
                                                        value={formData.stage || 'prospecting'}
                                                        onChange={(e) => setFormData({ ...formData, stage: e.target.value as Deal['stage'] })}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                    >
                                                        <option value="prospecting">Prospecção</option>
                                                        <option value="qualification">Qualificação</option>
                                                        <option value="proposal">Proposta</option>
                                                        <option value="negotiation">Negociação</option>
                                                        <option value="closed-won">Ganho</option>
                                                        <option value="closed-lost">Perdido</option>
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Probabilidade (%)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={formData.probability || ''}
                                                            onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                            placeholder="0-100"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Data de Fechamento</label>
                                                        <input
                                                            type="date"
                                                            value={formData.expectedCloseDate || ''}
                                                            onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                                                <textarea
                                                    value={formData.notes || ''}
                                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                    placeholder="Detalhes da negociação..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 border-t flex justify-end gap-3">
                                    <button
                                        onClick={closeModal}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg hover:shadow-xl"
                                    >
                                        {editingItem ? 'Salvar Alterações' : 'Criar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Dashboard>
    );
};

export default CRMModule;