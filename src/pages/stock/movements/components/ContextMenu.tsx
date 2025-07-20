import React, { useRef, useEffect } from 'react';
import { Eye, Warehouse, MapPin, FileText, X } from 'lucide-react';
import { ContextMenuPosition } from '../movementsType';
import { Products } from '../../../../service/interfaces/stock/products';

interface ContextMenuProps {
    show: boolean;
    position: ContextMenuPosition;
    product: Products | null;
    handleContextMenuAction: (action: string) => void;
    closeContextMenu: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ show, position, product, handleContextMenuAction, closeContextMenu }) => {
    const contextMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                closeContextMenu();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [closeContextMenu]);

    if (!show) return null;

    return (
        <div
            ref={contextMenuRef}
            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
            style={{
                left: position.x,
                top: position.y,
                minWidth: '200px',
            }}
        >
            <button
                onClick={() => handleContextMenuAction('photo')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
                <Eye className="w-4 h-4" />
                Visualizar Foto
            </button>
            <button
                onClick={() => handleContextMenuAction('kardex')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
                <Warehouse className="w-4 h-4" />
                Visualizar Kardex
            </button>
            <button
                onClick={() => handleContextMenuAction('address')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
                <MapPin className="w-4 h-4" />
                Visualizar/Alterar Endereço
            </button>
            <button
                onClick={() => handleContextMenuAction('report')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
                <FileText className="w-4 h-4" />
                Gerar Relatório
            </button>
            <hr className="my-1 border-gray-200" />
            <button
                onClick={closeContextMenu}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
                <X className="w-4 h-4" />
                Fechar
            </button>
        </div>
    );
};

export default ContextMenu;
