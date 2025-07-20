import React from 'react';
import { Warehouse, X, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Products } from '../../../../service/interfaces/stock/products';
import { Movement } from '../../../../service/interfaces/stock/movements';

interface KardexModalProps {
    show: boolean;
    closeModal: () => void;
    product: Products | null;
    movements: Movement[];
    loading: boolean;
}

const KardexModal: React.FC<KardexModalProps> = ({ show, closeModal, product, movements, loading }) => {
    if (!show || !product) return null;

    const getKardexIcon = (type: Movement['type']) => {
        switch (type) {
            case 'entrada':
                return <TrendingUp className="w-4 h-4 text-emerald-600" />;
            case 'saida':
                return <TrendingDown className="w-4 h-4 text-red-600" />;
            case 'previsao':
                return <Clock className="w-4 h-4 text-amber-600" />;
        }
    };

    const getKardexTypeColor = (type: Movement['type']) => {
        switch (type) {
            case 'entrada':
                return 'bg-emerald-50 text-emerald-800 border-emerald-200';
            case 'saida':
                return 'bg-red-50 text-red-800 border-red-200';
            case 'previsao':
                return 'bg-amber-50 text-amber-800 border-amber-200';
        }
    };

    const totalMovsEntrada = movements.filter((e) => e.type === 'entrada').length;
    const totalMovsSaida = movements.filter((e) => e.type === 'saida').length;
    const totalMovsPrev = movements.filter((e) => e.type === 'previsao').length;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="bg-slate-800 text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Warehouse className="w-6 h-6" />
                        <div>
                            <h2 className="text-xl font-semibold">Kardex do Produto</h2>
                            <p className="text-slate-300 text-sm">{product.code}</p>
                        </div>
                    </div>
                    <button onClick={closeModal} className="text-slate-300 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Nome</label>
                                <p className="text-gray-900 font-medium">{product.name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Descrição</label>
                                <p className="text-gray-700">{product.description}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Marca</label>
                                <p className="text-gray-900 font-medium">{product.brand}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Saldo Atual</label>
                                <p className="text-2xl font-bold text-slate-800">{product.quantity} unidades</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Entradas</label>
                                    <p className="text-lg font-semibold text-emerald-600">
                                        {totalMovsEntrada}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Saídas</label>
                                    <p className="text-lg font-semibold text-red-600">
                                        {totalMovsSaida}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Previsões</label>
                                <p className="text-lg font-semibold text-amber-600">
                                    {totalMovsPrev}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Movimentações</h3>
                        {loading ? (
                            <div className="flex justify-center items-center h-32">
                                <p>Carregando movimentações...</p>
                            </div>
                        ) : movements.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full borde-r border-gray-200 border-collapse rounded-lg overflow-hidden">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">Data</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">Tipo</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">Quantidade</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">NF</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movements.map((entry, index) => (
                                            <tr key={index} className="border border-gray-300 border-collapse hover:bg-gray-50">
                                                <td className="px-3 py-3 text-sm  text-gray-700 font-medium">
                                                    {new Date(entry.date).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-1 py-1 border border-gray-300">
                                                    <div className="flex items-center gap-2">
                                                        {getKardexIcon(entry.type)}
                                                        <span className={`text-xs px-2 py-1 rounded-full border font-semibold uppercase ${getKardexTypeColor(entry.type)}`}>
                                                            {entry.type}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold border border-gray-300 text-gray-900">{entry.quantity}</td>
                                                <td className="px-4 py-3 text-sm border border-gray-300 text-gray-700">{entry.order_number}</td>
                                                <td className="px-4 py-3 text-sm font-bold border border-gray-300 text-slate-800">{entry.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-600">Nenhuma movimentação encontrada.</p>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="flex justify-end">
                        <button
                            onClick={closeModal}
                            className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KardexModal;
