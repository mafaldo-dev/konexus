import React, { useState } from "react";
import { Download, FileText, X, Printer, CheckSquare, Package, ChevronLeft, HelpCircle, Settings, Share, Wrench } from "lucide-react";
import { useAuth } from "../AuthContext";
import Swal from 'sweetalert2';

declare global {
  interface Window {
    html2canvas: any;
    jspdf: any;
  }
}

interface DocumentViewerProps {
  order?: any;
  product?: any;
  documentType?: "purchase_order" | "label_70x30" | "label_100x100" | "separation_list" | "render_os_print_sheet";
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  order,
  product,
  documentType = "purchase_order",
  onClose
}) => {
  const { company } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handlePrint = async () => {
    if (!order && !product) {
      alert("Nenhum documento disponível para imprimir.");
      return;
    }

    // Se for etiqueta 70x30, processa confirmações antes
    if (documentType === "label_70x30") {
      await handlePrepareLabels();
      return;
    }

    // Para outros tipos, imprime direto
    window.print();
  };

  const handlePrepareLabels = async () => {
    if (!product?.orderItems) {
      // Produto único
      const quantity = await confirmQuantity(product, product?.quantity || 1);

      if (quantity === 0) {
        Swal.fire('Cancelado', 'Impressão cancelada', 'info');
        return;
      }

      // Atualiza a quantidade no produto antes de imprimir
      product.quantity = quantity;
      window.print();
      return;
    }

    // Múltiplos itens
    const items = product.orderItems || [];
    const confirmedItems = [];

    for (const item of items) {
      const originalQuantity = item.quantity || 1;
      const confirmedQuantity = await confirmQuantity(item, originalQuantity);

      if (confirmedQuantity > 0) {
        confirmedItems.push({
          ...item,
          quantity: confirmedQuantity
        });
      }
    }

    if (confirmedItems.length === 0) {
      Swal.fire('Cancelado', 'Nenhuma etiqueta selecionada', 'info');
      return;
    }

    // Atualiza os itens do produto antes de imprimir
    product.orderItems = confirmedItems;

    // Pequeno delay para o React renderizar
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleGeneratePDF = async () => {
    if (!order && !product) {
      alert("Nenhum documento disponível para gerar PDF.");
      return;
    }

    const element = document.getElementById('printable-content');
    const wrapper = element?.parentElement;
    const main = wrapper?.parentElement;
    if (!element) return;

    const originalElementClass = element.className;
    const originalWrapperClass = wrapper?.className || '';
    const originalMainClass = main?.className || '';

    try {
      const html2pdf = (await import('html2pdf.js')).default;

      // Simplifica completamente a estrutura para captura
      if (documentType === "separation_list" || documentType === "purchase_order" || documentType === "render_os_print_sheet") {
        element.className = 'bg-white w-[210mm] min-h-[297mm] mt-32';
      } else if (documentType.includes('label')) {
        element.className = '';
      }

      if (wrapper) {
        wrapper.className = '';
        wrapper.style.cssText = 'display: block; width: 210mm; margin: 0; padding: 0;';
      }

      if (main) {
        main.className = '';
        main.style.cssText = 'display: block; width: 220mm; margin: 0; padding: 0; overflow: visible;';
      }

      // Aguarda dois frames para garantir que todos os estilos sejam aplicados
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => requestAnimationFrame(resolve));

      const opt = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: documentType.includes("label")
          ? `etiqueta_${product?.productcode || "produto"}.pdf`
          : documentType === "separation_list"
            ? `lista_separacao_${order?.orderNumber || order?.id}.pdf`
            : `pedido_${order?.ordernumber || order?.id}.pdf`,
        image: { type: "jpeg" as const, quality: 0.99 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait" as const,
        },
      };

      await html2pdf().set(opt).from(element).save();

      element.className = originalElementClass;
      if (wrapper) {
        wrapper.className = originalWrapperClass;
        wrapper.style.cssText = '';
      }
      if (main) {
        main.className = originalMainClass;
        main.style.cssText = '';
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente usar a função de impressão.');
      element.className = originalElementClass;
      if (wrapper) {
        wrapper.className = originalWrapperClass;
        wrapper.style.cssText = '';
      }
      if (main) {
        main.className = originalMainClass;
        main.style.cssText = '';
      }
    }
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
    const barcodeWidth = 4;
    const barcodeHeight = 60;
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

  //CONFIRME QUANTIDADE
  const confirmQuantity = async (item: any, originalQuantity: number): Promise<number> => {
    // Se for 10 ou menos, imprime direto sem perguntar
    if (originalQuantity <= 10) {
      return originalQuantity;
    }

    // Confirmação inicial
    const result = await Swal.fire({
      title: '⚠️ Atenção!',
      html: `
      O item <strong>${item.productname || item.productName}</strong> possui <strong>${originalQuantity}</strong> unidades.<br><br>
      Deseja imprimir todas as etiquetas?
    `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, imprimir todas',
      cancelButtonText: 'Não, escolher quantidade',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
    });

    if (result.isConfirmed) {
      return originalQuantity;
    }

    if (result.dismiss === Swal.DismissReason.cancel) {
      const customResult = await Swal.fire({
        title: 'Quantas etiquetas imprimir?',
        html: `
        <p>Produto: <strong>${item.productname || item.productName}</strong></p>
        <p>Total disponível: <strong>${originalQuantity}</strong> unidades</p>
      `,
        input: 'number',
        inputValue: Math.min(originalQuantity, 10),
        inputAttributes: {
          min: '1',
          max: originalQuantity.toString(),
          step: '1'
        },
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3085d6',
        inputValidator: (value) => {
          const num = parseInt(value);
          if (!value || isNaN(num)) {
            return 'Digite um número válido!';
          }
          if (num < 1) {
            return 'A quantidade deve ser no mínimo 1!';
          }
          if (num > originalQuantity) {
            return `A quantidade máxima é ${originalQuantity}!`;
          }
          return null;
        }
      });

      if (customResult.isConfirmed) {
        return parseInt(customResult.value);
      }
    }

    return 0;
  };

  const renderLabel70x30 = () => {
    const renderLabels = (item: any, quantity: number) => {
      const barcodeValue = `${(item?.productname || 'Produto')
        .replace(/\s+/g, '')
        .toLowerCase()}-${(item?.productcode || 'PROD001')
          .replace(/\s+/g, '')
          .toLowerCase()}-${(item?.productbrand || 'Marca')
            .replace(/\s+/g, '')
            .toLowerCase()}-${(item?.productlocation || 'A01')
              .replace(/\s+/g, '')
              .toLowerCase()}`;

      return Array.from({ length: quantity }, (_, idx) => (
        <div
          key={`${item.productcode}-${idx}`}
          className="bg-white border-2 border-black"
          style={{
            width: '76mm',
            height: '35mm',
            padding: '3mm',
            boxShadow: "1px 1px",
            borderRadius: "12px",
          }}
        >
          <div className="flex flex-col h-full justify-between">
            <div className="text-center font-bold text-md truncate">
              {item?.productcode}
            </div>

            <div className="flex gap-2 justify-around text-center text-sm font-semibold py-1 truncate">
              <p className="text-sm">I: {item?.productname}</p>
              <span className="text-sm">M: {item?.productbrand}</span>
            </div>

            <div className="flex items-center justify-between">
              <div
                className="flex justify-start ml-2 items-center"
                style={{
                  width: '100%',
                  height: '10mm',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={generateBarcode(barcodeValue)}
                  alt="Código de barras"
                  style={{
                    width: '45%',
                    height: "35px",
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
    };

    // 🔹 Caso não exista lista de itens (exibição direta)
    if (!product?.orderItems) {
      return (
        <div className="flex flex-wrap gap-2 justify-center" style={{ pageBreakAfter: "always" }}>
          {renderLabels(product, product?.quantity || 1)}
        </div>
      );
    }

    // 🔹 Caso existam vários itens - renderiza TODOS por padrão
    const items = product.orderItems || [];

    return (
      <div className="flex flex-col gap-6">
        {items.map((item: any) => {
          const quantity = item.quantity || 1;

          return (
            <div key={item.productcode} className="flex flex-col items-center">
              <div className="flex flex-wrap gap-2 justify-center" style={{ pageBreakAfter: "always" }}>
                {renderLabels(item, quantity)}
              </div>
            </div>
          );
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
                boxShadow: "1px 1px 2px 1px",
                borderRadius: "12px"
              }}
            >
              <div className="flex flex-col h-full">

                {/* Cabeçalho */}
                <div className="text-center pb-2 mt-10 mb-1">
                  <div className="font-bold text-1xl">
                    PEDIDO {product.orderNumber}
                  </div>
                </div>

                {/* Cliente */}
                <div className="text-center pb-1 mb-1">
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
                  <div className="text-center p-1">
                    <div className="font-bold text-gray-600">PESO</div>
                    <div className="text-lg font-bold">
                      {product.totalWeight ? `${product.totalWeight}kg` : "N/A"}
                    </div>
                  </div>
                </div>

                {/* Rodapé da etiqueta */}
                <div className="text-center mb-8 -mt-5">
                  <p className="text-sm" style={{ fontSize: "12px" }}>
                    {company?.name} - {company?.cnpj || "------"}
                  </p>
                  <p className="text-sm" style={{ fontSize: "12px" }}>{company?.email}</p>
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
      className="flex flex-col print-area print-area print:scale-1  scale-[0.8]  bg-white w-[210mm] min-h-[297mm] p-12 rounded-sm border border-gray-200">
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
    <div className="flex flex-col print-area print-area print:scale-100 scale-[0.8] bg-white w-[210mm] min-h-[297mm] p-12 rounded-sm border border-gray-200">
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

        <div className="text-center w-[8vw]">
          <div className="bg-gray-50 h-[6vh] p-2 rounded border border-gray-200">
            <p className="text-xs text-gray-500 uppercase">Pedido Nº</p>
            <p className="text-xs font-bold text-gray-900 mt-0.5">{order?.orderNumber}</p>
          </div>
        </div>
      </div>

      {/* Informações principais compactas */}
      <div className="flex flex-row justify-between border border-gray-200 rounded px-2 py-2 gap-4 mb-4 text-xs">
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
      <div className="border border-gray-200 rounded mb-4 print-break">
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
  const renderOSPrintSheet = () => (
    <div className="flex flex-col print-area print:scale-100 scale-[0.8] bg-white w-[210mm] min-h-[297mm] p-12 rounded-sm border border-gray-200">
      {/* Cabeçalho */}
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
            <h1 className="text-sm font-bold text-gray-900">
              {company?.name || "Empresa"} - Ordens de Serviço
            </h1>
            <p className="text-xs text-gray-600 font-medium">
              Ficha de Execução de OS
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {company?.email || "konexuserp@comercial.com"}
            </p>
          </div>
        </div>

        <div className="text-center w-[8vw]">
          <div className="bg-gray-50 h-[6vh] p-2 rounded border border-gray-200">
            <p className="text-xs text-gray-500 uppercase">OS Nº</p>
            <p className="text-xs font-bold text-gray-900 mt-0.5">
              {order?.ordernumber}
            </p>
          </div>
        </div>
      </div>

      {/* Informações principais */}
      <div className="flex flex-row justify-between border border-gray-200 rounded px-2 py-2 gap-4 mb-4 text-xs">
        <div className="flex-1">
          <h3 className="font-bold mb-1 text-black">Solicitante</h3>
          <p className="font-medium text-black mb-1">
            {order.username || "Não informado"}
          </p>
          <p className="text-black">
            {order?.sector || "Setor não definido"}
          </p>
        </div>

        <div className="text-center">
          <h3 className="font-bold mb-1 text-black">Criada em</h3>
          <p className="text-black font-medium">
            {order?.orderdate
              ? new Date(order.orderdate).toLocaleDateString()
              : "—"}
          </p>
        </div>

        <div className="text-center">
          <h3 className="font-bold mb-1 text-black">Responsável</h3>
          <p className="text-black font-medium">
            {order?.receiver_name || "—"}
          </p>
        </div>

        <div className="text-center">
          <h3 className="font-bold mb-1 text-black">Status</h3>
          <p className="text-black font-medium capitalize">
            {getStatusLabel(order?.orderstatus) || "—"}
          </p>
        </div>
      </div>

      {/* Itens da OS */}
      <div className="border border-gray-200 rounded mb-4 print-break">
        <div className="bg-gray-800 px-3 py-2">
          <h3 className="text-white font-semibold text-xs flex items-center gap-1">
            <Wrench className="w-3 h-3" />
            Itens da OS
          </h3>
        </div>

        <table className="w-full print-table text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-2 text-left font-semibold text-gray-700 w-8">✓</th>
              <th className="p-2 text-left font-semibold text-gray-700">Produto</th>
              <th className="p-2 text-left font-semibold text-gray-700">Marca</th>
              <th className="p-2 text-center font-semibold text-gray-700 w-24">Quantidade</th>
              <th className="p-2 text-center font-semibold text-gray-700 w-32">Localização</th>
            </tr>
          </thead>
          <tbody>
            {order?.orderitems?.map((item: any, i: number) => (
              <tr
                key={i}
                className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
              >
                <td className="p-2">
                  <div className="w-4 h-4 border border-gray-400 rounded-sm flex items-center justify-center">
                    <div className="w-2 h-2 bg-transparent rounded-sm"></div>
                  </div>
                </td>
                <td className="p-2 text-gray-800">{item.productName || "—"}</td>
                <td className="p-2 text-gray-800">{item.brand}</td>
                <td className="p-2 text-center">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                    {item.quantity || 1}
                  </span>
                </td>
                <td className="p-2 text-center text-gray-700">
                  {item.location || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Observações gerais */}
      {order?.notes && (
        <div className="border border-amber-200 rounded p-3 mb-4 bg-amber-50 text-xs">
          <p className="text-amber-700 font-semibold mb-1">Observações</p>
          <p className="text-amber-800">{order.notes}</p>
        </div>
      )}

      {/* Assinaturas */}
      <div className="flex flex-row justify-between print-signatures mb-4 pt-3 border-t border-gray-200 text-xs mt-auto">
        {["Executado por", "Conferido por"].map((label, i) => (
          <div key={i} className="text-center w-full">
            <p className="text-gray-600 mb-2 font-medium">{label}</p>
            <div className="border-b border-gray-400 h-6 mb-1 mx-2"></div>
            <p className="text-gray-500 text-xs">Assinatura</p>
            <p className="text-gray-400 text-xs mt-0.5">Data: __/__/____</p>
          </div>
        ))}
      </div>

      {/* Rodapé */}
      <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-2">
        <p>
          {company?.name} • {company?.email}
        </p>
        <p className="text-xs">
          Documento gerado em {new Date().toLocaleDateString()} • Konéxus
        </p>
      </div>
    </div>
  );


  const getPageSize = () => {
    if (documentType === "label_70x30") return "size: 70mm 30mm;";
    if (documentType === "label_100x100") return "size: 100mm 100mm;";
    if (documentType === "separation_list") return "size: A4; margin: 25mm;";
    if (documentType === "render_os_print_sheet") return "size A4; margin: 25mm;"
    return "size: A4;";
  };

  return (
    <>
      <style>{`
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

            body * {
              visibility: hidden !important;
            }

            #printable-content,
            #printable-content * {
              visibility: visible !important;
            }

            #printable-content {
              display: block !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 210mm !important;
              height: 270mm !important;
              margin: 0 auto !important;
              background: white !important;
              z-index: 9999 !important;
              transform: none !important;
              scale: 1 !important;
            }

            .print-area {
              transform: none !important;
              scale: 1 !important;
            }

            .no-print,
            header,
            button,
            nav,
            aside {
              display: none !important;
            }

            .fixed {
              position: static !important;
              background: white !important;
            }

            main {
              display: block !important;
              overflow: visible !important;
              height: auto !important;
            }

            @page {
              ${getPageSize()}
              margin: 0;
            }
          }
        `}</style>


      <div className="fixed inset-0  z-50 bg-gray-300 flex h-full flex-col">
        {/* Header moderno com engrenagem à direita */}
        <header className="no-print flex justify-between items-center h-12 w-full px-7 bg-slate-800 shadow-lg">
          {/* Lado esquerdo - Título do documento */}
          <div className="flex items-center gap-3 ">
            <div className="w-6 h-6 bg-slate-700 rounded-lg flex items-center justify-center">
              {documentType === "purchase_order" && <FileText className="text-white" size={14} />}
              {documentType.includes("label") && <Package className="text-white" size={14} />}
              {documentType === "separation_list" && <CheckSquare className="text-white" size={14} />}
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">
                {documentType === "purchase_order" && "Pedido de Compra"}
                {documentType === "separation_list" && "Lista de Separação"}
                {documentType.includes("label") && "Etiquetas"}
              </h1>
              <p className="text-slate-300 text-sm">
                {documentType.includes("label")
                  ? product?.productcode
                  : order?.orderNumber || order?.ordernumber}
              </p>
            </div>
          </div>

          {/* Lado direito - Botão de engrenagem */}
          <div className="relative">
            <button
              onClick={toggleMenu}
              className="p-1 w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-all duration-200 hover:rotate-90"
              title="Opções"
            >
              <Settings size={14} />
            </button>

            {/* Menu deslizante */}
            <div className={`
              fixed top-0 right-0 h-full bg-slate-800 shadow-2xl transition-transform duration-300 z-50
              ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
            `} style={{ width: '280px' }}>

              {/* Cabeçalho do menu */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 className="text-white font-semibold text-lg">Opções</h2>
                <button
                  onClick={toggleMenu}
                  className="p-2 rounded-lg hover:bg-slate-700 text-white transition"
                >
                  <ChevronLeft size={14} />
                </button>
              </div>

              {/* Conteúdo do menu */}
              <div className="p-6 space-y-4">
                {/* Grupo - Ações do Documento */}
                <div>
                  <h3 className="text-slate-400 text-sm font-medium mb-3 uppercase tracking-wider">
                    Ações do Documento
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={handlePrint}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                    >
                      <Printer size={14} />
                      <span>Imprimir Documento</span>
                    </button>

                    <button
                      onClick={handleGeneratePDF}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                    >
                      <FileText size={14} />
                      <span>Gerar PDF</span>
                    </button>

                    <button
                      onClick={handleDownload}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                    >
                      <Download size={14} />
                      <span>Exportar JSON</span>
                    </button>
                  </div>
                </div>

                {/* Grupo - Configurações */}
                <div>
                  <h3 className="text-slate-400 text-sm font-medium mb-3 uppercase tracking-wider">
                    Configurações
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        // Função para duplicar documento
                        console.log('Duplicar documento');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                    >
                      <FileText size={14} />
                      <span>Duplicar Documento</span>
                    </button>

                    <button
                      onClick={() => {
                        // Função para compartilhar
                        console.log('Compartilhar documento');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                    >
                      <Share size={14} />
                      <span>Compartilhar</span>
                    </button>
                  </div>
                </div>

                {/* Grupo - Sistema */}
                <div>
                  <h3 className="text-slate-400 text-sm font-medium mb-3 uppercase tracking-wider">
                    Sistema
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        // Função para ajuda
                        console.log('Abrir ajuda');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                    >
                      <HelpCircle size={14} />
                      <span>Ajuda & Suporte</span>
                    </button>

                    <button
                      onClick={onClose}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-600 hover:bg-red-500 text-white transition"
                    >
                      <X size={14} />
                      <span>Fechar Visualizador</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay quando menu está aberto */}
            {isMenuOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={toggleMenu}
              />
            )}
          </div>
        </header>

        {/* Conteúdo principal (mantém igual) */}
        <main className="flex justify-center m-auto items-center overflow-hidden">
          <div
            id="printable-content"
            className={
              documentType.includes('label') ? '' :
                documentType === "separation_list" ? 'w-[210mm] min-h-[297mm]' : 'origin-top'
            }
          >
            {documentType === "label_70x30" && renderLabel70x30()}
            {documentType === "label_100x100" && renderLabel100x100()}
            {documentType === "purchase_order" && renderPurchaseOrder()}
            {documentType === "separation_list" && renderSeparationList()}
            {documentType === "render_os_print_sheet" && renderOSPrintSheet()}
          </div>
        </main>
      </div>
    </>
  )
};

export default DocumentViewer;