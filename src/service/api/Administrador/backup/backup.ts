import { apiRequest } from "../../api";
import Swal from "sweetalert2";

// Interfaces
export interface BackupInfo {
  id: number;
  empresa_id: number;
  configuracao_id?: number;
  tipo_backup: string;
  status: 'iniciado' | 'em_progresso' | 'concluido' | 'falhou';
  data_inicio: string;
  data_fim?: string;
  tamanho_bytes?: number;
  quantidade_registros?: number;
  caminho_arquivo?: string;
  mensagem_erro?: string;
  duracao_segundos?: number;
  empresa_nome?: string;
}

export interface ConfigBackup {
  id: number;
  empresa_id: number;
  tipo_backup: string;
  frequencia: string;
  hora_execucao?: string;
  dias_semana?: string;
  dia_mes?: number;
  retencao_dias: number;
  ativo: boolean;
  ultimo_backup?: string;
  caminho_destino?: string;
  notificar_email: boolean;
  email_notificacao?: string;
}

// Listar histórico de backups
export const handleBackupHistory = async (empresaId: number, limite: number = 50): Promise<BackupInfo[]> => {
  const tkn = localStorage.getItem("token");
  try {
    const response = await apiRequest(
      `backup/history/${empresaId}?limite=${limite}`, 
      "GET", 
      undefined, 
      tkn as string
    );
    
    const historico = response.data || response.historico || response || [];
    
    if (!Array.isArray(historico)) {
      console.warn("Histórico não é um array:", historico);
      return [];
    }
    
    return historico;
  } catch (error: any) {
    console.error("Erro ao recuperar histórico de backups:", error.message || error);
    return [];
  }
};

// Carregar configuração de backup
export const handleBackupConfig = async (empresaId: number): Promise<ConfigBackup | null> => {
  const tkn = localStorage.getItem("token");
  try {
    const response = await apiRequest(
      `backup/configurations/company/${empresaId}`, 
      "GET", 
      undefined, 
      tkn as string
    );
    
    const configs = response.data || response.configs || response || [];
    
    if (Array.isArray(configs) && configs.length > 0) {
      return configs[0];
    }
    
    return null;
  } catch (error: any) {
    console.error("Erro ao recuperar configuração de backup:", error.message || error);
    return null;
  }
};

// Criar configuração de backup
export async function createBackupConfig(config: Partial<ConfigBackup>, token?: string) {
  try {
    const result = await apiRequest("backup/configurations", "POST", config, token);
    Swal.fire("Sucesso!", "Configuração de backup criada com sucesso!", "success");
    return result?.id;
  } catch (error) {
    console.error("Erro ao criar configuração de backup.", error);
    Swal.fire("Erro!", "Erro ao criar configuração de backup!", "error");
  }
}

// Atualizar configuração de backup
export async function updateBackupConfig(id: number, updatedData: Partial<ConfigBackup>, token?: string) {
  try {
    const response = await apiRequest(`backup/configurations/${id}`, "PUT", updatedData, token);
    return response;
  } catch (error) {
    console.error("Erro ao atualizar configuração de backup!", error);
    Swal.fire("Erro!", "Erro ao atualizar configuração!", "error");
  }
}

// Executar backup agora
export const executeBackupNow = async (
  companyId: number, 
  configuracaoId?: number,
  showSuccessToast: boolean = true
): Promise<{ success: boolean; data?: any }> => {
  const tkn = localStorage.getItem("token");
  
  try {
    const response = await apiRequest(
      `backup/execute/${companyId}`, 
      "POST", 
      { configuracaoId }, 
      tkn as string
    );
    
    if (showSuccessToast) {
      Swal.fire({
        icon: "success",
        title: "Backup realizado!",
        text: "O backup foi concluído com sucesso.",
        timer: 3000,
        showConfirmButton: false
      });
    }
    
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Erro ao executar backup:", error.message || error);
    Swal.fire("Erro!", error.message || "Erro ao executar backup!", "error");
    return { success: false };
  }
};

