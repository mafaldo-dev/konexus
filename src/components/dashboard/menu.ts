import { LayoutDashboard, Package, Users, Truck, DollarSign, Warehouse, ShoppingCart, ShoppingBag, UserCheck, Settings, Package2, Target, Award, Calculator, FileText, TrendingUp, BarChart3, Clipboard, AlertTriangle, CreditCard, Building, FileBarChart, Clock, Calendar, Bell, Shield, Database, Printer } from 'lucide-react';

export const menuItems = [
    {
      key: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      to: '/dashboard',
      access: ['Administrador', 'Vendedor', 'Financeiro', 'Conferente']
    },
    {
      key: 'gestao',
      title: 'Gestão',
      icon: Package,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'],
      submenu: [
        { title: 'Produtos', to: '/manager/products', icon: Package2, access: ['Administrador', 'Vendedor'] },
        { title: 'Clientes', to: '/manager/customers', icon: Users, access: ['Administrador', 'Vendedor'] },
        { title: 'Fornecedores', to: '/manager/suppliers', icon: Truck, access: ['Administrador'] },
        { title: 'Categorias', to: '/manager/categories', icon: Target, access: ['Administrador', 'Vendedor', 'Conferente'] },
        { title: 'Marcas', to: '/manager/brands', icon: Award, access: ['Administrador', 'Vendedor'] },
        { title: 'Unidades', to: '/manager/units', icon: Calculator, access: ['Administrador'] }
      ]
    },
    {
      key: 'vendas',
      title: 'Vendas',
      icon: ShoppingCart,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'],
      submenu: [
        { title: 'Pedidos', to: '/sales/orders', icon: ShoppingBag, access: ['Administrador', 'Vendedor'] },
        { title: 'Orçamentos', to: '/sales/order-list', icon: FileText, access: ['Administrador', 'Vendedor', 'Conferente'] },
        { title: 'Vendas Realizadas', to: '/sales/completed', icon: TrendingUp, access: ['Administrador', 'Vendedor'] },
        { title: 'Comissões', to: '/sales/comissions', icon: DollarSign, access: ['Administrador', 'Financeiro'] },
        { title: 'Metas', to: '/sales/goals', icon: Target, access: ['Administrador', 'Financeiro', 'Vendedor'] },
        { title: 'Relatórios', to: '/sales/reports', icon: BarChart3, access: ['Administrador', 'Financeiro'] }
      ]
    },
    {
      key: 'compras',
      title: 'Compras',
      icon: ShoppingBag,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro', 'Buyer'],
      submenu: [
        { title: 'Pedidos de Compra', to: '/shopping/purchase-order', icon: Clipboard, access: ['Administrador', 'Financeiro', 'Buyer'] },
        { title: 'Recebimentos', to: '/shopping/invoice-entry', icon: Package, access: ['Administrador', 'Financeiro', 'Buyer', 'Conferente'] }
      ]
    },
    {
      key: 'estoque',
      title: 'Estoque',
      icon: Warehouse,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'],
      submenu: [
        { title: 'Inventário', to: '/stock/inventory', icon: Package, access: ['Administrador', 'Conferente'] },
        { title: 'Movimentações', to: '/stock/movements', icon: TrendingUp, access: ['Administrador', 'Conferente', 'Buyer'] },
        { title: 'Alertas de Estoque', to: '/shopping/purchase-order', icon: AlertTriangle, acess: ['Administrador', 'Conferente', 'Buyer'] },
        //{ title: 'Transferências', to: '/stock/transfers', icon: Truck, access: ['Administrador'] },
        //{ title: 'Contagem', to: '/stock/counts', icon: Clipboard, access: ['Administrador', 'Conferente'] }
      ]
    },
    {
      key: 'financeiro',
      title: 'Financeiro',
      icon: DollarSign,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'],
      submenu: [
        { title: 'Contas a Pagar', to: '/financeiro/pagar', icon: CreditCard },
        { title: 'Contas a Receber', to: '/financeiro/receber', icon: DollarSign },
        { title: 'Fluxo de Caixa', to: '/financeiro/fluxo', icon: TrendingUp },
        { title: 'Bancos e Contas', to: '/financeiro/bancos', icon: Building },
        { title: 'Faturas', to: '/financeiro/faturas', icon: FileText },
        { title: 'Conciliação', to: '/financeiro/conciliacao', icon: Calculator },
        { title: 'Impostos', to: '/financeiro/impostos', icon: FileBarChart },
        { title: 'Centros de Custo', to: '/financeiro/centros-custo', icon: Target }
      ]
    },
    {
      key: 'rh',
      title: 'Recursos Humanos',
      icon: UserCheck,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'],
      submenu: [
        { title: 'Funcionários', to: '/rh/employee', icon: Users },
        { title: 'Cargos e Salários', to: '/rh/infos', icon: Award },
        { title: 'Folha de Pagamento', to: '/rh/folha', icon: Calculator },
        { title: 'Ponto Eletrônico', to: '/rh/ponto', icon: Clock },
        { title: 'Férias', to: '/rh/ferias', icon: Calendar },
        { title: 'Benefícios', to: '/rh/beneficios', icon: Award },
        { title: 'Treinamentos', to: '/rh/treinamentos', icon: Target }
      ]

    },
    {
      key: 'crm',
      title: 'CRM',
      icon: Users,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'],
      submenu: [
        { title: 'Dashboard', to: '/crm/dashboard', icon: BarChart3, access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'] },]
    },
    {
      key: 'config',
      title: 'Configurações',
      icon: Settings,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Financeiro'],
      submenu: [
        { title: 'Usuários e Permissões', to: '/config/users-permissions', icon: Users },
        { title: 'Parâmetros do Sistema', to: '/config/system', icon: Database, access: ['Administrador'] },
        { title: 'Notificações', to: '/config/notifications', icon: Bell },
        { title: 'Segurança', to: '/config/security-area', icon: Shield },
        { title: 'Backup', to: '/config/backup', icon: Database },
        { title: 'Impressoras', to: '/config/impressoras', icon: Printer },
        { title: 'Integração', to: '/config/integration', icon: Settings },
        { title: 'Ajustes', to: '/dashboard', icon: Settings, access: ['Administrador'] },
      ]
    }
  ]