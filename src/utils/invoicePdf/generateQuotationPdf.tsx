import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { PurchaseRequest } from '../../service/interfaces'; // Certifique-se de que os tipos aqui estejam corretos com sua base

// Interfaces para DANFE
interface Empresa {
  razaoSocial: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
  //telefone: string;
  cnpj: string;
  inscricaoEstadual: string;
}

interface Destinatario {
  nome: string;
  cnpjCpf: string;
  endereco: string;
  cidade: string;
  uf: string;
  numero: number
 // telefone: number
  inscricaoEstadual: string;
}

interface Totais {
  baseCalculoIcms: number;
  valorIcms: number;
  baseCalculoIcmsSt: number;
  valorIcmsSt: number;
  valorProdutos: number;
  valorFrete: number;
  valorSeguro: number;
  valorDesconto: number;
  valorDespesasAcessorias: number;
  valorTotalNota: number;
}

interface Item {
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  baseCalculoIcms: number;
  valorIcms: number;
}

export interface Nota {
  numero: string;
  serie: string;
  chaveAcesso: string;
  naturezaOperacao: string;
  protocolo: string;
  tipoOperacao: 'entrada' | 'saida';
  dataAutorizacao: string;
  dataEmissao: string;
  empresa: Empresa;
  destinatario: Destinatario;
  totais: Totais;
  itens: Item[];
  informacoesComplementares: string;
  observacoesFisco: string;
}

// Funções auxiliares
const formatCurrency = (value: number | undefined | null) =>
  (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

export const mapPurchaseRequestToNota = (purchaseRequest: PurchaseRequest): Nota => {
  const today = new Date().toISOString();

  const empresa: Empresa = {
    razaoSocial: "Sua Empresa S.A.",
    endereco: "Rua Exemplo, 123",
    cidade: "São Paulo",
    uf: "SP",
    cep: "00000-000",
    //telefone: "(11) 99999-9999",
    cnpj: "00.000.000/0001-00",
    inscricaoEstadual: "ISENTO",
  };

  const destinatario: Destinatario = {
    nome: purchaseRequest.companyData.company_name,
    cnpjCpf: purchaseRequest.companyData.cnpj,
    endereco: purchaseRequest.companyData.address.street,
    cidade: purchaseRequest.companyData.address.city,
    uf: purchaseRequest.companyData.address.state,
    numero: purchaseRequest.companyData.address.number,
    //telefone: purchaseRequest.companyData.phone,
    inscricaoEstadual: purchaseRequest.companyData.cnpj || "ISENTO",
  };

  const itens: Item[] = purchaseRequest.products.map((product) => ({
    codigo: product.code,
    descricao: product.product_name,
    ncm: "", // opcional
    cfop: "", // opcional
    unidade: "UN",
    quantidade: product.quantity,
    valorUnitario: product.price,
    valorTotal: product.price * product.quantity,
    baseCalculoIcms: 0,
    valorIcms: 0,
  }));

  const valorTotalProdutos = purchaseRequest.products.reduce(
    (acc, p) => acc + p.price * p.quantity,
    0
  );

  const totais: Totais = {
    baseCalculoIcms: 0,
    valorIcms: 0,
    baseCalculoIcmsSt: 0,
    valorIcmsSt: 0,
    valorProdutos: valorTotalProdutos,
    valorFrete: 0,
    valorSeguro: 0,
    valorDesconto: 0,
    valorDespesasAcessorias: 0,
    valorTotalNota: valorTotalProdutos,
  };

  return {
    numero: purchaseRequest.requestNumber,
    serie: "1",
    chaveAcesso: "",
    naturezaOperacao: "COMPRA PARA USO E CONSUMO",
    protocolo: "",
    tipoOperacao: 'entrada',
    dataAutorizacao: today,
    dataEmissao: purchaseRequest.requestDate,
    empresa,
    destinatario,
    totais,
    itens,
    informacoesComplementares: purchaseRequest.notes || "",
    observacoesFisco: "",
  };
};

// Geração do PDF da DANFE
export const generateQuotationPdf = async (quotation: PurchaseRequest): Promise<Blob> => {
  const notaData = mapPurchaseRequestToNota(quotation);
  const doc = new jsPDF();

  let y = 10;

  doc.setFontSize(16);
  doc.text("DANFE - Documento Auxiliar da Nota Fiscal Eletrônica", 105, y, { align: "center" });
  y += 10;

  doc.setFontSize(12);
  doc.text(`Nº: ${notaData.numero} Série: ${notaData.serie}`, 10, y);
  y += 10;

  doc.setFontSize(10);
  doc.text(`Empresa: ${notaData.empresa.razaoSocial}`, 10, y);
  y += 5;
  doc.text(`Endereço: ${notaData.empresa.endereco}, ${notaData.empresa.cidade} - ${notaData.empresa.uf}`, 10, y);
  y += 5;
  doc.text(`CNPJ: ${notaData.empresa.cnpj} Inscrição Estadual: ${notaData.empresa.inscricaoEstadual}`, 10, y);
  y += 10;

  doc.text(`Destinatário: ${notaData.destinatario.nome}`, 10, y);
  y += 5;
  doc.text(`Endereço: ${notaData.destinatario.endereco}, ${notaData.destinatario.cidade} - ${notaData.destinatario.uf}`, 10, y);
  y += 5;
  doc.text(`CNPJ/CPF: ${notaData.destinatario.cnpjCpf} Inscrição Estadual: ${notaData.destinatario.inscricaoEstadual}`, 10, y);
  y += 10;

  const headers = [["CÓD. PROD.", "DESCRIÇÃO", "QUANT.", "VALOR UNIT.", "VALOR TOTAL"]];
  const data = notaData.itens.map(item => [
    item.codigo || '',
    item.descricao,
    item.quantidade.toString(),
    formatCurrency(item.valorUnitario),
    formatCurrency(item.valorTotal),
  ]);

  autoTable(doc, {
    startY: y,
    head: headers,
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      1: { cellWidth: 80 },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
  });

  y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : y + 10;

  doc.setFontSize(10);
  doc.text(`Valor Total dos Produtos: ${formatCurrency(notaData.totais.valorProdutos)}`, 10, y);
  y += 5;
  doc.text(`Valor Total da Nota: ${formatCurrency(notaData.totais.valorTotalNota)}`, 10, y);
  y += 10;

  doc.text(`Informações Complementares: ${notaData.informacoesComplementares}`, 10, y);
  y += 5;
  doc.text(`Observações Fisco: ${notaData.observacoesFisco}`, 10, y);

  return doc.output('blob');
};
