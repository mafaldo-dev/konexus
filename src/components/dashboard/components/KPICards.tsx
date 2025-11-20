import { ArrowUpRight, ArrowDownRight, TrendingUp, CreditCard, DollarSign, Receipt } from "lucide-react"
import { Card, CardContent } from "./ui/Card"
import { formatCurrency } from "../../../utils/formatters"

interface Transitions {
  entradas: number
  saidas: number
  saldo: number
  faturas: number
}


export const KPICards = ({entradas, saidas, saldo, faturas}: Transitions) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Contas a Receber</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(entradas)}</p>
              <p className="text-xs text-emerald-600 mt-1 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12.5% vs mês anterior
              </p>
            </div>
            <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Contas a Pagar</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(saidas)}</p>
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                -3.2% vs mês anterior
              </p>
            </div>
            <div className="h-12 w-12 bg-red-50 rounded-xl flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Fluxo de Caixa</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(saldo)}</p>
              <p className="text-xs text-slate-600 mt-1">Saldo projetado 30 dias</p>
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Faturas Emitidas</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(faturas)}</p>
              <p className="text-xs text-slate-600 mt-1">3 faturas este mês</p>
            </div>
            <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Receipt className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
