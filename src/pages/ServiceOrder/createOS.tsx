import React, { useEffect, useState, useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { X, Plus, Trash2, Search } from 'lucide-react';
import { CreateOSFormData } from '.';
import { handleAllEmployee } from '../../service/api/Administrador/employee';
import { useAuth } from '../../AuthContext';
import { handleAllProducts } from '../../service/api/Administrador/products';

interface CreateOSModalProps {
  onClose: () => void;
  onCreate: (data: CreateOSFormData) => void;
  formMethods: UseFormReturn<CreateOSFormData>;
  loading: boolean;
}

export const CreateOSModal: React.FC<CreateOSModalProps> = ({
  onClose,
  onCreate,
  formMethods,
  loading
}) => {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = formMethods;

  const orderItems = watch('orderItems');
  const watchedSector = watch('sector');
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState<number | null>(null);
  const [selectedSector, setSelectedSector] = useState('');

  const { user } = useAuth();

  // Carrega funcionários
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await handleAllEmployee();
        console.log('Response employees:', response);
        
        // Tratamento para extrair o array correto
        let employeeData = response;
        
        // Se for array de arrays, pega o primeiro
        if (Array.isArray(response) && Array.isArray(response[0])) {
          employeeData = response[0];
        }
        
        console.log('Employee data processado:', employeeData);
        console.log('Exemplo de funcionário:', employeeData[0]);
        
        setEmployees(Array.isArray(employeeData) ? employeeData : []);
      } catch (err) {
        console.error('Erro ao carregar funcionários:', err);
        setEmployees([]);
      }
    };
    fetchEmployees();
  }, []);

  // Carrega produtos
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await handleAllProducts();
        const productData = Array.isArray(response) ? response : 
                          Array.isArray(response[0]) ? response[0] : [];
        setProducts(productData);
      } catch (err) {
        console.error('Erro ao carregar produtos:', err);
        setProducts([]);
      }
    };
    fetchProducts();
  }, []);

  // Setores únicos ordenados alfabeticamente
  const uniqueSectors = useMemo(() => {
    if (!Array.isArray(employees) || employees.length === 0) {
      console.log('No employees data');
      return [];
    }
    
    const sectors = employees
      .map(emp => emp.sector)
      .filter(sector => sector && typeof sector === 'string' && sector.trim() !== '');
    
    console.log('Sectors found:', sectors);
    
    // Remove duplicatas e ordena
    const uniqueSet = new Set(sectors);
    const result = Array.from(uniqueSet).sort((a, b) => 
      a.toLowerCase().localeCompare(b.toLowerCase())
    );
    
    console.log('Unique sectors:', result);
    return result;
  }, [employees]);

  // Funcionários filtrados por setor e status ativo
  const filteredUsers = useMemo(() => {
    if (!selectedSector || !watchedSector) return [];

    return employees
      .filter(emp => 
        emp.sector === (selectedSector || watchedSector) && 
        emp.status?.toLowerCase() === 'ativo'
      )
      .sort((a, b) => 
        a.name?.toLowerCase().localeCompare(b.name?.toLowerCase())
      );
  }, [selectedSector, watchedSector, employees]);

  // Reseta funcionário ao mudar setor
  useEffect(() => {
    const currentSector = selectedSector || watchedSector;
    if (currentSector) {
      setValue('userReceiv', '');
    }
  }, [selectedSector, watchedSector, setValue]);

  // Busca de produtos melhorada
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase().trim();
    
    return products
      .filter(product => {
        const matchCode = product.code?.toLowerCase().includes(term);
        const matchId = product.id?.toString().includes(term);
        const matchName = product.name?.toLowerCase().includes(term);
        const matchDescription = product.description?.toLowerCase().includes(term);
        
        return matchCode || matchId || matchName || matchDescription;
      })
      .slice(0, 50); // Limita resultados para performance
  }, [searchTerm, products]);

  const removeOrderItem = (index: number) => {
    const currentItems = orderItems || [];
    if (currentItems.length > 1) {
      setValue('orderItems', currentItems.filter((_, i) => i !== index));
    }
  };

  const addOrderItem = () => {
    const currentItems = orderItems || [];
    setValue('orderItems', [
      ...currentItems,
      { productCode: '', quantity: 1 }
    ]);
  };

  const openProductSearch = (index: number) => {
    setShowProductSearch(index);
    setSearchTerm('');
  };

  const closeProductSearch = () => {
    setShowProductSearch(null);
    setSearchTerm('');
  };

  const selectProduct = (index: number, product: any) => {
    setValue(`orderItems.${index}.productCode`, product.code || product.id);
    closeProductSearch();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Nova Ordem de Serviço</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleSubmit(onCreate)} className="p-6 space-y-8">
            {/* Info básica */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número da OS *
                </label>
                <input
                  type="text"
                  {...register('orderNumber', { required: 'Número da OS é obrigatório' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: OS-001"
                />
                {errors.orderNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.orderNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data *
                </label>
                <input
                  type="date"
                  {...register('orderDate', { required: 'Data é obrigatória' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.orderDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.orderDate.message}</p>
                )}
              </div>

              <div className='flex flex-col sm:col-span-2'>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Criador da ordem:
                </label>
                <input
                  {...register('userCreate')}
                  className='border border-gray-300 bg-gray-100 p-2 px-3 rounded-lg'
                  value={user?.username || ''}
                  disabled
                />
              </div>
            </div>

            {/* Setor e funcionário responsável */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Setor Responsável *
                </label>
                <select
                  {...register('sector', { required: 'Setor é obrigatório' })}
                  onChange={(e) => {
                    setSelectedSector(e.target.value);
                    setValue('sector', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Selecione um setor</option>
                  {uniqueSectors.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
                {errors.sector && (
                  <p className="text-red-500 text-xs mt-1">{errors.sector.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Funcionário Responsável
                </label>
                <select
                  {...register('userReceiv')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!selectedSector && !watchedSector}
                >
                  <option value="">
                    {(selectedSector || watchedSector) ? 'Selecione um funcionário' : 'Selecione um setor primeiro'}
                  </option>
                  {filteredUsers.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
                {(selectedSector || watchedSector) && filteredUsers.length === 0 && (
                  <p className="text-amber-600 text-xs mt-1">
                    Nenhum funcionário ativo neste setor
                  </p>
                )}
              </div>
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem
              </label>
              <textarea
                {...register('message')}
                rows={2}
                className="w-full px-3 py-2 border resize-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Mensagem ou instruções para o setor responsável..."
              />
            </div>

            {/* Itens da OS */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Itens da OS</label>
                <button
                  type="button"
                  onClick={addOrderItem}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Item
                </button>
              </div>

              {(orderItems || []).map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_100px_40px] gap-3 items-start bg-gray-50 border border-gray-200 rounded-lg p-3 relative"
                >
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Produto *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        {...register(`orderItems.${index}.productCode` as const, {
                          required: 'Produto é obrigatório'
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                        placeholder="Código do produto"
                        readOnly
                      />
                      <button
                        type="button"
                        onClick={() => openProductSearch(index)}
                        className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition flex items-center gap-2 flex-shrink-0"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                    {errors.orderItems?.[index]?.productCode && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.orderItems[index]?.productCode?.message}
                      </p>
                    )}

                    {/* Modal de busca de produtos */}
                    {showProductSearch === index && (
                      <>
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={closeProductSearch}
                        />
                        
                        {/* Modal */}
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden flex flex-col">
                          <div className="p-3 border-b bg-gray-50">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Buscar por nome, código, ID ou descrição..."
                                value={searchTerm}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setSearchTerm(e.target.value);
                                }}
                                onKeyDown={(e) => e.stopPropagation()}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={closeProductSearch}
                                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto">
                            {searchResults.length > 0 ? (
                              searchResults.map((product) => (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={() => selectProduct(index, product)}
                                  className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-200 last:border-b-0 transition"
                                >
                                  <div className="font-medium text-gray-900">
                                    {product.name}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    Código: <span className="font-mono">{product.code}</span> | ID: {product.id}
                                  </div>
                                  {product.description && (
                                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                      {product.description}
                                    </div>
                                  )}
                                </button>
                              ))
                            ) : searchTerm.trim() ? (
                              <div className="px-4 py-8 text-center text-gray-500">
                                <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>Nenhum produto encontrado</p>
                                <p className="text-xs mt-1">Tente buscar por outro termo</p>
                              </div>
                            ) : (
                              <div className="px-4 py-8 text-center text-gray-500">
                                <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>Digite para buscar produtos</p>
                                <p className="text-xs mt-1">Nome, código, ID ou descrição</p>
                              </div>
                            )}
                          </div>
                          
                          {searchResults.length > 0 && (
                            <div className="px-3 py-2 border-t bg-gray-50 text-xs text-gray-600 text-center">
                              {searchResults.length} produto(s) encontrado(s)
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Qtd *</label>
                    <input
                      type="number"
                      {...register(`orderItems.${index}.quantity` as const, {
                        required: 'Quantidade é obrigatória',
                        min: { value: 1, message: 'Mínimo 1' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      min="1"
                    />
                    {errors.orderItems?.[index]?.quantity && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.orderItems[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  {(orderItems || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOrderItem(index)}
                      className="flex items-center justify-center h-10 mt-[22px] text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Remover item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 border resize-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ex: Observações adicionais"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Criando...' : 'Criar OS'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};