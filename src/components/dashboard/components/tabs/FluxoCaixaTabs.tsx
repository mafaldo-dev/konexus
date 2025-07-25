import type React from "react"
import { Download } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

import { formatCurrency } from "../../../../utils/formatters"
import { fluxoCaixaProjecaoData } from "../../../../data/mockData"
import { Button } from "../ui/Button"
import { Select, SelectItem } from "../ui/Select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card"


export const FluxoCaixaTab: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Projeção de Fluxo de Caixa - Próximos 6 Meses</CardTitle>
            <CardDescription>Análise detalhada de entradas e saídas projetadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fluxoCaixaProjecaoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => [formatCurrency(value), ""]}
                  />
                  <Bar dataKey="entradas" fill="#10b981" name="Entradas" />
                  <Bar dataKey="saidas" fill="#ef4444" name="Saídas" />
                  <Bar dataKey="saldo" fill="#3b82f6" name="Saldo" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Controles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value="12">
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
            </Select>
            <Button className="w-full bg-transparent" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
