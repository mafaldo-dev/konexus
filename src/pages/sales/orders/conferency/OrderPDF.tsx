

import { format } from "date-fns"
import { MapPin, User, Calendar, Phone, CheckSquare, Package } from "lucide-react"

import logo  from "../../../../assets/image/guiman.png"
import { Order } from "../../../../service/interfaces"

type OrderPDFProps = {
  order: Order
  onDownloadComplete: () => void
}

export default function OrderPDF({ order, onDownloadComplete }: OrderPDFProps) {
  if (!order) return null

  const statusColors: Record<Order["status"], string> = {
    Pendente: "bg-amber-50 text-amber-800 border-amber-200",
    Separando: "bg-slate-50 text-slate-700 border-slate-300",
    Finalizado: "bg-emerald-50 text-emerald-800 border-emerald-200",
    Enviado: "bg-indigo-50 text-indigo-800 border-indigo-200",
  }

  const handlePrint = () => {
    window.print()
    setTimeout(() => {
      if (onDownloadComplete) onDownloadComplete()
    }, 1000)
  }

  return (
    <div className="print:p-0 print:m-0">
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: none;
          }
          .no-print {
            display: none !important;
          }
          .print-horizontal {
            width: 100%;
            max-width: 297mm;
          }
          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .print-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 20px;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .print-signatures {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 40px;
            margin-top: 40px;
          }
        }
      `}</style>

      <div className="no-print mb-6 flex justify-end">
        <button
          onClick={handlePrint}
          className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm"
        >
          Baixar PDF de Separação
        </button>
      </div>

      <div className="print-area print-horizontal bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none border border-gray-200">
        {/* Cabeçalho da empresa */}
        <div className="bg-slate-900 text-white p-6 print-header print:bg-slate-900">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                <img
                  src={logo}
                  alt="Logo Guiman"
                  className="w-12 h-12 rounded-md object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    const fallback = target.nextElementSibling as HTMLElement
                    if (fallback) fallback.style.display = "flex"
                  }}
                />
                <div className="hidden w-12 h-12 bg-slate-700 rounded-md items-center justify-center">
                  <Package className="w-6 h-6 text-slate-300" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1 text-white">Vendas Guiman</h1>
                <p className="text-slate-300 text-lg font-medium">Lista de Separação - Expedição</p>
                <p className="text-slate-400 text-sm mt-1">guiman-company@gmail.com | (11) xxxxx-xxxx</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <p className="text-sm text-slate-400 mb-1 font-medium">Pedido Nº</p>
                <p className="text-3xl font-bold text-white">{order.order_number}</p>
                <div className="flex items-center gap-2 mt-3 justify-end">
                  <span
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${statusColors[order.status]}`}
                  >
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Datas */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Expedido em: {order.order_date.split("-").reverse().join("/")}</span>
            </div>
            {order.delivery_date && (
              <div className="text-gray-700 font-medium">
                Previsão de Entrega: {format(new Date(order.delivery_date), "dd/MM/yyyy")}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Cliente e Separação */}
          <div className="print-info-grid grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-gray-200 shadow-sm rounded-lg p-5 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Dados do Cliente</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Nome</p>
                  <p className="font-semibold text-gray-900 mt-1">{order.customer_name}</p>
                </div>
                {order.customer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 font-medium">{order.customer_phone}</span>
                  </div>
                )}
                {order.customer_address && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                        Endereço de Entrega
                      </span>
                    </div>
                    <p className="text-gray-700 pl-6 leading-relaxed">{order.customer_address}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-gray-200 shadow-sm rounded-lg p-5 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Informações da Separação</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Vendedor Responsável</p>
                  <p className="font-semibold text-gray-900 mt-1">{order.salesperson}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total de Itens</p>
                  <p className="text-2xl font-bold text-slate-700 mt-1">{order.items.length} itens</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Produtos */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Lista de Separação - Expedição</h3>
            </div>
            <div className="border border-gray-200 shadow-sm rounded-lg overflow-hidden">
              <table className="print-table w-full">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="text-left p-4 font-semibold text-sm uppercase tracking-wide">✓ Separado</th>
                    <th className="text-left p-4 font-semibold text-sm uppercase tracking-wide">Código</th>
                    <th className="text-left p-4 font-semibold text-sm uppercase tracking-wide">Produto</th>
                    <th className="text-center p-4 font-semibold text-sm uppercase tracking-wide">Quantidade</th>
                    <th className="text-center p-4 font-semibold text-sm uppercase tracking-wide">
                      Localização no Estoque
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="w-6 h-6 border-2 border-gray-400 rounded-sm"></div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm bg-gray-100 text-gray-800 px-3 py-1.5 rounded font-medium">
                          {item.product_code}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-gray-900">{item.product_name}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-slate-100 text-slate-800 rounded-full font-bold text-lg">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {item.location ? (
                          <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-2 rounded-full text-sm font-semibold">
                            <MapPin className="w-3 h-3" />
                            {item.location}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm font-medium">Localização não definida</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assinaturas */}
          <div className="print-signatures grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
            {["Separado por", "Conferido por", "Expedido por"].map((label, i) => (
              <div key={i}>
                <p className="text-sm text-gray-600 mb-3 font-semibold uppercase tracking-wide">{label}:</p>
                <div className="border-b-2 border-gray-400 pb-1 mb-2 h-8"></div>
                <p className="text-xs text-gray-500 font-medium">Nome e Assinatura</p>
              </div>
            ))}
          </div>

          {/* Observações */}
          {order.notes && (
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-3 font-semibold uppercase tracking-wide">Observações:</p>
              <p className="text-gray-800 bg-amber-50 p-4 rounded-lg border border-amber-200 leading-relaxed">
                {order.notes}
              </p>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-600 border-t border-gray-200">
          <p className="font-medium">
            Este documento foi gerado automaticamente pelo sistema VendaFlow em{" "}
            {format(new Date(order.order_date), "dd/MM/yyyy")}
          </p>
        </div>
      </div>
    </div>
  )
}
