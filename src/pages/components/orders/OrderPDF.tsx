import { format } from "date-fns";

import { MapPin, User, Calendar, Phone, CheckSquare, Package } from "lucide-react";
import { Order } from "../../../service/interfaces/orders";


type OrderPDFProps = {
  order: Order;
  onDownloadComplete: () => void;
};

export default function OrderPDF({ order, onDownloadComplete }: OrderPDFProps) {
  if (!order) return null;

  const statusColors: Record<Order["status"], string> = {
    pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
    separando: "bg-blue-100 text-blue-800 border-blue-200",
    separado: "bg-green-100 text-green-800 border-green-200",
    enviado: "bg-purple-100 text-purple-800 border-purple-200",
  };

  const handlePrint = () => {
    window.print();
    setTimeout(() => {
      if (onDownloadComplete) onDownloadComplete();
    }, 1000);
  };

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
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
        >
          Baixar PDF de Separação
        </button>
      </div>

      <div className="print-area print-horizontal bg-white shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none">

        {/* Cabeçalho da empresa */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 print-header print:bg-slate-900">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <img 
                  src="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=80&h=80&fit=crop&crop=center" 
                  alt="Logo VendaFlow" 
                  className="w-12 h-12 rounded-lg object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="hidden w-12 h-12 bg-blue-600 rounded-lg items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-1">VendaFlow</h1>
                <p className="text-slate-300 text-lg">Lista de Separação - Expedição</p>
                <p className="text-slate-400 text-sm mt-1">vendaflow@empresa.com.br | (11) 9999-9999</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                <p className="text-sm text-slate-300 mb-1">Pedido Nº</p>
                <p className="text-3xl font-bold">{order.order_number}</p>
                <div className="flex items-center gap-2 mt-2 justify-end">
                  <span className={`text-sm px-3 py-1 rounded-full font-medium border ${statusColors[order.status]}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Datas */}
        <div className="p-4 bg-slate-50 border-b">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>
                Data do Pedido: {format(new Date(order.order_date), "dd/MM/yyyy")}
              </span>
            </div>
            {order.delivery_date && (
              <div className="text-slate-600">
                Previsão de Entrega: {format(new Date(order.order_date), "dd/MM/yyyy")}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Cliente e Separação */}
          <div className="print-info-grid grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-slate-200 shadow-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Dados do Cliente</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500">Nome</p>
                  <p className="font-medium text-slate-900">{order.customer_name}</p>
                </div>
                {order.customer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-700 text-sm">{order.customer_phone}</span>
                  </div>
                )}
                {order.customer_address && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-500">Endereço de Entrega</span>
                    </div>
                    <p className="text-slate-700 text-sm pl-5">{order.customer_address}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-slate-200 shadow-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Informações da Separação</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500">Vendedor Responsável</p>
                  <p className="font-medium text-slate-900">{order.salesperson}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total de Itens</p>
                  <p className="text-2xl font-bold text-emerald-600">{order.items.length} itens</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Produtos */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Lista de Separação - Expedição</h3>
            </div>

            <div className="border border-slate-200 shadow-sm rounded-lg overflow-hidden">
              <table className="print-table w-full">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="text-left p-4 font-semibold">✓ Separado</th>
                    <th className="text-left p-4 font-semibold">Código</th>
                    <th className="text-left p-4 font-semibold">Produto</th>
                    <th className="text-center p-4 font-semibold">Quantidade</th>
                    <th className="text-center p-4 font-semibold">Localização no Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4">
                        <div className="w-6 h-6 border-2 border-slate-400 rounded"></div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm bg-slate-100 px-3 py-1 rounded">
                          {item.product_code}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-900">{item.product_name}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-800 rounded-full font-bold text-lg">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {item.location ? (
                          <span className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-2 rounded-full text-sm font-medium">
                            <MapPin className="w-3 h-3" />
                            {item.location}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">Localização não definida</span>
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
                <p className="text-sm text-slate-500 mb-3">{label}:</p>
                <div className="border-b-2 border-slate-300 pb-1 mb-2 h-8"></div>
                <p className="text-xs text-slate-400">Nome e Assinatura</p>
              </div>
            ))}
          </div>

          {/* Observações */}
          {order.notes && (
            <div className="border-t pt-4">
              <p className="text-sm text-slate-500 mb-2 font-semibold">Observações:</p>
              <p className="text-slate-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-sm">
                {order.notes}
              </p>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="bg-slate-100 p-4 text-center text-xs text-slate-500 border-t">
          <p>
            Este documento foi gerado automaticamente pelo sistema VendaFlow em{" "}
            {format(new Date(order.order_date), "dd/MM/yyyy")}
          </p>
        </div>
      </div>
    </div>
  );
}
