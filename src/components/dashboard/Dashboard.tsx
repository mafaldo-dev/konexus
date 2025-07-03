import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

export default function Dashboard({ children }: any) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar sidebarCollapsed={sidebarCollapsed} />
            <div className={`flex-1 ${sidebarCollapsed ? 'ml-16' : 'ml-72'} transition-all duration-300`}>
                <Header sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
                <main className="p-6 overflow-auto h-[calc(100vh-80px)]">
                    {children}
                </main>
            </div>
        </div>
    );
}
