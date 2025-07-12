import { useState } from "react";
interface TabContentItem {
    title: string
    content: string
    badge?: string
}
const tabs = [
    { id: "notificacoes", label: "Notificações" },
    { id: "statisticas", label: "Estatísticas" },
    { id: "linksrapidos", label: "Links Rápidos" },
];

const countStoredMessages = (): number => {
  const stored = localStorage.getItem('sector_messages');
  const messages = stored ? JSON.parse(stored) : [];
  return messages.length;
};

const totalMsg = countStoredMessages();



const tabContent: { [key: string]: TabContentItem[]} = {
    notificacoes: [
         {
        title: "Mensagens",
        content: `Você tem ${totalMsg} ${totalMsg === 1 ? "mensagem" : "mensagens"} no sistema.`,
        badge: totalMsg > 0 ? 'New' : undefined,
      },
        { title: "E-mails", content: "Check sua caixa de entrada para atualizações de E-mails" },
        { title: "Transportadoras", content: "Verifique as atualizações de envio" },
    ],
    statisticas: [
        { title: "Vendas", content: "Veja as métricas de performance do mês" },
        { title: "Mercado", content: "O que tem de novidade no mercado" },
        { title: "Produção", content: "Métricas de produção deste mês" },
    ],
    linksrapidos: [
        { title: "Estoque", content: "Gerencie inventário e as quantidades em estoques" },
        { title: "Clientes", content: "Gerencie clientes e CRM" },
        { title: "Fornecedores", content: "Relações com fornecedores e solicitações" },
    ],
};


const TabButton = ({ label, active, onClick }: any) => (
    <button
        onClick={onClick}
        className={`${active
            ? "border-slate-600 text-gray-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
    >
        {label}
    </button>
);

const TabContent = ({ activeTab }: any) => (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
            {tabContent[activeTab as keyof typeof tabContent].map((item, index) => (
                <li key={index}>
                    <div className="block hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-slate-700 truncate">{item.title}</p>
                                {item.badge && (
                                    <div className="ml-2 flex-shrink-0 flex">
                                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-200 text-green-800">
                                            {item.badge}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                                <div className="sm:flex">
                                    <p className="flex items-center text-sm text-gray-400">
                                        {item.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    </div>
);

export default function TabsComponent() {
    const [activeTab, setActiveTab] = useState("notificacoes");
    

    return (
        <div className="mt-6">
            {/* Mobile select */}
            <div className="sm:hidden">
                <label htmlFor="tabs" className="sr-only">Select a tab</label>
                <select
                    id="tabs"
                    name="tabs"
                    className="block w-full focus:ring-slate-700 focus:border-slate-700 border-gray-300 rounded-md"
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                >
                    {tabs.map((tab) => (
                        <option key={tab.id} value={tab.id}>{tab.label}</option>
                    ))}
                </select>
            </div>

            {/* Desktop tabs */}
            <div className="hidden sm:block">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <TabButton
                                key={tab.id}
                                label={tab.label}
                                active={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                            />
                        ))}
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                <TabContent activeTab={activeTab} />
            </div>
        </div>
    );
}