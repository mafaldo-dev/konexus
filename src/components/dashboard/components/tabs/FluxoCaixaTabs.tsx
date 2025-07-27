import React, { useState } from 'react'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

import { formatCurrency } from "../../../../utils/formatters"
import { fluxoCaixaProjecaoData } from "../../../../data/mockData"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card"

export const FluxoCaixaTab: React.FC = () => {
  const [month, setMonth] = useState(6)

  const filteredData = fluxoCaixaProjecaoData.slice(0, month)
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
                <BarChart data={filteredData}>
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
            <select 
              value={month} 
              onChange={(e) => setMonth(Number(e.target.value))}
              className='p-1 cursor-pointer bg-gray-100'
              >
              <option value="3">3 meses</option>
              <option value="6">6 meses</option>
              <option value="12">12 meses</option>
            </select>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
