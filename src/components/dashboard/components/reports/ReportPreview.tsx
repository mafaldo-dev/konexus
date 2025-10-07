import { forwardRef } from "react"
import { Building2, Calendar, FileText } from "lucide-react"
import { formatCurrency, formatDate } from "../../../../utils/formatters"

interface Transaction {
  id: number
  data: string
  descricao: string
  tipo: "entrada" | "saida"
  categoria: string
  valor: number
}

interface ReportPreviewProps {
  transactions: Transaction[]
  startDate: Date
  endDate: Date
  totalEntradas: number
  totalSaidas: number
  saldoPeriodo: number
}

export const ReportPreview = forwardRef<HTMLDivElement, ReportPreviewProps>(
  ({ transactions, startDate, endDate, totalEntradas, totalSaidas, saldoPeriodo }, ref) => {
    const hoje = new Date()

    // Agrupar transações por categoria
    const transacoesPorCategoria = transactions.reduce(
      (acc, transacao) => {
        if (!acc[transacao.categoria]) {
          acc[transacao.categoria] = { entradas: 0, saidas: 0, total: 0 }
        }

        if (transacao.tipo === "entrada") {
          acc[transacao.categoria].entradas += transacao.valor
        } else {
          acc[transacao.categoria].saidas += transacao.valor
        }

        acc[transacao.categoria].total = acc[transacao.categoria].entradas - acc[transacao.categoria].saidas

        return acc
      },
      {} as Record<string, { entradas: number; saidas: number; total: number }>,
    )

    return (
      <div ref={ref} className="report-container bg-white text-black w-[210mm] mx-auto p-4 shadow-lg text-xs">
        <div className="content-wrapper">
          {/* Cabeçalho do Relatório */}
          <div className="header border-b border-gray-300 pb-3 mb-3 flex items-center justify-between">
            <div className="header-left flex items-center gap-2">
              <div className="logo h-10 w-10 border border-gray-800 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-gray-800" />
              </div>
              <div className="company-info">
                <h1 className="text-lg font-bold text-gray-900">Konéxus</h1>
                <p className="text-xs text-gray-600">Sistema integrado</p>
              </div>
            </div>
            <div className="header-right text-right text-xs">
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="h-3 w-3" />
                <span>
                  {startDate.toLocaleDateString("pt-BR")} a {endDate.toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <FileText className="h-3 w-3" />
                <span>Gerado em: {hoje.toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          </div>

          {/* Resumo Executivo */}
          <div className="summary mb-3">
            <div className="flex justify-between border border-gray-300 rounded p-2">
              <div className="summary-item text-center px-2">
                <div className="summary-label text-xs text-gray-600">Total de Entradas</div>
                <div className="summary-value text-sm font-bold">{formatCurrency(totalEntradas)}</div>
              </div>
              <div className="summary-item border-l border-r border-gray-300 text-center px-2">
                <div className="summary-label text-xs text-gray-600">Total de Saídas</div>
                <div className="summary-value text-sm font-bold">{formatCurrency(totalSaidas)}</div>
              </div>
              <div className="summary-item text-center px-2">
                <div className="summary-label text-xs text-gray-600">Saldo do Período</div>
                <div className="summary-value text-sm font-bold">{formatCurrency(saldoPeriodo)}</div>
              </div>
            </div>
          </div>

          <div className="content flex gap-3 mb-3">
            {/* Detalhamento das Transações */}
            <div className="column w-full">
              <div className="section-title text-xs font-semibold text-gray-900 mb-1">Detalhamento das Transações</div>
              <div className="overflow-hidden rounded border border-gray-300">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-1 py-1 text-left font-medium text-gray-900">Data</th>
                      <th className="px-1 py-1 text-left font-medium text-gray-900">Descrição</th>
                      <th className="px-1 py-1 text-center font-medium text-gray-900">Tipo</th>
                      <th className="px-1 py-1 text-right font-medium text-gray-900">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map((transacao) => (
                      <tr key={transacao.id}>
                        <td className="px-1 py-1 text-gray-700">{formatDate(transacao.data)}</td>
                        <td className="px-1 py-1 text-gray-900">
                          <div className="truncate max-w-[120px]" title={transacao.descricao}>
                            {transacao.descricao}
                          </div>
                        </td>
                        <td className="px-1 py-1 text-center">
                          <span className="text-xs">{transacao.tipo === "entrada" ? "Entrada" : "Saída"}</span>
                        </td>
                        <td className="px-1 py-1 text-right">{formatCurrency(transacao.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="footer border-t border-gray-300 pt-2 mt-2 text-xs text-gray-600 flex justify-between">
          <div>Konéxus - Sistema integrado</div>
          <div>Confidencial - Uso Interno</div>
        </div>
      </div>
    )
  },
)

ReportPreview.displayName = "ReportPreview"
