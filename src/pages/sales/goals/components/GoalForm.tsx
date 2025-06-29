import React, { useState } from 'react';
import { X, Save, Target } from 'lucide-react';

export default function GoalForm({ goal, onSave, onCancel, isEdit = false }: any) {
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    type: goal?.type || 'vendas',
    target_value: goal?.target_value || 0,
    current_value: goal?.current_value || 0,
    unit: goal?.unit || 'reais',
    period: goal?.period || 'mensal',
    start_date: goal?.start_date || new Date().toISOString().split('T')[0],
    end_date: goal?.end_date || '',
    priority: goal?.priority || 'media',
    responsible: goal?.responsible || '',
    department: goal?.department || 'vendas',
    status: goal?.status || 'ativa'
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: any, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const typeOptions = [
    { value: 'vendas', label: 'Vendas' },
    { value: 'receita', label: 'Receita' },
    { value: 'clientes', label: 'Clientes' },
    { value: 'produtos', label: 'Produtos' },
    { value: 'equipe', label: 'Equipe' },
    { value: 'qualidade', label: 'Qualidade' }
  ];

  const unitOptions = [
    { value: 'reais', label: 'Reais (R$)' },
    { value: 'unidades', label: 'Unidades' },
    { value: 'porcentagem', label: 'Porcentagem (%)' },
    { value: 'pessoas', label: 'Pessoas' }
  ];

  const periodOptions = [
    { value: 'mensal', label: 'Mensal' },
    { value: 'trimestral', label: 'Trimestral' },
    { value: 'semestral', label: 'Semestral' },
    { value: 'anual', label: 'Anual' }
  ];

  const priorityOptions = [
    { value: 'baixa', label: 'Baixa' },
    { value: 'media', label: 'Média' },
    { value: 'alta', label: 'Alta' },
    { value: 'critica', label: 'Crítica' }
  ];

  const departmentOptions = [
    { value: 'vendas', label: 'Vendas' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'operacoes', label: 'Operações' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'rh', label: 'Recursos Humanos' },
    { value: 'geral', label: 'Geral' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isEdit ? 'Editar Meta' : 'Nova Meta'}
              </h2>
              <p className="text-sm text-slate-500">
                {isEdit ? 'Atualize os dados da meta' : 'Defina uma nova meta para sua empresa'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Título da Meta *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Aumentar vendas mensais"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descreva os detalhes da meta..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de Meta *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Departamento *
              </label>
              <select
                required
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {departmentOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Valor Alvo *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.target_value}
                onChange={(e) => handleInputChange('target_value', parseFloat(e.target.value))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Unidade de Medida *
              </label>
              <select
                required
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {unitOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Período *
              </label>
              <select
                required
                value={formData.period}
                onChange={(e) => handleInputChange('period', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {periodOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Prioridade
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data de Início *
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data de Fim *
              </label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Responsável *
              </label>
              <input
                type="text"
                required
                value={formData.responsible}
                onChange={(e) => handleInputChange('responsible', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nome do responsável"
              />
            </div>

            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Valor Atual
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.current_value}
                  onChange={(e) => handleInputChange('current_value', parseFloat(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isEdit ? 'Salvar Alterações' : 'Criar Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}