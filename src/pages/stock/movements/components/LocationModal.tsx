import React, { useState } from 'react';
import { MapPin, X, Edit2, Save, Package } from 'lucide-react';
import { Products } from '../../../../types';
import { listProducts, updateProduct } from '../../../../services/productService';
import { useAuth } from '../../../../AuthContext'
import Swal from 'sweetalert2';

interface LocationModalProps {
    show: boolean;
    product: Products | null;
    onClose: () => void;
    onSave?: (productId: number, newLocation: string) => Promise<void>;
}

const LocationModal: React.FC<LocationModalProps> = ({
    show,
    product,
    onClose
}) => {

    const { user, hasPermission } = useAuth();
    const canEditProduct = hasPermission("gestao", "edit");

    const [isEditing, setIsEditing] = useState(false);
    const [newLocation, setNewLocation] = useState('');
    const [observation, setObservation] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (!show || !product) return null;

    const handleEdit = () => {
        setNewLocation(product.location || '');

        const updatedAt = product.updated_at
            ? new Date(product.updated_at).toLocaleString('pt-BR')
            : new Date().toLocaleString('pt-BR');

        setObservation(
            `Alterado por: ${user?.username}\nData: ${updatedAt}\nMotivo: `
        );

        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setNewLocation('');
        setObservation('');
    };

    const handleSave = async () => {
        if (!newLocation.trim()) {
            Swal.fire('Info','Por favor, informe a nova localização.', 'info');
            return;
        }

        if (!observation.trim()) {
            Swal.fire('Info','Por favor, informe o motivo da alteração.','info');
            return;
        }

        const updatedData = {
            location: newLocation.trim(),
            observation: observation.trim(),
        };

        setIsSaving(true);

        try {
            await updateProduct(String(product.id), updatedData);
            setIsEditing(false);
            setNewLocation('');
            setObservation('');
            onClose();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            Swal.fire('Erro',"Erro ao salvar. Tente novamente.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[9998] transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-md">
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <MapPin className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Localização do Produto
                                </h2>
                                <p className="text-xs text-gray-600">
                                    Visualize ou altere a localização
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-white rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6">

                        {/* Informações do Produto */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <Package className="w-5 h-5 text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <span className="font-medium">Código:</span>
                                            <span className="font-mono bg-white px-2 py-0.5 rounded">
                                                {product.code}
                                            </span>
                                        </span>
                                        {product.brand && (
                                            <span className="flex items-center gap-1">
                                                <span className="font-medium">Marca:</span>
                                                <span>{product.brand}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Localização */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Localização Atual
                            </label>

                            {!isEditing ? (

                                // VISUALIZAÇÃO
                                <div className="flex items-center justify-between bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                        <span className="text-lg font-semibold text-gray-900">
                                            {product.location || 'Não definida'}
                                        </span>
                                    </div>

                                    {canEditProduct && (
                                        <button
                                            onClick={handleEdit}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Alterar
                                        </button>
                                    )}
                                </div>

                            ) : (

                                // EDIÇÃO
                                <div className="space-y-3">

                                    {/* LOCALIZAÇÃO */}
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={newLocation}
                                            onChange={(e) => setNewLocation(e.target.value)}
                                            placeholder="Ex: Prateleira A3, Corredor 2..."
                                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            autoFocus
                                        />
                                    </div>

                                    {/* OBSERVAÇÃO */}
                                    <textarea
                                        value={observation}
                                        onChange={(e) => setObservation(e.target.value)}
                                        placeholder="Descreva o motivo da alteração..."
                                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[120px]"
                                    />

                                    {/* BOTÕES */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving || !newLocation.trim() || !observation.trim()}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                                    Salvando...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    Salvar
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={handleCancel}
                                            disabled={isSaving}
                                            className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Dica */}
                        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-xs text-amber-800">
                                Use identificadores claros como "Corredor A - Prateleira 3"
                                para facilitar a localização do produto no estoque.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
                        >
                            Fechar
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
};

export default LocationModal;
