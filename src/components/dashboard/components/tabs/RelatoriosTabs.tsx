import React, { useState, useRef } from "react"
import { Printer, Download, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card"
import { Button } from "../ui/Button"
import { DatePicker } from "../ui/DatePicker"
import { Badge } from "../ui/Badge"
import { Modal } from "../ui/Modal"
import { ReportPreview } from "../reports/ReportPreview"
import { transacoesFluxoCaixa } from "../../../../data/mockData"
import { formatCurrency, formatDate } from "../../../../utils/formatters"

export const RelatoriosTab: React.FC = () => {
  const [activeReportTab, setActiveReportTab] = useState("fluxo-caixa")
  const [isReportPreviewModalOpen, setIsReportPreviewModalOpen] = useState(false)
  const [periodoRelatorio, setPeriodoRelatorio] = useState("mensal")
  const [dataInicioRelatorio, setDataInicioRelatorio] = useState(new Date(2024, 0, 1))
  const [dataFimRelatorio, setDataFimRelatorio] = useState(new Date(2024, 0, 31))
  const reportContainerRef = useRef<HTMLDivElement>(null)

  const handlePeriodoChange = (periodo: string) => {
    setPeriodoRelatorio(periodo)

    const hoje = new Date()
    let inicio = new Date()
    let fim = new Date()

    switch (periodo) {
      case "diario":
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
        fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
        break
      case "semanal":
        const diaSemana = hoje.getDay()
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - diaSemana)
        fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + (6 - diaSemana))
        break
      case "mensal":
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        break
      case "anual":
        inicio = new Date(hoje.getFullYear(), 0, 1)
        fim = new Date(hoje.getFullYear(), 11, 31)
        break
      case "personalizado":
        break
    }

    setDataInicioRelatorio(inicio)
    setDataFimRelatorio(fim)
  }

  const handleGerarRelatorio = () => {
    setIsReportPreviewModalOpen(true)
  }

  const handlePrintReport = () => {
    const printWindow = window.open("")
    if (printWindow && reportContainerRef.current) {
      printWindow.document.write(`
        <html>
          <head>
          <title>Relatorio fluxo de caixa</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body { 
                font-family: Arial, sans-serif; 
                font-size: 12px;
                line-height: 1.4;
                color: #000;
                background: white;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                flex-direction: column;

                > h1 {
                  display: flex;
                  justify-content: center;
                  font-size: 1.5em;
                }
              }
              
              .report-container {
                max-width: 210mm;
                margin: 0 auto;
                flex: 1;
                display: flex;
                flex-direction: column;
              }
              
              .content-wrapper {
                flex: 1;
              }
              
              .header {
                display: flex;
                justify-content: center;
                align-items: left;
                border-bottom: 1px solid #ccc;
                padding-bottom: 12px;
                margin-bottom: 12px;
                padding-left: 0;
              }
              
              .header-left {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-left: 0;
              }
              
              .logo {
                width: 40px;
                height: 40px;
                border: 1px solid #000;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
              }
              
              .company-info h1 {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 2px;
              }
              
              .company-info p {
                font-size: 10px;
                color: #666;
              }
              
              .header-right {
                text-align: right;
                font-size: 10px;
                color: #666;
              }
              
              .summary {
                margin-bottom: 12px;
              }
              
              .summary > div {
                display: flex;
                justify-content: space-between;
                border: 1px solid #ccc;
                border-radius: 4px;
                padding: 8px;
              }
              
              .summary-item {
                text-align: center;
                padding: 0 8px;
                flex: 1;
              }
              
              .summary-item:not(:last-child) {
                border-right: 1px solid #ccc;
              }
              
              .summary-label {
                font-size: 10px;
                color: #666;
                margin-bottom: 4px;
              }
              
              .summary-value {
                font-size: 14px;
                font-weight: bold;
              }
              
              .content {
                display: flex;
                gap: 12px;
                margin-bottom: 12px;
              }
              
              .column {
                flex: 1;
              }
              
              .section-title {
                font-size: 10px;
                font-weight: bold;
                margin-bottom: 4px;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 10px;
              }
              
              th {
                background-color: #f5f5f5;
                padding: 4px;
                text-align: left;
                font-weight: bold;
                border-bottom: 1px solid #ccc;
              }
              
              td {
                padding: 4px;
                border-bottom: 1px solid #eee;
              }
              
              tr:last-child td {
                border-bottom: none;
              }
              
              .text-right {
                text-align: right;
              }
              
              .text-center {
                text-align: center;
              }
              
              .footer {
                border-top: 1px solid #ccc;
                padding-top: 8px;
                margin-top: auto;
                display: flex;
                justify-content: space-between;
                font-size: 10px;
                color: #666;
              }
              
              .truncate {
                max-width: 120px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
              
              .flex {
                display: flex;
              }
              
              .justify-between {
                justify-content: space-between;
              }
              
              .border {
                border: 1px solid #ccc;
              }
              
              .border-gray-300 {
                border-color: #ccc;
              }
              
              .rounded {
                border-radius: 4px;
              }
              
              .p-2 {
                padding: 8px;
              }
              
              .px-2 {
                padding-left: 8px;
                padding-right: 8px;
              }
              
              .mb-3 {
                margin-bottom: 12px;
              }
              
              .text-xs {
                font-size: 10px;
              }
              
              .text-sm {
                font-size: 14px;
              }
              
              .font-bold {
                font-weight: bold;
              }
              
              .text-gray-600 {
                color: #666;
              }
              
              .border-l {
                border-left: 1px solid #ccc;
              }
              
              .border-r {
                border-right: 1px solid #ccc;
              }
              
              @media print {
                body { 
                  margin: 0; 
                  padding: 10px;
                  min-height: 100vh;
                }
                
                .report-container {
                  min-height: calc(100vh - 20px);
                }
                
                .footer {
                  position: fixed;
                  bottom: 10px;
                  left: 10px;
                  right: 10px;
                  border-top: 1px solid #ccc;
                  padding-top: 8px;
                  background: white;
                  display: flex;
                  justify-content: space-between;
                  font-size: 10px;
                  color: #666;
                }
                
                .content-wrapper {
                  padding-bottom: 40px;
                }
                
                .no-print { 
                  display: none; 
                }
              }
            </style>
          </head>
          <body>
            ${reportContainerRef.current.innerHTML}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleDownloadPDF = () => {
    //ADICIONAR FUNCIONALIDADE DE GERAR PDF
    alert("Funcionalidade de download em PDF será implementada em breve!")
  }

  const transacoesFiltradas = transacoesFluxoCaixa.filter((transacao: any) => {
    const [ano, mes, dia] = transacao.data.split("-").map(Number)
    const dataTransacao = new Date(ano, mes - 1, dia) 

    const dataInicio = new Date(dataInicioRelatorio)
    dataInicio.setHours(0, 0, 0, 0)

    const dataFim = new Date(dataFimRelatorio)
    dataFim.setHours(23, 59, 59, 999)

    return dataTransacao >= dataInicio && dataTransacao <= dataFim
  })

  const totalEntradas = transacoesFiltradas.filter((t:any) => t.tipo === "entrada").reduce((sum:any, t:any) => sum + t.valor, 0)
  const totalSaidas = transacoesFiltradas.filter((t:any) => t.tipo === "saida").reduce((sum:any, t:any) => sum + t.valor, 0)
  const saldoPeriodo = totalEntradas - totalSaidas

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveReportTab("fluxo-caixa")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeReportTab === "fluxo-caixa"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Fluxo de Caixa
          </button>
          <button
            onClick={() => setActiveReportTab("dre")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeReportTab === "dre" ? "bg-white shadow-sm text-slate-900" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            DRE
          </button>
          <button
            onClick={() => setActiveReportTab("impostos")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeReportTab === "impostos"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Impostos
          </button>
        </div>
      </div>

      {activeReportTab === "fluxo-caixa" && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório de Fluxo de Caixa</CardTitle>
            <CardDescription>Visualize todas as transações em um período específico</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Período</label>
                <select value={periodoRelatorio}  onChange={(e) => setPeriodoRelatorio(e.target.value)}>
                  <option value="diario">
                    Diário
                  </option>
                  <option value="semanal">
                    Semanal
                  </option>
                  <option value="mensal">
                    Mensal
                  </option>
                  <option value="anual">
                    Anual
                  </option>
                  <option value="personalizado">
                    Personalizado
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
                <DatePicker value={dataInicioRelatorio} onChange={setDataInicioRelatorio} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data Fim</label>
                <DatePicker value={dataFimRelatorio} onChange={setDataFimRelatorio} />
              </div>

              <div className="flex items-end">
                <Button className="w-full" onClick={handleGerarRelatorio}>
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Transações no Período</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {transacoesFiltradas.map((transacao:any) => (
                      <tr key={transacao.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {formatDate(transacao.data)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{transacao.descricao}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{transacao.categoria}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge variant="outline" className="capitalize">
                            {transacao.tipo}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                          <span className={transacao.tipo === "entrada" ? "text-emerald-600" : "text-red-600"}>
                            {formatCurrency(transacao.valor)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Resumo do Período</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-slate-600">Total de Entradas</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalEntradas)}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-slate-600">Total de Saídas</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSaidas)}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-slate-600">Saldo do Período</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(saldoPeriodo)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Preview do Relatório */}
      <Modal
        isOpen={isReportPreviewModalOpen}
        onClose={() => setIsReportPreviewModalOpen(false)}
        title="Pré-visualização do Relatório"
        size="full"
      >
        <div className="space-y-4">
          <ReportPreview
            ref={reportContainerRef}
            transactions={transacoesFiltradas}
            startDate={dataInicioRelatorio}
            endDate={dataFimRelatorio}
            totalEntradas={totalEntradas}
            totalSaidas={totalSaidas}
            saldoPeriodo={saldoPeriodo}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 no-print">
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handlePrintReport}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
