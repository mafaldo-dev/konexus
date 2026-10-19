import React, { useRef, useEffect } from 'react';
import { Eye, Warehouse, MapPin, FileText, X, Edit } from 'lucide-react';
import { ContextMenuPosition } from '../movementsType';
import { Products } from '../../../../types/stock/products';

interface ContextMenuProps {
  show: boolean;
  position: ContextMenuPosition;
  product: Products | null;
  handleContextMenuAction: (action: string) => void;
  closeContextMenu: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ 
  show, 
  position, 
  product, 
  handleContextMenuAction, 
  closeContextMenu 
}) => {
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
      {/* Header do Menu com nome do produto */}
      {product && (
        <div className="px-4 py-2 border-b border-gray-100 mb-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Opções
          </p>
          <p className="text-sm font-medium text-gray-900 truncate mt-0.5">
            {product.name}
          </p>
        </div>
      )}

      <button
        onClick={() => handleContextMenuAction('edit')}
        className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-medium"
      >
        <Edit className="w-4 h-4" />
        Editar Produto
      </button>

      <button
        onClick={() => handleContextMenuAction('kardex')}
        className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2 font-medium"
      >
        <Warehouse className="w-4 h-4" />
        Visualizar Kardex (F4)
      </button>

      <hr className="my-1 border-gray-200" />

      <button
        onClick={() => handleContextMenuAction('photo')}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
      >
        <Eye className="w-4 h-4" />
        Visualizar Foto
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
        className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-2"
      >
        <X className="w-4 h-4" />
        Fechar
      </button>

      {/* Footer com código do produto */}
      {product && (
        <div className="px-4 py-2 border-t border-gray-100 mt-1">
          <p className="text-[10px] text-gray-400 text-center">
            Código: <span className="font-mono font-medium">{product.code}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default ContextMenu;