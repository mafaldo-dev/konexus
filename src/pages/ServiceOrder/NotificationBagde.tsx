// NotificationBadge.tsx - Badge integrado ao seu sistema
import React, { useState, useEffect } from 'react';
import { Bell, X, FileText, Eye, Play, Loader2 } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { OrderService } from '../../service/interfaces/stock/service';
import { handleAllOrderServices } from '../../service/api/Administrador/orderService/service';

interface NotificationBadgeProps {
  onOrderStart?: (osId: number) => void;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ onOrderStart }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderService[]>([]);
  const [showNotificationList, setShowNotificationList] = useState(false);
  const [selectedOS, setSelectedOS] = useState<OrderService | null>(null);
  const [showOSDetail, setShowOSDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Busca ordens pendentes
  useEffect(() => {
    fetchPendingOrders();
    
    // Polling a cada 30 segundos
    const interval = setInterval(fetchPendingOrders, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const fetchPendingOrders = async () => {
    if (!user) return;
    
    try {
      const response = await handleAllOrderServices();
      
      // Trata a resposta - pode vir como array direto ou array dentro de array
      let data: OrderService[] = [];
      if (Array.isArray(response)) {
        data = Array.isArray(response[0]) ? response[0] : response;
      }
      
      // Filtra apenas ordens initialized (pendentes)
      const pendingOrders = data.filter(os => os.orderStatus === 'initialized');
      
      // Filtra baseado em setor e usuário
      const filteredOrders = filterOrdersByUser(pendingOrders);
      
      setOrders(filteredOrders);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Filtra ordens baseado no setor e usuário logado
  const filterOrdersByUser = (allOrders: OrderService[]) => {
    if (!user) return [];

    return allOrders.filter(os => {
      // Se foi especificado um funcionário receptor
      if (os.userReceiv && os.userReceiv.trim() !== '') {
        // Compara com ID ou username
        return os.userReceiv === user.id?.toString() || 
               os.userReceiv === user.username;
      }
      
      // Se não foi especificado, mostra para todos do setor
      return os.sector === user.sector;
    });
  };

  // Abre detalhes da OS
  const openOSDetail = (os: OrderService) => {
    setSelectedOS(os);
    setShowOSDetail(true);
    setShowNotificationList(false);
  };

  // Inicia a OS (muda status para in_progress)
  const handleStartOS = async () => {
    if (!selectedOS) return;

    try {
      setLoading(true);
      
      // Chama callback do pai se existir
      if (onOrderStart) {
        onOrderStart(selectedOS.id);
      }
      
      // Remove da lista de notificações
      setOrders(prev => prev.filter(os => os.id !== selectedOS.id));
      
      setShowOSDetail(false);
      setSelectedOS(null);
    } catch (err) {
      console.error('Erro ao iniciar OS:', err);
      alert('Erro ao iniciar OS');
    } finally {
      setLoading(false);
    }
  };

  // Visualiza PDF
  const handleViewPDF = () => {
    if (!selectedOS) return;
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    window.open(`${apiUrl}/orders/${selectedOS.id}/pdf`, '_blank');
  };

  // Formata data
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'Data não disponível';
    try {
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Data inválida';
    }
  };

  const unreadCount = orders.length;

  // Não renderiza se não houver notificações
  if (unreadCount === 0) return null;

  return (
    <>
      {/* Badge flutuante */}
      <button
        onClick={() => setShowNotificationList(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-50"
        aria-label="Notificações de OS"
      >
        <Bell className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      </button>

      {/* Modal - Lista de Notificações */}
      {showNotificationList && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Novas Ordens de Serviço
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {unreadCount} ordem{unreadCount !== 1 ? 's' : ''} aguardando início
                </p>
              </div>
              <button
                onClick={() => setShowNotificationList(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de notificações */}
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              {loadingOrders ? (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                  <p className="text-gray-600">Carregando ordens...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-gray-500">
                  <div className="bg-gray-100 rounded-full p-6 mb-4">
                    <Bell className="w-12 h-12 text-gray-300" />
                  </div>
                  <p className="text-lg font-medium text-gray-700">Nenhuma ordem pendente</p>
                  <p className="text-sm mt-1">Você está em dia com suas tarefas!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {orders.map((os) => (
                    <button
                      key={os.id}
                      onClick={() => openOSDetail(os)}
                      className="w-full text-left px-6 py-4 hover:bg-blue-50 transition-colors bg-blue-50/70 border-l-4 border-blue-500"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">
                                  OS #{os.orderNumber}
                                </span>
                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                  Nova
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {os.sector}
                              </p>
                            </div>
                          </div>
                          
                          {os.message && (
                            <p className="text-sm text-gray-700 mb-2 line-clamp-2 pl-12">
                              {os.message}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500 pl-12">
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Por:</span> {os.userCreate}
                            </span>
                            <span>•</span>
                            <span>{formatDate(os.orderDate)}</span>
                            <span>•</span>
                            <span className="font-medium">
                              {Array.isArray(os.orderItems) ? os.orderItems.length : 0} item(ns)
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-gray-400">
                            {new Date(os.createdAt || os.orderDate).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">
                            Aguardando
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal - Detalhes da OS */}
      {showOSDetail && selectedOS && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-500 p-2 rounded-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        OS #{selectedOS.orderNumber}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {formatDate(selectedOS.orderDate)}
                      </p>
                    </div>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Aguardando Início
                  </span>
                </div>
                <button
                  onClick={() => setShowOSDetail(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Criado por
                  </label>
                  <p className="text-gray-900 font-medium mt-1">{selectedOS.userCreate}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Setor Responsável
                  </label>
                  <p className="text-gray-900 font-medium mt-1">{selectedOS.sector}</p>
                </div>

                {selectedOS.userReceiv && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Funcionário Designado
                    </label>
                    <p className="text-gray-900 font-medium mt-1">{selectedOS.userReceiv}</p>
                  </div>
                )}
              </div>

              {/* Mensagem */}
              {selectedOS.message && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <div className="w-1 h-5 bg-blue-500 rounded"></div>
                    Mensagem
                  </label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-800 leading-relaxed">{selectedOS.message}</p>
                  </div>
                </div>
              )}

              {/* Itens da OS */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <div className="w-1 h-5 bg-blue-500 rounded"></div>
                  Itens da Ordem de Serviço
                </label>
                <div className="space-y-2">
                  {Array.isArray(selectedOS.orderItems) && selectedOS.orderItems.length > 0 ? (
                    selectedOS.orderItems.map((item, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 text-blue-600 font-bold text-sm w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Código do Produto</p>
                            <p className="font-mono font-semibold text-gray-900">
                              {typeof item === 'object' ? item.productCode : item}
                            </p>
                          </div>
                        </div>
                        <div className="text-right bg-blue-50 px-4 py-2 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium">Quantidade</p>
                          <p className="font-bold text-lg text-blue-600">
                            {typeof item === 'object' ? item.quantity : 1}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhum item cadastrado</p>
                  )}
                </div>
              </div>

              {/* Observações */}
              {selectedOS.notes && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <div className="w-1 h-5 bg-blue-500 rounded"></div>
                    Observações
                  </label>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-gray-800 leading-relaxed">{selectedOS.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Ações */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setShowOSDetail(false)}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={handleViewPDF}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-md"
              >
                <Eye className="w-4 h-4" />
                Visualizar PDF
              </button>
              <button
                onClick={handleStartOS}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                {loading ? 'Iniciando...' : 'Iniciar OS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};