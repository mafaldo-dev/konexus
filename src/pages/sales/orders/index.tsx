import { useState } from 'react';

import { Printer, Download, Eye } from 'lucide-react';

import Dashboard from '../../../components/dashboard';
import  DANFE  from '../orders/danfe';

export default function InvoiceDANFE() {
  const [showPreview, setShowPreview] = useState(true);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Simulação de download - em um sistema real seria gerado PDF
    alert('Funcionalidade de download seria implementada aqui');
  };

  return (
    <Dashboard>
      <div className="min-h-screen bg-gray-50">
        {/* Barra de ferramentas */}
        <div className="bg-white shadow-sm border-b p-4 print:hidden">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DANFE - Documento Auxiliar da NF-e</h1>
              <p className="text-gray-600">Visualização e impressão do documento fiscal</p>
            </div>

            <div className="flex gap-3">
              <button

                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Ocultar' : 'Visualizar'}
              </button>

              <button

                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
            </div>
          </div>
        </div>

        {/* Área de visualização */}
        {showPreview && (
          <div className="p-6">
            <DANFE />
          </div>
        )}

        {/* Informações adicionais */}
        <div className="bg-white border-t p-6 print:hidden">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Sobre o DANFE</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>O DANFE (Documento Auxiliar da Nota Fiscal Eletrônica) é um documento que acompanha a mercadoria durante o transporte.</p>
                  <p>Este documento contém informações resumidas da NF-e e não substitui a nota fiscal eletrônica.</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Funcionalidades</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Visualização completa do documento</p>
                  <p>• Impressão direta do navegador</p>
                  <p>• Download em formato PDF</p>
                  <p>• Layout responsivo para diferentes dispositivos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dashboard>
  );
}