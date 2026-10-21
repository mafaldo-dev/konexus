import { Bell, Search, LogOut, Clock, Package, Building2, ChevronDown, Check, Star, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../AuthContext';
import { useDateTime } from '../../../utils/dateTime';
import { useChat } from '../../../ChatContext';
import Swal from "sweetalert2";
import { useRef, useState, useEffect } from 'react';


export default function Header({ sidebarCollapsed, setSidebarCollapsed }: any) {
    const { user, logout, legalEntities, activeLegalEntity, setActiveLegalEntity } = useAuth();
    const [entityMenuOpen, setEntityMenuOpen] = useState(false);
    const entityMenuRef = useRef<HTMLDivElement>(null);
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

    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (entityMenuRef.current && !entityMenuRef.current.contains(event.target as Node)) {
                setEntityMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const handleSelectEntity = async (entity: typeof legalEntities[number]) => {
        if (entity.id === activeLegalEntity?.id) {
            setEntityMenuOpen(false);
            return;
        }
        if (entity.status !== 'active') {
            await Swal.fire(
                'CNPJ indisponível para operar',
                entity.status === 'regularization'
                    ? 'Esta empresa está em regularização. O histórico continua acessível, mas novas operações estão bloqueadas até a regularização contratual.'
                    : 'Esta empresa está inativa e não pode emitir novas operações.',
                'warning'
            );
            return;
        }
        const pending = localStorage.getItem('konexus:operation-in-progress');
        if (pending) {
            let label = 'uma operação em andamento';
            try { label = JSON.parse(pending)?.label || label; } catch { /* ignore */ }
            const result = await Swal.fire({
                title: 'Trocar de CNPJ?',
                html: `Há <strong>${label}</strong> em andamento nesta tela.<br/>Ao trocar, os dados continuarão preservados, mas confirme que deseja sair desta operação antes de alterar o emitente.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Trocar e recarregar',
                cancelButtonText: 'Continuar nesta operação',
                confirmButtonColor: '#2563eb',
                reverseButtons: true,
            });
            if (!result.isConfirmed) return;
            localStorage.removeItem('konexus:operation-in-progress');
        }
        setActiveLegalEntity(entity);
        setEntityMenuOpen(false);
        await Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `Operando por ${entity.tradeName || entity.legalName}`,
            showConfirmButton: false,
            timer: 1400,
        });
        // Recarrega para que todas as consultas usem o novo contexto. O backend
        // revalida o CNPJ e jamais aceita a seleção local como autorização.
        window.location.reload();
    };

    const entityLabel = activeLegalEntity
        ? (activeLegalEntity.tradeName || activeLegalEntity.legalName)
        : (user?.role === 'Administrador' ? 'Selecionar CNPJ' : 'CNPJ não informado');
    const showLegalName = Boolean(activeLegalEntity?.tradeName && activeLegalEntity.tradeName !== activeLegalEntity.legalName);

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: "Tem certeza que deseja sair?",
            text: "Você será desconectado da sua conta.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sim, sair",
            cancelButtonText: "Cancelar",
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            setUserInactive();
            logout();

            await Swal.fire({
                title: "Sessão encerrada!",
                text: "Você saiu da conta com sucesso.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false,
            });
        }
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

                <div className="flex items-center gap-3">
                    {legalEntities.length > 0 && (
                        <div className="relative" ref={entityMenuRef}>
                            <button
                                type="button"
                                onClick={() => setEntityMenuOpen((open) => !open)}
                                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100 transition-colors min-w-[230px]"
                                title="Empresa jurídica responsável pelas novas operações"
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                    <Building2 className="h-4 w-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-1">
                                        <span className="truncate text-sm font-semibold text-slate-900">{entityLabel}</span>
                                        {activeLegalEntity?.isPrimary && <Star className="h-3 w-3 fill-amber-400 text-amber-500" />}
                                        {activeLegalEntity?.status === 'regularization' && <AlertTriangle className="h-3 w-3 text-amber-600" />}
                                    </span>
                                    {showLegalName && (
                                        <span className="block truncate text-[11px] text-slate-500">{activeLegalEntity?.legalName}</span>
                                    )}
                                    <span className="block text-[11px] text-slate-500">
                                        {activeLegalEntity?.cnpjFormatted || activeLegalEntity?.cnpj || 'CNPJ não cadastrado'}
                                        {activeLegalEntity?.status !== 'active' && (
                                            <span className="ml-1 text-amber-700">
                                                · {activeLegalEntity?.status === 'regularization' ? 'Em regularização' : 'Inativa'}
                                            </span>
                                        )}
                                    </span>
                                </span>
                                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${entityMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {entityMenuOpen && (
                                <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                    <div className="border-b border-slate-100 px-3 py-2">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Emitente das novas operações</p>
                                        <p className="text-xs text-slate-500">O histórico mantém o CNPJ original.</p>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto py-1">
                                        {legalEntities.map((entity) => {
                                            const selected = entity.id === activeLegalEntity?.id;
                                            const unavailable = entity.status !== 'active';
                                            return (
                                                <button
                                                    key={entity.id}
                                                    type="button"
                                                    onClick={() => handleSelectEntity(entity)}
                                                    className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors ${selected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                                >
                                                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center">
                                                        {selected ? <Check className="h-4 w-4 text-blue-600" /> : <span className="h-2 w-2 rounded-full bg-slate-300" />}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="flex items-center gap-1">
                                                            <span className="truncate text-sm font-medium text-slate-900">
                                                                {entity.tradeName || entity.legalName}
                                                            </span>
                                                            {entity.isPrimary && <Star className="h-3 w-3 fill-amber-400 text-amber-500" />}
                                                            {unavailable && <AlertTriangle className="h-3 w-3 text-amber-600" />}
                                                        </span>
                                                        {entity.tradeName && entity.tradeName !== entity.legalName && (
                                                            <span className="block truncate text-[11px] text-slate-500">{entity.legalName}</span>
                                                        )}
                                                        <span className="block text-[11px] text-slate-500">
                                                            {entity.cnpjFormatted || entity.cnpj || 'CNPJ não cadastrado'}
                                                            <span className={`ml-1 ${unavailable ? 'text-amber-700' : 'text-emerald-700'}`}>
                                                                · {entity.status === 'active' ? 'Ativa' : entity.status === 'regularization' ? 'Em regularização' : 'Inativa'}
                                                            </span>
                                                        </span>
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setEntityMenuOpen(false); window.location.href = '/config/legal-entities'; }}
                                        className="w-full border-t border-slate-100 px-3 py-2 text-left text-xs font-medium text-blue-700 hover:bg-blue-50"
                                    >
                                        Gerenciar empresas / CNPJs
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

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
