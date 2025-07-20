import React from 'react';
import { Download } from 'lucide-react';

interface ReportPreviewProps {
    reportData: any[];
    closePreview: () => void;
    downloadReport: () => void;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({ reportData, closePreview, downloadReport }) => {
    const headers = Object.keys(reportData[0] || {});

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <button
                            onClick={closePreview}
                            className="text-slate-700 hover:text-slate-900 mb-4 font-medium transition-colors flex items-center gap-2"
                        >
                            ← Voltar para Lista de Produtos
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Prévia do Relatório</h1>
                        <p className="text-gray-600 font-medium">Visualize o relatório antes de fazer o download</p>
                    </div>
                    <button
                        onClick={downloadReport}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium shadow-sm"
                    >
                        <Download className="w-5 h-5" />
                        Baixar Relatório
                    </button>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 font-medium uppercase tracking-wide mb-1">Data de Geração</p>
                            <p className="text-lg font-bold text-slate-800">
                                {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600 font-medium uppercase tracking-wide mb-1">Total de Produtos</p>
                            <p className="text-lg font-bold text-slate-800">{reportData.length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600 font-medium uppercase tracking-wide mb-1">Colunas Incluídas</p>
                            <p className="text-lg font-bold text-slate-800">{headers.length}</p>
                        </div>
                    </div>
                </div>
                <div
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    style={{ height: 'calc(100vh - 350px)', minHeight: '400px' }}
                >
                    <div className="bg-slate-800 text-white p-4">
                        <h2 className="text-xl font-semibold">Relatório de Produtos</h2>
                    </div>
                    <div className="overflow-x-auto h-full">
                        <table className="w-full h-full">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    {headers.map((header) => (
                                        <th
                                            key={header}
                                            className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((row, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                        {headers.map((header) => (
                                            <td key={header} className="px-4 py-2 text-xs text-gray-700">
                                                {row[header] || ''}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="mt-6 flex justify-between items-center">
                    <button
                        onClick={closePreview}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                        Voltar para Lista
                    </button>
                    <button
                        onClick={downloadReport}
                        className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Baixar Relatório
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportPreview;
