import React, { useState } from 'react';
import { FileText, Download, Plus, ChevronDown, Settings } from 'lucide-react';

interface ActionsDropdownProps {
  activeSubTab: "contas-receber" | "contas-pagar" | "pedidos";
  onCreateClick: () => void;
  onReportClick: () => void;
  onExportClick: () => void;
}

export const ActionsDropdown: React.FC<ActionsDropdownProps> = ({
  activeSubTab,
  onCreateClick,
  onReportClick,
  onExportClick
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCreate = () => {
    onCreateClick();
    setIsOpen(false);
  };

  const handleReport = () => {
    onReportClick();
    setIsOpen(false);
  };

  const handleExport = () => {
    onExportClick();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium text-slate-700"
      >
        <Settings className="h-4 w-4" />
        Ações
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              {/* Botão Nova Conta - só aparece na aba contas-pagar */}
              {activeSubTab === "contas-pagar" && (
                <button
                  onClick={handleCreate}
                  className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-3" />
                  Nova Conta
                </button>
              )}

              <button
                onClick={handleReport}
                className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <FileText className="h-4 w-4 mr-3" />
                Gerar Relatório
              </button>

              <button
                onClick={handleExport}
                className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Download className="h-4 w-4 mr-3" />
                Exportar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};