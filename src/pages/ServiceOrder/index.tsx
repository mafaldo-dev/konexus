import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Bell, Plus, Clock, AlertCircle, CheckCircle2, Package, X, LucideIcon, Loader2 } from 'lucide-react';
import { CreateOSModal } from './createOS';
import { OSCard } from './cardsOS';
import Dashboard from '../../components/dashboard/Dashboard';
import { useAuth } from '../../AuthContext';
import { OrderService } from '../../service/interfaces/stock/service';
import { insertOrderOfService, handleAllOrderServices } from '../../service/api/Administrador/orderService/service';
import { format } from 'date-fns';
import { normalizeOrderService, normalizeOrderServices, prepareOrderServiceForSubmit } from './parseItensOrder';

// ============= TIPOS =============
export type OSStatus = 'initialized' | 'in_progress' | 'finished';

export type OSPriority = 'baixa' | 'media' | 'alta';

export interface CreateOSFormData {
  orderNumber: string;
  orderDate: string;
  userCreate: string;
  userReceiv: string;
  message: string;
  createdAt: string | Date;
  orderStatus: string;
  sector: string;
  notes: string;
  orderItems: Array<{
    productCode: string | number;
    quantity: number;
  }>;
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

// ============= COMPONENTE PRINCIPAL =============

const OSSystem: React.FC = () => {
  const { user } = useAuth();
  const [ordens, setOrdens] = useState<OrderService[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<OSStatus | 'todas'>('todas');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);

  // Form methods
  const formMethods = useForm<CreateOSFormData>({
    defaultValues: {
      createdAt: new Date(),
      orderDate: format(new Date(), "yyyy-MM-dd"),
      orderStatus: 'initialized',
      orderItems: [{ productCode: '', quantity: 1 }]
    }
  });

  // Busca todas as ordens ao montar o componente
  useEffect(() => {
    fetchAllOrders();
  }, []);

 const fetchAllOrders = async () => {
  try {
    setLoadingOrders(true);
    const response = await handleAllOrderServices();
    console.log('Response orders:', response);

    // Trata a resposta - pode vir como array direto ou array dentro de array
    let data: any[] = [];

    if (Array.isArray(response)) {
      if (Array.isArray(response[0])) {
        data = response[0];
      } else {
        data = response;
      }
    }

    console.log('Orders processadas:', data);
    
    // NORMALIZA TODAS AS ORDENS
    const normalizedOrders = normalizeOrderServices(data);
    
    // Ordena por data de criação (mais recentes primeiro)
    const sortedOrders = normalizedOrders.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.orderDate).getTime();
      const dateB = new Date(b.createdAt || b.orderDate).getTime();
      return dateB - dateA;
    });

