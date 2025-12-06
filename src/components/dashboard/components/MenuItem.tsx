import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../../../AuthContext'; // ← Adicione o useAuth

interface MenuItemProps {
  item: {
    key: string;
    title: string;
    icon: any;
    href?: string;
    to?: string;
    access?: string[];
    submenu?: Array<{
      title: string;
      to: string;
      icon: any;
      access?: string[];
    }>;
  };
  sidebarCollapsed: boolean;
  // ← REMOVIDO: canAccessMenuItem não é mais necessário como prop
}

export default function MenuItem({ item, sidebarCollapsed }: MenuItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { canAccessMenuItem, canAccessSubmenuItem } = useAuth(); // ← Usa o AuthContext

  // ← ATUALIZADO: Usa a função do AuthContext
  if (!canAccessMenuItem(item.key, item.access)) {
    return null; 
  }

  const isActive = location.pathname === item.to;
  const hasSubmenu = item.submenu && item.submenu.length > 0;

  // ← ATUALIZADO: Filtra subitens usando a função do AuthContext
  const accessibleSubmenu = item.submenu?.filter(subItem => 
    canAccessSubmenuItem(subItem.to, subItem.access)
  ) || [];

  // Se tem submenu mas nenhum subitem é acessível, não renderiza
  if (hasSubmenu && accessibleSubmenu.length === 0) {
    return null;
  }

  return (
    <div className="mb-1">
      {/* Item Principal */}
      {hasSubmenu ? (
        // Item com submenu
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-slate-800 ${
            isActive ? 'bg-slate-800 text-white' : 'text-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <item.icon className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm font-medium">{item.title}</span>}
          </div>
          {!sidebarCollapsed && (
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </button>
      ) : (
        // Item simples (link)
        <Link
          to={item.to || '#'}
          className={`flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-slate-800 ${
            isActive ? 'bg-slate-800 text-white' : 'text-slate-300'
          }`}
        >
          <item.icon className="w-5 h-5" />
          {!sidebarCollapsed && <span className="text-sm font-medium">{item.title}</span>}
        </Link>
      )}

      {/* Submenu */}
      {hasSubmenu && isOpen && !sidebarCollapsed && (
        <div className="ml-6 mt-1 space-y-1">
          {accessibleSubmenu.map((subItem) => (
            <Link
              key={subItem.to}
              to={subItem.to}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-slate-800 ${
                location.pathname === subItem.to ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              <subItem.icon className="w-4 h-4" />
              <span className="text-sm">{subItem.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}