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
      access: ['Administrador', 'Financeiro', 'Conferente','Estoquista' ,'Vendedor', 'Gestor', 'Gerente', 'Comprador'],
      submenu: [
        { title: 'Produtos', to: '/manager/products', icon: Package2, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro'] },
        { title: 'Clientes', to: '/manager/customer', icon: Users, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro'] },
        { title: 'Fornecedores', to: '/manager/suppliers', icon: Truck, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro']},
        { title: 'Categorias', to: '/manager/categories', icon: Target, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro'] }
      ]
    },
    {
      key: 'vendas',
      title: 'Vendas',
      icon: ShoppingCart,
      access: ['Administrador', 'Financeiro', 'Conferente','Estoquista' ,'Vendedor','Gerente' ,'Gestor', 'Comprador'],
      submenu: [
        { title: 'Pedidos', to: '/sales/orders', icon: ShoppingBag, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente'] },
        { title: 'Orçamentos', to: '/sales/order-list', icon: FileText, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente']},
        { title: 'Vendas Realizadas', to: '/sales/completed', icon: TrendingUp, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente'] },
        { title: 'Comissões', to: '/sales/comissions', icon: DollarSign, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente']},
        { title: 'Metas', to: '/sales/goals', icon: Target, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente'] },
        { title: 'Relatórios', to: '/sales/reports', icon: BarChart3, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente'] }
      ]
    },
    {
      key: 'compras',
      title: 'Compras',
      icon: ShoppingBag,
      access: ['Administrador', 'Vendedor', 'Conferente','Estoquista' ,'Financeiro', 'Comprador', 'Gestor', 'Gerente'],
      submenu: [
        { title: 'Pedidos de Compra', to: '/shopping/purchase-order', icon: Clipboard, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro'] },
        { title: 'Recebimentos', to: '/shopping/invoice-entry', icon: Package, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro']}
      ]
    },
    {
      key: 'estoque',
      title: 'Estoque',
      icon: Warehouse,
      access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro'],
      submenu: [
        { title: 'Inventário', to: '/stock/inventory', icon: Package, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro'] },
        { title: 'Movimentações', to: '/stock/movements', icon: TrendingUp, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro']},
        { title: 'Alertas de Estoque', to: '/shopping/purchase-order', icon: AlertTriangle, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro']},
      ]
    },
    {
      key: 'financeiro',
      title: 'Financeiro',
      icon: DollarSign,
      access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro'],
      submenu: [
        { title: 'Finanças', to: '/financer/financial', icon: CreditCard, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro'] }]
    },
    {
      key: 'rh',
      title: 'Recursos Humanos',
      icon: UserCheck,
      access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro'],
      submenu: [
        { title: 'Funcionários', to: '/rh/employee', icon: Users, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro']},
        { title: 'Cargos e Salários', to: '/rh/infos', icon: Award, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente','Financeiro']},
        { title: 'Folha de Pagamento', to: '/rh/folha', icon: Calculator, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente','Financeiro']},
        { title: 'Ponto Eletrônico', to: '/rh/ponto', icon: Clock, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente','Financeiro'] },
        { title: 'Férias', to: '/rh/ferias', icon: Calendar, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente','Financeiro'] },
        { title: 'Benefícios', to: '/rh/beneficios', icon: Award, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro'] },
        { title: 'Treinamentos', to: '/rh/treinamentos', icon: Target, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente','Financeiro'] }
      ]

    },
    {
      key: 'crm',
      title: 'CRM',
      icon: Users,
      access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro'],
      submenu: [
        { title: 'Dashboard', to: '/crm/dashboard', icon: BarChart3, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro']},]
    },
    {
      key: 'config',
      title: 'Configurações',
      icon: Settings,
      access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro'],
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