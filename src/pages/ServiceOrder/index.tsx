import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Clock, AlertCircle, CheckCircle2, Package, LucideIcon } from 'lucide-react';
import { CreateOSModal } from './createOS';
import { NotificationBadge } from './NotificationBagde';
import Dashboard from '../../components/dashboard/Dashboard';
import { useAuth } from '../../AuthContext';
import { OrderService } from '../../service/interfaces/stock/service';
import { insertOrderOfService, handleAllOrderServices, handleOrderServiceById, handleUpdateOrderServiceStatus } from '../../service/api/Administrador/orderService/service';
import { format } from 'date-fns';
import { normalizeOrderService, normalizeOrderServices, prepareOrderServiceForSubmit } from './parseItensOrder';
import { DynamicTable } from '../../utils/Table/DynamicTable';
import DocumentViewer from '../../utils/screenOptions';

// ============= TIPOS =============

export type OSPriority = 'baixa' | 'media' | 'alta';

export interface CreateOSFormData {
  orderNumber: string;
  orderDate: string;
  userCreate: string;
  receiver_name: string;
  message: string;
  createdAt: string | Date;
  orderStatus: string;
  sector: string;
  notes: string;
  stock_movement: boolean
  movement_type: string
  orderItems: Array<{
    productId: string | number;
    quantity: number;
  }>;
}

interface TabConfig {
  key: any
  label: string;
  icon: LucideIcon;
}

interface ActionMenuProps {
  os: OrderService;
  handleUpdateStatus: (id: number, status: string) => void;
  handleViewPDF: (os: OrderService) => void;
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
      orderItems: [{ productId: '', quantity: 1 }],
      stock_movement: false,
      movement_type: '',

    }
  });

  const ActionMenu: React.FC<ActionMenuProps> = ({ os, handleUpdateStatus, handleViewPDF }) => {
    const [openMenu, setOpenMenu] = React.useState(false);
    const toggleMenu = () => setOpenMenu(!openMenu);
    const closeMenu = () => setOpenMenu(false);

    React.useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const menu = document.getElementById(`menu-${os.id}`);
        if (menu && !menu.contains(e.target as Node)) {
          closeMenu();
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [os.id]);

    return (
      <div id={`menu-${os.id}`} className="relative inline-block text-left">
        <button
          onClick={toggleMenu}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
        >
          ⋮
        </button>

        {openMenu && (
          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md z-10">
            {/* Quando o status for 'initialized', mostra 'Iniciar' */}
            {os.orderStatus === 'initialized' && (
              <button
                onClick={() => {
                  handleUpdateStatus(os.id, 'in_progress');
                  closeMenu();
                }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              >
                Iniciar
              </button>
            )}

            {/* Botão Ver PDF sempre aparece */}
            <button
              onClick={() => {
                handleViewPDF(os);
                closeMenu();
              }}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Ver PDF
            </button>

            {/* Quando o status for 'in_progress', mostra 'Finalizar' */}
            {os.orderStatus === 'in_progress' && (
              <button
                onClick={() => {
                  handleUpdateStatus(os.id, 'finished');
                  closeMenu();
                }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
              >
                Finalizar
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

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
      const validItems = data.orderItems.filter(i => i.productId && i.quantity > 0);
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
        username: user.username,
        receiver_name: data.receiver_name || '',
        orderStatus: data.orderStatus ?? 'Iniciada',
        sector: data.sector,
        notes: data.notes || '',
        message: data.message || '',
        orderItems: validItems,
        createdAt: data.createdAt ?? new Date(),
        orderDate: data.orderDate,
        stock_movement: data.stock_movement,
        movement_type: data.movement_type
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

 const handleUpdateStatus = async (osId: string | number, newStatus: string) => {
  const prevState = ordens; // backup para rollback

  // 1. OPTIMISTIC UI: atualiza a UI imediatamente
  setOrdens(prev =>
    prev.map(os =>
      os.id === osId ? { ...os, orderStatus: newStatus } : os
    )
  );

  try {
    // 2. Chamada para o backend
    await handleUpdateOrderServiceStatus(osId.toString(), newStatus);

    // 3. Notificação de sucesso
    addNotification({
      id: Date.now(),
      type: "success",
      message: `Status da OS atualizado para ${getStatusLabel(newStatus)}`,
      priority: "media",
      read: false
    });

  } catch (error) {
    console.error("Erro ao atualizar o status:", error);

    // 4. ROLLBACK se a API falhar
    setOrdens(prevState);

    addNotification({
      id: Date.now(),
      type: "error",
      message: `Falha ao atualizar o status da OS.`,
      priority: "alta",
      read: false
    });
  }
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

  const handleViewPDF = async (order: OrderService) => {
    if (!user || !order?.id) return;

    try {
      setLoading(true);
      const response = await handleOrderServiceById(order.id.toString());

      if (response) {
        setSelectedOrder(response);
        setDocumentType("render_os_print_sheet");
      } else {
        console.error("Nenhuma OS encontrada para o ID:", order.id);
        addNotification({
          id: Date.now(),
          type: "error",
          message: `Erro ao carregar detalhes da OS #${order.orderNumber}`,
          priority: "alta",
          read: false
        });
      }

    } catch (error) {
      console.error("Erro ao buscar OS:", error);
      addNotification({
        id: Date.now(),
        type: "error",
        message: "Erro ao carregar detalhes da OS",
        priority: "alta",
        read: false
      });
    } finally {
      setLoading(false);
    }
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
        <span className="font-mono text-[13px] bg-gray-100 text-gray-800 px-5 py-1 rounded font-medium">
          {os.orderNumber}
        </span>
      ),
    },
    {
      key: 'sector',
      header: 'Setor',
      render: (os: OrderService) => <span className='px-1'>{os.sector || '—'}</span>,
    },
    {
      key: 'userCreate',
      header: 'Criado por',
      render: (os: OrderService) => <span className='px-2'>{os.username}</span>,
    },
    {
      key: 'receiver_name',
      header: 'Responsável',
      render: (os: OrderService) => <span className='px-3'>{os.receiver_name || '—'}</span>,
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
        <ActionMenu
          os={os}
          handleUpdateStatus={handleUpdateStatus}
          handleViewPDF={handleViewPDF}
        />
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
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${activeTab === tab.key
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
        <NotificationBadge onOrderStart={() => { }} />
      </div>
    </Dashboard>
  );
};

export default OSSystem;
