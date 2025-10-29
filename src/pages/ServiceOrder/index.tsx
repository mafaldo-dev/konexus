import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Clock, AlertCircle, CheckCircle2, Package, X, LucideIcon, Loader2 } from 'lucide-react';
import { CreateOSModal } from './createOS';
import { NotificationBadge } from './NotificationBagde';
import Dashboard from '../../components/dashboard/Dashboard';
import { useAuth } from '../../AuthContext';
import { OrderService } from '../../service/interfaces/stock/service';
import { insertOrderOfService, handleAllOrderServices } from '../../service/api/Administrador/orderService/service';
import { format } from 'date-fns';
import { normalizeOrderService, normalizeOrderServices, prepareOrderServiceForSubmit } from './parseItensOrder';
import { DynamicTable } from '../manager/Table/DynamicTable';
import DocumentViewer from '../../utils/screenOptions';


// ============= TIPOS =============

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

interface TabConfig {
  key: any
  label: string;
  icon: LucideIcon;
}

const OSSystem: React.FC = () => {
  const { user } = useAuth();
  const [ordens, setOrdens] = useState<OrderService[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'todas'>('todas');
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [documentType, setDocumentType] = useState<"purchase_order" | "label_70x30" | "label_100x100" | "separation_list" | "render_os_print_sheet">("purchase_order");
  const [selectedOrder, setSelectedOrder] = useState<OrderService | null>(null);

  const formMethods = useForm<CreateOSFormData>({
    defaultValues: {
      createdAt: new Date(),
      orderDate: format(new Date(), "yyyy-MM-dd"),
      orderStatus: 'initialized',
      orderItems: [{ productCode: '', quantity: 1 }]
    }
  });

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await handleAllOrderServices();
      let data: any[] = [];

      if (Array.isArray(response)) {
        data = Array.isArray(response[0]) ? response[0] : response;
      }

      const normalized = normalizeOrderServices(data);
      const sorted = normalized.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.orderDate).getTime();
        const dateB = new Date(b.createdAt || b.orderDate).getTime();
        return dateB - dateA;
      });

      setOrdens(sorted);
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
    if (!user) return;

    setLoading(true);
    try {
      const validItems = data.orderItems.filter(i => i.productCode && i.quantity > 0);
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

      const prepared = prepareOrderServiceForSubmit(orderServiceData);
      const response = await insertOrderOfService(prepared);

      if (response?.order || response) {
        const normalized = normalizeOrderService(response?.order || response);
        setOrdens(prev => [normalized, ...prev]);
        setShowCreateModal(false);
        formMethods.reset();

        addNotification({
          id: Date.now(),
          type: 'success',
          message: `Nova OS #${data.orderNumber} criada com sucesso`,
          priority: 'media',
          read: false
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (osId: string | number, newStatus: string) => {
    setOrdens(prev =>
      prev.map(os =>
        os.id === osId ? { ...os, orderStatus: newStatus } : os
      )
    );

    addNotification({
      id: Date.now(),
      type: 'success',
      message: `Status da OS atualizado para ${getStatusLabel(newStatus)}`,
      priority: 'media',
      read: false
    });
  };

  const getStatusLabel = (status: any): string => {
    const labels: any = {
      initialized: 'Iniciada',
      in_progress: 'Em Progresso',
      finished: 'Finalizada'
    };
    return labels[status] || status;
  };

  const addNotification = (n: any) => {
    setNotifications(prev => [...prev, n]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(x => x.id !== n.id));
    }, 4000);
  };


    const handleViewPDF = (order: OrderService) => {
      setSelectedOrder(order);
      setDocumentType("render_os_print_sheet");
    };

  const filteredOrdens = () => {
    let filtered = ordens;
    if (user?.access !== 'Full-access' && user?.role !== 'Administrador') {
      filtered = filtered.filter(os => os.sector === user?.sector);
    }
    if (activeTab !== 'todas') {
      filtered = filtered.filter(os => os.orderStatus === activeTab);
    }
    return filtered;
  };

  const tabs: TabConfig[] = [
    { key: 'todas', label: 'Todas', icon: Package },
    { key: 'initialized', label: 'Iniciada', icon: Clock },
    { key: 'in_progress', label: 'Em Progresso', icon: AlertCircle },
    { key: 'finished', label: 'Finalizadas', icon: CheckCircle2 }
  ];

  const columns = [
    {
      key: 'orderNumber',
      header: 'N° OS',
      render: (os: OrderService) => (
        <span className="font-mono text-[13px] bg-gray-100 text-gray-800 px-3 py-1 rounded font-medium">
          {os.orderNumber}
        </span>
      ),
    },
    {
      key: 'sector',
      header: 'Setor',
      render: (os: OrderService) => <span>{os.sector || '—'}</span>,
    },
    {
      key: 'userCreate',
      header: 'Criado por',
      render: (os: OrderService) => <span>{os.userCreate}</span>,
    },
    {
      key: 'userReceiv',
      header: 'Responsável',
      render: (os: OrderService) => <span>{os.userReceiv || '—'}</span>,
    },
    {
      key: 'orderStatus',
      header: 'Status',
      render: (os: OrderService) => {
        const statusColors: any = {
          initialized: "bg-yellow-100 text-yellow-800",
          in_progress: "bg-blue-100 text-blue-800",
          finished: "bg-green-100 text-green-800",
        };
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[os.orderStatus]}`}>
            {getStatusLabel(os.orderStatus)}
          </span>
        );
      },
    },
    {
      key: 'orderDate',
      header: 'Data',
      render: (os: OrderService) => (
        <span>{os.orderDate ? format(new Date(os.orderDate), 'dd/MM/yyyy') : '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (os: OrderService) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleUpdateStatus(os.id, 'in_progress')}
            className="p-1 px-3 text-blue-600 hover:scale-110 transition-transform"
          >
            <Clock className="h-4" />
          </button>
          <button
            onClick={() => handleUpdateStatus(os.id, 'finished')}
            className="p-1 px-3 text-green-600 hover:scale-110 transition-transform"
          >
            <CheckCircle2 className="h-4" />
          </button>
          <button onClick={() => handleViewPDF(os)}>
            pdf
          </button>
        </div>
      ),
    },
  ];

  if (selectedOrder && documentType === "render_os_print_sheet") {
    return (
      <DocumentViewer
        order={selectedOrder}
        documentType="render_os_print_sheet"
        onClose={() => {
          setSelectedOrder(null);
          setDocumentType("render_os_print_sheet");
        }}
      />
    );
  }

  return (
    <Dashboard>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center bg-white shadow-sm p-4 rounded-lg">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sistema de Ordem de Serviço</h1>
            <p className="text-sm text-gray-600">
              Usuário: {user?.username || 'N/A'} | Setor: {user?.sector || 'N/A'}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            {loading ? 'Criando...' : 'Nova OS'}
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-white rounded-lg shadow-sm p-1 flex gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
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
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabela dinâmica */}
        <div className="max-w-7xl mx-auto">
          <DynamicTable
            data={filteredOrdens()}
            columns={columns}
            loading={loadingOrders}
            emptyMessage="Nenhuma OS encontrada"
            emptyDescription="Tente ajustar os filtros acima ou crie uma nova OS"
          />
        </div>

        {/* Modal Criar OS */}
        {showCreateModal && (
          <CreateOSModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateOS}
            formMethods={formMethods}
            loading={loading}
          />
        )}

        {/* Notificações */}
        <NotificationBadge onOrderStart={() => {}} />
      </div>
    </Dashboard>
  );
};

export default OSSystem;
