import React, { ReactNode } from 'react';
import { format } from 'date-fns';
import { Nota } from './generateQuotationPdf';

// Logo base64 placeholder
const nfeLogoBase64 = 'data:image/png;base64,...'; // Use o base64 real da sua logo

// Interfaces e helpers continuam iguais (Cell, Row, formatCurrency, etc)
interface CellProps {
  label: string;
  children?: ReactNode;
  colSpan?: number;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

const Cell = ({
  label,
  children,
  colSpan = 1,
  className = '',
  labelClassName = '',
  valueClassName = '',
}: CellProps) => (
  <td colSpan={colSpan} className={`border border-black p-1 text-[9px] align-top ${className}`}>
    <div className={`text-gray-700 uppercase font-semibold text-[7px] ${labelClassName}`}>{label}</div>
    <div className={`text-black font-normal text-[9px] mt-0.5 ${valueClassName}`}>{children || ' '}</div>
  </td>
);

interface RowProps {
  children: ReactNode;
}

const Row = ({ children }: RowProps) => <tr className="align-top">{children}</tr>;

const formatCurrency = (value: number | undefined | null) =>
  (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const formatDateSimple = (dateString?: string) =>
  dateString ? format(new Date(dateString), 'dd/MM/yyyy') : '';

const formatDateTimeSimple = (dateTimeString?: string) =>
  dateTimeString ? format(new Date(dateTimeString), 'dd/MM/yyyy HH:mm:ss') : '';


interface DanfeTemplateProps {
  nota: Nota;
  onDownloadComplete: () => void;
}

export default function DanfeTemplate({ nota, onDownloadComplete }: DanfeTemplateProps) {
  if (!nota) return null;

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
      size: A4;
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
      border: 2px solid black; /* borda total do documento */
      box-sizing: border-box;
      padding: 12px;
      background-color: white;
    }
    .no-print {
      display: none !important;
    }
    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start; /* alinhamento topo */
      border-bottom: 2px solid black; /* borda separando header dos itens */
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .print-header-left {
      border-right: 2px solid black; /* borda separando as duas colunas do header */
      padding-right: 16px;
      flex: 1;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .print-header-logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
    }
    .print-header-info {
      font-size: 10px;
      line-height: 1.2;
    }
    .print-header-info p {
      margin: 2px 0;
    }
    .print-header-right {
      flex: 1;
      padding-left: 16px;
      text-align: center;
      font-family: Arial, sans-serif;
    }
    .print-header-right p {
      margin: 4px 0;
    }
    .print-header-right .danfe-title {
      font-weight: 700;
      font-size: 32px;
      margin-bottom: 4px;
    }
    .print-header-right .danfe-subtitle {
      font-size: 12px;
      margin-bottom: 12px;
    }
    .print-header-right .danfe-number {
      font-weight: 700;
      font-size: 18px;
    }

    .danfe-header-container {
        display: flex;
        flex-content: space-between;
        border: 1px solid black;
        padding: 8px;
        font-size: 10px;
        line-height: 1.2;
        font-family: sans-serif;
    }

    .danfe-header-top {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .danfe-recebeu {
      flex: 1;
      padding: 8px;
      > p {
        color: gray;
      }
    }

    .danfe-nfe {
      width: 12rem; /* 48 Tailwind */
      border: 1px solid black;
      padding: 8px;
      text-align: center;
      font-weight: 700;
      font-size: 14px;
    }

    .danfe-header-bottom {
      display: flex;
      gap: 16px;
    }

    .danfe-data-recebimento,
    .danfe-assinatura {
      flex: 1;
      border: 1px solid black;
      padding: 8px;
      display: flex;
      flex-direction: column;
    }

    .danfe-data-recebimento label,
    .danfe-assinatura label {
      font-weight: 600;
      margin-bottom: 4px;
      text-transform: uppercase;
    }

    .danfe-data-recebimento input {
      border: 1px solid #cbd5e1; /* cor gray-400 */
      padding: 4px;
      text-align: center;
    }

    .danfe-assinatura .assinatura-box {
      margin-top: auto;
      height: 40px;
      border: 1px solid #cbd5e1;
    }

  }

        /* Estilos para tela também */
        .print-area {
          font-family: Arial, sans-serif;
          font-size: 12px;
          color: #000;
          background: #fff;
          padding: 16px;
          border: 1px solid #000;
          width: 210mm;
          min-height: 297mm;
        }
        .print-area p {
          margin: 4px 0;
        }
        .print-area .text-center {
          text-align: center;
        }
        .print-area .font-bold {
          font-weight: 700;
        }
        .print-area table {
          border-collapse: collapse;
          width: 100%;
          margin-top: 8px;
          margin-bottom: 16px;
        }
        .print-area table, .print-area th, .print-area td {
          border: 1px solid black;
        }
        .print-area th, .print-area td {
          padding: 6px;
          font-size: 10px;
          vertical-align: top;
        }
        .print-area thead {
          background-color: #f3f4f6;
          text-transform: uppercase;
          font-weight: 600;
        }
        .label-small {
          font-size: 7px;
          text-transform: uppercase;
          font-weight: 600;
          color: #555;
        }
      `}</style>

      <div className="no-print mb-6 flex justify-end">
        <button
          onClick={handlePrint}
          className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm"
        >
          Baixar DANFE
        </button>
      </div>

      <div className="print-area bg-white text-black">
        <div className="border border-black p-2"> {/* Borda geral em volta de tudo */}
          <div className="danfe-header-container" >
            <div className="danfe-header-top flex" style={{ display: 'flex', justifyContent: "space-around"}}>
              <div className="danfe-recebeu">
                <p className='text-gray-200' style={{ border: "1px, solid, gray", padding: 6, borderRadius: 2}}>RECEBEMOS DE <strong>{nota.empresa?.razaoSocial}</strong> OS PRODUTOS/SERVIÇOS CONSTANTES NA NOTA FISCAL INDICADA AO LADO</p>
              </div>
              <div className="danfe-nfe" style={{border: "1px, solid, gray", height: 70, borderRadius: 2, padding: 6, marginRight: 22 }}>
                <p>NF-e</p>
                <p>Nº: {nota.numero}</p>
                <p>SÉRIE: {nota.serie}</p>
              </div>
            </div>

            <div className="danfe-header-bottom">
              <div className="danfe-data-recebimento">
                <label>DATA DE RECEBIMENTO</label>
                <input type="text" defaultValue="xx/xx/xxxx" readOnly />
              </div>

              <div className="danfe-assinatura">
                <label>IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR</label>
                <div className="assinatura-box"></div>
              </div>
            </div>
          </div>


          {/* Header */}
          <div className="flex print-header">
            <div className="w-1/2 p-1 flex items-center gap-2">
              <img src={nfeLogoBase64} alt="NF-e Logo" className="w-16 h-16" />
              <div>
                <p className="font-bold text-sm">{nota.empresa?.razaoSocial}</p>
                <p>{nota.empresa?.endereco}</p>
                <p>
                  {nota.empresa?.cidade} - {nota.empresa?.uf} - CEP: {nota.empresa?.cep}
                </p>
                {/* <p>Tel/Fax: {nota.empresa?.telefone}</p> */}
                <p className="text-xs mt-1 font-semibold">CNPJ: {nota.empresa?.cnpj}</p>
                <p className="text-xs font-semibold">IE: {nota.empresa?.inscricaoEstadual}</p>
              </div>
            </div>
            <div className="w-1/2 border-l border-black p-1 flex flex-col justify-center items-center text-center">
              <p className="font-bold text-2xl">DANFE</p>
              <p className="text-sm">Documento Auxiliar da Nota Fiscal Eletrônica</p>
              <p className="mt-2">{nota.tipoOperacao === 'entrada' ? '0 - Entrada' : '1 - Saída'}</p>
              <p className="font-bold text-lg">Nº {nota.numero}</p>
              <p>SÉRIE: {nota.serie}</p>
            </div>
          </div>

          {/* Chave Acesso */}
          <div className="border-t border-black text-center p-1">
            <p className="text-[8px] text-left mb-0.5">CHAVE DE ACESSO</p>
            <p className="font-bold tracking-widest text-[9px]">
              {nota.chaveAcesso?.replace(/(\d{4})/g, '$1 ').trim()}
            </p>
            <p className="text-[8px] mt-1">
              Consulta de autenticidade no portal nacional da NF-e www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora
            </p>
          </div>

          {/* Natureza da operação */}
          <table className="w-full border-collapse border border-black mt-1 text-[9px]">
            <tbody>
              <Row>
                <Cell label="NATUREZA DA OPERAÇÃO" className="text-left font-semibold">
                  {nota.naturezaOperacao}
                </Cell>
                <Cell label="PROTOCOLO DE AUTORIZAÇÃO DE USO" className="text-left">
                  {nota.protocolo} - {formatDateTimeSimple(nota.dataAutorizacao)}
                </Cell>
              </Row>
              <Row>
                <Cell label="INSCRIÇÃO ESTADUAL">{nota.empresa?.inscricaoEstadual}</Cell>
                <Cell label="CNPJ">{nota.empresa?.cnpj}</Cell>
              </Row>
            </tbody>
          </table>

          {/* Destinatário / Remetente */}
          <p className="text-center font-bold mt-2 mb-1 text-[10px] uppercase">DESTINATÁRIO / REMETENTE</p>
          <table className="w-full border-collapse border border-black text-[9px]">
            <tbody>
              <Row>
                <Cell label="NOME/RAZÃO SOCIAL" colSpan={2} className="text-left font-semibold">
                  {nota.destinatario?.nome}
                </Cell>
                <Cell label="CNPJ/CPF">{nota.destinatario?.national_register_code}</Cell>
                <Cell label="DATA DA EMISSÃO">{formatDateSimple(nota.dataEmissao)}</Cell>
              </Row>
              <Row>
                <Cell label="ENDEREÇO" colSpan={2} className="text-left">
                  {nota.destinatario?.endereco}
                </Cell>
                <Cell label="BAIRRO/DISTRITO"></Cell>
                <Cell label="CEP">{nota.destinatario?.cidade}</Cell>
              </Row>
              <Row>
                <Cell label="MUNICÍPIO" colSpan={2} className="text-left">
                  {nota.destinatario?.cidade}
                </Cell>
                {/* <Cell label="FONE/FAX">{nota.destinatario?.telefone}</Cell> */}
                <Cell label="UF">{nota.destinatario?.uf}</Cell>
              </Row>
              <Row>
                <Cell label="INSCRIÇÃO ESTADUAL" colSpan={2} className="text-left">
                  {nota.destinatario?.inscricaoEstadual}
                </Cell>
                <Cell label="DATA SAÍDA/ENTRADA">{formatDateSimple(nota.dataEmissao)}</Cell>
                <Cell label="HORA DA SAÍDA">{format(new Date(nota.dataEmissao), 'HH:mm:ss')}</Cell>
              </Row>
            </tbody>
          </table>

          {/* Cálculo do imposto */}
          <p className="text-center font-bold mt-2 mb-1 text-[10px] uppercase">CÁLCULO DO IMPOSTO</p>
          <table className="w-full border-collapse border border-black text-[9px]">
            <tbody>
              <Row>
                <Cell label="BASE DE CÁLCULO DE ICMS">{formatCurrency(nota.totais?.baseCalculoIcms)}</Cell>
                <Cell label="VALOR DO ICMS">{formatCurrency(nota.totais?.valorIcms)}</Cell>
                <Cell label="BASE DE CÁLCULO ICMS ST">{formatCurrency(nota.totais?.baseCalculoIcmsSt)}</Cell>
                <Cell label="VALOR DO ICMS SUBSTITUIÇÃO">{formatCurrency(nota.totais?.valorIcmsSt)}</Cell>
                <Cell label="VALOR TOTAL DOS PRODUTOS">{formatCurrency(nota.totais?.valorProdutos)}</Cell>
              </Row>
              <Row>
                <Cell label="VALOR DO FRETE">{formatCurrency(nota.totais?.valorFrete)}</Cell>
                <Cell label="VALOR DO SEGURO">{formatCurrency(nota.totais?.valorSeguro)}</Cell>
                <Cell label="DESCONTO">{formatCurrency(nota.totais?.valorDesconto)}</Cell>
                <Cell label="OUTRAS DESPESAS ACESSÓRIAS">{formatCurrency(nota.totais?.valorDespesasAcessorias)}</Cell>
                <Cell label="VALOR TOTAL DA NOTA" valueClassName="font-bold text-sm">
                  {formatCurrency(nota.totais?.valorTotalNota)}
                </Cell>
              </Row>
            </tbody>
          </table>

          {/* Produtos */}
          <p className="text-center font-bold mt-2 mb-1 text-[10px] uppercase">DADOS DO(S) PRODUTO(S) / SERVIÇO(S)</p>
          <table className="w-full border-collapse border border-black text-center text-[9px]">
            <thead>
              <tr>
                <th className="border border-black p-1">CÓD. PROD.</th>
                <th className="border border-black p-1 text-left">DESCRIÇÃO DO PRODUTO/SERVIÇO</th>
                <th className="border border-black p-1">NCM/SH</th>
                <th className="border border-black p-1">CFOP</th>
                <th className="border border-black p-1">UNID.</th>
                <th className="border border-black p-1">QUANT.</th>
                <th className="border border-black p-1">VALOR UNIT.</th>
                <th className="border border-black p-1">VALOR TOTAL</th>
                <th className="border border-black p-1">B. CÁLC. ICMS</th>
                <th className="border border-black p-1">VALOR ICMS</th>
              </tr>
            </thead>
            <tbody>
              {nota.itens?.map((item, idx) => (
                <tr key={idx}>
                  <td className="border border-black p-1 text-[9px]">{item.codigo}</td>
                  <td className="border border-black p-1 text-left">{item.descricao}</td>
                  <td className="border border-black p-1">{item.ncm}</td>
                  <td className="border border-black p-1">{item.cfop}</td>
                  <td className="border border-black p-1">{item.unidade}</td>
                  <td className="border border-black p-1 text-right">{formatCurrency(item.quantidade)}</td>
                  <td className="border border-black p-1 text-right">{formatCurrency(item.valorUnitario)}</td>
                  <td className="border border-black p-1 text-right">{formatCurrency(item.valorTotal)}</td>
                  <td className="border border-black p-1 text-right">{formatCurrency(item.baseCalculoIcms)}</td>
                  <td className="border border-black p-1 text-right">{formatCurrency(item.valorIcms)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Dados adicionais */}
          <p className="text-center font-bold mt-2 mb-1 text-[10px] uppercase">DADOS ADICIONAIS</p>
          <div className="flex border border-black">
            <div className="w-2/3 p-2 text-[9px]">
              <p className="font-semibold uppercase mb-1">INFORMAÇÕES COMPLEMENTARES</p>
              <p>{nota.informacoesComplementares}</p>
            </div>
            <div className="w-1/3 border-l border-black p-2 text-[9px]">
              <p className="font-semibold uppercase mb-1">RESERVADO AO FISCO</p>
              <p>{nota.observacoesFisco}</p>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
