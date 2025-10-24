import { X, Plus } from "lucide-react";
import { useState } from "react";
import { CreateOSModalProps, OSPriority } from ".";

export const CreateOSModal: React.FC<CreateOSModalProps> = ({ onClose, onCreate }) => {
  const [items, setItems] = useState<string[]>(['']);
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<OSPriority>('media');

  const addItem = (): void => {
    setItems(prev => [...prev, '']);
  };

  const updateItem = (index: number, value: string): void => {
    setItems(prev => prev.map((item, i) => i === index ? value : item));
  };

  const removeItem = (index: number): void => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (): void => {
    const validItems = items.filter(item => item.trim());
    if (validItems.length === 0) return;
    
    onCreate({ items: validItems, description, priority });
  };

  const priorities: OSPriority[] = ['baixa', 'media', 'alta'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Nova Ordem de Serviço</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Itens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Itens Solicitados
              </label>
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateItem(index, e.target.value)}
                    placeholder="Ex: Parafuso M8"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addItem}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Adicionar item
              </button>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Informações adicionais sobre a OS"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <div className="flex gap-2">
                {priorities.map(p => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      priority === p
                        ? p === 'alta'
                          ? 'bg-red-600 text-white'
                          : p === 'media'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Criar OS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
