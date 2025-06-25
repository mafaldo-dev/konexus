"use client"

import type React from "react"

import { useState } from "react"
import { Trash2, Plus, ShoppingCart, User, Package, CreditCard, Download, Truck } from "lucide-react"
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

export default function PurchaseOrder() {
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  })

  const [items, setItems] = useState<OrderItem[]>([
    {
      id: "1",
      productName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    },
  ])

  const [orderInfo, setOrderInfo] = useState({
    orderNumber: `PO-${Date.now()}`,
    salesPerson: "",
    orderDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    paymentTerms: "30",
    notes: "",
  })

  const [paymentMethod, setPaymentMethod] = useState({
    method: "",
    installments: 1,
    cardDetails: {
      cardNumber: "",
      cardHolder: "",
      expiryDate: "",
      cvv: "",
    },
    pixKey: "",
    bankSlipDueDate: "",
  })

  const [transport, setTransport] = useState<Transport>({
    type: "",
    company: "",
    cost: 0,
    deliveryTime: "",
    trackingCode: "",
    deliveryAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      complement: "",
    },
    notes: "",
  })

  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      productName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          if (field === "quantity" || field === "unitPrice") {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice
          }
          return updatedItem
        }
        return item
      }),
    )
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const taxRate = 0.1 // 10% tax
  const tax = subtotal * taxRate
  const shippingCost = transport.cost || 0
  const total = subtotal + tax + shippingCost

  const saveOrder = () => {
    const orderData = {
      id: Date.now().toString(),
      orderNumber: orderInfo.orderNumber,
      customer,
      items,
      orderInfo,
      paymentMethod,
      transport,
      totals: { subtotal, tax, shippingCost, total },
      createdAt: new Date().toISOString(),
      status: "pending" as const,
    }

    // Salvar no localStorage
    const existingOrders = JSON.parse(localStorage.getItem("purchase-orders") || "[]")
    existingOrders.push(orderData)
    localStorage.setItem("purchase-orders", JSON.stringify(existingOrders))

    return orderData
  }

  const generatePDF = () => {
    // Criar PDF em formato horizontal (landscape)
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
    doc.text(`Nº ${orderInfo.orderNumber}`, 220, 17)

    // SEÇÃO SUPERIOR - INFORMAÇÕES GERAIS
    let yPos = 35

    // Coluna 1 - Dados do Vendedor
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("VENDEDOR", 20, yPos)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Nome: ${orderInfo.salesPerson || "Não informado"}`, 20, yPos + 8)
    doc.text(`Data do Pedido: ${new Date(orderInfo.orderDate).toLocaleDateString("pt-BR")}`, 20, yPos + 16)
    doc.text(
      `Data de Entrega: ${orderInfo.deliveryDate ? new Date(orderInfo.deliveryDate).toLocaleDateString("pt-BR") : "Não definida"}`,
      20,
      yPos + 24,
    )
    doc.text(`Prazo Pagamento: ${orderInfo.paymentTerms} dias`, 20, yPos + 32)

    // Coluna 2 - Dados do Cliente
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("CLIENTE", 150, yPos)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Nome: ${customer.name}`, 150, yPos + 8)
    doc.text(`Email: ${customer.email}`, 150, yPos + 16)
    doc.text(`Telefone: ${customer.phone}`, 150, yPos + 24)
    doc.text(`Endereço: ${customer.address}`, 150, yPos + 32)
    doc.text(`${customer.city} - ${customer.state}`, 150, yPos + 40)

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

    // Tabela de produtos com design personalizado
    const tableData = items.map((item, index) => [
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

    // TOTAIS - Lado direito após a tabela
    const tableEndY = (doc as any).lastAutoTable.finalY + 10
    const totalsX = 200

    // Box para totais
    doc.setFillColor(248, 250, 252)
    doc.rect(totalsX - 5, tableEndY - 5, 82, 35, "F")
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.rect(totalsX - 5, tableEndY - 5, 82, 35, "S")

    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Subtotal:", totalsX, tableEndY + 3)
    doc.text(`R$ ${subtotal.toFixed(2)}`, totalsX + 50, tableEndY + 3)

    doc.text("Frete:", totalsX, tableEndY + 10)
    doc.text(`R$ ${shippingCost.toFixed(2)}`, totalsX + 50, tableEndY + 10)

    doc.text("Impostos (10%):", totalsX, tableEndY + 17)
    doc.text(`R$ ${tax.toFixed(2)}`, totalsX + 50, tableEndY + 17)

    // Total final destacado
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("TOTAL:", totalsX, tableEndY + 26)
    doc.text(`R$ ${total.toFixed(2)}`, totalsX + 50, tableEndY + 26)

    // SEÇÃO INFERIOR - INFORMAÇÕES DE TRANSPORTE E PAGAMENTO
    let bottomY = tableEndY + 40

    // Linha separadora
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.line(20, bottomY, 277, bottomY)
    bottomY += 10

    // Coluna 1 - Transporte
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text("TRANSPORTE", 20, bottomY)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(textColor[0], textColor[1], textColor[2])

    const transportType =
      transport.type === "own"
        ? "Transporte Próprio"
        : transport.type === "carrier"
          ? "Transportadora"
          : transport.type === "correios"
            ? "Correios"
            : transport.type === "courier"
              ? "Motoboy"
              : transport.type === "pickup"
                ? "Retirada no Local"
                : "Não definido"

    doc.text(`Tipo: ${transportType}`, 20, bottomY + 10)
    if (transport.company) {
      doc.text(`Empresa: ${transport.company}`, 20, bottomY + 18)
    }
    doc.text(`Valor do Frete: R$ ${transport.cost.toFixed(2)}`, 20, bottomY + 26)
    if (transport.deliveryTime) {
      doc.text(`Prazo: ${transport.deliveryTime}`, 20, bottomY + 34)
    }
    if (transport.trackingCode) {
      doc.text(`Rastreamento: ${transport.trackingCode}`, 20, bottomY + 42)
    }

    // Endereço de entrega (sempre mostrar se preenchido, exceto para retirada)
    if (transport.type !== "pickup") {
      let addressY = bottomY + 52
      if (transport.deliveryAddress.street || transport.deliveryAddress.city) {
        doc.text("Endereço de Entrega:", 20, addressY)
        addressY += 8

        if (transport.deliveryAddress.street) {
          doc.text(`${transport.deliveryAddress.street}`, 20, addressY)
          addressY += 8
        }

        if (transport.deliveryAddress.city || transport.deliveryAddress.state) {
          const cityState = `${transport.deliveryAddress.city}${transport.deliveryAddress.city && transport.deliveryAddress.state ? " - " : ""}${transport.deliveryAddress.state}`
          if (cityState.trim()) {
            doc.text(cityState, 20, addressY)
            addressY += 8
          }
        }

        if (transport.deliveryAddress.zipCode) {
          doc.text(`CEP: ${transport.deliveryAddress.zipCode}`, 20, addressY)
          addressY += 8
        }

        if (transport.deliveryAddress.complement) {
          doc.text(`Complemento: ${transport.deliveryAddress.complement}`, 20, addressY)
        }
      }
    }

    // Observações do transporte
    if (transport.notes) {
      const transportNotesY = bottomY + 85
      doc.text("Obs. Transporte:", 20, transportNotesY)
      const splitTransportNotes = doc.splitTextToSize(transport.notes, 120)
      doc.text(splitTransportNotes, 20, transportNotesY + 8)
    }

    // Coluna 2 - Pagamento
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text("PAGAMENTO", 150, bottomY)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(textColor[0], textColor[1], textColor[2])

    const paymentText =
      paymentMethod.method === "credit"
        ? `Cartão de Crédito`
        : paymentMethod.method === "debit"
          ? "Cartão de Débito"
          : paymentMethod.method === "pix"
            ? "PIX"
            : paymentMethod.method === "bankslip"
              ? "Boleto Bancário"
              : "Não definida"

    doc.text(`Forma: ${paymentText}`, 150, bottomY + 10)

    // Detalhes específicos do pagamento
    if (paymentMethod.method === "credit") {
      doc.text(
        `Parcelas: ${paymentMethod.installments}x de R$ ${(total / paymentMethod.installments).toFixed(2)}`,
        150,
        bottomY + 18,
      )
      if (paymentMethod.cardDetails.cardHolder) {
        doc.text(`Portador: ${paymentMethod.cardDetails.cardHolder}`, 150, bottomY + 26)
      }
      if (paymentMethod.cardDetails.cardNumber) {
        const maskedCard = paymentMethod.cardDetails.cardNumber.replace(/\d(?=\d{4})/g, "*")
        doc.text(`Cartão: ${maskedCard}`, 150, bottomY + 34)
      }
    }

    if (paymentMethod.method === "pix" && paymentMethod.pixKey) {
      doc.text(`Chave PIX: ${paymentMethod.pixKey}`, 150, bottomY + 18)
    }

    if (paymentMethod.method === "bankslip" && paymentMethod.bankSlipDueDate) {
      doc.text(`Vencimento: ${new Date(paymentMethod.bankSlipDueDate).toLocaleDateString("pt-BR")}`, 150, bottomY + 18)
    }

    // Prazo de pagamento sempre mostrar
    doc.text(
      `Prazo: ${orderInfo.paymentTerms} dias`,
      150,
      bottomY +
        (paymentMethod.method === "credit"
          ? 42
          : paymentMethod.method === "pix" || paymentMethod.method === "bankslip"
            ? 26
            : 18),
    )

    // Observações (se houver)
    if (orderInfo.notes) {
      bottomY += 80
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.text("OBSERVAÇÕES:", 20, bottomY)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      const splitNotes = doc.splitTextToSize(orderInfo.notes, 250)
      doc.text(splitNotes, 20, bottomY + 8)
    }

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
    doc.text(`Página 1 de 1`, 250, pageHeight - 8)

    // Salvar PDF
    doc.save(`ordem-compra-${orderInfo.orderNumber}.pdf`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Salvar o pedido
    const savedOrder = saveOrder()

    console.log("Pedido criado:", savedOrder)
    alert("Pedido criado com sucesso!")

    // Limpar formulário para novo pedido
    setCustomer({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
    })
    setItems([
      {
        id: "1",
        productName: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ])
    setOrderInfo({
      orderNumber: `PO-${Date.now()}`,
      salesPerson: "",
      orderDate: new Date().toISOString().split("T")[0],
      deliveryDate: "",
      paymentTerms: "30",
      notes: "",
    })
    setPaymentMethod({
      method: "",
      installments: 1,
      cardDetails: {
        cardNumber: "",
        cardHolder: "",
        expiryDate: "",
        cvv: "",
      },
      pixKey: "",
      bankSlipDueDate: "",
    })
    setTransport({
      type: "",
      company: "",
      cost: 0,
      deliveryTime: "",
      trackingCode: "",
      deliveryAddress: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        complement: "",
      },
      notes: "",
    })
  }

  return (
    <Dashboard>
      <div className="max-w-6xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingCart className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Nova Ordem de Compra</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do Pedido */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informações do Pedido
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Número do Pedido
                  </label>
                  <input
                    id="orderNumber"
                    type="text"
                    value={orderInfo.orderNumber}
                    onChange={(e) => setOrderInfo({ ...orderInfo, orderNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    readOnly
                  />
                </div>
                <div>
                  <label htmlFor="salesPerson" className="block text-sm font-medium text-gray-700 mb-1">
                    Vendedor
                  </label>
                  <input
                    id="salesPerson"
                    type="text"
                    value={orderInfo.salesPerson}
                    onChange={(e) => setOrderInfo({ ...orderInfo, salesPerson: e.target.value })}
                    placeholder="Nome do vendedor"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="orderDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Data do Pedido
                  </label>
                  <input
                    id="orderDate"
                    type="date"
                    value={orderInfo.orderDate}
                    onChange={(e) => setOrderInfo({ ...orderInfo, orderDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Entrega
                  </label>
                  <input
                    id="deliveryDate"
                    type="date"
                    value={orderInfo.deliveryDate}
                    onChange={(e) => setOrderInfo({ ...orderInfo, deliveryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 mb-1">
                    Prazo de Pagamento
                  </label>
                  <select
                    id="paymentTerms"
                    value={orderInfo.paymentTerms}
                    onChange={(e) => setOrderInfo({ ...orderInfo, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="15">15 dias</option>
                    <option value="30">30 dias</option>
                    <option value="45">45 dias</option>
                    <option value="60">60 dias</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Informações do Cliente */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Cliente
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Cliente
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    placeholder="Nome completo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="customerEmail"
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    id="customerPhone"
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  <input
                    id="customerAddress"
                    type="text"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    placeholder="Rua, número"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="customerCity" className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade
                  </label>
                  <input
                    id="customerCity"
                    type="text"
                    value={customer.city}
                    onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                    placeholder="Cidade"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="customerState" className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <input
                    id="customerState"
                    type="text"
                    value={customer.state}
                    onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
                    placeholder="SP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Itens do Pedido</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => updateItem(item.id, "productName", e.target.value)}
                          placeholder="Nome do produto"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", Number.parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preço Unitário</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, "unitPrice", Number.parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                        <input
                          type="text"
                          value={`R$ ${item.total.toFixed(2)}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        placeholder="Descrição do produto (opcional)"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addItem}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </button>
              </div>
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Forma de Pagamento
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
                  <select
                    value={paymentMethod.method}
                    onChange={(e) => setPaymentMethod({ ...paymentMethod, method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione a forma de pagamento</option>
                    <option value="credit">Cartão de Crédito</option>
                    <option value="debit">Cartão de Débito</option>
                    <option value="pix">PIX</option>
                    <option value="bankslip">Boleto Bancário</option>
                  </select>
                </div>

                {paymentMethod.method === "credit" && (
                  <div className="space-y-3 p-4 border rounded-lg bg-blue-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número do Cartão</label>
                        <input
                          type="text"
                          value={paymentMethod.cardDetails.cardNumber}
                          onChange={(e) =>
                            setPaymentMethod({
                              ...paymentMethod,
                              cardDetails: { ...paymentMethod.cardDetails, cardNumber: e.target.value },
                            })
                          }
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome no Cartão</label>
                        <input
                          type="text"
                          value={paymentMethod.cardDetails.cardHolder}
                          onChange={(e) =>
                            setPaymentMethod({
                              ...paymentMethod,
                              cardDetails: { ...paymentMethod.cardDetails, cardHolder: e.target.value },
                            })
                          }
                          placeholder="Nome como no cartão"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Validade</label>
                        <input
                          type="text"
                          value={paymentMethod.cardDetails.expiryDate}
                          onChange={(e) =>
                            setPaymentMethod({
                              ...paymentMethod,
                              cardDetails: { ...paymentMethod.cardDetails, expiryDate: e.target.value },
                            })
                          }
                          placeholder="MM/AA"
                          maxLength={5}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                        <input
                          type="text"
                          value={paymentMethod.cardDetails.cvv}
                          onChange={(e) =>
                            setPaymentMethod({
                              ...paymentMethod,
                              cardDetails: { ...paymentMethod.cardDetails, cvv: e.target.value },
                            })
                          }
                          placeholder="000"
                          maxLength={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label>
                      <select
                        value={paymentMethod.installments.toString()}
                        onChange={(e) =>
                          setPaymentMethod({ ...paymentMethod, installments: Number.parseInt(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                          <option key={num} value={num.toString()}>
                            {num}x de R$ {(total / num).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {paymentMethod.method === "pix" && (
                  <div className="p-4 border rounded-lg bg-green-50">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX (opcional)</label>
                    <input
                      type="text"
                      value={paymentMethod.pixKey}
                      onChange={(e) => setPaymentMethod({ ...paymentMethod, pixKey: e.target.value })}
                      placeholder="email@exemplo.com ou CPF/CNPJ"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-sm text-gray-600 mt-2">O PIX será gerado após a confirmação do pedido</p>
                  </div>
                )}

                {paymentMethod.method === "bankslip" && (
                  <div className="p-4 border rounded-lg bg-yellow-50">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
                    <input
                      type="date"
                      value={paymentMethod.bankSlipDueDate}
                      onChange={(e) => setPaymentMethod({ ...paymentMethod, bankSlipDueDate: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Informações de Transporte */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Informações de Transporte
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Transporte</label>
                    <select
                      value={transport.type}
                      onChange={(e) => setTransport({ ...transport, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="own">Transporte Próprio</option>
                      <option value="carrier">Transportadora</option>
                      <option value="correios">Correios</option>
                      <option value="courier">Motoboy</option>
                      <option value="pickup">Retirada no Local</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transportadora/Empresa</label>
                    <input
                      type="text"
                      value={transport.company}
                      onChange={(e) => setTransport({ ...transport, company: e.target.value })}
                      placeholder="Nome da transportadora"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Frete</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={transport.cost}
                      onChange={(e) => setTransport({ ...transport, cost: Number.parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de Entrega</label>
                    <input
                      type="text"
                      value={transport.deliveryTime}
                      onChange={(e) => setTransport({ ...transport, deliveryTime: e.target.value })}
                      placeholder="Ex: 5-7 dias úteis"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código de Rastreamento</label>
                    <input
                      type="text"
                      value={transport.trackingCode}
                      onChange={(e) => setTransport({ ...transport, trackingCode: e.target.value })}
                      placeholder="Código de rastreamento (opcional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {transport.type !== "pickup" && (
                  <div className="space-y-3 p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-medium">Endereço de Entrega</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                        <input
                          type="text"
                          value={transport.deliveryAddress.street}
                          onChange={(e) =>
                            setTransport({
                              ...transport,
                              deliveryAddress: { ...transport.deliveryAddress, street: e.target.value },
                            })
                          }
                          placeholder="Rua, número"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                        <input
                          type="text"
                          value={transport.deliveryAddress.city}
                          onChange={(e) =>
                            setTransport({
                              ...transport,
                              deliveryAddress: { ...transport.deliveryAddress, city: e.target.value },
                            })
                          }
                          placeholder="Cidade"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <input
                          type="text"
                          value={transport.deliveryAddress.state}
                          onChange={(e) =>
                            setTransport({
                              ...transport,
                              deliveryAddress: { ...transport.deliveryAddress, state: e.target.value },
                            })
                          }
                          placeholder="SP"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                        <input
                          type="text"
                          value={transport.deliveryAddress.zipCode}
                          onChange={(e) =>
                            setTransport({
                              ...transport,
                              deliveryAddress: { ...transport.deliveryAddress, zipCode: e.target.value },
                            })
                          }
                          placeholder="00000-000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                        <input
                          type="text"
                          value={transport.deliveryAddress.complement}
                          onChange={(e) =>
                            setTransport({
                              ...transport,
                              deliveryAddress: { ...transport.deliveryAddress, complement: e.target.value },
                            })
                          }
                          placeholder="Apto, bloco, etc."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observações do Transporte</label>
                      <textarea
                        value={transport.notes}
                        onChange={(e) => setTransport({ ...transport, notes: e.target.value })}
                        placeholder="Instruções especiais para entrega..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Totais */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Resumo do Pedido</h2>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span>R$ {shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Impostos (10%):</span>
                  <span>R$ {tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Observações</h2>
            </div>
            <div className="p-6">
              <textarea
                value={orderInfo.notes}
                onChange={(e) => setOrderInfo({ ...orderInfo, notes: e.target.value })}
                placeholder="Observações adicionais sobre o pedido..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Salvar Rascunho
            </button>
            <button
              type="button"
              onClick={generatePDF}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Gerar PDF
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Criar Pedido
            </button>
          </div>
        </form>
      </div>
    </Dashboard>
  )
}
