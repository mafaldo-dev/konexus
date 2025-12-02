import { useState } from "react"
import { BancosTab } from "../../components/dashboard/components/tabs/BankTabs"
import { FluxoCaixaTab } from "../../components/dashboard/components/tabs/FluxoCaixaTabs"

import { OverviewTab } from "../../components/dashboard/components/tabs/OverviewTabs"
import { TabButton } from "../../components/dashboard/components/ui/TabButton"
import Dashboard from "../../components/dashboard/Dashboard"
import { Button } from "../../components/dashboard/components/ui/Button"

import {
  TrendingUp,
  Building2,
  Plus,
  PieChart,
} from "lucide-react"

export default function FinancialDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

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
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="space-y-6">
              <div className="border-b border-slate-200">
                <div className="flex gap-1 p-1 bg-slate-100/50 rounded-lg w-fit">
                  <TabButton isActive={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={PieChart}>
                    Visão Geral
                  </TabButton>
                  <TabButton isActive={activeTab === "fluxo-caixa"} onClick={() => setActiveTab("fluxo-caixa")} icon={TrendingUp}>
                    Fluxo de Caixa
                  </TabButton>
                  <TabButton isActive={activeTab === "bancos"} onClick={() => setActiveTab("bancos")} icon={Building2}>
                    Contas Bancárias
                  </TabButton>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "overview" && <OverviewTab />}
              {activeTab === "fluxo-caixa" && <FluxoCaixaTab />}
              {activeTab === "bancos" && <BancosTab />}
            </div>
          </div>
        </div>
      </div>
    </Dashboard>
  )
}
