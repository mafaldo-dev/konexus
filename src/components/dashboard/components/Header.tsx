import { Bell, Search, LogOut, Clock, Package } from 'lucide-react';
import { useAuth } from '../../../AuthContext';
import { useDateTime } from '../../../utils/dateTime';
import { useChat } from '../../../ChatContext';

export default function Header({ sidebarCollapsed, setSidebarCollapsed }: any) {
    const { user, logout } = useAuth();
    const { setUserInactive } = useChat();
    const username = user?.username;
    const designation = user?.role || "";
    const getNowHour = useDateTime();

 

    const countStoredMessages = (): number => {
        const stored = localStorage.getItem('sector_messages');
        const messages = stored ? JSON.parse(stored) : [];
        return messages.length;
    };

    const totalMsg = countStoredMessages();

    const handleLogout = async () => {
        setUserInactive();                  
        logout();                           
    };

    return (
        <header className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <Package className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">
                            Bem-vindo(a), {username}!
                        </h2>
                        <p className="text-sm text-slate-600">
                            Gerencie seu negócio de forma inteligente
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        {totalMsg <= 0 ? (
                            <span className='text-slate-500 font-semibold'>{totalMsg}</span>
                        ) : (
                            <>
                                <Bell className="w-5 h-5 text-slate-600" />
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                            </>
                        )}
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-900">{username}</p>
                            <p className="text-xs text-slate-600">{designation}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock className="w-3 h-3" />
                                <span>{getNowHour}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
