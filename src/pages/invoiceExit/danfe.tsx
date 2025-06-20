import React, { useState } from 'react';
import { InvoiceData } from '../../service/interfaces/invoiceExit';

export default function DANFE({ dados = {} }) {

    const [invoice, setInvoice] = useState<InvoiceData[]>([])

    const handleData = () => {
        setInvoice((prev) => ({
            ...prev,
            data: invoice
        }))
    }
    const actualDate = new Date().getUTCDate()


    return (
        <div className="max-w-5xl mx-auto bg-white p-4 font-mono">
            <div className="border-2 border-black">
                {/* Seção: Cabeçalho */}
                <div className="border-2 border-black">
                    <div className="border-b border-black p-1">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="border-r border-black pr-2">
                                <div className="font-bold">RECEBEMOS DE TECNOSPEED & TECNOLOGIA OS PRODUTOS/SERVIÇOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO</div>
                            </div>
                            <div className="border-r border-black px-2">
                                <div className="text-center">
                                    <div className="font-bold"></div>
                                    <div className="text-lg font-bold"></div>
                                    <div>SERIE: {"1"}</div>
                                </div>
                            </div>
                            <div className="px-2">
                                <div className="grid grid-cols-2 gap-1 text-xs">
                                    <div>DATA DE RECEBIMENTO: {actualDate}</div>
                                    <div>IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR:</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-2">
                        {invoice && invoice.length > 0 ? (
                            invoice.map((infos, index) => (
                                <>
                                    <div key={index} className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <div className="flex items-start gap-4">
                                                <div className="w-20 h-20 border border-gray-300 flex items-center justify-center bg-gray-50">
                                                    <div className="text-xs text-center">LOGO</div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-lg">{infos.enterprise.phantasyName}</div>
                                                    <div className="text-sm mt-1">
                                                        <div>{infos.enterprise.address}</div>
                                                        <div>{infos.enterprise.neighborhood} - {infos.enterprise.zip_code}</div>
                                                        <div>MUNICÍPIO: {infos.enterprise.city} - {infos.enterprise.dist}: SP - FONE/FAX: {infos.enterprise.phone}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-3 text-xs">
                                                <div className="font-bold">NATUREZA DA OPERAÇÃO:</div>
                                                <div>VENDA PARA CALDADORIA ADQ. DE TERCEIRO - PE E PJ NAO CON</div>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="border border-black p-2 mb-2">
                                                <div className="font-bold text-lg">DANFE</div>
                                                <div className="text-xs">DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA</div>
                                                <div className="text-xs mt-1">0 - ENTRADA</div>
                                                <div className="text-xs">1 - SAÍDA</div>
                                                <div className="text-2xl font-bold border border-black inline-block px-2 mt-1">1</div>
                                            </div>
                                            <div className="bg-black h-12 mb-1">
                                                <div className="text-white text-xs p-1">|||||||||||||||||||||||||||</div>
                                            </div>
                                            <div className="text-xs">
                                                <div>CHAVE DE ACESSO:</div>
                                                <div className="font-mono">3519 0916 5508 0006 5401 6403 5054 0434</div>
                                            </div>
                                        </div>
                                    </div>


                                    <div className="border-l-2 border-r-2 border-b-2 border-black">
                                        <div className="bg-gray-100 p-1 border-b border-black">
                                            <div className="font-bold text-xs">DESTINATÁRIO/REMETENTE</div>
                                        </div>
                                        <div className="p-2">
                                            <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                                                <div className="col-span-3">
                                                    <div className="font-bold">NOME/RAZÃO SOCIAL:</div>
                                                    <div>NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL</div>
                                                </div>
                                                <div>
                                                    <div className="font-bold">CNPJ/CPF:</div>
                                                    <div>{infos.recipient.r_cnpj}</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                                                <div className="col-span-2">
                                                    <div className="font-bold">ENDEREÇO:</div>
                                                    <div>{infos.recipient.r_Address}</div>
                                                </div>
                                                <div>
                                                    <div className="font-bold">BAIRRO/DISTRITO:</div>
                                                    <div>{infos.recipient.r_neighborhood}</div>
                                                </div>
                                                <div>
                                                    <div className="font-bold">CEP:</div>
                                                    <div>{infos.recipient.r_zip_code}</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2 text-xs">
                                                <div>
                                                    <div className="font-bold">MUNICÍPIO:</div>
                                                    <div>{infos.recipient.r_city}</div>
                                                </div>
                                                <div>
                                                    <div className="font-bold">FONE/FAX:</div>
                                                    <div>{infos.recipient.r_phone}</div>
                                                </div>
                                                <div>
                                                    <div className="font-bold">UF:</div>
                                                    <div>{infos.recipient.r_dist}</div>
                                                </div>
                                                <div>
                                                    <div className="font-bold">INSCRIÇÃO ESTADUAL:</div>
                                                    <div>ISENTO</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                                                <div>
                                                    <div className="font-bold">DATA DA EMISSÃO:</div>
                                                    <div>{infos.invoice.date}</div>
                                                </div>
                                                <div>
                                                    <div className="font-bold">DATA ENT./SAÍDA:</div>
                                                    <div>{infos.invoice.date}</div>
                                                </div>
                                                <div>
                                                    <div className="font-bold">HORA DA SAÍDA:</div>
                                                    <div>{actualDate}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </ >
                            ))) : ""}
                    </div>
                </div>

                {/* Seção: Fatura/Duplicata */}
                <div className="border-l-2 border-r-2 border-b-2 border-black">
                    <div className="bg-gray-100 p-1 border-b border-black">
                        <div className="font-bold text-xs">FATURA/DUPLICATA</div>
                    </div>
                    <div className="p-2">
                        <div className="grid grid-cols-8 gap-1 text-xs">
                            <div className="text-center"><div className="font-bold border-b border-gray-300 pb-1">NUM.</div><div className="py-1">001</div></div>
                            <div className="text-center"><div className="font-bold border-b border-gray-300 pb-1">VENC.</div><div className="py-1">09/08/2019</div></div>
                            <div className="text-center"><div className="font-bold border-b border-gray-300 pb-1">VALOR</div><div className="py-1">R$ 0,01</div></div>
                            <div className="text-center"><div className="font-bold border-b border-gray-300 pb-1">NUM.</div><div className="py-1">-</div></div>
                            <div className="text-center"><div className="font-bold border-b border-gray-300 pb-1">VENC.</div><div className="py-1">-</div></div>
                            <div className="text-center"><div className="font-bold border-b border-gray-300 pb-1">VALOR</div><div className="py-1">-</div></div>
                            <div className="text-center"><div className="font-bold border-b border-gray-300 pb-1">NUM.</div><div className="py-1">-</div></div>
                            <div className="text-center"><div className="font-bold border-b border-gray-300 pb-1">VALOR</div><div className="py-1">-</div></div>
                        </div>
                    </div>
                </div>

                {/* Seção: Cálculo do Imposto */}
                <div className="border-l-2 border-r-2 border-b-2 border-black">
                    <div className="bg-gray-100 p-1 border-b border-black">
                        <div className="font-bold text-xs">CÁLCULO DO IMPOSTO</div>
                    </div>
                    <div className="p-2">
                        <div className="grid grid-cols-6 gap-1 text-xs">
                            <div className="text-center"><div className="font-bold border-b border-gray-300 pb-1">BASE DE CÁLCULO DO ICMS</div><div className="py-1">0,00</div></div>
                            <div className="text-center"><div className="font-bold border-b border-gray-300 pb-1">VALOR DO ICMS</div><div className="py-1">0,00</div></div>
                            <div className="text-center"><div className="font-bold border-b border-gray-300 pb-1">BASE DE CÁLCULO ICMS S.T.</div><div className="py-1">0,00</div></div>
                            <div className="text-center"><div className="font-bold border-b border-gray-300 pb-1">VALOR ICMS SUBST.</div><div className="py-1">0,00</div></div>
                            <div className="text-center"><div className="font-bold border-b border-gray-300 pb-1">V. IMP. IMPORTAÇÃO</div><div className="py-1">0,00</div></div>
                            <div className="text-center"><div className="font-bold border-b border-gray-300 pb-1">V. TOTAL DOS PRODUTOS</div><div className="py-1">0,01</div></div>
                        </div>
                    </div>
                </div>

                {/* Seção: Transportador */}
                <div className="border-l-2 border-r-2 border-b-2 border-black">
                    <div className="bg-gray-100 p-1 border-b border-black">
                        <div className="font-bold text-xs">TRANSPORTADOR/VOLUMES TRANSPORTADOS</div>
                    </div>
                    <div className="p-2">
                        <div className="grid grid-cols-6 gap-2 text-xs mb-2">
                            <div><div className="font-bold">RAZÃO SOCIAL:</div><div>O - Sem</div></div>
                            <div><div className="font-bold">FRETE POR CONTA:</div><div>-</div></div>
                            <div><div className="font-bold">CÓDIGO ANTT:</div><div>-</div></div>
                            <div><div className="font-bold">PLACA DO VEÍCULO:</div><div>-</div></div>
                            <div><div className="font-bold">UF:</div><div>-</div></div>
                            <div><div className="font-bold">CNPJ/CPF:</div><div>-</div></div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                            <div><div className="font-bold">QUANTIDADE:</div><div>-</div></div>
                            <div><div className="font-bold">ESPÉCIE:</div><div>-</div></div>
                            <div><div className="font-bold">MARCA:</div><div>-</div></div>
                            <div><div className="font-bold">NUMERAÇÃO:</div><div>-</div></div>
                        </div>
                    </div>
                </div>

                {/* Seção: Produtos/Serviços */}
                <div className="border-l-2 border-r-2 border-b-2 border-black">
                    <div className="bg-gray-100 p-1 border-b border-black">
                        <div className="font-bold text-xs">DADOS DOS PRODUTOS/SERVIÇOS</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-gray-300 p-1 text-left">CÓDIGO</th>
                                    <th className="border border-gray-300 p-1 text-left">DESCRIÇÃO DO PRODUTO/SERVIÇO</th>
                                    <th className="border border-gray-300 p-1 text-center">NCM/SH</th>
                                    <th className="border border-gray-300 p-1 text-center">CST</th>
                                    <th className="border border-gray-300 p-1 text-center">CFOP</th>
                                    <th className="border border-gray-300 p-1 text-center">UN</th>
                                    <th className="border border-gray-300 p-1 text-center">QTDE</th>
                                    <th className="border border-gray-300 p-1 text-center">VL UNIT</th>
                                    <th className="border border-gray-300 p-1 text-center">VL TOTAL</th>
                                    <th className="border border-gray-300 p-1 text-center">BC ICMS</th>
                                    <th className="border border-gray-300 p-1 text-center">VL ICMS</th>
                                    <th className="border border-gray-300 p-1 text-center">VL IPI</th>
                                    <th className="border border-gray-300 p-1 text-center">% ICMS</th>
                                    <th className="border border-gray-300 p-1 text-center">% IPI</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-300 p-1">001</td>
                                    <td className="border border-gray-300 p-1">PRODUTO TESTE</td>
                                    <td className="border border-gray-300 p-1 text-center">12345678</td>
                                    <td className="border border-gray-300 p-1 text-center">102</td>
                                    <td className="border border-gray-300 p-1 text-center">5102</td>
                                    <td className="border border-gray-300 p-1 text-center">UN</td>
                                    <td className="border border-gray-300 p-1 text-center">1,00</td>
                                    <td className="border border-gray-300 p-1 text-center">0,01</td>
                                    <td className="border border-gray-300 p-1 text-center">0,01</td>
                                    <td className="border border-gray-300 p-1 text-center">0,00</td>
                                    <td className="border border-gray-300 p-1 text-center">0,00</td>
                                    <td className="border border-gray-300 p-1 text-center">0,00</td>
                                    <td className="border border-gray-300 p-1 text-center">0,00</td>
                                    <td className="border border-gray-300 p-1 text-center">0,00</td>
                                </tr>
                                {Array(10).fill(0).map((_, index) => (
                                    <tr key={index}>
                                        <td className="border border-gray-300 p-1 h-6">&nbsp;</td>
                                        <td className="border border-gray-300 p-1">&nbsp;</td>
                                        <td className="border border-gray-300 p-1">&nbsp;</td>
                                        <td className="border border-gray-300 p-1">&nbsp;</td>
                                        <td className="border border-gray-300 p-1">&nbsp;</td>
                                        <td className="border border-gray-300 p-1">&nbsp;</td>
                                        <td className="border border-gray-300 p-1">&nbsp;</td>
                                        <td className="border border-gray-300 p-1">&nbsp;</td>
                                        <td className="border border-gray-300 p-1">&nbsp;</td>
                                        <td className="border border-gray-300 p-1">&nbsp;</td>
                                        <td className="border border-gray-300 p-1">&nbsp;</td>
                                        <td className="border border-gray-300 p-1">&nbsp;</td>
                                        <td className="border border-gray-300 p-1">&nbsp;</td>
                                        <td className="border border-gray-300 p-1">&nbsp;</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Seção: Informações Adicionais */}
                <div className="border-l-2 border-r-2 border-b-2 border-black">
                    <div className="bg-gray-100 p-1 border-b border-black">
                        <div className="font-bold text-xs">DADOS ADICIONAIS</div>
                    </div>
                    <div className="grid grid-cols-2 h-32">
                        <div className="border-r border-black p-2">
                            <div className="font-bold text-xs mb-1">INFORMAÇÕES COMPLEMENTARES:</div>
                            <div className="text-xs">
                                <div>Esta nota fiscal foi emitida em ambiente</div>
                                <div>de homologação para testes do sistema.</div>
                            </div>
                        </div>
                        <div className="p-2">
                            <div className="font-bold text-xs mb-1">RESERVADO AO FISCO:</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center text-xs mt-4 text-gray-500">
                <div>DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA</div>
                <div>Gerado pelo sistema - Ambiente de homologação</div>
            </div>
        </div>
    );
}