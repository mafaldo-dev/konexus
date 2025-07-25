"use client"

import type React from "react"

import { useState, useRef } from "react"
import {
  CreditCard,
  TrendingUp,
  Building2,
  FileText,
  Plus,
  PieChart,
  ChevronDown,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { KPICards } from "../../components/dashboard/components/KPICards"
import { BancosTab } from "../../components/dashboard/components/tabs/BankTabs"
import { FluxoCaixaTab } from "../../components/dashboard/components/tabs/FluxoCaixaTabs"
import { MovimentacoesTab } from "../../components/dashboard/components/tabs/MovimentacoesTabs"
import { OverviewTab } from "../../components/dashboard/components/tabs/OverviewTabs"
import { RelatoriosTab } from "../../components/dashboard/components/tabs/RelatoriosTabs"
import { TabButton } from "../../components/dashboard/components/ui/TabButton"
import Dashboard from "../../components/dashboard/Dashboard"

// Componentes customizados
const CustomButton = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}: {
  children: React.ReactNode
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "icon"
  className?: string
  [key: string]: any
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"

  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-800",
    outline: "border border-slate-300 bg-white hover:bg-slate-50",
    ghost: "hover:bg-slate-100",
  }

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-sm",
    icon: "h-10 w-10",
  }

  return (
    <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl shadow-sm ${className}`}>{children}</div>
)

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pb-4 ${className}`}>{children}</div>
)

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
)

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-slate-900 ${className}`}>{children}</h3>
)

const CardDescription = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-slate-600 mt-1 ${className}`}>{children}</p>
)

const Input = ({ className = "", ...props }: { className?: string;[key: string]: any }) => (
  <input
    className={`flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
)

const CustomSelect = ({
  children,
  value,
  onValueChange,
  className = "",
}: {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value || "")

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
      >
        <span>{selectedValue || "Selecione..."}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          {children}
        </div>
      )}
    </div>
  )
}

const SelectItem = ({
  children,
  value,
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

const Badge = ({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode
  variant?: "default" | "secondary" | "destructive" | "outline"
  className?: string
}) => {
  const variants = {
    default: "bg-emerald-100 text-emerald-800",
    secondary: "bg-yellow-100 text-yellow-800",
    destructive: "bg-red-100 text-red-800",
    outline: "border border-slate-300 bg-white text-slate-700",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

const Table = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className="w-full overflow-auto">
    <table className={`w-full caption-bottom text-sm ${className}`}>{children}</table>
  </div>
)

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="[&_tr]:border-b">{children}</thead>
)

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="[&_tr:last-child]:border-0">{children}</tbody>
)

const TableRow = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <tr className={`border-b transition-colors hover:bg-slate-50/50 ${className}`}>{children}</tr>
)

const TableHead = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <th className={`h-12 px-4 text-left align-middle font-medium text-slate-500 ${className}`}>{children}</th>
)

const TableCell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`p-4 align-middle ${className}`}>{children}</td>
)

const Separator = ({
  orientation = "horizontal",
  className = "",
}: {
  orientation?: "horizontal" | "vertical"
  className?: string
}) => (
  <div
    className={`shrink-0 bg-slate-200 ${orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]"
      } ${className}`}
  />
)

const Avatar = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>{children}</div>
)

const AvatarFallback = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex h-full w-full items-center justify-center rounded-full bg-slate-100 ${className}`}>
    {children}
  </div>
)

