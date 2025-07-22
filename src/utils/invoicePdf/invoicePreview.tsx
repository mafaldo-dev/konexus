import { useEffect, useState } from 'react';

import DanfeTemplate from '../invoicePdf/pdfGenerator';
import { PurchaseRequest } from '../../service/interfaces';

import { mapPurchaseRequestToNota, generateQuotationPdf, Nota } from '../invoicePdf/generateQuotationPdf';


interface Props {
  quotation: PurchaseRequest;
}

export default function NotaPreview({ quotation }: Props) {
  const [invoice, setInvoice] = useState<Nota | null>(null);

  
  useEffect(() => {
    if(!quotation) {
      setInvoice(null)
      return
    }
    const invoicePDF = mapPurchaseRequestToNota(quotation);
    setInvoice(invoicePDF);
  }, [quotation]);

  const handleDownload = async () => {
    const blob = await generateQuotationPdf(quotation);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nota-${quotation.requestNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!invoice) return <p>Carregando nota fiscal...</p>;

  return (
    <div className="bg-white p-4">
      <DanfeTemplate nota={invoice} onDownloadComplete={() => {}} />
      <div className="flex justify-end mt-4">
        <button
          onClick={handleDownload}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Baixar PDF
        </button>
      </div>
    </div>
  );
}
