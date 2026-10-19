/**
 * src/pages/planos/index.tsx
 * Página informativa sobre o modelo comercial freemium do Konexus ERP.
 *
 * Explica:
 *  - Quais módulos são gratuitos
 *  - Que o Financeiro é um módulo pago
 *  - Que a NF-e é um módulo pago
 *  - Que o suporte é um serviço comercial distinto
 *  - Opções de assinatura mensal e anual (condições a serem definidas)
 *
 * Não inventa preços, canais de atendimento ou prazos.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { API_CONFIG } from '../../api/config';
import Dashboard from '../../components/dashboard/Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/dashboard/components/ui/Card';
import { Button } from '../../components/dashboard/components/ui/Button';
import {
  DollarSign, Package, Users, Truck, ShoppingCart, Warehouse, Headset, FileText, Shield, CreditCard, Calendar, Wrench, Zap
} from 'lucide-react';

interface PlanInfo {
  title: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  paid: boolean;
  moduleKey?: string;
}

const PLANOS: PlanInfo[] = [
  {
    title: 'Gestão de Produtos',
    description: 'Cadastro, listagem, atualização e exclusão de produtos do catálogo.',
    icon: Package,
    features: ['Cadastro de produtos', 'Controle de estoque básico', 'Códigos de barras e NCM', 'Fornecedores vinculados'],
    paid: false,
  },
  {
    title: 'Gestão de Clientes',
    description: 'Cadastro e gerenciamento de clientes e seus endereços.',
    icon: Users,
    features: ['Cadastro de clientes', 'Endereços de entrega e cobrança', 'Listagem e busca', 'Documentos (CPF/CNPJ)'],
    paid: false,
  },
  {
    title: 'Gestão de Fornecedores',
    description: 'Cadastro e gerenciamento de fornecedores de produtos e serviços.',
    icon: Truck,
    features: ['Cadastro de fornecedores', 'Contato e documento', 'Listagem e busca', 'Avaliação de desempenho'],
    paid: false,
  },
  {
    title: 'Pedidos de Venda',
    description: 'Criação e acompanhamento de pedidos de venda para clientes.',
    icon: ShoppingCart,
    features: ['Criação de pedidos', 'Itens do pedido', 'Status do pedido', 'Lista de separação'],
    paid: false,
  },
  {
    title: 'Pedidos de Compra',
    description: 'Solicitação e acompanhamento de compras junto a fornecedores.',
    icon: ShoppingCart,
    features: ['Criação de pedidos de compra', 'Recebimento de mercadorias', 'Acompanhamento de status', 'Histórico de compras'],
    paid: false,
  },
  {
    title: 'Controle de Estoque',
    description: 'Movimentações de estoque, kardex e inventário de produtos.',
    icon: Warehouse,
    features: ['Entrada e saída de estoque', 'Kardex de movimentações', 'Contagem de inventário', 'Alertas de estoque mínimo'],
    paid: false,
  },
  {
    title: 'Ordens de Serviço',
    description: 'Criação e gerenciamento de ordens de serviço para manutenção e atendimento.',
    icon: Wrench,
    features: ['Criação de OS', 'Itens da OS', 'Status de execução', 'Movimentação de estoque'],
    paid: false,
  },
  {
    title: 'Financeiro',
    description: 'Módulo pago. Gestão de contas a pagar, recebimentos e dashboard financeiro.',
    icon: DollarSign,
    features: ['Contas a pagar', 'Recebimentos de pedidos', 'Dashboard financeiro', 'Relatórios de pagamento'],
    paid: true,
    moduleKey: 'finance',
  },
  {
    title: 'NF-e (Nota Fiscal Eletrônica)',
    description: 'Módulo pago. Emissão e consulta de notas fiscais eletrônicas.',
    icon: FileText,
    features: ['Emissão de NF-e', 'Consulta de status', 'Download do DANFE', 'Integração PlugNotas'],
    paid: true,
    moduleKey: 'nfe',
  },
  {
    title: 'CRM',
    description: 'Gestão de relacionamento com clientes, oportunidades e pipeline de vendas.',
    icon: Users,
    features: ['Cadastro de leads e clientes', 'Pipeline de vendas', 'Oportunidades', 'Relatórios de CRM'],
    paid: false,
  },
  {
    title: 'Recursos Humanos',
    description: 'Cadastro de colaboradores, cargos, salários e comissões.',
    icon: Users,
    features: ['Cadastro de colaboradores', 'Cargos e salários', 'Comissões', 'Controle de assiduidade'],
    paid: false,
  },
];

export default function PlanosPage() {
  const navigate = useNavigate();
  const { user, company, modules } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Verifica se o modulo Financeiro esta disponível para a empresa
  const hasFinanceAccess = modules.includes('finance');
  // Verifica se o modulo NF-e esta disponível
  const hasNfeAccess = modules.includes('nfe');

  useEffect(() => {
    // Tenta carregar a assinatura da empresa (endpoint opcional)
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    if (!company?.id) return;
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/subscription`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription || null);
      }
    } catch (err) {
      // Falha ao carregar assinatura nao bloqueia a pagina informativa
      console.debug('Nao foi possível carregar assinatura:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = () => {
    setError(
      'A contratação de assinaturas ainda não está disponível neste ambiente. ' +
      'Entre em contato com a administração do sistema para informações sobre planos e condições.'
    );
  };

  const getPaidModules = () => PLANOS.filter((p) => p.paid);

  const getFreeModules = () => PLANOS.filter((p) => !p.paid);

  return (
    <Dashboard>
      <div className="min-h-screen bg-slate-50 p-6">
        {/* Header */}
        <div className="mb-10 flex justify-between items-start md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Planos e Módulos</h1>
            <p className="text-slate-600 mt-2">
              Conheça os módulos do Konexus ERP e saiba quais estão disponíveis para sua empresa.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge status={hasFinanceAccess ? 'ativo' : 'inativo'} label="Financeiro" />
            <Badge status={hasNfeAccess ? 'ativo' : 'inativo'} label="NF-e" />
          </div>
        </div>

        {/* Mensagem de apresentação */}
        <Card className="mb-8">
          <CardHeader className="bg-blue-50 border-b border-blue-100">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">Konexus ERP - Modelo Freemium</h2>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">
              O Konexus oferece gratuitamente a maior parte dos seus módulos de gestão empresarial.
              Módulos especializados, como <strong>Financeiro</strong> e <strong>NF-e</strong>, são
              oferecidos por assinatura, conforme o plano contratado pela sua empresa.
            </p>
            {company?.name && (
              <p className="text-slate-600 text-sm">
                Empresa atual: <strong>{company.name}</strong>
              </p>
            )}
            {subscription && (
              <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg text-sm">
                <p className="text-green-800 font-medium mb-1">Sua assinatura:</p>
                <p className="text-green-700">
                  Plano: {subscription.plan_name || '—'} | Status: {subscription.status || '—'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Módulos Gratuitos */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-green-600" />
            <h2 className="text-2xl font-bold text-slate-900">Módulos Gratuitos</h2>
          </div>
          <p className="text-slate-600 mb-6">
            Esses módulos estão disponíveis para todas as empresas, sem custo de assinatura.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFreeModules().map((modulo) => (
              <Card key={modulo.title} className="hover:shadow-md transition-shadow group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <modulo.icon className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                      <span className="font-semibold text-slate-900">{modulo.title}</span>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      Grátis
                    </span>
                  </div>
                  <CardDescription>{modulo.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {modulo.features.map((f) => (
                      <li key={f} className="flex items-center gap-1">
                        <span className="text-green-500">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Módulos Pagos */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-5 h-5 text-amber-600" />
            <h2 className="text-2xl font-bold text-slate-900">Módulos por Assinatura</h2>
          </div>
          <p className="text-slate-600 mb-6">
            Esses módulos exigem um plano pago ativo. A contratação é feita por meio de assinatura
            mensal ou anual, conforme as condições disponibilizadas.
          </p>
          {error && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getPaidModules().map((modulo) => {
              const isActive = modulo.moduleKey === 'finance' ? hasFinanceAccess : modulo.moduleKey === 'nfe' ? hasNfeAccess : false;
              return (
                <Card key={modulo.title} className={`border-l-4 ${isActive ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50'}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <modulo.icon className="w-5 h-5 text-amber-600" />
                        <span className="font-semibold text-slate-900">{modulo.title}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {isActive ? 'Ativo' : 'Plano necessário'}
                      </span>
                    </div>
                    <CardDescription>{modulo.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {modulo.features.map((f) => (
                        <li key={f} className="flex items-center gap-1">
                          <span className={isActive ? 'text-green-500' : 'text-amber-500'}>{isActive ? '✓' : '○'}</span> {f}
                        </li>
                      ))}
                    </ul>
                    {!isActive && (
                      <Button
                        onClick={() => handleUpgrade()}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white mt-3"
                        size="sm"
                      >
                        Contratar assinatura
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Suporte */}
        <section className="mb-10">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Headset className="w-6 h-6 text-slate-600" />
                <h2 className="text-xl font-semibold text-slate-900">Suporte Técnico</h2>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 mb-4">
                O suporte técnico é um serviço comercial distinto do acesso aos módulos do ERP.
                Você pode contratar suporte quando precisar de assistência, independentemente do
                plano de assinatura dos módulos.
              </p>
              <div className="bg-slate-100 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-600 mb-2">
                  <strong>Como solicitar suporte:</strong>
                </p>
                <p className="text-sm text-slate-600">
                  Os canais de atendimento, valores e prazos de resposta ainda não estão configurados.
                  Entre em contato com a administração do sistema para obter informações sobre
                  contratação de suporte.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Voltar ao Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Rodapé informativo */}
        <Card className="border-t-2 border-slate-200">
          <CardContent className="pt-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <Shield className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-600 font-medium">Seus dados estão seguros</p>
                <p className="text-xs text-slate-500">Isolamento por empresa (companyId)</p>
              </div>
              <div>
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-600 font-medium">Planos flexíveis</p>
                <p className="text-xs text-slate-500">Mensal ou anual (a definir)</p>
              </div>
              <div>
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-600 font-medium">Pague apenas o que usa</p>
                <p className="text-xs text-slate-500">Módulos pagos por assinatura</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Dashboard>
  );
}

interface BadgeProps {
  status: 'ativo' | 'inativo';
  label: string;
}

function Badge({ status, label }: BadgeProps) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
      status === 'ativo'
        ? 'bg-green-100 text-green-700 border border-green-200'
        : 'bg-amber-100 text-amber-700 border border-amber-200'
    }`}>
      {label}: {status === 'ativo' ? 'Disponível' : 'Plano necessário'}
    </span>
  );
}