// Restaurar backup
export const restoreBackup = async (backupId: number, backupDate: string): Promise<boolean> => {
  const result = await Swal.fire({
    title: "Tem certeza?",
    text: `Deseja restaurar o backup de ${backupDate}? Esta ação não pode ser desfeita.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sim, restaurar!",
    cancelButtonText: "Cancelar"
  });

  if (!result.isConfirmed) return false;

  const tkn = localStorage.getItem("token");

  // Mostrar loading
  Swal.fire({
    title: "Restaurando backup...",
    text: "Por favor, aguarde. Não feche esta janela.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    await apiRequest(`backup/backout/${backupId}`, "POST", undefined, tkn as string);
    
    Swal.fire({
      icon: "success",
      title: "Restaurado!",
      text: "Backup restaurado com sucesso. A página será recarregada.",
      timer: 2000,
      showConfirmButton: false
    });

    // Recarregar página após 2 segundos
    setTimeout(() => {
      window.location.reload();
    }, 2000);

    return true;
  } catch (error: any) {
    console.error("Erro ao restaurar backup:", error.message || error);
    Swal.fire("Erro!", error.message || "Erro ao restaurar backup.", "error");
    return false;
  }
};

// Download de backup
export const downloadBackup = async (backup: BackupInfo): Promise<void> => {
  if (!backup.caminho_arquivo) {
    Swal.fire("Erro!", "Arquivo de backup não disponível.", "error");
    return;
  }

  const tkn = localStorage.getItem("token");
  const fileName = backup.caminho_arquivo.split('/').pop() || 'backup.sql';

  Swal.fire({
    icon: "info",
    title: "Iniciando download...",
    text: fileName,
    timer: 2000,
    showConfirmButton: false
  });

  try {
    // Abrir link de download
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    window.open(`${API_BASE_URL}/backup/download/${backup.id}?token=${tkn}`, '_blank');
  } catch (error) {
    console.error("Erro ao iniciar download:", error);
    Swal.fire("Erro!", "Erro ao iniciar download.", "error");
  }
};

// Ativar/Desativar backup automático
export const toggleAutoBackup = async (
  configuracao: ConfigBackup | null, 
  currentState: boolean
): Promise<{ success: boolean; newState?: boolean }> => {
  if (!configuracao) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Configure o backup antes de ativar o automático.",
      confirmButtonText: "OK"
    });
    return { success: false };
  }

  const tkn = localStorage.getItem("token");

  try {
    await apiRequest(
      `backup/configuracoes/${configuracao.id}`, 
      "PUT", 
      { ativo: !currentState }, 
      tkn as string
    );

    Swal.fire({
      icon: "success",
      title: `Backup automático ${!currentState ? 'ativado' : 'desativado'}!`,
      timer: 2000,
      showConfirmButton: false
    });

    return { success: true, newState: !currentState };
  } catch (error: any) {
    console.error("Erro ao atualizar configuração:", error.message || error);
    Swal.fire("Erro!", "Erro ao atualizar configuração.", "error");
    return { success: false };
  }
};

// Deletar backup (opcional)
export const deleteBackup = async (backupId: number, backupDate: string): Promise<boolean> => {
  const result = await Swal.fire({
    title: "Tem certeza?",
    text: `Deseja excluir o backup de ${backupDate}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sim, excluir!",
    cancelButtonText: "Cancelar"
  });

  if (!result.isConfirmed) return false;

  const tkn = localStorage.getItem("token");

  try {
    await apiRequest(`backup/${backupId}`, "DELETE", undefined, tkn as string);
    Swal.fire("Excluído!", "Backup excluído com sucesso.", "success");
    return true;
  } catch (error: any) {
    console.error("Erro ao deletar backup:", error.message || error);
    Swal.fire("Erro!", "Erro ao excluir backup.", "error");
    return false;
  }
};

// Formatar data
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

// Formatar hora
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Formatar tamanho em bytes
export const formatBytes = (bytes?: number): string => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Calcular espaço total utilizado
export const calculateTotalSpace = (backupHistory: BackupInfo[]): string => {
  const total = backupHistory.reduce((acc, curr) => {
    return acc + (curr.tamanho_bytes || 0);
  }, 0);
  return formatBytes(total);
};