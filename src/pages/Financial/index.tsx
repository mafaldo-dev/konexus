import React, { useState} from "react"
import {
  CreditCard,
  TrendingUp,
  Building2,
  FileText,
  Plus,
  PieChart,
} from "lucide-react"
import { KPICards } from "../../components/dashboard/components/KPICards"
import { BancosTab } from "../../components/dashboard/components/tabs/BankTabs"
import { FluxoCaixaTab } from "../../components/dashboard/components/tabs/FluxoCaixaTabs"
import { MovimentacoesTab } from "../../components/dashboard/components/tabs/MovimentacoesTabs"
import { OverviewTab } from "../../components/dashboard/components/tabs/OverviewTabs"
import { RelatoriosTab } from "../../components/dashboard/components/tabs/RelatoriosTabs"
import { TabButton } from "../../components/dashboard/components/ui/TabButton"
import Dashboard from "../../components/dashboard/Dashboard"
import { Button } from "../../components/dashboard/components/ui/Button"
import { Select } from "../../components/dashboard/components/ui/Select"

const SelectItem = ({
  children,
  onClick,
}: {
  children: React.ReactNode
  value: string
  onClick?: () => void
}) => (
  <div className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-50" onClick={onClick}>
    {children}
  </div>
)

const transacoesFluxoCaixa = [
  {
    id: 1,
    data: "2024-01-05",
    descricao: "Pagamento Microsoft Office 365",
    tipo: "saida",
    categoria: "Software",
    valor: 1250.0,
  },
  {
    id: 2,
    data: "2024-01-07",
    descricao: "Recebimento Fatura #FAT-2024-002",
    tipo: "entrada",
    categoria: "Vendas",
    valor: 28500.0,
  },
  {
    id: 3,
    data: "2024-01-10",
    descricao: "Pagamento Aluguel Escritório",
    tipo: "saida",
    categoria: "Instalações",
    valor: 5800.0,
  },
  {
    id: 4,
    data: "2024-01-12",
    descricao: "Pagamento Salários",
    tipo: "saida",
    categoria: "Folha de Pagamento",
    valor: 32000.0,
  },
  {
    id: 5,
    data: "2024-01-15",
    descricao: "Recebimento Adiantamento Projeto",
    tipo: "entrada",
    categoria: "Serviços",
    valor: 15000.0,
  },
  {
    id: 6,
    data: "2024-01-18",
    descricao: "Pagamento AWS Cloud",
    tipo: "saida",
    categoria: "Infraestrutura",
    valor: 8750.0,
  },
  {
    id: 7,
    data: "2024-01-20",
    descricao: "Recebimento Consultoria",
    tipo: "entrada",
    categoria: "Serviços",
    valor: 12500.0,
  },
  {
    id: 8,
    data: "2024-01-22",
    descricao: "Pagamento Energia Elétrica",
    tipo: "saida",
    categoria: "Utilidades",
    valor: 1450.0,
  },
  {
    id: 9,
    data: "2024-01-25",
    descricao: "Pagamento Internet",
    tipo: "saida",
    categoria: "Utilidades",
    valor: 890.0,
  },
  {
    id: 10,
    data: "2024-01-28",
    descricao: "Recebimento Fatura #FAT-2024-003",
    tipo: "entrada",
    categoria: "Vendas",
    valor: 67200.0,
  },
  {
    id: 11,
    data: "2024-01-30",
    descricao: "Pagamento Impostos",
    tipo: "saida",
    categoria: "Impostos",
    valor: 12450.0,
  },
  {
    id: 12,
    data: "2024-01-31",
    descricao: "Recebimento Juros Aplicação",
    tipo: "entrada",
    categoria: "Investimentos",
    valor: 1850.0,
  },
]

export default function FinancialDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [dataInicioRelatorio, setDataInicioRelatorio] = useState(new Date(2024, 0, 1)) // 1 de janeiro de 2024
  const [dataFimRelatorio, setDataFimRelatorio] = useState(new Date(2024, 0, 31)) // 31 de janeiro de 2024

  // Filtrar transações pelo período selecionado
  const transacoesFiltradas = transacoesFluxoCaixa.filter((transacao) => {
    const dataTransacao = new Date(transacao.data)
    return dataTransacao >= dataInicioRelatorio && dataTransacao <= dataFimRelatorio
  })

  // Calcular totais para o relatório
  const totalEntradas = transacoesFiltradas.filter((t) => t.tipo === "entrada").reduce((sum, t) => sum + t.valor, 0)

  const totalSaidas = transacoesFiltradas.filter((t) => t.tipo === "saida").reduce((sum, t) => sum + t.valor, 0)

  const saldoPeriodo = totalEntradas - totalSaidas

  return (
    <Dashboard>
      <div className="min-h-screen bg-slate-50/50">
        <div className="px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Financeiro</h2>
                  <p className="text-slate-600 mt-1">Visão completa das suas operações financeiras</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value="janeiro">
                    <SelectItem value="janeiro">Janeiro 2024</SelectItem>
                    <SelectItem value="dezembro">Dezembro 2023</SelectItem>
                    <SelectItem value="novembro">Novembro 2023</SelectItem>
                  </Select>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Transação
                  </Button>
                </div>
              </div>
            </div>
            <KPICards />
            {/* Navigation Tabs */}
            <div className="space-y-6">
              <div className="border-b border-slate-200">
                <div className="flex gap-1 p-1 bg-slate-100/50 rounded-lg w-fit">
                  <TabButton isActive={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={PieChart}>
                    Visão Geral
                  </TabButton>
                  <TabButton
                    isActive={activeTab === "movimentacoes"}
                    onClick={() => setActiveTab("movimentacoes")}
                    icon={CreditCard}
                  >
                    Movimentações
                  </TabButton>
                  <TabButton
                    isActive={activeTab === "fluxo-caixa"}
                    onClick={() => setActiveTab("fluxo-caixa")}
                    icon={TrendingUp}
                  >
                    Fluxo de Caixa
                  </TabButton>
                  <TabButton isActive={activeTab === "bancos"} onClick={() => setActiveTab("bancos")} icon={Building2}>
                    Contas Bancárias
                  </TabButton>
                  <TabButton
                    isActive={activeTab === "relatorios"}
                    onClick={() => setActiveTab("relatorios")}
                    icon={FileText}
                  >
                    Relatórios
                  </TabButton>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "overview" && <OverviewTab />}
              {activeTab === "movimentacoes" && <MovimentacoesTab />}
              {activeTab === "fluxo-caixa" && <FluxoCaixaTab />}
              {activeTab === "bancos" && <BancosTab />}
              {activeTab === "relatorios" && <RelatoriosTab />}
            </div>
          </div>
        </div>
      </div>
    </Dashboard>
  )
}
