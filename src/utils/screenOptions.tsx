import React from "react";
import { Download, FileText, X, Printer, CheckSquare, Package } from "lucide-react";
import { useAuth } from "../AuthContext";

declare global {
  interface Window {
    html2canvas: any;
    jspdf: any;
  }
}

interface DocumentViewerProps {
  order?: any;
  product?: any;
  documentType?: "purchase_order" | "label_70x30" | "label_100x100" | "separation_list";
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  order,
  product,
  documentType = "purchase_order",
  onClose
}) => {
  const { company } = useAuth()


  const handlePrint = () => {
    if (!order && !product) {
      alert("Nenhum documento disponível para imprimir.");
      return;
    }
    window.print();
  };

  const handleGeneratePDF = async () => {
    if (!order && !product) {
      alert("Nenhum documento disponível para gerar PDF.");
      return;
    }

    const element = document.getElementById('printable-content');
    if (!element) return;

    try {
      if (typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
        await loadLibraries();
      }

      const canvas = await window.html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;

      let pdf;
      if (documentType === "label_70x30") {
        pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [30, 70]
        });
      } else if (documentType === "label_100x100") {
        pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [100, 100]
        });
      } else {
        pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
      }

      const imgWidth = documentType === "label_70x30" ? 70 :
        documentType === "label_100x100" ? 100 : 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      const fileName = documentType.includes('label')
        ? `etiqueta_${product?.productcode || 'produto'}.pdf`
        : documentType === "separation_list"
          ? `lista_separacao_${order?.orderNumber || order?.id}.pdf`
          : `pedido_${order?.ordernumber || order?.id}.pdf`;

      pdf.save(fileName);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente usar a função de impressão.');
    }
  };

  const loadLibraries = () => {
    return new Promise<void>((resolve, reject) => {
      const html2canvasScript = document.createElement('script');
      html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      html2canvasScript.onload = () => {
        const jspdfScript = document.createElement('script');
        jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        jspdfScript.onload = () => resolve();
        jspdfScript.onerror = () => reject(new Error('Erro ao carregar jsPDF'));
        document.head.appendChild(jspdfScript);
      };
      html2canvasScript.onerror = () => reject(new Error('Erro ao carregar html2canvas'));
      document.head.appendChild(html2canvasScript);
    });
  };

  const handleDownload = () => {
    const data = order || product;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = documentType.includes('label')
      ? `etiqueta_${product?.productcode || 'produto'}.json`
      : documentType === "separation_list"
        ? `lista_separacao_${order?.orderNumber || "documento"}.json`
        : `pedido_${order?.ordernumber || "documento"}.json`;
    link.click();
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovado",
      in_progress: "Em Andamento",
      received: "Recebido",
      canceled: "Cancelado"
    };
    return labels[status] || status;
  };

  const generateBarcode = (code: string) => {
    const barcodeWidth = 2;
    const barcodeHeight = 40;
    const bars = code.split('').map((char, i) => {
      const isBlack = i % 2 === 0;
      return `<rect x="${i * barcodeWidth}" y="0" width="${barcodeWidth}" height="${barcodeHeight}" fill="${isBlack ? 'black' : 'white'}"/>`;
    }).join('');

    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${code.length * barcodeWidth}" height="${barcodeHeight}">
        ${bars}
      </svg>
    `)}`;
  };

  const renderLabel70x30 = () => {
    if (!product?.orderItems) {

      return (
        <div
          className="flex flex-wrap gap-3 justify-center"
          style={{ pageBreakAfter: "always" }}
        >
          {Array.from({ length: product?.quantity || 1 }, (_, idx) => {
            const barcodeValue = `${(product?.productname || 'Produto')
              .replace(/\s+/g, '')
              .toUpperCase()}-${(product?.productcode || 'PROD001')
                .replace(/\s+/g, '')
                .toUpperCase()}-${(product?.productbrand || 'Marca')
                  .replace(/\s+/g, '')
                  .toUpperCase()}-${(product?.productlocation || 'A01')
                    .replace(/\s+/g, '')
                    .toUpperCase()}`;

            return (
              <div
                key={idx}
                className="bg-white border-2 border-black"
                style={{
                  width: '70mm',
                  height: '30mm',
                  padding: '2mm',
                  boxShadow: "2px 2px 1px 3px"
                }}
              >
                <div className="flex flex-col h-full justify-between">
                  <div className="text-center font-bold text-md truncate">
                    {product?.productcode}
                  </div>

                  <div className="text-center text-sm font-semibold py-1 truncate">
                    <p className="text-sm">I: {product?.productname}</p>
                    <span className="text-sm">M: {product?.productbrand}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div
                      className="flex justify-start ml-2 items-center"
                      style={{
                        width: '100%',
                        height: '7mm',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={generateBarcode(barcodeValue)}
                        alt="Código de barras"
                        className="h-full"
                        style={{
                          width: '55%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>

                    <div className="ml-2 text-right">
                      <div className="text-sm font-bold px-2 py-1 bg-gray-100">
                        {product?.productlocation || 'A-01'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    const items = product.orderItems || [];

    return (
      <div
        className="flex flex-wrap gap-3 justify-center"
        style={{ pageBreakAfter: "always" }}
      >
        {items.flatMap((item: any, itemIdx: any) => {
          const barcodeValue = `${(item?.productname || 'Produto')
            .replace(/\s+/g, '')
            .toUpperCase()}-${(item?.productcode || 'PROD001')
              .replace(/\s+/g, '')
              .toUpperCase()}-${(item?.productbrand || 'Marca')
                .replace(/\s+/g, '')
                .toUpperCase()}-${(item?.productlocation || 'A01')
                  .replace(/\s+/g, '')
                  .toUpperCase()}`;

          return Array.from({ length: item.quantity || 1 }, (_, qtyIdx) => (
            <div
              key={`${itemIdx}-${qtyIdx}`}
              className="bg-white border-2 border-black"
              style={{
                width: '70mm',
                height: '30mm',
                padding: '2mm',
                boxShadow: "1px 1px"
              }}
            >
              <div className="flex flex-col h-full justify-between">
                <div className="text-center font-bold text-md truncate">
                  {item?.productcode}
                </div>

                <div className="text-center text-sm font-semibold py-1 truncate">
                  <p className="text-sm">I: {item?.productname}</p>
                  <span className="text-sm">M: {item?.productbrand}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div
                    className="flex justify-start ml-2 items-center"
                    style={{
                      width: '100%',
                      height: '7mm',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={generateBarcode(barcodeValue)}
                      alt="Código de barras"
                      className="h-full"
                      style={{
                        width: '55%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>

                  <div className="ml-2 text-right">
                    <div className="text-sm font-bold px-2 py-1 bg-gray-100">
                      {item?.productlocation || 'A-01'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ));
        })}
      </div>
    );
  };

  const renderLabel100x100 = () => {
    if (product?.orderNumber) {
      return (
        <div
          className="flex flex-wrap gap-4 justify-start"
          style={{
            pageBreakAfter: "always",
          }}
        >
          {Array.from({ length: product.totalVolumes || 1 }, (_, idx) => (
            <div
              key={idx}
              className="bg-white border-2 border-black"
              style={{
                width: "100mm",
                height: "100mm",
                padding: "4mm",
                boxShadow: "1px 1px 1px 1px"
              }}
            >
              <div className="flex flex-col h-full">

                {/* Cabeçalho */}
                <div className="text-center pb-2 mt-4 mb-1">
                  <div className="font-bold text-1xl">
                    PEDIDO {product.orderNumber} | NF {"1204"}
                  </div>
                </div>

                {/* Cliente */}
                <div className="text-center pb-1 mb-1">
                  <div className="font-bold text-sm text-gray-600">CLIENTE:</div>
                  <div className="font-semibold text-base">{product.customerName}</div>
                </div>

                {/* Endereço de Entrega */}
                <div className="flex flex-col text-center gap-1 pb-1 mb-1">
                  <div className="font-bold text-sm text-gray-600">ENDEREÇO DE ENTREGA:</div>
                  <div className="text-sm">
                    {product.shippingAddress} - {product.shippingCity} <br />
                    CEP: {product.shippingZip}
                  </div>
                </div>

                {/* Campos vazios */}
                <div className="flex-1 flex flex-col space-y-2 text-sm">
                  <div className="flex gap-4 self-center p-1">
                    <span className="font-bold">TRANSP: </span>
                      {product.carrier.toUpperCase()}
                    <span className="inline-block flex-1 ml-2" style={{ width: "50%" }}>
                      &nbsp;
                    </span>
                  </div>
                </div>

                {/* Informações do Pedido */}
                <div className="flex items-center justify-center gap-2 text-center text-xs mb-6">
                  <div className="text-center p-1">
                    <div className="font-bold text-gray-600">VOLUME</div>
                    <div className="text-lg font-bold">
                      {idx + 1}/{product.totalVolumes}
                    </div>
                  </div>
                  <span>-</span>
                  <div className="text-center p-1">
                    <div className="font-bold text-gray-600">PESO</div>
                    <div className="text-lg font-bold">
                      {product.totalWeight ? `${product.totalWeight}kg` : "N/A"}                  
                    </div>
                  </div>
                </div>

                {/* Rodapé da etiqueta */}
                <div className="text-center mb-8 -mt-5">
                  <p className="text-sm" style={{fontSize: "12px"}}>
                    {company?.name} - {company?.cnpj || "------"}
                  </p>
                  <p className="text-sm" style={{fontSize: "12px"}}>{company?.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  const renderPurchaseOrder = () => (
    <div
      className="flex flex-col print-area print-area bg-white w-[210mm] h-[297mm] scale-[0.8] p-8 print:p-8 print:m-0 rounded-sm border border-gray-200">
      {order ? (
        <>
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
            <h2 className="text-3xl font-bold uppercase text-slate-800">
              {company?.name || "Empresa"}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              CNPJ: {company?.cnpj || "00.000.000/0000-00"}
            </p>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold uppercase text-slate-800">
              Pedido de Compra
            </h3>
            <p className="text-slate-600 text-base mt-2 font-semibold">
              Nº {order.ordernumber || order.id}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm mb-6 border border-slate-300 p-4 rounded">
            <div>
              <p className="font-medium text-slate-700 mb-2">
                <strong>Data do Pedido:</strong>{" "}
                {new Date(order.orderdate).toLocaleDateString("pt-BR")}
              </p>
              <p className="font-medium text-slate-700">
                <strong>Status:</strong>{" "}
                <span className="capitalize">{getStatusLabel(order.orderstatus)}</span>
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-700 mb-2">
                <strong>Solicitante:</strong>{" "}
                {company?.name || "Não informado"}
              </p>
              <p className="font-medium text-slate-700">
                <strong>Moeda:</strong> {order.currency || "BRL"}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-slate-800 font-bold text-base mb-3 border-b-2 border-slate-300 pb-2">
              Dados do Fornecedor
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded border border-slate-200">
              <p>
                <strong>Nome:</strong> {order.suppliername || "---"}
              </p>
              <p>
                <strong>Email:</strong> {order.supplier?.email || "---"}
              </p>
              <p>
                <strong>Telefone:</strong> {order.supplier?.phone || "---"}
              </p>
              <p>
                <strong>CNPJ:</strong> {order.suppliercnpj || "---"}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-slate-800 font-bold text-base mb-3 border-b-2 border-slate-300 pb-2">
              Itens do Pedido
            </h4>
            <table className="w-full text-sm border-2 border-slate-300">
              <thead className="bg-slate-800 text-white">
                <tr className="text-left">
                  <th className="px-3 py-3 font-semibold">Código</th>
                  <th className="px-3 py-3 font-semibold">Produto</th>
                  <th className="px-3 py-3 text-right font-semibold">Qtd</th>
                  <th className="px-3 py-3 text-right font-semibold">Custo Unit.</th>
                  <th className="px-3 py-3 text-right font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item: any, idx: number) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-300"
                    >
                      <td className="px-3 py-2">{item.productcode}</td>
                      <td className="px-3 py-2">{item.productname}</td>
                      <td className="px-3 py-2 text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">
                        R$ {Number(item.cost).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        R$ {(item.quantity * item.cost).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-slate-500">
                      Nenhum item listado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="text-right font-bold text-slate-800 text-xl border-t-2 border-slate-800 pt-4 mb-6">
            Total: R$ {Number(order.totalcost).toFixed(2)}
          </div>

          {order.notes && (
            <div className="mt-6">
              <h4 className="text-slate-800 font-bold text-base mb-3 border-b-2 border-slate-300 pb-2">
                Observações
              </h4>
              <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-4 rounded border border-slate-200">
                {order.notes}
              </p>
            </div>
          )}

          <div className="mt-12 pt-6 border-t border-slate-300 text-center text-xs text-slate-500">
            <p>Documento gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}</p>
          </div>
        </>
      ) : (
        <p className="text-slate-600 text-center">
          Nenhum pedido selecionado.
        </p>
      )}
    </div>
  );

  const renderSeparationList = () => (
    <div className="flex flex-col print-area print-area bg-white w-[210mm] h-[297mm] scale-[0.8] p-8 print:p-8 print:m-0 rounded-sm border border-gray-200">
      {/* Cabeçalho Compacto */}
      <div className="flex justify-between items-start mb-2 -mt-2 pb-3 border-b border-gray-100">
        <div className="flex items-start gap-2">
          <div className="w-12 h-12 flex items-center justify-center">
            <img
              src={company?.companyIcon || "logo"}
              alt="Logo"
              className="w-10 h-10 object-contain"
            />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Vendas {company?.name}</h1>
            <p className="text-xs text-gray-600 font-medium">Lista de Separação - Expedição</p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {company?.email || "konexuserp@comercial.com"}
            </p>
          </div>
        </div>

        <div className="text-center w-[12vw]">
          <div className="bg-gray-50 h-[6vh] p-2 rounded border border-gray-200">
            <p className="text-xs text-gray-500 uppercase">Pedido Nº</p>
            <p className="text-xs font-bold text-gray-900 mt-0.5">{order?.orderNumber}</p>
          </div>
        </div>
      </div>

      {/* Informações principais compactas */}
      <div className="flex flex-row justify-between border border-gray-200 rounded px-3 py-2 gap-4 mb-4 text-xs">
        <div className="flex-1">
          <h3 className="font-bold mb-1 text-black">Dados do cliente</h3>
          <p className="font-medium text-black mb-1">{order?.customer?.name}</p>
          <p className="text-black">
            {order?.shipping ?
              `${order.shipping.city}, ${order.shipping.number} - ${order.shipping.street}, CEP: ${order.shipping.zip}` :
              `${order?.billing?.city}, ${order?.billing?.street} - ${order?.billing?.number}, CEP: ${order?.billing?.zip}`
            }
          </p>
        </div>

        <div className="text-center">
          <h3 className="font-bold mb-1 text-black">Expedido em</h3>
          <p className="text-black font-medium">{new Date(order?.orderDate).toLocaleDateString()}</p>
        </div>

        <div className="text-center">
          <h3 className="font-bold mb-1 text-black">Vendedor</h3>
          <p className="text-black font-medium">{order?.salesperson}</p>
        </div>

        <div className="text-center">
          <h3 className="font-bold mb-1 text-black">Total Itens</h3>
          <p className="text-black font-medium">{order?.orderItems?.length}</p>
        </div>
      </div>

      {/* Tabela de Produtos Compacta */}
      <div className="border border-gray-200 rounded overflow-hidden mb-4 print-break">
        <div className="bg-gray-800 px-3 py-2">
          <h3 className="text-white font-semibold text-xs flex items-center gap-1">
            <CheckSquare className="w-3 h-3" />
            Itens para Separação
          </h3>
        </div>

        <table className="w-full print-table text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-2 text-left font-semibold text-gray-700 w-8">✓</th>
              <th className="p-2 text-left font-semibold text-gray-700 w-16">Código</th>
              <th className="p-2 text-left font-semibold text-gray-700">Produto</th>
              <th className="p-2 text-center font-semibold text-gray-700 w-20">Qtd</th>
              <th className="p-2 text-center font-semibold text-gray-700 w-28">Localização</th>
            </tr>
          </thead>
          <tbody>
            {order?.orderItems?.map((item: any, i: number) => (
              <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="p-2">
                  <div className="w-4 h-4 border border-gray-400 rounded-sm flex items-center justify-center">
                    <div className="w-2 h-2 bg-transparent rounded-sm"></div>
                  </div>
                </td>
                <td className="p-2 font-mono font-medium text-gray-800">{item.productCode}</td>
                <td className="p-2 text-gray-800">{item.productName}</td>
                <td className="p-2 text-center">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                    {item.quantity}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs ${item.location && item.location !== "Não definido"
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

      {/* Observações Compactas */}
      {order?.notes && (
        <div className="border border-amber-200 rounded p-3 mb-4 bg-amber-50 text-xs">
          <p className="text-amber-700 font-semibold mb-1">Observações</p>
          <p className="text-amber-800">{order.notes}</p>
        </div>
      )}

      {/* Assinaturas Compactas */}
      <div className="flex flex-row justify-between print-signatures mb-4 pt-3 border-t border-gray-200 text-xs mt-auto">
        {["Separado por", "Conferido por"].map((label, i) => (
          <div key={i} className="text-center w-full">
            <p className="text-gray-600 mb-2 font-medium">{label}</p>
            <div className="border-b border-gray-400 h-6 mb-1 mx-2"></div>
            <p className="text-gray-500 text-xs">Assinatura</p>
            <p className="text-gray-400 text-xs mt-0.5">Data: __/__/____</p>
          </div>
        ))}
      </div>

      {/* Rodapé Compacto */}
      <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-2">
        <p>Vendas {company?.name} • {company?.email}</p>
        <p className="text-xs">Documento gerado em {new Date().toLocaleDateString()} • Konéxus</p>
      </div>
    </div>
  );

  // Define o tamanho da página para impressão
  const getPageSize = () => {
    if (documentType === "label_70x30") return "size: 70mm 30mm;";
    if (documentType === "label_100x100") return "size: 100mm 100mm;";
    if (documentType === "separation_list") return "size: A4; margin: 25mm;";
    return "size: A4;";
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-content,
          #printable-content * {
            visibility: visible;
          }
          #printable-content {
            position: absolute;
            left: 0;
            top: 0;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          @page {
            ${getPageSize()}
            margin: 0;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 bg-slate-300 flex flex-col">
        <header className="no-print flex justify-end self-center h-3 w-[60vw] rounded-b-xl items-center px-2 py-4 bg-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrint}
              className="p-2 rounded-md hover:bg-slate-700 text-white transition flex items-center gap-2"
              title="Imprimir"
            >
              <Printer size={18} />
              <span className="text-sm">Imprimir</span>
            </button>

            <button
              onClick={handleGeneratePDF}
              className="p-2 rounded-md hover:bg-slate-700 text-white transition flex items-center gap-2"
              title="Gerar PDF"
            >
              <FileText size={18} />
              <span className="text-sm">PDF</span>
            </button>

            <button
              onClick={handleDownload}
              className="p-2 rounded-md hover:bg-slate-700 text-white transition"
              title="Download JSON"
            >
              <Download size={18} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-slate-700 text-white transition"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 flex justify-center items-center overflow-auto py-8">
          <div
            id="printable-content"
            className={
              documentType.includes('label') ? '' :
                documentType === "separation_list" ? 'w-[210mm] h-full' : 'scale-[0.8] origin-top mt-32'
            }
          >
            {documentType === "label_70x30" && renderLabel70x30()}
            {documentType === "label_100x100" && renderLabel100x100()}
            {documentType === "purchase_order" && renderPurchaseOrder()}
            {documentType === "separation_list" && renderSeparationList()}
          </div>
        </main>
      </div>
    </>
  )
};

export default DocumentViewer;