import { useState } from 'react'
import { LayoutDashboard, Package, Users, Truck, DollarSign, Warehouse, ShoppingCart, ShoppingBag, UserCheck, Settings, ChevronDown, ChevronRight, Bell, Search, User, LogOut, Clock, BarChart3, FileText, Calculator, CreditCard, TrendingUp, AlertTriangle, Package2, Clipboard, Calendar, Mail, Shield, Database, Printer, FileBarChart, Target, Award, Building, MapPin, Phone } from 'lucide-react'

import { useAuth } from '../../AuthContext'
import logo from '../../assets/image/guiman.png'
import { useDataHora } from "../../utils/data-hora"


export default function Dashboard({ children }: any) {
  const { user } = useAuth()
  const designation = user?.designation || ""
  const username = user?.username
  const getNowHour = useDataHora()

  // Estados para controlar expansão dos menus
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  function canAccess(allowed: string[]) {
    return allowed.includes(designation)
  }

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }))
  }

  const menuItems = [
    {
      key: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      access: ['Administrador', 'Vendedor', 'Financeiro', 'Conferente']
    },
    {
      key: 'gestao',
      title: 'Gestão',
      icon: Package,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'],
      submenu: [
        { title: 'Produtos', href: '/manager/products', icon: Package2, access: ['Administrador', 'Vendedor'] },
        { title: 'Clientes', href: '/manager/customers', icon: Users, access: ['Administrador', 'Vendedor'] },
        { title: 'Fornecedores', href: '/manager/suppliers', icon: Truck, access: ['Administrador'] },
        { title: 'Categorias', href: '/manager/categories', icon: Target, access: ['Administrador', 'Vendedor', 'Conferente'] },
        { title: 'Marcas', href: '/manager/brands', icon: Award, access: ['Administrador', 'Vendedor'] },
        { title: 'Unidades', href: '/manager/units', icon: Calculator, access: ['Administrador'] }
      ]
    },
    {
      key: 'vendas',
      title: 'Vendas',
      icon: ShoppingCart,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'],
      submenu: [
        { title: 'Pedidos', href: '/sales/orders', icon: ShoppingBag, access: ['Administrador', 'Vendedor'] },
        { title: 'Orçamentos', href: '/sales/order-list', icon: FileText, access: ['Administrador', 'Vendedor', 'Conferente'] },
        { title: 'Vendas Realizadas', href: '/sales/completed', icon: TrendingUp, access: ['Administrador', 'Vendedor'] },
        { title: 'Comissões', href: '/vendas/comissoes', icon: DollarSign, access: ['Administrador', 'Financeiro'] },
        { title: 'Metas', href: '/sales/goals', icon: Target },
        { title: 'Relatórios', href: '/report', icon: BarChart3, access: ['Administrador', 'Financeiro'] }
      ]
    },
    {
      key: 'compras',
      title: 'Compras',
      icon: ShoppingBag,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'],
      submenu: [
        { title: 'Pedidos de Compra', href: '/compras/pedidos', icon: Clipboard },
        { title: 'Cotações', href: '/compras/cotacoes', icon: FileText },
        { title: 'Recebimentos', href: '/compras/recebimentos', icon: Package },
        { title: 'Devoluções', href: '/compras/devolucoes', icon: AlertTriangle }
      ]
    },
    {
      key: 'estoque',
      title: 'Estoque',
      icon: Warehouse,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'],
      submenu: [
        { title: 'Inventário', href: '/estoque/inventario', icon: Package },
        { title: 'Movimentações', href: '/stock/movements', icon: TrendingUp },
        { title: 'Ajustes', href: '/estoque/ajustes', icon: Settings },
        { title: 'Alertas de Estoque', href: '/estoque/alertas', icon: AlertTriangle },
        { title: 'Transferências', href: '/estoque/transferencias', icon: Truck },
        { title: 'Contagem', href: '/estoque/contagem', icon: Clipboard }
      ]
    },
    {
      key: 'financeiro',
      title: 'Financeiro',
      icon: DollarSign,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'],
      submenu: [
        { title: 'Contas a Pagar', href: '/financeiro/pagar', icon: CreditCard },
        { title: 'Contas a Receber', href: '/financeiro/receber', icon: DollarSign },
        { title: 'Fluxo de Caixa', href: '/financeiro/fluxo', icon: TrendingUp },
        { title: 'Bancos e Contas', href: '/financeiro/bancos', icon: Building },
        { title: 'Faturas', href: '/financeiro/faturas', icon: FileText },
        { title: 'Conciliação', href: '/financeiro/conciliacao', icon: Calculator },
        { title: 'Impostos', href: '/financeiro/impostos', icon: FileBarChart },
        { title: 'Centros de Custo', href: '/financeiro/centros-custo', icon: Target }
      ]
    },
    {
      key: 'rh',
      title: 'Recursos Humanos',
      icon: UserCheck,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'],
      submenu: [
        { title: 'Funcionários', href: '/rh/employee', icon: Users },
        { title: 'Cargos e Salários', href: '/rh/infos', icon: Award },
        { title: 'Folha de Pagamento', href: '/rh/folha', icon: Calculator },
        { title: 'Ponto Eletrônico', href: '/rh/ponto', icon: Clock },
        { title: 'Férias', href: '/rh/ferias', icon: Calendar },
        { title: 'Benefícios', href: '/rh/beneficios', icon: Award },
        { title: 'Treinamentos', href: '/rh/treinamentos', icon: Target }
      ]
    },
    {
      key: 'crm',
      title: 'CRM',
      icon: Users,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'],
      submenu: [
        { title: 'Leads', href: '/crm/leads', icon: Target },
        { title: 'Oportunidades', href: '/crm/oportunidades', icon: TrendingUp },
        { title: 'Campanhas', href: '/crm/campanhas', icon: Mail },
        { title: 'Atendimentos', href: '/crm/atendimentos', icon: Phone },
        { title: 'Follow-up', href: '/crm/followup', icon: Calendar }
      ]
    },
    {
      key: 'relatorios',
      title: 'Relatórios',
      icon: BarChart3,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'],
      submenu: [
        { title: 'Dashboard Executivo', href: '/relatorios/executivo', icon: BarChart3 },
        { title: 'Vendas', href: '/relatorios/vendas', icon: ShoppingCart },
        { title: 'Financeiro', href: '/relatorios/financeiro', icon: DollarSign },
        { title: 'Estoque', href: '/relatorios/estoque', icon: Warehouse },
        { title: 'Clientes', href: '/relatorios/clientes', icon: Users },
        { title: 'Produtos', href: '/relatorios/produtos', icon: Package }
      ]
    },
    {
      key: 'configuracoes',
      title: 'Configurações',
      icon: Settings,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'],
      submenu: [
        { title: 'Usuários e Permissões', href: '/config/usuarios', icon: Users },
        { title: 'Parâmetros do Sistema', href: '/config/sistema', icon: Database },
        { title: 'Notificações', href: '/config/email', icon: Bell },
        { title: 'Segurança', href: '/config/seguranca', icon: Shield },
        { title: 'Backup', href: '/config/backup', icon: Database },
        { title: 'Impressoras', href: '/config/impressoras', icon: Printer },
        { title: 'Integração', href: '/config/integracao', icon: Settings }
      ]
    }
  ]

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-72'} bg-slate-900 text-slate-100 transition-all duration-300 fixed h-full z-50 shadow-xl`}>
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <img src={logo || "/placeholder.svg"} alt="Logo keppler" className="w-8 h-8" />
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-white">Keppler ERP</h1>
                <p className="text-xs text-slate-400">Sistema Integrado</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {menuItems.map((item) => {
              if (!canAccess(item.access)) return null
              
              const Icon = item.icon
              const isExpanded = expandedMenus[item.key]
              const hasSubmenu = item.submenu && item.submenu.length > 0

              return (
                <div key={item.key}>
                  {hasSubmenu ? (
                    <button
                      onClick={() => toggleMenu(item.key)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors group"
                    >
                      <Icon className="w-5 h-5 text-slate-400 group-hover:text-slate-200" />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.title}</span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </>
                      )}
                    </button>
                  ) : (
                    <a
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors group"
                    >
                      <Icon className="w-5 h-5 text-slate-400 group-hover:text-slate-200" />
                      {!sidebarCollapsed && <span>{item.title}</span>}
                    </a>
                  )}

                  {/* Submenu */}
                  {hasSubmenu && isExpanded && !sidebarCollapsed && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.submenu?.map((subItem) => {
                        if (subItem.access && !canAccess(subItem.access)) return null
                        
                        const SubIcon = subItem.icon
                        return (
                          <a
                            key={subItem.title}
                            href={subItem.href}
                            className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors group"
                          >
                            <SubIcon className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                            <span>{subItem.title}</span>
                          </a>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* User Info */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{username}</p>
                <p className="text-xs text-slate-400 truncate">{designation}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarCollapsed ? 'ml-16' : 'ml-72'} transition-all duration-300`}>
        {/* Header */}
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
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
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
                  <a
                    href="/"
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </a>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6 overflow-auto h-[calc(100vh-80px)]">
          {children}
        </main>
      </div>
    </div>
  )
}
