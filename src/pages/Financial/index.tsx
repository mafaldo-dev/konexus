import { useState } from "react"
import { KPICards } from "../../components/dashboard/components/KPICards"
import { BancosTab } from "../../components/dashboard/components/tabs/BankTabs"
import { FluxoCaixaTab } from "../../components/dashboard/components/tabs/FluxoCaixaTabs"
import { MovimentacoesTab } from "../../components/dashboard/components/tabs/MovimentacoesTabs"
import { OverviewTab } from "../../components/dashboard/components/tabs/OverviewTabs"
import { RelatoriosTab } from "../../components/dashboard/components/tabs/RelatoriosTabs"
import { TabButton } from "../../components/dashboard/components/ui/TabButton"
import Dashboard from "../../components/dashboard/Dashboard"
import { Button } from "../../components/dashboard/components/ui/Button"

import { transacoesFluxoCaixa } from "../../data/mockData"
import {
  CreditCard,
  TrendingUp,
  Building2,
  FileText,
  Plus,
  PieChart,
} from "lucide-react"

export default function FinancialDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  // Estados para controle do período filtrado
  const [dataInicioRelatorio, setDataInicioRelatorio] = useState(new Date(2024, 0, 1)) // Janeiro
  const [dataFimRelatorio, setDataFimRelatorio] = useState(new Date(2024, 0, 31))
  const [mesSelecionado, setMesSelecionado] = useState("janeiro")

  // Mapeamento dos meses para datas reais
const meses: Record<string, [Date, Date]> = {
  janeiro: [new Date(2024, 0, 1), new Date(2024, 0, 31)],
  dezembro: [new Date(2023, 11, 1), new Date(2023, 11, 31)],
  novembro: [new Date(2023, 10, 1), new Date(2023, 10, 30)],
}

  // Atualiza o período ao selecionar mês
  const handleSelectMes = (mes: string) => {
    setMesSelecionado(mes)
    const [inicio, fim] = meses[mes]
    setDataInicioRelatorio(inicio)
    setDataFimRelatorio(fim)
  }

  // Transações filtradas para o período
  const transacoesFiltradas = transacoesFluxoCaixa.filter((transacao) => {
    const dataTransacao = new Date(transacao.data)
    return dataTransacao >= dataInicioRelatorio && dataTransacao <= dataFimRelatorio
  })

  const totalEntradas = transacoesFiltradas
    .filter((t) => t.tipo === "entrada")
    .reduce((sum, t) => sum + t.valor, 0)

  const totalSaidas = transacoesFiltradas
    .filter((t) => t.tipo === "saida")
    .reduce((sum, t) => sum + t.valor, 0)

  const saldoPeriodo = totalEntradas - totalSaidas

  const faturas = 10

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
                  <select
                    value={mesSelecionado}
                    onChange={(e) => handleSelectMes(e.target.value)}
                    className="border border-gray-300 rounded p-2 bg-gray-100"
                  >
                    <option value="janeiro">Janeiro 2024</option>
                    <option value="dezembro">Dezembro 2023</option>
                    <option value="novembro">Novembro 2023</option>
                  </select>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Transação
                  </Button>
                </div>
              </div>
            </div>

            <KPICards
              entradas={totalEntradas}
              saidas={totalSaidas}
              saldo={saldoPeriodo}
              faturas={faturas}
            />

            {/* Navigation Tabs */}
            <div className="space-y-6">
              <div className="border-b border-slate-200">
                <div className="flex gap-1 p-1 bg-slate-100/50 rounded-lg w-fit">
                  <TabButton isActive={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={PieChart}>
                    Visão Geral
                  </TabButton>
                  <TabButton isActive={activeTab === "movimentacoes"} onClick={() => setActiveTab("movimentacoes")} icon={CreditCard}>
                    Movimentações
                  </TabButton>
                  <TabButton isActive={activeTab === "fluxo-caixa"} onClick={() => setActiveTab("fluxo-caixa")} icon={TrendingUp}>
                    Fluxo de Caixa
                  </TabButton>
                  <TabButton isActive={activeTab === "bancos"} onClick={() => setActiveTab("bancos")} icon={Building2}>
                    Contas Bancárias
                  </TabButton>
                  <TabButton isActive={activeTab === "relatorios"} onClick={() => setActiveTab("relatorios")} icon={FileText}>
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
