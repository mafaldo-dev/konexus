import { useAuth } from '../../../../AuthContext'
import { Order, OrderResponse } from "../../../../service/interfaces"

import { CheckSquare, Package, Download, Printer, SidebarClose } from "lucide-react"
import logo from "../../../../assets/image/guiman.png"
import { useNavigate } from 'react-router-dom'


type OrderPDFProps = {
  order: OrderResponse
  onDownloadComplete: () => void
}

export default function OrderPDF({ order, onDownloadComplete }: OrderPDFProps) {
  const navigate = useNavigate()
  const { user } = useAuth()

  if (!order) return null

  const returnToList = () => {
    navigate('/sales/order-list')
  }

  const handlePrint = () => {
    window.print()
    setTimeout(() => {
      if (onDownloadComplete) onDownloadComplete()
    }, 1000)
  }

  return (
    <div className="flex justify-center print:p-0 print:m-0">
      <style>{`
        @media print {
          @page { 
            size: A4 landscape; 
            margin: 15mm; 
            border: 1px solid gray;
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
            height: 100%;
            margin: auto; 
          }
          .no-print { 
            display: none !important; 
          }
          .print-table { 
            width: 100%; 
            border-collapse: collapse; 
          }
          .print-signatures { 
            display: flex; 
            justify-content: space-between; 
            margin-top: 20px; 
          }
          .print-signatures > div { 
            flex: 1; 
            margin-right: 20px; 
          }
          .print-signatures > div:last-child { 
            margin-right: 0; 
          }
          .print-break { 
            page-break-inside: avoid; 
          }
        }
      `}</style>
      <div className=' w-[100vw] flex flex-col bg-gray-300 items-center justify-center'>
        <header className='flex flex-row justify-end w-full h-[4vh] px-2 bg-slate-800'>
          <nav>
            <ul className='flex flex-row gap-1'>
              <li>
                <div className="no-print mb-8 w-full flex justify-center">
                  {(user?.role === "Administrador" || user?.role === "Financeiro") && (
                    <button
                      onClick={handlePrint}
                      className="flex items-center w-[30px]
                        gap-2 text-white 
                        px-2 py-1 rounded-lg font-medium transition-all 
                        duration-200 shadow-md hover:shadow-lg w-16"
                    >
                      <Package className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </li>
              <li>
                <div className="no-print mb-8 w-full flex justify-center">
                  {(user?.role === "Administrador" || user?.role === "Financeiro") && (
                    <button
                      onClick={handlePrint}
                      className="flex items-center w-[30px]
                        gap-2 text-white 
                        px-2 py-1 rounded-lg font-medium transition-all 
                        duration-200 shadow-md hover:shadow-lg w-16"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </li>
              <li>
                <div className="no-print mb-8 w-full flex justify-center">
                  {(user?.role === "Administrador" || user?.role === "Financeiro") && (
                    <button
                      onClick={handlePrint}
                      className="flex items-center w-[30px]
                        gap-2 text-white 
                        px-2 py-1 rounded-lg font-medium transition-all 
                        duration-200 shadow-md hover:shadow-lg w-16"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </li>
              <li>
                <div className="no-print mb-8 w-full flex justify-center">
                  {(user?.role === "Administrador" || user?.role === "Financeiro") && (
                    <button onClick={returnToList}
                      className="flex items-center w-[30px]
                        gap-2 text-white 
                        px-2 py-1 rounded-lg font-medium transition-all 
                        duration-200 shadow-md hover:shadow-lg w-16"
                    >
                      <SidebarClose className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </li>
            </ul>
          </nav>
        </header>
        {/* Conteúdo do PDF */}
        <div className="print-area bg-white  w-full max-w-[100vw] p-8 rounded-sm border border-gray-200 shadow-sm print:shadow-none">

          {/* Cabeçalho */}
          <div className="flex justify-between items-start mb-4 -mt-6 pb-6 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 flex items-center justify-center 
                    rounded-xl shadow-sm">
                <img
                  src={logo}
                  alt="Logo Guiman"
                  className="w-14 h-14 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none"
                    const parent = (e.target as HTMLImageElement).parentElement
                    if (parent) {
                      parent.innerHTML = '<Package className="w-8 h-8 text-white" />'
                    }
                  }}
                />
              </div>
              <div>
                <h1 className="text-1xl font-bold text-gray-900 mb-1">Vendas Konéxus</h1>
                <p className="text-gray-600 font-medium text-sm">Lista de Separação - Expedição</p>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-gray-500 text-sm flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    konexuserp@gmail.com
                  </p>
                  <p className="text-gray-500 text-sm">(11) xxxxx-xxxx</p>
                </div>
              </div>
            </div>

            <div className="text-center w-[15vw]">
              <div className="bg-gradient-to-br h-[8vh] from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-500 uppercase tracking-wide -mt-3">Pedido Nº</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{order.orderNumber}</p>
              </div>
            </div>
          </div>

          {/* Informações principais */}
          <div className="flex flex-row items-center justify-between border border-gray-200 rounded-lg px-6 py-3 gap-12 mb-8">

            {/* Dados do Cliente */}

            <div>
              <h3 className="text-sm font-bold mb-2 text-black">Dados do cliente</h3>
              <p className="font-medium text-black text-sm mb-2">{order.customer.name}</p>

              {order.shipping ? (
                <div className="mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-black">
                    Endereço de Cobrança:
                  </span>
                  <p className="text-black text-sm">
                    {order.shipping?.city}, {order.shipping?.number} - {order.shipping?.street},
                    CEP: {order.shipping?.zip}
                  </p>
                </div>
              ) : (
                <div className="mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-black">
                    Endereço de Entrega:
                  </span>
                  <p className="text-black bg-red-500 text-sm">
                    {order.billing?.city}, {order.billing?.street} - {order.billing?.number},
                    CEP: {order.billing?.zip}
                  </p>
                </div>
              )}
            </div>


            {/* Expedido em */}
            <div>
              <h3 className="text-sm font-bold mb-2 text-black">Expedido em</h3>
              <p className="text-black text-sm font-medium">
                {new Date(order.orderDate).toLocaleDateString()}
              </p>
            </div>

            {/* Vendedor */}
            <div>
              <h3 className="text-sm font-bold mb-2 text-black">Vendedor</h3>
              <p className="text-black text-sm font-medium">{order.salesperson}</p>
            </div>

            {/* Total de Itens */}
            <div>
              <h3 className="text-sm font-bold mb-2 text-black">Total de Itens</h3>
              <p className="text-black text-sm font-medium">{order.orderItems.length}</p>
            </div>
          </div>

          {/* Data */}

          {/* Tabela de Produtos */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-8 shadow-sm print-break">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Itens para Separação
              </h3>
            </div>

            <table className="w-full print-table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-16">✓</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-24">Código</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Produto</th>
                  <th className="p-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider w-32">Quantidade</th>
                  <th className="p-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider w-40">Localização</th>
                </tr>
              </thead>
              <tbody>
                {order.orderItems.map((item, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}
                  >
                    <td className="p-4">
                      <div className="w-6 h-6 border-2 border-gray-400 rounded-sm flex items-center justify-center">
                        <div className="w-3 h-3 bg-transparent rounded-sm"></div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm font-medium text-gray-800">{item.productCode}</td>
                    <td className="p-4 text-gray-800">{item.productName}</td>
                    <td className="p-4 text-center">
                      <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${item.location && item.location !== "Não definido"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                        }`}>
                        {item.location || "Não definido"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Observações */}
          {order.notes && (
            <div className="border border-amber-200 rounded-xl p-5 mb-8 bg-amber-50">
              <p className="text-sm text-amber-700 font-semibold mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Observações
              </p>
              <p className="text-amber-800">{order.notes}</p>
            </div>
          )}

          {/* Assinaturas */}
          <div className="flex flex-row justify-between print-signatures mb-8 pt-6 border-t border-gray-200">
            {["Separado por", "Conferido por"].map((label, i) => (
              <div key={i} className="text-center w-full">
                <p className="text-sm text-gray-600 mb-4 font-medium">{label}</p>
                <div className="border-b-2 border-gray-400 h-10 mb-2 mx-4"></div>
                <p className="text-xs text-gray-500">Assinatura</p>
                <p className="text-xs text-gray-400 mt-1">Data: ____/____/______</p>
              </div>
            ))}
          </div>

          {/* Rodapé */}
          <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
            <p>Documento gerado automaticamente pelo sistema Konéxus em {new Date().toLocaleDateString()}</p>
            <p className="mt-1">Vendas Konéxus • konexuserp@gmail.com • (11) xxxxx-xxxx</p>
          </div>

        </div>
      </div>

    </div>
  )
}