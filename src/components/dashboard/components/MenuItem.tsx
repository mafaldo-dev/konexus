import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../../../AuthContext';

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
      /** Grupo de terceiro nivel (ex.: Financeiro > Contabilidade > ...). */
      children?: Array<{
        title: string;
        to: string;
        icon: any;
        access?: string[];
      }>;
    }>;
  };
  sidebarCollapsed: boolean;
}

export default function MenuItem({ item, sidebarCollapsed }: MenuItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { canAccessMenuItem, canAccessSubmenuItem } = useAuth(); 

  if (!canAccessMenuItem(item.key, item.access)) {
    return null; 
  }

  const isActive = location.pathname === item.to;
  const hasSubmenu = item.submenu && item.submenu.length > 0;

  const accessibleSubmenu = (item.submenu || [])
    .filter((subItem) => {
      if (subItem.children?.length) {
        // Grupo: mantem se ao menos um filho estiver liberado.
        return subItem.children.some((child) =>
          canAccessSubmenuItem(child.to, child.access)
        );
      }
      return canAccessSubmenuItem(subItem.to, subItem.access);
    })
    .map((subItem) =>
      subItem.children?.length
        ? {
            ...subItem,
            children: subItem.children.filter((child) =>
              canAccessSubmenuItem(child.to, child.access)
            ),
          }
        : subItem
    );

  if (hasSubmenu && accessibleSubmenu.length === 0) {
    return null;
  }

  return (
    <div className="mb-1">
      {hasSubmenu ? (
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
            <div key={subItem.to || subItem.title}>
              {subItem.children?.length ? (
                <details className="group" open={subItem.children.some((child) => location.pathname === child.to)}>
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-2 rounded-lg text-slate-400 hover:bg-slate-800">
                    <subItem.icon className="w-4 h-4" />
                    <span className="text-sm">{subItem.title}</span>
                  </summary>
                  <div className="ml-5 space-y-1 border-l border-slate-700 pl-3">
                    {subItem.children.map((child) => (
                      <Link
                        key={child.to}
                        to={child.to}
                        className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors hover:bg-slate-800 ${
                          location.pathname === child.to
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-500'
                        }`}
                      >
                        <child.icon className="w-3.5 h-3.5" />
                        <span className="text-xs">{child.title}</span>
                      </Link>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  to={subItem.to}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-slate-800 ${
                    location.pathname === subItem.to
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400'
                  }`}
                >
                  <subItem.icon className="w-4 h-4" />
                  <span className="text-sm">{subItem.title}</span>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}