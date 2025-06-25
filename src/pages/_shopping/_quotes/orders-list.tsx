"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Eye, Download, Calendar, User, Package, Search, DotSquare } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import Dashboard from "../../../components/dashboard"

interface OrderItem {
  id: string
  productName: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Customer {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
}

interface Transport {
  type: string
  company: string
  cost: number
  deliveryTime: string
  trackingCode: string
  deliveryAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    complement: string
  }
  notes: string
}

interface PaymentMethod {
  method: string
  installments: number
  cardDetails: {
    cardNumber: string
    cardHolder: string
    expiryDate: string
    cvv: string
  }
  pixKey: string
  bankSlipDueDate: string
}

interface SavedOrder {
  id: string
  orderNumber: string
  customer: Customer
  items: OrderItem[]
  orderInfo: {
    orderNumber: string
    salesPerson: string
    orderDate: string
    deliveryDate: string
    paymentTerms: string
    notes: string
  }
  paymentMethod: PaymentMethod
  transport: Transport
  totals: {
    subtotal: number
    tax: number
    shippingCost: number
    total: number
  }
  createdAt: string
  status: "pending" | "processing" | "completed"
}

export default function OrdersList() {
  const [orders, setOrders] = useState<SavedOrder[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "processing" | "completed">("all")

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = () => {
    const savedOrders = localStorage.getItem("purchase-orders")
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders))
    }
  }

  const updateOrderStatus = (orderId: string, newStatus: "pending" | "processing" | "completed") => {
    const updatedOrders = orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
    setOrders(updatedOrders)
    localStorage.setItem("purchase-orders", JSON.stringify(updatedOrders))
  }

  const generatePDFFromOrder = (order: SavedOrder) => {
    const doc = new jsPDF("landscape", "mm", "a4")

    // Configurações de cores
    const primaryColor = [59, 130, 246] // Azul
    const secondaryColor = [107, 114, 128] // Cinza
    const textColor = [31, 41, 55] // Cinza escuro

    // CABEÇALHO PRINCIPAL
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, 297, 25, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.text("ORDEM DE COMPRA", 20, 17)

    // Número do pedido no canto direito do cabeçalho
    doc.setFontSize(16)
    doc.text(`Nº ${order.orderInfo.orderNumber}`, 220, 17)

    // SEÇÃO SUPERIOR - INFORMAÇÕES GERAIS
    let yPos = 35

    // Coluna 1 - Dados do Vendedor
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("VENDEDOR", 20, yPos)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Nome: ${order.orderInfo.salesPerson || "Não informado"}`, 20, yPos + 8)
    doc.text(`Data do Pedido: ${new Date(order.orderInfo.orderDate).toLocaleDateString("pt-BR")}`, 20, yPos + 16)
    doc.text(
      `Data de Entrega: ${order.orderInfo.deliveryDate ? new Date(order.orderInfo.deliveryDate).toLocaleDateString("pt-BR") : "Não definida"}`,
      20,
      yPos + 24,
    )
    doc.text(`Prazo Pagamento: ${order.orderInfo.paymentTerms} dias`, 20, yPos + 32)

    // Coluna 2 - Dados do Cliente
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("CLIENTE", 150, yPos)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Nome: ${order.customer.name}`, 150, yPos + 8)
    doc.text(`Email: ${order.customer.email}`, 150, yPos + 16)
    doc.text(`Telefone: ${order.customer.phone}`, 150, yPos + 24)
    doc.text(`Endereço: ${order.customer.address}`, 150, yPos + 32)
    doc.text(`${order.customer.city} - ${order.customer.state}`, 150, yPos + 40)

    // Linha separadora
    yPos += 50
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.setLineWidth(0.5)
    doc.line(20, yPos, 277, yPos)

    // SEÇÃO CENTRAL - PRODUTOS
    yPos += 10
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text("PRODUTOS E SERVIÇOS", 20, yPos)

    // Tabela de produtos
    const tableData = order.items.map((item, index) => [
      (index + 1).toString(),
      item.productName || "Produto não informado",
      item.description || "-",
      item.quantity.toString(),
      `R$ ${item.unitPrice.toFixed(2)}`,
      `R$ ${item.total.toFixed(2)}`,
    ])

    autoTable(doc, {
      startY: yPos + 5,
      head: [["#", "Produto", "Descrição", "Qtd", "Valor Unit.", "Total"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 },
        1: { cellWidth: 60 },
        2: { cellWidth: 80 },
        3: { halign: "center", cellWidth: 20 },
        4: { halign: "right", cellWidth: 30 },
        5: { halign: "right", cellWidth: 30 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    } as any)

    // TOTAIS
    const tableEndY = (doc as any).lastAutoTable.finalY + 10
    const totalsX = 200

    doc.setFillColor(248, 250, 252)
    doc.rect(totalsX - 5, tableEndY - 5, 82, 35, "F")
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.rect(totalsX - 5, tableEndY - 5, 82, 35, "S")

    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Subtotal:", totalsX, tableEndY + 3)
    doc.text(`R$ ${order.totals.subtotal.toFixed(2)}`, totalsX + 50, tableEndY + 3)

    doc.text("Frete:", totalsX, tableEndY + 10)
    doc.text(`R$ ${order.totals.shippingCost.toFixed(2)}`, totalsX + 50, tableEndY + 10)

    doc.text("Impostos (10%):", totalsX, tableEndY + 17)
    doc.text(`R$ ${order.totals.tax.toFixed(2)}`, totalsX + 50, tableEndY + 17)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("TOTAL:", totalsX, tableEndY + 26)
    doc.text(`R$ ${order.totals.total.toFixed(2)}`, totalsX + 50, tableEndY + 26)

    // SEÇÃO INFERIOR - TRANSPORTE E PAGAMENTO
    let bottomY = tableEndY + 40

    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.line(20, bottomY, 277, bottomY)
    bottomY += 10

    // Transporte
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text("TRANSPORTE", 20, bottomY)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(textColor[0], textColor[1], textColor[2])

    const transportType =
      order.transport.type === "own"
        ? "Transporte Próprio"
        : order.transport.type === "carrier"
          ? "Transportadora"
          : order.transport.type === "correios"
            ? "Correios"
            : order.transport.type === "courier"
              ? "Motoboy"
              : order.transport.type === "pickup"
                ? "Retirada no Local"
                : "Não definido"

    doc.text(`Tipo: ${transportType}`, 20, bottomY + 10)
    if (order.transport.company) {
      doc.text(`Empresa: ${order.transport.company}`, 20, bottomY + 18)
    }
    doc.text(`Valor do Frete: R$ ${order.transport.cost.toFixed(2)}`, 20, bottomY + 26)

    // Pagamento
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text("PAGAMENTO", 150, bottomY)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(textColor[0], textColor[1], textColor[2])

    const paymentText =
      order.paymentMethod.method === "credit"
        ? `Cartão de Crédito - ${order.paymentMethod.installments}x`
        : order.paymentMethod.method === "debit"
          ? "Cartão de Débito"
          : order.paymentMethod.method === "pix"
            ? "PIX"
            : order.paymentMethod.method === "bankslip"
              ? "Boleto Bancário"
              : "Não definida"

    doc.text(`Forma: ${paymentText}`, 150, bottomY + 10)

    // RODAPÉ
    const pageHeight = doc.internal.pageSize.height
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, pageHeight - 15, 297, 15, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(
      `Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      20,
      pageHeight - 8,
    )

    // Salvar PDF
    doc.save(`ordem-compra-${order.orderInfo.orderNumber}.pdf`)
  }

  const viewPDFFromOrder = (order: SavedOrder) => {
    const doc = new jsPDF("landscape", "mm", "a4")

    // Configurações de cores
    const primaryColor = [59, 130, 246] // Azul
    const secondaryColor = [107, 114, 128] // Cinza
    const textColor = [31, 41, 55] // Cinza escuro

    // CABEÇALHO PRINCIPAL
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, 297, 25, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.text("ORDEM DE COMPRA", 20, 17)

    // Número do pedido no canto direito do cabeçalho
    doc.setFontSize(16)
    doc.text(`Nº ${order.orderInfo.orderNumber}`, 220, 17)

    // SEÇÃO SUPERIOR - INFORMAÇÕES GERAIS
    let yPos = 35

    // Coluna 1 - Dados do Vendedor
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("VENDEDOR", 20, yPos)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Nome: ${order.orderInfo.salesPerson || "Não informado"}`, 20, yPos + 8)
    doc.text(`Data do Pedido: ${new Date(order.orderInfo.orderDate).toLocaleDateString("pt-BR")}`, 20, yPos + 16)
    doc.text(
      `Data de Entrega: ${order.orderInfo.deliveryDate ? new Date(order.orderInfo.deliveryDate).toLocaleDateString("pt-BR") : "Não definida"}`,
      20,
      yPos + 24,
    )
    doc.text(`Prazo Pagamento: ${order.orderInfo.paymentTerms} dias`, 20, yPos + 32)

    // Coluna 2 - Dados do Cliente
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("CLIENTE", 150, yPos)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Nome: ${order.customer.name}`, 150, yPos + 8)
    doc.text(`Email: ${order.customer.email}`, 150, yPos + 16)
    doc.text(`Telefone: ${order.customer.phone}`, 150, yPos + 24)
    doc.text(`Endereço: ${order.customer.address}`, 150, yPos + 32)
    doc.text(`${order.customer.city} - ${order.customer.state}`, 150, yPos + 40)

    // Linha separadora
    yPos += 50
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.setLineWidth(0.5)
    doc.line(20, yPos, 277, yPos)

    // SEÇÃO CENTRAL - PRODUTOS
    yPos += 10
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text("PRODUTOS E SERVIÇOS", 20, yPos)

    // Tabela de produtos
    const tableData = order.items.map((item, index) => [
      (index + 1).toString(),
      item.productName || "Produto não informado",
      item.description || "-",
      item.quantity.toString(),
      `R$ ${item.unitPrice.toFixed(2)}`,
      `R$ ${item.total.toFixed(2)}`,
    ])

    autoTable(doc, {
      startY: yPos + 5,
      head: [["#", "Produto", "Descrição", "Qtd", "Valor Unit.", "Total"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 },
        1: { cellWidth: 60 },
        2: { cellWidth: 80 },
        3: { halign: "center", cellWidth: 20 },
        4: { halign: "right", cellWidth: 30 },
        5: { halign: "right", cellWidth: 30 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    } as any)

    // TOTAIS
    const tableEndY = (doc as any).lastAutoTable.finalY + 10
    const totalsX = 200

    doc.setFillColor(248, 250, 252)
    doc.rect(totalsX - 5, tableEndY - 5, 82, 35, "F")
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.rect(totalsX - 5, tableEndY - 5, 82, 35, "S")

    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Subtotal:", totalsX, tableEndY + 3)
    doc.text(`R$ ${order.totals.subtotal.toFixed(2)}`, totalsX + 50, tableEndY + 3)

    doc.text("Frete:", totalsX, tableEndY + 10)
    doc.text(`R$ ${order.totals.shippingCost.toFixed(2)}`, totalsX + 50, tableEndY + 10)

    doc.text("Impostos (10%):", totalsX, tableEndY + 17)
    doc.text(`R$ ${order.totals.tax.toFixed(2)}`, totalsX + 50, tableEndY + 17)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("TOTAL:", totalsX, tableEndY + 26)
    doc.text(`R$ ${order.totals.total.toFixed(2)}`, totalsX + 50, tableEndY + 26)

    // SEÇÃO INFERIOR - TRANSPORTE E PAGAMENTO
    let bottomY = tableEndY + 40

    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.line(20, bottomY, 277, bottomY)
    bottomY += 10

    // Transporte
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text("TRANSPORTE", 20, bottomY)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(textColor[0], textColor[1], textColor[2])

    const transportType =
      order.transport.type === "own"
        ? "Transporte Próprio"
        : order.transport.type === "carrier"
          ? "Transportadora"
          : order.transport.type === "correios"
            ? "Correios"
            : order.transport.type === "courier"
              ? "Motoboy"
              : order.transport.type === "pickup"
                ? "Retirada no Local"
                : "Não definido"

    doc.text(`Tipo: ${transportType}`, 20, bottomY + 10)
    if (order.transport.company) {
      doc.text(`Empresa: ${order.transport.company}`, 20, bottomY + 18)
    }
    doc.text(`Valor do Frete: R$ ${order.transport.cost.toFixed(2)}`, 20, bottomY + 26)
    if (order.transport.deliveryTime) {
      doc.text(`Prazo: ${order.transport.deliveryTime}`, 20, bottomY + 34)
    }
    if (order.transport.trackingCode) {
      doc.text(`Rastreamento: ${order.transport.trackingCode}`, 20, bottomY + 42)
    }

    // Endereço de entrega
    if (order.transport.type !== "pickup") {
      let addressY = bottomY + 52
      if (order.transport.deliveryAddress.street || order.transport.deliveryAddress.city) {
        doc.text("Endereço de Entrega:", 20, addressY)
        addressY += 8

        if (order.transport.deliveryAddress.street) {
          doc.text(`${order.transport.deliveryAddress.street}`, 20, addressY)
          addressY += 8
        }

        if (order.transport.deliveryAddress.city || order.transport.deliveryAddress.state) {
          const cityState = `${order.transport.deliveryAddress.city}${order.transport.deliveryAddress.city && order.transport.deliveryAddress.state ? " - " : ""}${order.transport.deliveryAddress.state}`
          if (cityState.trim()) {
            doc.text(cityState, 20, addressY)
            addressY += 8
          }
        }

        if (order.transport.deliveryAddress.zipCode) {
          doc.text(`CEP: ${order.transport.deliveryAddress.zipCode}`, 20, addressY)
        }
      }
    }

    // Pagamento
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text("PAGAMENTO", 150, bottomY)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(textColor[0], textColor[1], textColor[2])

    const paymentText =
      order.paymentMethod.method === "credit"
        ? `Cartão de Crédito`
        : order.paymentMethod.method === "debit"
          ? "Cartão de Débito"
          : order.paymentMethod.method === "pix"
            ? "PIX"
            : order.paymentMethod.method === "bankslip"
              ? "Boleto Bancário"
              : "Não definida"

    doc.text(`Forma: ${paymentText}`, 150, bottomY + 10)

    if (order.paymentMethod.method === "credit") {
      doc.text(
        `Parcelas: ${order.paymentMethod.installments}x de R$ ${(order.totals.total / order.paymentMethod.installments).toFixed(2)}`,
        150,
        bottomY + 18,
      )
    }

    if (order.paymentMethod.method === "pix" && order.paymentMethod.pixKey) {
      doc.text(`Chave PIX: ${order.paymentMethod.pixKey}`, 150, bottomY + 18)
    }

    if (order.paymentMethod.method === "bankslip" && order.paymentMethod.bankSlipDueDate) {
      doc.text(
        `Vencimento: ${new Date(order.paymentMethod.bankSlipDueDate).toLocaleDateString("pt-BR")}`,
        150,
        bottomY + 18,
      )
    }

    // RODAPÉ
    const pageHeight = doc.internal.pageSize.height
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, pageHeight - 15, 297, 15, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(
      `Documento visualizado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      20,
      pageHeight - 8,
    )

    // Método mais robusto para abrir PDF em nova aba
    try {
      const pdfBlob = doc.output("blob")
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const newWindow = window.open(pdfUrl, "_blank")

      // Limpar a URL após um tempo para liberar memória
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl)
      }, 1000)

      // Verificar se a janela foi aberta (pode estar bloqueada por popup blocker)
      if (!newWindow) {
        alert("Por favor, permita pop-ups para visualizar o PDF ou use o botão de download.")
      }
    } catch (error) {
      console.error("Erro ao abrir PDF:", error)
      alert("Erro ao visualizar PDF. Tente usar o botão de download.")
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderInfo.salesPerson.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente"
      case "processing":
        return "Processando"
      case "completed":
        return "Concluído"
      default:
        return "Desconhecido"
    }
  }

  return (
    <Dashboard>
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Lista de Pedidos</h1>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por número, cliente ou vendedor..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="processing">Processando</option>
              <option value="completed">Concluído</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Pedidos ({filteredOrders.length})
            {filteredOrders.length === 0 && orders.length > 0 && " - Nenhum resultado encontrado"}
          </h2>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {orders.length === 0 ? "Nenhum pedido criado" : "Nenhum resultado encontrado"}
            </h3>
            <p className="text-gray-500 mb-4">
              {orders.length === 0
                ? "Nenhum pedido foi criado ainda pelos vendedores."
                : "Tente ajustar os filtros de busca."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onDoubleClick={() => generatePDFFromOrder(order)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                          <div className="text-sm text-gray-500">
                            {order.items.length} {order.items.length === 1 ? "item" : "itens"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                          <div className="text-sm text-gray-500">{order.customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.orderInfo.salesPerson}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm text-gray-900">
                            {new Date(order.orderInfo.orderDate).toLocaleDateString("pt-BR")}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString("pt-BR")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">R$ {order.totals.total.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateOrderStatus(order.id, e.target.value as "pending" | "processing" | "completed")
                        }
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(order.status)}`}
                      >
                        <option value="pending">Pendente</option>
                        <option value="processing">Processando</option>
                        <option value="completed">Concluído</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            viewPDFFromOrder(order)
                          }}
                          className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            generatePDFFromOrder(order)
                          }}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Eye className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Como usar:</h3>
            <p className="text-sm text-blue-700 mt-1">
              • <strong>Duplo clique</strong> em qualquer pedido para baixar o PDF automaticamente
            </p>
            <p className="text-sm text-blue-700">
              • Use o botão <strong>Ver</strong> para visualizar o PDF em uma nova aba
            </p>
            <p className="text-sm text-blue-700">
              • Use o botão <strong>PDF</strong> para baixar o arquivo diretamente
            </p>
            <p className="text-sm text-blue-700">
              • Altere o <strong>status</strong> para acompanhar o progresso do pedido
            </p>
          </div>
        </div>
      </div>
    </div>
    </Dashboard>
  )
}
