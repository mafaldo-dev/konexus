import React, { useState, useEffect } from 'react';
import { OrderResponse } from '../../../../service/interfaces/sales/orders';
import { CheckCheck } from 'lucide-react';
import { useAuth } from '../../../../AuthContext';

interface ConferenceModalProps {
  order: OrderResponse;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    separador: string;
    conferente: string;
    peso: number;
    volumes: number;
  }) => Promise<void>;
}

const ConferenceModal: React.FC<ConferenceModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    separador: '',
    conferente: '',
    peso: '',
    volumes: order.orderItems.length.toString()
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Preenche automaticamente o conferente se for conferente do estoque
  useEffect(() => {
    if (isOpen && user?.role === "Conferente" && user?.sector === "Estoque") {
      setFormData(prev => ({
        ...prev,
        conferente: user.username
      }));
    }
  }, [isOpen, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.separador.trim()) {
      newErrors.separador = 'Nome do separador é obrigatório';
    }
    
    // Valida conferente baseado no tipo de usuário
    if (user?.role === "Conferente" && user?.sector === "Estoque") {
      // Se for conferente do estoque, já está preenchido automaticamente
      if (!formData.conferente.trim()) {
        newErrors.conferente = 'Nome do conferente é obrigatório';
      }
    } else {
      // Se não for conferente, valida campo vazio
      if (!formData.conferente.trim()) {
        newErrors.conferente = 'Nome do conferente é obrigatório';
      }
    }
    
    if (!formData.peso || parseFloat(formData.peso) <= 0) {
      newErrors.peso = 'Peso deve ser maior que zero';
    }
    if (!formData.volumes || parseInt(formData.volumes) <= 0) {
      newErrors.volumes = 'Quantidade de volumes deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onConfirm({
        separador: formData.separador,
        conferente: formData.conferente, 
        peso: parseFloat(formData.peso),
        volumes: parseInt(formData.volumes)
      });
      handleClose();
    } catch (error) {
      console.error('Erro ao realizar conferência:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      separador: '',
      conferente: '',
      peso: '',
      volumes: order.orderItems.length.toString()
    });
    setErrors({});
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    if (id === "conferente" && user?.role === "Conferente" && user?.sector === "Estoque") {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));

    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const isConferenteEstoque = user?.role === "Conferente" && user?.sector === "Estoque";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white shadow-xl max-w-4xl w-full h-[600px]">
          <div className="px-6 py-4 border-b bg-slate-800">
            <h3 className="text-lg flex items-center gap-2 font-semibold text-white">
              <CheckCheck size={32} />
              Realizar Conferência
            </h3>
            <p className="text-sm text-white mt-1">
              Preencha os dados da conferência do pedido
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">
                    Pedido: <span className="text-blue-600">{order.orderNumber}</span>
                  </p>
                  <p className="text-sm font-medium text-gray-700">
                    Cliente: <span className="text-blue-600">{order.customer.name}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.orderItems.length} item(s) no pedido
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="separador"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nome do Separador *
                  </label>
                  <input
                    id="separador"
                    type="text"
                    value={formData.separador}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.separador ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Digite o nome do separador"
                  />
                  {errors.separador && (
                    <p className="mt-1 text-sm text-red-600">{errors.separador}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="conferente"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nome do Conferente *
                    {isConferenteEstoque && (
                      <span className="ml-2 text-xs text-green-600">
                        (Preenchido automaticamente)
                      </span>
                    )}
                  </label>
                  <input
                    id="conferente"
                    type="text"
                    value={formData.conferente}
                    onChange={handleChange}
                    readOnly={isConferenteEstoque}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.conferente ? 'border-red-500' : 'border-gray-300'
                    } ${isConferenteEstoque ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder={
                      isConferenteEstoque 
                        ? user?.username 
                        : "Digite o nome do conferente"
                    }
                  />
                  {errors.conferente && (
                    <p className="mt-1 text-sm text-red-600">{errors.conferente}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="peso"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Peso Total (kg) *
                    </label>
                    <input
                      id="peso"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.peso}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.peso ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.peso && (
                      <p className="mt-1 text-sm text-red-600">{errors.peso}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="volumes"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Quantidade de Volumes *
                    </label>
                    <input
                      id="volumes"
                      type="number"
                      min="1"
                      value={formData.volumes}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.volumes ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.volumes && (
                      <p className="mt-1 text-sm text-red-600">{errors.volumes}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t mt-12 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                Cancelar
              </button>
              
              {user?.role === "Conferente" ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-800 border border-transparent rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center">
                      Processando...
                    </span>
                  ) : (
                    'Finalizar Pedido'
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-400 border border-transparent rounded-md cursor-not-allowed"
                >
                  Apenas conferentes podem finalizar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConferenceModal;