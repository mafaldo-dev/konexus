// components/dashboard/components/MenuItem.tsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
  canAccess: (allowed: string[]) => boolean;
}

export default function MenuItem({ item, sidebarCollapsed, canAccess }: MenuItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  if (item.access && !canAccess(item.access)) {
    return null; 
  }

  const isActive = location.pathname === item.to;
  const hasSubmenu = item.submenu && item.submenu.length > 0;

  const accessibleSubmenu = item.submenu?.filter(subItem => 
    !subItem.access || canAccess(subItem.access)
  ) || [];

  const shouldRender = accessibleSubmenu.length > 0 || !hasSubmenu;

    if (!shouldRender) {
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