import { LayoutDashboard, Package, Users, Truck, DollarSign, Warehouse, ShoppingCart, ShoppingBag, UserCheck, Settings, Package2, Target, Award, Calculator, FileText, TrendingUp, BarChart3, Clipboard, AlertTriangle, CreditCard, Building, FileBarChart, Clock, Calendar, Bell, Shield, Database, Printer } from 'lucide-react';

export const menuItems = [
    {
      key: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      to: '/dashboard',
      access: ['Administrador', 'Financeiro', 'Conferente','Estoquista' ,'Vendedor']
    },
    {
      key: 'gestao',
      title: 'Gestão',
      icon: Package,
      access: ['Administrador', 'Financeiro', 'Conferente','Estoquista' ,'Vendedor'],
      submenu: [
        { title: 'Produtos', to: '/manager/products', icon: Package2, access: ['Administrador', 'Vendedor'] },
        { title: 'Clientes', to: '/manager/customer', icon: Users, access: ['Administrador', 'Vendedor'] },
        { title: 'Fornecedores', to: '/manager/suppliers', icon: Truck, access: ['Administrador'] },
        { title: 'Categorias', to: '/manager/categories', icon: Target, access: ['Administrador', 'Vendedor', 'Conferente', 'Estoquista'] }
      ]
    },
    {
      key: 'vendas',
      title: 'Vendas',
      icon: ShoppingCart,
      access: ['Administrador', 'Financeiro', 'Conferente','Estoquista' ,'Vendedor'],
      submenu: [
        { title: 'Pedidos', to: '/sales/orders', icon: ShoppingBag, access: ['Administrador', 'Vendedor'] },
        { title: 'Orçamentos', to: '/sales/order-list', icon: FileText, access: ['Administrador', 'Vendedor', 'Conferente', 'Estoquista'] },
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
      access: ['Administrador', 'Vendedor', 'Conferente','Estoquista' ,'Financeiro', 'Buyer'],
      submenu: [
        { title: 'Pedidos de Compra', to: '/shopping/purchase-order', icon: Clipboard, access: ['Administrador', 'Financeiro', 'Buyer'] },
        { title: 'Recebimentos', to: '/shopping/invoice-entry', icon: Package, access: ['Administrador', 'Financeiro', 'Buyer', 'Conferente', 'Estoquista'] }
      ]
    },
    {
      key: 'estoque',
      title: 'Estoque',
      icon: Warehouse,
      access: ['Administrador', 'Financeiro', 'Conferente','Estoquista' ,'Vendedor', 'Buyer'],
      submenu: [
        { title: 'Inventário', to: '/stock/inventory', icon: Package, access: ['Administrador', 'Conferente', 'Estoquista'] },
        { title: 'Movimentações', to: '/stock/movements', icon: TrendingUp, access: ['Administrador', 'Conferente', 'Buyer', 'Estoquista'] },
        { title: 'Alertas de Estoque', to: '/shopping/purchase-order', icon: AlertTriangle, acess: ['Administrador', 'Conferente','Estoquista' ,'Buyer'] },
        //{ title: 'Transferências', to: '/stock/transfers', icon: Truck, access: ['Administrador', 'Estoquista'] },
        //{ title: 'Contagem', to: '/stock/counts', icon: Clipboard, access: ['Administrador', 'Conferente', 'Estoquista'] }
      ]
    },
    {
      key: 'financeiro',
      title: 'Financeiro',
      icon: DollarSign,
      access: ['Administrador', 'Vendedor', 'Conferente', 'Estoquista' ,'Financeiro'],
      submenu: [
        { title: 'Contas a Pagar', to: '/financer/payment', icon: CreditCard, access: ['Administrador', 'Financeiro'] },
        { title: 'Contas a Receber', to: '/financeiro/receber', icon: DollarSign, access: ['Administrador', 'Financeiro'] },
        { title: 'Fluxo de Caixa', to: '/financeiro/fluxo', icon: TrendingUp, access: ['Administrador', 'Financeiro'] },
        { title: 'Bancos e Contas', to: '/financeiro/bancos', icon: Building, access: ['Administrador', 'Financeiro'] },
        { title: 'Faturas', to: '/financeiro/faturas', icon: FileText, access: ['Administrador', 'Financeiro'] },
        { title: 'Conciliação', to: '/financeiro/conciliacao', icon: Calculator, access: ['Administrador', 'Financeiro'] },
        { title: 'Impostos', to: '/financeiro/impostos', icon: FileBarChart, access: ['Administrador', 'Financeiro'] },
        { title: 'Centros de Custo', to: '/financeiro/centros-custo', icon: Target, access: ['Administrador', 'Financeiro'] }
      ]
    },
    {
      key: 'rh',
      title: 'Recursos Humanos',
      icon: UserCheck,
      access: ['Administrador', 'Financeiro', 'Conferente','Estoquista' ,'Vendedor'],
      submenu: [
        { title: 'Funcionários', to: '/rh/employee', icon: Users, access: ['Administrador', 'Financeiro'] },
        { title: 'Cargos e Salários', to: '/rh/infos', icon: Award, access: ['Administrador', 'Financeiro'] },
        { title: 'Folha de Pagamento', to: '/rh/folha', icon: Calculator, access: ['Administrador', 'Financeiro'] },
        { title: 'Ponto Eletrônico', to: '/rh/ponto', icon: Clock, access: ['Administrador', 'Financeiro'] },
        { title: 'Férias', to: '/rh/ferias', icon: Calendar, access: ['Administrador', 'Financeiro'] },
        { title: 'Benefícios', to: '/rh/beneficios', icon: Award, access: ['Administrador', 'Financeiro'] },
        { title: 'Treinamentos', to: '/rh/treinamentos', icon: Target, access: ['Administrador', 'Financeiro'] }
      ]

    },
    {
      key: 'crm',
      title: 'CRM',
      icon: Users,
      access: ['Administrador', 'Financeiro', 'Conferente','Estoquista' ,'Vendedor'],
      submenu: [
        { title: 'Dashboard', to: '/crm/dashboard', icon: BarChart3, access: ['Administrador', 'Financeiro'] },]
    },
    {
      key: 'config',
      title: 'Configurações',
      icon: Settings,
      access: ['Administrador', 'Financeiro', 'Conferente','Estoquista' ,'Vendedor'],
      submenu: [
        { title: 'Usuários e Permissões', to: '/config/users-permissions', icon: Users, access: ['Administrador'] },
        { title: 'Parâmetros do Sistema', to: '/config/system', icon: Database, access: ['Administrador'] },
        { title: 'Notificações', to: '/config/notifications', icon: Bell, access: ['Administrador'] },
        { title: 'Segurança', to: '/config/security-area', icon: Shield, access: ['Administrador'] },
        { title: 'Backup', to: '/config/backup', icon: Database, access: ['Administrador'] },
        { title: 'Impressoras', to: '/config/impressoras', icon: Printer, access: ['Administrador'] },
        { title: 'Integração', to: '/config/integration', icon: Settings, access: ['Administrador'] },
        { title: 'Ajustes', to: '/dashboard', icon: Settings, access: ['Administrador'] },
      ]
    }
  ]