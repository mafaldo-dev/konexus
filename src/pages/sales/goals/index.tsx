import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { Plus, Target, BarChart3, Search } from 'lucide-react';

import GoalsOverview from '../goals/components/GoalsOverview';
import GoalForm from '../goals/components/GoalForm';
import GoalCard from '../goals/components/GoalCard';
import GoalsChart from '../goals/components/GoalsChart';
import { handleAllGoals, insertGoal } from '../../../service/api/goals';
import { GoalsData } from '../../../service/interfaces/goals';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { getAllProducts } from '../../../service/api/products';
import Dashboard from '../../../components/dashboard';



export default function Goals() {
    const [goals, setGoals] = useState<GoalsData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [chartType, setChartType] = useState('progress');

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        try {
            setLoading(true);
            const data = await handleAllGoals();
            setGoals(data);
        } catch (err) {
            console.error('Erro ao carregar metas:', err);
            setError('Falha ao carregar metas.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGoal = async (data: GoalsData) => {
        try {
            if (editingGoal) {
                await handleAllGoals(data.id);
            } else {
                await insertGoal(data);
            }
            setShowForm(false);
            setEditingGoal(null);
            loadGoals();
        } catch (Exception) {
            console.error('Erro ao salvar meta:', Exception);
        }
    };

    async function handleDelete(id: any) {
        try {
            await deleteDoc(doc(db, "Goal", id))
            setGoals(goals.filter(goal => goal.id !== id));
            alert("Produto deletado com sucesso!");
            const reload = await handleAllGoals()
        } catch (Exception) {
            console.error("Erro ao deletar produto: ", Exception);
            alert("Erro ao deletar produto, tente novamente.");
            throw new Error("Erro ao deletar o produto")
        }
    }
    const handleEditGoal = (goal: GoalsData) => {
        setEditingGoal(goal.id);
        setShowForm(true);
    };

    const filteredGoals = goals.filter(goal => {
        const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            goal.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || goal.status === filterStatus;
        const matchesDepartment = filterDepartment === 'all' || goal.department === filterDepartment;

        return matchesSearch && matchesStatus && matchesDepartment;
    });

    const seen = new Set<string>();
    const uniqueSalespeople: string[] = [];

    goals.forEach(goal => {
        if (goal.department && !seen.has(goal.department)) {
            seen.add(goal.department);
            uniqueSalespeople.push(goal.department);
        }
    });

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Target className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Erro ao carregar metas</h2>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
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
                        transition={{ duration: 0.6 }}
                        className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Target className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Gestão de Metas</h1>
                                <p className="text-slate-600">Defina, acompanhe e gerencie as metas da sua empresa</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            Nova Meta
                        </button>
                    </motion.div>

                    {/* Overview */}
                    <GoalsOverview goals={goals} />

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-5 h-5 text-slate-600" />
                                <span className="font-medium text-slate-900">Análise Visual</span>
                                <select
                                    value={chartType}
                                    onChange={(e) => setChartType(e.target.value)}
                                    className="ml-auto px-3 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="progress">Progresso</option>
                                    <option value="department">Departamentos</option>
                                </select>
                            </div>
                            <GoalsChart goals={goals} chartType={chartType} />
                        </div>
                        <GoalsChart goals={goals} chartType={chartType === 'progress' ? 'department' : 'progress'} />
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 mb-6">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Buscar metas..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex gap-3">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">Todos os Status</option>
                                    <option value="ativa">Ativa</option>
                                    <option value="pausada">Pausada</option>
                                    <option value="concluida">Concluída</option>
                                    <option value="cancelada">Cancelada</option>
                                </select>
                                <select
                                    value={filterDepartment}
                                    onChange={(e) => setFilterDepartment(e.target.value)}
                                    className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">Todos os Departamentos</option>
                                    {uniqueSalespeople.map(dept => (
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
                                <div key={i} className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 animate-pulse">
                                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                                    <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                                    <div className="h-3 bg-slate-200 rounded w-2/3 mb-4"></div>
                                    <div className="flex gap-2 mb-4">
                                        <div className="h-6 bg-slate-200 rounded w-16"></div>
                                        <div className="h-6 bg-slate-200 rounded w-16"></div>
                                    </div>
                                    <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                                    <div className="h-8 bg-slate-200 rounded w-full"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredGoals.map((goal, index) => (
                                <GoalCard
                                    key={goal.id}
                                    goal={goal}
                                    index={index}
                                    onEdit={handleEditGoal}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}

                    {filteredGoals.length === 0 && !loading && (
                        <div className="text-center py-16">
                            <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma meta encontrada</h3>
                            <p className="text-slate-500 mb-6">
                                {searchTerm || filterStatus !== 'all' || filterDepartment !== 'all'
                                    ? 'Nenhuma meta corresponde aos filtros aplicados.'
                                    : 'Comece criando sua primeira meta empresarial.'}
                            </p>
                            {!searchTerm && filterStatus === 'all' && filterDepartment === 'all' && (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium"
                                >
                                    Criar Primeira Meta
                                </button>
                            )}
                        </div>
                    )}

                    {/* Form Modal */}
                    {showForm && (
                        <GoalForm
                            goal={editingGoal}
                            onSave={handleSaveGoal}
                            onCancel={() => {
                                setShowForm(false);
                                setEditingGoal(null);
                            }}
                            isEdit={!!editingGoal}
                        />
                    )}
                </div>
            </div>
        </Dashboard>
    );
}