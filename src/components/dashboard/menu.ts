import { LayoutDashboard, Package, Users, Truck, DollarSign, Warehouse, ShoppingCart, Archive, ShoppingBag, UserCheck, Settings, Package2, Target, Award, Calculator, FileText, TrendingUp, BarChart3, Clipboard, AlertTriangle, CreditCard, Building, FileBarChart, Clock, Calendar, Bell, Shield, Database, Printer, FileTextIcon } from 'lucide-react';

export const menuItems = [
    {
      key: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      to: '/dashboard',
      access: ['Administrador', 'Financeiro', 'Conferente','Estoquista' ,'Vendedor', 'Encarregado', 'Comprador', 'Gestor', 'Gerente']
    },
    {
      key: 'gestao',
      title: 'Gestão',
      icon: Package,
      access: ['Administrador', 'Financeiro', 'Conferente','Estoquista' ,'Vendedor', 'Gestor', 'Gerente', 'Comprador', 'Encarregado'],
      submenu: [
        { title: 'Produtos', to: '/manager/products', icon: Package2, access: ['Administrador', 'Vendedor','Conferente', 'Gestor', 'Comprador', 'Gerente', 'Financeiro', 'Encarregado'] },
        { title: 'Clientes', to: '/manager/customer', icon: Users, access: ['Administrador', 'Vendedor','Conferente', 'Gestor', 'Gerente', 'Financeiro', 'Encarregado'] },
        { title: 'Fornecedores', to: '/manager/suppliers', icon: Truck, access: ['Administrador', 'Vendedor','Conferente', 'Gestor', 'Comprador', 'Gerente', 'Financeiro', 'Encarregado']},
        { title: 'Categorias', to: '/manager/categories', icon: Target, access: ['Administrador','Gestor','Gerente', 'Comprador', 'Financeiro', 'Encarregado'] },
        { title: 'Orders de serviço', to: '/manager/services', icon: Archive, access: ['Administrador', 'Gestor', 'Comprador', 'Gerente', 'Encarregado']}
      ]
    },
    {
      key: 'vendas',
      title: 'Vendas',
      icon: ShoppingCart,
      access: ['Administrador', 'Financeiro', 'Conferente','Estoquista' ,'Vendedor','Gerente' ,'Gestor', 'Comprador', 'Encarregado'],
      submenu: [
        { title: 'Pedidos', to: '/sales/orders', icon: ShoppingBag, access: ['Administrador', 'Vendedor', 'Gestor', 'Comprador', 'Gerente', 'Encarregado'] },
        { title: 'Orçamentos', to: '/sales/order-list', icon: FileText, access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor',  'Gerente', 'Encarregado']},
      ]
    },
    {
      key: 'compras',
      title: 'Compras',
      icon: ShoppingBag,
      access: ['Administrador', 'Vendedor', 'Conferente','Estoquista' ,'Financeiro', 'Comprador', 'Gestor', 'Gerente', 'Encarregado'],
      submenu: [
        { title: 'Pedidos de Compra', to: '/shopping/purchase-order', icon: Clipboard, access: ['Administrador', 'Conferente',  'Gestor', 'Comprador', 'Gerente', 'Financeiro', 'Encarregado'] },
        { title: 'Recebimentos', to: '/shopping/invoice-entry', icon: Package, access: ['Administrador', 'Conferente', 'Gestor', 'Comprador', 'Gerente', 'Financeiro', 'Encarregado']}
      ]
    },
    {
      key: 'estoque',
      title: 'Estoque',
      icon: Warehouse,
      access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro', 'Encarregado'],
      submenu: [
        { title: 'Inventário', to: '/stock/inventory', icon: Package, access: ['Administrador', 'Conferente', 'Estoquista', 'Gestor', 'Gerente', 'Encarregado'] }, 
        { title: 'Movimentações', to: '/stock/movements', icon: TrendingUp, access: ['Administrador', 'Vendedor', 'Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Encarregado']},
        { title: 'Alertas de Estoque', to: '/shopping/purchase-order', icon: AlertTriangle, access: ['Administrador', 'Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Encarregado']},
        { title: 'Relatórios', to: '/sales/reports', icon: BarChart3, access: ['Administrador', 'Vendedor', 'Conferente',  'Gestor', 'Gerente', 'Encarregado'] }
      ]
    },
    {
      key: 'financeiro',
      title: 'Financeiro',
      icon: DollarSign,
      access: ['Administrador','Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro', 'Encarregado'],
      submenu: [
        { title: 'Finanças', to: '/financer/financial', icon: CreditCard, access: ['Administrador', 'Gestor', 'Gerente', 'Financeiro', 'Encarregado'] },
        { title: 'Metas', to: '/sales/goals', icon: Target, access: ['Administrador', 'Gestor', 'Financeiro', 'Gerente'] },
        { title: "NF-e", to: '/financial/order-nfe', icon: FileTextIcon, access: ['Administrador', 'Gestor', 'Gerente', 'Financeiro']},
        { title: 'Vendas Realizadas', to: '/sales/completed', icon: TrendingUp, access: ['Administrador', 'Gestor', 'Gerente'] },
        { title: 'Comissões', to: '/sales/comissions', icon: DollarSign, access: ['Administrador',' Gestor', 'Financeiro', 'Gerente']},
      ]
    },
    {
      key: 'rh',
      title: 'Recursos Humanos',
      icon: UserCheck,
      access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro', 'Encarregado'],
      submenu: [
        { title: 'Funcionários', to: '/rh/employee', icon: Users, access: ['Administrador', 'Gestor', 'Financeiro', 'Encarregado']},
        { title: 'Cargos e Salários', to: '/rh/infos', icon: Award, access: ['Administrador', 'Gestor', 'Gerente','Financeiro', 'Encarregado']},
        { title: 'Folha de Pagamento', to: '/rh/folha', icon: Calculator, access: ['Administrador', 'Gestor', 'Gerente','Financeiro', 'Encarregado']},
        { title: 'Ponto Eletrônico', to: '/rh/ponto', icon: Clock, access: ['Administrador', 'Gestor', 'Gerente','Financeiro', 'Encarregado'] },
        { title: 'Férias', to: '/rh/ferias', icon: Calendar, access: ['Administrador', 'Gestor', 'Gerente','Financeiro', 'Encarregado'] },
        { title: 'Benefícios', to: '/rh/beneficios', icon: Award, access: ['Administrador', 'Gestor', 'Gerente', 'Financeiro', 'Encarregado'] },
        { title: 'Treinamentos', to: '/rh/treinamentos', icon: Target, access: ['Administrador', 'Vendedor', 'Gestor', 'Gerente','Financeiro', 'Encarregado'] }
      ],

    },
    {
      key: 'crm',
      title: 'CRM',
      icon: Users,
      access: ['Administrador', 'Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro'],
      submenu: [
        { title: 'Dashboard', to: '/crm/dashboard', icon: BarChart3, access: ['Administrador', 'Vendedor', 'Gestor', 'Gerente', 'Financeiro']},]
    },
    {
      key: 'config',
      title: 'Configurações',
      icon: Settings,
      access: ['Administrador','Vendedor','Conferente', 'Estoquista', 'Gestor', 'Comprador', 'Gerente', 'Financeiro'],
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