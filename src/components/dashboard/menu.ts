import { LayoutDashboard, Package, Users, Truck, DollarSign, Warehouse, ShoppingCart, ShoppingBag, UserCheck, Settings, Package2, Target, Award, Calculator, FileText, TrendingUp, BarChart3, Clipboard, AlertTriangle, CreditCard, Building, FileBarChart, Clock, Calendar, Bell, Shield, Database, Printer } from 'lucide-react';

export const menuItems = [
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
        { title: 'Comissões', href: '/sales/comissions', icon: DollarSign, access: ['Administrador', 'Financeiro'] },
        { title: 'Metas', href: '/sales/goals', icon: Target, access: ['Administrador', 'Financeiro', 'Vendedor'] },
        { title: 'Relatórios', href: '/sales/report', icon: BarChart3, access: ['Administrador', 'Financeiro'] }
      ]
    },
    {
      key: 'compras',
      title: 'Compras',
      icon: ShoppingBag,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro', 'Buyer'],
      submenu: [
        { title: 'Pedidos de Compra', href: '/shopping/purchase-order', icon: Clipboard, access: ['Administrador', 'Financeiro', 'Buyer'] },
        { title: 'Recebimentos', href: '/shopping/invoice-entry', icon: Package, access: ['Administrador', 'Financeiro', 'Buyer', 'Conferente'] },
        { title: 'Devoluções', href: '/shopping/invoice-back', icon: AlertTriangle, acess: ['Administrador', 'Financeiro', 'Buyer', 'Conferente'] }
      ]
    },
    {
      key: 'estoque',
      title: 'Estoque',
      icon: Warehouse,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'],
      submenu: [
        { title: 'Inventário', href: '/stock/inventory', icon: Package },
        { title: 'Movimentações', href: '/stock/movements', icon: TrendingUp },
        { title: 'Ajustes', href: '/stock/changes', icon: Settings },
        { title: 'Alertas de Estoque', href: '/stock/alerts', icon: AlertTriangle },
        { title: 'Transferências', href: '/stock/transfers', icon: Truck },
        { title: 'Contagem', href: '/stock/counts', icon: Clipboard }
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
        { title: 'Dashboard', href: '/crm/dashboard', icon: BarChart3, access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'] },]
    },
    {
      key: 'config',
      title: 'Configurações',
      icon: Settings,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'],
      submenu: [
        { title: 'Usuários e Permissões', href: '/config/users-permissions', icon: Users },
        { title: 'Parâmetros do Sistema', href: '/config/system', icon: Database, access: ['Administrador'] },
        { title: 'Notificações', href: '/config/notifications', icon: Bell },
        { title: 'Segurança', href: '/config/security-area', icon: Shield },
        { title: 'Backup', href: '/config/backup', icon: Database },
        { title: 'Impressoras', href: '/config/impressoras', icon: Printer },
        { title: 'Integração', href: '/config/integration', icon: Settings }
      ]
    }
  ]