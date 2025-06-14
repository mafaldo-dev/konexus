import React from 'react';
import Dashboard from '../../components/dashboard';

const NotaFiscal = ({ nota }: any) => {
  const handlePrint = () => window.print();

  return (
    <Dashboard>
    <div className="p-4 bg-white shadow rounded-xl text-sm">
      <h1 className="text-xl font-bold text-center mb-4">DANFE - Documento Auxiliar da Nota Fiscal Eletrônica</h1>

      {/* Cabeçalho */}
      <div className="grid grid-cols-3 gap-2 border p-2 mb-2">
        <div>
          <p><strong>Empresa:</strong> {nota?.empresa || 'Empresa Exemplo LTDA'}</p>
          <p><strong>CNPJ:</strong> {nota?.cnpj || '00.000.000/0000-00'}</p>
          <p><strong>Endereço:</strong> {nota?.endereco || 'Rua Exemplo, 123'}</p>
        </div>
        <div className="text-center">
          <p><strong>NFe Nº:</strong> {nota?.numero || '000175'}</p>
          <p><strong>Série:</strong> {nota?.serie || '1'}</p>
          <p><strong>Data de Emissão:</strong> {nota?.data || '08/06/2025'}</p>
        </div>
        <div className="text-right">
          <p><strong>Chave de Acesso:</strong></p>
          <p className="break-words">{nota?.chave || '43.0000.000.000.000000000000000000000000000000000000000'}</p>
        </div>
      </div>

      {/* Remetente/Destinatário */}
      <div className="border p-2 mb-2">
        <p className="font-bold mb-1">Destinatário/Remetente</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p><strong>Nome:</strong> {nota?.remetente?.nome || 'Fulano de Tal'}</p>
            <p><strong>Endereço:</strong> {nota?.remetente?.endereco || 'Rua dos Vinhedos, 386'}</p>
            <p><strong>Bairro:</strong> {nota?.remetente?.bairro || 'Vinhedos'}</p>
            <p><strong>Município:</strong> {nota?.remetente?.cidade || 'Bento Gonçalves'}</p>
          </div>
          <div>
            <p><strong>UF:</strong> {nota?.remetente?.uf || 'RS'}</p>
            <p><strong>CEP:</strong> {nota?.remetente?.cep || '95700-000'}</p>
            <p><strong>CNPJ:</strong> {nota?.remetente?.cnpj || '11.111.111/0001-11'}</p>
            <p><strong>IE:</strong> {nota?.remetente?.ie || '000000000'}</p>
          </div>
        </div>
      </div>

      {/* Produtos */}
      <div className="border p-2 mb-2">
        <p className="font-bold mb-2">Itens da Nota Fiscal</p>
        <table className="w-full table-auto border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2">Código</th>
              <th className="border px-2">Descrição</th>
              <th className="border px-2">Qtd</th>
              <th className="border px-2">UN</th>
              <th className="border px-2">Valor Unit.</th>
              <th className="border px-2">Valor Total</th>
            </tr>
          </thead>
          <tbody>
            {(nota?.produtos || [
              { codigo: 'P001', nome: 'Produto Exemplo 1', quantidade: 2, unidade: 'cx', valor: 45.00 },
              { codigo: 'P002', nome: 'Produto Exemplo 2', quantidade: 1, unidade: 'un', valor: 100.00 }
            ]).map((produto: any, i: number) => (
              <tr key={i}>
                <td className="border px-2">{produto.codigo}</td>
                <td className="border px-2">{produto.nome}</td>
                <td className="border px-2 text-center">{produto.quantidade}</td>
                <td className="border px-2 text-center">{produto.unidade}</td>
                <td className="border px-2 text-right">R$ {produto.valor.toFixed(2)}</td>
                <td className="border px-2 text-right">R$ {(produto.quantidade * produto.valor).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botões */}
      <div className="flex gap-2 mt-4 justify-end print:hidden">
        <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Imprimir</button>
        <button onClick={() => alert('Gerar PDF')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Gerar PDF</button>
        <button onClick={() => alert('Baixar PDF')} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Baixar</button>
      </div>
    </div>
    </Dashboard>
  );
};

export default NotaFiscal;