    setOrdens(sortedOrders);
  } catch (error) {
    console.error('Erro ao buscar ordens:', error);
    addNotification({
      id: Date.now(),
      type: 'error',
      message: 'Erro ao carregar ordens de serviço',
      priority: 'alta',
      read: false
    });
  } finally {
    setLoadingOrders(false);
  }
};
 const handleCreateOS = async (data: CreateOSFormData) => {
  if (!user) {
    addNotification({
      id: Date.now(),
      type: 'error',
      message: 'Usuário não autenticado',
      priority: 'alta',
      read: false
    });
    return;
  }

  setLoading(true);

  try {
    // Validação dos itens
    const validItems = data.orderItems.filter(
      item => item.productCode && item.quantity > 0
    );

    if (validItems.length === 0) {
      addNotification({
        id: Date.now(),
        type: 'error',
        message: 'Adicione pelo menos um produto válido',
        priority: 'alta',
        read: false
      });
      setLoading(false);
      return;
    }

    const orderServiceData: OrderService = {
      id: 0,
      orderNumber: data.orderNumber,
      userCreate: user.username,
      userReceiv: data.userReceiv || '',
      orderStatus: data.orderStatus ?? 'initialized',
      sector: data.sector,
      notes: data.notes || '',
      message: data.message || '',
      orderItems: validItems,
      createdAt: data.createdAt ?? new Date(),
      orderDate: data.orderDate,
    };

    console.log('Criando OS:', orderServiceData);
    console.log('Items:', validItems);

    // PREPARA OS DADOS PARA ENVIO USANDO A FUNÇÃO CORRIGIDA
    const preparedData = prepareOrderServiceForSubmit(orderServiceData);
    console.log('Dados preparados para envio:', preparedData);

    const response = await insertOrderOfService(preparedData);
    console.log('Response create:', response);

    if (response?.order || response) {
      const newOrder = response?.order || response;
      
      // NORMALIZA A RESPOSTA DO BACKEND
      const normalizedOrder = normalizeOrderService(newOrder);
      
      setOrdens(prev => [normalizedOrder, ...prev]);
      
      setShowCreateModal(false);
      formMethods.reset({
        createdAt: new Date(),
        orderDate: format(new Date(), "yyyy-MM-dd"),
        orderStatus: 'initialized',
        orderItems: [{ productCode: '', quantity: 1 }]
      });

      addNotification({
        id: Date.now(),
        type: 'success',
        osId: normalizedOrder.id,
        message: `Nova OS #${data.orderNumber} criada com sucesso`,
        priority: 'media',
        read: false
      });

      // Recarrega a lista para garantir sincronização
      setTimeout(() => {
        fetchAllOrders();
      }, 1000);
    } else {
      throw new Error('Erro ao criar ordem de serviço');
    }
  } catch (error) {
    console.error('Erro ao criar OS:', error);
    addNotification({
      id: Date.now(),
      type: 'error',
      message: 'Erro ao criar ordem de serviço. Tente novamente.',
      priority: 'alta',
      read: false
    });
  } finally {
    setLoading(false);
  }
};
  const handleUpdateStatus = async (osId: string | number, newStatus: OSStatus) => {
    try {
      console.log(`Atualizando OS ${osId} para status ${newStatus}`);
      
      // Aqui você deve chamar a API de atualização
      // await updateOrderServiceStatus(osId, { orderStatus: newStatus });

      // Atualiza localmente
      setOrdens(prev =>
        prev.map(os =>
          os.id === osId
            ? { ...os, orderStatus: newStatus }
            : os
        )
      );

      addNotification({
        id: Date.now(),
        type: 'success',
        message: `Status da OS atualizado para ${getStatusLabel(newStatus)}`,
        priority: 'media',
        read: false
      });

      // Recarrega após atualização
      setTimeout(() => {
        fetchAllOrders();
      }, 500);

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      addNotification({
        id: Date.now(),
        type: 'error',
        message: 'Erro ao atualizar status da ordem',
        priority: 'alta',
        read: false
      });
    }
  };

  const getStatusLabel = (status: OSStatus): string => {
    const labels = {
      initialized: 'Iniciada',
      in_progress: 'Em Progresso',
      finished: 'Finalizada'
    };
    return labels[status] || status;
  };

  const addNotification = (notification: any): void => {
    setNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const markNotificationAsRead = (notifId: number): void => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  };

  const filteredOrdens = activeTab === 'todas'
    ? ordens
    : ordens.filter(os => os.orderStatus === activeTab);

  const tabs: TabConfig[] = [
    { key: 'todas', label: 'Todas', icon: Package },
    { key: 'initialized', label: 'Iniciada', icon: Clock },
    { key: 'in_progress', label: 'Em Progresso', icon: AlertCircle },
    { key: 'finished', label: 'Finalizadas', icon: CheckCircle2 }
  ];

  const getTabCount = (tabKey: OSStatus | 'todas') => {
    if (tabKey === 'todas') return ordens.length;
    return ordens.filter(os => os.orderStatus === tabKey).length;
  };

  return (
    <Dashboard>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sistema de Ordem de Serviço</h1>
              <p className="text-sm text-gray-600">
                Usuário: {user?.username || 'N/A'} | Setor: {user?.sector || 'N/A'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Notificações */}
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-600 cursor-pointer hover:text-gray-800 transition" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </div>

              {/* Botão criar OS */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                <Plus className="w-5 h-5" />
                {loading ? 'Criando...' : 'Nova OS'}
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
                notif.type === 'success'
                  ? 'border-green-500'
                  : notif.type === 'error'
                  ? 'border-red-500'
                  : 'border-blue-500'
              } animate-fadeIn`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-900">
                      {notif.type === 'success' 
                        ? 'Sucesso' 
                        : notif.type === 'error' 
                        ? 'Erro' 
                        : 'Notificação'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{notif.message}</p>
                </div>
                <button
                  onClick={() => markNotificationAsRead(notif.id)}
                  className="text-gray-400 hover:text-gray-600 transition"
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
              const count = getTabCount(tab.key);

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
                    activeTab === tab.key
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.key 
                      ? 'bg-white text-slate-800' 
                      : 'bg-slate-200 text-slate-700'
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
          {loadingOrders ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg">
              <Loader2 className="w-12 h-12 text-slate-800 animate-spin mb-4" />
              <p className="text-gray-600">Carregando ordens de serviço...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrdens.length === 0 ? (
                <div className="col-span-full text-center py-16 bg-white rounded-lg">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium mb-1">
                    Nenhuma ordem de serviço encontrada
                  </p>
                  <p className="text-sm text-gray-400">
                    {activeTab === 'todas' 
                      ? 'Crie uma nova OS para começar' 
                      : `Não há ordens com status "${getStatusLabel(activeTab as OSStatus)}"`}
                  </p>
                </div>
              ) : (
                filteredOrdens.map(os => (
                  <OSCard
                    key={os.id}
                    os={os}
                    currentUser={user}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Criar OS */}
        {showCreateModal && (
          <CreateOSModal
            onClose={() => {
              setShowCreateModal(false);
              formMethods.reset({
                createdAt: new Date(),
                orderDate: format(new Date(), "yyyy-MM-dd"),
                orderStatus: 'initialized',
                orderItems: [{ productCode: '', quantity: 1 }]
              });
            }}
            onCreate={handleCreateOS}
            formMethods={formMethods}
            loading={loading}
          />
        )}
      </div>
    </Dashboard>
  );
};

export default OSSystem;