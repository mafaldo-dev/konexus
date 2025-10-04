import { useEffect, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, BarChart3, Search, Filter, X, AlertCircle } from 'lucide-react';

import { handleAllGoals, insertGoal } from '../../../service/api/Administrador/goals';
import { GoalsData } from '../../../service/interfaces';
import GoalsOverview from '../goals/components/GoalsOverview';
import GoalForm from '../goals/components/GoalForm';
import GoalCard from '../goals/components/GoalCard';
import GoalsChart from '../goals/components/GoalsChart';
import Dashboard from '../../../components/dashboard/Dashboard';

export default function Goals() {
    const [goals, setGoals] = useState<GoalsData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingGoal, setEditingGoal] = useState<GoalsData | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [chartType, setChartType] = useState('progress');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await handleAllGoals();
            setGoals(data);
        } catch (err) {
            console.error('Erro ao carregar metas:', err);
            setError('Falha ao carregar metas. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGoal = async (data: GoalsData) => {
        try {
            setLoading(true);
            if (editingGoal) {
                await handleAllGoals(data.id);
            } else {
                await insertGoal(data);
            }
            setShowForm(false);
            setEditingGoal(null);
            await loadGoals();
        } catch (err) {
            console.error('Erro ao salvar meta:', err);
            setError('Falha ao salvar meta. Verifique os dados e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
      
    };

    const handleEditGoal = (goal: GoalsData) => {
        setEditingGoal(goal);
        setShowForm(true);
    };

    const filteredGoals = goals.filter(goal => {
        const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            goal.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || goal.status === filterStatus;
        const matchesDepartment = filterDepartment === 'all' || goal.department === filterDepartment;

        return matchesSearch && matchesStatus && matchesDepartment;
    });

    const departments = Array.from(new Set(goals.map(goal => goal.department)))
                      .filter(Boolean) as string[]

    const statusOptions = [
        { value: 'all', label: 'Todos os Status' },
        { value: 'ativa', label: 'Ativa' },
        { value: 'pausada', label: 'Pausada' },
        { value: 'concluida', label: 'Concluída' },
        { value: 'cancelada', label: 'Cancelada' }
    ];

    if (error) {
        return (
            <Dashboard>
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                    <div className="max-w-md text-center bg-white p-8 rounded-xl shadow-lg border border-red-100">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">Erro ao carregar metas</h2>
                        <p className="text-slate-600 mb-6">{error}</p>
                        <button
                            onClick={loadGoals}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Tentar novamente
                        </button>
                    </div>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <div className="min-h-screen bg-slate-50">
                <div className="max-w-7xl mx-auto p-6 lg:p-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                <Target className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Gestão de Metas</h1>
                                <p className="text-slate-600">Acompanhe e gerencie o desempenho da sua equipe</p>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Nova Meta</span>
                        </motion.button>
                    </motion.div>

                    {/* Overview Cards */}
                    <GoalsOverview goals={goals} />

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="flex items-center gap-2 font-medium text-slate-900">
                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                    <span>Análise de Metas</span>
                                </h3>
                                <select
                                    value={chartType}
                                    onChange={(e) => setChartType(e.target.value)}
                                    className="text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="progress">Progresso</option>
                                    <option value="department">Por Departamento</option>
                                    <option value="status">Por Status</option>
                                </select>
                            </div>
                            <GoalsChart goals={goals} chartType={chartType} />
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                <h3 className="font-medium text-slate-900">Visão Comparativa</h3>
                            </div>
                            <GoalsChart 
                                goals={goals} 
                                chartType={chartType === 'progress' ? 'department' : 'progress'} 
                            />
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="text-slate-400 w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar metas..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        <X className="text-slate-400 w-5 h-5 hover:text-slate-600" />
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Filter className="text-slate-400 w-5 h-5" />
                                    </div>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                                    >
                                        {statusOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <select
                                    value={filterDepartment}
                                    onChange={(e) => setFilterDepartment(e.target.value)}
                                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">Todos Departamentos</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Goals Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
                                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-4"></div>
                                    <div className="h-4 bg-slate-200 rounded w-full mb-3"></div>
                                    <div className="h-4 bg-slate-200 rounded w-2/3 mb-5"></div>
                                    <div className="flex gap-2 mb-4">
                                        <div className="h-6 bg-slate-200 rounded w-20"></div>
                                        <div className="h-6 bg-slate-200 rounded w-20"></div>
                                    </div>
                                    <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                                    <div className="h-10 bg-slate-200 rounded-xl"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {filteredGoals.length > 0 ? (
                                <motion.div 
                                    layout
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                >
                                    <AnimatePresence>
                                        {filteredGoals.map((goal) => (
                                            <GoalCard
                                                key={goal.id}
                                                goal={goal}
                                                onEdit={handleEditGoal}
                                                onDelete={handleDelete}
                                                isDeleting={isDeleting && deleteId === goal.id}
                                                index={goal.id}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            ) : (
                                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
                                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <Target className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                                        Nenhuma meta encontrada
                                    </h3>
                                    <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                        {searchTerm || filterStatus !== 'all' || filterDepartment !== 'all'
                                            ? 'Nenhuma meta corresponde aos filtros aplicados.'
                                            : 'Comece criando sua primeira meta.'}
                                    </p>
                                    {!searchTerm && filterStatus === 'all' && filterDepartment === 'all' && (
                                        <button
                                            onClick={() => setShowForm(true)}
                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
                                        >
                                            Criar Primeira Meta
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* Form Modal */}
                    <AnimatePresence>
                        {showForm && (
                            <GoalForm
                                goal={editingGoal}
                                onSave={handleSaveGoal}
                                onCancel={() => {
                                    setShowForm(false);
                                    setEditingGoal(null);
                                }}
                                departments={departments}
                                loading={loading}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </Dashboard>
    );
}