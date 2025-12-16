import { useState, useEffect } from 'react';
import { useAuth } from '../../../AuthContext';
import {
    Database,
    Download,
    Calendar,
    Clock,
    User,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Shield,
    Settings,
    HardDrive,
    History,
    PlayCircle,
    RotateCcw,
    ChevronRight,
    Cloud,
    Zap,
    ShieldCheck,
    AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
    BackupInfo,
    ConfigBackup,
    handleBackupHistory,
    handleBackupConfig,
    executeBackupNow,
    restoreBackup,
    downloadBackup,
    toggleAutoBackup,
    formatDate,
    formatTime,
    formatBytes,
    calculateTotalSpace
} from '../../../service/api/Administrador/backup/backup';

interface FormBackupConfig {
    id?: number;
    tipo_backup: 'full' | 'schema' | 'data';
    frequencia: 'daily' | 'weekly' | 'monthly';
    hora_execucao: string;
    dias_semana: number[];
    dia_mes: number;
    retencao_dias: number;
    ativo: boolean;
}

export default function BackupSecurityPage() {
    const { company } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [backupHistory, setBackupHistory] = useState<BackupInfo[]>([]);
    const [lastBackup, setLastBackup] = useState<BackupInfo | null>(null);
    const [configuracao, setConfiguracao] = useState<ConfigBackup | null>(null);
    const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);

    const [formConfig, setFormConfig] = useState<FormBackupConfig>({
        tipo_backup: 'full',
        frequencia: 'daily',
        hora_execucao: '02:00',
        dias_semana: [],
        dia_mes: 1,
        retencao_dias: 30,
        ativo: true
    });

    useEffect(() => {
        loadConfiguracao();
        loadBackupHistory();
    }, []);

    const loadConfiguracao = async () => {
        const config = await handleBackupConfig(company?.id!);
        if (config) {
            setConfiguracao(config);
            setAutoBackupEnabled(config.ativo);
        } else {
            setConfiguracao(null);
            setAutoBackupEnabled(false);
        }
    };

    const loadBackupHistory = async () => {
        try {
            const history = await handleBackupHistory(company?.id!, 50);
            setBackupHistory(history);
            setLastBackup(history.length ? history[0] : null);
        } catch (error) {
            toast.error('Erro ao carregar histórico de backups');
        }
    };

    const handleBackupNow = async () => {
        setIsLoading(true);
        try {
            await executeBackupNow(company?.id!, configuracao?.id);
            toast.success('Backup iniciado com sucesso!');
            await loadBackupHistory();
        } catch (error) {
            toast.error('Erro ao executar backup');
        }
        setIsLoading(false);
    };

    const handleRestore = async (backup: BackupInfo) => {
        if (!window.confirm('Tem certeza que deseja restaurar este backup? Esta ação não pode ser desfeita.')) {
            return;
        }
        
        setIsLoading(true);
        try {
            await restoreBackup(backup.id, formatDate(backup.data_inicio));
            toast.success('Restauração iniciada com sucesso!');
        } catch (error) {
            toast.error('Erro ao restaurar backup');
        }
        setIsLoading(false);
    };

    const handleToggleAuto = async () => {
        if (!configuracao) return;
        const result = await toggleAutoBackup(configuracao, autoBackupEnabled);
        if (result.success && result.newState !== undefined) {
            setAutoBackupEnabled(result.newState);
            toast.success(`Backup automático ${result.newState ? 'ativado' : 'desativado'}`);
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'concluido': return 'bg-green-100 text-green-800';
            case 'falhou': return 'bg-red-100 text-red-800';
            case 'em_progresso': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const statusIcon = (status: string) => {
        switch (status) {
            case 'concluido': return <CheckCircle className="w-4 h-4" />;
            case 'falhou': return <AlertCircle className="w-4 h-4" />;
            default: return <RefreshCw className="w-4 h-4" />;
        }
    };

    const getBackupTypeLabel = (type: string) => {
        switch (type) {
            case 'full': return 'Completo';
            case 'schema': return 'Estrutura';
            case 'data': return 'Dados';
            default: return type;
        }
    };

    const mapConfigToForm = (config: ConfigBackup): FormBackupConfig => {
        return {
            id: config.id,
            tipo_backup: config.tipo_backup as 'full' | 'schema' | 'data',
            frequencia: config.frequencia as 'daily' | 'weekly' | 'monthly',
            hora_execucao: config.hora_execucao || '02:00',
            dias_semana: Array.isArray(config.dias_semana) ? config.dias_semana : [],
            dia_mes: config.dia_mes ?? 1,
            retencao_dias: config.retencao_dias ?? 30,
            ativo: config.ativo ?? true
        };
    };

    const handleSaveConfig = async () => {
        try {
            const payload = { ...formConfig, empresa_id: company?.id };
            const url = formConfig.id 
                ? `/backup/configurations/${formConfig.id}`
                : `/backup/configurations`;
            
            const response = await fetch(url, {
                method: formConfig.id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success('Configuração salva com sucesso!');
                await loadConfiguracao();
                setShowConfigModal(false);
            } else {
                toast.error('Erro ao salvar configuração');
            }
        } catch (error) {
            toast.error('Erro ao salvar configuração');
        }
    };

    const getFrequencyLabel = (freq: string) => {
        switch (freq) {
            case 'daily': return 'Diário';
            case 'weekly': return 'Semanal';
            case 'monthly': return 'Mensal';
            default: return freq;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
            <ToastContainer position="top-right" autoClose={3000} />

            {/* HEADER */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Segurança e Backup</h1>
                        <p className="text-gray-600">Gerencie e configure seus backups automáticos</p>
                    </div>
                </div>
                
                <div className="mt-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-gray-700">
                        Última verificação: {lastBackup 
                            ? `${formatDate(lastBackup.data_inicio)} às ${formatTime(lastBackup.data_inicio)}`
                            : 'Nenhum backup realizado'}
                    </p>
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Database className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{backupHistory.length}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Total de Backups</h3>
                    <p className="text-sm text-gray-500">Todos os backups realizados</p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <Clock className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-gray-900">
                                {lastBackup ? formatTime(lastBackup.data_inicio) : '--:--'}
                            </span>
                            <p className="text-xs text-gray-500">
                                {lastBackup ? formatDate(lastBackup.data_inicio) : 'N/A'}
                            </p>
                        </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Último Backup</h3>
                    <p className="text-sm text-gray-500">Horário do último backup</p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <HardDrive className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{calculateTotalSpace(backupHistory)}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Espaço Utilizado</h3>
                    <p className="text-sm text-gray-500">Armazenamento total</p>
                </motion.div>
            </div>

            {/* ACTIONS & CONFIG SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* LEFT COLUMN - ACTIONS */}
                <div className="lg:col-span-2 space-y-6">
                    {/* QUICK ACTIONS */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            Ações Rápidas
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleBackupNow}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <PlayCircle className="w-5 h-5" />
                                )}
                                <span className="font-semibold">Executar Backup Agora</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setFormConfig(
                                        configuracao
                                            ? mapConfigToForm(configuracao)
                                            : {
                                                tipo_backup: 'full',
                                                frequencia: 'daily',
                                                hora_execucao: '02:00',
                                                dias_semana: [],
                                                dia_mes: 1,
                                                retencao_dias: 30,
                                                ativo: true
                                            }
                                    );
                                    setShowConfigModal(true);
                                }}
                                className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl hover:from-gray-900 hover:to-gray-950 transition-all"
                            >
                                <Settings className="w-5 h-5" />
                                <span className="font-semibold">Configurar Backup</span>
                            </motion.button>
                        </div>
                    </div>

                    {/* AUTO BACKUP CONFIG */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-1">Backup Automático</h2>
                                <p className="text-sm text-gray-600">
                                    {configuracao 
                                        ? `Configurado para execução ${getFrequencyLabel(configuracao.frequencia)} às ${configuracao.hora_execucao}`
                                        : 'Configure o backup automático para manter seus dados seguros'
                                    }
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-medium ${autoBackupEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                                    {autoBackupEnabled ? 'Ativo' : 'Inativo'}
                                </span>
                                <button
                                    onClick={handleToggleAuto}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoBackupEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoBackupEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                        
                        {configuracao && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Tipo</p>
                                    <p className="font-medium">{getBackupTypeLabel(configuracao.tipo_backup)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Frequência</p>
                                    <p className="font-medium">{getFrequencyLabel(configuracao.frequencia)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Horário</p>
                                    <p className="font-medium">{configuracao.hora_execucao}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Retenção</p>
                                    <p className="font-medium">{configuracao.retencao_dias} dias</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN - STATUS */}
                <div className="space-y-6">
                    {/* BACKUP STATUS */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Cloud className="w-5 h-5 text-blue-500" />
                            Status do Sistema
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Backups Concluídos</span>
                                <span className="font-semibold">
                                    {backupHistory.filter(b => b.status === 'concluido').length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Backups com Erro</span>
                                <span className="font-semibold text-red-600">
                                    {backupHistory.filter(b => b.status === 'falhou').length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Em Execução</span>
                                <span className="font-semibold text-blue-600">
                                    {backupHistory.filter(b => b.status === 'em_progresso').length}
                                </span>
                            </div>
                        </div>

                        {backupHistory.some(b => b.status === 'falhou') && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-red-800">Atenção!</p>
                                    <p className="text-xs text-red-700">
                                        Existem backups com erro que necessitam de atenção.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BACKUP HISTORY */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <History className="w-6 h-6 text-gray-700" />
                            <h2 className="text-xl font-semibold text-gray-900">Histórico de Backups</h2>
                        </div>
                        <span className="text-sm text-gray-500">
                            {backupHistory.length} itens
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 text-left text-sm font-semibold text-gray-700">Data e Hora</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-700">Tipo</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-700">Status</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-700">Tamanho</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-700">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {backupHistory.map((backup, index) => (
                                <motion.tr 
                                    key={backup.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="p-4">
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {formatDate(backup.data_inicio)}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {formatTime(backup.data_inicio)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm">
                                            <Database className="w-3 h-3" />
                                            {getBackupTypeLabel(backup.tipo_backup)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusColor(backup.status)}`}>
                                            {statusIcon(backup.status)}
                                            {backup.status === 'concluido' ? 'Concluído' : 
                                             backup.status === 'falhou' ? 'Falhou' : 
                                             'Em Progresso'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-medium text-gray-900">
                                        {formatBytes(backup.tamanho_bytes)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => downloadBackup(backup)}
                                                disabled={backup.status !== 'concluido'}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleRestore(backup)}
                                                disabled={backup.status !== 'concluido'}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Restaurar"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </motion.button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {backupHistory.length === 0 && (
                    <div className="text-center py-12">
                        <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhum backup encontrado</p>
                        <p className="text-sm text-gray-400 mt-1">Execute seu primeiro backup para começar</p>
                    </div>
                )}
            </div>

            {/* MODAL CONFIG */}
            {showConfigModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Settings className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Configuração de Backup</h3>
                                        <p className="text-sm text-gray-600">Configure as preferências do backup automático</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowConfigModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <span className="sr-only">Fechar</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tipo de Backup
                                    </label>
                                    <select 
                                        value={formConfig.tipo_backup}
                                        onChange={e => setFormConfig({ ...formConfig, tipo_backup: e.target.value as any })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    >
                                        <option value="full">Completo (Dados + Estrutura)</option>
                                        <option value="schema">Apenas Estrutura</option>
                                        <option value="data">Apenas Dados</option>
                                    </select>
                                    <p className="mt-1 text-sm text-gray-500">Escolha o tipo de backup desejado</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Frequência
                                    </label>
                                    <select 
                                        value={formConfig.frequencia}
                                        onChange={e => setFormConfig({ ...formConfig, frequencia: e.target.value as any })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    >
                                        <option value="daily">Diário</option>
                                        <option value="weekly">Semanal</option>
                                        <option value="monthly">Mensal</option>
                                    </select>
                                    <p className="mt-1 text-sm text-gray-500">Com que frequência executar</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Horário de Execução
                                    </label>
                                    <input 
                                        type="time" 
                                        value={formConfig.hora_execucao}
                                        onChange={e => setFormConfig({ ...formConfig, hora_execucao: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">Horário preferencial para execução</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Retenção (dias)
                                    </label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        max="365"
                                        value={formConfig.retencao_dias}
                                        onChange={e => setFormConfig({ ...formConfig, retencao_dias: Number(e.target.value) })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">Período para manter os backups</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                                <ShieldCheck className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-blue-800">Configuração Ativa</p>
                                    <p className="text-xs text-blue-700">A configuração será aplicada imediatamente após salvar</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfigModal(false)}
                                className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveConfig}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg"
                            >
                                Salvar Configuração
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}