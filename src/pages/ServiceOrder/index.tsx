import React, { useState } from 'react';
import { Bell, Plus, Clock, AlertCircle, CheckCircle2, Package, User, Calendar, X, LucideIcon } from 'lucide-react';
import { CreateOSModal } from './createOS';
import { OSCard } from './cardsOS';

// ============= TIPOS =============

export type OSStatus = 'iniciada' | 'em_progresso' | 'finalizada';

export type OSPriority = 'baixa' | 'media' | 'alta';

interface OrdemServico {
  id: number;
  items: string[];
  description: string;
  priority: OSPriority;
  status: OSStatus;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  assignedTo: number | null;
  assignedToName: string | null;
  startedAt?: string;
  finishedAt?: string;
}

interface Usuario {
  id: number;
  name: string;
  sector: string;
}

interface Notification {
  id: number;
  type: 'new_os' | 'os_finished';
  osId: number;
  message: string;
  priority?: OSPriority;
  forUser?: number;
  read: boolean;
}

export interface CreateOSData {
  items: string[];
  description: string;
  priority: OSPriority;
}

export interface StatusConfig {
  color: string;
  icon: LucideIcon;
  label: string;
}

interface TabConfig {
  key: OSStatus | 'todas';
  label: string;
  icon: LucideIcon;
}

// ============= PROPS INTERFACES =============
// 
export interface OSCardProps {
  os: OrdemServico;
  currentUser: Usuario;
  onUpdateStatus: (osId: number, newStatus: OSStatus) => void;
}

export interface CreateOSModalProps {
  onClose: () => void;
  onCreate: (data: CreateOSData) => void;
}

// ============= COMPONENTE PRINCIPAL =============

const OSSystem: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Usuario>({ 
    id: 1, 
    name: 'João Silva', 
    sector: 'oficina' 
  });
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<OSStatus | 'todas'>('todas');

  const createOS = (osData: CreateOSData): void => {
    const newOS: OrdemServico = {
      id: Date.now(),
      ...osData,
      status: 'iniciada',
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      assignedTo: null,
      assignedToName: null
    };

    setOrdens(prev => [...prev, newOS]);
    
    if (currentUser.sector !== 'oficina') {
      addNotification({
        id: Date.now(),
        type: 'new_os',
        osId: newOS.id,
        message: `Nova OS #${newOS.id} - ${osData.items.join(', ')}`,
        priority: osData.priority,
        read: false
      });
    }

    setShowCreateModal(false);
  };

  const updateOSStatus = (osId: number, newStatus: OSStatus): void => {
    setOrdens(prev => prev.map(os => {
      if (os.id === osId) {
        const updated: OrdemServico = { ...os, status: newStatus };
        
        if (newStatus === 'em_progresso') {
          updated.assignedTo = currentUser.id;
          updated.assignedToName = currentUser.name;
          updated.startedAt = new Date().toISOString();
        }
        
        if (newStatus === 'finalizada') {
          updated.finishedAt = new Date().toISOString();
          addNotification({
            id: Date.now(),
            type: 'os_finished',
            osId: os.id,
            message: `OS #${os.id} foi finalizada por ${currentUser.name}`,
            forUser: os.createdBy,
            read: false
          });
        }
        
        return updated;
      }
      return os;
    }));
  };

  const addNotification = (notification: Notification): void => {
    setNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 10000);
  };

  const markNotificationAsRead = (notifId: number): void => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  };

  const filteredOrdens = activeTab === 'todas' 
    ? ordens 
    : ordens.filter(os => os.status === activeTab);

  const tabs: TabConfig[] = [
    { key: 'todas', label: 'Todas', icon: Package },
    { key: 'iniciada', label: 'Iniciadas', icon: Clock },
    { key: 'em_progresso', label: 'Em Progresso', icon: AlertCircle },
    { key: 'finalizada', label: 'Finalizadas', icon: CheckCircle2 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sistema de Ordem de Serviço</h1>
            <p className="text-sm text-gray-600">
              Usuário: {currentUser.name} | Setor: {currentUser.sector}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Notificações */}
            <div className="relative">
              <Bell className="w-6 h-6 text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </div>

            {/* Botão criar OS */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              Nova OS
            </button>

            {/* Trocar usuário */}
            <button
              onClick={() => {
                setCurrentUser(prev => 
                  prev.sector === 'oficina' 
                    ? { id: 2, name: 'Maria Santos', sector: 'solicitante' }
                    : { id: 1, name: 'João Silva', sector: 'oficina' }
                );
              }}
              className="text-sm bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200"
            >
              Trocar Usuário
            </button>
          </div>
        </div>
      </div>

      {/* Notificações Popup */}
      <div className="fixed top-20 right-6 z-50 space-y-2 max-w-sm">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`bg-white rounded-lg shadow-lg p-4 border-l-4 ${
              notif.type === 'new_os' 
                ? notif.priority === 'alta' ? 'border-red-500' : 'border-blue-500'
                : 'border-green-500'
            } animate-pulse`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    {notif.type === 'new_os' ? 'Nova Ordem de Serviço' : 'OS Finalizada'}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{notif.message}</p>
              </div>
              <button
                onClick={() => markNotificationAsRead(notif.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs de filtro */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-sm p-1 flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const count = tab.key === 'todas' 
              ? ordens.length 
              : ordens.filter(os => os.status === tab.key).length;
            
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-blue-700' : 'bg-gray-200'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Ordens */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrdens.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma ordem de serviço encontrada</p>
            </div>
          ) : (
            filteredOrdens.map(os => (
              <OSCard
                key={os.id}
                os={os}
                currentUser={currentUser}
                onUpdateStatus={updateOSStatus}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal Criar OS */}
      {showCreateModal && (
        <CreateOSModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createOS}
        />
      )}
    </div>
  );
};



export default OSSystem;