// Modal Component
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "default",
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "default" | "large" | "full"
}) => {
  if (!isOpen) return null

  const sizes = {
    default: "max-w-md",
    large: "max-w-3xl",
    full: "max-w-6xl",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-lg w-full mx-4 ${sizes[size]}`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <CustomButton variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </CustomButton>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// DatePicker Component
const DatePicker = ({
  value,
  onChange,
  className = "",
}: {
  value: Date
  onChange: (date: Date) => void
  className?: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(value || new Date())

  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    setSelectedDate(newDate)
    onChange(newDate)
    setIsOpen(false)
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const renderCalendar = () => {
    const days = []
    const totalDays = daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth())
    const firstDay = firstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth())

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-10 w-10 flex items-center justify-center text-slate-300">
          {""}
        </div>,
      )
    }

    // Add cells for each day of the month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const isSelected =
        selectedDate &&
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()

      days.push(
        <div
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`h-10 w-10 flex items-center justify-center rounded-full cursor-pointer ${isSelected ? "bg-slate-900 text-white" : "hover:bg-slate-100 text-slate-700"
            }`}
        >
          {day}
        </div>,
      )
    }

    return days
  }

  return (
    <div className={`relative ${className}`}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
      >
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-slate-500" />
          <span>
            {selectedDate
              ? selectedDate.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
              : "Selecione uma data"}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-64 rounded-lg border border-slate-200 bg-white shadow-lg p-3">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="font-medium">
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
              <div key={i} className="h-8 w-8 flex items-center justify-center text-xs font-medium text-slate-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
        </div>
      )}
    </div>
  )
}

// Dados mockados
const contasPagar = [
  {
    id: 1,
    fornecedor: "Microsoft Corporation",
    valor: 15420.0,
    vencimento: "2024-01-15",
    status: "pendente",
    categoria: "Software",
    documento: "NF-001234",
  },
  {
    id: 2,
    fornecedor: "Amazon Web Services",
    valor: 8750.0,
    vencimento: "2024-01-20",
    status: "vencido",
    categoria: "Infraestrutura",
    documento: "INV-5678",
  },
  {
    id: 3,
    fornecedor: "Slack Technologies",
    valor: 2340.0,
    vencimento: "2024-01-25",
    status: "pago",
    categoria: "Software",
    documento: "SUB-9012",
  },
  {
    id: 4,
    fornecedor: "Adobe Systems",
    valor: 4680.0,
    vencimento: "2024-01-28",
    status: "pendente",
    categoria: "Design",
    documento: "LIC-3456",
  },
]

const contasReceber = [
  {
    id: 1,
    cliente: "TechCorp Solutions",
    valor: 45000.0,
    vencimento: "2024-01-18",
    status: "pendente",
    projeto: "Sistema ERP",
    documento: "FAT-2024-001",
  },
  {
    id: 2,
    cliente: "InnovateX Ltd",
    valor: 28500.0,
    vencimento: "2024-01-22",
    status: "recebido",
    projeto: "App Mobile",
    documento: "FAT-2024-002",
  },
  {
    id: 3,
    cliente: "GlobalTech Inc",
    valor: 67200.0,
    vencimento: "2024-01-28",
    status: "vencido",
    projeto: "Consultoria",
    documento: "FAT-2024-003",
  },
]

const faturas = [
  {
    id: 1,
    numero: "FAT-2024-001",
    cliente: "TechCorp Solutions",
    valor: 45000.0,
    emissao: "2024-01-01",
    status: "enviada",
    projeto: "Sistema ERP",
  },
  {
    id: 2,
    numero: "FAT-2024-002",
    cliente: "InnovateX Ltd",
    valor: 28500.0,
    emissao: "2024-01-05",
    status: "paga",
    projeto: "App Mobile",
  },
  {
    id: 3,
    numero: "FAT-2024-003",
    cliente: "GlobalTech Inc",
    valor: 67200.0,
    emissao: "2024-01-08",
    status: "enviada",
    projeto: "Consultoria",
  },
]

// Nova aba de pedidos
const pedidos = [
  {
    id: 1,
    numero: "PED-2024-001",
    cliente: "TechCorp Solutions",
    valor: 45000.0,
    data: "2024-01-10",
    status: "aprovado",
    produto: "Sistema ERP Completo",
  },
  {
    id: 2,
    numero: "PED-2024-002",
    cliente: "InnovateX Ltd",
    valor: 28500.0,
    data: "2024-01-12",
    status: "pendente",
    produto: "Desenvolvimento App Mobile",
  },
  {
    id: 3,
    numero: "PED-2024-003",
    cliente: "GlobalTech Inc",
    valor: 67200.0,
    data: "2024-01-15",
    status: "rejeitado",
    produto: "Consultoria em TI",
  },
]

// Dados para gráficos
const fluxoCaixaData = [
  { mes: "Jul", entradas: 45000, saidas: 32000, saldo: 13000 },
  { mes: "Ago", entradas: 52000, saidas: 38000, saldo: 14000 },
  { mes: "Set", entradas: 48000, saidas: 35000, saldo: 13000 },
  { mes: "Out", entradas: 58000, saidas: 42000, saldo: 16000 },
  { mes: "Nov", entradas: 62000, saidas: 45000, saldo: 17000 },
  { mes: "Dez", entradas: 55000, saidas: 40000, saldo: 15000 },
]

const fluxoCaixaProjecaoData = [
  { mes: "Jan", entradas: 65000, saidas: 48000, saldo: 17000 },
  { mes: "Fev", entradas: 70000, saidas: 52000, saldo: 18000 },
  { mes: "Mar", entradas: 68000, saidas: 50000, saldo: 18000 },
  { mes: "Abr", entradas: 72000, saidas: 54000, saldo: 18000 },
  { mes: "Mai", entradas: 75000, saidas: 56000, saldo: 19000 },
  { mes: "Jun", entradas: 78000, saidas: 58000, saldo: 20000 },
]

const distribuicaoData = [
  { name: "Contas a Receber", value: 140700, color: "#10b981" },
  { name: "Contas a Pagar", value: 31190, color: "#ef4444" },
  { name: "Em Caixa", value: 109510, color: "#3b82f6" },
]

// Dados para o relatório de fluxo de caixa
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
  const [activeSubTab, setActiveSubTab] = useState("contas-receber")
  const [activeReportTab, setActiveReportTab] = useState("fluxo-caixa")
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false)
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false)
  const [isReportPreviewModalOpen, setIsReportPreviewModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<any>(null)

  // Estados para o relatório
  const [periodoRelatorio, setPeriodoRelatorio] = useState("mensal")
  const [dataInicioRelatorio, setDataInicioRelatorio] = useState(new Date(2024, 0, 1)) // 1 de janeiro de 2024
  const [dataFimRelatorio, setDataFimRelatorio] = useState(new Date(2024, 0, 31)) // 31 de janeiro de 2024

  const reportContainerRef = useRef<HTMLDivElement>(null)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pendente":
        return "secondary"
      case "vencido":
      case "rejeitado":
        return "destructive"
      case "pago":
      case "recebido":
      case "aprovado":
        return "default"
      case "enviada":
        return "outline"
      default:
        return "secondary"
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const handleEditAccount = (account: any) => {
    setEditingAccount(account)
    setIsEditAccountModalOpen(true)
  }

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
        // Mantém as datas atuais
        break
    }

    setDataInicioRelatorio(inicio)
    setDataFimRelatorio(fim)
  }

  const handleGerarRelatorio = () => {
    setIsReportPreviewModalOpen(true)
  }

  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow && reportContainerRef.current) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Relatório de Fluxo de Caixa</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .report-container { width: 210mm; margin: 0 auto; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { margin-bottom: 30px; text-align: center; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
              .entrada { color: #10b981; }
              .saida { color: #ef4444; }
              .resumo { margin-top: 30px; }
              .resumo table { width: 50%; margin-left: auto; }
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
                  <CustomSelect value="janeiro">
                    <SelectItem value="janeiro">Janeiro 2024</SelectItem>
                    <SelectItem value="dezembro">Dezembro 2023</SelectItem>
                    <SelectItem value="novembro">Novembro 2023</SelectItem>
                  </CustomSelect>
                  <CustomButton>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Transação
                  </CustomButton>
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
