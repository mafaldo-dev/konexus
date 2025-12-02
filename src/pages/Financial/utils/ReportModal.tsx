import React, { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import Swal from 'sweetalert2';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateReport: (startDate: string, endDate: string, reportType: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onGenerateReport
}) => {
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'custom'>('weekly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPeriod('weekly');
    }
  }, [isOpen]);

  const setPeriod = (type: 'weekly' | 'monthly') => {
    const today = new Date();
    let start, end;

    if (type === 'weekly') {
      start = startOfWeek(today, { weekStartsOn: 1 });
      end = endOfWeek(today, { weekStartsOn: 1 });
    } else {
      start = startOfMonth(today);
      end = endOfMonth(today);
    }

    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
    setReportType(type);
  };

  const handleGenerate = () => {
    if (!startDate || !endDate) {
      Swal.fire('Atenção', 'Selecione as datas de início e fim', 'warning');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      Swal.fire('Erro', 'Data de início não pode ser maior que data de fim', 'error');
      return;
    }

    onGenerateReport(startDate, endDate, reportType);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Gerar Relatório</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Relatório
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setPeriod('weekly')}
                className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium ${
                  reportType === 'weekly'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Semanal
              </button>
              <button
                onClick={() => setPeriod('monthly')}
                className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium ${
                  reportType === 'monthly'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setReportType('custom')}
                className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium ${
                  reportType === 'custom'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Personalizado
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setReportType('custom');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setReportType('custom');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Gerar Relatório
          </button>
        </div>
      </div>
    </div>
  );
};