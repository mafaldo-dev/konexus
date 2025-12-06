import React, { useEffect, useRef, useState } from "react";
import { Download, FileText, X, Printer, CheckSquare, Package, ChevronLeft, HelpCircle, Settings, Share, Wrench, FileSpreadsheet } from "lucide-react";
import { useAuth } from "../AuthContext";
import Swal from 'sweetalert2';
import { handleNfeById } from "../service/api/Administrador/financial";
import * as XLSX from 'xlsx';


declare global {
  interface Window {
    html2canvas: any;
    jspdf: any;
    labelQuantities: { [key: string]: number };
    labelProcessingDone: boolean;
  }
}

interface DocumentViewerProps {
  order?: any;
  product?: any;
  report?: any
  documentType?: "purchase_order" | "label_70x30" | "label_100x100" | "separation_list" | "render_os_print_sheet" | "nfe_pdf" | "render_report_print_sheet" | "relatorio_expedicao" | "relatorio_inventario";
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  order,
  product,
  report,
  documentType = "purchase_order",
  onClose
}) => {
  const { company } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [processedItems, setProcessedItems] = useState<any[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);


  const handleExportExcel = () => {
    try {
      // Prepara os dados baseado no tipo de relatório
      const reportTitle = report?.reportType === 'inventory'
        ? 'Relatório de Inventário'
        : 'Relatório de Expedição';

      const reportDate = report?.selectedDate
        ? new Date(report.selectedDate).toLocaleDateString('pt-BR')
        : new Date().toLocaleDateString('pt-BR');

      // Cabeçalho do relatório
      const header = [
        [reportTitle],
        [`Data: ${reportDate}`],
        [`Total de Itens: ${report?.reportitems?.length || 0}`],
        [], // Linha vazia
      ];

      // Colunas selecionadas
      const selectedFilters = report?.selectedFilters || [];
      const allFilters = report?.allFilters || [];

      // Monta o cabeçalho das colunas
      const columnHeaders = selectedFilters.map((filterKey: string) => {
        const filter = allFilters.find((f: any) => f.key === filterKey);
        if (filter) return filter.label;
        if (filterKey === 'quantity') return 'Quantidade';
        if (filterKey === 'orderNumber') return 'Nº Pedido';
        return filterKey;
      });

      // Adiciona coluna de conferência
      columnHeaders.push('Conferido');

      // Monta os dados das linhas
      const dataRows = (report?.reportitems || []).map((item: any) => {
        const row = selectedFilters.map((key: string) => {
          const value = item[key];

          // Formata valores especiais
          if (key === 'stock' || key === 'minimum_stock' || key === 'quantity') {
            return `${value || 0} un`;
          }

          return value?.toString() || '—';
        });
        row.push('');

        return row;
      });

      // Combina tudo
      const worksheetData = [
        ...header,
        columnHeaders,
        ...dataRows,
      ];

      // Cria a planilha
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Configurações de largura das colunas
      const colWidths = selectedFilters.map((key: string) => {
        if (key === 'code') return { wch: 12 };
        if (key === 'name' || key === 'description') return { wch: 30 };
        if (key === 'location') return { wch: 15 };
        if (key === 'orderNumber') return { wch: 12 };
        return { wch: 15 };
      });
      colWidths.push({ wch: 10 }); // Coluna conferido
      worksheet['!cols'] = colWidths;

      // Mescla células do título
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: columnHeaders.length - 1 } }, // Título
        { s: { r: 1, c: 0 }, e: { r: 1, c: columnHeaders.length - 1 } }, // Data
        { s: { r: 2, c: 0 }, e: { r: 2, c: columnHeaders.length - 1 } }, // Total
      ];

      // Estiliza o cabeçalho (primeira linha)
      const titleCell = 'A1';
      if (!worksheet[titleCell]) worksheet[titleCell] = {};
      worksheet[titleCell].s = {
        font: { bold: true, sz: 16 },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: '1E293B' } },
      };

      // Cria o workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');

      // Nome do arquivo
      const fileName = report?.reportType === 'inventory'
        ? `Inventario_${reportDate.replace(/\//g, '-')}.xlsx`
        : `Expedicao_${reportDate.replace(/\//g, '-')}.xlsx`;

      // Salva o arquivo
      XLSX.writeFile(workbook, fileName);

      setIsMenuOpen(false);
    } catch (error) {
      console.error('❌ Erro ao exportar Excel:', error);
      alert('Erro ao exportar para Excel. Tente novamente.');
    }
  };


  useEffect(() => {
    const loadPDF = async () => {
      if (documentType !== "nfe_pdf") return;

      if (!product?.nfeId) {
        setPdfError("ID da NF-e não encontrado");
        setLoadingPdf(false);
        return;
      }

      try {
        setLoadingPdf(true);
        setPdfError(null);
        const url = await handleNfeById(product.nfeId);
        setPdfUrl(url);
      } catch (err) {
        console.error("Erro ao carregar PDF:", err);
        setPdfError("Erro ao carregar o PDF da NF-e");
      } finally {
        setLoadingPdf(false);
      }
    };

    loadPDF();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [documentType, product?.nfeId]);

  const hasProcessed = useRef(false);
  const hasAskedQuantity = useRef(false);

  useEffect(() => {
    if (hasProcessed.current || documentType !== "label_70x30") {
      return;
    }
    hasProcessed.current = true;

    if (!product?.orderItems) {

      const originalQuantity = product?.quantity || 1;
      setProcessedItems([{ ...product, finalQuantity: originalQuantity }]);
    } else {
      const items = product.orderItems.map((item: any) => ({
        ...item,
        finalQuantity: item.quantity || 1
      }));
      setProcessedItems(items);
    }
  }, [documentType]);

  useEffect(() => {
    const askForQuantities = async () => {
      if (
        hasAskedQuantity.current ||
        documentType !== "label_70x30" ||
        processedItems.length === 0
      ) {
        return;
      }
      hasAskedQuantity.current = true;

      await new Promise(resolve => setTimeout(resolve, 300));

      if (!product?.orderItems) {
        const item = processedItems[0];
        const originalQuantity = item.finalQuantity;

        if (originalQuantity > 10) {
          const confirmedQuantity = await confirmQuantity(product, originalQuantity);

          if (confirmedQuantity > 0 && confirmedQuantity !== originalQuantity) {
            setProcessedItems([{ ...item, finalQuantity: confirmedQuantity }]);
          }
        }
      } else {
        const updatedItems = [];
        let hasChanges = false;

        for (const item of processedItems) {
          const originalQuantity = item.finalQuantity;

          if (originalQuantity > 10) {
            const confirmedQuantity = await confirmQuantity(item, originalQuantity);

            if (confirmedQuantity > 0) {
              updatedItems.push({ ...item, finalQuantity: confirmedQuantity });
              if (confirmedQuantity !== originalQuantity) {
                hasChanges = true;
              }
            }
          } else {
            updatedItems.push(item);
          }
        }
        if (hasChanges && updatedItems.length > 0) {
          setProcessedItems(updatedItems);
        }
      }
    };

    askForQuantities();
  }, [processedItems.length]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handlePrint = async () => {
    if (!order && !product && !report) {
      Swal.fire("Atenção","Nenhum documento disponível para imprimir.", "warning");
      return;
    }

    if (documentType === "label_70x30") {
      await handlePrepareLabels();
      return;
    }

    window.print();
  };

  const handlePrepareLabels = async () => {
    if (processedItems.length > 0) {
      window.print();
      return;
    }

    if (!product?.orderItems) {
      const quantity = await confirmQuantity(product, product?.quantity || 1);
      if (quantity === 0) {
        Swal.fire('Cancelado', 'Impressão cancelada', 'info');
        return;
      }
      product.quantity = quantity;
      window.print();
      return;
    }

    const items = product.orderItems || [];
    const confirmedItems = [];

    for (const item of items) {
      const originalQuantity = item.quantity || 1;
      const confirmedQuantity = await confirmQuantity(item, originalQuantity);

      if (confirmedQuantity > 0) {
        confirmedItems.push({
          ...item,
          finalQuantity: confirmedQuantity
        });
      }
    }

    if (confirmedItems.length === 0) {
      Swal.fire('Cancelado', 'Nenhuma etiqueta selecionada', 'info');
      return;
    }

    setProcessedItems(confirmedItems);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleGeneratePDF = async () => {
    if (!order && !product && !report) {
      Swal.fire("Atenção", "Nenhum documento disponível para gerar PDF.", "warning");
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

      if (documentType === "separation_list" ||
        documentType === "purchase_order" ||
        documentType === "render_os_print_sheet" ||
        documentType === "render_report_print_sheet" ||
        documentType === "relatorio_expedicao" ||
        documentType === "relatorio_inventario") {
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

      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => requestAnimationFrame(resolve));

      // 🔹 CORREÇÃO: Lógica de filename corrigida
      let filename = `documento_${Date.now()}.pdf`;

      if (documentType.includes("label")) {
        filename = `etiqueta_${product?.productcode || "produto"}.pdf`;
      } else if (documentType === "separation_list") {
        filename = `lista_separacao_${order?.orderNumber || order?.id}.pdf`;
      } else if (documentType === "render_report_print_sheet") {
        if (report?.reportType === 'shipping_report') {
          filename = `relatorio_expedicao_${report?.selectedDate || Date.now()}.pdf`;
        } else {
          filename = `Relatorio_${report?.reportSelected || report?.id}.pdf`;
        }
      } else if (documentType === "render_os_print_sheet") {
        filename = `OS_${order?.ordernumber || order?.id}.pdf`;
      } else {
        filename = `pedido_${order?.ordernumber || order?.id}.pdf`;
      }

      const opt = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: filename, // ✅ Agora é sempre string
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

  const confirmQuantity = async (item: any, originalQuantity: number): Promise<number> => {
    if (originalQuantity <= 10) {
      console.log(originalQuantity)
      return originalQuantity;
    }

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

  const renderNFePDF = () => {
    if (loadingPdf) {
      return (
        <div className="flex items-center justify-center w-[210mm] min-h-[297mm] bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando PDF da NF-e...</p>
          </div>
        </div>
      );
    }

    if (pdfError) {
      return (
        <div className="flex items-center justify-center w-[210mm] min-h-[297mm] bg-white">
          <div className="text-center text-red-600">
            <X className="w-12 h-12 mx-auto mb-4" />
            <p className="font-semibold">{pdfError}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
            >
              Fechar
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col print-area print:scale-100 scale-[0.8] bg-white w-[210mm] min-h-[297mm] rounded-sm border border-gray-200">
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            className="w-full h-[297mm]"
            title="DANFE NF-e"
            style={{
              border: 'none',
              minHeight: '297mm'
            }}
          />
        )}
      </div>
    );
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
            width: '78mm',
            height: '36mm',
            padding: '4mm',
            boxShadow: "0 0",
            borderRadius: "4px",
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
              <div className="inline-flex items-center w-[60px] justify-end">
                <div className="text-sm font-bold px-2 w-full py-1 bg-gray-100 whitespace-nowrap">
                  {item?.productlocation || 'A-01'}
                </div>
              </div>
            </div>
          </div>
        </div>
      ));
    };

    if (processedItems.length === 0) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Processando etiquetas...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        {processedItems.map((item: any) => {
          const quantity = item.finalQuantity || item.quantity || 1;

          return (
            <div key={item.productcode || 'single'} className="flex flex-col items-center">
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
                <div className="text-center pb-2 mt-10 mb-1">
                  <div className="font-bold text-1xl">
                    PEDIDO {product.orderNumber}
                  </div>
                </div>

                <div className="text-center pb-1 mb-1">
                  <div className="font-semibold text-base">{product.customerName}</div>
                </div>

                <div className="flex flex-col text-center gap-1 pb-1 mb-1">
                  <div className="font-bold text-sm text-gray-600">ENDEREÇO DE ENTREGA:</div>
                  <div className="text-sm">
                    {product.shippingAddress} - {product.shippingCity} <br />
                    CEP: {product.shippingZip}
                  </div>
                </div>

                <div className="flex-1 flex flex-col space-y-2 text-sm">
                  <div className="flex gap-4 self-center p-1">
                    <span className="font-bold">TRANSP: </span>
                    {product.carrier.toUpperCase()}
                    <span className="inline-block flex-1 ml-2" style={{ width: "50%" }}>
                      &nbsp;
                    </span>
                  </div>
                </div>

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
    <div className="flex flex-col print-area print-area print:scale-100 scale-[0.8] bg-white w-[210mm] min-h-[297mm] p-12 rounded-sm border border-gray-200">
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

      {order?.notes && (
        <div className="border border-amber-200 rounded p-3 mb-4 bg-amber-50 text-xs">
          <p className="text-amber-700 font-semibold mb-1">Observações</p>
          <p className="text-amber-800">{order.notes}</p>
        </div>
      )}

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

      <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-2">
        <p>Vendas {company?.name} • {company?.email}</p>
        <p className="text-xs">Documento gerado em {new Date().toLocaleDateString()} • Konéxus</p>
      </div>
    </div>
  );

  const renderOSPrintSheet = () => (
    <div className="flex flex-col print-area print:scale-100 scale-[0.8] bg-white w-[210mm] min-h-[297mm] p-12 rounded-sm border border-gray-200">
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

        <div className="text-center w-[6vw]">
          <div className="bg-gray-50 h-[6vh] p-2 rounded border border-gray-200">
            <p className="text-xs text-gray-500 uppercase">OS Nº</p>
            <p className="text-xs font-bold text-gray-900 mt-0.5">
              {order?.ordernumber}
            </p>
          </div>
        </div>
      </div>

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

      <div className="flex self-left px-2 py-1 bg-gray-50 mb-2">
        <h2 className="text-lg font-medium">OBS: {order.stock_movement === true ? "Movimentação de Estoque" : "Não Movimenta Estoque"}{order.movement_type ? `, Tipo: ${order.movement_type}` : ""}</h2>
      </div>

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

      {order?.notes && (
        <div className="border border-amber-200 rounded p-3 mb-4 bg-amber-50 text-xs">
          <p className="text-amber-700 font-semibold mb-1">Observações</p>
          <p className="text-amber-800">{order.notes}</p>
        </div>
      )}

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

  const renderReportsPrintSheet = () => (
    <div className="flex flex-col print-area print:scale-100 scale-[0.8] bg-white w-[210mm] min-h-[297mm] p-12 rounded-sm border border-gray-200">
      <div className="flex justify-between items-start mb-2 -mt-2 pb-3 border-b border-gray-100">
        <div className="flex items-start gap-2">
          <div className="w-12 h-12 flex items-center justify-center">
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">
              {company?.name || "Empresa"} - Relatorio personalizado
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {company?.email || "guimansystem.comercial@gmail.com"}
            </p>
          </div>
        </div>

        <div className="text-center w-[6vw]">
          <div className="bg-gray-50 h-[6vh] p-2 rounded border border-gray-200">
            <p className="text-xs text-gray-500 uppercase">Relatorio</p>
            <p className="text-xs font-bold text-gray-900 mt-0.5">
              {report?.selectedId}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-row justify-between border border-gray-200 rounded px-2 py-2 gap-4 mb-4 text-xs">
        <div className="text-center">
          <h3 className="font-bold mb-1 text-black">Criada em</h3>
          <p className="text-black font-medium">
            {report?.date
              ? new Date(order.orderdate).toLocaleDateString()
              : "—"}
          </p>
        </div>
      </div>
      <div className="border border-gray-200 rounded mb-4 print-break">
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
            {report?.reportitems?.map((item: any, i: number) => (
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
                <td className="p-2 text-gray-800">{item.productname || "—"}</td>
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

  const renderShippingReport = () => (
    <div className="flex flex-col relative print-area print:scale-100 scale-[0.8] bg-white w-[210mm] min-h-[297mm] p-12 rounded-sm border border-gray-200">
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
              {company?.name || "Empresa"} - Relatório de expedição
            </h1>
            <p className="text-xs text-gray-600 font-medium">
              Itens Expedidos por Data
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {company?.email || "konexuserp@comercial.com"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-row justify-between border border-gray-200 rounded px-2 py-2 gap-4 mb-4 text-xs">
        <div className="text-center">
          <h3 className="font-bold mb-1 text-black">Data de Expedição</h3>
          <p className="text-black font-medium">
            {report?.selectedDate
              ? new Date(report.selectedDate).toLocaleDateString('pt-BR')
              : "—"}
          </p>
        </div>

        <div className="text-center">
          <h3 className="font-bold mb-1 text-black">Total de Itens</h3>
          <p className="text-black font-medium">
            {report?.reportitems?.length || 0} produtos
          </p>
        </div>

        <div className="text-center">
          <h3 className="font-bold mb-1 text-black">Total de Unidades</h3>
          <p className="text-black font-medium">
            {report?.reportitems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0} un
          </p>
        </div>

        <div className="text-center">
          <h3 className="font-bold mb-1 text-black">Gerado em</h3>
          <p className="text-black font-medium">
            {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      <div className="border border-gray-200 rounded mb-4 print-break">
        <div className="bg-gray-200 px-3 py-2 flex justify-center">
          <h3 className="text-black font-semibold text-xs flex items-center gap-1">
            <Package className="w-3 h-3" />
            Contagem diaria
          </h3>
        </div>

        <table className="w-full print-table text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-2 text-left font-semibold text-gray-700 w-20">Código</th>
              <th className="p-2 text-left font-semibold text-gray-700">Produto</th>
              <th className="p-2 text-left font-semibold text-gray-700">Marca</th>
              <th className="p-2 text-center font-semibold text-gray-700 w-20">Qtd</th>
              <th className="p-2 text-center font-semibold text-gray-700 w-24">Localização</th>
              <th className="p-2 text-center font-semibold text-gray-700 w-24">Pedido</th>
            </tr>
          </thead>
          <tbody>
            {!report?.reportitems || report.reportitems.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  Nenhum item encontrado
                </td>
              </tr>
            ) : (
              report.reportitems.map((item: any, i: number) => (
                <tr
                  key={i}
                  className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                >
                  <td className="p-2 text-gray-800 font-mono">{item.code || "—"}</td>
                  <td className="p-2 text-gray-800">{item.name || "—"}</td>
                  <td className="p-2 text-gray-800">{item.brand || "—"}</td>
                  <td className="p-2 text-center">
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                      {item.quantity || 0}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${item.location && item.location !== "Não definido"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                      }`}>
                      {item.location || "—"}
                    </span>
                  </td>
                  <td className="p-2 text-center text-gray-700 font-medium">
                    {item.orderNumber || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-center absolute bottom-8 flex flex-col self-center text-xs text-gray-500 border-t border-gray-200 pt-2">
        <p>
          {company?.name} • {company?.email}
        </p>
        <p className="text-xs">
          Documento gerado em {new Date().toLocaleDateString()} • Konéxus
        </p>
      </div>
    </div>
  );

  const renderInventoryReport = () => {
    // Pega os filtros selecionados do report
    const selectedFilters = report?.selectedFilters || ['code', 'name', 'location', 'stock'];
    const allFilters = report?.allFilters || [
      { key: 'code', label: 'Código' },
      { key: 'name', label: 'Nome' },
      { key: 'description', label: 'Descrição' },
      { key: 'brand', label: 'Marca' },
      { key: 'category', label: 'Categoria' },
      { key: 'location', label: 'Localização' },
      { key: 'stock', label: 'Estoque Atual' },
      { key: 'minimum_stock', label: 'Estoque Mínimo' },
    ];

    // Função para formatar valores
    const formatValue = (key: string, value: any) => {
      if (key === 'stock' || key === 'minimum_stock') {
        return `${value || 0} un`;
      }
      return value?.toString() || '—';
    };

    // Calcula total de estoque
    const totalStock = report?.reportitems?.reduce((sum: number, item: any) =>
      sum + (parseInt(item.stock) || 0), 0) || 0;

    return (
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
                {company?.name || "Empresa"} - Relatório de Inventário
              </h1>
              <p className="text-xs text-gray-600 font-medium">
                Contagem de Estoque
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {company?.email || "konexuserp@comercial.com"}
              </p>
            </div>
          </div>

          <div className="text-center w-[8vw]">
            <div className="bg-gray-50 h-[6vh] p-2 rounded border border-gray-200">
              <p className="text-xs text-gray-500 uppercase">Data</p>
              <p className="text-xs font-bold text-gray-900 mt-0.5">
                {report?.selectedDate ? new Date(report.selectedDate).toLocaleDateString('pt-BR') : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="flex flex-row justify-between border border-gray-200 rounded px-2 py-2 gap-4 mb-4 text-xs">
          <div className="text-center">
            <h3 className="font-bold mb-1 text-black">Data do Inventário</h3>
            <p className="text-black font-medium">
              {report?.selectedDate
                ? new Date(report.selectedDate).toLocaleDateString('pt-BR')
                : "—"}
            </p>
          </div>

          <div className="text-center">
            <h3 className="font-bold mb-1 text-black">Total de Produtos</h3>
            <p className="text-black font-medium">
              {report?.reportitems?.length || 0} itens
            </p>
          </div>

          <div className="text-center">
            <h3 className="font-bold mb-1 text-black">Total em Estoque</h3>
            <p className="text-black font-medium">
              {totalStock} un
            </p>
          </div>

          <div className="text-center">
            <h3 className="font-bold mb-1 text-black">Gerado em</h3>
            <p className="text-black font-medium">
              {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Tabela de Produtos - DINÂMICA */}
        <div className="border relative border-gray-200 rounded mb-4 print-break">
          <table className="w-full print-table text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {/* Renderiza colunas dinamicamente baseado nos filtros selecionados */}
                {selectedFilters.map((filterKey: string) => {
                  const filter = allFilters.find((f: any) => f.key === filterKey);
                  return (
                    <th key={filterKey} className="p-2 text-left font-semibold text-gray-700">
                      {filter?.label || filterKey}
                    </th>
                  );
                })}
                {/* Coluna de conferência sempre presente */}
                <th className="p-2 text-center font-semibold text-gray-700 w-16">
                  Conferido
                </th>
              </tr>
            </thead>
            <tbody>
              {!report?.reportitems || report.reportitems.length === 0 ? (
                <tr>
                  <td colSpan={selectedFilters.length + 1} className="p-4 text-center text-gray-500">
                    Nenhum item encontrado
                  </td>
                </tr>
              ) : (
                report.reportitems.map((item: any, i: number) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                  >
                    {/* Renderiza células dinamicamente baseado nos filtros */}
                    {selectedFilters.map((filterKey: string) => {
                      const value = item[filterKey];
                      const isStockField = filterKey === 'stock' || filterKey === 'minimum_stock';
                      const isLocationField = filterKey === 'location';

                      return (
                        <td key={filterKey} className="p-2 text-gray-800">
                          {isStockField ? (
                            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                              {formatValue(filterKey, value)}
                            </span>
                          ) : isLocationField ? (
                            <span className={`inline-block px-2 py-0.5 rounded text-xs ${value && value !== "Não definido"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                              }`}>
                              {value || "—"}
                            </span>
                          ) : filterKey === 'code' ? (
                            <span className="font-mono">{value || "—"}</span>
                          ) : (
                            formatValue(filterKey, value)
                          )}
                        </td>
                      );
                    })}
                    {/* Coluna de checkbox */}
                    <td className="p-2 text-center">
                      <div className="w-4 h-4 border-2 border-gray-400 rounded mx-auto"></div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé */}
        <div className="text-center flex flex-col self-center absolute bottom-8 text-xs text-gray-500 border-t border-gray-200 pt-2">
          <p>
            {company?.name} • {company?.email}
          </p>
          <p className="text-xs">
            Konéxus
          </p>
        </div>
      </div>
    );
  };

  const getPageSize = () => {
    if (documentType === "label_70x30") return "size: 70mm 30mm;";
    if (documentType === "label_100x100") return "size: 100mm 100mm;";
    if (documentType === "separation_list") return "size: A4; margin: 25mm;";
    if (documentType === "render_os_print_sheet") return "size: A4; margin: 25mm;";
    if (documentType === "render_report_print_sheet") return "size: A4; margin: 25mm;"
    if (documentType === "relatorio_expedicao") return "size: A4; margin: 25mm;"
    if (documentType === "relatorio_inventario") return "size: A4; margin: 25mm;"
    if (documentType === "nfe_pdf") return "size: A4;";
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

      <div className="fixed inset-0 z-50 bg-gray-300 flex h-full flex-col">
        <header className="no-print flex justify-between items-center h-12 w-full px-7 bg-slate-800 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-slate-700 rounded-lg flex items-center justify-center">
              {documentType === "purchase_order" && <FileText className="text-white" size={14} />}
              {documentType.includes("label") && <Package className="text-white" size={14} />}
              {documentType === "separation_list" && <CheckSquare className="text-white" size={14} />}
              {documentType === "render_os_print_sheet" && <Wrench className="text-white" size={14} />}
              {documentType === "nfe_pdf" && <FileText className="text-white" size={14} />}
              {documentType === "render_report_print_sheet" && <FileText className="text-white" size={14} />}
              {documentType === "relatorio_expedicao" && <FileText className="text-white" size={14} />}
              {documentType === "relatorio_inventario" && <FileText className="text-white" size={14} />}
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">
                {documentType === "purchase_order" && "Pedido de Compra"}
                {documentType === "separation_list" && "Lista de Separação"}
                {documentType === "render_os_print_sheet" && "Ordens de Serviço"}
                {documentType === "render_report_print_sheet" && "Relatorios Personalizados"}
                {documentType === "relatorio_expedicao" && "Relatorio por data"}
                {documentType === "relatorio_inventario" && "Relatorio Inventario"}
                {documentType === "nfe_pdf" && "DANFE NF-e"}
                {documentType.includes("label") && "Etiquetas"}
              </h1>
              <p className="text-slate-300 text-sm">
                {documentType.includes("label")
                  ? product?.productcode
                  : documentType === "nfe_pdf"
                    ? `NF-e ID: ${product?.nfeId || "---"}`
                    : order?.orderNumber || order?.ordernumber}
              </p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={toggleMenu}
              className="p-1 w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-all duration-200 hover:rotate-90"
              title="Opções"
            >
              <Settings size={14} />
            </button>

            <div className={`
              fixed top-0 right-0 h-full bg-slate-800 shadow-2xl transition-transform duration-300 z-50
              ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
            `} style={{ width: '280px' }}>

              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 className="text-white font-semibold text-lg">Opções</h2>
                <button
                  onClick={toggleMenu}
                  className="p-2 rounded-lg hover:bg-slate-700 text-white transition"
                >
                  <ChevronLeft size={14} />
                </button>
              </div>

              <div className="p-6 space-y-4">
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
                      disabled
                      title="Função indisponivel. Use a impressão direta!"
                    >
                      <FileText size={14} />
                      <span>Gerar PDF</span>
                    </button>

                    {/* NOVO: Exportar para Excel */}
                    <button
                      onClick={handleExportExcel}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white transition"
                    >
                      <FileSpreadsheet size={14} />
                      <span>Exportar para Excel</span>
                    </button>

                    <button
                      onClick={handleDownload}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
                      disabled
                      title="Função indisponivel"
                    >
                      <Download size={14} />
                      <span>Exportar JSON</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-slate-400 text-sm font-medium mb-3 uppercase tracking-wider">
                    Configurações
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
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

                <div>
                  <h3 className="text-slate-400 text-sm font-medium mb-3 uppercase tracking-wider">
                    Sistema
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
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

            {isMenuOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={toggleMenu}
              />
            )}
          </div>
        </header>

        <main className="flex justify-center m-auto items-center overflow-hidden">
          <div
            id="printable-content"
            className={
              documentType.includes('label') ? '' :
                documentType === "separation_list" || documentType === "nfe_pdf" ? 'w-[210mm] min-h-[297mm]' : 'origin-top'
            }
          >
            {documentType === "label_70x30" && renderLabel70x30()}
            {documentType === "label_100x100" && renderLabel100x100()}
            {documentType === "purchase_order" && renderPurchaseOrder()}
            {documentType === "separation_list" && renderSeparationList()}
            {documentType === "render_os_print_sheet" && renderOSPrintSheet()}
            {documentType === "render_report_print_sheet" && renderReportsPrintSheet()}
            {documentType === "relatorio_expedicao" && renderShippingReport()}
            {documentType === "relatorio_inventario" && renderInventoryReport()}
            {documentType === "nfe_pdf" && renderNFePDF()}
          </div>
        </main>
      </div>
    </>
  )
};

export default DocumentViewer;