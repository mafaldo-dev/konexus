import React from 'react';

interface TabNavigationProps {
  activeSubTab: "contas-receber" | "contas-pagar" | "pedidos";
  setActiveSubTab: (tab: "contas-receber" | "contas-pagar" | "pedidos") => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ 
  activeSubTab, 
  setActiveSubTab 
}) => {
  const tabs = [
    { id: 'contas-receber' as const, label: 'Contas a Receber' },
    { id: 'contas-pagar' as const, label: 'Contas a Pagar' },
    { id: 'pedidos' as const, label: 'Pedidos' }
  ];

  return (
    <div className="flex gap-1 bg-slate-100/50 p-1 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveSubTab(tab.id)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeSubTab === tab.id
              ? "bg-white shadow-sm text-slate-900"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};